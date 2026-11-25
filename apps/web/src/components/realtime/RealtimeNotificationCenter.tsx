'use client';

/**
 * RealtimeNotificationCenter Component
 * Displays real-time notifications from WebSocket events
 */

import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const SafeX = X as any;
const SafeAlertCircle = AlertCircle as any;
const SafeCheckCircle = CheckCircle as any;
const SafeInfo = Info as any;
const SafeAlertTriangle = AlertTriangle as any;
import { useNotifications, useRealtimeStore } from '@/stores/realtime';
import { useRealtime } from '@/hooks/useRealtime';

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  icon: 'info' | 'success' | 'warning' | 'error';
  onDismiss: (id: string) => void;
  actionUrl?: string;
}

function NotificationItem({ id, title, message, icon, onDismiss, actionUrl }: NotificationItemProps) {
  const iconMap = {
    info: <SafeInfo className="w-5 h-5 text-blue-500" />,
    success: <SafeCheckCircle className="w-5 h-5 text-green-500" />,
    warning: <SafeAlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <SafeAlertCircle className="w-5 h-5 text-red-500" />,
  };

  const bgColorMap = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  };

  const textColorMap = {
    info: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    error: 'text-red-900',
  };

  const content = (
    <div className="flex gap-3 w-full">
      <div className="flex-shrink-0">{iconMap[icon]}</div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm ${textColorMap[icon]}`}>{title}</h3>
        <p className={`text-sm mt-1 ${textColorMap[icon]} opacity-90`}>{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className={`flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors`}
      >
        <SafeX className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div
      className={`border rounded-lg p-3 shadow-md animate-slideIn transition-all duration-300 hover:shadow-lg ${bgColorMap[icon]}`}
    >
      {actionUrl ? (
        <a href={actionUrl} className="block hover:opacity-80">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

interface RealtimeNotificationCenterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

export function RealtimeNotificationCenter({
  position = 'top-right',
  maxNotifications = 5,
}: RealtimeNotificationCenterProps) {
  const notifications = useNotifications();
  const removeNotification = useRealtimeStore((s) => s.removeNotification);

  // Initialize WebSocket connection
  useRealtime({
    enabled: true,
    autoSubscribeAll: true,
  });

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const displayedNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm w-full pointer-events-none`}>
      {displayedNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            id={notification.id}
            title={notification.title}
            message={notification.message}
            icon={notification.icon}
            actionUrl={notification.actionUrl}
            onDismiss={removeNotification}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Toast-style notification component for quick displays
 */
export function NotificationToast() {
  return <RealtimeNotificationCenter position="top-right" maxNotifications={3} />;
}

/**
 * Badge to show notification count
 */
export function NotificationBadge() {
  const notifications = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="relative">
      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
        {notifications.length > 99 ? '99+' : notifications.length}
      </span>
    </div>
  );
}

/**
 * Notification Center Panel (for dashboard)
 */
export function NotificationPanel() {
  const notifications = useNotifications();
  const removeNotification = useRealtimeStore((s) => s.removeNotification);
  const clearNotifications = useRealtimeStore((s) => s.clearNotifications);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">
          <SafeInfo className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <NotificationItem
                id={notification.id}
                title={notification.title}
                message={notification.message}
                icon={notification.icon}
                actionUrl={notification.actionUrl}
                onDismiss={removeNotification}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
