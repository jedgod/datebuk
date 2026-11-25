/**
 * Custom Next.js server with WebSocket upgrade support.
 * This allows /api/support/ws to proxy to the support-platform WebSocket endpoint.
 * 
 * Usage:
 * - Replace next dev with: node server.js
 * - Or add to package.json: "next": "node server.js && next"
 */

import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import next from "next";
import httpProxy from "http-proxy";
import ws from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const SUPPORT_API_URL =
  process.env.SUPPORT_PLATFORM_API_URL || "http://localhost:4500";

const proxy = httpProxy.createProxyServer({
  target: SUPPORT_API_URL,
  changeOrigin: true,
  ws: true,
});

function getRequestUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `http://${host}`);
}

function getParsedQuery(url) {
  const query = {};

  for (const [key, value] of url.searchParams.entries()) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  return query;
}

console.log("Preparing Next.js app from:", __dirname);

app.prepare().then(() => {
  console.log("✓ Next.js app prepared successfully");
  const server = createServer(async (req, res) => {
    const requestUrl = getRequestUrl(req);
    const parsedUrl = {
      pathname: requestUrl.pathname,
      query: getParsedQuery(requestUrl),
    };

    // Proxy REST requests to support-platform
    if (parsedUrl.pathname?.startsWith("/api/support/requests")) {
      return proxy.web(req, res);
    }

    if (parsedUrl.pathname?.startsWith("/api/support/stream")) {
      return proxy.web(req, res);
    }

    if (parsedUrl.pathname?.startsWith("/api/support/chat/")) {
      req.url = (req.url || "").replace(/^\/api\/support\/chat/, "/chat");
      return proxy.web(req, res);
    }

    return handle(req, res, parsedUrl);
  });

  // Handle errors from the request handler
  server.on("clientError", (err, socket) => {
    console.error("Client error:", err);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  // Handle WebSocket upgrades for /api/support/ws
  server.on("upgrade", (req, socket, head) => {
    const requestUrl = getRequestUrl(req);

    if (requestUrl.pathname === "/api/support/ws") {
      // Rewrite path to match support-platform endpoint
      const targetPath = new URL("/support/ws", SUPPORT_API_URL);
      targetPath.searchParams.set("token", requestUrl.searchParams.get("token") || "");
      req.url = `${targetPath.pathname}${targetPath.search}`;

      proxy.ws(req, socket, head, (err) => {
        if (err) {
          console.error("WebSocket proxy error:", err);
          socket.destroy();
        }
      });
      return;
    }

    // Default: reject other upgrade requests
    socket.destroy();
  });

  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => {
    console.log(`Next.js server listening on http://localhost:${port}`);
    console.log(`Support API proxied to ${SUPPORT_API_URL}`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
}).catch((err) => {
  console.error("Failed to prepare Next.js app:", err);
  process.exit(1);
});
