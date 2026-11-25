import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  createDateRequest,
  getMatchesForUser,
  listDateRequestsForUser,
  updateDateRequest,
  type DateRequestStatus,
} from "@/lib/server/communication-store";

const VALID_STATUSES: DateRequestStatus[] = [
  "pending",
  "accepted",
  "declined",
  "rescheduled",
  "cancelled",
  "completed",
];

/**
 * GET /api/date-requests
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = listDateRequestsForUser(auth.userId);
    return NextResponse.json({ success: true, requests }, { status: 200 });
  } catch (error) {
    console.error("Get date requests error:", error);
    return NextResponse.json({ error: "Failed to fetch date requests" }, { status: 500 });
  }
}

/**
 * POST /api/date-requests
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      matchId,
      scheduledAt,
      timezone,
      placeName,
      placeAddress,
      latitude,
      longitude,
      mapUrl,
      notes,
    } = body;

    if (!matchId || !scheduledAt || !placeName || !placeAddress) {
      return NextResponse.json(
        { error: "matchId, scheduledAt, placeName, and placeAddress are required" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: "scheduledAt must be a future date" }, { status: 400 });
    }

    const matches = getMatchesForUser(auth.userId);
    const match = matches.find((item) => item.id === matchId);

    const request = createDateRequest({
      matchId,
      requestedByUserId: auth.userId,
      requestedToUserId: match?.matchedUserId || matchId,
      scheduledAt: scheduledDate.toISOString(),
      timezone: timezone || "UTC",
      placeName,
      placeAddress,
      latitude,
      longitude,
      mapUrl,
      notes,
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error) {
    console.error("Create date request error:", error);
    return NextResponse.json({ error: "Failed to create date request" }, { status: 500 });
  }
}

/**
 * PATCH /api/date-requests
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      status,
      scheduledAt,
      timezone,
      placeName,
      placeAddress,
      latitude,
      longitude,
      mapUrl,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: "Invalid scheduledAt date" }, { status: 400 });
      }
    }

    const updated = updateDateRequest(id, auth.userId, {
      status,
      scheduledAt,
      timezone,
      placeName,
      placeAddress,
      latitude,
      longitude,
      mapUrl,
      notes,
    });

    if (!updated) {
      return NextResponse.json({ error: "Date request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated }, { status: 200 });
  } catch (error) {
    console.error("Update date request error:", error);
    return NextResponse.json({ error: "Failed to update date request" }, { status: 500 });
  }
}
