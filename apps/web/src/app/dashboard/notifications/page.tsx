'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/stores/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import {
  Home, Search, Heart, MessageCircle, Bell, CreditCard,
  Settings, HelpCircle, LogOut, Check, CheckCheck, Trash2,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnterpriseSidebar } from '@/components/dashboard/EnterpriseSidebar'
import { MobileEnterpriseDrawer } from '@/components/dashboard/MobileEnterpriseDrawer'

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches the real backend's Notification model (apps/api/src/notifications).
type NotificationDto = {
  id: string
  type: 'MATCH' | 'MESSAGE'
  title: string
  body: string
  read: boolean
  createdAt: string
}

type Notification = {
  id: string
  type: 'match' | 'message'
  title: string
  body: string
  time: string
  read: boolean
}

function toRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function fromDto(dto: NotificationDto): Notification {
  return {
    id: dto.id,
    type: dto.type === 'MATCH' ? 'match' : 'message',
    title: dto.title,
    body: dto.body,
    time: toRelativeTime(dto.createdAt),
    read: dto.read,
  }
}

const ICON_MAP = {
  match:   <Heart size={16} className="text-pink-600" />,
  message: <MessageSquare size={16} className="text-blue-500" />,
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { isAuthenticated, accessToken } = useRequireAuth('/dashboard/notifications')
  const refresh = useAuth((s) => s.refresh)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const tokenOrRefresh = async () => accessToken ?? (await refresh())

  useEffect(() => {
    if (!isAuthenticated) return
    void (async () => {
      setLoading(true)
      try {
        const token = await tokenOrRefresh()
        if (!token) return
        const data = await api.get<NotificationDto[]>('/notifications', token)
        setNotifications(data.map(fromDto))
      } catch {
        // leave the list empty; the empty state already reads "No notifications"
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken])

  if (!isAuthenticated) return null

  const unreadCount = notifications.filter(n => !n.read).length
  const shown = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const token = await tokenOrRefresh()
    if (token) await api.post(`/notifications/${id}/read`, {}, token).catch(() => null)
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const token = await tokenOrRefresh()
    if (token) await api.post('/notifications/read-all', {}, token).catch(() => null)
  }

  const remove = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const token = await tokenOrRefresh()
    if (token) await api.del(`/notifications/${id}`, token).catch(() => null)
  }

  const loggedInUser = { name: 'You', avatar: '' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-gray-900">
      <div className="flex min-h-screen">

        <MobileEnterpriseDrawer user={{ name: loggedInUser.name, avatar: loggedInUser.avatar }} />

        <EnterpriseSidebar user={{ name: loggedInUser.name, avatar: loggedInUser.avatar }} />

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="p-6 border-b border-pink-200 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Bell className="text-pink-600" size={28} />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 text-sm rounded-full bg-pink-100 text-pink-700 font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Stay up to date with your activity</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-pink-50 rounded-lg p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === 'unread' ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Unread {unreadCount > 0 && <span className="ml-1 text-pink-600">({unreadCount})</span>}
                  </button>
                </div>

                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 border-pink-200 text-pink-700 hover:bg-pink-50"
                    onClick={markAllRead}
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loading ? (
              <div className="text-center py-24 text-gray-400">
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : shown.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              shown.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    n.read
                      ? 'bg-white border-pink-100'
                      : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 shadow-sm'
                  }`}
                >
                  {/* icon */}
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full bg-pink-100 flex items-center justify-center">
                      {ICON_MAP[n.type]}
                    </div>
                    {!n.read && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-500 border-2 border-white" />
                    )}
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        title="Mark as read"
                        onClick={() => markRead(n.id)}
                        className="p-1.5 rounded-lg hover:bg-pink-100 text-gray-400 hover:text-pink-600 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      title="Dismiss"
                      onClick={() => remove(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
