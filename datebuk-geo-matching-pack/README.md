# DateBuk Geo-Matching + Regional Access Pack

This pack adds continent-aware matching, IP geolocation, privacy-safe location storage, travel/global mode, regional page visibility, and admin controls.

## Included
- Express API modules for IP geolocation and regional matching
- Prisma schema additions
- Web pages: Location Preferences, Regional Matches, Admin Regions
- Mobile screens: Location Preferences, Nearby/Regional Matches
- Privacy rules for approximate location storage
- Docker compose starter

## Run
```bash
cd backend
npm install
npm run dev
```

## Core Policy
Default ranking priority:
1. Same city
2. Same country
3. Same continent
4. Global matches

Users can choose:
- Same continent only
- Same country only
- Nearby only
- Global mode
- Travel mode
