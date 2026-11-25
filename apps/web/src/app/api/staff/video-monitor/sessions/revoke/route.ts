import type { NextRequest } from "next/server";
import { proxyToAdmin } from "../../_proxy";

export async function POST(req: NextRequest) {
  return proxyToAdmin(req, "/admin/sessions/revoke");
}
