import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  addCallLog,
  addVideoSession,
  cancelVideoSession,
  createDateRequest,
  getMatchesForUser,
  listVideoSessionsForUser,
} from "@/lib/server/communication-store";
import { evaluateNetworkPolicy } from "@/lib/server/network-policy";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * Schedule a video date
 * POST /api/video-session/schedule
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      matchId,
      scheduledTime,
      duration,
      timezone,
      placeName,
      placeAddress,
      latitude,
      longitude,
      mapUrl,
      notes,
      title,
    } = body;

    const auth = getAuthContext(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, userId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    if (!matchId || !scheduledTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate scheduled time is in future
    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    const network = await evaluateNetworkPolicy(req);
    if (network.action === "block") {
      return NextResponse.json(
        {
          error: "Scheduling blocked by network safety policy",
          policy: network,
        },
        { status: 403 }
      );
    }

    // Generate room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const matches = getMatchesForUser(userId);
    const match = matches.find((item) => item.id === matchId);
    const peerUserId = match?.matchedUserId ?? matchId;

    const session = addVideoSession({
      id: `session_${Date.now()}`,
      roomId,
      matchId,
      userId,
      callType: "video",
      scheduledTime: scheduleDate.toISOString(),
      timezone: timezone || "UTC",
      duration: duration || 180, // 3 minutes default
      status: "scheduled",
      createdAt: new Date().toISOString(),
      participants: [userId, peerUserId],
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
      datePlan: {
        title,
        placeName,
        placeAddress,
        latitude,
        longitude,
        mapUrl,
        notes,
      },
    });

    const dateRequest = createDateRequest({
      matchId,
      requestedByUserId: userId,
      requestedToUserId: peerUserId,
      scheduledAt: scheduleDate.toISOString(),
      timezone: timezone || "UTC",
      placeName: placeName || "To be decided",
      placeAddress: placeAddress || "Address pending",
      latitude,
      longitude,
      mapUrl,
      notes,
    });

    addCallLog({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      matchId,
      sessionId: session.id,
      roomId: session.roomId,
      actorUserId: userId,
      peerUserId,
      direction: "outgoing",
      callType: "video",
      status: "initiated",
      startedAt: new Date().toISOString(),
      notes: "Scheduled video date created",
    });

    return NextResponse.json({
      success: true,
      session,
      dateRequest,
      message: "Video date scheduled successfully",
      reminders: ["You will receive reminders 1 hour and 15 minutes before the call"],
      policy: {
        action: network.action,
        message: network.message,
        restrictions: network.restrictions,
      },
    });
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Failed to schedule video date" }, { status: 500 });
  }
}

/**
 * Get scheduled video dates
 * GET /api/video-session/schedule
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, userId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    const matches = getMatchesForUser(userId);
    const sessions = listVideoSessionsForUser(userId)
      .filter((item) => item.status === "scheduled")
      .map((item) => {
        const match = matches.find((m) => m.id === item.matchId);
        return {
          ...item,
          matchName: match?.matchedUserName || "Match",
          matchPhoto: match?.otherUser?.avatar || "/datebuk_Staff.png",
        };
      });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Get schedules error:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

/**
 * Cancel scheduled video date
 * DELETE /api/video-session/schedule
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const auth = getAuthContext(req);
    const userId = auth.userId;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const tier = await getRequestAccessTier(req, userId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    const cancelled = cancelVideoSession(sessionId, userId);
    if (!cancelled) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Video date cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel schedule error:", error);
    return NextResponse.json({ error: "Failed to cancel schedule" }, { status: 500 });
  }
}
