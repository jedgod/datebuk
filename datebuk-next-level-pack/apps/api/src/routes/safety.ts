import { Router } from 'express';
export const safetyRouter = Router();

safetyRouter.get('/center', (_req, res) => {
  res.json({
    safetyScore: 92,
    modules: ['Identity Verification', 'Report User', 'Blocked Users', 'Privacy Controls', 'Emergency Contact'],
    alerts: []
  });
});

safetyRouter.post('/report', (req, res) => {
  res.status(201).json({ id: `RPT-${Date.now()}`, status: 'PENDING', ...req.body });
});
