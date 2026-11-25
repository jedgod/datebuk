import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  addCallLog,
  addVideoSession,
  getMatchesForUser,
  type CallType,
} from "@/lib/server/communication-store";
import { evaluateNetworkPolicy } from "@/lib/server/network-policy";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * Create a new video session between two matched users
 * POST /api/video-session/create
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, scheduledTime, duration, callType } = body;

    const auth = getAuthContext(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const safeCallType: CallType = callType === "voice" ? "voice" : "video";
    const tier = await getRequestAccessTier(req, userId);
    if (!hasCapability(tier, "VOICE")) {
      return NextResponse.json({ error: deniedMessage("VOICE"), tier }, { status: 403 });
    }
    if (safeCallType === "video" && !hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    const network = await evaluateNetworkPolicy(req);
    if (network.action === "block") {
      return NextResponse.json(
        {
          error: "Video session blocked by network safety policy",
          policy: network,
        },
        { status: 403 }
      );
    }

    // Generate unique room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Default duration: 3 minutes for free users, extendable for premium
    const sessionDuration = duration || 180; // seconds
    const matches = getMatchesForUser(userId);
    const match = matches.find((item) => item.id === matchId);
    const peerUserId = match?.matchedUserId;

    const session = addVideoSession({
      id: `session_${Date.now()}`,
      roomId,
      matchId,
      userId,
      callType: safeCallType,
      scheduledTime: scheduledTime || new Date().toISOString(),
      timezone: body?.timezone || "UTC",
      duration: sessionDuration,
      status: scheduledTime ? "scheduled" : "ready",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + sessionDuration * 1000).toISOString(),
      participants: [userId, peerUserId ?? matchId],
      networkPolicy: {
        action: network.action,
        message: network.message,
        restrictions: network.restrictions,
        riskScore: network.riskScore,
        flags: network.flags,
        isVPN: network.isVPN,
        ipAddress: network.ipAddress,
        maskedIp: network.maskedIp,
      },
      ipShare: {
        automaticEnabled: network.action === "allow" || network.action === "warn",
        sessionFingerprint: `fp_${network.maskedIp.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
      },
    });

    addCallLog({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      matchId,
      sessionId: session.id,
      roomId,
      actorUserId: userId,
      peerUserId,
      direction: "outgoing",
      callType: safeCallType,
      status: scheduledTime ? "initiated" : "ringing",
      startedAt: new Date().toISOString(),
      notes: scheduledTime ? "Scheduled call created" : "Live call started",
    });

    return NextResponse.json({
      success: true,
      session,
      message: scheduledTime ? "Video date scheduled successfully" : "Video session created",
      policy: {
        action: network.action,
        message: network.message,
        restrictions: network.restrictions,
      },
    });
  } catch (error) {
    console.error("Create video session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
