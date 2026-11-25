'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';

interface ActivityLog {
  id: string;
  staffId: string;
  action: string;
  target?: string;
  details?: Record<string, any>;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREATE_STAFF: 'bg-green-100 text-green-800',
  UPDATE_ROLES: 'bg-purple-100 text-purple-800',
  SUSPEND_STAFF: 'bg-yellow-100 text-yellow-800',
  REVOKE_STAFF: 'bg-red-100 text-red-800',
  CHANGE_PASSWORD: 'bg-indigo-100 text-indigo-800',
  RESET_PASSWORD: 'bg-orange-100 text-orange-800',
  OTP_FAILURE: 'bg-red-100 text-red-800',
  TASK_COMPLETED: 'bg-green-100 text-green-800',
  USER_BANNED: 'bg-red-100 text-red-800',
  DATA_EXPORT: 'bg-cyan-100 text-cyan-800',
};

export default function StaffActivity() {
  const params = useParams();
  const staffId = (params?.staffId as string) || '';
  const { accessToken } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityLog();
  }, [staffId, accessToken]);

  const fetchActivityLog = async () => {
    try {
      const res = await fetch(apiEndpoint(`/admin/staff/${staffId}/activity`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch activity log');
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading activity log');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading activity log...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Activity Log</h1>

        {/* Timeline */}
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4">
                {/* Timeline Marker */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white" />
                  {idx < activities.length - 1 && (
                    <div className="w-1 h-16 bg-gray-300 mt-2" />
                  )}
                </div>

                {/* Activity Card */}
                <div className="flex-1 bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          actionColors[activity.action] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {activity.action}
                      </span>
                      {activity.target && (
                        <p className="text-sm text-gray-600 mt-2">
                          Target: <span className="font-mono text-gray-900">{activity.target}</span>
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-gray-700 hover:text-gray-900">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 text-lg">No activity recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
