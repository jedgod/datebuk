import { Router } from 'express';
import { z } from 'zod';

export const paymentRouter = Router();

const checkoutSchema = z.object({
  userId: z.string(),
  plan: z.enum(['free', 'basic', 'premium', 'elite']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly')
});

paymentRouter.post('/checkout', (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json({
    checkoutSessionId: `cs_${Date.now()}`,
    checkoutUrl: 'https://payments.example.com/datebuk-checkout',
    ...parsed.data
  });
});

paymentRouter.get('/plans', (_req, res) => {
  res.json([
    { plan: 'free', price: 0, features: ['Basic profile', 'Limited likes'] },
    { plan: 'basic', price: 9.99, features: ['More likes', 'Profile visitors'] },
    { plan: 'premium', price: 19.99, features: ['Boosts', 'Smart Match AI', 'Video dating'] },
    { plan: 'elite', price: 39.99, features: ['Priority visibility', 'Advanced analytics', 'VIP support'] }
  ]);
});
