import { Router } from 'express';
export const privacyRouter = Router();

privacyRouter.get('/policy', (_, res) => {
  res.json({
    title: 'Location Privacy Policy',
    rules: [
      'Use approximate location by default.',
      'Hash IP addresses before storing.',
      'Allow users to show country only.',
      'Allow users to disable location-based matching.',
      'Use GPS only after explicit permission.'
    ]
  });
});
