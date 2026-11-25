import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { addBlockedMember, listBlockedMembers, removeBlockedMember } from "@/lib/server/safety-store";

export async function GET(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, blockedMembers: listBlockedMembers(auth.userId) }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { memberName, reason, scopes } = body;
  if (!memberName || !reason || !Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json({ error: "memberName, reason, and scopes are required" }, { status: 400 });
  }

  const blockedMember = addBlockedMember({
    userId: auth.userId,
    memberName,
    reason,
    scopes,
  });

  return NextResponse.json({ success: true, blockedMember }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blockId = req.nextUrl.searchParams.get("id");
  if (!blockId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const removed = removeBlockedMember(auth.userId, blockId);
  if (!removed) {
    return NextResponse.json({ error: "Blocked member not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
