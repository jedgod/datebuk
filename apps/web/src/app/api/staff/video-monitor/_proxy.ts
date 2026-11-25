import { NextResponse, type NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAccessToken(req: NextRequest): string | null {
  return req.cookies.get("dp_access")?.value ?? null;
}

function isStaffOrAdmin(req: NextRequest): boolean {
  const isStaff = req.cookies.get("dp_staff")?.value === "1";
  const isAdmin = req.cookies.get("dp_admin")?.value === "1";
  return isStaff || isAdmin;
}

export async function proxyToAdmin(req: NextRequest, path: string) {
  if (!isStaffOrAdmin(req)) {
    return NextResponse.json({ message: "Staff access required" }, { status: 403 });
  }

  const token = getAccessToken(req);
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  // apps/api mounts everything under a global "/api" prefix (see apps/api's health
  // route: /api/health) — without this, every route built on proxyToAdmin 404s in any
  // environment where NEXT_PUBLIC_API_URL is left at its bare-host default.
  const apiPath = path.startsWith("/api/") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const target = `${API_BASE}${apiPath}${url.search}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const json = await req.json().catch(() => null);
    body = json ? JSON.stringify(json) : undefined;
  }

  const res = await fetch(target, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}
