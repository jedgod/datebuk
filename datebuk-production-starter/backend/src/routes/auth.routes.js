const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'fullName, email and password are required' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { fullName, email, passwordHash, profile: { create: {} } } });
  res.status(201).json({ id: user.id, fullName: user.fullName, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid login' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
});
module.exports = router;
