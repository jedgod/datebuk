import { Router } from 'express';
export const matchRouter = Router();
const demoProfiles = [
  { id: 'u2', name: 'Ama', age: 27, city: 'Washington DC', interests: ['music','travel'], score: 94 },
  { id: 'u3', name: 'Sarah', age: 29, city: 'Bowie', interests: ['fitness','books'], score: 88 }
];
matchRouter.get('/recommended', (_, res) => res.json(demoProfiles));
matchRouter.post('/like', (req, res) => res.json({ matched: true, ...req.body }));
