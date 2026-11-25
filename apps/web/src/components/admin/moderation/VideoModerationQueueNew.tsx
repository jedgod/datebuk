"use client";

import { useState, useEffect } from 'react';
import { FlaggedVideo } from '@/lib/mockVideoData';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Clock,
  Filter,
  Search,
  ArrowUpDown,
  ChevronLeft,
  Settings,
  User as UserIcon,
  MessageSquare,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} mins ago`;
    return `${Math.floor(seconds / 86400)} mins ago`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 85) return 'text-red-400 bg-red-500/20';
    if (score >= 70) return 'text-orange-400 bg-orange-500/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-red-400 text-white',
      medium: 'bg-orange-400 text-slate-900',
      low: 'bg-yellow-400 text-slate-900'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const stats = {
    activeSessions: 1250,
    flagged: videos.length,
    highRisk: videos.filter(v => v.severity === 'high' || v.severity === 'critical').length,
    liveNow: videos.filter(v => v.isLive).length
  };

  return (
    <div className={cn("flex gap-4 h-[calc(100vh-180px)]", className)}>
      {/* Left Sidebar - Filters */}
      <div className={cn(
        "bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4 transition-all",
        sidebarCollapsed ? "w-0 p-0 border-0 overflow-hidden" : "w-64"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Flagged Videos</h3>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          <FilterItem icon={<Clock size={14} />} label="Recent Quarantined" active />
          <FilterItem icon={<UserIcon size={14} />} label="Low Trust Users" />
          <FilterItem icon={<AlertTriangle size={14} />} label="High Nudity Score" />
          <FilterItem icon={<Shield size={14} />} label="Explicit Audio Alerts" />
        </div>

        <div className="pt-4 border-t border-slate-700 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Sort By:</div>
          <SortButton label="Risk" active />
          <SortButton label="Recency" />
          <SortButton label="Severity" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Sessions</h2>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-2">
                <Filter size={14} />
                Filters
              </button>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <TabButton label="Flagged Videos" count={videos.length} active />
            <TabButton label="Flagged Videos" count={videos.length} />
            <TabButton label="High Risk" count={stats.highRisk} />
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <StatItem label="Active Sessions" value={stats.activeSessions.toLocaleString()} />
            <StatItem label="Flagged" value={stats.flagged} />
            <StatItem label="High Risk" value={stats.highRisk} />
            <StatItem label="Live Now" value={stats.liveNow} colorClass="text-red-400" />
            <div className="ml-auto flex gap-2">
              <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">Review</button>
              <button className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded">
                <UserIcon size={14} />
              </button>
              <button className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded">
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800/95 border-b border-slate-700">
              <tr className="text-xs text-slate-400 uppercase">
                <th className="text-left px-4 py-3 w-12">
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
                    className="rounded bg-slate-700 border-slate-600"
                  />
                </th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    User <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    Risk <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    Nudity <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    Audio <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    Reports <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">Intent</th>
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-white">
                    Time <ArrowUpDown size={12} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sortedAndFiltered.map((video) => (
                <tr 
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={cn(
                    "hover:bg-slate-700/30 transition-colors cursor-pointer",
                    selectedIds.has(video.id) && "bg-slate-700/20",
                    selectedVideo?.id === video.id && "bg-slate-700/40"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(video.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(video.id);
                      }}
                      className="rounded bg-slate-700 border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {video.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-white">{video.userName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold uppercase",
                      getSeverityBadge(video.severity)
                    )}>
                      {video.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold", getRiskColor(video.aiScores.overallRiskScore))}>
                      {Math.round(video.aiScores.overallRiskScore)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold", getRiskColor(video.aiScores.nudityProbability))}>
                      {Math.round(video.aiScores.nudityProbability)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold", getRiskColor(video.aiScores.explicitAudioScore))}>
                      {Math.round(video.aiScores.explicitAudioScore)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">{video.reportCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs capitalize",
                      video.userIntent === 'faith' ? 'bg-purple-500/20 text-purple-300' :
                      video.userIntent === 'casual' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-green-500/20 text-green-300'
                    )}>
                      {video.userIntent}
                    </span>
                    {video.isLive && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs font-bold">
                        Live
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{formatTimeAgo(video.flaggedAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
            <span className="text-sm font-medium text-white">Bulk Action</span>
            {onApprove && (
              <button
                onClick={() => {
                  onApprove(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Check size={16} /> Approve
              </button>
            )}
            {onFlag && (
              <button
                onClick={() => {
                  onFlag(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <X size={16} /> Flag
              </button>
            )}
            {onEscalate && (
              <button
                onClick={() => {
                  onEscalate(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <AlertTriangle size={16} /> Escalate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - User Details */}
      {selectedVideo && (
        <div className="w-96 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold text-white">User Details</h3>
            <button className="p-1 hover:bg-slate-700 rounded">
              <Settings size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            {/* User Info */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                {selectedVideo.userName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-white">{selectedVideo.userName}, 34</h4>
                <p className="text-xs text-slate-400">Low Trust Level</p>
              </div>
            </div>

            {/* Intent & Flags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-slate-300">Intent: <span className="font-semibold text-white capitalize">{selectedVideo.userIntent}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-slate-300">Previous Flags: <span className="font-semibold text-white">{selectedVideo.previousFlags} Infractions</span></span>
              </div>
            </div>

            {/* Recent Chat */}
            <div>
              <h5 className="text-sm font-bold text-white mb-3">Recent Chat</h5>
              <div className="space-y-2">
                {selectedVideo.recentMessages.slice(0, 2).map((msg, i) => (
                  <p key={i} className="text-sm text-slate-300">{msg.text}</p>
                ))}
              </div>
            </div>

            {/* AI Alerts */}
            <div>
              <h5 className="text-sm font-bold text-white mb-3">AI Alerts</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-sm text-slate-300">Nudity: <span className="font-bold text-red-400">{Math.round(selectedVideo.aiScores.nudityProbability)}%</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-sm text-slate-300">Explicit Audio: <span className="font-bold text-orange-400">{Math.round(selectedVideo.aiScores.explicitAudioScore)}%</span></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <button 
                onClick={() => onApprove?.([selectedVideo.id])}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white"
              >
                Approve
              </button>
              <button 
                onClick={() => onFlag?.([selectedVideo.id])}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white"
              >
                Flag
              </button>
              <button 
                onClick={() => onEscalate?.([selectedVideo.id])}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
      active ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
    )}>
      {active && <Check size={14} className="text-green-400" />}
      {icon}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function SortButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors",
      active ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
    )}>
      <span>{label}</span>
      {active && <ArrowUpDown size={12} />}
    </button>
  );
}

function TabButton({ label, count, active }: { label: string; count: number; active?: boolean }) {
  return (
    <button className={cn(
      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
      active ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
    )}>
      {label}
    </button>
  );
}

function StatItem({ label, value, colorClass }: { label: string; value: string | number; colorClass?: string }) {
  return (
    <div>
      <span className="text-xs text-slate-400">{label}: </span>
      <span className={cn("text-sm font-bold", colorClass || "text-white")}>{value}</span>
    </div>
  );
}
