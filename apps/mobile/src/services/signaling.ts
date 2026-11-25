import { secureStorage } from "./secureStorage";
import { io, Socket } from "socket.io-client";

const URL = process.env.EXPO_PUBLIC_SIGNALING_URL || "http://10.0.2.2:4001";
export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  timeout: 10_000,
});

export async function connectSignaling() {
  const token = await secureStorage.getAccessToken();
  if (!token) throw new Error("AUTHENTICATION_REQUIRED");
  socket.auth = { token };
  if (!socket.connected) socket.connect();
}

export function reconnectSignaling(accessToken: string) {
  socket.auth = { token: accessToken };
  socket.disconnect().connect();
}

export function disconnectSignaling() {
  if (socket.connected) socket.disconnect();
}
