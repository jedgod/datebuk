import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/api-proxy";

export async function GET(req: NextRequest) {
  return proxyToApi(req, "/users/me");
}
