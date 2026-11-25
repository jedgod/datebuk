# Quick Fix for Chat Not Working

## Problem

Windows PostgreSQL service is running on port 5432, preventing the backend from connecting to the Docker PostgreSQL database.

## Solution Options

### Option 1: Stop Windows PostgreSQL (Requires Admin)

```powershell
# Right-click PowerShell → Run as Administrator
Stop-Service postgresql-x64-18
Set-Service postgresql-x64-18 -StartupType Disabled
```

### Option 2: Use Docker Host Network (Temporary Fix)

Since `docker exec` works but `localhost:5432` doesn't connect to Docker, the Windows PostgreSQL is intercepting.

**Quick Test:**

```powershell
# Test which PostgreSQL responds
$result = Invoke-SqlCmd -Query "SELECT version()" -ServerInstance "localhost" -Database "postgres" -Username "postgres" -Password "postgres" -ErrorAction SilentlyContinue

# If this shows PostgreSQL 18, that's the Windows one (wrong!)
# If this shows PostgreSQL 16, that's Docker (correct!)
```

### Option 3: Restart Computer (Easiest)

This will stop the Windows PostgreSQL service and allow Docker to bind to port 5432 properly.

1. Restart computer
2. Start Docker Desktop
3. Run: `docker-compose up -d`
4. Start backend: `cd support-platform/apps/api && npm run dev`
5. Test chat again

## Current Status

✅ Database migration applied (ChatMessage & ChatSession tables exist)
✅ Prisma client generated
✅ Frontend code fixed with better error handling  
✅ Backend server running
❌ Backend can't connect to database (port conflict)

## What's Happening Now

1. Frontend opens chat → Calls `http://localhost:4500/chat/sessions`
2. Backend receives request → Tries to create session via Prisma
3. Prisma tries to connect to `postgres://localhost:5432`
4. **Windows PostgreSQL (port 5432) responds instead of Docker**
5. Windows PostgreSQL rejects connection (wrong password/database)
6. Backend returns error: "Failed to create chat session"
7. Frontend shows error message to user

## Current Error in Backend Console

```
[Chat] Error creating session: PrismaClientInitializationError:
Authentication failed against database server at `localhost`
```

This confirms Windows PostgreSQL is responding instead of Docker.

## Immediate Fix

**Restart your computer**, then:

```powershell
# Start Docker
docker ps

# Should see datepage_wb-mb-db-1 running on port 5432

# Start backend
cd support-platform/apps/api
npm run dev

# Test chat at http://localhost:3000/contact
```

Chat should now work!
