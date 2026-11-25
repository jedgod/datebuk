import { Router } from 'express';
export const adminRouter = Router();

adminRouter.get('/moderation', (_req, res) => {
  res.json({
    queue: [
      { id: 'MOD-1001', type: 'profile_report', priority: 'HIGH', status: 'REVIEWING' },
      { id: 'MOD-1002', type: 'photo_review', priority: 'NORMAL', status: 'PENDING' }
    ],
    stats: { pending: 14, actioned: 83, dismissed: 21 }
  });
});
