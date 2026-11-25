import { Router } from 'express';
import { z } from 'zod';

export const notificationRouter = Router();

const notificationSchema = z.object({
  userId: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push', 'in_app']),
  title: z.string().min(2),
  body: z.string().min(2),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
});

notificationRouter.post('/send', async (req, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const job = { id: `notif_${Date.now()}`, status: 'queued', ...parsed.data };
  res.status(202).json(job);
});

notificationRouter.get('/templates', (_req, res) => {
  res.json([
    { key: 'match_received', title: 'New Match' },
    { key: 'verification_approved', title: 'Verification Approved' },
    { key: 'safety_alert', title: 'Safety Alert' },
    { key: 'subscription_receipt', title: 'Payment Receipt' }
  ]);
});
