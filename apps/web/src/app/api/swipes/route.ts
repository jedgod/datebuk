import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { toId, action } = await req.json();
    const safeAction = action === "like" || action === "pass" ? action : null;

    if (!toId || !safeAction) {
      return NextResponse.json(
        { message: "toId and action are required" },
        { status: 400 }
      );
    }

    // Mock matching logic - 20% chance of match on "like"
    const matched = safeAction === "like" && Math.random() < 0.2;

    const swipe = {
      id: `swipe_${Date.now()}`,
      fromUserId: auth.userId,
      toUserId: toId,
      action: safeAction,
      matched,
      createdAt: new Date().toISOString(),
    };

    // If matched, optionally create match record
    const response: Record<string, unknown> = { ...swipe };
    
    if (matched) {
      response.matchId = `match_${Date.now()}`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Swipe error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
