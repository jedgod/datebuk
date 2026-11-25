import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";
import { markMessagesRead } from "@/lib/server/communication-store";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tier = await getRequestAccessTier(req, auth.userId);
    if (!hasCapability(tier, "CHAT")) {
      return NextResponse.json({ message: deniedMessage("CHAT"), tier }, { status: 403 });
    }

    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json(
        { message: "matchId is required" },
        { status: 400 }
      );
    }

    const updatedCount = markMessagesRead(matchId, auth.userId);

    return NextResponse.json(
      { success: true, matchId, updatedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mark messages read error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
