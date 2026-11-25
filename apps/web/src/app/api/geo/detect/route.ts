import { NextRequest, NextResponse } from "next/server";
import { detectLocationFromRequest } from "@/lib/server/geo-matching";

export async function GET(req: NextRequest) {
  try {
    const location = detectLocationFromRequest(req);
    return NextResponse.json(
      {
        location,
        notice: "Approximate IP location detected for regional matching.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Geo detect error:", error);
    return NextResponse.json({ error: "Failed to detect location" }, { status: 500 });
  }
}
