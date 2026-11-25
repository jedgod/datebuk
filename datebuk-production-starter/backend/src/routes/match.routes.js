const router = require('express').Router();
const prisma = require('../utils/prisma');
router.get('/', async (_, res) => {
  let matches = await prisma.matchProfile.findMany({ orderBy: { matchScore: 'desc' }, take: 40 });
  if (!matches.length) {
    matches = [
      { displayName: 'Mausia', city: 'Baltimore', matchScore: 91, online: true },
      { displayName: 'Puril', city: 'Bowie', matchScore: 88, online: false },
      { displayName: 'Purthex', city: 'Washington DC', matchScore: 96, online: true }
    ];
  }
  res.json(matches);
});
module.exports = router;
