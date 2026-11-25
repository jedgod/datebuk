# 🔧 Chat Not Working - Troubleshooting Guide

## Problem: Send button not working in live chat

### Quick Diagnosis

Open the browser console (F12) and look for error messages when clicking the send button. Common errors:

1. **"Failed to fetch"** → Backend server not running
2. **"CORS error"** → CORS misconfiguration (unlikely since we have `origin: true`)
3. **"P1000: Authentication failed"** → Database not running or wrong credentials
4. **"404 Not Found"** → Endpoint doesn't exist (migration not applied)
5. **Network error** → Wrong URL or port

---

## ✅ Quick Fix Checklist

### Step 1: Check if Backend is Running

```bash
# In terminal, test if backend responds
curl http://localhost:4500/health

# If error, start the backend:
cd support-platform/apps/api
npm run dev
```

**Expected output:** Backend should start on port 4500

---

### Step 2: Check if Database is Running

```bash
# Check Docker containers
docker ps

# Should see these containers running:
# - datepage_wb-mb-db-1 (PostgreSQL)
# - datepage_wb-mb-redis-1 (Redis)
```

**If not running:**

```bash
docker-compose up -d
```

---

### Step 3: Apply Database Migration

```bash
cd support-platform/apps/api

# Apply migration
npx prisma migrate deploy

# Or directly with SQL if Prisma fails
docker exec -i datepage_wb-mb-db-1 psql -U postgres -d datepage < prisma/migrations/0002_add_chat/migration.sql
```

---

### Step 4: Generate Prisma Client

```bash
cd support-platform/apps/api
npx prisma generate
```

---

### Step 5: Test Chat API Manually

Open the test page in your browser:

```
file:///C:/Users/cj_wo/OneDrive/Desktop/datePage_Wb-Mb/test-chat.html
```

This interactive test page will:

1. ✅ Check backend connection
2. ✅ Create chat session
3. ✅ Send test messages
4. ✅ Retrieve chat history

**OR** use curl:

```bash
# 1. Create session
curl -X POST http://localhost:4500/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@example.com","userName":"Test User"}'

# Response: {"success":true,"session":{"id":"abc-123","status":"active"}}

# 2. Send message (replace SESSION_ID)
curl -X POST http://localhost:4500/chat/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"sender":"user","message":"Hello!","senderEmail":"test@example.com"}'

# 3. Get chat history
curl http://localhost:4500/chat/sessions/SESSION_ID/messages
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "TypeError: Failed to fetch"

**Cause:** Backend server not running on port 4500

**Solution:**

```bash
cd support-platform/apps/api
npm run dev
```

Should see:

```
[Realtime] Emitter initialized
Support API running on port 4500
```

---

### Issue 2: "P1000: Authentication failed against database"

**Cause:** Database not running or wrong password

**Solution:**

```bash
# Check database container
docker ps | grep postgres

# If not running:
docker-compose up -d db

# Test connection
docker exec datepage_wb-mb-db-1 psql -U postgres -d datepage -c "SELECT 1"
```

---

### Issue 3: "Cannot find module '@prisma/client'"

**Cause:** Prisma client not generated

**Solution:**

```bash
cd support-platform/apps/api
npx prisma generate
npm install
```

---

### Issue 4: Table "ChatMessage" does not exist

**Cause:** Migration not applied

**Solution:**

```bash
cd support-platform/apps/api

# Check what migrations exist
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Or manually run SQL
docker exec -i datepage_wb-mb-db-1 psql -U postgres -d datepage < prisma/migrations/0002_add_chat/migration.sql
```

---

### Issue 5: Chat button doesn't do anything

**Cause:** JavaScript error preventing click handler

**Solution:**

1. Open browser console (F12)
2. Look for red errors
3. Check if `useRealtime` hook loaded correctly
4. Verify all imports exist

---

### Issue 6: Message sends but no response appears

**Cause:** WebSocket not connected or auto-response failing

**Check:**

- Browser console for WebSocket connection logs
- Backend console for incoming messages
- Network tab for API calls

**Solution:**
The auto-response is just a simulation. Real responses would come via WebSocket from staff. This is expected behavior.

---

## 📊 Verify Everything is Working

### Test Sequence:

1. **Start Services**

   ```bash
   # Terminal 1: Backend
   cd support-platform/apps/api
   npm run dev

   # Terminal 2: Frontend
   cd apps/web
   npm run dev
   ```

2. **Open Frontend**

   ```
   http://localhost:3000/contact
   ```

3. **Open Browser Console** (F12 → Console tab)

4. **Click "Live Chat"**
   - Should see: `[Chat] Calling API: http://localhost:4500/chat/sessions`
   - Should see: Welcome message appear

5. **Type and send message**
   - Should see: `[Chat] Sending message: your message`
   - Should see: `[Chat] Response status: 200`
   - Should see: `[Chat] Message sent successfully`
   - Message bubble appears immediately
   - Auto-response appears after 2 seconds

---

## 🎯 Expected Console Output

**When opening chat:**

```
[Chat] Calling API: http://localhost:4500/chat/sessions
[Chat] Response status: 200
Session created: abc-123-def-456
```

**When sending message:**

```
[Chat] Sending message: Hello!
[Chat] Calling API: http://localhost:4500/chat/sessions/abc-123/messages
[Chat] Response status: 200
[Chat] Message sent successfully: {id: "msg-789", ...}
```

---

## 🔍 Debugging with Browser DevTools

### Network Tab:

1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Look for:
   - `POST /chat/sessions/xxx/messages`
   - Status should be `200 OK`
   - Response should be `{"success":true,...}`

### Console Tab:

- All `[Chat]` logs should appear
- No red errors should appear
- If errors, they'll tell you exactly what's wrong

---

## 📝 What Changed in Latest Update

1. **Added error handling**: Now shows error messages in chat UI
2. **Added loading state**: Send button shows spinner while sending
3. **Added console logging**: All API calls logged with `[Chat]` prefix
4. **Added disabled state**: Input and button disabled while sending
5. **Added error recovery**: Failed messages removed, text restored to input
6. **Fixed accessibility**: All buttons and inputs now have proper labels

---

## 🚀 Full Restart (Nuclear Option)

If nothing works, try this:

```bash
# 1. Stop everything
docker-compose down
# Kill any running npm processes

# 2. Restart Docker
docker-compose up -d

# 3. Apply migrations
cd support-platform/apps/api
npx prisma generate
npx prisma migrate deploy

# 4. Start backend
npm run dev

# 5. In another terminal, start frontend
cd ../../apps/web
npm run dev

# 6. Open http://localhost:3000/contact
# 7. Try chat again
```

---

## 💡 Still Not Working?

### Share this info:

1. **Browser console output** (F12 → Console → screenshot)
2. **Network tab** (F12 → Network → filter: chat → screenshot)
3. **Backend console output** (terminal where backend is running)
4. **Docker status**: `docker ps`
5. **Migration status**: `cd support-platform/apps/api && npx prisma migrate status`

This will help diagnose the exact issue!
