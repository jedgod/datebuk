'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueAt?: string;
  completedAt?: string;
  assignedBy: {
    email: string;
    staffProfile?: {
      displayName: string;
    };
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function StaffTasks() {
  const params = useParams();
  const staffId = (params?.staffId as string) || '';
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, [staffId, accessToken, filterStatus]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        apiEndpoint(`/admin/staff/${staffId}/tasks${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`),
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading tasks...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Assigned Tasks</h1>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8">
          {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                    <p className="text-gray-600 text-sm">{task.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-600">
                    <p>Assigned by: {task.assignedBy.staffProfile?.displayName || task.assignedBy.email}</p>
                    {task.dueAt && (
                      <p className="mt-1">
                        Due: {new Date(task.dueAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {task.status !== 'COMPLETED' && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      Update
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No tasks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
