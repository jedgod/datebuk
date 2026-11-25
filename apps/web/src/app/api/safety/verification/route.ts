import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getVerification, upsertVerification } from "@/lib/server/safety-store";

export async function GET(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, verification: getVerification(auth.userId) }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { documentType, legalName, dateOfBirth, country } = body;
  if (!documentType || !legalName || !dateOfBirth || !country) {
    return NextResponse.json(
      { error: "documentType, legalName, dateOfBirth, and country are required" },
      { status: 400 }
    );
  }

  const verification = upsertVerification({
    userId: auth.userId,
    documentType,
    legalName,
    dateOfBirth,
    country,
  });

  return NextResponse.json({ success: true, verification }, { status: 201 });
}
