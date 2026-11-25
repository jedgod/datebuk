# Admin Authentication Integration Guide

## Current Status

✅ **Working:**

- Admin login page UI (http://localhost:3000/admin/login)
- Mock authentication (sets cookies for middleware)
- Protected route middleware
- Staff directory page loads
- Modern admin dashboard

❌ **Not Yet Integrated:**

- Real JWT token from NestJS API
- API calls to backend staff management endpoints
- Backend user database authentication

## The Problem

The admin login page currently uses **mock authentication**:

- Sets mock cookies: `dp_access`, `dp_admin`, `dp_staff`
- Token is just: `"[REMOVED_MOCK_TOKEN]-" + Date.now()`
- This works for **frontend routing** but **not for API calls**

The NestJS backend expects **real JWT tokens** from its auth system:

- Backend has proper auth at: `POST /api/auth/login`
- Uses Prisma with User database
- Issues real JWT tokens for authentication

## Solution Options

### Option 1: Use Backend API Login (Recommended)

Update the admin login to call the real backend:

```typescript
// apps/web/src/app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // Call backend API
  const backendRes = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!backendRes.ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const data = await backendRes.json();

  // Set cookies with REAL token from backend
  const response = NextResponse.json({
    success: true,
    email: data.email,
    name: data.displayName,
    role: data.role,
    token: data.accessToken, // REAL JWT TOKEN
    redirectUrl: "/admin/dashboard",
  });

  response.cookies.set("dp_access", data.accessToken);
  response.cookies.set("dp_admin", "1");
  response.cookies.set("dp_staff", "1");

  return response;
}
```

### Option 2: Create Admin Database Users

Add admin users to the backend database:

```bash
cd apps/api
# Use Prisma Studio to add users
npx prisma studio

# Or create a seed script
npx ts-node prisma/seed-admin-users.ts
```

Example admin user creation:

```typescript
// Create admin user in database
await prisma.user.create({
  data: {
    email: "[REDACTED_EMAIL]",
    password: await bcrypt.hash("[REDACTED_PASSWORD]", 10),
    displayName: "Admin User",
    profileType: "STAFF",
    isVerified: true,
    staffProfile: {
      create: {
        displayName: "Admin User",
        accountStatus: "ACTIVE",
        jobTitle: "System Administrator",
      },
    },
  },
});
```

### Option 3: Bypass Auth for Development (Not Recommended)

Only for testing - remove JWT guard temporarily:

```typescript
// apps/api/src/staff/staff.controller.ts
@Controller("admin/staff")
// REMOVE: @UseGuards(JwtAuthGuard)
export class StaffController {
  // ... endpoints will work without auth
}
```

## Implementation Steps

### Step 1: Create Admin Users in Database

```bash
cd apps/api
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const hash = await bcrypt.hash('[REDACTED_PASSWORD]', 10);
  const user = await prisma.user.create({
    data: {
      email: '[REDACTED_EMAIL]',
      password: hash,
      displayName: 'Admin User',
      profileType: 'STAFF',
      isVerified: true,
    }
  });
  console.log('Admin created:', user.email);
}

createAdmin().catch(console.error).finally(() => prisma.\$disconnect());
"
```

### Step 2: Update Frontend Login

Modify `apps/web/src/app/api/auth/login/route.ts` to use Option 1 code above.

### Step 3: Test Login Flow

```bash
# Test backend login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[REDACTED_EMAIL]","password":"[REDACTED_PASSWORD]"}'

# Should return:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "...",
#   "userId": "..."
# }
```

### Step 4: Update Auth Store

Ensure frontend auth store saves tokens correctly:

```typescript
// apps/web/src/stores/auth.ts
export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null,
  // ... rest of state

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        accessToken,
        refreshToken,
      }),
    );
  },
}));
```

## Testing Checklist

- [ ] Backend user exists in database
- [ ] Backend `/api/auth/login` returns JWT token
- [ ] Frontend login calls backend API
- [ ] JWT token is stored in cookies & localStorage
- [ ] Staff directory can fetch from `/admin/staff` with token
- [ ] Create staff button works with real API

## Current Workaround

The staff directory now shows **mock/empty data** instead of throwing network errors:

- ✅ Page loads without errors
- ✅ UI is functional
- ⚠️ No real data from API (until auth integration complete)
- ℹ️ Create staff button shows info message about pending integration

## Next Steps

1. **Choose integration approach** (Option 1 recommended)
2. **Create admin users in backend database**
3. **Update frontend login to use backend API**
4. **Test full authentication flow**
5. **Remove mock data from staff directory**
6. **Enable real API calls**

Once authentication is properly integrated, remove the mock code and uncomment the real API calls in the staff directory page.
