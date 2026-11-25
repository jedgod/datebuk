import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }
    const authRes = await fetch(apiEndpoint("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      cache: "no-store",
    });

    let payload: any = null;
    try {
      payload = await authRes.json();
    } catch {
      payload = null;
    }

    if (!authRes.ok) {
      return NextResponse.json(
        { message: payload?.message || "Invalid credentials" },
        { status: authRes.status }
      );
    }

    const response = NextResponse.json(payload, { status: 200 });

    response.cookies.set({
      name: "dp_access",
      value: payload?.accessToken || "",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("User login error:", error);
    return NextResponse.json(
      { message: "Authentication service unavailable. Please start the API server on port 4000." },
      { status: 502 }
    );
  }
}

