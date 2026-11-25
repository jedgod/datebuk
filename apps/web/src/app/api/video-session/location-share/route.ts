import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  addLocationShare,
  listLocationShares,
} from "@/lib/server/communication-store";
import { evaluateNetworkPolicy } from "@/lib/server/network-policy";

import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * Share approximate location after mutual consent during video call
 * POST /api/video-session/location-share
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId, consent, location, shareIp = true } = body;

    const auth = getAuthContext(req);
    const currentUserId = auth.userId;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, currentUserId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    if (userId && currentUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!consent) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    const network = await evaluateNetworkPolicy(req);
    if (network.action === "block") {
      return NextResponse.json(
        {
          error: "Location sharing blocked by security policy",
          policy: network,
        },
        { status: 403 }
      );
    }
    if (network.action === "restrict") {
      return NextResponse.json(
        {
          error: "Location sharing restricted on this network",
          policy: network,
        },
        { status: 403 }
      );
    }

    // Approximate location (city + radius, not exact coordinates)
    const approximateLocation = {
      city: location?.city || "Unknown",
      state: location?.state || "Unknown",
      country: location?.country || "US",
      radiusMiles: 8,
      approximate: true,
    };

    const shareData = addLocationShare({
      id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sessionId,
      userId: currentUserId,
      location: approximateLocation,
      ipSnapshot: {
        maskedIp: shareIp ? network.maskedIp : "disabled",
        networkFingerprint: `fp_${network.maskedIp.replace(/[^a-zA-Z0-9]/g, "")}`,
      },
      consentedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    return NextResponse.json({
      success: true,
      shared: true,
      location: approximateLocation,
      network: {
        ipSnapshotShared: shareIp,
        maskedIp: shareData.ipSnapshot.maskedIp,
        action: network.action,
      },
      message: "Location and network snapshot shared successfully",
    });
  } catch (error) {
    console.error("Location share error:", error);
    return NextResponse.json({ error: "Failed to share location" }, { status: 500 });
  }
}

/**
 * Get shared location for session
 * GET /api/video-session/location-share?sessionId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const auth = getAuthContext(req);
    const userId = auth.userId;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const tier = await getRequestAccessTier(req, userId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    const shares = listLocationShares(sessionId);

    return NextResponse.json({ success: true, shares });
  } catch (error) {
    console.error("Get location share error:", error);
    return NextResponse.json({ error: "Failed to get shared locations" }, { status: 500 });
  }
}
