import { NextRequest, NextResponse } from "next/server";
import { deleteRegionRule, updateRegionRule } from "@/lib/server/geo-matching";
import { getAuthContext } from "@/lib/server/auth";

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get("dp_admin")?.value === "1";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const payload = {
      region: typeof body?.region === "string" ? body.region : undefined,
      visibility:
        body?.visibility === "allow" || body?.visibility === "limited" || body?.visibility === "blocked"
          ? body.visibility
          : undefined,
      note: typeof body?.note === "string" ? body.note : undefined,
    };

    const updated = await updateRegionRule(id, payload, getAuthContext(req).userId ?? undefined);
    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Update admin region rule error:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const deleted = await deleteRegionRule(id, getAuthContext(req).userId ?? undefined);
    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete admin region rule error:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
