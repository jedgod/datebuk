import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { env } from "./config";
import { requireAuth, type AuthenticatedRequest } from "./auth";
import { createTurnCredentials } from "./turn";
import { saveDevice } from "./device-store";
import { deliverIncomingCall } from "./call-delivery";

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "native-call-delivery" });
});

app.get("/api/turn-credentials", requireAuth, (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  res.json(createTurnCredentials(userId));
});

app.post("/api/devices/call-token", requireAuth, (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const input = z.object({
    platform: z.enum(["IOS", "ANDROID"]),
    token: z.string().min(20)
  }).parse(req.body);

  const device = saveDevice({
    id: crypto.randomUUID(),
    userId,
    platform: input.platform,
    token: input.token,
    enabled: true
  });

  res.status(201).json({ id: device.id });
});

app.post("/api/calls", requireAuth, async (req, res) => {
  const { userId: callerId } = req as AuthenticatedRequest;
  const input = z.object({
    calleeId: z.string().min(1),
    callerName: z.string().min(1).max(100),
    callType: z.enum(["VOICE", "VIDEO"])
  }).parse(req.body);

  const callId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30_000).toISOString();

  // Persist this call in the existing DateBuk CallSession table before delivery.
  const delivery = await deliverIncomingCall(input.calleeId, {
    callId,
    callerId,
    callerName: input.callerName,
    callType: input.callType,
    expiresAt
  });

  res.status(201).json({
    callId,
    status: "RINGING",
    expiresAt,
    delivery
  });
});

app.listen(env.PORT, () => {
  console.log(`DateBuk native call delivery API listening on ${env.PORT}`);
});
