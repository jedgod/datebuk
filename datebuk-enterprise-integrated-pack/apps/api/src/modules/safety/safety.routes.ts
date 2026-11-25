import { Router } from 'express';
export const safetyRouter = Router();
safetyRouter.post('/report', (req, res) => res.status(201).json({ id: crypto.randomUUID(), status: 'OPEN', ...req.body }));
safetyRouter.post('/block', (req, res) => res.json({ blocked: true, ...req.body }));
safetyRouter.get('/tips', (_, res) => res.json(['Meet in public places','Tell a trusted friend','Use DateBuk video before meeting']));
