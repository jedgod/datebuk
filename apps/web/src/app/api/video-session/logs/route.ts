import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  addCallLog,
  getMatchesForUser,
  listCallLogsForUser,
  type CallDirection,
  type CallStatus,
  type CallType,
} from "@/lib/server/communication-store";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * GET /api/video-session/logs?matchId=...&limit=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, auth.userId);
    if (!hasCapability(tier, "VOICE")) {
      return NextResponse.json({ error: deniedMessage("VOICE"), tier }, { status: 403 });
    }

    const matchId = req.nextUrl.searchParams.get("matchId") || undefined;
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "25");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 25;

    const logs = listCallLogsForUser(auth.userId, matchId)
      .filter((item) => (tier === "PREMIUM" ? item.callType === "voice" : true))
      .slice(0, limit);
    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error) {
    console.error("Get call logs error:", error);
    return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
  }
}

/**
 * POST /api/video-session/logs
 * Body:
 * {
 *   matchId: string,
 *   sessionId?: string,
 *   roomId?: string,
 *   direction: "incoming" | "outgoing",
 *   callType: "voice" | "video",
 *   status: "initiated" | "ringing" | "connected" | "missed" | "ended" | "rejected",
 *   startedAt?: string,
 *   endedAt?: string,
 *   durationSeconds?: number,
 *   qualityScore?: number,
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, auth.userId);
    if (!hasCapability(tier, "VOICE")) {
      return NextResponse.json({ error: deniedMessage("VOICE"), tier }, { status: 403 });
    }

    const body = await req.json();
    const {
      matchId,
      sessionId,
      roomId,
      direction,
      callType,
      status,
      startedAt,
      endedAt,
      durationSeconds,
      qualityScore,
      notes,
    } = body;

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    const safeDirection: CallDirection = direction === "incoming" ? "incoming" : "outgoing";
    const safeType: CallType = callType === "voice" ? "voice" : "video";
    if (safeType === "video" && !hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }
    const validStatuses: CallStatus[] = ["initiated", "ringing", "connected", "missed", "ended", "rejected"];
    const safeStatus: CallStatus = validStatuses.includes(status) ? status : "initiated";

    const matches = getMatchesForUser(auth.userId);
    const match = matches.find((item) => item.id === matchId);

    const log = addCallLog({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      matchId,
      sessionId,
      roomId,
      actorUserId: auth.userId,
      peerUserId: match?.matchedUserId,
      direction: safeDirection,
      callType: safeType,
      status: safeStatus,
      startedAt: startedAt || new Date().toISOString(),
      endedAt,
      durationSeconds,
      qualityScore,
      notes,
    });

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error) {
    console.error("Create call log error:", error);
    return NextResponse.json({ error: "Failed to save call log" }, { status: 500 });
  }
}
