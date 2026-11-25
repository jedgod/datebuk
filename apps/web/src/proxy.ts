import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/staff", "/dashboard", "/profile", "/matches", "/messages", "/video-call", "/discover", "/settings"];
const adminPrefixes = ["/admin"];
const staffPrefixes = ["/staff"];
// Previously any of STAFF/ADMIN/SUPERADMIN/SUPPORT/MODERATOR (the whole
// `dp_staff=1` bucket) got identical URL-level access to every /staff/*
// page, including these — moderation/quarantine tooling and the tracking-
// transparency log. Restrict them to ADMIN/SUPERADMIN only. This is a
// coarse, role-name-based check (not the finer-grained DB-backed permission
// system used by the API itself), but it closes the specific gap the
// assessment flagged: a MODERATOR or SUPPORT account loading these page
// shells at all. See ultra_datebuk-08-01-2026.txt, M-4.
const elevatedStaffPrefixes = ["/staff/video-monitor", "/staff/tracking-transparency"];
const elevatedStaffRoles = ["ADMIN", "SUPERADMIN"];
const publicRoutes = ["/login", "/admin/login", "/staff-login"]; // All login routes are public
const userAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const portalUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "http://localhost:3010";

// Origins the client legitimately talks to (API, WebRTC signaling, support platform).
// Falls back to local dev defaults so this doesn't break `pnpm dev` without env vars set.
const apiOrigin = safeOrigin(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");
const signalingOrigin = safeOrigin(process.env.NEXT_PUBLIC_SIGNALING_URL, "http://localhost:4001");
const supportOrigin = safeOrigin(process.env.NEXT_PUBLIC_SUPPORT_PLATFORM_API_URL, "http://localhost:4500");
const signalingWsOrigin = signalingOrigin.replace(/^http/, "ws");

function safeOrigin(value: string | undefined, fallback: string): string {
  try {
    return new URL(value?.trim() || fallback).origin;
  } catch {
    return fallback;
  }
}

/** Applies CSP (with a per-request nonce) and the rest of the security headers to
 * whatever response the auth/redirect logic below produces — redirect or pass-through. */
function withSecurityHeaders(request: NextRequest, response: NextResponse, nonce: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' lets Next's own nonce-tagged bootstrap scripts load their chunks;
    // the host allowlist is ignored by browsers that honor strict-dynamic and is only
    // a fallback for older browsers that don't.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"}`,
    // Inline `style` attributes (common in React) aren't nonce-able, so style-src keeps
    // 'unsafe-inline'. Style-based XSS is a materially smaller risk than script-src.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `media-src 'self' blob: https:`,
    `connect-src 'self' ${apiOrigin} ${signalingOrigin} ${signalingWsOrigin} ${supportOrigin}`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    isProd ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  return response;
}

export function proxy(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Carries the nonce (and, for completeness, the CSP value) to Server Components via
  // request headers, mirroring how it flowed when this lived in a separate middleware.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  const { pathname } = req.nextUrl;
  const isPortalRoute = pathname.startsWith("/admin") || pathname.startsWith("/staff");
  const forwardedProtocol = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
  const requestHost = req.headers.get("host") || req.nextUrl.host;
  const requestOrigin = `${forwardedProtocol}://${requestHost}`;

  if (isPortalRoute && requestOrigin === new URL(userAppUrl).origin) {
    const destination = new URL(`${pathname}${req.nextUrl.search}`, portalUrl);
    return withSecurityHeaders(req, NextResponse.redirect(destination), nonce);
  }

  if (pathname === "/login" && requestOrigin === new URL(portalUrl).origin) {
    return withSecurityHeaders(req, NextResponse.redirect(new URL("/login", userAppUrl)), nonce);
  }

  // Allow public routes to pass through
  if (publicRoutes.includes(pathname)) {
    return withSecurityHeaders(req, next(), nonce);
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return withSecurityHeaders(req, next(), nonce);

  const token = req.cookies.get("dp_access")?.value;
  const isAdminRoute = adminPrefixes.some((p) => pathname.startsWith(p));
  const isStaffRoute = staffPrefixes.some((p) => pathname.startsWith(p));

  if (!token) {
    const url = req.nextUrl.clone();
    // Redirect to appropriate login based on route type
    if (isStaffRoute) {
      url.pathname = "/staff-login";
    } else if (isAdminRoute) {
      url.pathname = "/admin/login";
    } else {
      url.pathname = "/login";
    }
    url.searchParams.set("next", pathname);
    return withSecurityHeaders(req, NextResponse.redirect(url), nonce);
  }

  if (isAdminRoute || isStaffRoute) {
    const isAdmin = req.cookies.get("dp_admin")?.value === "1";
    const isStaff = req.cookies.get("dp_staff")?.value === "1";

    // Check role-based access
    if (isAdminRoute && !isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/access-denied";
      url.searchParams.set("reason", "admin");
      return withSecurityHeaders(req, NextResponse.redirect(url), nonce);
    }

    if (isStaffRoute && !isStaff) {
      const url = req.nextUrl.clone();
      url.pathname = "/access-denied";
      url.searchParams.set("reason", "staff");
      return withSecurityHeaders(req, NextResponse.redirect(url), nonce);
    }

    if (isStaffRoute && isStaff) {
      const needsElevatedRole = elevatedStaffPrefixes.some((p) => pathname.startsWith(p));
      if (needsElevatedRole) {
        const staffRole = (req.cookies.get("dp_staff_role")?.value || "").toUpperCase();
        if (!elevatedStaffRoles.includes(staffRole)) {
          const url = req.nextUrl.clone();
          url.pathname = "/access-denied";
          url.searchParams.set("reason", "staff-role");
          return withSecurityHeaders(req, NextResponse.redirect(url), nonce);
        }
      }
    }
  }
  return withSecurityHeaders(req, next(), nonce);
}

export const config = {
  matcher: [
    // Skip static assets/images so this only runs on page/document requests.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
