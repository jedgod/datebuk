'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Filter, RefreshCw, MoreVertical, CheckCircle, 
  Flag, AlertTriangle, X, Moon, Sun, Loader2, Home 
} from 'lucide-react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useHotkeys } from 'react-hotkeys-hook'
import useWebSocket from 'react-use-websocket'

// Safe cast for Lucide React icons
const SafeSearch = Search as any;
const SafeFilter = Filter as any;
const SafeRefreshCw = RefreshCw as any;
const SafeMoreVertical = MoreVertical as any;
const SafeCheckCircle = CheckCircle as any;
const SafeFlag = Flag as any;
const SafeAlertTriangle = AlertTriangle as any;
const SafeX = X as any;
const SafeMoon = Moon as any;
const SafeSun = Sun as any;

type QuarantineItem = {
  id: string
  videoId: string
  user: { name: string; avatar?: string; trust: 'high'|'medium'|'low'|'new' }
  severity: number          // 0–100
  priority: 'P0'|'P1'|'P2'|'P3'|'P4'|'P5'
  nudityScore: number
  audioScore: number
  flaggedAt: string
  reason: string
  chatSnippet?: string
  keyframes: string[]       // thumbnail URLs
  waveformUrl?: string
  durationSec: number
  status: 'quarantined'|'reviewed'|'released'|'deleted'
}

type FilterState = {
  sortBy: 'severity' | 'recency' | 'nudity' | 'audio' | 'priority'
  direction: 'asc' | 'desc'
  minSeverity?: number
  onlyHighNudity: boolean
  onlyExplicitAudio: boolean
  trustLevel?: 'new'|'low'|'medium'|'high'
}

type Pagination = {
  page: number
  hasMore: boolean
  total: number
}

type Theme = 'dark' | 'light'

type QuarantineUpdateMessage = {
  type: 'quarantine-update'
  item: QuarantineItem
}

export default function AdminQuarantinePage() {
  const router = useRouter()
  const [items, setItems] = useState<QuarantineItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'severity',
    direction: 'desc',
    onlyHighNudity: false,
    onlyExplicitAudio: false,
  })
  const [pagination, setPagination] = useState<Pagination>({ page: 1, hasMore: true, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<QuarantineItem | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'release' | 'delete' | 'escalate' | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // ────────────────────────────────────────────────
  // Theme persistence
  // ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  // ────────────────────────────────────────────────
  // Data fetching
  // ────────────────────────────────────────────────
  const fetchItems = useCallback(async (page: number, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: filters.sortBy,
        direction: filters.direction,
        ...(filters.minSeverity !== undefined && { minSeverity: filters.minSeverity.toString() }),
        onlyHighNudity: filters.onlyHighNudity.toString(),
        onlyExplicitAudio: filters.onlyExplicitAudio.toString(),
        ...(filters.trustLevel && { trustLevel: filters.trustLevel }),
      })

      const res = await fetch(`/api/admin/quarantine?${params}`)
      if (!res.ok) throw new Error('Failed to load quarantined items')
      const { data, pagination: meta } = await res.json()

      setItems(prev => append ? [...prev, ...data] : data)
      setPagination(meta)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchItems(1, false)
  }, [fetchItems])

  // ────────────────────────────────────────────────
  // Live updates – WebSocket + polling fallback
  // ────────────────────────────────────────────────
  const { lastJsonMessage } = useWebSocket<QuarantineUpdateMessage>('wss://your-domain.com/ws/quarantine', {
    shouldReconnect: () => true,
  })

  useEffect(() => {
    if (lastJsonMessage?.type === 'quarantine-update') {
      const updated = lastJsonMessage.item
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === updated.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = updated
          return copy
        }
        return [updated, ...prev] // new item → prepend
      })
    }
  }, [lastJsonMessage])

  // polling fallback (every 25 seconds)
  useEffect(() => {
    const t = setInterval(() => {
      fetchItems(pagination.page, true)
    }, 25000)
    return () => clearInterval(t)
  }, [pagination.page, fetchItems])

  // ────────────────────────────────────────────────
  // Keyboard shortcuts
  // ────────────────────────────────────────────────
  useHotkeys('j', () => {
    // focus next row – simplistic version
    console.log('next row')
  }, { preventDefault: true })

  useHotkeys('k', () => {
    console.log('previous row')
  }, { preventDefault: true })

  useHotkeys('a', () => {
    if (selected.length > 0) {
      setBulkAction('release')
      setShowBulkModal(true)
    }
  }, { preventDefault: true })

  useHotkeys('f', () => {
    if (selected.length > 0) {
      setBulkAction('escalate')
      setShowBulkModal(true)
    }
  }, { preventDefault: true })

  useHotkeys('esc', () => {
    setSelected([])
    setPreviewItem(null)
  }, { preventDefault: true })

  // ────────────────────────────────────────────────
  // Selection logic
  // ────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selected.length === items.length) {
      setSelected([])
    } else {
      setSelected(items.map(i => i.id))
    }
  }

  const handleBulkConfirm = async () => {
    if (!bulkAction) return
    // TODO: call real API endpoint
    console.log(`Bulk ${bulkAction} on ids:`, selected)

    // optimistic update example
    setItems(prev =>
      prev.map(item =>
        selected.includes(item.id)
          ? { ...item, status: bulkAction === 'release' ? 'released' : 'reviewed' as any }
          : item
      )
    )

    setSelected([])
    setShowBulkModal(false)
    setBulkAction(null)
  }

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-950 text-gray-100'} flex`}>
      {/* Sidebar – Filters */}
      <aside className={`w-80 border-r ${theme === 'light' ? 'border-gray-200' : 'border-gray-800/40'} p-5 flex flex-col gap-6 overflow-y-auto ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-950/40'}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Quarantine</h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-800/30'}`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SafeSun size={18} /> : <SafeMoon size={18} />}
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <SafeSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`} size={16} />
            <input
              placeholder="Search video ID / user…"
              className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' : 'bg-gray-900/60 border-gray-700 text-gray-100 placeholder-gray-400'} border pl-10 py-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500`}
            />
          </div>

          <div>
            <label className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} block mb-1.5`} htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
              title="Sort quarantine items by"
              aria-label="Sort quarantine items"
              className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-100'} border rounded-lg py-2 px-3 text-sm`}
            >
              <option value="severity">Severity</option>
              <option value="recency">Recency</option>
              <option value="nudity">Nudity score</option>
              <option value="audio">Audio score</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <div className="space-y-2 text-sm">
            <label className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              <input type="checkbox" checked={filters.onlyHighNudity} onChange={() => setFilters(f => ({...f, onlyHighNudity: !f.onlyHighNudity}))} className="rounded accent-indigo-500" />
              High nudity score (&gt;80%)
            </label>
            <label className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              <input type="checkbox" checked={filters.onlyExplicitAudio} onChange={() => setFilters(f => ({...f, onlyExplicitAudio: !f.onlyExplicitAudio}))} className="rounded accent-indigo-500" />
              Explicit audio alerts
            </label>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className={`border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800/50 bg-gradient-to-b from-gray-950/80 to-transparent'} backdrop-blur-sm px-6 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-200 text-gray-700' : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'}`}
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <Home size={18} />
            </button>
            <h2 className="text-lg font-semibold">Video Quarantine Queue</h2>
          </div>

          <div className="flex items-center gap-3">
            <button className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'}`} title="Refresh quarantine queue" aria-label="Refresh">
              <SafeRefreshCw size={14} /> Refresh
            </button>
            {selected.length > 0 && (
              <>
                <button
                  onClick={() => { setBulkAction('release'); setShowBulkModal(true) }}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm flex items-center gap-2 text-white font-medium"
                  title={`Release ${selected.length} items`}
                  aria-label={`Release ${selected.length} items`}
                >
                  <SafeCheckCircle size={14} /> Release ({selected.length})
                </button>
                <button
                  onClick={() => { setBulkAction('delete'); setShowBulkModal(true) }}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg text-sm flex items-center gap-2 text-white font-medium"
                  title={`Delete ${selected.length} items`}
                  aria-label={`Delete ${selected.length} items`}
                >
                  <SafeX size={14} /> Delete
                </button>
              </>
            )}
          </div>
        </header>

        {/* Table + mosaic */}
        <div
          id="scrollableDiv"
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-6"
        >
          {/* Initial loading state */}
          {loading && items.length === 0 ? (
            <div className="space-y-6">
              <Skeleton count={6} height={200} className="mb-6 rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full min-h-96">
              <div className={`text-center space-y-4 p-8 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/40'}`}>
                <SafeCheckCircle size={48} className={theme === 'light' ? 'text-gray-400 mx-auto' : 'text-gray-600 mx-auto'} />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Quarantined Videos</h3>
                  <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-sm max-w-xs mx-auto mb-4`}>
                    All videos are clear! New flagged content will appear here automatically when detected.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-500'}>
                      💡 Tips:
                    </p>
                    <ul className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} space-y-1 text-left inline-block`}>
                      <li>• Content is automatically analyzed during video calls</li>
                      <li>• High-risk items appear instantly in this queue</li>
                      <li>• Adjust filters to review previously moderated items</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => fetchItems(1, false)}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'}`}
                  title="Refresh quarantine queue"
                >
                  <SafeRefreshCw size={14} className="inline mr-2" /> Refresh
                </button>
              </div>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={() => fetchItems(pagination.page + 1, true)}
              hasMore={pagination.hasMore && !loading}
              loader={<Skeleton count={4} height={180} className="mb-6 rounded-xl" />}
              scrollableTarget="scrollableDiv"
              endMessage={<p className={`text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} py-8`}>No more items</p>}
            >
              {error && (
                <div className={`${theme === 'light' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-red-950/40 border-red-800'} border p-4 rounded-xl mb-6`}>
                  {error} — <button onClick={() => fetchItems(1, false)} className="underline" title="Retry loading items" aria-label="Retry">Retry</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`${theme === 'light' ? 'bg-white border-gray-200 hover:border-gray-400' : 'bg-gray-900/60 border-gray-800/60 hover:border-gray-600'} border cursor-pointer rounded-xl overflow-hidden transition-colors`}
                  onClick={() => setPreviewItem(item)}
                >
                  {/* Keyframe mosaic + waveform */}
                  <div className="relative">
                    <div className={`grid grid-cols-5 gap-1 p-3 ${theme === 'light' ? 'bg-gray-100' : 'bg-black/40'}`}>
                      {item.keyframes.slice(0,5).map((url,i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-video object-cover rounded" />
                      ))}
                    </div>

                    {item.waveformUrl && (
                      <div className="px-3 pb-3">
                        <img src={item.waveformUrl} alt="waveform" className="w-full h-10 opacity-80" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${
                        item.severity > 85 ? 'bg-red-600' :
                        item.severity > 60 ? 'bg-orange-600' : 'bg-amber-600'
                      }`}>
                        {item.severity.toFixed(1)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${theme === 'light' ? 'bg-gray-300 text-gray-900' : 'bg-gray-800/80 text-gray-100'}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 pt-2 text-sm">
                    <div className="flex items-center gap-3 mb-2">
                      {item.user.avatar ? (
                        <img src={item.user.avatar} className="w-8 h-8 rounded-full" alt="" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${theme === 'light' ? 'bg-gray-300 text-gray-900' : 'bg-gray-700 text-gray-100'} flex items-center justify-center text-xs font-medium`}>
                          {item.user.name[0]}
                        </div>
                      )}
                      <div>
                        <div className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.user.name}</div>
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-500'}`}>
                          Trust: <span className={
                            item.user.trust === 'low' || item.user.trust === 'new' ? 'text-red-400' :
                            item.user.trust === 'medium' ? 'text-orange-400' : 'text-emerald-400'
                          }>{item.user.trust}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Nudity: <span className={item.nudityScore > 80 ? 'text-red-400' : 'text-orange-400'}>{item.nudityScore}%</span></div>
                      <div className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Audio: <span className={item.audioScore > 70 ? 'text-red-400' : 'text-orange-400'}>{item.audioScore}%</span></div>
                    </div>

                    <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} line-clamp-2`}>
                      {item.chatSnippet || item.reason}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className={`flex ${theme === 'light' ? 'border-gray-200' : 'border-gray-800/60'} border-t`}>
                    <button className={`flex-1 py-2.5 text-center text-emerald-400 ${theme === 'light' ? 'hover:bg-green-50' : 'hover:bg-emerald-950/30'} text-sm font-medium`} title="Release from quarantine" aria-label="Release">
                      Release
                    </button>
                    <button className={`flex-1 py-2.5 text-center text-red-400 ${theme === 'light' ? 'hover:bg-red-50 border-l border-gray-200' : 'hover:bg-red-950/30 border-l border-gray-800/60'} text-sm font-medium`} title="Delete permanently" aria-label="Delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </main>

      {/* Right preview panel */}
      {previewItem && (
        <aside className={`w-96 border-l ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800/50 bg-gray-950/80'} backdrop-blur-sm p-6 overflow-y-auto flex flex-col gap-6`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Review Item</h3>
            <button onClick={() => setPreviewItem(null)} className={`${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-gray-200'}`} title="Close preview" aria-label="Close">
              <SafeX size={20} />
            </button>
          </div>

          {/* Key info */}
          <div className="space-y-4">
            <div className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/60 border-gray-800'} border p-4 rounded-lg`}>
              <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mb-1`}>Confidence Scores</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Nudity</span>
                  <span className={previewItem.nudityScore > 80 ? 'text-red-400' : 'text-orange-400'}>{previewItem.nudityScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Explicit Audio</span>
                  <span className={previewItem.audioScore > 70 ? 'text-red-400' : 'text-orange-400'}>{previewItem.audioScore}%</span>
                </div>
              </div>
            </div>

            {previewItem.chatSnippet && (
              <div className={`${theme === 'light' ? 'bg-orange-50 border-l-4 border-orange-300' : 'bg-gray-900/40 border-l-4 border-orange-600'} p-4 rounded-lg`}>
                <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mb-1`}>Last message snippet</div>
                <div className="text-sm">{previewItem.chatSnippet}</div>
              </div>
            )}

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium text-white" title="Release from quarantine" aria-label="Release">
                Release
              </button>
              <button className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-medium text-white" title="Permanently delete" aria-label="Delete">
                Permanent Delete
              </button>
            </div>
            <button className={`w-full py-3 ${theme === 'light' ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' : 'bg-amber-700/70 hover:bg-amber-700 text-white'} rounded-lg font-medium flex items-center justify-center gap-2`} title="Escalate to senior review" aria-label="Escalate">
              <SafeAlertTriangle size={16} /> Escalate
            </button>
          </div>
        </aside>
      )}

      {/* Bulk confirmation modal */}
      {showBulkModal && bulkAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'} border rounded-xl p-6 max-w-md w-full mx-4`}>
            <h3 className="text-lg font-semibold mb-4">
              Confirm bulk action
            </h3>
            <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} mb-6`}>
              {bulkAction === 'release' && `Release ${selected.length} items?`}
              {bulkAction === 'delete' && `Permanently delete ${selected.length} items? This cannot be undone.`}
              {bulkAction === 'escalate' && `Escalate ${selected.length} items to senior review?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBulkConfirm}
                className={`flex-1 py-3 rounded-lg font-medium text-white ${
                  bulkAction === 'release' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-500' :
                  'bg-amber-600 hover:bg-amber-500'
                }`}
                title={`Confirm ${bulkAction}`}
                aria-label={`Confirm ${bulkAction}`}
              >
                Confirm {bulkAction}
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className={`flex-1 py-3 ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'} rounded-lg`}
                title="Cancel bulk action"
                aria-label="Cancel"
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
