import { Router } from 'express';
export const chatRouter = Router();
chatRouter.get('/threads', (_, res) => res.json([{ id: 't1', name: 'Ama', lastMessage: 'Hi, nice to meet you!', unread: 2 }]));
chatRouter.post('/messages', (req, res) => res.status(201).json({ id: crypto.randomUUID(), ...req.body, createdAt: new Date() }));
