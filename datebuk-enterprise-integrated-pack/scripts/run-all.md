# Run All
1. `docker compose -f docker/docker-compose.yml up -d`
2. `cd apps/api && npm install && npx prisma migrate dev --schema ../../prisma/schema.prisma --name init && npm run dev`
3. `cd apps/web && npm install && npm run dev`
4. `cd apps/mobile && npm install && npx expo start`
