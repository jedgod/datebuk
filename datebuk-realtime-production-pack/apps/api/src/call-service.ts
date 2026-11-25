import { CallStatus, CallType } from "@prisma/client";
import { prisma } from "./db";
import { sendExpoPush } from "./push";

export async function canCall(callerId: string, calleeId: string) {
  if (callerId === calleeId) return false;

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: callerId, blockedId: calleeId },
        { blockerId: calleeId, blockedId: callerId }
      ]
    }
  });

  return !block;
}

export async function createCall(input: {
  callerId: string;
  calleeId: string;
  type: CallType;
}) {
  if (!(await canCall(input.callerId, input.calleeId))) {
    throw new Error("Calling is not permitted between these users");
  }

  const call = await prisma.callSession.create({
    data: input,
    include: { caller: true, callee: true }
  });

  const devices = await prisma.device.findMany({
    where: {
      userId: input.calleeId,
      enabled: true,
      pushToken: { not: null }
    }
  });

  await sendExpoPush(
    devices.flatMap((device) =>
      device.pushToken
        ? [{
            to: device.pushToken,
            title: `${call.caller.displayName} is calling`,
            body: input.type === "VIDEO" ? "Incoming video call" : "Incoming voice call",
            priority: "high",
            sound: "default",
            data: {
              event: "incoming-call",
              callId: call.id,
              callerId: call.callerId,
              callerName: call.caller.displayName,
              type: call.type
            }
          }]
        : []
    )
  );

  return call;
}

export async function updateCallStatus(
  callId: string,
  userId: string,
  status: CallStatus,
  reason?: string
) {
  const call = await prisma.callSession.findUnique({ where: { id: callId } });
  if (!call) throw new Error("Call not found");
  if (![call.callerId, call.calleeId].includes(userId)) {
    throw new Error("Not authorized for this call");
  }

  const now = new Date();
  const data: Record<string, unknown> = { status };

  if (status === "ACCEPTED") data.answeredAt = now;

  if (["ENDED", "REJECTED", "CANCELLED", "MISSED", "FAILED"].includes(status)) {
    data.endedAt = now;
    data.endReason = reason;
    if (call.answeredAt) {
      data.durationSec = Math.max(
        0,
        Math.floor((now.getTime() - call.answeredAt.getTime()) / 1000)
      );
    }
  }

  return prisma.callSession.update({
    where: { id: callId },
    data
  });
}
