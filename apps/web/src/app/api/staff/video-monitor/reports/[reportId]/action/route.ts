import type { NextRequest } from "next/server";
import { proxyToAdmin } from "../../../_proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  return proxyToAdmin(req, `/admin/video-monitor/reports/${reportId}/action`);
}
