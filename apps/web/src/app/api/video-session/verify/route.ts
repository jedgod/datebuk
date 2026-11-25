import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";

/**
 * Identity verification endpoint for video dates
 * POST /api/video-session/verify
 * 
 * Integrates with liveness detection providers (Persona, Veriff, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    const auth = getAuthContext(req);
    const currentUserId = auth.userId;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, currentUserId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    if (userId && currentUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      verified: false,
      available: false,
      message: "Identity verification is not available until a verification provider is configured.",
    }, { status: 501 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

/**
 * Check verification status
 * GET /api/video-session/verify?userId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, auth.userId);
    if (!hasCapability(tier, "VIDEO")) {
      return NextResponse.json({ error: deniedMessage("VIDEO"), tier }, { status: 403 });
    }

    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const verification = {
      userId,
      verified: false,
      available: false,
    };
    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("Check verification error:", error);
    return NextResponse.json({ error: "Failed to check verification" }, { status: 500 });
  }
}
