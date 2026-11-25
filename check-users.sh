#!/bin/bash
cd apps/api
pnpm exec prisma db execute --stdin << 'SQL'
SELECT email, "displayName" FROM "User" LIMIT 10;
SQL
