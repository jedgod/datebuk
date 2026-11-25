import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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
