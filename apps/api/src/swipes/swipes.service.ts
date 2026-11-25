import { browseGenderWhere } from "./browse-filter";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UploadsService } from "../uploads/uploads.service";
import { SafetyService } from "../safety/safety.service";

@Injectable()
export class SwipesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private uploads: UploadsService,
    private safety: SafetyService,
  ) {}

  async recommendations(userId: string, limit = 20) {
    // Women see men and men see women by default (or whoever the member said they are looking for at signup).
    const viewer = await this.prisma.user.findUnique({ where: { id: userId }, select: { gender: true, genderPreference: true } });

    // Industrial starter: simple queue excluding self + already swiped + already matched.
    const swiped = await this.prisma.like.findMany({ where: { fromId: userId }, select: { toId: true } });
    const swipedIds = new Set(swiped.map((x) => x.toId));

    const matches = await this.prisma.match.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: { user1Id: true, user2Id: true },
    });
    const matchedIds = new Set<string>();
    for (const m of matches) {
      matchedIds.add(m.user1Id === userId ? m.user2Id : m.user1Id);
    }

    // Blocked in either direction: neither someone the user blocked, nor someone who
    // blocked the user, should ever resurface in recommendations.
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set<string>();
    for (const b of blocks) blockedIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        accountStatus: "ACTIVE",
        // An unverified email shouldn't be able to reach anyone through Discover either —
        // this protects other users from disposable/mistyped-email accounts, independent
        // of the viewer's own requireVerifiedEmail gate in SwipesController.
        emailVerified: true,
        profile: { isNot: null },
        AND: [
          { id: { notIn: Array.from(swipedIds) } },
          { id: { notIn: Array.from(matchedIds) } },
          { id: { notIn: Array.from(blockedIds) } },
          ...browseGenderWhere(viewer ?? {}),
        ],
      },
      // Newest members first, so people who just registered are seen straight away.
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, profile: true },
    });

    return Promise.all(
      candidates.map(async (candidate) => {
        const firstPhotoKey = candidate.profile?.photos?.[0];
        const photo = firstPhotoKey ? await this.uploads.presignedGet(firstPhotoKey, 900) : null;

        return {
          id: candidate.id,
          displayName: candidate.profile?.displayName ?? "Member",
          age: candidate.profile?.age ?? null,
          bio: candidate.profile?.bio ?? null,
          photo,
          location: candidate.profile?.location ?? null,
        };
      }),
    );
  }

  async swipe(userId: string, toId: string, action: "like" | "pass") {
    if (action === "pass") {
      // pass is stored as Like with a special row? For starter we just no-op.
      return { ok: true, matched: false };
    }

    if (await this.safety.isBlockedEitherDirection(userId, toId)) {
      throw new ForbiddenException("This profile is not available");
    }

    // upsert like
    await this.prisma.like.upsert({
      where: { fromId_toId: { fromId: userId, toId } },
      update: {},
      create: { fromId: userId, toId },
    });

    const mutual = await this.prisma.like.findUnique({
      where: { fromId_toId: { fromId: toId, toId: userId } },
    });

    if (mutual) {
      const pair = userId < toId ? [userId, toId] : [toId, userId];
      const existing = await this.prisma.match.findUnique({
        where: { user1Id_user2Id: { user1Id: pair[0], user2Id: pair[1] } },
      });
      const match = await this.prisma.match.upsert({
        where: { user1Id_user2Id: { user1Id: pair[0], user2Id: pair[1] } },
        update: {},
        create: { user1Id: pair[0], user2Id: pair[1] },
      });

      if (!existing) {
        const [userProfile, otherProfile] = await Promise.all([
          this.prisma.profile.findUnique({ where: { userId } }),
          this.prisma.profile.findUnique({ where: { userId: toId } }),
        ]);
        await Promise.all([
          this.notifications.create({
            userId: toId,
            type: "MATCH",
            title: "New Match!",
            body: `You and ${userProfile?.displayName ?? "someone"} matched.`,
            relatedId: match.id,
          }),
          this.notifications.create({
            userId,
            type: "MATCH",
            title: "New Match!",
            body: `You and ${otherProfile?.displayName ?? "someone"} matched.`,
            relatedId: match.id,
          }),
        ]);
      }

      return { ok: true, matched: true, match };
    }

    return { ok: true, matched: false };
  }
}
