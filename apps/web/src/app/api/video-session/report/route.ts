import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * Report safety issues during or after video call
 * POST /api/video-session/report
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportedUserId, reason } = body;

    // Verify reporter authorization
    const auth = getAuthContext(req);
    const reporterId = auth.userId;
    if (!reporterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, reporterId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    if (!reportedUserId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      available: false,
      message: "Video safety reporting is temporarily unavailable. Use the supported help channel for urgent reports.",
    }, { status: 501 });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
