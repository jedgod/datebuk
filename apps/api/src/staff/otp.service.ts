import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { hashSecret, verifySecret } from '../common/security/hash';
import { encryptSecret, decryptSecret } from '../common/security/crypto';
import { randomBytes } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

function generatePlaintextBackupCodes(count = 10): string[] {
  // crypto.randomBytes, not Math.random(): backup codes are bearer credentials that
  // bypass 2FA, so they need CSPRNG-grade unpredictability like any other secret.
  return Array.from({ length: count }, () => randomBytes(5).toString('hex').toUpperCase());
}

async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hashSecret(code)));
}

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  // ============ TOTP SETUP ============
  async generateTotpSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `DateBuk Staff (${email})`,
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Shown to the user once; only the hashed form (see enableTotp) is ever persisted.
    const backupCodes = generatePlaintextBackupCodes();

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
      manualEntry: secret.otpauth_url,
    };
  }

  async enableTotp(userId: string, secret: string, otpToken: string, backupCodes: string[]) {
    // Verify the OTP token
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otpToken,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid OTP token');
    }

    const hashedBackupCodes = await hashBackupCodes(backupCodes);
    // TOTP secrets must be encrypted, not hashed: unlike a password, the
    // server needs the raw secret back on every verify to compute the
    // expected code, so a one-way hash cannot be used here.
    const encryptedSecret = encryptSecret(secret);

    return this.prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: encryptedSecret,
        backupCodes: hashedBackupCodes,
        enabled: true,
        enabledAt: new Date(),
      },
      create: {
        userId,
        secret: encryptedSecret,
        backupCodes: hashedBackupCodes,
        method: 'TOTP',
        enabled: true,
        enabledAt: new Date(),
      },
    });
  }

  async disableTotp(userId: string) {
    return this.prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: false,
        secret: null,
        backupCodes: [],
      },
    });
  }

  // ============ OTP VERIFICATION ============
  async verifyOtp(userId: string, otpToken: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactor || !twoFactor.enabled || !twoFactor.secret) {
      return false;
    }

    let decryptedSecret: string;
    try {
      decryptedSecret = decryptSecret(twoFactor.secret);
    } catch {
      // Secret predates encryption (legacy plaintext row) or was corrupted —
      // fail closed rather than passing a garbled value to speakeasy.
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: otpToken,
      window: 2, // Allow 30 seconds before/after
    });

    if (isValid) {
      // Update last used time
      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });

      return true;
    }

    return false;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactor) return false;

    let matchedHash: string | null = null;
    for (const hash of twoFactor.backupCodes) {
      if (await verifySecret(code, hash)) {
        matchedHash = hash;
        break;
      }
    }
    if (!matchedHash) return false;

    // Remove used backup code
    const updatedCodes = twoFactor.backupCodes.filter((c) => c !== matchedHash);
    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: updatedCodes },
    });

    return true;
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    return !!twoFactor?.enabled;
  }

  // ============ RECOVERY ============
  async generateNewBackupCodes(userId: string) {
    const backupCodes = generatePlaintextBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: hashedBackupCodes },
    });

    // Return the plaintext codes so the caller can show them to the user once.
    return { backupCodes };
  }
}
