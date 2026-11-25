import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  listAvailabilityForUser,
  listCalendarEventsForUser,
  upsertAvailabilityForUser,
} from "@/lib/server/communication-store";

/**
 * GET /api/availability
 * Returns saved availability slots and synchronized calendar events.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availability = listAvailabilityForUser(auth.userId);
    const events = listCalendarEventsForUser(auth.userId);

    return NextResponse.json({ success: true, availability, events }, { status: 200 });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

/**
 * PUT /api/availability
 * Upserts one day of availability slots.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, slots, timezone } = body as {
      date?: string;
      slots?: string[];
      timezone?: string;
    };

    if (!date || !Array.isArray(slots)) {
      return NextResponse.json({ error: "date and slots are required" }, { status: 400 });
    }

    const saved = upsertAvailabilityForUser(auth.userId, {
      date,
      slots: slots.filter((slot) => typeof slot === "string"),
      timezone: timezone || "UTC",
    });

    return NextResponse.json({ success: true, availability: saved }, { status: 200 });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
