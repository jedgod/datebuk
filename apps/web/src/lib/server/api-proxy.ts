import { NextRequest, NextResponse } from "next/server";
import { apiEndpoint } from "@/lib/config";

/** Bearer token from the Authorization header, falling back to the dp_access cookie. */
export function getAccessToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const t = header.slice(7).trim();
    if (t) return t;
  }
  return req.cookies.get("dp_access")?.value ?? null;
}

/**
 * Forwards a Next.js route handler request to the NestJS API (the single source of
 * truth for auth, validation and data), preserving status, body and query string.
 * Replaces the old per-route mock handlers that expected a fake "mock-user-token-*".
 */
export async function proxyToApi(req: NextRequest, apiPath: string): Promise<NextResponse> {
  const token = getAccessToken(req);
  if (!token) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const search = new URL(req.url).search;
  try {
    const res = await fetch(apiEndpoint(apiPath) + search, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error(`API proxy failed for ${apiPath}:`, error);
    return NextResponse.json({ message: "API unavailable" }, { status: 502 });
  }
}
