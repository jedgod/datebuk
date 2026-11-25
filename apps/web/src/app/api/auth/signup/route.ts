import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();
    const normalizedName = String(displayName || "").trim();

    if (!normalizedEmail || !normalizedPassword || !normalizedName) {
      return NextResponse.json(
        { message: "Email, password, and display name are required." },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(apiEndpoint("/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
        displayName: normalizedName,
      }),
      cache: "no-store",
    });
    const data = await backendResponse.json().catch(() => null);
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data?.message || "Signup failed" },
        { status: backendResponse.status },
      );
    }

    const accessToken = data?.accessToken;
    const refreshToken = data?.refreshToken;
    if (!accessToken || !refreshToken) {
      return NextResponse.json({ message: "Authentication service returned an invalid response" }, { status: 502 });
    }

    const response = NextResponse.json(
      {
        accessToken,
        refreshToken,
        ...data,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "dp_access",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("User signup error:", error);
    return NextResponse.json(
      { message: "Signup failed" },
      { status: 500 }
    );
  }
}
