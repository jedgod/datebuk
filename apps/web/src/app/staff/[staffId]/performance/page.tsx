'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';

interface PerformanceData {
  staffId: string;
  tasksCompleted: number;
  tasksPending: number;
  avgCompletionTimeHours: number;
  totalTasks: number;
}

export default function StaffPerformance() {
  const params = useParams();
  const staffId = (params?.staffId as string) || '';
  const { accessToken } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [staffId, accessToken]);

  const fetchPerformanceData = async () => {
    try {
      const [perfRes, analyticsRes] = await Promise.all([
        fetch(apiEndpoint(`/admin/staff/${staffId}/performance`), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(apiEndpoint(`/admin/staff/analytics/tasks?staffId=${staffId}`), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!perfRes.ok || !analyticsRes.ok) throw new Error('Failed to fetch performance data');

      const perfData = await perfRes.json();
      const analyticsData = await analyticsRes.json();

      setPerformanceData(perfData);
      setTaskAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading performance data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!performanceData) return <div className="p-8">No performance data available</div>;

  const completionRate = performanceData.totalTasks > 0
    ? ((performanceData.tasksCompleted / performanceData.totalTasks) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Performance Metrics</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Tasks Completed</h3>
            <p className="text-4xl font-bold text-green-600">{performanceData.tasksCompleted}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Tasks</h3>
            <p className="text-4xl font-bold text-yellow-600">{performanceData.tasksPending}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Completion Rate</h3>
            <p className="text-4xl font-bold text-blue-600">{completionRate}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Avg Time per Task</h3>
            <p className="text-4xl font-bold text-indigo-600">{performanceData.avgCompletionTimeHours}h</p>
          </div>
        </div>

        {/* Task Breakdown */}
        {taskAnalytics && (
          <div className="grid grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tasks by Status</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Pending</span>
                    <span className="text-gray-900 font-semibold">{taskAnalytics.pending}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-600 h-2 rounded-full"
                      style={{
                        width: `${(taskAnalytics.pending / taskAnalytics.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">In Progress</span>
                    <span className="text-gray-900 font-semibold">{taskAnalytics.inProgress}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(taskAnalytics.inProgress / taskAnalytics.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Completed</span>
                    <span className="text-gray-900 font-semibold">{taskAnalytics.completed}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(taskAnalytics.completed / taskAnalytics.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Escalated</span>
                    <span className="text-gray-900 font-semibold">{taskAnalytics.escalated}</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${(taskAnalytics.escalated / taskAnalytics.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Excellent Performance</span>
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Consistent Productivity</span>
                  <span className="text-blue-600 font-bold">✓</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <span className="text-gray-700">Monitor Pending Tasks</span>
                  <span className="text-yellow-600 font-bold">!</span>
                </div>

                <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                  Download Performance Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
