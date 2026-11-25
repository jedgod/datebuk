const router = require('express').Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');

router.get('/tickets', auth('ADMIN'), async (_, res) => {
  const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(tickets);
});

router.patch('/tickets/:id/status', auth('ADMIN'), async (req, res) => {
  const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  res.json(ticket);
});

router.get('/metrics', auth('ADMIN'), async (_, res) => {
  const [users, tickets, matches] = await Promise.all([
    prisma.user.count(), prisma.ticket.count(), prisma.matchProfile.count()
  ]);
  res.json({ users, tickets, matches, conversionRate: '18.4%', safetyScore: '97%' });
});
module.exports = router;
