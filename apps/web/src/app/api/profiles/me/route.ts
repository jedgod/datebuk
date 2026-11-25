import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/api-proxy";

export async function PATCH(req: NextRequest) {
  return proxyToApi(req, "/profiles/me");
}
