'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { ModerationQueue } from '@/components/staff/video-monitor/ModerationQueue';
import { WebRTCHealthMonitor } from '@/components/staff/video-monitor/WebRTCHealthMonitor';
import { FeedbackTrends } from '@/components/staff/video-monitor/FeedbackTrends';
import { AlertCircle } from 'lucide-react';

const SafeAlertCircle = AlertCircle as any;

interface PreloadedData {
  reports?: any[];
  activeCalls?: any[];
  trends?: any[];
  insights?: any[];
}

interface StaffVideoMonitorDashboardProps {
  preloadedData?: PreloadedData;
}

export default function StaffVideoMonitorDashboard({
  preloadedData,
}: StaffVideoMonitorDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('moderation');
  const [reports, setReports] = useState(preloadedData?.reports || []);
  const [activeCalls, setActiveCalls] = useState(preloadedData?.activeCalls || []);
  const [trends, setTrends] = useState(preloadedData?.trends || []);
  const [insights, setInsights] = useState(preloadedData?.insights || []);
  const [isLoading, setIsLoading] = useState(!preloadedData);

  useEffect(() => {
    if (!preloadedData) {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const [reportsRes, callsRes, trendsRes, insightsRes] = await Promise.all([
        fetch('/api/staff/video-monitor/reports'),
        fetch('/api/staff/video-monitor/active-calls'),
        fetch('/api/staff/video-monitor/feedback-trends'),
        fetch('/api/staff/video-monitor/user-insights'),
      ]);

      if (reportsRes.ok) setReports(await reportsRes.json());
      if (callsRes.ok) setActiveCalls(await callsRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
      if (insightsRes.ok) setInsights(await insightsRes.json());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      const response = await fetch(`/api/staff/video-monitor/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r)),
      );
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report status');
    }
  };

  const handleApplyAction = async (
    reportId: string,
    action: string,
    notes: string,
  ) => {
    try {
      const response = await fetch(`/api/staff/video-monitor/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (!response.ok) throw new Error('Failed to apply action');

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, actionTaken: action, status: 'resolved' } : r,
        ),
      );
    } catch (error) {
      console.error('Failed to apply action:', error);
      alert('Failed to apply action');
    }
  };

  const handleInvestigate = (roomId: string) => {
    router.push(`/staff/video-monitor/call-details/${roomId}`);
  };

  const handleReviewUser = (userId: string) => {
    router.push(`/staff/video-monitor/user-profile/${userId}`);
  };

  const criticalReports = reports.filter((r) => r.severity === 'critical');
  const degradedCalls = activeCalls.filter(
    (c) => c.quality === 'poor' || c.quality === 'fair',
  );
  const redFlagUsers = insights.filter((i) => i.redFlags?.length > 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Video Monitor</h1>
        <p className="text-gray-600 mt-2">
          Manage safety reports, monitor live calls, and track user feedback patterns
        </p>
      </div>

      {/* Critical Alerts */}
      {(criticalReports.length > 0 || degradedCalls.length > 0 || redFlagUsers.length > 0) && (
        <div className="grid grid-cols-3 gap-4">
          {criticalReports.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <SafeAlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">
                    {criticalReports.length} Critical Report(s)
                  </p>
                  <p className="text-xs text-red-700">Requires immediate action</p>
                </div>
              </div>
            </div>
          )}

          {degradedCalls.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <SafeAlertCircle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900">
                    {degradedCalls.length} Degraded Call(s)
                  </p>
                  <p className="text-xs text-yellow-700">Monitor for disconnections</p>
                </div>
              </div>
            </div>
          )}

          {redFlagUsers.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <SafeAlertCircle className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">
                    {redFlagUsers.length} User(s) with Red Flag(s)
                  </p>
                  <p className="text-xs text-orange-700">Review feedback patterns</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="moderation">
            Safety Reports
            {criticalReports.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {criticalReports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="webrtc">
            Live Connections
            {degradedCalls.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                {degradedCalls.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <ModerationQueue
            reports={reports}
            onUpdateStatus={handleUpdateReportStatus}
            onApplyAction={handleApplyAction}
          />
        </TabsContent>

        <TabsContent value="webrtc">
          <WebRTCHealthMonitor
            activeCalls={activeCalls}
            onInvestigate={handleInvestigate}
          />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackTrends
            trends={trends}
            insights={insights}
            onReviewUser={handleReviewUser}
          />
        </TabsContent>
      </Tabs>

      {/* Staff Responsibilities */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900">👥 Your Role: Operations & Moderation</p>
        <ul className="text-blue-800 text-xs mt-2 space-y-1 list-disc list-inside">
          <li>Review and handle safety reports within admin-defined policy</li>
          <li>Monitor live call quality and support users experiencing connection issues</li>
          <li>Track user feedback patterns to identify potential safety or behavior concerns</li>
          <li>Apply enforcement actions within your permissions (mute, suspend, shadow ban)</li>
          <li>Escalate edge cases to admin for policy guidance</li>
        </ul>
      </div>
    </div>
  );
}