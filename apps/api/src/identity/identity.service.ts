import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes, randomInt } from "crypto";
import sharp from "sharp";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { Challenge, DEFAULT_FACE_THRESHOLD, decide } from "./decision";
import { IDENTITY_PROVIDER, type IdentityProvider } from "./providers/identity-provider";
import { E164, SmsService, type SmsDelivery } from "../sms/sms.service";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const MAX_SESSIONS_PER_DAY = 5;
const CHALLENGES: Challenge[] = ["TURN_HEAD", "SMILE"];

export type CaptureFiles = { idFront: Buffer; selfie: Buffer; selfieChallenge: Buffer };

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

@Injectable()
export class IdentityService {
  private readonly log = new Logger(IdentityService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private audit: AuditService,
    @Inject(IDENTITY_PROVIDER) private provider: IdentityProvider,
  ) {}

  private newChallenge(): Challenge {
    return CHALLENGES[randomInt(CHALLENGES.length)];
  }

  private captureUrl(token: string) {
    const base = (process.env.WEB_URL || "http://localhost:3000").replace(/\/$/, "");
    return `${base}/verify-id/${token}`;
  }

  private async createSession(userId: string, channel: "SMS_WEB" | "MOBILE_APP", phoneLast4?: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await this.prisma.identityVerification.count({ where: { userId, createdAt: { gt: since } } });
    if (recent >= MAX_SESSIONS_PER_DAY) {
      throw new HttpException("Too many verification attempts today. Try again tomorrow.", HttpStatus.TOO_MANY_REQUESTS);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } });
    if (!user) throw new NotFoundException("User not found");
    if (user.identityVerifiedAt) throw new BadRequestException("Your identity is already verified");

    // Only one live capture link at a time: a new request invalidates earlier open ones.
    await this.prisma.identityVerification.updateMany({
      where: { userId, status: "PENDING_CAPTURE" },
      data: { status: "EXPIRED", completedAt: new Date() },
    });

    const token = randomBytes(32).toString("base64url");
    const session = await this.prisma.identityVerification.create({
      data: {
        userId,
        channel,
        phoneLast4: phoneLast4 ?? null,
        tokenHash: sha256(token),
        tokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        challenge: this.newChallenge(),
        consentedAt: new Date(),
      },
    });
    return { token, session };
  }

  /** Web registration: text a one-time link to the user's phone to scan ID + take selfies. */
  async startBySms(userId: string, phone: string, consent: boolean, meta?: { ip?: string; userAgent?: string }) {
    if (!consent) throw new BadRequestException("You must consent to ID and face verification");
    const e164 = (phone || "").replace(/[\s().-]/g, "");
    if (!E164.test(e164)) {
      throw new BadRequestException("Enter your mobile number in international format, e.g. +14155550123");
    }

    const { token, session } = await this.createSession(userId, "SMS_WEB", e164.slice(-4));
    await this.prisma.user.update({ where: { id: userId }, data: { phoneE164: e164 } });

    let delivery: SmsDelivery;
    try {
      delivery = await this.sms.send(
        e164,
        `DateBuk: verify your identity (valid 30 min). Have your government ID ready and open: ${this.captureUrl(token)}`,
        { purpose: "identity_link", userId },
      );
    } catch (err) {
      await this.prisma.identityVerification.update({
        where: { id: session.id },
        data: { status: "EXPIRED", completedAt: new Date(), decisionReason: "SMS delivery failed" },
      });
      throw err;
    }

    await this.audit.log({
      action: "IDENTITY_LINK_SENT",
      actorUserId: userId,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
      metadata: { channel: "SMS_WEB", phoneLast4: e164.slice(-4), delivery },
    });

    return { sessionId: session.id, expiresAt: session.tokenExpiresAt, delivery, phoneLast4: e164.slice(-4) };
  }

  /** Mobile app registration: same capture flow, run in-app; returns the capture token. */
  async startInApp(userId: string, consent: boolean, meta?: { ip?: string; userAgent?: string }) {
    if (!consent) throw new BadRequestException("You must consent to ID and face verification");
    const { token, session } = await this.createSession(userId, "MOBILE_APP");
    await this.audit.log({
      action: "IDENTITY_SESSION_STARTED",
      actorUserId: userId,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
      metadata: { channel: "MOBILE_APP" },
    });
    return {
      sessionId: session.id,
      captureToken: token,
      challenge: session.challenge,
      expiresAt: session.tokenExpiresAt,
    };
  }

  async status(userId: string) {
    const [user, latest] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } }),
      this.prisma.identityVerification.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);
    return {
      verified: !!user?.identityVerifiedAt,
      verifiedAt: user?.identityVerifiedAt ?? null,
      status: latest?.status ?? "NONE",
      channel: latest?.channel ?? null,
      reason: latest?.status === "REJECTED" || latest?.decisionReason ? latest?.decisionReason ?? null : null,
      attemptsLeft: latest ? Math.max(0, MAX_ATTEMPTS - latest.attempts) : MAX_ATTEMPTS,
    };
  }

  private async sessionByToken(token: string) {
    if (!token || token.length < 20 || token.length > 128) throw new NotFoundException("Link not found");
    const s = await this.prisma.identityVerification.findUnique({ where: { tokenHash: sha256(token) } });
    if (!s) throw new NotFoundException("Link not found");
    if (s.status === "PENDING_CAPTURE" && s.tokenExpiresAt.getTime() < Date.now()) {
      await this.prisma.identityVerification.update({
        where: { id: s.id },
        data: { status: "EXPIRED", completedAt: new Date() },
      });
      return { ...s, status: "EXPIRED" };
    }
    return s;
  }

  /** What the capture page needs to render. Never returns user data. */
  async captureInfo(token: string) {
    const s = await this.sessionByToken(token);
    return {
      status: s.status,
      challenge: s.challenge as Challenge,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - s.attempts),
      expiresAt: s.tokenExpiresAt,
      channel: s.channel,
    };
  }

  /** Normalize to a bounded JPEG: validates it is a real image and strips EXIF/metadata. */
  private async normalize(buf: Buffer, label: string): Promise<Buffer> {
    try {
      return await sharp(buf, { failOn: "error" })
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();
    } catch {
      throw new BadRequestException(`${label} is not a valid image`);
    }
  }

  async submit(token: string, files: CaptureFiles, meta?: { ip?: string; userAgent?: string }) {
    const s = await this.sessionByToken(token);
    if (s.status === "APPROVED") return { status: "APPROVED", approved: true, reasons: [], canRetry: false };
    if (s.status !== "PENDING_CAPTURE") throw new ForbiddenException("This verification link is no longer active");

    // Claim the session atomically so a double-submit can't run the pipeline twice.
    const claimed = await this.prisma.identityVerification.updateMany({
      where: { id: s.id, status: "PENDING_CAPTURE" },
      data: { status: "PROCESSING" },
    });
    if (claimed.count === 0) throw new ForbiddenException("This verification is already being processed");

    try {
      const [idFront, selfie, selfieChallenge] = await Promise.all([
        this.normalize(files.idFront, "ID photo"),
        this.normalize(files.selfie, "Selfie"),
        this.normalize(files.selfieChallenge, "Challenge selfie"),
      ]);

      const user = await this.prisma.user.findUnique({
        where: { id: s.userId },
        select: { dateOfBirth: true, fullName: true },
      });

      const [idFields, face, liveness] = await Promise.all([
        this.provider.analyzeId(idFront),
        this.provider.compareFaces(selfie, idFront, selfieChallenge),
        this.provider.assessLiveness(selfie, selfieChallenge, s.challenge as Challenge),
      ]);

      const decision = decide({
        id: idFields,
        face,
        liveness,
        account: { dateOfBirth: user?.dateOfBirth ?? null, fullName: user?.fullName ?? null },
        faceThreshold: Number(process.env.IDENTITY_FACE_THRESHOLD ?? DEFAULT_FACE_THRESHOLD),
        requireNameMatch: process.env.IDENTITY_REQUIRE_NAME_MATCH === "true",
      });

      const attempts = s.attempts + 1;
      const canRetry = !decision.approved && attempts < MAX_ATTEMPTS;
      const status = decision.approved ? "APPROVED" : canRetry ? "PENDING_CAPTURE" : "REJECTED";

      // Only the outcome is stored - the images and the document's text are discarded here.
      await this.prisma.$transaction([
        this.prisma.identityVerification.update({
          where: { id: s.id },
          data: {
            status,
            attempts,
            challenge: canRetry ? this.newChallenge() : s.challenge,
            docType: idFields.docType ?? null,
            docExpired: decision.checks.docExpired,
            ageOk: decision.checks.ageOk,
            dobMatches: decision.checks.dobMatches,
            nameMatches: decision.checks.nameMatches,
            faceSimilarity: decision.checks.faceSimilarity,
            livenessPassed: decision.checks.livenessPassed,
            decisionReason: decision.approved ? null : decision.reasons.join(" | ").slice(0, 500),
            completedAt: status === "PENDING_CAPTURE" ? null : new Date(),
          },
        }),
        ...(decision.approved
          ? [this.prisma.user.update({ where: { id: s.userId }, data: { identityVerifiedAt: new Date() } })]
          : []),
      ]);

      await this.audit.log({
        action: decision.approved ? "IDENTITY_VERIFIED" : "IDENTITY_REJECTED",
        actorUserId: s.userId,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        metadata: {
          attempt: attempts,
          faceSimilarity: decision.checks.faceSimilarity,
          livenessPassed: decision.checks.livenessPassed,
          ageOk: decision.checks.ageOk,
          docExpired: decision.checks.docExpired,
          dobMatches: decision.checks.dobMatches,
        },
      });

      return {
        status,
        approved: decision.approved,
        reasons: decision.reasons,
        canRetry,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
      };
    } catch (err) {
      // Provider/validation failure: release the claim so the user can retry the same link.
      this.log.error(`Identity processing failed for session ${s.id}: ${(err as Error)?.message}`);
      await this.prisma.identityVerification.updateMany({
        where: { id: s.id, status: "PROCESSING" },
        data: { status: "PENDING_CAPTURE" },
      });
      if (err instanceof BadRequestException) throw err;
      throw new HttpException("We couldn't process your photos. Please try again.", HttpStatus.BAD_GATEWAY);
    }
  }
}
