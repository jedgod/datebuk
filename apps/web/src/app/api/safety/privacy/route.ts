import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getPrivacySettings, savePrivacySettings } from "@/lib/server/safety-store";

export async function GET(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, settings: getPrivacySettings(auth.userId) }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = getPrivacySettings(auth.userId);
  const body = await req.json();
  const settings = savePrivacySettings({
    userId: auth.userId,
    visibility: body.visibility ?? current.visibility,
    messages: body.messages ?? current.messages,
    locationSharing: body.locationSharing ?? current.locationSharing,
    dataSharing: typeof body.dataSharing === "boolean" ? body.dataSharing : current.dataSharing,
    readReceipts: typeof body.readReceipts === "boolean" ? body.readReceipts : current.readReceipts,
    screenshotAlerts: typeof body.screenshotAlerts === "boolean" ? body.screenshotAlerts : current.screenshotAlerts,
  });

  return NextResponse.json({ success: true, settings }, { status: 200 });
}
