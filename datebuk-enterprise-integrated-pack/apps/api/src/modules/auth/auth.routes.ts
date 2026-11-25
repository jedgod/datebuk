import { Router } from 'express';
import jwt from 'jsonwebtoken';
export const authRouter = Router();
authRouter.post('/login', (req, res) => {
  const token = jwt.sign({ email: req.body.email, role: 'USER' }, process.env.JWT_SECRET || 'dev');
  res.json({ token, user: { email: req.body.email, role: 'USER' } });
});
