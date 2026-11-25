'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Flag, User, Calendar, MessageSquare } from 'lucide-react';

const SafeAlertCircle = AlertCircle as any;
const SafeFlag = Flag as any;
const SafeUser = User as any;

interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  status: 'new' | 'investigating' | 'verified' | 'resolved' | 'dismissed';
  evidence?: {
    callTranscript?: string;
    timestamp?: Date;
  };
  staffNotes?: string;
  actionTaken?: string;
}

interface ModerationQueueProps {
  reports: SafetyReport[];
  onUpdateStatus: (reportId: string, status: SafetyReport['status']) => Promise<void>;
  onApplyAction: (reportId: string, action: string, notes: string) => Promise<void>;
}

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS = {
  new: 'bg-gray-100 text-gray-800',
  investigating: 'bg-blue-100 text-blue-800',
  verified: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export function ModerationQueue({
  reports,
  onUpdateStatus,
  onApplyAction,
}: ModerationQueueProps) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<{ [key: string]: string }>({});
  const [staffNotes, setStaffNotes] = useState<{ [key: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const criticalReports = reports.filter((r) => r.severity === 'critical');
  const newReports = reports.filter((r) => r.status === 'new');
  const pendingReview = reports.filter((r) => r.status === 'investigating' || r.status === 'verified');

  const handleApplyAction = async (reportId: string) => {
    if (!selectedAction[reportId]) return;

    setProcessingId(reportId);
    try {
      await onApplyAction(reportId, selectedAction[reportId], staffNotes[reportId] || '');
      setSelectedAction({ ...selectedAction, [reportId]: '' });
      setStaffNotes({ ...staffNotes, [reportId]: '' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{criticalReports.length}</div>
            <p className="text-xs text-gray-600 mt-1">Critical Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{newReports.length}</div>
            <p className="text-xs text-gray-600 mt-1">New Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{pendingReview.length}</div>
            <p className="text-xs text-gray-600 mt-1">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter((r) => r.status === 'resolved').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Resolved This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert */}
      {criticalReports.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-3">
            <SafeAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">
                {criticalReports.length} critical report(s) requiring immediate attention
              </p>
              <p className="text-red-800 text-xs mt-1">
                Review and take action within 2 hours per policy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            {reports.length} total reports | Manage safety and user violations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <SafeFlag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No reports in queue</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg overflow-hidden hover:bg-gray-50 transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{report.category}</h4>
                        <Badge className={SEVERITY_COLORS[report.severity]}>
                          {report.severity}
                        </Badge>
                        <Badge className={STATUS_COLORS[report.status]}>{report.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Reported by <span className="font-semibold">{report.reporterName}</span> on{' '}
                        {new Date(report.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedReportId(expandedReportId === report.id ? null : report.id)
                      }
                    >
                      {expandedReportId === report.id ? '−' : '+'}
                    </Button>
                  </div>

                  {/* Referenced User */}
                  <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded text-sm">
                    <SafeUser className="w-4 h-4 text-gray-500" />
                    <span>
                      Against: <span className="font-semibold">{report.reportedUserName}</span>
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {expandedReportId === report.id && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {/* Description */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Description</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {report.description}
                        </p>
                      </div>

                      {/* Evidence */}
                      {report.evidence?.callTranscript && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Evidence</p>
                          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                            {report.evidence.callTranscript}
                          </div>
                        </div>
                      )}

                      {/* Status Update */}
                      <div className="space-y-2 border-t pt-4">
                        <p className="text-xs font-semibold text-gray-600">Update Status</p>
                        <div className="flex gap-2">
                          {(['new', 'investigating', 'verified', 'resolved', 'dismissed'] as const).map(
                            (status) => (
                              <Button
                                key={status}
                                variant={
                                  report.status === status ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => onUpdateStatus(report.id, status)}
                              >
                                <span className="capitalize text-xs">{status}</span>
                              </Button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Action Selection */}
                      {(report.status === 'verified' || report.status === 'investigating') && (
                        <div className="space-y-3 border-t pt-4">
                          <p className="text-xs font-semibold text-gray-600">Take Action</p>
                          <Select
                            value={selectedAction[report.id] || ''}
                            onValueChange={(value) => {
                              setSelectedAction({ ...selectedAction, [report.id]: value });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select action..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mute">Mute Account (24h)</SelectItem>
                              <SelectItem value="suspend">Suspend Account (48h)</SelectItem>
                              <SelectItem value="shadowBan">Shadow Ban</SelectItem>
                              <SelectItem value="sendWarning">Send Warning</SelectItem>
                              <SelectItem value="escalate">Escalate to Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Textarea
                            placeholder="Staff investigation notes..."
                            value={staffNotes[report.id] || ''}
                            onChange={(e) => {
                              setStaffNotes({ ...staffNotes, [report.id]: e.target.value });
                            }}
                            className="text-sm"
                          />

                          <Button
                            onClick={() => handleApplyAction(report.id)}
                            disabled={!selectedAction[report.id] || processingId === report.id}
                            className="w-full"
                          >
                            {processingId === report.id ? 'Processing...' : 'Apply Action'}
                          </Button>
                        </div>
                      )}

                      {/* Previous Action */}
                      {report.actionTaken && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs font-semibold text-green-900">Action Taken</p>
                          <p className="text-sm text-green-700 mt-1">{report.actionTaken}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
