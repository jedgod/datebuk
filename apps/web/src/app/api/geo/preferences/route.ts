import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import {
  getPreferenceForUser,
  savePreferenceForUser,
  type MatchScope,
} from "@/lib/server/geo-matching";

const ALLOWED: MatchScope[] = ["NEARBY", "SAME_COUNTRY", "SAME_CONTINENT", "GLOBAL"];

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preference = await getPreferenceForUser(auth.userId);
    return NextResponse.json({ success: true, preference }, { status: 200 });
  } catch (error) {
    console.error("Get geo preference error:", error);
    return NextResponse.json({ error: "Failed to fetch preference" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const scope = body?.matchScope;

    if (scope && !ALLOWED.includes(scope)) {
      return NextResponse.json({ error: "Invalid matchScope" }, { status: 400 });
    }

    const preference = await savePreferenceForUser(auth.userId, body || {});
    return NextResponse.json({ success: true, preference }, { status: 200 });
  } catch (error) {
    console.error("Save geo preference error:", error);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }
}
