import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      const text = await req.text();

      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      
      body = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { email, password, nextUrl = "/admin/dashboard" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(apiEndpoint("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: backendRes.status === 429 ? 429 : 401 }
      );
    }

    const data = await backendRes.json();
    if (!data.accessToken) {
      return NextResponse.json({ error: "Login service returned no access token" }, { status: 502 });
    }

    const role = String(data.user?.role || data.role || "USER").toUpperCase();
    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return NextResponse.json({ error: "This account does not have administrator access" }, { status: 403 });
    }

    const response = NextResponse.json(
      {
        success: true,
        email: data.email || email,
        name: data.displayName || "User",
        role,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        redirectUrl: nextUrl,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "dp_access",
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    if (data.userId) {
      response.cookies.set({
        name: "dp_user_id",
        value: data.userId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400,
        path: "/",
      });
    }

    response.cookies.set({
      name: "dp_admin",
      value: "1",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    response.cookies.set({
      name: "dp_staff",
      value: "1",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
