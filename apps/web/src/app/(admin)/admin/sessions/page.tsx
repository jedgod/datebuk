"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, RefreshCw, MoreVertical, 
  AlertTriangle, CheckCircle, Flag, ArrowUpDown, Home 
} from "lucide-react";
import type { FlaggedVideo } from "@/lib/mockVideoData";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface FilterState {
  sortBy: 'risk' | 'recency' | 'severity' | 'reports';
  direction: 'asc' | 'desc';
  showRecentQuarantined: boolean;
  showLowTrust: boolean;
  showHighNudity: boolean;
  showExplicitAudio: boolean;
}

type SessionTab = 'flagged' | 'highRisk';
type ReviewDecision = 'approved' | 'flagged' | 'escalated';

// ────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────
const mockSessions: FlaggedVideo[] = [
  {
    id: 's1',
    userId: 'user-1',
    userName: 'Enmal23',
    userEmail: 'emma23@example.com',
    userAvatar: 'https://i.pravatar.cc/48?u=emma',
    userIntent: 'casual',
    userTrustLevel: 'low',
    trustLevel: 'low',
    previousFlags: 3,
    videoId: 'vid-1',
    thumbnailUrl: '/api/placeholder/200/150',
    duration: 120,
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    flaggedAt: new Date(Date.now() - 2 * 60 * 1000),
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    aiScores: {
      nudityProbability: 85,
      explicitAudioScore: 92,
      violenceScore: 15,
      overallRiskScore: 85,
    },
    nudity: 85,
    explicitAudio: 92,
    violence: 15,
    riskScore: 85,
    flagReason: 'nudity',
    severity: 'high',
    reportCount: 5,
    reporterNotes: ['Inappropriate content'],
    status: 'pending',
    isLive: false,
    keyframes: [],
    audioWaveform: [],
    violationTimestamps: [],
    recentMessages: [{ time: new Date(), text: 'Just met, are you alone? Can you show me more?' }],
    recentChat: 'Just met, are you alone? Can you show me more?',
    intent: 'casual',
    sessionId: 'sess-1'
  },
  {
    id: 's2',
    userId: 'user-2',
    userName: 'Mark87',
    userEmail: 'mark87@example.com',
    userAvatar: 'https://i.pravatar.cc/48?u=mark',
    userIntent: 'casual',
    userTrustLevel: 'medium',
    trustLevel: 'medium',
    previousFlags: 1,
    videoId: 'vid-2',
    thumbnailUrl: '/api/placeholder/200/150',
    duration: 180,
    uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    flaggedAt: new Date(Date.now() - 5 * 60 * 1000),
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    aiScores: {
      nudityProbability: 75,
      explicitAudioScore: 80,
      violenceScore: 20,
      overallRiskScore: 75,
    },
    nudity: 75,
    explicitAudio: 80,
    violence: 20,
    riskScore: 75,
    flagReason: 'explicit_audio',
    severity: 'medium',
    reportCount: 3,
    reporterNotes: ['Explicit audio detected'],
    status: 'pending',
    isLive: false,
    keyframes: [],
    audioWaveform: [],
    violationTimestamps: [],
    recentMessages: [],
    intent: 'casual',
    sessionId: 'sess-2'
  },
  {
    id: 's3',
    userId: 'user-3',
    userName: 'LunaFun',
    userEmail: 'lunafun@example.com',
    userAvatar: 'https://i.pravatar.cc/48?u=luna',
    userIntent: 'faith',
    userTrustLevel: 'medium',
    trustLevel: 'medium',
    previousFlags: 0,
    videoId: 'vid-3',
    thumbnailUrl: '/api/placeholder/200/150',
    duration: 90,
    uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    flaggedAt: new Date(Date.now() - 8 * 60 * 1000),
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    aiScores: {
      nudityProbability: 70,
      explicitAudioScore: 92,
      violenceScore: 18,
      overallRiskScore: 70,
    },
    nudity: 70,
    explicitAudio: 92,
    violence: 18,
    riskScore: 70,
    flagReason: 'explicit_audio',
    severity: 'medium',
    reportCount: 8,
    reporterNotes: ['Multiple reports'],
    status: 'pending',
    isLive: false,
    keyframes: [],
    audioWaveform: [],
    violationTimestamps: [],
    recentMessages: [],
    intent: 'faith',
    sessionId: 'sess-3'
  },
  {
    id: 's4',
    userId: 'user-4',
    userName: 'JasonM',
    userEmail: 'jasonm@example.com',
    userAvatar: 'https://i.pravatar.cc/48?u=jason',
    userIntent: 'casual',
    userTrustLevel: 'low',
    trustLevel: 'low',
    previousFlags: 5,
    videoId: 'vid-4',
    thumbnailUrl: '/api/placeholder/200/150',
    duration: 240,
    uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    flaggedAt: new Date(Date.now() - 8 * 60 * 1000),
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    aiScores: {
      nudityProbability: 83,
      explicitAudioScore: 92,
      violenceScore: 25,
      overallRiskScore: 83,
    },
    nudity: 83,
    explicitAudio: 92,
    violence: 25,
    riskScore: 83,
    flagReason: 'nudity',
    severity: 'critical',
    reportCount: 6,
    reporterNotes: ['Critical violation'],
    status: 'pending',
    isLive: true,
    keyframes: [],
    audioWaveform: [],
    violationTimestamps: [],
    recentMessages: [],
    intent: 'casual',
    sessionId: 'sess-4',
    age: 34
  },
  {
    id: 's5',
    userId: 'user-5',
    userName: 'FaithfulGuy',
    userEmail: 'faithfulguy@example.com',
    userAvatar: 'https://i.pravatar.cc/48?u=faith',
    userIntent: 'casual',
    userTrustLevel: 'high',
    trustLevel: 'high',
    previousFlags: 0,
    videoId: 'vid-5',
    thumbnailUrl: '/api/placeholder/200/150',
    duration: 300,
    uploadedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    flaggedAt: new Date(Date.now() - 10 * 60 * 1000),
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    aiScores: {
      nudityProbability: 92,
      explicitAudioScore: 82,
      violenceScore: 30,
      overallRiskScore: 92,
    },
    nudity: 92,
    explicitAudio: 82,
    violence: 30,
    riskScore: 92,
    flagReason: 'nudity',
    severity: 'high',
    reportCount: 4,
    reporterNotes: ['High risk content'],
    status: 'pending',
    isLive: false,
    keyframes: [],
    audioWaveform: [],
    violationTimestamps: [],
    recentMessages: [],
    intent: 'casual',
    sessionId: 'sess-5'
  },
];

export default function AdminSessionsPage() {
  const router = useRouter();
  const { accessToken, refresh } = useAuth();
  const [sessions, setSessions] = useState<FlaggedVideo[]>(mockSessions);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<SessionTab>('flagged');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'recency',
    direction: 'desc',
    showRecentQuarantined: true,
    showLowTrust: false,
    showHighNudity: false,
    showExplicitAudio: false,
  });

  const [selectedUser, setSelectedUser] = useState<FlaggedVideo | null>(null);

  async function tokenOrRefresh() {
    return accessToken ?? (await refresh());
  }

  async function loadFlaggedVideos(showMessage = false) {
    try {
      const token = await tokenOrRefresh();
      if (!token) {
        setSessions(mockSessions);
        return;
      }
      const data = await api.get<{ items: FlaggedVideo[] }>("/admin/video-moderation/queue?limit=100", token);
      setSessions(data.items?.length ? data.items : mockSessions);
      setLastRefresh(new Date());
      if (showMessage) setStatusMessage('Session queue refreshed.');
    } catch (e) {
      setSessions(mockSessions);
      setLastRefresh(new Date());
      if (showMessage) setStatusMessage('Showing local review queue while the API is unavailable.');
    }
  }

  // Fetch data
  useEffect(() => {
    loadFlaggedVideos();
  }, []);

  const getRiskScore = (session: FlaggedVideo) =>
    session.riskScore ?? session.aiScores.overallRiskScore ?? Math.max(session.nudity ?? 0, session.explicitAudio ?? 0);

  const visibleSessions = sessions
    .filter((session) => activeTab === 'highRisk'
      ? getRiskScore(session) >= 80 || ['high', 'critical'].includes(session.severity) || session.isLive
      : true
    )
    .filter((session) => {
      if (filters.showRecentQuarantined) {
        const flaggedAt = session.timestamp || session.flaggedAt;
        if ((Date.now() - flaggedAt.getTime()) > 15 * 60 * 1000) return false;
      }
      if (filters.showLowTrust && (session.trustLevel || session.userTrustLevel) !== 'low') return false;
      if (filters.showHighNudity && (session.nudity || session.aiScores.nudityProbability) < 80) return false;
      if (filters.showExplicitAudio && (session.explicitAudio || session.aiScores.explicitAudioScore) < 85) return false;
      return true;
    })
    .filter((session) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return [
        session.userName,
        session.userEmail,
        session.intent || session.userIntent,
        session.flagReason,
        session.severity,
        session.trustLevel || session.userTrustLevel,
        session.recentChat || '',
      ].some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1;
      if (filters.sortBy === 'risk') return (getRiskScore(a) - getRiskScore(b)) * direction;
      if (filters.sortBy === 'reports') return (a.reportCount - b.reportCount) * direction;
      if (filters.sortBy === 'severity') {
        const weights: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        return ((weights[a.severity] ?? 0) - (weights[b.severity] ?? 0)) * direction;
      }
      const aTime = (a.timestamp || a.flaggedAt).getTime();
      const bTime = (b.timestamp || b.flaggedAt).getTime();
      return (aTime - bTime) * direction;
    });

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === visibleSessions.length) {
      setSelected([]);
    } else {
      setSelected(visibleSessions.map(s => s.id));
    }
  };

  const getRiskColor = (severity: string, isLive?: boolean) => {
    if (isLive) return 'bg-orange-600/80 text-white';
    if (severity === 'critical' || severity === 'high') return 'bg-red-600/80 text-white';
    if (severity === 'medium') return 'bg-orange-500/80 text-white';
    return 'bg-green-600/80 text-white';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-red-400 font-bold';
    if (score >= 75) return 'text-orange-400 font-semibold';
    return 'text-green-400';
  };

  const getTrustLevelColor = (level: string) => {
    if (level === 'low') return 'text-red-400';
    if (level === 'medium') return 'text-orange-400';
    return 'text-green-400';
  };

  const formatTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const reviewSessions = async (ids: string[], decision: ReviewDecision) => {
    if (ids.length === 0) return;
    try {
      const token = await tokenOrRefresh();
      if (token) {
        await Promise.all(
          ids.map((id) => api.post(`/admin/video-moderation/queue/${id}/review`, { decision }, token))
        );
      }
      setSelected([]);
      setSelectedUser(null);
      setSessions(current => current.filter(s => !ids.includes(s.id)));
      setStatusMessage(`${ids.length} session${ids.length !== 1 ? 's' : ''} ${decision}.`);
    } catch (e) {
      console.error('Failed to review sessions', e);
      setStatusMessage('Review action failed. Please try again.');
    }
  };

  const handleApprove = async () => {
    await reviewSessions(selected, 'approved');
  };

  const handleFlag = async () => {
    await reviewSessions(selected, 'flagged');
  };

  const handleEscalate = async () => {
    await reviewSessions(selected, 'escalated');
  };

  const handleReview = () => {
    if (selected.length > 0) {
      const firstSelected = sessions.find((session) => session.id === selected[0]);
      if (firstSelected) setSelectedUser(firstSelected);
      setStatusMessage(`${selected.length} selected session${selected.length !== 1 ? 's' : ''} ready for review.`);
      return;
    }
    const firstVisible = visibleSessions[0];
    if (firstVisible) {
      setSelected([firstVisible.id]);
      setSelectedUser(firstVisible);
      setStatusMessage(`${firstVisible.userName} opened for review.`);
    } else {
      setStatusMessage('No sessions match the current review filters.');
    }
  };

  const selectSort = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      direction: prev.sortBy === sortBy && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Left Sidebar - Filters & Stats */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Flagged Videos</h1>
          <button
            onClick={() => loadFlaggedVideos(true)}
            className="p-2 hover:bg-slate-800 rounded-lg"
            title="Refresh"
            aria-label="Refresh sessions"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400">Active Sessions</div>
            <div className="text-2xl font-bold">1,250</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400">Flagged</div>
            <div className="text-2xl font-bold text-orange-400">235</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 col-span-2">
            <div className="text-slate-400">High Risk • Live Now</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-500">78</span>
              <span className="text-red-400/80">• 5 Live</span>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Quick Filters</h3>
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-md cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filters.showRecentQuarantined}
              onChange={() => setFilters(f => ({ ...f, showRecentQuarantined: !f.showRecentQuarantined }))}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span>Recent Quarantined</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-md cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filters.showLowTrust}
              onChange={() => setFilters(f => ({ ...f, showLowTrust: !f.showLowTrust }))}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span>Low Trust Users</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-md cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filters.showHighNudity}
              onChange={() => setFilters(f => ({ ...f, showHighNudity: !f.showHighNudity }))}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span>High Nudity Score</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-md cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filters.showExplicitAudio}
              onChange={() => setFilters(f => ({ ...f, showExplicitAudio: !f.showExplicitAudio }))}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span>Explicit Audio Alerts</span>
          </label>
        </div>

        {/* Sort By */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Sort By:</h3>
          <div className="flex flex-col gap-1">
            {[
              ['risk', 'Risk'],
              ['recency', 'Recency'],
              ['severity', 'Severity'],
              ['reports', 'Reports'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => selectSort(value as FilterState['sortBy'])}
                className={cn(
                  "px-3 py-2 text-left hover:bg-slate-800 rounded-md text-sm",
                  filters.sortBy === value && "bg-slate-800"
                )}
              >
                {label} {filters.sortBy === value ? (filters.direction === 'desc' ? 'down' : 'up') : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">Last refresh: {formatTimeAgo(lastRefresh)}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 rounded-lg transition-colors hover:bg-slate-800"
              title="Admin home"
              aria-label="Go to admin dashboard"
            >
              <Home size={18} />
            </button>
            <h2 className="text-lg font-semibold">Sessions</h2>
            <div className="flex gap-1 bg-slate-800 rounded-md p-1">
              <button
                onClick={() => { setActiveTab('flagged'); setSelected([]); }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded",
                  activeTab === 'flagged' ? "bg-slate-700 text-white" : "hover:bg-slate-700 text-slate-400"
                )}
              >
                Flagged Videos
              </button>
              <button
                onClick={() => { setActiveTab('highRisk'); setSelected([]); }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded",
                  activeTab === 'highRisk' ? "bg-slate-700 text-white" : "hover:bg-slate-700 text-slate-400"
                )}
              >
                High Risk
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 rounded-lg text-sm w-64 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowFiltersPanel(prev => !prev)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-700",
                showFiltersPanel ? "bg-amber-500/20 border-amber-500 text-amber-100" : "bg-slate-800 border-slate-700"
              )}
            >
              <Filter size={16} /> Filters
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="mx-6 mt-4 rounded-lg border border-green-700/40 bg-green-600/15 px-4 py-3 text-sm text-green-200 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} title="Dismiss status" aria-label="Dismiss status">x</button>
          </div>
        )}

        {showFiltersPanel && (
          <div className="mx-6 mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-400">
                Sort by
                <select
                  value={filters.sortBy}
                  onChange={(event) => setFilters(prev => ({ ...prev, sortBy: event.target.value as FilterState['sortBy'] }))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                >
                  <option value="recency">Recency</option>
                  <option value="risk">Risk</option>
                  <option value="severity">Severity</option>
                  <option value="reports">Reports</option>
                </select>
              </label>
              <label className="text-sm text-slate-400">
                Direction
                <select
                  value={filters.direction}
                  onChange={(event) => setFilters(prev => ({ ...prev, direction: event.target.value as FilterState['direction'] }))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                >
                  <option value="desc">Highest / newest first</option>
                  <option value="asc">Lowest / oldest first</option>
                </select>
              </label>
              <div className="text-sm text-slate-400">
                Matching
                <div className="mt-2 text-lg font-semibold text-slate-100">{visibleSessions.length} session{visibleSessions.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="border-b border-slate-800 bg-slate-900/20 px-6 py-3">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-400">Active Sessions: <span className="text-white font-semibold">1,250</span></span>
            <span className="text-slate-400">Flagged: <span className="text-orange-400 font-semibold">{visibleSessions.length}</span></span>
            <span className="text-slate-400">High Risk: <span className="text-red-400 font-semibold">{sessions.filter(session => getRiskScore(session) >= 80 || ['high', 'critical'].includes(session.severity)).length}</span></span>
            <span className="text-slate-400">Live Now: <span className="text-orange-400 font-semibold">{sessions.filter(session => session.isLive).length}</span></span>
            <button
              onClick={handleReview}
              className="ml-auto px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
            >
              Review
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            {/* Bulk Actions Bar */}
            {selected.length > 0 && (
              <div className="bg-slate-800/60 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">{selected.length} selected</span>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleApprove}
                    className="text-sm px-4 py-1.5 bg-green-600/30 hover:bg-green-600/50 border border-green-700/50 rounded-md flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button 
                    onClick={handleFlag}
                    className="text-sm px-4 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-700/50 rounded-md flex items-center gap-2"
                  >
                    <Flag size={16} /> Flag
                  </button>
                  <button 
                    onClick={handleEscalate}
                    className="text-sm px-4 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-700/50 rounded-md flex items-center gap-2"
                  >
                    <AlertTriangle size={16} /> Escalate
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg" title="More options" aria-label="More options">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="w-full text-sm">
              <thead className="bg-slate-800/40">
                <tr>
                  <th className="w-10 px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.length === visibleSessions.length && visibleSessions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                      aria-label="Select all sessions"
                    />
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">User</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <button onClick={() => selectSort('risk')} className="flex items-center gap-1">
                        Risk <ArrowUpDown size={14} />
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">Nudity</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">Audio</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">
                    <button onClick={() => selectSort('reports')} className="flex items-center gap-1">
                      Reports <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">Intent</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-400">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <button onClick={() => selectSort('recency')} className="flex items-center gap-1">
                        Time <ArrowUpDown size={14} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleSessions.map(session => (
                  <tr
                    key={session.id}
                    className={cn(
                      "border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer",
                      selected.includes(session.id) && "bg-amber-950/30"
                    )}
                    onClick={() => setSelectedUser(session)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(session.id)}
                        onChange={() => toggleSelect(session.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                        aria-label={`Select ${session.userName}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={session.userAvatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-medium">{session.userName}</div>
                          <div className="text-xs text-slate-500">
                            Trust: <span className={getTrustLevelColor(session.trustLevel || session.userTrustLevel)}>
                              {(session.trustLevel || session.userTrustLevel).charAt(0).toUpperCase() + (session.trustLevel || session.userTrustLevel).slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        getRiskColor(session.severity, session.isLive)
                      )}>
                        {session.isLive ? 'Live' : session.severity.charAt(0).toUpperCase() + session.severity.slice(1)}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 font-mono", getScoreColor(session.nudity || session.aiScores.nudityProbability))}>
                      {session.nudity || session.aiScores.nudityProbability}%
                    </td>
                    <td className={cn("px-6 py-4 font-mono", getScoreColor(session.explicitAudio || session.aiScores.explicitAudioScore))}>
                      {session.explicitAudio || session.aiScores.explicitAudioScore}%
                    </td>
                    <td className="px-6 py-4 text-center">{session.reportCount}</td>
                    <td className="px-6 py-4 capitalize">{session.intent || session.userIntent}</td>
                    <td className="px-6 py-4 text-slate-400">{formatTimeAgo(session.timestamp || session.flaggedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleSessions.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                No sessions match the current tab, search, and filters.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - User Details */}
      {selectedUser && (
        <aside className="w-96 border-l border-slate-800 bg-slate-900/70 backdrop-blur-sm p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Details</h3>
            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-200 text-2xl">
              ×
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-800">
            <img
              src={selectedUser.userAvatar}
              alt=""
              className="w-20 h-20 rounded-full border-2 border-slate-700 object-cover"
            />
            <div className="text-center">
              <div className="font-bold text-lg">
                {selectedUser.userName}{selectedUser.age ? `, ${selectedUser.age}` : ''}
              </div>
              <div className={cn("text-sm", getTrustLevelColor(selectedUser.trustLevel || selectedUser.userTrustLevel))}>
                {(selectedUser.trustLevel || selectedUser.userTrustLevel).charAt(0).toUpperCase() + (selectedUser.trustLevel || selectedUser.userTrustLevel).slice(1)} Trust Level
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Intent</div>
              <div className="bg-slate-800 px-3 py-2 rounded-lg capitalize">{selectedUser.intent || selectedUser.userIntent}</div>
            </div>

            {selectedUser.previousFlags !== undefined && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Previous Flags</div>
                <div className="bg-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-400" />
                  {selectedUser.previousFlags} Infractions
                </div>
              </div>
            )}

            {selectedUser.recentChat && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Recent Chat</div>
                <div className="bg-slate-800/70 p-3 rounded-lg text-sm border-l-4 border-orange-500">
                  {selectedUser.recentChat}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-400 mb-2">AI Alerts</div>
              <div className="space-y-2">
                <div className="flex justify-between bg-slate-800/60 p-2.5 rounded">
                  <span>Nudity</span>
                  <span className={getScoreColor(selectedUser.nudity || selectedUser.aiScores.nudityProbability)}>{selectedUser.nudity || selectedUser.aiScores.nudityProbability}%</span>
                </div>
                <div className="flex justify-between bg-slate-800/60 p-2.5 rounded">
                  <span>Explicit Audio</span>
                  <span className={getScoreColor(selectedUser.explicitAudio || selectedUser.aiScores.explicitAudioScore)}>{selectedUser.explicitAudio || selectedUser.aiScores.explicitAudioScore}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => reviewSessions([selectedUser.id], 'approved')}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              Approve
            </button>
            <button
              onClick={() => reviewSessions([selectedUser.id], 'flagged')}
              className="w-full py-3 bg-red-600/80 hover:bg-red-700 rounded-lg font-medium"
            >
              Flag
            </button>
            <button
              onClick={() => reviewSessions([selectedUser.id], 'escalated')}
              className="w-full py-3 bg-amber-600/80 hover:bg-amber-700 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} /> Escalate
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
