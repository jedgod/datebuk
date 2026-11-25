import type { NextRequest } from "next/server";
import { proxyToAdmin } from "../../_proxy";

export async function GET(req: NextRequest) {
  return proxyToAdmin(req, "/admin/quarantine/meta");
}
