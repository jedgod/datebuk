import { Router } from "express";
import { z } from "zod";
import { prisma } from "./db";
import { requireAuth, type AuthenticatedRequest } from "./auth";
import { createTemporaryTurnCredentials } from "./turn";
import { createAndDeliverCall, updateCallStatus } from "./call-service";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "datebuk-final-native-calling" });
});

router.get("/turn-credentials", requireAuth, (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  res.json(createTemporaryTurnCredentials(userId));
});

router.post("/devices/call-token", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const input = z.object({
    platform: z.enum(["IOS", "ANDROID"]),
    tokenType: z.enum(["APNS_VOIP", "FCM"]),
    pushToken: z.string().min(20)
  }).parse(req.body);

  const device = await prisma.device.upsert({
    where: {
      userId_pushToken: {
        userId,
        pushToken: input.pushToken
      }
    },
    create: {
      userId,
      platform: input.platform,
      tokenType: input.tokenType,
      pushToken: input.pushToken,
      enabled: true
    },
    update: {
      platform: input.platform,
      tokenType: input.tokenType,
      enabled: true,
      invalidatedAt: null,
      lastSeenAt: new Date()
    }
  });

  res.status(201).json({ id: device.id });
});

router.post("/calls", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const input = z.object({
    calleeId: z.string().min(1),
    callerName: z.string().min(1).max(100),
    type: z.enum(["VOICE", "VIDEO"])
  }).parse(req.body);

  const call = await createAndDeliverCall({
    callerId: userId,
    ...input
  });

  res.status(201).json(call);
});

router.patch("/calls/:callId/status", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const input = z.object({
    status: z.enum([
      "ACCEPTED",
      "REJECTED",
      "CANCELLED",
      "MISSED",
      "ENDED",
      "FAILED"
    ]),
    reason: z.string().max(200).optional()
  }).parse(req.body);

  const call = await updateCallStatus({
    callId: req.params.callId,
    actorId: userId,
    ...input
  });

  res.json(call);
});

router.get("/calls/history", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  const calls = await prisma.callSession.findMany({
    where: {
      OR: [{ callerId: userId }, { calleeId: userId }]
    },
    include: {
      caller: { select: { id: true, displayName: true } },
      callee: { select: { id: true, displayName: true } },
      deliveries: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  res.json(calls);
});
