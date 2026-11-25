'use client';

/**
 * StaffStatusDisplay Component
 * Shows online/offline status of support staff in real-time
 */

import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, RefreshCw } from 'lucide-react';

const SafeUsers = Users as any;
const SafeUserX = UserX as any;
const SafeRefreshCw = RefreshCw as any;
import { useOnlineStaff, useRealtimeStore } from '@/stores/realtime';
import { useRealtime } from '@/hooks/useRealtime';

interface StaffMemberProps {
  staffId: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastSeen?: number;
}

function StaffMember({ staffId, name, role, isOnline, lastSeen }: StaffMemberProps) {
  const getRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
      <div className="text-right">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${
            isOnline
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {!isOnline && lastSeen && (
          <p className="text-xs text-gray-500 mt-1">{getRelativeTime(lastSeen)}</p>
        )}
      </div>
    </div>
  );
}

interface StaffStatusDisplayProps {
  showOnlineOnly?: boolean;
  maxDisplay?: number;
  compact?: boolean;
}

export function StaffStatusDisplay({
  showOnlineOnly = false,
  maxDisplay = 10,
  compact = false,
}: StaffStatusDisplayProps) {
  const onlineStaff = useOnlineStaff();
  const staffStatusMap = useRealtimeStore((s) => s.staffStatusMap);
  const [isLoading, setIsLoading] = useState(false);
  const [allStaff, setAllStaff] = useState<StaffMemberProps[]>([]);

  // Initialize WebSocket connection
  useRealtime({
    enabled: true,
    autoSubscribeAll: true,
  });

  // Fetch all staff on mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/staff');
        const data = await response.json();

        const staffList: StaffMemberProps[] = data.staff.map((s: any) => {
          const status = staffStatusMap.get(s.id);
          return {
            staffId: s.id,
            name: s.name || s.email?.split('@')[0] || 'Unknown',
            role: s.role || 'Support Staff',
            isOnline: status?.isOnline ?? false,
            lastSeen: status?.lastSeen,
          };
        });
        setAllStaff(staffList);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  // Update when staff status changes
  useEffect(() => {
    const updatedStaff = allStaff.map((s) => {
      const status = staffStatusMap.get(s.staffId);
      return {
        ...s,
        isOnline: status?.isOnline ?? false,
        lastSeen: status?.lastSeen,
      };
    });
    setAllStaff(updatedStaff);
  }, [staffStatusMap]);

  const displayStaff = showOnlineOnly
    ? allStaff.filter((s) => s.isOnline).slice(0, maxDisplay)
    : allStaff.slice(0, maxDisplay);

  const onlineCount = allStaff.filter((s) => s.isOnline).length;
  const totalCount = allStaff.length;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
        <div className="flex -space-x-2">
          {displayStaff.slice(0, 3).map((staff) => (
            <div
              key={staff.staffId}
              className={`w-6 h-6 rounded-full border-2 border-white text-xs flex items-center justify-center font-semibold text-white ${
                staff.isOnline
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              }`}
            >
              {staff.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-gray-700 font-medium">
          {onlineCount} of {totalCount} online
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SafeUsers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Staff Status</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {onlineCount} of {totalCount} online
            </span>
            {isLoading && <SafeRefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          </div>
        </div>
      </div>

      {displayStaff.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">
          <SafeUserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{showOnlineOnly ? 'No staff online' : 'No staff available'}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {displayStaff.map((staff) => (
            <StaffMember
              key={staff.staffId}
              staffId={staff.staffId}
              name={staff.name}
              role={staff.role}
              isOnline={staff.isOnline}
              lastSeen={staff.lastSeen}
            />
          ))}
        </div>
      )}

      {allStaff.length > maxDisplay && (
        <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600 border-t border-gray-200">
          Showing {displayStaff.length} of {allStaff.length} staff
        </div>
      )}
    </div>
  );
}

/**
 * Online Staff Indicator (badge style)
 */
export function OnlineStaffIndicator() {
  const onlineStaff = useOnlineStaff();

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-sm font-medium text-green-700">
        {onlineStaff.length} online
      </span>
    </div>
  );
}

/**
 * Staff Quick List (sidebar component)
 */
export function StaffQuickList() {
  const onlineStaff = useOnlineStaff();
  const staffStatusMap = useRealtimeStore((s) => s.staffStatusMap);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 px-2">Online Staff</h3>
      {onlineStaff.length === 0 ? (
        <p className="text-sm text-gray-500 px-2">No staff online</p>
      ) : (
        <div className="space-y-1">
          {onlineStaff.slice(0, 5).map((staffId) => {
            const status = staffStatusMap.get(staffId);
            if (!status) return null;
            return (
              <div
                key={staffId}
                className="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-gray-100 transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-700">{status.staffName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
