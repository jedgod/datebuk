import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    return NextResponse.json(
      {
        ok: true,
        applied: true,
        category: body?.category ?? "general",
        appliedAt: body?.appliedAt ?? Date.now(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Invalid settings payload" }, { status: 400 });
  }
}
