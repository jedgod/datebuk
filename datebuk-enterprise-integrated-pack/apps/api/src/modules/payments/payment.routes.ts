import { Router } from 'express';
export const paymentRouter = Router();
paymentRouter.get('/plans', (_, res) => res.json([{ id:'basic', price:9.99 },{ id:'premium', price:29.99 },{ id:'elite', price:99.99 }]));
paymentRouter.post('/checkout', (req, res) => res.json({ checkoutUrl: 'https://checkout.stripe.com/demo', ...req.body }));
