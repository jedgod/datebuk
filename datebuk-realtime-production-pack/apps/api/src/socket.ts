import type { Server, Socket } from "socket.io";
import { CallStatus, CallType } from "@prisma/client";
import { authenticateSocket } from "./auth";
import { createCall, updateCallStatus } from "./call-service";
import type Redis from "ioredis";

type Ack<T> = (result: { ok: true; data: T } | { ok: false; error: string }) => void;

export function registerSocketHandlers(io: Server, socket: Socket, redis: Redis) {
  const user = authenticateSocket(socket);
  socket.data.userId = user.sub;
  socket.join(`user:${user.sub}`);

  redis.set(`presence:${user.sub}`, "online", "EX", 90).catch(console.error);

  socket.on("presence:heartbeat", async () => {
    await redis.set(`presence:${user.sub}`, "online", "EX", 90);
  });

  socket.on(
    "call:start",
    async (
      payload: { calleeId: string; type: CallType },
      ack: Ack<{ callId: string }>
    ) => {
      try {
        const call = await createCall({
          callerId: user.sub,
          calleeId: payload.calleeId,
          type: payload.type
        });

        io.to(`user:${payload.calleeId}`).emit("call:incoming", {
          callId: call.id,
          callerId: user.sub,
          callerName: call.caller.displayName,
          type: call.type
        });

        ack({ ok: true, data: { callId: call.id } });
      } catch (error) {
        ack({ ok: false, error: error instanceof Error ? error.message : "Call failed" });
      }
    }
  );

  socket.on(
    "call:status",
    async (
      payload: { callId: string; status: CallStatus; peerId: string; reason?: string },
      ack: Ack<{ status: CallStatus }>
    ) => {
      try {
        const updated = await updateCallStatus(
          payload.callId,
          user.sub,
          payload.status,
          payload.reason
        );

        io.to(`user:${payload.peerId}`).emit("call:status", {
          callId: payload.callId,
          status: updated.status,
          reason: updated.endReason
        });

        ack({ ok: true, data: { status: updated.status } });
      } catch (error) {
        ack({ ok: false, error: error instanceof Error ? error.message : "Update failed" });
      }
    }
  );

  for (const event of ["webrtc:offer", "webrtc:answer", "webrtc:ice"]) {
    socket.on(event, (payload: { peerId: string; callId: string; data: unknown }) => {
      io.to(`user:${payload.peerId}`).emit(event, {
        fromUserId: user.sub,
        callId: payload.callId,
        data: payload.data
      });
    });
  }

  socket.on("disconnect", async () => {
    await redis.del(`presence:${user.sub}`);
  });
}
