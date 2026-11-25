# RBAC Testing & Validation Guide

## Quick Start Testing

### 1. Access RBAC Management Page

```
Navigate to: http://localhost:3000/admin/rbac
```

You should see:

- 4 role overview cards (Superadmin, Manager, Agent, Read Only)
- Permission statistics for each role
- Detailed permission matrix with expandable roles
- Interactive permission grid editor

### 2. Test Permission Matrix

- Click on any role to expand and see all permissions
- Permissions are organized by 5 categories:
  - 📋 Ticket Management
  - 👥 Staff Management
  - 🎬 Content Moderation
  - 🔐 Security & Monitoring
  - ⚙️ System Configuration

- Try toggling permissions:
  - Click checkmark to grant permission
  - Click X to deny permission
  - Changes show "unsaved changes" indicator
  - Click "Save Changes" to persist

### 3. Test Staff Autonomy Features

#### 3a. Performance Leaderboard

```
Navigate to: http://localhost:3000/staff/performance-leaderboard
```

You should see:

- Rankings table sorted by metrics (CSAT, FCR, AHT, Tickets)
- "Your Rank" card highlighting personal standing
- Team members with avatars and icons
- Improvement tips section

Try:

- Sorting by different metrics
- Viewing detailed rankings

#### 3b. Feedback Modal

```
From Staff Dashboard, click "Feedback" button
```

You should see:

- Modal with 3 feedback type options (Feature, Bug, Feedback)
- Title & description input fields
- Submit button with loading state
- Success message with reference ID
- Data saved to browser localStorage

Try:

- Selecting different feedback types
- Submitting feedback
- Checking browser console (localStorage key: "staff_feedback")

#### 3c. Tracking Transparency

```
Navigate to: http://localhost:3000/staff/tracking-transparency
```

You should see:

- 5 tracking categories with detailed information
- Data retention periods specified
- "Who can see" permissions for each category
- User rights documentation
- "What we DON'T track" section
- Data request form

Try:

- Reading through all categories
- Understanding retention periods
- Noting who has access to different data

---

## Frontend Permission Testing

### Test the `usePermission` Hook

Create a test component:

```tsx
import { usePermission } from "@/hooks/usePermission";

export function PermissionTest() {
  const { hasPermission, hasAllPermissions, userPermissions } = usePermission();

  return (
    <div className="p-6 space-y-4">
      <h2>Current User Permissions</h2>

      <div>
        <h3>All Permissions:</h3>
        <pre>{JSON.stringify(userPermissions, null, 2)}</pre>
      </div>

      <div>
        <h3>Permission Checks (should be true for mock data):</h3>
        <p>Has 'manage-roles': {String(hasPermission("manage-roles"))}</p>
        <p>Has 'delete-tickets': {String(hasPermission("delete-tickets"))}</p>
        <p>Has 'edit-staff': {String(hasPermission("edit-staff"))}</p>
      </div>

      <div>
        <h3>Multiple Permissions (OR logic):</h3>
        <p>
          Has any ticket perm:
          {String(hasPermission(["view-all-tickets", "edit-all-tickets"]))}
        </p>
      </div>

      <div>
        <h3>All Permissions (AND logic):</h3>
        <p>
          Has both manage-roles AND view-security-logs:
          {String(hasAllPermissions(["manage-roles", "view-security-logs"]))}
        </p>
      </div>
    </div>
  );
}
```

---

## Backend Permission Testing

### Test API Middleware Protection

Create test API routes:

```typescript
// /api/test/protect-single.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";

async function handler(req: NextRequest) {
  return NextResponse.json({
    message: "You have permission!",
    timestamp: new Date(),
  });
}

export const POST = requirePermission(handler, "manage-roles");
```

```typescript
// /api/test/protect-all.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAllPermissions } from "@/lib/rbac";

async function handler(req: NextRequest) {
  return NextResponse.json({
    message: "You have ALL permissions!",
    timestamp: new Date(),
  });
}

export const POST = requireAllPermissions(handler, [
  "manage-roles",
  "view-security-logs",
]);
```

Test with curl:

```bash
# Should succeed (mock user has manage-roles)
curl -X POST http://localhost:3000/api/test/protect-single

# Should succeed (mock user has both permissions)
curl -X POST http://localhost:3000/api/test/protect-all
```

### Test Denied Permission

Modify the mock permission in `/lib/rbac.ts`:

```typescript
// Temporarily remove "manage-roles" from mock user
const user: UserPayload = {
  id: "user-123",
  role: "admin",
  permissions: [
    "view-all-tickets",
    "edit-all-tickets",
    // "manage-roles",  // REMOVED FOR TESTING
    "view-security-logs",
  ],
};
```

Now the `/api/test/protect-single` endpoint should return 403 Forbidden.

---

## Validation Checklist

### Page Access & Navigation

- [ ] Admin can navigate to `/admin/rbac` from sidebar
- [ ] "Roles & RBAC" menu item visible with Lock icon
- [ ] RBAC page loads with 4 role cards
- [ ] Each role card shows users count and tier

### Permission Matrix Interaction

- [ ] Can expand/collapse roles by clicking row
- [ ] Permissions organized by 5 color-coded categories
- [ ] Can toggle permissions on/off
- [ ] "Save Changes" button appears when changes made
- [ ] Reset button works to revert changes
- [ ] Permissions persist after save

### Permission Statistics

- [ ] Each role card shows permission count
- [ ] Progress bars show percentage of permissions granted
- [ ] Superadmin shows 100% (all 24 permissions)
- [ ] Read Only shows ~8% (2 out of 24 permissions)

### Staff Autonomy Tests

#### Performance Leaderboard

- [ ] Page loads with 5 staff members
- [ ] Metrics displayed: CSAT, FCR%, AHT, Trending
- [ ] Can sort by clicking column headers
- [ ] "Your Rank" card shows highlighted personal rank
- [ ] Medals/badges display correctly
- [ ] Improvement tips section visible

#### Feedback Modal

- [ ] "Feedback" button visible on Staff Dashboard header
- [ ] Modal opens when clicking button
- [ ] Can select 3 feedback types
- [ ] Can enter title and description
- [ ] Submit button works
- [ ] Success message shows with reference ID
- [ ] Data persists in localStorage

#### Tracking Transparency

- [ ] Page loads with 5 categories
- [ ] Each category shows:
  - [ ] What data is tracked
  - [ ] Storage duration
  - [ ] Who can access
  - [ ] Example data fields
- [ ] User rights section lists all rights
- [ ] Security practices documented
- [ ] Dark mode styling works

### Permission Enforcement

- [ ] Mock user has 4 permissions in usePermission hook
- [ ] Permission checks return correct boolean values
- [ ] Multiple permission checks work (OR and AND logic)
- [ ] API middleware returns 403 when permission denied
- [ ] API middleware returns 200 when permission granted
- [ ] Audit log message appears when permission denied

---

## Common Issues & Solutions

### Issue: Permission Matrix not showing

**Solution:** Ensure all imports are correct in `/admin/rbac/page.tsx`

```typescript
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
```

### Issue: usePermission hook not found

**Solution:** Create the file at correct path:

```
/apps/web/src/hooks/usePermission.ts
```

### Issue: Modal permissions not saving

**Solution:** In `/components/staff/FeedbackModal.tsx`, check localStorage implementation:

```typescript
localStorage.setItem("staff_feedback", JSON.stringify(feedback));
```

### Issue: API middleware not working

**Solution:** Ensure middleware is properly wrapping handler:

```typescript
export const POST = requirePermission(handler, "permission-name");
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Replace mock user in `/lib/rbac.ts` with real auth integration
- [ ] Connect `/admin/rbac` page to backend API
- [ ] Implement database schema for roles & permissions
- [ ] Add permission caching with 5-10 minute TTL
- [ ] Set up audit logging for permission changes
- [ ] Implement JWT token with embedded permissions
- [ ] Create API endpoint for feedback submission
- [ ] Create admin view for submitted feedback
- [ ] Connect performance leaderboard to real metrics API
- [ ] Add email notifications for feedback submission
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Add IP whitelist for admin access (optional)
- [ ] Require re-authentication for admin operations
- [ ] Set up monitoring/alerts for permission denials
- [ ] Regular security audit of permissions

---

## Reference

### Files Created/Modified

- ✅ `/admin/rbac/page.tsx` - Main RBAC management page
- ✅ `/admin/staff/roles/page.tsx` - Detailed role configuration (enhanced)
- ✅ `/components/admin/PermissionMatrix.tsx` - Permission matrix editor
- ✅ `/hooks/usePermission.ts` - Frontend permission hook
- ✅ `/lib/rbac.ts` - Backend RBAC utilities
- ✅ `/components/admin/Sidebar.tsx` - Added RBAC nav item

### All 4 Improvements Complete

1. ✅ Performance Leaderboard - `/staff/performance-leaderboard`
2. ✅ Feedback Modal - Staff Dashboard
3. ✅ Tracking Transparency - `/staff/tracking-transparency`
4. ✅ Granular RBAC - `/admin/rbac`
