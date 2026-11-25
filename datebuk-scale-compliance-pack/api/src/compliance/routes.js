import { Router } from 'express';
import { z } from 'zod';

export const complianceRouter = Router();

const consentSchema = z.object({ userId: z.string(), policyVersion: z.string(), accepted: z.boolean() });

complianceRouter.post('/consent', (req, res) => {
  const parsed = consentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(201).json({ saved: true, timestamp: new Date().toISOString(), ...parsed.data });
});

complianceRouter.post('/data-export', (req, res) => {
  const { userId } = req.body;
  res.status(202).json({ requestId: `export_${Date.now()}`, userId, status: 'processing' });
});

complianceRouter.post('/account-deletion', (req, res) => {
  const { userId, reason } = req.body;
  res.status(202).json({ requestId: `delete_${Date.now()}`, userId, reason, status: 'scheduled' });
});
