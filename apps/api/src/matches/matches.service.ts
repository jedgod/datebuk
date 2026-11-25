import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { SafetyService } from "../safety/safety.service";

function displayLocation(location: unknown): string | undefined {
  if (!location || typeof location !== "object") return undefined;
  const loc = location as Record<string, unknown>;
  if (typeof loc.city === "string" && loc.city) {
    return typeof loc.country === "string" && loc.country ? `${loc.city}, ${loc.country}` : loc.city;
  }
  if (typeof loc.label === "string" && loc.label) return loc.label;
  return undefined;
}

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private safety: SafetyService,
  ) {}

  async listForUser(userId: string) {
    const matches = await this.prisma.match.findMany({
      // active: false covers both a mutual unmatch and the effect of a block (see
      // SafetyService.block, which deactivates the shared match) — mutual privacy after
      // blocking means neither side should see this match anymore, not just the blocker.
      where: { active: true, OR: [{ user1Id: userId }, { user2Id: userId }] },
      orderBy: { createdAt: "desc" },
    });

    const blockedAny = await Promise.all(
      matches.map((match) => {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        return this.safety.isBlockedEitherDirection(userId, otherUserId);
      }),
    );
    const visibleMatches = matches.filter((_, i) => !blockedAny[i]);

    return Promise.all(
      visibleMatches.map(async (match) => {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;

        const [profile, unreadCount] = await Promise.all([
          this.prisma.profile.findUnique({ where: { userId: otherUserId } }),
          this.prisma.message.count({
            where: { matchId: match.id, senderId: { not: userId }, readAt: null },
          }),
        ]);

        const firstPhotoKey = profile?.photos?.[0];
        const avatar = firstPhotoKey ? await this.uploads.presignedGet(firstPhotoKey, 900) : undefined;

        return {
          id: match.id,
          createdAt: match.createdAt,
          lastMessageAt: match.lastMessageAt,
          unreadCount,
          otherUser: {
            id: otherUserId,
            displayName: profile?.displayName ?? "Match",
            avatar,
            age: profile?.age,
            location: displayLocation(profile?.location),
            bio: profile?.bio ?? undefined,
          },
        };
      }),
    );
  }
}
