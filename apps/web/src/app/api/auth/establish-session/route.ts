import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

/**
 * Finishes a browser sign-in that completed on the API directly (MFA / OTP / MFA enrolment), where
 * no Next route saw the response and so no session cookies were set.
 *
 * The role cookies the proxy uses to gate /admin and /staff are derived HERE from the API's own
 * answer about the presented access token (GET /users/me) - never from anything the client claims.
 * The cookies are httpOnly, so page scripts cannot set or change them either. (The API still
 * enforces every permission itself; these cookies only decide which pages are served.)
 */
export async function POST(req: NextRequest) {
  let accessToken = "";
  try {
    accessToken = String((await req.json())?.accessToken ?? "");
  } catch {
    /* fall through */
  }
  if (!accessToken || accessToken.length > 4096) return NextResponse.json({ message: "accessToken is required" }, { status: 400 });

  let me: any;
  try {
    const res = await fetch(apiEndpoint("/users/me"), { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    me = await res.json();
  } catch {
    return NextResponse.json({ message: "Authentication service unavailable" }, { status: 502 });
  }

  const role = String(me?.role ?? "USER").toUpperCase();
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN" || me?.isAdmin === true;
  const isStaff = isAdmin || role !== "USER";

  const response = NextResponse.json({ success: true, role, isAdmin, isStaff });
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 86400,
    path: "/",
  };
  response.cookies.set("dp_access", accessToken, base);
  if (me?.id) response.cookies.set("dp_user_id", String(me.id), base);
  // Always (re)write the role cookies so a downgraded account can't keep stale elevated ones.
  response.cookies.set("dp_admin", isAdmin ? "1" : "", { ...base, maxAge: isAdmin ? 86400 : 0 });
  response.cookies.set("dp_staff", isStaff ? "1" : "", { ...base, maxAge: isStaff ? 86400 : 0 });
  response.cookies.set("dp_staff_role", isStaff ? role : "", { ...base, maxAge: isStaff ? 86400 : 0 });
  return response;
}
