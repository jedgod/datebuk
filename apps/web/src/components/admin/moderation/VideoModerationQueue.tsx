"use client";

import { useState, useEffect } from 'react';
import { FlaggedVideo } from '@/lib/mockVideoData';
import { AIScoresBadge, SeverityBadge, TrustLevelBadge } from './AIScoresBadge';
import { VideoContextPanel } from './VideoContextPanel';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  AlertTriangle, 
  Eye,
  Radio,
  Clock,
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoModerationQueueProps {
  videos: FlaggedVideo[];
  onApprove?: (videoIds: string[]) => void;
  onFlag?: (videoIds: string[]) => void;
  onEscalate?: (videoIds: string[]) => void;
  className?: string;
}

type SortField = 'riskScore' | 'severity' | 'flaggedAt' | 'reportCount' | 'userName';
type SortDirection = 'asc' | 'desc';

const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

export function VideoModerationQueue({ 
  videos, 
  onApprove, 
  onFlag, 
  onEscalate,
  className 
}: VideoModerationQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<FlaggedVideo | null>(null);
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'j':
          e.preventDefault();
          // Move down in queue
          break;
        case 'k':
          e.preventDefault();
          // Move up in queue
          break;
        case 'x':
          e.preventDefault();
          // Toggle selection
          break;
        case 'a':
          if (selectedIds.size > 0 && onApprove) {
            e.preventDefault();
            onApprove(Array.from(selectedIds));
            setSelectedIds(new Set());
          }
          break;
        case 'f':
          if (selectedIds.size > 0 && onFlag) {
            e.preventDefault();
            onFlag(Array.from(selectedIds));
            setSelectedIds(new Set());
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, onApprove, onFlag]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFiltered = [...videos]
    .filter(v => filterSeverity === 'all' || v.severity === filterSeverity)
    .filter(v => filterStatus === 'all' || v.status === filterStatus)
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'riskScore':
          aVal = a.aiScores.overallRiskScore;
          bVal = b.aiScores.overallRiskScore;
          break;
        case 'severity':
          aVal = severityOrder[a.severity];
          bVal = severityOrder[b.severity];
          break;
        case 'flaggedAt':
          aVal = a.flaggedAt.getTime();
          bVal = b.flaggedAt.getTime();
          break;
        case 'reportCount':
          aVal = a.reportCount;
          bVal = b.reportCount;
          break;
        case 'userName':
          aVal = a.userName.toLowerCase();
          bVal = b.userName.toLowerCase();
          break;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSelection = (videoId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedIds(newSelection);
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-amber-400 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      )}
    </button>
  );

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Filters & Bulk Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Filter by severity level"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Filter by review status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="escalated">Escalated</option>
              <option value="quarantined">Quarantined</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="text-sm font-medium text-amber-400">
                {selectedIds.size} selected
              </span>
              {onApprove && (
                <button
                  onClick={() => {
                    onApprove(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded flex items-center gap-1"
                >
                  <Check size={14} /> Approve
                </button>
              )}
              {onFlag && (
                <button
                  onClick={() => {
                    onFlag(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded flex items-center gap-1"
                >
                  <X size={14} /> Flag
                </button>
              )}
              {onEscalate && (
                <button
                  onClick={() => {
                    onEscalate(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 rounded flex items-center gap-1"
                >
                  <AlertTriangle size={14} /> Escalate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Queue Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sortedAndFiltered.length && sortedAndFiltered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(sortedAndFiltered.map(v => v.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="rounded"
                      title="Select all items"
                    />
                  </th>
                  <th className="px-3 py-3 text-left">
                    <SortHeader field="userName">User</SortHeader>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <SortHeader field="riskScore">AI Risk</SortHeader>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <SortHeader field="severity">Severity</SortHeader>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <SortHeader field="reportCount">Reports</SortHeader>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <SortHeader field="flaggedAt">Flagged</SortHeader>
                  </th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedAndFiltered.map((video) => (
                  <tr 
                    key={video.id} 
                    className={cn(
                      "hover:bg-slate-700/50 transition-colors",
                      selectedIds.has(video.id) && "bg-amber-500/10"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(video.id)}
                        onChange={() => toggleSelection(video.id)}
                        className="rounded"
                        title={`Select ${video.userName}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{video.userName}</p>
                          <p className="text-xs text-slate-400">{video.userEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <TrustLevelBadge level={video.userTrustLevel} />
                            {video.isLive && (
                              <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                                <Radio size={10} className="animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <AIScoresBadge
                        nudity={video.aiScores.nudityProbability}
                        explicitAudio={video.aiScores.explicitAudioScore}
                        violence={video.aiScores.violenceScore}
                        overallRisk={video.aiScores.overallRiskScore}
                        compact
                      />
                    </td>
                    <td className="px-3 py-3">
                      <SeverityBadge severity={video.severity} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "text-sm font-semibold",
                        video.reportCount > 3 ? "text-red-400" : "text-slate-300"
                      )}>
                        {video.reportCount}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} />
                        {formatTimeAgo(video.flaggedAt)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium capitalize",
                        video.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                        video.status === 'approved' && 'bg-green-500/20 text-green-400',
                        video.status === 'rejected' && 'bg-red-500/20 text-red-400',
                        video.status === 'escalated' && 'bg-orange-500/20 text-orange-400',
                        video.status === 'quarantined' && 'bg-purple-500/20 text-purple-400'
                      )}>
                        {video.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-slate-500 flex gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">j</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">k</kbd> navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">x</kbd> select</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">a</kbd> approve</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">f</kbd> flag</span>
        </div>
      </div>

      {/* Context Panel */}
      {selectedVideo && (
        <VideoContextPanel
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}
