# Dashboard Alignment Report: Admin vs Staff

**Date:** February 19, 2026  
**Status:** Alignment analysis - some inconsistencies found

---

## 1. LAYOUT & ARCHITECTURE

### ✅ **ALIGNED**

- Both use sidebar navigation pattern
- Both have header with utilities (search, notifications, logout)
- Both support responsive design

### ❌ **MISALIGNED**

| Aspect                     | Admin Dashboard                     | Staff Dashboard                             | Issue                             |
| -------------------------- | ----------------------------------- | ------------------------------------------- | --------------------------------- |
| **Layout Wrapper**         | `DashboardLayout` component wrapper | Integrated in `StaffDashboard`              | Inconsistent abstraction levels   |
| **Sidebar Implementation** | Custom `Sidebar.tsx`                | Custom `AppSidebar.tsx` using UI components | Different sidebar components      |
| **Mobile Navigation**      | `MobileNav.tsx` component           | No dedicated mobile nav found               | Admin has explicit mobile support |
| **Theme Support**          | Uses `dark:` classes directly       | Uses UI component theming                   | Different theme implementation    |

---

## 2. NAVIGATION ITEMS COMPARISON

### Admin Navigation (15 items total)

**Main Navigation (11 items):**

- Overview (Dashboard)
- IP Monitoring
- Risk Scores
- Fraud Events
- Moderator Queue
- Support Tickets
- Live Support
- User Lookup
- Staff Management
- Staff Notes
- Experiments

**Video Monitor Section (4 items):**

- Admin Push
- Admin Sessions
- Admin Quarantine
- Video Date Controls

### Staff Navigation (10 items total)

**Main Navigation (5 items):**

- My Queue (Dashboard)
- All Tickets
- Users Search
- Live Chats
- Reports

**Video Monitor Section (5 items):**

- Moderation Dashboard
- Admin Push
- Admin Sessions
- Admin Quarantine
- Settings

### 🔄 **Video Monitor Alignment**

| Feature             | Admin                           | Staff                                | Status          |
| ------------------- | ------------------------------- | ------------------------------------ | --------------- |
| Admin Push          | ✅ `/admin/push`                | ✅ `/staff/video-monitor/push`       | ✅ BOTH HAVE    |
| Admin Sessions      | ✅ `/admin/sessions`            | ✅ `/staff/video-monitor/sessions`   | ✅ BOTH HAVE    |
| Admin Quarantine    | ✅ `/admin/quarantine`          | ✅ `/staff/video-monitor/quarantine` | ✅ BOTH HAVE    |
| Video Date Controls | ✅ `/admin/video-date/settings` | ❌ MISSING                           | ⚠️ MISALIGNMENT |

### ⚠️ **Staff Missing Feature:**

- Staff Dashboard lacks **Video Date Controls/Settings** that Admin has

---

## 3. HEADER UTILITIES & CONTROLS

### Admin Dashboard Header

```
[Left] Gradient title with subtitle
[Right]
  - Notifications (Bell button)
  - Add Staff (Link button - amber gradient)
  - Settings/Profile (implied in sidebar)
```

### Staff Dashboard Header

```
[Left] Search bar (Tickets/Customers)
[Center] Empty
[Right]
  - Notifications (Bell with badge count)
  - Avatar + Fallback
  - Logout button
  - New Ticket FAB (floating action button)
```

### 🔴 **CRITICAL MISALIGNMENT**

| Control            | Admin             | Staff                    | Issue                                 |
| ------------------ | ----------------- | ------------------------ | ------------------------------------- |
| **Search**         | Missing in header | ✅ Present               | Admin needs ticket/user search        |
| **Notifications**  | ✅ Bell button    | ✅ Bell with badge count | Staff has better notification display |
| **Add/Create**     | "Add Staff" link  | "New Ticket" FAB         | Different paradigms                   |
| **Logout**         | In sidebar        | In header topbar         | Inconsistent placement                |
| **Profile/Avatar** | Missing           | ✅ Avatar in header      | Admin needs profile display           |

---

## 4. MAIN CONTENT AREA

### Admin Dashboard

- **Layout:** Multi-section cards
- **Sections:**
  - Key Metrics (4 stat cards)
  - Quick Actions (4 action cards)
  - Admin Features Hub (8 feature cards in grid)
  - Recent Activity (activity list)
  - Staff Overview (staff metrics)
- **Content Type:** Overview/monitoring focus

### Staff Dashboard

- **Layout:** Two-column (main + sidebar)
- **Sections:**
  - Stats Cards (3 metrics: open tickets, AHT, CSAT)
  - My Queue (ticket table)
  - Customer Panel (right sidebar - ticket details)
- **Content Type:** Task management/queue focus

### ✅ **THEME SUPPORT**

- Both use: `bg-white dark:bg-slate-800`
- Both use: Tailwind dark mode
- ✅ **ALIGNED**

---

## 5. STAT CARDS & METRICS

### Admin Metrics (4 cards)

1. Total Users (2,847)
2. Active Staff (24)
3. Platform Health (99.9%)
4. Security Score (95/100)

### Staff Metrics (3 cards)

1. Open Tickets (42)
2. AHT - Average Handle Time (5m 23s)
3. CSAT - Customer Satisfaction (92%)

### ❌ **MISALIGNMENT**

- Admin shows **platform-level** metrics
- Staff shows **personal queue** metrics
- No overlap in KPIs shown
- **Recommendation:** Add shared platform metrics to Staff dashboard (platform health, security)

---

## 6. ACTION BUTTONS & CONTROLS

### Admin Quick Actions

```tsx
[4 Quick Action Cards aligned in grid]
- Staff Management
- Support Tickets
- Live Support
- User Lookup
```

### Staff Quick Actions

```tsx
[2 Interactive Controls]
- New Ticket button (in header toolbar)
- New Ticket FAB (floating bottom-right)
```

### ⚠️ **ISSUE IDENTIFIED**

1. **Duplication:** Staff has TWO "New Ticket" buttons (header + FAB)
2. **Inconsistency:** Admin uses card grid pattern, Staff uses inline buttons
3. **Missing in Staff:** No quick-access cards for common tasks

---

## 7. ICON & COLOR CONSISTENCY

### Admin Icons Used

```
Users, UserCog, Shield, TrendingUp, AlertCircle, CheckCircle,
Clock, Activity, BarChart3, UserPlus, Settings, Bell,
Search, ArrowUpRight, MessageSquare
```

### Staff Icons Used

```
Bell, Plus, Search, LogOut, BarChart2, LayoutList, LayoutDashboard,
MessageSquare, Settings, Ticket, Users, Circle, ArrowRight,
Activity, Send, AlertTriangle
```

### 🔴 **INCONSISTENCY**

- **BarChart** used as: `BarChart3` (Admin) vs `BarChart2` (Staff)
- **Activity** icon used for both but different meanings
- **Settings** icon used but inconsistent placement

**Recommendation:** Standardize icon usage across both dashboards

---

## 8. LOGOUT FUNCTIONALITY

### Admin Logout

- Location: Sidebar bottom
- Behavior: `performLogout({ logout, router, redirectTo: '/admin/login', ... })`
- Integration: Through sidebar menu

### Staff Logout

- Location: Header topbar (right side)
- Behavior: `performLogout({ logout: () => {}, router, redirectTo: '/admin/staff/login', ... })`
- Integration: Inline button with icon

### ✅ **FUNCTION ALIGNED** but **UI PLACEMENT DIFFERS**

---

## 9. RESPONSIVE BEHAVIOR

### Admin

- ✅ Desktop sidebar with toggle
- ✅ Mobile nav component (`MobileNav.tsx`)
- ✅ Sidebar collapse states
- ✅ Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

### Staff

- ✅ Uses UI `Sidebar` component
- ❓ Mobile responsiveness unclear
- ⚠️ Right panel for customer details may not collapse on mobile

### ⚠️ **POTENTIAL ISSUE**

Staff dashboard right panel (CustomerPanel) may break on mobile screens

---

## 10. FEATURE CARDS DISPLAY

### Admin (8 Feature Cards)

Organized in 4-column grid with:

- Icon + Title
- Description
- Stats badge
- Hover effects
- Link navigation

### Staff (None)

No feature cards displayed in main dashboard

### ❌ **MISALIGNMENT**

- Admin provides task discovery through feature cards
- Staff provides task discovery through sidebar nav only
- Recommendation: Add similar feature cards to Staff dashboard

---

## SUMMARY OF FINDINGS

### ✅ **WELL-ALIGNED Areas**

1. ✅ Sidebar navigation pattern
2. ✅ Header utilities (search, notifications)
3. ✅ Dark/light theme support
4. ✅ Responsive layout awareness
5. ✅ Logout functionality (behavior)
6. ✅ Video monitoring features (Push, Sessions, Quarantine)

### ❌ **MISALIGNED Areas**

1. ❌ Video Date Controls missing from Staff dashboard
2. ❌ Header controls placement (search, logout positioning)
3. ❌ Profile/Avatar display in header
4. ❌ Stat cards metrics (different KPIs)
5. ❌ Action button patterns (cards vs FAB)
6. ❌ Mobile navigation implementation
7. ❌ Feature discovery approach (cards vs sidebar only)
8. ❌ Icon standardization
9. ❌ Layout wrapper abstraction level (DashboardLayout vs integrated)
10. ❌ Duplicate New Ticket buttons in Staff dashboard

---

## RECOMMENDATIONS

### **Priority 1: Critical** 🔴

1. Add **Video Date Controls** to Staff dashboard navigation
2. Move logout button consistency (decision: header OR sidebar)
3. Add profile/avatar display to both dashboards consistently
4. Remove duplicate "New Ticket" button from Staff dashboard

### **Priority 2: Important** 🟡

1. Standardize stat cards - consider adding shared platform metrics to Staff
2. Add feature discovery cards to Staff dashboard (similar to Admin)
3. Implement consistent icon usage across both dashboards
4. Add platform health indicator to Staff dashboard

### **Priority 3: Nice-to-have** 🟢

1. Refactor layout abstraction for consistency (both use DashboardLayout pattern)
2. Document shared component library for both dashboards
3. Add breadcrumb navigation to both dashboards
4. Implement consistent search placement (header vs sidebar)

---

## FILES INVOLVED

### Admin Dashboard

- `/app/(admin)/admin/dashboard/page.tsx` - Main page (571 lines)
- `/components/admin/DashboardLayout.tsx` - Layout wrapper
- `/components/admin/Sidebar.tsx` - Navigation sidebar (287 lines)
- `/components/admin/MobileNav.tsx` - Mobile navigation

### Staff Dashboard

- `/app/(admin)/staff/page.tsx` - Routes to StaffDashboard
- `/components/staff/StaffDashboard.tsx` - Main component (237 lines)
- `/components/staff/AppSidebar.tsx` - Navigation sidebar (334 lines)
- `/components/staff/StatsCards.tsx` - Stats component
- `/components/staff/TicketTable.tsx` - Ticket grid
- `/components/staff/CustomerPanel.tsx` - Right panel
