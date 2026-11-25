import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { env } from "./config";

export type AuthUser = {
  sub: string;
  name?: string;
};

export function authenticateSocket(socket: Socket): AuthUser {
  const token =
    socket.handshake.auth?.token ??
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) throw new Error("Missing access token");

  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }

  return { sub: payload.sub, name: payload.name as string | undefined };
}
