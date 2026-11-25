# Staff Portal Port Assignment - Summary

## ✅ Staff Portal Now Has Its Own Port

The staff portal/interface is now assigned to **port 3002** for better organization and security.

---

## 🎯 Port Distribution

| Component           | Port | Purpose                                               |
| ------------------- | ---- | ----------------------------------------------------- |
| **User App**        | 3000 | Dating app (login, discover, messages, video calls)   |
| **Admin Dashboard** | 3001 | Admin panel (staff management, moderation)            |
| **Staff Portal**    | 3002 | Support staff interface (tickets, queues, moderation) |
| **API**             | 4000 | Backend server (auth, database, WebSockets)           |

---

## 🚀 Quick Start Commands

### Run All Three (Easiest)

```bash
pnpm run dev:app:all
```

Starts:

- API (4000)
- User (3000)
- Admin (3001)
- Staff (3002)

### Individual Ports

```bash
# User only (3000)
npm run dev

# Admin only (3001)
npm run dev:admin

# Staff only (3002)
npm run dev:staff

# Any two
npm run dev:both              # User + Admin (3000 + 3001)

# All three
npm run dev:all               # User + Admin + Staff (3000 + 3001 + 3002)
```

---

## 📋 Available Commands

### From Root

| Command                | Starts                     | Ports                  |
| ---------------------- | -------------------------- | ---------------------- |
| `pnpm run dev:app:all` | User + Admin + Staff + API | 3000, 3001, 3002, 4000 |
| `pnpm run dev:staff`   | Staff only                 | 3002                   |

### From apps/web

| Command             | Port               |
| ------------------- | ------------------ |
| `npm run dev`       | 3000               |
| `npm run dev:admin` | 3001               |
| `npm run dev:staff` | 3002               |
| `npm run dev:all`   | 3000 + 3001 + 3002 |

---

## 🌐 Access URLs

### User App (Port 3000)

```
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/discover
http://localhost:3000/messages
```

### Admin App (Port 3001)

```
http://localhost:3001/admin/login
http://localhost:3001/admin/dashboard
```

### Staff Portal (Port 3002) ⭐ **NEW**

```
http://localhost:3002/staff-login
http://localhost:3002/staff
http://localhost:3002/staff/tickets
http://localhost:3002/staff/queue
```

---

## 🔐 Port-Based Access Control

The middleware automatically routes requests based on port:

**Development (localhost):**

- All ports accessible
- Cross-port navigation works
- Middleware provides routing

**Production:**

- `/admin/*` routes → Port 3001 only
- `/staff/*` routes → Port 3002 only
- User routes → Port 3000 (preferred)
- Automatic redirects enforced

---

## 📝 What Changed

1. **apps/web/package.json**
   - ✅ Added `dev:staff` script (PORT=3002)
   - ✅ Added `start:staff` for production
   - ✅ Added `dev:all` to run all three

2. **package.json** (root)
   - ✅ Added `dev:staff` command
   - ✅ Added `dev:app:all` to run everything

3. **apps/web/middleware.ts**
   - ✅ Added staff port routing (port detection)
   - ✅ Added production port enforcement for staff
   - ✅ Staff can also access admin routes if they have admin role

---

## 🧪 Testing

### Test All Three Running

```bash
pnpm run dev:app:all
```

Then in separate browser tabs:

- User: http://localhost:3000
- Admin: http://localhost:3001
- Staff: http://localhost:3002

### Test Individual Port

```bash
cd apps/web
npm run dev:staff
```

Then access: http://localhost:3002/staff-login

---

## 🔗 Relationships

```
┌──────────────────────────────────────────────────────────┐
│                  API Server (4000)                       │
└────────┬────────────────┬────────────────┬───────────────┘
         │                │                │
    ┌────▼──────┐  ┌──────▼────┐  ┌───────▼____┐
    │ User App  │  │  Admin    │  │   Staff    │
    │ (3000)    │  │  (3001)   │  │   (3002)   │
    │           │  │           │  │            │
    │ - Login   │  │ - Admin   │  │ - Tickets  │
    │ - Browse  │  │ - Staff   │  │ - Support  │
    │ - Message │  │ - Moderate│  │ - Moderate │
    │ - Video   │  │ - Analytics
    │           │  │           │  │            │
    └───────────┘  └───────────┘  └────────────┘
         │              │              │
         └──────────────┴──────────────┘
              All connect to API
```

---

## 💡 Benefits

✅ **Clear Organization**: Each role has dedicated interface  
✅ **Scalability**: Can deploy separately to different servers  
✅ **Security**: Easier to restrict/monitor each port  
✅ **Performance**: Less resource contention  
✅ **Maintenance**: Code path cleaner, role-specific UI

---

## 🔧 Deployment

For production, deploy separately:

```bash
# User app (port 3000)
npm run build && npm run start

# Admin app (port 3001)
npm run build && npm run start:admin

# Staff app (port 3002)
npm run build && npm run start:staff
```

Or use Docker with environment variables:

```dockerfile
ENV PORT=3002
CMD npm run start:staff
```

---

## ✅ Verification Checklist

- [ ] Run `pnpm run dev:app:all`
- [ ] User accessible at http://localhost:3000
- [ ] Admin accessible at http://localhost:3001
- [ ] Staff accessible at http://localhost:3002
- [ ] API running at http://localhost:4000
- [ ] Can login on each portal
- [ ] Middleware routing works correctly
