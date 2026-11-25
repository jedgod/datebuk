import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import { SafetyService } from "../safety/safety.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

// Short enough that a leaked token (e.g. in a browser history entry or a referrer header)
// is useless within a couple of minutes, long enough to cover normal page-load latency
// before the client presents it to apps/signaling's join-room handler.
const CALL_TOKEN_TTL_SECONDS = 120;

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private safety: SafetyService,
    private subscriptions: SubscriptionsService,
  ) {}

  // Real call authorization, replacing "any two people who know a roomId string can join
  // it" (the web flow's previous behavior — see apps/signaling join-room). The matchId
  // doubles as the roomId: a match already uniquely and stably identifies the pair, so
  // there's no need for a separately generated room identifier, and it gives the video-
  // call page a reliable way to know who the other participant actually is.
  async issueToken(userId: string, matchId: string, media: "voice" | "video") {
    if (media !== "voice" && media !== "video") throw new BadRequestException("media must be 'voice' or 'video'");

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || !match.active) throw new NotFoundException("Match not found");
    if (match.user1Id !== userId && match.user2Id !== userId) throw new ForbiddenException();

    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
    if (await this.safety.isBlockedEitherDirection(userId, otherUserId)) {
      throw new ForbiddenException("This conversation is no longer available");
    }

    await this.subscriptions.assertCallEligible(userId, media);

    const participants = [match.user1Id, match.user2Id].sort();
    // Same claim shape (sub/iss/aud) as a real access token — apps/signaling verifies
    // this with the exact same HMAC check it already uses for connection auth, just
    // additionally checking purpose/roomId/participants below.
    const callToken = this.jwt.sign(
      { sub: userId, purpose: "call-auth", roomId: matchId, participants, media },
      { expiresIn: CALL_TOKEN_TTL_SECONDS, issuer: "datebuk-api", audience: "datebuk-calling" },
    );

    return { roomId: matchId, callToken, media, expiresIn: CALL_TOKEN_TTL_SECONDS, otherUserId };
  }
}
