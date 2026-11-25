import { io, Socket } from "socket.io-client";
import { config } from "./config";
import { useAuth } from "@/stores/auth";

let socket: Socket | null = null;

export function reconnectWithNewToken(target: Socket, accessToken: string) {
  target.auth = { token: accessToken };
  target.disconnect().connect();
}

export function getSocket(accessToken?: string): Socket {
  const token = accessToken || useAuth.getState().accessToken;
  if (!token) throw new Error("AUTHENTICATION_REQUIRED");
  if (!socket) {
    socket = io(config.signalingUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10_000,
    });
    socket.on("connect_error", async (error) => {
      if (["INVALID_OR_EXPIRED_TOKEN", "AUTHENTICATION_REQUIRED"].includes(error.message)) {
        const refreshed = await useAuth.getState().refresh().catch(() => null);
        if (refreshed && socket) reconnectWithNewToken(socket, refreshed);
      }
    });
  } else if ((socket.auth as any)?.token !== token) {
    reconnectWithNewToken(socket, token);
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
