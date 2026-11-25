import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";

export type TokenPayload = {
  userId: string;
  role: "admin" | "staff" | "agent";
  iat: number;
  exp: number;
};

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function generateToken(
  userId: string,
  role: "admin" | "staff" | "agent",
  expiresIn = "24h"
): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn });
}

export function isStaff(payload: TokenPayload | null): boolean {
  return payload?.role === "staff" || payload?.role === "admin";
}

export function isAdmin(payload: TokenPayload | null): boolean {
  return payload?.role === "admin";
}
