import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  detectLocationFromRequest,
  getPreferenceForUser,
  getRegionalMatches,
} from "@/lib/server/geo-matching";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const viewer = body?.viewerLocation || detectLocationFromRequest(req);
    const preference = body?.preference || (await getPreferenceForUser(auth.userId));
    const matches = await getRegionalMatches(auth.userId, viewer, preference);

    return NextResponse.json({ viewer, preference, matches }, { status: 200 });
  } catch (error) {
    console.error("Regional match error:", error);
    return NextResponse.json({ error: "Failed to get regional matches" }, { status: 500 });
  }
}
