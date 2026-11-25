import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { deniedMessage, getRequestAccessTier, hasCapability } from "@/lib/server/subscription-access";
import {
  addMessage,
  getMessagesForMatch,
  type MessageAttachment,
} from "@/lib/server/communication-store";

export async function GET(req: NextRequest) {
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

    // Get matchId from query params
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { message: "matchId is required" },
        { status: 400 }
      );
    }

    const messages = getMessagesForMatch(matchId, auth.userId);

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { matchId, content, attachments } = await req.json();
    const text = typeof content === "string" ? content.trim() : "";
    const safeAttachments = Array.isArray(attachments)
      ? attachments.filter((item) => item && typeof item === "object") as MessageAttachment[]
      : [];

    if (!matchId || (!text && safeAttachments.length === 0)) {
      return NextResponse.json(
        { message: "matchId and either content or attachments are required" },
        { status: 400 }
      );
    }

    const newMessage = addMessage({
      matchId,
      senderId: auth.userId,
      content: text,
      attachments: safeAttachments,
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
