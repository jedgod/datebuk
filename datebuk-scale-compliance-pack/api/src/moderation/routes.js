import { Router } from 'express';
import { z } from 'zod';

export const moderationRouter = Router();

const reportSchema = z.object({
  reporterId: z.string(),
  reportedUserId: z.string(),
  reason: z.enum(['harassment', 'fake_profile', 'spam', 'unsafe_behavior', 'other']),
  details: z.string().optional()
});

moderationRouter.post('/reports', (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(201).json({ id: `report_${Date.now()}`, status: 'open', riskScore: 72, ...parsed.data });
});

moderationRouter.get('/queue', (_req, res) => {
  res.json([
    { id: 'report_1001', reason: 'fake_profile', status: 'open', riskScore: 88 },
    { id: 'report_1002', reason: 'harassment', status: 'reviewing', riskScore: 91 }
  ]);
});
