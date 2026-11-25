import { Router } from 'express';
export const adminRegionRouter = Router();
let rules = [];
adminRegionRouter.get('/', (_, res) => res.json({ rules }));
adminRegionRouter.post('/', (req, res) => {
  const rule = { id: crypto.randomUUID?.() || String(Date.now()), ...req.body, createdAt: new Date().toISOString() };
  rules.push(rule);
  res.status(201).json(rule);
});
