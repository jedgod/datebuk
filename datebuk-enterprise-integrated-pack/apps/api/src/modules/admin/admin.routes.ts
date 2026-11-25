import { Router } from 'express';
export const adminRouter = Router();
adminRouter.get('/overview', (_, res) => res.json({ users:1250, reports:18, tickets:44, revenue:12840 }));
adminRouter.get('/moderation', (_, res) => res.json([{ id:'r1', reason:'Harassment', status:'OPEN' }]));
