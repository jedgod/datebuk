import { CallStatus, DeliveryStatus, DeviceTokenType } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./config";
import { sendApnsVoip } from "./apns";
import { sendFcmCall } from "./fcm";

function isInvalidTokenError(message: string) {
  return [
    "BadDeviceToken",
    "Unregistered",
    "registration-token-not-registered",
    "Requested entity was not found"
  ].some(code => message.includes(code));
}

export async function createAndDeliverCall(input: {
  callerId: string;
  calleeId: string;
  callerName: string;
  type: "VOICE" | "VIDEO";
}) {
  if (input.callerId === input.calleeId) {
    throw new Error("Users cannot call themselves");
  }

  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: input.callerId, blockedId: input.calleeId },
        { blockerId: input.calleeId, blockedId: input.callerId }
      ]
    }
  });

  if (blocked) throw new Error("Calling is blocked");

  const expiresAt = new Date(
    Date.now() + env.CALL_RING_TIMEOUT_SECONDS * 1000
  );

  const call = await prisma.callSession.create({
    data: {
      callerId: input.callerId,
      calleeId: input.calleeId,
      type: input.type,
      status: "RINGING",
      ringingAt: new Date(),
      expiresAt
    }
  });

  await prisma.callEvent.create({
    data: {
      callId: call.id,
      type: "CALL_CREATED",
      actorId: input.callerId
    }
  });

  const devices = await prisma.device.findMany({
    where: {
      userId: input.calleeId,
      enabled: true
    }
  });

  const payload = {
    event: "incoming_call",
    callId: call.id,
    callerId: input.callerId,
    callerName: input.callerName,
    callType: input.type,
    expiresAt: expiresAt.toISOString()
  };

  await Promise.all(
    devices.map(async device => {
      const delivery = await prisma.callDelivery.upsert({
        where: {
          callId_deviceId: {
            callId: call.id,
            deviceId: device.id
          }
        },
        create: {
          callId: call.id,
          deviceId: device.id,
          status: "PENDING"
        },
        update: {
          status: "PENDING",
          errorCode: null,
          errorMessage: null
        }
      });

      try {
        const providerId =
          device.tokenType === DeviceTokenType.APNS_VOIP
            ? await sendApnsVoip(device.pushToken, payload)
            : await sendFcmCall(device.pushToken, payload);

        await prisma.callDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.SENT,
            providerId: providerId ?? undefined
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Push failed";
        const invalid = isInvalidTokenError(message);

        await prisma.callDelivery.update({
          where: { id: delivery.id },
          data: {
            status: invalid
              ? DeliveryStatus.INVALID_TOKEN
              : DeliveryStatus.FAILED,
            errorCode: (error as any)?.code,
            errorMessage: message
          }
        });

        if (invalid) {
          await prisma.device.update({
            where: { id: device.id },
            data: {
              enabled: false,
              invalidatedAt: new Date()
            }
          });
        }
      }
    })
  );

  return call;
}

export async function updateCallStatus(input: {
  callId: string;
  actorId: string;
  status: CallStatus;
  reason?: string;
}) {
  const call = await prisma.callSession.findUnique({
    where: { id: input.callId }
  });

  if (!call) throw new Error("Call not found");
  if (![call.callerId, call.calleeId].includes(input.actorId)) {
    throw new Error("Forbidden");
  }

  const now = new Date();
  const data: Record<string, unknown> = {
    status: input.status,
    endReason: input.reason
  };

  if (input.status === "ACCEPTED") data.answeredAt = now;

  if (["REJECTED", "CANCELLED", "MISSED", "ENDED", "FAILED"].includes(input.status)) {
    data.endedAt = now;
    if (call.answeredAt) {
      data.durationSec = Math.max(
        0,
        Math.floor((now.getTime() - call.answeredAt.getTime()) / 1000)
      );
    }
  }

  const updated = await prisma.callSession.update({
    where: { id: input.callId },
    data
  });

  await prisma.callEvent.create({
    data: {
      callId: input.callId,
      type: `CALL_${input.status}`,
      actorId: input.actorId,
      payload: input.reason ? { reason: input.reason } : undefined
    }
  });

  return updated;
}

export async function markExpiredCallsMissed() {
  const expired = await prisma.callSession.findMany({
    where: {
      status: "RINGING",
      expiresAt: { lte: new Date() }
    }
  });

  for (const call of expired) {
    await prisma.callSession.update({
      where: { id: call.id },
      data: {
        status: "MISSED",
        endedAt: new Date(),
        endReason: "NO_ANSWER"
      }
    });

    await prisma.callEvent.create({
      data: {
        callId: call.id,
        type: "CALL_MISSED",
        payload: { reason: "NO_ANSWER" }
      }
    });
  }

  return expired.length;
}
