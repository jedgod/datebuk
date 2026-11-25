import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Socket } from "socket.io";
import { env } from "./config";

export type AuthenticatedRequest = Request & { userId: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    (req as AuthenticatedRequest).userId = String(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function socketUserId(socket: Socket) {
  const token =
    socket.handshake.auth?.token ??
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) throw new Error("Missing token");
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token");
  }

  return String(payload.sub);
}
