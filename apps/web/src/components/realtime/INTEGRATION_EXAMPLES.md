/**
 * Real-time Features Integration Guide
 * Shows how to integrate real-time components into your app
 */

// ============ BASIC SETUP ============

// 1. Add RealtimeNotificationCenter to your layout (app.tsx or layout.tsx)
import { RealtimeNotificationCenter } from '@/components/realtime';
import { useRealtime } from '@/hooks/useRealtime';

export default function RootLayout() {
  return (
    <html>
      <body>
        {/* Your content */}
        
        {/* Add notification center - shows real-time notifications */}
        <RealtimeNotificationCenter position="top-right" maxNotifications={5} />
      </body>
    </html>
  );
}

// ============ DASHBOARD INTEGRATION ============

// 2. Dashboard page with all real-time features
import {
  RealtimeNotificationCenter,
  NotificationPanel,
  StaffStatusDisplay,
  OnlineStaffIndicator,
  CallMetricsDashboard,
  MetricsSummary,
  SettingsUpdateHandler,
} from '@/components/realtime';

export default function SupportDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left Column - Staff & Settings */}
      <div className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <StaffStatusDisplay maxDisplay={10} />
          <SettingsUpdateHandler autoApply={true} />
        </div>
      </div>

      {/* Center Column - Main Content */}
      <div className="col-span-1"></div>

      {/* Right Column - Notifications & Calls */}
      <div className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <NotificationPanel />
          
          <CallMetricsDashboard maxDisplay={5} />
          <MetricsSummary />
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENT-LEVEL INTEGRATION ============

// 3. Use in specific components
import { useRealtime, useStaffStatus, useCallMetrics } from '@/hooks/useRealtime';
import { useOnlineStaff, useNotifications } from '@/stores/realtime';

function TicketCard({ ticketId, assignedStaffId, callId }: any) {
  // Get staff status
  const staffStatus = useStaffStatus(assignedStaffId);
  
  // Get call metrics if there's an active call
  const callMetrics = useCallMetrics(callId);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Ticket #{ticketId}</h3>
      
      {/* Show staff status */}
      {staffStatus && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${staffStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {staffStatus.staffName} ({staffStatus.isOnline ? 'Online' : 'Offline'})
          </span>
        </div>
      )}

      {/* Show call quality */}
      {callMetrics && (
        <div className="flex items-center gap-2 text-sm">
          <span>Call Quality:</span>
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
            callMetrics.quality === 'excellent' ? 'bg-green-100 text-green-700' :
            callMetrics.quality === 'good' ? 'bg-blue-100 text-blue-700' :
            callMetrics.quality === 'fair' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {callMetrics.quality}
          </span>
        </div>
      )}
    </div>
  );
}

// ============ CUSTOM HOOK USAGE ============

// 4. Listen to specific events with custom handler
import { useRealtimeEvent } from '@/hooks/useRealtime';

function CustomComponent() {
  // Subscribe to report creation events
  useRealtimeEvent('report:created', (payload) => {
    console.log('New report:', payload);
    // Do something with the data
  });

  // Subscribe to staff status changes
  useRealtimeEvent('staff:online', (payload) => {
    console.log('Staff online:', payload.staffName);
  });

  return <div>Component with custom real-time handlers</div>;
}

// ============ STORE USAGE ============

// 5. Direct store access for fine-grained control
import { useRealtimeStore } from '@/stores/realtime';

function AdvancedComponent() {
  const {
    notifications,
    addNotification,
    removeNotification,
    staffStatusMap,
    callMetricsMap,
    isConnected,
    processEvent,
  } = useRealtimeStore();

  const handleCustomNotification = () => {
    addNotification({
      type: 'system',
      title: 'Custom Alert',
      message: 'This is a custom notification',
      icon: 'info',
      dismissible: true,
    });
  };

  return (
    <div className="space-y-4">
      <button onClick={handleCustomNotification}>
        Show Notification
      </button>

      <div>
        <h3>Online Staff: {Array.from(staffStatusMap.values()).filter(s => s.isOnline).length}</h3>
        <h3>Active Calls: {callMetricsMap.size}</h3>
        <h3>Connection: {isConnected ? '✓ Connected' : '✗ Disconnected'}</h3>
      </div>
    </div>
  );
}

// ============ ADMIN SETTINGS BROADCAST ============

// 6. Admin settings broadcast example
import { useRealtimeStore } from '@/stores/realtime';

async function broadcastSettings(settings: Record<string, any>) {
  try {
    const response = await fetch('/api/admin/settings/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings,
        category: 'general',
      }),
    });

    if (!response.ok) throw new Error('Failed to broadcast');
    console.log('Settings broadcasted successfully');
  } catch (error) {
    console.error('Error broadcasting settings:', error);
  }
}

// ============ CALL METRICS TRACKING ============

// 7. Send call metrics from recording stream
async function updateCallMetrics(callId: string) {
  // Collect metrics from WebRTC connection
  const metrics = {
    jitter: 15.5,
    latency: 45.2,
    packetLoss: 0.3,
    bandwidth: 2500,
  };

  try {
    const response = await fetch(`/api/calls/${callId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) throw new Error('Failed to update metrics');
  } catch (error) {
    console.error('Error updating call metrics:', error);
  }
}

// ============ MODAL WITH REAL-TIME STATUS ============

// 8. Modal showing real-time staff status
import { Modal } from '@/components/ui';
import { StaffStatusDisplay } from '@/components/realtime';

export function StaffSelectionModal({ onSelect }: { onSelect: (staffId: string) => void }) {
  return (
    <Modal title="Select Support Staff">
      <div className="space-y-4">
        <StaffStatusDisplay showOnlineOnly={true} maxDisplay={10} />
        
        <p className="text-sm text-gray-600">
          Showing only available online staff members. Select to assign ticket.
        </p>
      </div>
    </Modal>
  );
}

// ============ HEADER STATUS BAR ============

// 9. Header with quick status indicators
import { OnlineStaffIndicator, NotificationBadge } from '@/components/realtime';

export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold">Support Platform</h1>
      
      <div className="flex items-center gap-4">
        <OnlineStaffIndicator />
        
        <div className="relative">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            🔔
            <NotificationBadge />
          </button>
        </div>
      </div>
    </header>
  );
}

// ============ MOBILE SIDEBAR ============

// 10. Mobile sidebar with real-time info
import { StaffQuickList } from '@/components/realtime';

export function MobileSidebar() {
  return (
    <div className="bg-white border-r border-gray-200 w-64 p-4 space-y-4">
      <StaffQuickList />
      
      <div className="border-t pt-4">
        {/* Other sidebar content */}
      </div>
    </div>
  );
}

// ============ TESTING COMPONENTS ============

// 11. Test real-time functionality
import { useRealtimeStore } from '@/stores/realtime';

export function RealtimeTestPanel() {
  const addNotification = useRealtimeStore((s) => s.addNotification);
  const updateStaffStatus = useRealtimeStore((s) => s.updateStaffStatus);
  const updateCallMetrics = useRealtimeStore((s) => s.updateCallMetrics);

  return (
    <div className="space-y-2 p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold">Real-time Test Panel</h3>
      
      <button
        onClick={() => addNotification({
          type: 'report',
          title: 'Test Notification',
          message: 'This is a test notification',
          icon: 'info',
          dismissible: true,
        })}
        className="block w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50"
      >
        Add Test Notification
      </button>

      <button
        onClick={() => updateStaffStatus({
          staffId: 'test-staff-1',
          staffName: 'Test Staff',
          role: 'Support',
          isOnline: true,
          lastSeen: Date.now(),
        })}
        className="block w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50"
      >
        Update Staff Status
      </button>

      <button
        onClick={() => updateCallMetrics({
          callId: 'test-call-1',
          jitter: Math.random() * 30,
          latency: Math.random() * 200,
          packetLoss: Math.random() * 5,
          bandwidth: Math.random() * 5000,
          quality: 'good',
          lastUpdate: Date.now(),
        })}
        className="block w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50"
      >
        Update Call Metrics
      </button>
    </div>
  );
}

// Export example components for documentation
export {
  TicketCard,
  CustomComponent,
  AdvancedComponent,
  StaffSelectionModal,
  MainHeader,
  MobileSidebar,
  RealtimeTestPanel,
  broadcastSettings,
  updateCallMetrics,
};
