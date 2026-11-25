import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, value } = await req.json();

    if (!name || !value) {
      return NextResponse.json(
        { error: "Missing name or value" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set cookie with secure options
    response.cookies.set({
      name: name,
      value: value,
      httpOnly: false, // Allow client-side access for our purposes
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting cookie:", error);
    return NextResponse.json(
      { error: "Failed to set cookie" },
      { status: 500 }
    );
  }
}
