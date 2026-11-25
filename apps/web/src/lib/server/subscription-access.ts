import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TIER_RANK,
  normalizeTier,
  type AccessTier,
} from "@/lib/subscription-access-policy";

export {
  deniedMessage,
  hasCapability,
  type AccessCapability,
  type AccessTier,
} from "@/lib/subscription-access-policy";

export async function getUserAccessTier(userId: string): Promise<AccessTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscription: {
        select: {
          tierName: true,
          status: true,
        },
      },
    },
  });

  if (!user) return "FREE";

  const activeStatus = (user.subscription?.status || "").toLowerCase();
  const subscriptionTier =
    activeStatus === "active" || activeStatus === "trialing"
      ? normalizeTier(user.subscription?.tierName)
      : "FREE";

  const userTier = normalizeTier(user.subscriptionTier);

  return TIER_RANK[subscriptionTier] >= TIER_RANK[userTier] ? subscriptionTier : userTier;
}

export async function getRequestAccessTier(req: NextRequest, userId: string): Promise<AccessTier> {
  return getUserAccessTier(userId);
}
