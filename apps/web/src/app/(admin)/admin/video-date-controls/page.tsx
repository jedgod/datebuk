'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, RefreshCw, MoreVertical, CheckCircle, Flag,
  AlertTriangle, X, Moon, Sun, Loader2, BarChart3, Users, Clock,
  Download, Zap, AlertCircle, Home
} from 'lucide-react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useHotkeys } from 'react-hotkeys-hook'
import useWebSocket from 'react-use-websocket'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

type VideoReviewItem = {
  id: string
  matchId: string
  users: { name: string; avatar?: string; intent: 'Faith' | 'Casual' | 'Professional' }[]
  startedAt: string
  durationSec?: number
  aiScores: { nudity: number; audio: number; overall: number }
  status: 'active' | 'flagged' | 'reviewed' | 'interrupted' | 'escalated'
  reports: number
  priority: 'high' | 'medium' | 'low'
  chatSnippet?: string
}

type FilterState = {
  sortBy: 'priority' | 'recency' | 'nudity' | 'overall' | 'reports'
  direction: 'asc' | 'desc'
  intent?: 'Faith' | 'Casual' | 'Professional'
  onlyHighRisk: boolean
}

type Pagination = {
  page: number
  hasMore: boolean
  total: number
}

type Theme = 'dark' | 'light'

type ModeratorStats = {
  decisionsPerHour: number
  aiAgreementRate: number
  fatigueScore: number
  topViolations: { category: string; count: number }[]
}

type AgreementTrendPoint = {
  hour: string
  agreementRate: number
  decisions: number
  fatigueLevel: number
}

type FilterPreset = {
  id: string
  name: string
  filters: FilterState
  createdAt: string
}

type VideoQueueMessage =
  | { type: 'video-flag-update'; item: VideoReviewItem }
  | { type: 'moderator-fatigue-alert'; message: string }

export default function AdminVideoDateControlsPage() {
  const router = useRouter()
  const [items, setItems] = useState<VideoReviewItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'priority',
    direction: 'desc',
    onlyHighRisk: true,
  })
  const [pagination, setPagination] = useState<Pagination>({ page: 1, hasMore: true, total: 0 })
  const [stats, setStats] = useState<ModeratorStats | null>(null)
  const [trendData, setTrendData] = useState<AgreementTrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<VideoReviewItem | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'interrupt' | 'escalate' | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const [fatigueAlert, setFatigueAlert] = useState<string | null>(null)
  const [showChartZoom, setShowChartZoom] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  const scrollRef = useRef<HTMLDivElement>(null)

  // ─────────────────────────────────────────────────
  // Theme persistence
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('video-control-theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('video-control-theme', theme)
  }, [theme])

  // ─────────────────────────────────────────────────
  // Load presets from server
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await fetch('/api/admin/filter-presets')
        if (res.ok) {
          const data = await res.json()
          setPresets(data.presets)
        }
      } catch (err) {
        console.error('Failed to load presets:', err)
      }
    }
    loadPresets()
  }, [])

  // ─────────────────────────────────────────────────
  // Fetch queue + stats + trends
  // ─────────────────────────────────────────────────
  const fetchData = useCallback(async (page: number = 1, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy: filters.sortBy,
        dir: filters.direction,
        onlyHighRisk: filters.onlyHighRisk.toString(),
        ...(filters.intent && { intent: filters.intent }),
      })

      const [queueRes, statsRes, trendRes] = await Promise.all([
        fetch(`/api/admin/active-video-queue?${params}`),
        fetch('/api/admin/moderator-stats'),
        fetch('/api/admin/agreement-trend'),
      ])

      if (!queueRes.ok || !statsRes.ok) throw new Error('Failed to load data')

      const { data, pagination: meta } = await queueRes.json()
      const statsData = await statsRes.json()
      const trendData = trendRes.ok ? await trendRes.json() : { data: [] }

      setItems(prev => (append ? [...prev, ...data] : data))
      setPagination(meta)
      setStats(statsData)
      setTrendData(trendData.data || [])

      // Check for fatigue alerts
      if (statsData.fatigueScore > 75) {
        setFatigueAlert(`High moderator fatigue detected (${statsData.fatigueScore}%). Consider taking a break.`)
      } else {
        setFatigueAlert(null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData(1, false)
  }, [fetchData])

  // ─────────────────────────────────────────────────
  // Live WebSocket updates
  // ─────────────────────────────────────────────────
  const { lastJsonMessage } = useWebSocket<VideoQueueMessage>('wss://your-domain.com/ws/video-queue', {
    shouldReconnect: () => true,
  })

  useEffect(() => {
    if (lastJsonMessage?.type === 'video-flag-update') {
      const updated = lastJsonMessage.item
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === updated.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = updated
          return copy
        }
        return [updated, ...prev]
      })
    }

    if (lastJsonMessage?.type === 'moderator-fatigue-alert') {
      setFatigueAlert(lastJsonMessage.message)
    }
  }, [lastJsonMessage])

  // ─────────────────────────────────────────────────
  // Polling fallback (20 sec)
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => fetchData(pagination.page, true), 20000)
    return () => clearInterval(interval)
  }, [pagination.page, fetchData])

  // ─────────────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────────────
  useHotkeys('j', () => console.log('next'), { preventDefault: true })
  useHotkeys('k', () => console.log('prev'), { preventDefault: true })
  useHotkeys('a', () => {
    if (selected.length) {
      setBulkAction('approve')
      setShowBulkModal(true)
    }
  }, { preventDefault: true })
  useHotkeys('f', () => {
    if (selected.length) {
      setBulkAction('escalate')
      setShowBulkModal(true)
    }
  }, { preventDefault: true })
  useHotkeys('esc', () => {
    setSelected([])
    setPreviewItem(null)
  })

  // ─────────────────────────────────────────────────
  // Selection handlers
  // ─────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelected(selected.length === items.length ? [] : items.map(i => i.id))
  }

  // ─────────────────────────────────────────────────
  // Bulk actions
  // ─────────────────────────────────────────────────
  const handleBulk = async () => {
    if (!bulkAction) return

    try {
      const actionMap: Record<string, string> = {
        approve: 'approve',
        interrupt: 'interrupt',
        escalate: 'escalate',
      }

      const res = await fetch('/api/admin/bulk-video-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selected,
          action: actionMap[bulkAction],
        }),
      })

      if (!res.ok) throw new Error('Failed to perform bulk action')

      // Optimistic update
      setItems(prev =>
        prev.map(i =>
          selected.includes(i.id)
            ? {
              ...i,
              status: bulkAction === 'approve' ? 'reviewed' : 'escalated',
            }
            : i
        )
      )

      setSelected([])
      setShowBulkModal(false)
      setBulkAction(null)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // ─────────────────────────────────────────────────
  // Single interrupt
  // ─────────────────────────────────────────────────
  const handleInterrupt = async (id: string | string[], isBulk: boolean = false) => {
    const message = isBulk
      ? `Interrupt ${Array.isArray(id) ? id.length : 1} live sessions? Users will be disconnected immediately.`
      : `Interrupt this live session?`

    if (!confirm(message)) return

    try {
      const res = await fetch('/api/admin/interrupt-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.isArray(id) ? id : [id],
        }),
      })

      if (!res.ok) throw new Error('Failed to interrupt')

      // Optimistic update
      setItems(prev =>
        prev.map(item =>
          (Array.isArray(id) ? id.includes(item.id) : item.id === id)
            ? { ...item, status: 'interrupted' }
            : item
        )
      )

      if (!isBulk) setPreviewItem(null)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // ─────────────────────────────────────────────────
  // CSV Export (enhanced with filtering)
  // ─────────────────────────────────────────────────
  const exportToCSV = () => {
    if (items.length === 0) return alert('No data to export')

    const headers = [
      'ID',
      'Match ID',
      'Users',
      'Intent',
      'Started',
      'Duration (sec)',
      'Nudity %',
      'Audio %',
      'Overall %',
      'Reports',
      'Priority',
      'Status',
      'Last Message',
    ]

    const rows = items.map(item => [
      item.id,
      item.matchId,
      item.users.map(u => u.name).join(', '),
      item.users.map(u => u.intent).join(', '),
      new Date(item.startedAt).toLocaleString(),
      item.durationSec || '-',
      item.aiScores.nudity,
      item.aiScores.audio,
      item.aiScores.overall,
      item.reports,
      item.priority,
      item.status,
      item.chatSnippet || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `video-queue-${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─────────────────────────────────────────────────
  // Preset management
  // ─────────────────────────────────────────────────
  const savePreset = async () => {
    if (!presetName.trim()) return alert('Enter preset name')

    try {
      const res = await fetch('/api/admin/filter-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName,
          filters,
        }),
      })

      if (!res.ok) throw new Error('Failed to save preset')

      const newPreset = await res.json()
      setPresets(prev => [...prev, newPreset.preset])
      setPresetName('')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
  }

  const deletePreset = async (presetId: string) => {
    try {
      const res = await fetch(`/api/admin/filter-presets/${presetId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete preset')

      setPresets(prev => prev.filter(p => p.id !== presetId))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div
      className={`min-h-screen ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-950 text-gray-100'} flex`}
    >
      {/* ──────────────────────────────────────────────── */}
      {/* SIDEBAR – Controls & Stats */}
      {/* ──────────────────────────────────────────────── */}
      <aside className="w-80 border-r border-gray-800/40 p-5 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Video Date Controls</h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-800/30"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Fatigue Alert */}
        {fatigueAlert && (
          <div className="bg-red-950/50 border border-red-800 p-3 rounded-lg flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{fatigueAlert}</p>
          </div>
        )}

        {/* Queue Stats */}
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/60">
          <h3 className="text-sm font-semibold mb-3">Active Queue Stats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Pending</div>
              <div className="text-2xl font-bold">
                {stats?.decisionsPerHour || <Skeleton width={40} />}
              </div>
            </div>
            <div>
              <div className="text-gray-400">AI Agreement</div>
              <div className="text-2xl font-bold text-emerald-400">
                {stats?.aiAgreementRate || <Skeleton width={40} />}%
              </div>
            </div>
            {stats && (
              <>
                <div>
                  <div className="text-gray-400 text-xs">Fatigue Level</div>
                  <div
                    className={`text-lg font-bold ${
                      stats.fatigueScore > 75
                        ? 'text-red-400'
                        : stats.fatigueScore > 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {stats.fatigueScore}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Reviewed</div>
                  <div className="text-lg font-bold text-sky-400">
                    {pagination.total}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Agreement Trend Chart */}
        {trendData.length > 0 && (
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">AI Agreement Trend (24h)</h4>
              <select
                value={chartType}
                onChange={e => setChartType(e.target.value as 'line' | 'area')}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
              >
                <option value="area">Area</option>
                <option value="line">Line</option>
              </select>
            </div>
            <div className="h-56 -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="agreementRate"
                      stroke="#10B981"
                      fill="#10B98133"
                      strokeWidth={2}
                      name="Agreement %"
                    />
                  </AreaChart>
                ) : (
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="agreementRate"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Agreement %"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="fatigueLevel"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Fatigue Level"
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Intent Filter</label>
            <select
              value={filters.intent || ''}
              onChange={e =>
                setFilters(f => ({ ...f, intent: (e.target.value || undefined) as any }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm"
            >
              <option value="">All Intents</option>
              <option value="Faith">Faith</option>
              <option value="Casual">Casual</option>
              <option value="Professional">Professional</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.onlyHighRisk}
              onChange={() =>
                setFilters(f => ({ ...f, onlyHighRisk: !f.onlyHighRisk }))
              }
            />
            Only high-risk sessions
          </label>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={e =>
                setFilters(f => ({ ...f, sortBy: e.target.value as any }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm"
            >
              <option value="priority">Priority</option>
              <option value="recency">Recency</option>
              <option value="nudity">Nudity Score</option>
              <option value="overall">Overall Risk</option>
              <option value="reports">Reports Count</option>
            </select>
          </div>
        </div>

        {/* Saved Presets */}
        <div className="border-t border-gray-800/40 pt-4">
          <h4 className="text-sm font-medium mb-3">Saved Presets</h4>
          <div className="space-y-2 mb-4">
            {presets.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <button
                  onClick={() => applyPreset(p)}
                  className="flex-1 text-left px-3 py-2 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-sm"
                >
                  {p.name}
                </button>
                <button
                  onClick={() => deletePreset(p.id)}
                  className="p-2 hover:bg-red-900/30 rounded text-red-400"
                  title="Delete preset"
                  aria-label="Delete preset"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              onClick={savePreset}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
              title="Save filter preset"
              aria-label="Save filter preset"
            >
              Save
            </button>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────── */}
      {/* MAIN CONTENT */}
      {/* ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800/50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-gray-950/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <Home size={18} />
            </button>
            <h2 className="text-lg font-semibold">Active Video Review Queue</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchData(1, false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
              title="Refresh queue"
              aria-label="Refresh queue"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
              title="Export to CSV"
              aria-label="Export to CSV"
            >
              <Download size={14} /> Export
            </button>
            {selected.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setBulkAction('approve')
                    setShowBulkModal(true)
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center gap-2"
                  title="Approve selected sessions"
                  aria-label="Approve selected sessions"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => handleInterrupt(selected, true)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm flex items-center gap-2"
                  title="Interrupt selected sessions"
                  aria-label="Interrupt selected sessions"
                >
                  <AlertTriangle size={14} /> Interrupt
                </button>
              </>
            )}
          </div>
        </header>

        {/* Infinite scroll area */}
        <div id="scrollable" ref={scrollRef} className="flex-1 overflow-auto p-6">
          {/* Initial loading state */}
          {loading && items.length === 0 ? (
            <div className="space-y-6">
              <Skeleton count={5} height={140} className="mb-4 rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full min-h-96">
              <div className="text-center space-y-4 p-8 rounded-xl bg-gray-900/40">
                <Users size={48} className="text-gray-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto mb-4">
                    No live video dating sessions are currently active or flagged for review.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-500">💡 Tips:</p>
                    <ul className="text-gray-400 space-y-1 text-left inline-block">
                      <li>• Active sessions appear here automatically</li>
                      <li>• High-risk content is flagged in real-time</li>
                      <li>• Adjust filters to review historical sessions</li>
                      <li>• Check back when there's user activity</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => fetchData(1, false)}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-100"
                  title="Refresh queue"
                >
                  <RefreshCw size={14} className="inline mr-2" /> Refresh
                </button>
              </div>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={() => fetchData(pagination.page + 1, true)}
              hasMore={pagination.hasMore && !loading}
              loader={<Skeleton count={5} height={140} className="mb-4 rounded-xl" />}
              scrollableTarget="scrollable"
              endMessage={
                <p className="text-center py-8 text-gray-500">End of queue</p>
              }
            >
              {error && (
                <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={selected.length === items.length && items.length > 0}
                    onChange={toggleAll}
                    title="Select all"
                    aria-label="Select all items"
                    className="w-4 h-4"
                  />
                  {selected.length > 0 && (
                    <span className="text-sm text-gray-400">
                      {selected.length} selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-gray-900/60 border ${selected.includes(item.id)
                      ? 'border-indigo-500/60'
                      : 'border-gray-800/50'
                      } rounded-xl p-4 hover:border-gray-600 transition-all cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4"
                          title="Select item"
                          aria-label={`Select ${item.users.map(u => u.name).join(', ')}`}
                        />
                        {item.users.map(u => (
                          <div key={u.name} className="flex items-center gap-2">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                className="w-8 h-8 rounded-full"
                                alt={u.name}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-700" />
                            )}
                            <span className="font-medium text-sm">
                              {u.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${item.priority === 'high'
                          ? 'bg-red-600/80'
                          : item.priority === 'medium'
                            ? 'bg-orange-600/80'
                            : 'bg-green-600/80'
                          }`}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="bg-gray-800/50 p-2 rounded">
                        Nudity:{' '}
                        <span
                          className={
                            item.aiScores.nudity > 80
                              ? 'text-red-400'
                              : 'text-orange-400'
                          }
                        >
                          {item.aiScores.nudity}%
                        </span>
                      </div>
                      <div className="bg-gray-800/50 p-2 rounded">
                        Audio:{' '}
                        <span
                          className={
                            item.aiScores.audio > 70
                              ? 'text-red-400'
                              : 'text-orange-400'
                          }
                        >
                          {item.aiScores.audio}%
                        </span>
                      </div>
                      <div className="bg-gray-800/50 p-2 rounded">
                        Overall:{' '}
                        <span
                          className={
                            item.aiScores.overall > 75
                              ? 'text-red-400'
                              : 'text-emerald-400'
                          }
                        >
                          {item.aiScores.overall}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      Started {new Date(item.startedAt).toLocaleTimeString()}
                      {item.reports > 0 && (
                        <span className="ml-2 text-red-400">
                          • {item.reports} reports
                        </span>
                      )}
                    </div>

                    {item.chatSnippet && (
                      <div className="mt-3 text-xs bg-gray-800/40 p-2.5 rounded border-l-4 border-orange-600 line-clamp-2">
                        {item.chatSnippet}
                      </div>
                    )}

                    <button
                      onClick={() => setPreviewItem(item)}
                      className="w-full mt-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                </div>
              </div>
            </InfiniteScroll>
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────────── */}
      {/* RIGHT PANEL – Preview + Actions */}
      {/* ──────────────────────────────────────────────── */}
      {previewItem && (
        <aside className="w-96 border-l border-gray-800/50 bg-gray-950/80 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Session Review</h3>
            <button
              onClick={() => setPreviewItem(null)}
              className="p-2 hover:bg-gray-800 rounded-lg"
              title="Close preview"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {/* AI Scores */}
            <div className="bg-gray-900/60 p-4 rounded-xl">
              <h4 className="text-sm font-medium mb-3">AI Flags</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nudity</span>
                  <span
                    className={
                      previewItem.aiScores.nudity > 80
                        ? 'text-red-400'
                        : 'text-orange-400'
                    }
                  >
                    {previewItem.aiScores.nudity}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Audio</span>
                  <span
                    className={
                      previewItem.aiScores.audio > 70
                        ? 'text-red-400'
                        : 'text-orange-400'
                    }
                  >
                    {previewItem.aiScores.audio}%
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Overall Risk</span>
                  <span
                    className={
                      previewItem.aiScores.overall > 75
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }
                  >
                    {previewItem.aiScores.overall}%
                  </span>
                </div>
              </div>
            </div>

            {/* Chat snippet */}
            {previewItem.chatSnippet && (
              <div className="bg-gray-900/40 p-4 rounded-xl border-l-4 border-orange-600">
                <div className="text-xs text-gray-400 mb-1">Recent message</div>
                <div className="text-sm">{previewItem.chatSnippet}</div>
              </div>
            )}

            {/* Session info */}
            <div className="bg-gray-900/60 p-4 rounded-xl text-sm space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Status</span>
                <span className="text-white capitalize">{previewItem.status}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Started</span>
                <span className="text-white">
                  {new Date(previewItem.startedAt).toLocaleString()}
                </span>
              </div>
              {previewItem.durationSec && (
                <div className="flex justify-between text-gray-400">
                  <span>Duration</span>
                  <span className="text-white">{previewItem.durationSec}s</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleBulk()}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium"
                title="Approve session"
                aria-label="Approve session"
              >
                Approve
              </button>
              <button
                onClick={() => handleInterrupt(previewItem.id, false)}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-medium"
                title="Interrupt live session"
                aria-label="Interrupt live session"
              >
                Interrupt
              </button>
            </div>
            <button
              onClick={() => {
                setBulkAction('escalate')
                setShowBulkModal(true)
              }}
              className="w-full py-3 bg-amber-700/70 hover:bg-amber-700 rounded-lg font-medium flex items-center justify-center gap-2"
              title="Escalate for senior review"
              aria-label="Escalate for senior review"
            >
              <AlertTriangle size={16} /> Escalate
            </button>
          </div>
        </aside>
      )}

      {/* ──────────────────────────────────────────────── */}
      {/* BULK ACTION MODAL */}
      {/* ──────────────────────────────────────────────── */}
      {showBulkModal && bulkAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm bulk action</h3>
            <p className="mb-6 text-gray-300">
              {bulkAction === 'approve' &&
                `Approve ${selected.length} sessions?`}
              {bulkAction === 'interrupt' &&
                `Interrupt ${selected.length} live sessions?`}
              {bulkAction === 'escalate' &&
                `Escalate ${selected.length} sessions to senior review?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBulk}
                className={`flex-1 py-3 rounded-lg font-medium ${bulkAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : bulkAction === 'interrupt'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                  }`}
              >
                Confirm {bulkAction}
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
