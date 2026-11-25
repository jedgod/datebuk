# 🎯 Where to See Real-time Features Working

## Quick Answer

You have **3 ways** to see the real-time features in action:

---

## Option 1: 🧪 Create a Test Page (RECOMMENDED - 5 minutes)

Create a simple test page to see all features working together:

### Step 1: Create Test Page

Create file: `apps/web/src/pages/admin/realtime-test.tsx`

```tsx
"use client";

import React from "react";
import {
  RealtimeNotificationCenter,
  NotificationPanel,
  StaffStatusDisplay,
  OnlineStaffIndicator,
  CallMetricsDashboard,
  MetricsSummary,
  SettingsUpdateHandler,
} from "@/components/realtime";
import { useRealtimeStore } from "@/stores/realtime";
import { useRealtime } from "@/hooks/useRealtime";

export default function RealtimeTestPage() {
  const { isConnected } = useRealtime();
  const addNotification = useRealtimeStore((s) => s.addNotification);
  const updateStaffStatus = useRealtimeStore((s) => s.updateStaffStatus);
  const updateCallMetrics = useRealtimeStore((s) => s.updateCallMetrics);
  const updateSettings = useRealtimeStore((s) => s.updateSettings);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Real-time Features Test Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Test all WebSocket real-time features
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </div>
              <OnlineStaffIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
        {/* Left Column - Test Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🧪 Test Controls
            </h2>
            <div className="space-y-3">
              <button
                onClick={() =>
                  addNotification({
                    type: "report",
                    title: "New Support Ticket",
                    message: `Ticket #${Math.floor(Math.random() * 1000)} created`,
                    icon: "info",
                    dismissible: true,
                    actionUrl: "/admin/tickets",
                  })
                }
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left"
              >
                📬 Test Report Notification
              </button>

              <button
                onClick={() =>
                  updateStaffStatus({
                    staffId: `staff-${Date.now()}`,
                    staffName: `Test Staff ${Math.floor(Math.random() * 100)}`,
                    role: "Support Agent",
                    isOnline: Math.random() > 0.5,
                    lastSeen: Date.now(),
                  })
                }
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-left"
              >
                👤 Test Staff Status Update
              </button>

              <button
                onClick={() =>
                  updateCallMetrics({
                    callId: `call-${Date.now()}`,
                    jitter: Math.random() * 50,
                    latency: Math.random() * 200,
                    packetLoss: Math.random() * 5,
                    bandwidth: Math.random() * 5000,
                    quality: ["excellent", "good", "fair", "poor"][
                      Math.floor(Math.random() * 4)
                    ] as any,
                    lastUpdate: Date.now(),
                  })
                }
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-left"
              >
                📞 Test Call Metrics
              </button>

              <button
                onClick={() => {
                  updateSettings({
                    settings: {
                      maxConcurrentCalls: Math.floor(Math.random() * 10) + 5,
                      autoAssign: Math.random() > 0.5,
                      notificationSound: Math.random() > 0.5,
                    },
                    changedBy: "Admin Test",
                    timestamp: Date.now(),
                  });
                  addNotification({
                    type: "settings",
                    title: "Settings Updated",
                    message: "System settings have been broadcasted",
                    icon: "success",
                    dismissible: true,
                  });
                }}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-left"
              >
                ⚙️ Test Settings Broadcast
              </button>

              <button
                onClick={() =>
                  addNotification({
                    type: "call",
                    title: "Call Quality Alert",
                    message: "High packet loss detected on call #123",
                    icon: "warning",
                    dismissible: true,
                  })
                }
                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-left"
              >
                ⚠️ Test Quality Alert
              </button>
            </div>
          </div>

          <StaffStatusDisplay maxDisplay={5} />
        </div>

        {/* Center Column - Notifications */}
        <div className="space-y-6">
          <NotificationPanel />
          <SettingsUpdateHandler autoApply={false} />
        </div>

        {/* Right Column - Metrics */}
        <div className="space-y-6">
          <CallMetricsDashboard maxDisplay={3} />
          <MetricsSummary />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              📊 Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Connection Status:</span>
                <span className="font-semibold">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features:</span>
                <span className="font-semibold">4/4 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event Types:</span>
                <span className="font-semibold">11 Supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center (floating) */}
      <RealtimeNotificationCenter position="top-right" maxNotifications={5} />
    </div>
  );
}
```

### Step 2: Access the Test Page

Visit: `http://localhost:3000/admin/realtime-test`

### Step 3: Test the Features

Click the test buttons to see:

- ✅ **Notifications** appear in top-right corner
- ✅ **Staff status** updates in real-time
- ✅ **Call metrics** display and update
- ✅ **Settings** broadcasts shown

---

## Option 2: 📊 Integrate into Existing Dashboard

Add real-time components to your existing admin dashboard:

### Find Your Dashboard File

Look for: `apps/web/src/pages/admin/dashboard/index.tsx` or similar

### Add Components

```tsx
import {
  RealtimeNotificationCenter,
  StaffStatusDisplay,
  CallMetricsDashboard,
  OnlineStaffIndicator,
} from "@/components/realtime";

export default function AdminDashboard() {
  return (
    <div>
      {/* Your existing dashboard content */}

      {/* Add in header */}
      <header>
        <OnlineStaffIndicator />
      </header>

      {/* Add in sidebar or main content */}
      <div className="grid grid-cols-3 gap-4">
        <StaffStatusDisplay />
        <div>{/* Main content */}</div>
        <CallMetricsDashboard />
      </div>

      {/* Add notification center (global) */}
      <RealtimeNotificationCenter />
    </div>
  );
}
```

---

## Option 3: 🧑‍💻 Test with Backend API

Test by making actual API calls to trigger events:

### Step 1: Start Backend Server

```bash
cd support-platform/apps/api
npm run dev
# Listens on http://localhost:4500
```

### Step 2: Start Frontend

```bash
cd apps/web
npm run dev
# Listens on http://localhost:3000
```

### Step 3: Test API Endpoints

#### Create a Ticket (triggers `report:created`)

```bash
curl -X POST http://localhost:4500/support/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "action": "create",
    "ticket": {
      "customer": "Test User",
      "status": "Pending",
      "priority": "High",
      "notes": ["Test ticket"]
    }
  }'
```

#### Staff Login (triggers `staff:online`)

```bash
curl -X POST http://localhost:4500/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff-123",
    "staffName": "John Doe",
    "role": "Support Agent"
  }'
```

#### Send Call Metrics (triggers `call:metrics`)

```bash
curl -X POST http://localhost:4500/calls/call-123/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "jitter": 15.5,
    "latency": 45.2,
    "packetLoss": 0.3,
    "bandwidth": 2500
  }'
```

#### Broadcast Settings (triggers `settings:updated`)

```bash
curl -X POST http://localhost:4500/admin/settings/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "settings": {
      "maxConcurrentCalls": 10,
      "autoAssign": true
    }
  }'
```

---

## 🎯 Best Way to See Everything

### Quick Demo (5 minutes):

1. **Create the test page** (Option 1) - copy the code above
2. **Start backend**: `cd support-platform/apps/api && npm run dev`
3. **Start frontend**: `cd apps/web && npm run dev`
4. **Visit**: `http://localhost:3000/admin/realtime-test`
5. **Click test buttons** and watch real-time updates!

---

## 📍 File Locations Recap

### Components to Import:

```
apps/web/src/components/realtime/
├── RealtimeNotificationCenter.tsx  ✅
├── StaffStatusDisplay.tsx          ✅
├── CallMetricsDashboard.tsx        ✅
├── SettingsUpdateHandler.tsx       ✅
└── index.ts                        ✅ (exports all)
```

### Hooks to Use:

```
apps/web/src/hooks/useRealtime.ts   ✅
```

### Store:

```
apps/web/src/stores/realtime.ts     ✅
```

---

## 🔍 What You'll See

### When Testing:

1. **Notifications (Top-Right Corner)**
   - Toast-style popups
   - Color-coded by type
   - Auto-dismiss after 10s
   - Clickable actions

2. **Staff Status (Left Panel)**
   - Online/offline indicators
   - Green dot = online
   - Gray dot = offline
   - Real-time updates

3. **Call Metrics (Right Panel)**
   - Latency bars
   - Jitter visualization
   - Packet loss %
   - Quality badges

4. **Settings Handler (Center)**
   - Blue notification box
   - Shows changed settings
   - Apply/dismiss buttons

---

## 🚀 Next Steps

1. **Create test page** using code above
2. **Start both servers** (backend + frontend)
3. **Click test buttons** to see real-time updates
4. **Check browser console** for connection logs
5. **Integrate into real dashboard** when ready

---

## 📚 Full Documentation

- **Integration Guide**: `apps/web/FRONTEND_REALTIME_INTEGRATION.md`
- **Quick Reference**: `apps/web/QUICK_REFERENCE.md`
- **System Summary**: `SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **Backend Details**: `support-platform/BACKEND_INTEGRATION_COMPLETE.md`

---

**Need Help?** Check the console for WebSocket connection status and event logs!
