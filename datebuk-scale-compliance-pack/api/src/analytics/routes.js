import { Router } from 'express';
import { z } from 'zod';

export const analyticsRouter = Router();

const eventSchema = z.object({
  userId: z.string().optional(),
  event: z.string().min(2),
  source: z.enum(['web', 'mobile', 'api']),
  properties: z.record(z.any()).default({})
});

analyticsRouter.post('/events', (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(202).json({ accepted: true, receivedAt: new Date().toISOString(), ...parsed.data });
});

analyticsRouter.get('/growth-summary', (_req, res) => {
  res.json({ signups: 1240, matches: 842, paidUsers: 196, retention7d: 0.42, reportsOpen: 18 });
});
