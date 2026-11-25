import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(accessToken: string) {
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL!, {
    auth: { token: accessToken },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity
  });

  return socket;
}
