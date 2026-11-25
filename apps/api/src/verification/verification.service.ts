import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";

const MINIMUM_AGE = 18;

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService, private uploads: UploadsService) {}

  // This flow only confirms the submitted selfie resembles the account's profile
  // photos — it is NOT legal identity proofing (no government document or trusted
  // identity-provider check), and its badge/copy has been renamed "Photo Verification"
  // throughout the app to say exactly that rather than implying more than it delivers.
  async submit(userId: string, photoKey: string, consent: boolean) {
    if (!photoKey) throw new BadRequestException("photoKey is required");
    if (!consent) {
      throw new BadRequestException("You must consent to photo review before submitting");
    }

    // Defense in depth: age is already floor-bound at 18 by UpdateProfileDto's @Min(18)
    // and the Profile.age column default, but verification is the single highest-stakes
    // gate in the app (it unlocks real-time video with other members) — worth its own
    // explicit check rather than relying entirely on a coincidence of matching defaults.
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { age: true } });
    if (profile && profile.age < MINIMUM_AGE) {
      throw new ForbiddenException(`You must be at least ${MINIMUM_AGE} to submit photo verification`);
    }

    // Without this, a user could pass any string as photoKey — including a completed
    // upload key belonging to someone else they'd seen elsewhere (e.g. a match's photo)
    // — and have staff review someone else's image under their own identity.
    await this.uploads.assertUploadOwnedBy(userId, photoKey);

    const consentedAt = new Date();

    // A user can have at most one open (pending) request at a time; resubmitting
    // while pending replaces it rather than piling up duplicate queue entries. The
    // find-then-create below is not itself race-free (two concurrent submissions can
    // both see "no pending request" under READ COMMITTED before either commits) — the
    // actual guarantee is a partial unique index on (userId) WHERE status = 'PENDING'
    // (see migration 20260724030000_verification_pending_unique). If both requests
    // reach create(), one wins and the other hits that constraint; we catch it here and
    // fall back to updating the row the winner just created, rather than surfacing a
    // raw 500 to a user who did nothing wrong.
    const existingPending = await this.prisma.verificationRequest.findFirst({
      where: { userId, status: "PENDING" },
    });

    if (existingPending) {
      return this.prisma.verificationRequest.update({
        where: { id: existingPending.id },
        data: { photoKey, submittedAt: new Date(), consentedAt },
      });
    }

    try {
      return await this.prisma.verificationRequest.create({
        data: { userId, photoKey, consentedAt },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const winner = await this.prisma.verificationRequest.findFirstOrThrow({
          where: { userId, status: "PENDING" },
        });
        return this.prisma.verificationRequest.update({
          where: { id: winner.id },
          data: { photoKey, submittedAt: new Date(), consentedAt },
        });
      }
      throw err;
    }
  }

  async getStatus(userId: string) {
    const [latest, user] = await Promise.all([
      this.prisma.verificationRequest.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { verifiedVideo: true } }),
    ]);

    return {
      verified: user?.verifiedVideo ?? false,
      status: latest?.status ?? "NONE",
      submittedAt: latest?.submittedAt ?? null,
      rejectionReason: latest?.status === "REJECTED" ? latest.rejectionReason : null,
    };
  }

  async listQueue(limit = 50) {
    const requests = await this.prisma.verificationRequest.findMany({
      where: { status: { in: ["PENDING", "ESCALATED"] } },
      orderBy: { submittedAt: "asc" },
      take: limit,
      include: { user: { include: { profile: true } } },
    });

    return Promise.all(
      requests.map(async (r) => ({
        id: r.id,
        userId: r.userId,
        displayName: r.user.profile?.displayName || r.user.email,
        photoUrl: await this.uploads.presignedGet(r.photoKey, 900),
        submittedAt: r.submittedAt,
        status: r.status,
        firstReviewerId: r.firstReviewerId,
      })),
    );
  }

  async review(id: string, decision: "approved" | "rejected" | "escalated", reviewerId: string, reason?: string) {
    const request = await this.prisma.verificationRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Verification request not found");

    // Reviewer-conflict control: a staff member can't review their own submission,
    // regardless of decision.
    if (request.userId === reviewerId) {
      throw new ForbiddenException("You cannot review your own verification request");
    }

    if (decision === "escalated") {
      return this.prisma.verificationRequest.update({
        where: { id },
        data: { status: "ESCALATED", firstReviewerId: reviewerId, rejectionReason: reason ?? null },
      });
    }

    // Dual review for uncertain cases: whoever escalated a request cannot also be the
    // one who finalizes it — a genuinely different staff member has to make the call.
    if (request.status === "ESCALATED" && request.firstReviewerId === reviewerId) {
      throw new ForbiddenException("A different reviewer must finalize a request you escalated");
    }

    const status = decision === "approved" ? "APPROVED" : "REJECTED";

    // A single transaction, not Promise.all: the request's status and the user's
    // verifiedVideo flag must change together. Two independent calls could leave a
    // request marked APPROVED while the user's flag never flipped (or vice versa) if
    // the second call failed after the first succeeded.
    const [updated] = await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          rejectionReason: decision === "rejected" ? reason || "Did not meet verification requirements" : null,
        },
      }),
      ...(decision === "approved"
        ? [
            this.prisma.user.update({
              where: { id: request.userId },
              data: { verifiedVideo: true, videoApproved: true },
            }),
          ]
        : []),
    ]);

    return updated;
  }
}
