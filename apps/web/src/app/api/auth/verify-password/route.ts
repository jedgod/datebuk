import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/api-proxy";

// Delegates to the API's POST /auth/verify-password, which owns password checking,
// per-account lockout and audit logging. (This route previously re-implemented the check
// with bcrypt + a direct DB read here and fell back to a mis-prefixed /auth/login URL.)
export async function POST(req: NextRequest) {
  return proxyToApi(req, "/auth/verify-password");
}
