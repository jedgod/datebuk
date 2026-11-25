import type { Server, Socket } from "socket.io";
import type Redis from "ioredis";
import { socketUserId } from "./auth";

export function attachSocket(io: Server, socket: Socket, redis: Redis) {
  const userId = socketUserId(socket);
  socket.join(`user:${userId}`);
  socket.data.userId = userId;

  redis.set(`presence:${userId}`, "online", "EX", 90).catch(console.error);

  socket.on("presence:heartbeat", () => {
    redis.set(`presence:${userId}`, "online", "EX", 90).catch(console.error);
  });

  for (const event of [
    "webrtc:offer",
    "webrtc:answer",
    "webrtc:ice",
    "call:cancel",
    "call:accepted",
    "call:ended"
  ]) {
    socket.on(event, (payload: { peerId: string; callId: string; data?: unknown }) => {
      io.to(`user:${payload.peerId}`).emit(event, {
        fromUserId: userId,
        callId: payload.callId,
        data: payload.data
      });
    });
  }

  socket.on("disconnect", () => {
    redis.del(`presence:${userId}`).catch(console.error);
  });
}
