import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./db";
import { env } from "./config";

export const router = Router();

function requireUser(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "datebuk-realtime-api" });
});

router.post("/devices/register", requireUser, async (req: any, res) => {
  const input = z.object({
    platform: z.enum(["IOS", "ANDROID", "WEB"]),
    pushToken: z.string().nullable().optional(),
    deviceName: z.string().max(120).optional()
  }).parse(req.body);

  const device = await prisma.device.create({
    data: { ...input, userId: req.userId }
  });

  res.status(201).json(device);
});

router.get("/calls/history", requireUser, async (req: any, res) => {
  const calls = await prisma.callSession.findMany({
    where: {
      OR: [{ callerId: req.userId }, { calleeId: req.userId }]
    },
    include: {
      caller: { select: { id: true, displayName: true } },
      callee: { select: { id: true, displayName: true } }
    },
    orderBy: { startedAt: "desc" },
    take: 100
  });

  res.json(calls);
});

router.post("/calls/:callId/report", requireUser, async (req: any, res) => {
  const input = z.object({
    reportedId: z.string(),
    category: z.enum(["HARASSMENT", "NUDITY", "SCAM", "THREAT", "OTHER"]),
    details: z.string().max(2000).optional()
  }).parse(req.body);

  const report = await prisma.callReport.create({
    data: {
      callId: req.params.callId,
      reporterId: req.userId,
      ...input
    }
  });

  res.status(201).json(report);
});
