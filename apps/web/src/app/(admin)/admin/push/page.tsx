'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, RefreshCw, MoreVertical, UserCheck, AlertTriangle,
  Send, X, Moon, Sun, Home
} from 'lucide-react';

// Safe cast for Lucide React icons
const SafeMoon = Moon as any;
const SafeSun = Sun as any;
const SafeSend = Send as any;
const SafeSearch = Search as any;
const SafeFilter = Filter as any;
const SafeRefreshCw = RefreshCw as any;
const SafeUserCheck = UserCheck as any;
const SafeAlertTriangle = AlertTriangle as any;
const SafeMoreVertical = MoreVertical as any;
const SafeX = X as any;
const SafeHome = Home as any;

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface Broadcast {
  id: string;
  title: string;
  targetSegments: string[]; // e.g., ['flagged', 'low_trust', 'quarantined']
  message: string;
  status: 'draft' | 'preview' | 'scheduled' | 'sent' | 'failed';
  deliveryRate?: number;
  engagementRate?: number;
  sentAt?: string;
  scheduledAt?: string;
  moderatorNote?: string;
}

interface FilterState {
  sortBy: 'date' | 'engagement' | 'delivery';
  direction: 'asc' | 'desc';
  showFlagged: boolean;
  showLowTrust: boolean;
  showQuarantined: boolean;
}

interface Pagination {
  page: number;
  hasMore: boolean;
  total: number;
}

type Theme = 'dark' | 'light';
type BroadcastTab = 'all' | 'scheduled';

// ────────────────────────────────────────────────
// Mock initial data (replace with API)
// ────────────────────────────────────────────────
const initialBroadcasts: Broadcast[] = [
  {
    id: 'b1', title: 'Safety Nudge', targetSegments: ['flagged', 'low_trust'], 
    message: 'Review our video guidelines', status: 'sent', deliveryRate: 92, engagementRate: 25, sentAt: '2026-02-18T10:00:00Z'
  },
  {
    id: 'b2', title: 'Community Standards', targetSegments: ['all'], 
    message: 'Help keep DateBuk safe for everyone', status: 'sent', deliveryRate: 88, engagementRate: 18, sentAt: '2026-02-17T14:30:00Z'
  },
  {
    id: 'b3', title: 'Account Verification', targetSegments: ['low_trust'], 
    message: 'Verify your account to unlock premium features', status: 'sent', deliveryRate: 85, engagementRate: 22, sentAt: '2026-02-16T09:15:00Z'
  },
  {
    id: 'b4', title: 'Weekend Event Reminder', targetSegments: ['all'],
    message: 'Upcoming meetups are available for verified members this weekend.', status: 'scheduled', scheduledAt: '2026-02-21T18:00:00Z'
  },
];

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
export default function AdminPushPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'date',
    direction: 'desc',
    showFlagged: true,
    showLowTrust: false,
    showQuarantined: false,
  });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, hasMore: true, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'flag' | null>(null);
  const [newBroadcast, setNewBroadcast] = useState<Partial<Broadcast>>({});
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeTab, setActiveTab] = useState<BroadcastTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Theme toggle (localStorage persist)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch broadcasts (real API)
  const fetchBroadcasts = useCallback(async (page: number = 1, reset: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      // NOTE: Replace with actual API call
      // const res = await fetch(`/api/admin/push-broadcasts?${params}`);
      // if (!res.ok) throw new Error('Failed to fetch');
      // const { data, pagination: newPag } = await res.json();
      // For now, just use mock data
      setBroadcasts(prev => reset ? initialBroadcasts : [...prev, ...initialBroadcasts]);
      setPagination({ page, hasMore: false, total: initialBroadcasts.length });
      setStatusMessage(reset ? 'Broadcast list refreshed.' : 'Older broadcasts loaded.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBroadcasts(1, true); // Initial fetch with reset
  }, [fetchBroadcasts]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelected(selected.length === visibleBroadcasts.length ? [] : visibleBroadcasts.map(b => b.id));
  };

  const applySortBy = (sortOption: 'date' | 'engagement' | 'delivery') => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortOption,
      direction: prev.sortBy === sortOption && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleSendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) {
      setError('Title and message are required');
      return;
    }
    // POST to /api/admin/send-broadcast with newBroadcast
    console.log('Sending', newBroadcast);
    setBroadcasts(prev => [{
      id: `b${Date.now()}`,
      title: newBroadcast.title!,
      targetSegments: 
        (filters.showFlagged ? ['flagged'] : [])
        .concat(filters.showLowTrust ? ['low_trust'] : [])
        .concat(filters.showQuarantined ? ['quarantined'] : []),
      message: newBroadcast.message!,
      status: activeTab === 'scheduled' ? 'scheduled' : 'sent',
      deliveryRate: activeTab === 'scheduled' ? undefined : 100,
      engagementRate: activeTab === 'scheduled' ? undefined : 0,
      sentAt: activeTab === 'scheduled' ? undefined : new Date().toISOString(),
      scheduledAt: activeTab === 'scheduled' ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined,
    }, ...prev]);
    setNewBroadcast({});
    setStatusMessage(activeTab === 'scheduled' ? 'Broadcast scheduled for one hour from now.' : 'Broadcast sent to the selected segments.');
  };

  const confirmBulkAction = async (action: 'approve' | 'flag') => {
    setShowBulkModal(false);
    // POST to /api/admin/bulk-action with { ids: selected, action }
    console.log(`Bulk ${action} on`, selected);
    setBroadcasts(prev => prev.map(item => selected.includes(item.id)
      ? { ...item, moderatorNote: action === 'approve' ? 'Approved by admin review' : 'Flagged for follow-up' }
      : item
    ));
    setStatusMessage(`${selected.length} broadcast${selected.length !== 1 ? 's' : ''} ${action === 'approve' ? 'approved' : 'flagged'} for review.`);
    setSelected([]);
  };

  const activeSegments = [
    filters.showFlagged ? 'flagged' : null,
    filters.showLowTrust ? 'low_trust' : null,
    filters.showQuarantined ? 'quarantined' : null,
  ].filter(Boolean) as string[];

  const visibleBroadcasts = broadcasts
    .filter((item) => activeTab === 'scheduled' ? item.status === 'scheduled' : true)
    .filter((item) => {
      if (activeSegments.length === 0) return true;
      return item.targetSegments.includes('all') || item.targetSegments.some((segment) => activeSegments.includes(segment));
    })
    .filter((item) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return [item.title, item.message, item.status, item.targetSegments.join(' '), item.moderatorNote ?? '']
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1;
      if (filters.sortBy === 'delivery') return ((a.deliveryRate ?? 0) - (b.deliveryRate ?? 0)) * direction;
      if (filters.sortBy === 'engagement') return ((a.engagementRate ?? 0) - (b.engagementRate ?? 0)) * direction;
      const aTime = new Date(a.sentAt ?? a.scheduledAt ?? 0).getTime();
      const bTime = new Date(b.sentAt ?? b.scheduledAt ?? 0).getTime();
      return (aTime - bTime) * direction;
    });

  const averageDelivery = Math.round(
    broadcasts.filter((item) => typeof item.deliveryRate === 'number').reduce((sum, item) => sum + (item.deliveryRate ?? 0), 0) /
    Math.max(1, broadcasts.filter((item) => typeof item.deliveryRate === 'number').length)
  );
  const averageEngagement = Math.round(
    broadcasts.filter((item) => typeof item.engagementRate === 'number').reduce((sum, item) => sum + (item.engagementRate ?? 0), 0) /
    Math.max(1, broadcasts.filter((item) => typeof item.engagementRate === 'number').length)
  );

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-slate-950 text-slate-100'} flex`}>
      {/* Sidebar */}
      <aside className={`w-80 border-r ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/60'} backdrop-blur-sm p-4 flex flex-col gap-6`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Push Broadcasts</h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-slate-800'}`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SafeSun size={18} /> : <SafeMoon size={18} />}
          </button>
        </div>

        {/* Target Segments */}
        <div className="space-y-4">
          <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'}`}>Target Segments</h3>
          <label className={`flex items-center gap-2 cursor-pointer ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>
            <input
              type="checkbox"
              checked={filters.showFlagged}
              onChange={() => setFilters(p => ({...p, showFlagged: !p.showFlagged}))}
              className="rounded accent-amber-500"
            />
            Target Flagged Users
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>
            <input
              type="checkbox"
              checked={filters.showLowTrust}
              onChange={() => setFilters(p => ({...p, showLowTrust: !p.showLowTrust}))}
              className="rounded accent-amber-500"
            />
            Low Trust Users
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>
            <input
              type="checkbox"
              checked={filters.showQuarantined}
              onChange={() => setFilters(p => ({...p, showQuarantined: !p.showQuarantined}))}
              className="rounded accent-amber-500"
            />
            Recently Quarantined
          </label>
        </div>

        {/* New Broadcast Form */}
        <div className={`space-y-4 border-t pt-4 ${theme === 'light' ? 'border-gray-300' : 'border-slate-800'}`}>
          <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'}`}>Create Broadcast</h3>
          <input
            type="text"
            placeholder="Title"
            value={newBroadcast.title || ''}
            onChange={e => setNewBroadcast(p => ({...p, title: e.target.value}))}
            className={`w-full p-2 rounded ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-slate-800 text-slate-100'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
          />
          <textarea
            placeholder="Message"
            value={newBroadcast.message || ''}
            onChange={e => setNewBroadcast(p => ({...p, message: e.target.value}))}
            className={`w-full p-2 rounded h-24 ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-slate-800 text-slate-100'} focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none`}
          />
          <button
            onClick={handleSendBroadcast}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <SafeSend size={16} /> Send Broadcast
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className={`border-b ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/40'} backdrop-blur-sm px-6 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-slate-800'}`}
              title="Admin home"
              aria-label="Go to admin dashboard"
            >
              <SafeHome size={18} />
            </button>
            <h2 className="text-lg font-semibold">Broadcasts</h2>
            <div className={`flex gap-1 rounded-md p-1 ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-800'}`}>
              <button
                onClick={() => { setActiveTab('all'); setSelected([]); }}
                className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${
                  activeTab === 'all'
                    ? theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-slate-700 text-white'
                    : theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-slate-700 text-slate-400'
                }`}
                title="All broadcasts"
                aria-label="All broadcasts tab"
              >
                All Broadcasts
              </button>
              <button
                onClick={() => { setActiveTab('scheduled'); setSelected([]); }}
                className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${
                  activeTab === 'scheduled'
                    ? theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-slate-700 text-white'
                    : theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-slate-700 text-slate-400'
                }`}
                title="Scheduled broadcasts"
                aria-label="Scheduled broadcasts tab"
              >
                Scheduled
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <SafeSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-500' : 'text-slate-400'}`} size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={`${theme === 'light' ? 'bg-gray-200 border-gray-300 text-gray-900 placeholder-gray-500' : 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'} border pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500`}
              />
            </div>
            <button
              onClick={() => setShowFiltersPanel(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFiltersPanel
                  ? theme === 'light' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : theme === 'light' ? 'bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300' : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
              }`}
              title="Open filters menu"
              aria-label="Open filters menu"
            >
              <SafeFilter size={16} /> Filters
            </button>
            <button
              onClick={() => fetchBroadcasts(1, true)}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-slate-800'}`}
              title="Refresh"
              aria-label="Refresh"
            >
              <SafeRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${theme === 'light' ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-red-600/20 text-red-200 border border-red-700/50'}`}>
            {error}
            <button onClick={() => setError(null)} className="ml-2" title="Dismiss error" aria-label="Dismiss error message">×</button>
          </div>
        )}

        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center justify-between ${theme === 'light' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-green-600/15 text-green-200 border border-green-700/40'}`}>
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="ml-3" title="Dismiss status" aria-label="Dismiss status message">x</button>
          </div>
        )}

        {showFiltersPanel && (
          <div className={`mx-6 mt-4 rounded-xl border p-4 ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/50'}`}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>Sort column</span>
                <select
                  value={filters.sortBy}
                  onChange={(event) => setFilters(prev => ({ ...prev, sortBy: event.target.value as FilterState['sortBy'] }))}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 ${theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-slate-700 bg-slate-800 text-slate-100'}`}
                >
                  <option value="date">Date</option>
                  <option value="delivery">Delivery</option>
                  <option value="engagement">Engagement</option>
                </select>
              </label>
              <label className="text-sm">
                <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>Direction</span>
                <select
                  value={filters.direction}
                  onChange={(event) => setFilters(prev => ({ ...prev, direction: event.target.value as FilterState['direction'] }))}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 ${theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-slate-700 bg-slate-800 text-slate-100'}`}
                >
                  <option value="desc">Highest / newest first</option>
                  <option value="asc">Lowest / oldest first</option>
                </select>
              </label>
              <div className="text-sm">
                <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>Showing</span>
                <div className="mt-2 font-semibold">{visibleBroadcasts.length} matching broadcast{visibleBroadcasts.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className={`border-b ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/20'} px-6 py-3`}>
          <div className="flex items-center gap-6 text-sm">
            <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>
              Total: <span className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>{visibleBroadcasts.length}</span>
            </span>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>
              Sent: <span className={`${theme === 'light' ? 'text-green-600' : 'text-green-400'} font-semibold`}>{visibleBroadcasts.filter(b => b.status === 'sent').length}</span>
            </span>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>
              Scheduled: <span className={`${theme === 'light' ? 'text-amber-600' : 'text-amber-400'} font-semibold`}>{broadcasts.filter(b => b.status === 'scheduled').length}</span>
            </span>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-slate-400'}>
              Loaded: <span className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>{pagination.total}</span>
            </span>
            <button
              onClick={() => setShowAnalytics(prev => !prev)}
              className={`ml-auto px-3 py-1 rounded text-xs font-medium transition-colors ${
                showAnalytics
                  ? theme === 'light' ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-200'
                  : theme === 'light' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
              title="View analytics"
              aria-label="Review analytics"
            >
              Review Analytics
            </button>
          </div>
        </div>

        {showAnalytics && (
          <section className={`mx-6 mt-4 grid gap-4 md:grid-cols-3`}>
            {[
              ['Avg Delivery', `${averageDelivery}%`, 'Watch failed sends below 90%.'],
              ['Avg Engagement', `${averageEngagement}%`, 'Test shorter copy for low clicks.'],
              ['Scheduled Queue', `${broadcasts.filter(item => item.status === 'scheduled').length}`, 'Keep time-sensitive alerts reviewed.'],
            ].map(([label, value, helper]) => (
              <div key={label} className={`rounded-xl border p-4 ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/50'}`}>
                <div className={theme === 'light' ? 'text-gray-600 text-sm' : 'text-slate-400 text-sm'}>{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
                <div className={theme === 'light' ? 'mt-2 text-xs text-gray-500' : 'mt-2 text-xs text-slate-500'}>{helper}</div>
              </div>
            ))}
          </section>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`border rounded-xl overflow-hidden ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/40'}`}>
            {/* Bulk Actions Bar */}
            {selected.length > 0 && (
              <div className={`border-b ${theme === 'light' ? 'border-gray-300 bg-gray-100' : 'border-slate-700 bg-slate-800/60'} px-6 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'}`}>{selected.length} selected</span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setBulkAction('approve'); setShowBulkModal(true); }}
                    className={`text-sm px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors ${theme === 'light' ? 'bg-green-100 text-green-900 hover:bg-green-200' : 'bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-700/50'}`}
                  >
                    <SafeUserCheck size={16} /> Approve
                  </button>
                  <button
                    onClick={() => { setBulkAction('flag'); setShowBulkModal(true); }}
                    className={`text-sm px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors ${theme === 'light' ? 'bg-red-100 text-red-900 hover:bg-red-200' : 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-700/50'}`}
                  >
                    <SafeAlertTriangle size={16} /> Flag
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-slate-700'}`} title="More options" aria-label="More options">
                    <SafeMoreVertical size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="w-full text-sm">
              <thead className={theme === 'light' ? 'bg-gray-100' : 'bg-slate-800/40'}>
                <tr>
                  <th className={`w-10 px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium`}>
                    <input
                      type="checkbox"
                      checked={selected.length === visibleBroadcasts.length && visibleBroadcasts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded accent-amber-500"
                      aria-label="Select all broadcasts"
                    />
                  </th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium`}>Title</th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium cursor-pointer`} onClick={() => applySortBy('date')}>
                    Segments
                  </th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium`}>Status</th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium cursor-pointer`} onClick={() => applySortBy('delivery')}>
                    Delivery %
                  </th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium cursor-pointer`} onClick={() => applySortBy('engagement')}>
                    Engagement %
                  </th>
                  <th className={`px-6 py-3 text-left ${theme === 'light' ? 'text-gray-700' : 'text-slate-400'} font-medium`}>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {visibleBroadcasts.map(b => (
                  <tr
                    key={b.id}
                    className={`border-b transition-colors ${
                      selected.includes(b.id)
                        ? theme === 'light' ? 'bg-amber-50' : 'bg-amber-950/30'
                        : theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-800/40'
                    } ${theme === 'light' ? 'border-gray-300' : 'border-slate-800'}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded accent-amber-500"
                        aria-label={`Select ${b.title}`}
                      />
                    </td>
                    <td className={`px-6 py-4 font-medium ${theme === 'light' ? 'text-gray-900' : 'text-slate-100'}`}>{b.title}</td>
                    <td className={`px-6 py-4 ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{b.targetSegments.join(', ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        b.status === 'sent'
                          ? theme === 'light' ? 'bg-green-100 text-green-900' : 'bg-green-600/20 text-green-400'
                          : b.status === 'draft'
                          ? theme === 'light' ? 'bg-amber-100 text-amber-900' : 'bg-amber-600/20 text-amber-400'
                          : b.status === 'scheduled'
                          ? theme === 'light' ? 'bg-blue-100 text-blue-900' : 'bg-blue-600/20 text-blue-300'
                          : b.status === 'failed'
                          ? theme === 'light' ? 'bg-red-100 text-red-900' : 'bg-red-600/20 text-red-400'
                          : theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{b.deliveryRate ?? '-'}%</td>
                    <td className={`px-6 py-4 font-mono ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{b.engagementRate ?? '-'}%</td>
                    <td className={`px-6 py-4 ${theme === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
                      {b.sentAt || b.scheduledAt ? new Date(b.sentAt ?? b.scheduledAt!).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleBroadcasts.length === 0 && (
              <div className={`text-center py-12 ${theme === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
                No broadcasts match the current tab, search, and filters.
              </div>
            )}
          </div>

          <div className={`mt-6 rounded-xl border p-5 ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-slate-800 bg-slate-900/40'}`}>
            <h3 className="text-base font-semibold">Recommended Improvements</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['Approval workflow', 'Add maker-checker approval before urgent broadcasts go live.'],
                ['Audience estimate', 'Show estimated recipients before sending to avoid accidental wide blasts.'],
                ['A/B templates', 'Save reusable safety, verification, and event templates with performance history.'],
              ].map(([title, body]) => (
                <div key={title} className={`rounded-lg border p-4 ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-950/40'}`}>
                  <div className="font-medium">{title}</div>
                  <p className={theme === 'light' ? 'mt-2 text-sm text-gray-600' : 'mt-2 text-sm text-slate-400'}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-96 ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-800 text-slate-100'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Bulk Action</h3>
              <button onClick={() => setShowBulkModal(false)} className={`p-1 rounded ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-700'}`} title="Close modal" aria-label="Close confirmation modal">
                <SafeX size={20} />
              </button>
            </div>
            <p className={`mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>Apply to {selected.length} broadcast{selected.length !== 1 ? 's' : ''}?</p>
            <div className="flex gap-4">
              <button
                onClick={() => confirmBulkAction(bulkAction!)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  bulkAction === 'approve'
                    ? theme === 'light' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'
                    : theme === 'light' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {bulkAction === 'approve' ? 'Approve' : 'Flag'}
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'light' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
