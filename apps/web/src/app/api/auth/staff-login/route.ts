import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const backendResponse = await fetch(apiEndpoint("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const data = await backendResponse.json().catch(() => null);
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data?.message || "Invalid staff credentials" },
        { status: backendResponse.status },
      );
    }

    const token = data?.accessToken;
    if (data?.requiresOtp && data?.tempToken && data?.userId) {
      return NextResponse.json({
        success: true,
        requiresOtp: true,
        tempToken: data.tempToken,
        userId: data.userId,
      });
    }
    if (data?.mustSetupMfa && data?.tempToken && data?.userId) {
      return NextResponse.json({
        success: true,
        mustSetupMfa: true,
        tempToken: data.tempToken,
        userId: data.userId,
      });
    }
    const user = data?.user;
    const role = String(user?.role || data?.role || "").toUpperCase();
    if (!token || !["STAFF", "ADMIN", "SUPERADMIN", "SUPPORT", "MODERATOR"].includes(role)) {
      return NextResponse.json({ message: "This account does not have staff access" }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      email: user?.email || email,
      name: user?.displayName || user?.name || "Staff Member",
      staffId: user?.id,
      role,
      accessToken: token,
      refreshToken: data?.refreshToken,
    });
    response.cookies.set("dp_access", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    response.cookies.set("dp_staff", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    // Carries the real, backend-verified role so proxy.ts can require more
    // than just "is staff" for the most sensitive /staff/* sub-paths
    // (video-monitor/quarantine, tracking-transparency) — previously any
    // role in STAFF/ADMIN/SUPERADMIN/SUPPORT/MODERATOR got identical
    // URL-level access to every staff page. See
    // ultra_datebuk-08-01-2026.txt, M-4.
    response.cookies.set("dp_staff_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ message: "Authentication service unavailable" }, { status: 502 });
  }
}
