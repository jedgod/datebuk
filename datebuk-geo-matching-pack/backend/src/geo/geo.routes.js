import { Router } from 'express';
import { detectLocationFromRequest } from './geo.service.js';

export const geoRouter = Router();

geoRouter.get('/detect', (req, res) => {
  const location = detectLocationFromRequest(req);
  res.json({ location, notice: 'Approximate IP location detected for regional matching.' });
});

geoRouter.post('/preferences', (req, res) => {
  const allowed = ['NEARBY', 'SAME_COUNTRY', 'SAME_CONTINENT', 'GLOBAL'];
  const matchScope = allowed.includes(req.body.matchScope) ? req.body.matchScope : 'SAME_CONTINENT';
  res.json({ saved: true, preference: { ...req.body, matchScope } });
});
