import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getMatchesForUser } from "@/lib/server/communication-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const matches = getMatchesForUser(auth.userId);
    return NextResponse.json(matches, { status: 200 });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
