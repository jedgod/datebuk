'use client';

/**
 * SettingsUpdateHandler Component
 * Receives and handles settings broadcasts from admin
 */

import React, { useEffect, useState } from 'react';
import { Settings, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const SafeSettings = Settings as any;
const SafeAlertCircle = AlertCircle as any;
const SafeCheckCircle = CheckCircle as any;
const SafeRefreshCw = RefreshCw as any;
import { useBroadcastedSettings, useRealtimeStore } from '@/stores/realtime';
import { useRealtime } from '@/hooks/useRealtime';

interface SettingsUpdateHandlerProps {
  onSettingsUpdate?: (settings: Record<string, any>, category?: string) => void;
  autoApply?: boolean;
  showNotification?: boolean;
}

export function SettingsUpdateHandler({
  onSettingsUpdate,
  autoApply = true,
  showNotification = true,
}: SettingsUpdateHandlerProps) {
  const broadcastedSettings = useBroadcastedSettings();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Initialize WebSocket connection
  useRealtime({
    enabled: true,
    autoSubscribeAll: true,
  });

  // Handle settings update
  useEffect(() => {
    if (!broadcastedSettings) return;

    setLastUpdate(broadcastedSettings.timestamp);
    setError(null);

    if (autoApply) {
      applySettings();
    }

    // Notify parent component
    onSettingsUpdate?.(
      broadcastedSettings.settings,
      broadcastedSettings.category
    );
  }, [broadcastedSettings]);

  const applySettings = async () => {
    if (!broadcastedSettings) return;

    try {
      setIsPending(true);
      setError(null);

      // Make API call to apply settings
      const response = await fetch('/api/settings/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: broadcastedSettings.settings,
          category: broadcastedSettings.category,
          appliedAt: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply settings');
      }

      // Settings applied successfully
      console.log('[Settings] Applied settings:', broadcastedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Settings] Failed to apply settings:', err);
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  if (!broadcastedSettings) {
    return null;
  }

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  const categoryLabel = broadcastedSettings.category || 'General';
  const settingKeys = Object.keys(broadcastedSettings.settings);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <SafeSettings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-blue-900">Settings Update</h3>
            <p className="text-sm text-blue-700 mt-0.5">
              {categoryLabel} settings updated by {broadcastedSettings.changedBy}
            </p>
            {lastUpdate && (
              <p className="text-xs text-blue-600 mt-1">
                {getRelativeTime(lastUpdate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isPending ? (
            <SafeRefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          ) : error ? (
            <SafeAlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <SafeCheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
      </div>

      {settingKeys.length > 0 && (
        <div className="bg-white bg-opacity-50 rounded px-3 py-2">
          <p className="text-xs font-semibold text-blue-700 mb-1">Changed settings:</p>
          <ul className="space-y-1 text-xs">
            {settingKeys.slice(0, 3).map((key) => (
              <li key={key} className="text-blue-600">
                • <span className="font-medium">{key}</span>: {
                  typeof broadcastedSettings.settings[key] === 'object'
                    ? JSON.stringify(broadcastedSettings.settings[key])
                    : String(broadcastedSettings.settings[key])
                }
              </li>
            ))}
            {settingKeys.length > 3 && (
              <li className="text-blue-600">
                • +{settingKeys.length - 3} more setting(s)
              </li>
            )}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
          <p className="text-sm text-red-700">
            <span className="font-semibold">Error applying settings:</span> {error}
          </p>
        </div>
      )}

      {!autoApply && (
        <div className="flex gap-2">
          <button
            onClick={applySettings}
            disabled={isPending}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Applying...' : 'Apply Settings'}
          </button>
          <button
            onClick={() => setError(null)}
            className="px-3 py-2 bg-white text-blue-600 text-sm font-medium rounded border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Settings Badge (shows when settings are being broadcasted)
 */
export function SettingsBadge() {
  const broadcastedSettings = useBroadcastedSettings();

  if (!broadcastedSettings) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      Settings Broadcasted
    </div>
  );
}

/**
 * Settings Sync Status Monitor
 */
export function SettingsSyncStatus() {
  const broadcastedSettings = useBroadcastedSettings();
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [syncTime, setSyncTime] = useState<number | null>(null);

  useEffect(() => {
    if (!broadcastedSettings) return;

    setSyncStatus('syncing');
    setSyncTime(Date.now());

    const timer = setTimeout(() => {
      setSyncStatus('synced');
    }, 2000);

    return () => clearTimeout(timer);
  }, [broadcastedSettings]);

  const statusConfig = {
    synced: {
      icon: <SafeCheckCircle className="w-4 h-4" />,
      text: 'Settings synced',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    syncing: {
      icon: <SafeRefreshCw className="w-4 h-4 animate-spin" />,
      text: 'Syncing settings...',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    error: {
      icon: <SafeAlertCircle className="w-4 h-4" />,
      text: 'Sync failed',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  };

  const config = statusConfig[syncStatus];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${config.color} ${config.bg}`}>
      {config.icon}
      {config.text}
    </div>
  );
}
