import { NextRequest, NextResponse } from "next/server";
import { addRegionRule, listRegionRules } from "@/lib/server/geo-matching";
import { getAuthContext } from "@/lib/server/auth";

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get("dp_admin")?.value === "1";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ rules: await listRegionRules() }, { status: 200 });
  } catch (error) {
    console.error("List admin region rules error:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    if (!body?.region || !body?.visibility) {
      return NextResponse.json({ error: "region and visibility are required" }, { status: 400 });
    }

    const visibility = body.visibility;
    if (!["allow", "limited", "blocked"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const rule = await addRegionRule(
      {
      region: body.region,
      visibility,
      note: body.note,
      },
      getAuthContext(req).userId ?? undefined
    );

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Create admin region rule error:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
