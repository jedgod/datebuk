# DateBuk Production Starter Pack

This pack is the next step after the multipurpose UI pack. It turns DateBuk into a more production-ready Web + Mobile + API system.

## Included
- Express backend API
- PostgreSQL-ready Prisma schema
- JWT authentication scaffold
- Ticket/support module
- Admin dashboard endpoints
- Web app pages
- Mobile app screens
- Docker Compose for PostgreSQL + backend
- Environment template

## Run Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma --name init
npm run dev
```

## Run Web
```bash
cd web
npm install
npm run dev
```

## Run Mobile
```bash
cd mobile
npm install
npx expo start
```

## Run Database with Docker
```bash
cd docker
docker compose up -d
```

Default API: `http://localhost:5000`
