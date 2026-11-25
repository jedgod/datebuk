import { Router } from 'express';
import { z } from 'zod';
import { scoreMatch } from '../services/aiMatch';

export const matchRouter = Router();
const schema = z.object({
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  lifestyle: z.array(z.string()),
  candidate: z.object({ interests: z.array(z.string()), goals: z.array(z.string()), lifestyle: z.array(z.string()) })
});

matchRouter.post('/score', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(scoreMatch(parsed.data));
});
