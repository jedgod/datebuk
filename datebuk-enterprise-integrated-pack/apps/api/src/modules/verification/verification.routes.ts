import { Router } from 'express';
export const verificationRouter = Router();
verificationRouter.get('/status', (_, res) => res.json({ email:true, phone:true, selfie:false, governmentId:false, trustScore:65 }));
verificationRouter.post('/submit', (req, res) => res.status(201).json({ status:'PENDING', ...req.body }));
