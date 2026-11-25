import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

function getAccessToken(req: NextRequest): string | null {
  return req.cookies.get("dp_access")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const token = getAccessToken(req);
  if (!token) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const res = await fetch(apiEndpoint("/settings"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function PATCH(req: NextRequest) {
  const token = getAccessToken(req);
  if (!token) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const body = await req.text();
  const res = await fetch(apiEndpoint("/settings"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
