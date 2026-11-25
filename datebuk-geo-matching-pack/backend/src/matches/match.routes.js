import { Router } from 'express';
import { detectLocationFromRequest } from '../geo/geo.service.js';
import { rankProfiles } from './match.service.js';

export const matchRouter = Router();

const demoProfiles = [
  { id: 'u1', name: 'Ama', countryCode: 'GH', continent: 'Africa', city: 'Accra', baseScore: 72 },
  { id: 'u2', name: 'Maya', countryCode: 'US', continent: 'North America', city: 'Bowie', baseScore: 78 },
  { id: 'u3', name: 'Sofia', countryCode: 'GB', continent: 'Europe', city: 'London', baseScore: 81 },
  { id: 'u4', name: 'Amina', countryCode: 'NG', continent: 'Africa', city: 'Lagos', baseScore: 76 }
];

matchRouter.post('/regional', (req, res) => {
  const viewer = req.body.viewerLocation || detectLocationFromRequest(req);
  const preference = req.body.preference || { matchScope: 'SAME_CONTINENT' };
  res.json({ viewer, preference, matches: rankProfiles(viewer, demoProfiles, preference) });
});
