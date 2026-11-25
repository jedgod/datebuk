import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export type AuthContext = {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
};

function extractBearerToken(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("Bearer ")) return value;
  return value.slice("Bearer ".length).trim() || null;
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function verifyJwtAndGetUserId(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(base64UrlDecode(headerPart));
    if (header?.alg !== "HS256") return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is required for server-side token verification");
      return null;
    }
    const expected = createHmac("sha256", secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest("base64url");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signaturePart);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadPart));
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }
    if (payload && typeof payload.sub === "string" && payload.sub.trim().length > 0) {
      return payload.sub;
    }
  } catch {
    return null;
  }

  return null;
}

export function getAuthContext(req: NextRequest): AuthContext {
  const headerToken = extractBearerToken(req.headers.get("authorization"));
  const cookieToken = req.cookies.get("dp_access")?.value ?? null;
  const token = headerToken ?? cookieToken;

  if (!token) {
    return { token: null, userId: null, isAuthenticated: false };
  }

  // SECURITY: userId must only ever come from a signature-verified JWT.
  // The `dp_user_id` cookie is a display/attribution convenience value set
  // alongside the real session cookie, but it is not itself authenticated —
  // a request can carry any Cookie header it wants, so trusting it here
  // (even as a fallback when JWT verification fails) allows full account
  // impersonation. Do not reintroduce a cookie-based fallback.
  const userId = verifyJwtAndGetUserId(token);

  if (!userId) {
    return { token: null, userId: null, isAuthenticated: false };
  }

  return {
    token,
    userId,
    isAuthenticated: true,
  };
}
