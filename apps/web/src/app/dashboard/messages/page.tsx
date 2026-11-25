'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Archive,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CreditCard,
  Image as ImageIcon,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MessageCircle,
  Paperclip,
  Pin,
  RefreshCw,
  Lock,
  Crown,
  Search,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/stores/auth'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { EnterpriseSidebar } from '@/components/dashboard/EnterpriseSidebar'
import { MobileEnterpriseDrawer } from '@/components/dashboard/MobileEnterpriseDrawer'
import { useRevenueCatEntitlements } from '@/hooks/useRevenueCatEntitlements'

type Match = {
  id: string
  createdAt?: string
  [key: string]: any
}

type MessageAttachment = {
  key: string
  url: string
  contentType: string
  name?: string
  size?: number
}

type UploadPresignResponse = {
  url: string
  key: string
  kind: 'image' | 'video' | 'audio'
  maxBytes: number
}

type Msg = {
  id: string
  matchId: string
  senderId: string
  content: string
  attachments?: MessageAttachment[] | null
  createdAt: string
  deliveredAt?: string | null
  readAt?: string | null
}

type ConversationPrefs = {
  pinned?: boolean
  muted?: boolean
  archived?: boolean
}

type FailedMessage = {
  id: string
  matchId: string
  content: string
  attachments?: MessageAttachment[]
  failedAt: string
  reason?: string
}

const PREFS_KEY = 'datepage.messages.prefs.v1'
const DRAFTS_KEY = 'datepage.messages.drafts.v1'
const FAILED_KEY = 'datepage.messages.failed.v1'
const PAGE_SIZE = 30

function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function setStoredJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function getOtherPerson(match: Match, fallbackIndex: number) {
  const candidates = [match.otherUser, match.partner, match.user, match.profile, match.user1, match.user2]
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const name = candidate.displayName || candidate.name || candidate.username || candidate.email
    const avatar = candidate.avatar || candidate.photo || candidate.image || ''
    if (name) return { name: String(name), avatar: String(avatar || '') }
  }

  return {
    name: `Match #${String(match.id || fallbackIndex).slice(0, 8)}`,
    avatar: '',
  }
}

function formatTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString()
}

export default function MessagesPage() {
  const router = useRouter()
  const params = useSearchParams()
  const initialQueryMatchId = params?.get('matchId') ?? null

  const { isAuthenticated, accessToken } = useRequireAuth('/dashboard/messages')
  const { refresh, userId } = useAuth()
  const { getCurrentTier } = useRevenueCatEntitlements()

  const [matches, setMatches] = useState<Match[]>([])
  const [messagesByMatch, setMessagesByMatch] = useState<Record<string, Msg[]>>({})
  const [prefsByMatch, setPrefsByMatch] = useState<Record<string, ConversationPrefs>>({})
  const [draftsByMatch, setDraftsByMatch] = useState<Record<string, string>>({})
  const [failedByMatch, setFailedByMatch] = useState<Record<string, FailedMessage[]>>({})
  const [pendingAttachmentsByMatch, setPendingAttachmentsByMatch] = useState<Record<string, MessageAttachment[]>>({})
  const [visibleCountByMatch, setVisibleCountByMatch] = useState<Record<string, number>>({})
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialQueryMatchId)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [conversationFilter, setConversationFilter] = useState<'inbox' | 'archived' | 'all'>('inbox')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [peerTypingByMatch, setPeerTypingByMatch] = useState<Record<string, string | null>>({})

  const typingTimeoutRef = useRef<number | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tier = getCurrentTier()
  const canChat = tier === 'premium' || tier === 'elite'

  useEffect(() => {
    setPrefsByMatch(getStoredJson<Record<string, ConversationPrefs>>(PREFS_KEY, {}))
    setDraftsByMatch(getStoredJson<Record<string, string>>(DRAFTS_KEY, {}))
    setFailedByMatch(getStoredJson<Record<string, FailedMessage[]>>(FAILED_KEY, {}))
  }, [])

  useEffect(() => {
    setStoredJson(PREFS_KEY, prefsByMatch)
  }, [prefsByMatch])

  useEffect(() => {
    setStoredJson(DRAFTS_KEY, draftsByMatch)
  }, [draftsByMatch])

  useEffect(() => {
    setStoredJson(FAILED_KEY, failedByMatch)
  }, [failedByMatch])

  const tokenOrRefresh = async () => accessToken ?? (await refresh())

  const setVisibleDefault = (matchId: string, total: number) => {
    setVisibleCountByMatch(prev => ({
      ...prev,
      [matchId]: prev[matchId] ?? Math.min(PAGE_SIZE, total || PAGE_SIZE),
    }))
  }

  const loadThread = async (matchId: string, markRead: boolean) => {
    if (!canChat) {
      setMessagesByMatch(prev => ({ ...prev, [matchId]: [] }))
      return
    }

    const token = await tokenOrRefresh()
    if (!token) return

    setLoadingThread(true)
    try {
      const data = await api.get<Msg[]>(`/messages?matchId=${encodeURIComponent(matchId)}`, token)
      setMessagesByMatch(prev => ({ ...prev, [matchId]: data }))
      setVisibleDefault(matchId, data.length)

      if (markRead) {
        await api.post('/messages/read', { matchId }, token)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load messages')
    } finally {
      setLoadingThread(false)
    }
  }

  const loadConversations = async () => {
    if (!isAuthenticated) return
    setLoadingConversations(true)
    setError(null)

    try {
      const token = await tokenOrRefresh()
      if (!token) return

      const matchData = await api.get<Match[]>('/matches', token)
      setMatches(matchData)

      const entries = canChat
        ? await Promise.all(
            matchData.map(async (match) => {
              try {
                const msgs = await api.get<Msg[]>(`/messages?matchId=${encodeURIComponent(match.id)}`, token)
                return [match.id, msgs] as [string, Msg[]]
              } catch {
                return [match.id, []] as [string, Msg[]]
              }
            })
          )
        : matchData.map((match) => [match.id, []] as [string, Msg[]])

      const nextMessages: Record<string, Msg[]> = {}
      const nextVisible: Record<string, number> = {}
      for (const [id, msgs] of entries) {
        nextMessages[id] = msgs
        nextVisible[id] = visibleCountByMatch[id] ?? Math.min(PAGE_SIZE, msgs.length || PAGE_SIZE)
      }

      setMessagesByMatch(nextMessages)
      setVisibleCountByMatch(prev => ({ ...nextVisible, ...prev }))

      if (matchData.length > 0) {
        const queryTarget = initialQueryMatchId && matchData.some(m => m.id === initialQueryMatchId)
          ? initialQueryMatchId
          : matchData[0].id
        setSelectedMatchId(current => current && matchData.some(m => m.id === current) ? current : queryTarget)
      } else {
        setSelectedMatchId(null)
      }
    } catch (e: any) {
      if (e?.status === 401) {
        setError('Session expired. Please sign in again.')
      } else if (e?.status === 403) {
        setError('Messaging is currently unavailable on your plan.')
      } else {
        setError(e?.message ?? 'Failed to load conversations')
      }
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    void loadConversations()
  }, [isAuthenticated, canChat])

  useEffect(() => {
    if (!selectedMatchId) return
    const query = new URLSearchParams(params?.toString() ?? '')
    query.set('matchId', selectedMatchId)
    router.replace(`/dashboard/messages?${query.toString()}`)
  }, [selectedMatchId, router, params])

  useEffect(() => {
    if (!selectedMatchId) return
    queueMicrotask(() => {
      if (threadRef.current) {
        threadRef.current.scrollTo({ top: threadRef.current.scrollHeight })
      }
    })
  }, [messagesByMatch, selectedMatchId])

  useEffect(() => {
    const socket = getSocket()

    const onIncomingMessage = (msg: Msg) => {
      if (!msg?.matchId) return
      setMessagesByMatch(prev => ({
        ...prev,
        [msg.matchId]: [...(prev[msg.matchId] ?? []), msg],
      }))
      setVisibleDefault(msg.matchId, (messagesByMatch[msg.matchId]?.length ?? 0) + 1)
    }

    const onTyping = (payload: { matchId: string; userId: string; isTyping: boolean }) => {
      if (!payload?.matchId || payload.userId === userId) return
      setPeerTypingByMatch(prev => ({
        ...prev,
        [payload.matchId]: payload.isTyping ? 'Typing…' : null,
      }))
    }

    const onRead = (payload: { matchId: string; readerId: string }) => {
      if (!payload?.matchId || !userId || payload.readerId === userId) return
      setMessagesByMatch(prev => ({
        ...prev,
        [payload.matchId]: (prev[payload.matchId] ?? []).map(m =>
          m.senderId === userId ? { ...m, readAt: m.readAt ?? new Date().toISOString() } : m
        ),
      }))
    }

    socket.on('chat:message', onIncomingMessage)
    socket.on('chat:typing', onTyping)
    socket.on('chat:read', onRead)

    return () => {
      socket.off('chat:message', onIncomingMessage)
      socket.off('chat:typing', onTyping)
      socket.off('chat:read', onRead)
    }
  }, [messagesByMatch, userId])

  useEffect(() => {
    if (!selectedMatchId) return
    const socket = getSocket()
    socket.emit('chat:join', { matchId: selectedMatchId })
    void loadThread(selectedMatchId, true)
  }, [selectedMatchId])

  const conversations = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    return matches
      .map((match, index) => {
        const msgs = messagesByMatch[match.id] ?? []
        const last = msgs.length ? msgs[msgs.length - 1] : null
        const other = getOtherPerson(match, index + 1)
        const unread = msgs.filter(m => m.senderId !== userId && !m.readAt).length
        const prefs = prefsByMatch[match.id] ?? {}

        return {
          matchId: match.id,
          name: other.name,
          avatar: other.avatar,
          lastText: last?.content || (last?.attachments?.length ? `Sent ${last.attachments.length} attachment${last.attachments.length > 1 ? 's' : ''}` : 'Start your conversation'),
          lastAt: last?.createdAt ?? match.createdAt ?? null,
          unread,
          pinned: Boolean(prefs.pinned),
          muted: Boolean(prefs.muted),
          archived: Boolean(prefs.archived),
        }
      })
      .filter(convo => {
        if (conversationFilter === 'inbox' && convo.archived) return false
        if (conversationFilter === 'archived' && !convo.archived) return false
        if (!q) return true
        return convo.name.toLowerCase().includes(q) || convo.lastText.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        const aa = a.lastAt ? new Date(a.lastAt).getTime() : 0
        const bb = b.lastAt ? new Date(b.lastAt).getTime() : 0
        return bb - aa
      })
  }, [conversationFilter, deferredSearch, matches, messagesByMatch, prefsByMatch, userId])

  const totalUnread = conversations
    .filter(c => !c.muted)
    .reduce((sum, c) => sum + c.unread, 0)

  const selectedConversation = conversations.find(c => c.matchId === selectedMatchId) ?? null
  const selectedMessages = selectedMatchId ? (messagesByMatch[selectedMatchId] ?? []) : []
  const visibleCount = selectedMatchId ? (visibleCountByMatch[selectedMatchId] ?? PAGE_SIZE) : PAGE_SIZE
  const visibleMessages = selectedMessages.slice(-visibleCount)
  const hiddenCount = Math.max(0, selectedMessages.length - visibleMessages.length)
  const draft = selectedMatchId ? (draftsByMatch[selectedMatchId] ?? '') : ''
  const failedMessages = selectedMatchId ? (failedByMatch[selectedMatchId] ?? []) : []
  const pendingAttachments = selectedMatchId ? (pendingAttachmentsByMatch[selectedMatchId] ?? []) : []

  const updatePrefs = (matchId: string, patch: Partial<ConversationPrefs>) => {
    setPrefsByMatch(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? {}), ...patch },
    }))
  }

  const updateDraft = (matchId: string, value: string) => {
    setDraftsByMatch(prev => ({ ...prev, [matchId]: value }))
  }

  const updatePendingAttachments = (matchId: string, attachments: MessageAttachment[]) => {
    setPendingAttachmentsByMatch(prev => ({ ...prev, [matchId]: attachments }))
  }

  const enqueueFailed = (matchId: string, content: string, attachments: MessageAttachment[], reason?: string) => {
    const item: FailedMessage = {
      id: `failed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      matchId,
      content,
      attachments,
      failedAt: new Date().toISOString(),
      reason,
    }

    setFailedByMatch(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] ?? []), item],
    }))
  }

  const removeFailed = (matchId: string, failedId: string) => {
    setFailedByMatch(prev => ({
      ...prev,
      [matchId]: (prev[matchId] ?? []).filter(item => item.id !== failedId),
    }))
  }

  const removePendingAttachment = (matchId: string, key: string) => {
    updatePendingAttachments(matchId, (pendingAttachmentsByMatch[matchId] ?? []).filter(item => item.key !== key))
  }

  const uploadFiles = async (files: FileList | File[]) => {
    if (!selectedMatchId) return
    const token = await tokenOrRefresh()
    if (!token) return

    setUploadingAttachments(true)
    setError(null)

    try {
      const uploaded: MessageAttachment[] = []
      for (const file of Array.from(files)) {
        const kind = file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'image'
        const presign = await api.post<UploadPresignResponse>('/uploads/presign', {
          contentType: file.type,
          kind,
          fileName: file.name,
          sizeBytes: file.size,
        }, token)
        const putResponse = await fetch(presign.url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!putResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        await api.post('/uploads/complete', { key: presign.key }, token)
        const access = await api.get<{ url: string }>(`/uploads/access?key=${encodeURIComponent(presign.key)}`, token)

        uploaded.push({
          key: presign.key,
          url: access.url,
          contentType: file.type,
          name: file.name,
          size: file.size,
        })
      }

      updatePendingAttachments(selectedMatchId, [...pendingAttachments, ...uploaded])
    } catch (e: any) {
      setError(e?.message ?? 'Attachment upload failed')
    } finally {
      setUploadingAttachments(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSend = async (contentOverride?: string, failedId?: string, attachmentsOverride?: MessageAttachment[]) => {
    if (!selectedMatchId) return
    if (!canChat) {
      setError('Chat requires Premium or Elite.')
      return
    }
    const content = (contentOverride ?? draft).trim()
    const attachments = attachmentsOverride ?? pendingAttachments
    if (!content && attachments.length === 0) return

    const token = await tokenOrRefresh()
    if (!token || !userId) return

    setSending(true)
    setError(null)

    const tempId = `temp-${Date.now()}`
    const optimistic: Msg = {
      id: tempId,
      matchId: selectedMatchId,
      senderId: userId,
      content,
      attachments,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    }

    setMessagesByMatch(prev => ({
      ...prev,
      [selectedMatchId]: [...(prev[selectedMatchId] ?? []), optimistic],
    }))
    updateDraft(selectedMatchId, '')
    updatePendingAttachments(selectedMatchId, [])

    try {
      const created = await api.post<Msg>('/messages', { matchId: selectedMatchId, content, attachments }, token)
      setMessagesByMatch(prev => ({
        ...prev,
        [selectedMatchId]: (prev[selectedMatchId] ?? []).map(m => (m.id === tempId ? created : m)),
      }))

      if (failedId) removeFailed(selectedMatchId, failedId)

      const socket = getSocket()
      socket.emit('chat:typing', { matchId: selectedMatchId, userId, isTyping: false })
    } catch (e: any) {
      setMessagesByMatch(prev => ({
        ...prev,
        [selectedMatchId]: (prev[selectedMatchId] ?? []).filter(m => m.id !== tempId),
      }))
      updateDraft(selectedMatchId, content)
      updatePendingAttachments(selectedMatchId, attachments)
      enqueueFailed(selectedMatchId, content, attachments, e?.message ?? 'Send failed')
      if (e?.status === 401) {
        setError('Session expired. Please sign in again.')
      } else if (e?.status === 403) {
        setError('Chat requires Premium or Elite.')
      } else {
        setError(e?.message ?? 'Failed to send message')
      }
    } finally {
      setSending(false)
    }
  }

  const handleDraftChange = (value: string) => {
    if (!selectedMatchId) return
    updateDraft(selectedMatchId, value)
    if (!userId) return

    const socket = getSocket()
    socket.emit('chat:typing', { matchId: selectedMatchId, userId, isTyping: true })

    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('chat:typing', { matchId: selectedMatchId, userId, isTyping: false })
      typingTimeoutRef.current = null
    }, 1200)
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-gray-900">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: 'You' }} />
        <EnterpriseSidebar user={{ name: 'You' }} />

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <header className="p-6 border-b border-pink-200 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MessageCircle className="text-pink-600" size={28} />
                  Messages
                  {totalUnread > 0 ? (
                    <span className="ml-2 px-2.5 py-0.5 text-sm rounded-full bg-pink-100 text-pink-700 font-semibold">
                      {totalUnread} unread
                    </span>
                  ) : null}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Realtime inbox with pinned, muted, archived, and retry-ready threads</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {canChat ? <Crown size={13} /> : <Lock size={13} />}
                  Plan: {tier.toUpperCase()} {canChat ? '• Chat unlocked' : '• Premium required for chat'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-pink-200" onClick={() => void loadConversations()}>
                  <RefreshCw size={14} className="mr-2" /> Refresh
                </Button>
                <Link href="/dashboard/matches">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">Open Matches</Button>
                </Link>
              </div>
            </div>
          </header>

          {error ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="flex-1 min-h-0 p-6">
            <div className="h-full grid grid-cols-1 xl:grid-cols-[380px,1fr] gap-4">
              <div className="rounded-2xl border border-pink-200 bg-white/90 shadow-sm flex flex-col min-h-0">
                <div className="p-4 border-b border-pink-100 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search conversations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" title="Show inbox conversations" onClick={() => setConversationFilter('inbox')} className={`px-3 py-1.5 text-xs rounded-full border ${conversationFilter === 'inbox' ? 'bg-pink-100 border-pink-200 text-pink-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      Inbox
                    </button>
                    <button type="button" title="Show all conversations" onClick={() => setConversationFilter('all')} className={`px-3 py-1.5 text-xs rounded-full border ${conversationFilter === 'all' ? 'bg-pink-100 border-pink-200 text-pink-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      All
                    </button>
                    <button type="button" title="Show archived conversations" onClick={() => setConversationFilter('archived')} className={`px-3 py-1.5 text-xs rounded-full border ${conversationFilter === 'archived' ? 'bg-pink-100 border-pink-200 text-pink-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      Archived
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="p-6 text-sm text-gray-500">Loading conversations...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No conversations available for this view.</div>
                  ) : (
                    conversations.map((convo) => (
                      <button
                        key={convo.matchId}
                        type="button"
                        title={`Open conversation with ${convo.name}`}
                        onClick={() => setSelectedMatchId(convo.matchId)}
                        className={`w-full text-left px-4 py-3 border-b border-pink-100 hover:bg-pink-50 transition-colors ${selectedMatchId === convo.matchId ? 'bg-pink-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={convo.avatar || undefined} alt={convo.name} />
                            <AvatarFallback>{convo.name[0]}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 min-w-0">
                                {convo.pinned ? <Pin size={12} className="text-pink-600 shrink-0" /> : null}
                                {convo.muted ? <BellOff size={12} className="text-gray-400 shrink-0" /> : null}
                                <p className="text-sm font-semibold truncate">{convo.name}</p>
                              </div>
                              <span className="text-[11px] text-gray-400 shrink-0">{formatTime(convo.lastAt)}</span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-xs text-gray-500 truncate">{convo.lastText}</p>
                              {convo.unread > 0 ? (
                                <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[11px] font-semibold grid place-items-center shrink-0">
                                  {convo.unread}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-pink-200 bg-white/90 shadow-sm flex flex-col min-h-0">
                {!selectedMatchId || !selectedConversation ? (
                    <div className="h-full grid place-items-center p-8 text-center text-gray-500">
                    <div>
                      {canChat ? <MessageCircle size={46} className="mx-auto mb-3 text-pink-300" /> : <Lock size={46} className="mx-auto mb-3 text-amber-400" />}
                      <p className="font-semibold text-gray-700">{canChat ? 'Select a conversation' : 'Messaging is locked'}</p>
                      <p className="text-sm mt-1">
                        {canChat
                          ? 'Choose a match from the left panel to start messaging.'
                          : 'Upgrade to Premium to unlock full chat messaging.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-pink-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConversation.avatar || undefined} alt={selectedConversation.name} />
                          <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{selectedConversation.name}</p>
                          <p className="text-xs text-gray-500">{peerTypingByMatch[selectedMatchId] ?? 'Realtime thread active'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" title={selectedConversation.pinned ? 'Unpin conversation' : 'Pin conversation'} onClick={() => updatePrefs(selectedMatchId, { pinned: !selectedConversation.pinned })} className={`p-2 rounded-lg border ${selectedConversation.pinned ? 'border-pink-200 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          <Pin size={14} />
                        </button>
                        <button type="button" title={selectedConversation.muted ? 'Unmute conversation' : 'Mute conversation'} onClick={() => updatePrefs(selectedMatchId, { muted: !selectedConversation.muted })} className={`p-2 rounded-lg border ${selectedConversation.muted ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {selectedConversation.muted ? <BellOff size={14} /> : <Bell size={14} />}
                        </button>
                        <button type="button" title={selectedConversation.archived ? 'Restore conversation' : 'Archive conversation'} onClick={() => updatePrefs(selectedMatchId, { archived: !selectedConversation.archived })} className={`p-2 rounded-lg border ${selectedConversation.archived ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {selectedConversation.archived ? <X size={14} /> : <Archive size={14} />}
                        </button>
                      </div>
                    </div>

                    {failedMessages.length > 0 ? (
                      <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-medium">{failedMessages.length} unsent message{failedMessages.length > 1 ? 's' : ''}</p>
                        <div className="mt-2 space-y-2">
                          {failedMessages.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 border border-amber-100">
                              <div className="min-w-0">
                                <p className="truncate">{item.content || `${item.attachments?.length ?? 0} attachment${(item.attachments?.length ?? 0) > 1 ? 's' : ''}`}</p>
                                <p className="text-xs text-amber-700/80">{item.reason ?? 'Send failed'} · {formatTime(item.failedAt)}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" className="border-amber-200" onClick={() => void handleSend(item.content, item.id, item.attachments ?? [])}>
                                  Retry
                                </Button>
                                <button type="button" title="Dismiss failed message" onClick={() => removeFailed(selectedMatchId, item.id)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700">
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-pink-50/35">
                      {!canChat ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Chat requires Premium or Elite.
                        </div>
                      ) : null}
                      {hiddenCount > 0 ? (
                        <div className="text-center">
                          <Button variant="outline" className="border-pink-200" onClick={() => setVisibleCountByMatch(prev => ({ ...prev, [selectedMatchId]: (prev[selectedMatchId] ?? PAGE_SIZE) + PAGE_SIZE }))}>
                            Load {Math.min(PAGE_SIZE, hiddenCount)} older messages
                          </Button>
                        </div>
                      ) : null}

                      {canChat && loadingThread ? (
                        <p className="text-sm text-gray-500">Loading messages...</p>
                      ) : canChat && visibleMessages.length === 0 ? (
                        <p className="text-sm text-gray-500">No messages yet. Send the first message.</p>
                      ) : canChat ? (
                        visibleMessages.map((message) => {
                          const mine = message.senderId === userId
                          const statusIcon = message.readAt ? <CheckCheck size={12} /> : <Check size={12} />

                          return (
                            <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm ${mine ? 'ml-auto bg-gray-900 text-white' : 'bg-white border border-pink-200 text-gray-900'}`}>
                              {message.content ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
                              {message.attachments?.length ? (
                                <div className={`grid gap-2 ${message.content ? 'mt-2' : ''}`}>
                                  {message.attachments.map((attachment) => (
                                    <a
                                      key={attachment.key}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`block overflow-hidden rounded-xl border ${mine ? 'border-white/15 bg-white/10' : 'border-pink-100 bg-pink-50/70'}`}
                                    >
                                      {attachment.contentType.startsWith('image/') ? (
                                        <img src={attachment.url} alt={attachment.name || 'Attachment'} className="max-h-56 w-full object-cover" />
                                      ) : (
                                        <div className="flex items-center gap-2 px-3 py-3">
                                          <Paperclip size={14} />
                                          <span className="truncate">{attachment.name || 'Attachment'}</span>
                                        </div>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                              <div className={`mt-1 text-[11px] flex items-center gap-1 ${mine ? 'text-white/70 justify-end' : 'text-gray-500'}`}>
                                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {mine ? statusIcon : null}
                              </div>
                            </div>
                          )
                        })
                      ) : null}
                    </div>

                    <div className="p-4 border-t border-pink-100 bg-white space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        title="Attach images"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            void uploadFiles(e.target.files)
                          }
                        }}
                      />

                      {pendingAttachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {pendingAttachments.map((attachment) => (
                            <div key={attachment.key} className="relative overflow-hidden rounded-xl border border-pink-200 bg-pink-50">
                              {attachment.contentType.startsWith('image/') ? (
                                <img src={attachment.url} alt={attachment.name || 'Attachment'} className="h-20 w-20 object-cover" />
                              ) : (
                                <div className="h-20 w-20 grid place-items-center text-pink-700">
                                  <ImageIcon size={18} />
                                </div>
                              )}
                              <button
                                type="button"
                                title="Remove attachment"
                                onClick={() => selectedMatchId && removePendingAttachment(selectedMatchId, attachment.key)}
                                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-600 shadow-sm"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-end gap-3">
                        <Button type="button" variant="outline" className="border-pink-200" onClick={() => fileInputRef.current?.click()} disabled={!canChat || uploadingAttachments || sending}>
                          <Paperclip size={14} className="mr-2" />
                          {uploadingAttachments ? 'Uploading...' : 'Attach'}
                        </Button>
                        <div className="flex-1">
                          <Input
                            placeholder={pendingAttachments.length > 0 ? 'Add a caption (optional)...' : 'Type a message...'}
                            value={draft}
                            disabled={!canChat}
                            onChange={(e) => handleDraftChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                void handleSend()
                              }
                            }}
                            className="bg-white border-pink-200 text-gray-900"
                          />
                        </div>
                        <Button onClick={() => void handleSend()} disabled={!canChat || sending || uploadingAttachments || (!draft.trim() && pendingAttachments.length === 0)} className="bg-pink-600 hover:bg-pink-700 text-white">
                          <Send size={14} className="mr-2" />
                          {sending ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Drafts are saved per conversation on this device.</span>
                        <span>Enter to send</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
