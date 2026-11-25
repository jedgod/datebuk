import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/api-proxy";

export async function POST(req: NextRequest) {
  return proxyToApi(req, "/subscriptions/plan-change");
}
