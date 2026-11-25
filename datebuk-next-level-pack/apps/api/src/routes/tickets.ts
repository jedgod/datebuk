import { Router } from 'express';
export const ticketRouter = Router();
const tickets: any[] = [];

ticketRouter.post('/', (req, res) => {
  const ticket = { id: `TCK-${Date.now()}`, status: 'OPEN', priority: 'NORMAL', createdAt: new Date().toISOString(), ...req.body };
  tickets.unshift(ticket);
  res.status(201).json(ticket);
});

ticketRouter.get('/', (_req, res) => res.json(tickets));

ticketRouter.patch('/:id', (req, res) => {
  const t = tickets.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  Object.assign(t, req.body);
  res.json(t);
});
