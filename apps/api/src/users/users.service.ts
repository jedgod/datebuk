import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Gates the activities a disposable/mistyped email shouldn't be able to reach:
  // appearing in Discover, messaging, uploading public photos, calling, buying concierge
  // services, and submitting identity verification. Onboarding itself (signup, viewing
  // your own profile/settings) intentionally stays open before verification.
  async requireVerifiedEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    if (!user) throw new UnauthorizedException();
    if (!user.emailVerified) throw new ForbiddenException("Please verify your email to use this feature");
    return true;
  }

  // Gates the same sensitive activities as requireVerifiedEmail, but for the "high"
  // IP-risk tier (see AuthService.flagIpRisk) rather than an unverified email — a
  // signal serious enough to restrict pending human review, but never severe enough on
  // its own to suspend the account or block sign-in (VPN/proxy heuristics have real
  // false positives). Automatically lifts the moment staff resolves the flag: either by
  // reviewing it via FraudEventTracker.provideFeedback, or if it turns out to be
  // confirmed abuse, through whatever stronger action staff take from there.
  async assertNotUnderRiskReview(userId: string) {
    const flagged = await this.prisma.fraudEvent.findFirst({
      where: { userId, resolved: false, decisionApplied: "restrict" },
      select: { id: true },
    });
    if (flagged) {
      throw new ForbiddenException("Your account is under a routine safety review. Some features are temporarily limited — contact support if you need help.");
    }
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        fullName: true,
        photos: true,
        createdAt: true,
        updatedAt: true,
        isAdmin: true,
        role: true,
        accountStatus: true,
        profile: true,
      },
    });
  }

  async listUsers(options: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    exclude?: string[];
  }) {
    const users = await this.prisma.user.findMany({
      skip: options.skip || 0,
      take: options.take || 12,
      where: {
        ...options.where,
        id: { notIn: options.exclude || [] },
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        fullName: true,
        gender: true,
        age: true,
        bio: true,
        photos: true,
        locationCity: true,
        locationState: true,
        locationCountry: true,
        datingIntent: true,
        trustScore: true,
        interests: true,
      },
    });

    return {
      users,
      total: await this.prisma.user.count({
        where: {
          ...options.where,
          id: { notIn: options.exclude || [] },
        },
      }),
    };
  }
}
