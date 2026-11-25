"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, MapPin, MessageCircle, Phone, Video } from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/stores/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Button } from "@/components/ui/button";
import { useRevenueCatEntitlements } from "@/hooks/useRevenueCatEntitlements";

type MatchRecord = {
  id: string;
  matchedUserId?: string;
  matchedUserName?: string;
  otherUser?: {
    displayName?: string;
  };
};

type MessageRecord = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type CallLogRecord = {
  id: string;
  matchId: string;
  direction: "incoming" | "outgoing";
  callType: "voice" | "video";
  status: "initiated" | "ringing" | "connected" | "missed" | "ended" | "rejected";
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
};

type ScheduledSessionRecord = {
  id: string;
  matchId: string;
  matchName?: string;
  callType?: "voice" | "video";
  scheduledTime: string;
  duration: number;
  status: "scheduled" | "ready" | "active" | "ended" | "cancelled";
  datePlan?: {
    title?: string;
    placeName?: string;
    placeAddress?: string;
    mapUrl?: string;
  };
};

type DateRequestRecord = {
  id: string;
  matchId: string;
  scheduledAt: string;
  timezone: string;
  placeName: string;
  placeAddress: string;
  mapUrl: string;
  status: "pending" | "accepted" | "declined" | "rescheduled" | "cancelled";
};

type TimelineEntry = {
  id: string;
  kind: "chat" | "call";
  title: string;
  detail: string;
  at: string;
  tone: string;
  matchId: string;
};

async function localJsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as Record<string, unknown>).error)
        : data && typeof data === "object" && "message" in data
          ? String((data as Record<string, unknown>).message)
          : `Request failed (${response.status})`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data as T;
}

function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (mins < 1) return `${rem}s`;
  if (rem === 0) return `${mins}m`;
  return `${mins}m ${rem}s`;
}

function callStatusTone(status: CallLogRecord["status"]): string {
  if (status === "connected" || status === "ended") return "text-emerald-700";
  if (status === "missed" || status === "rejected") return "text-rose-700";
  return "text-sky-700";
}

export function MatchActivityTimeline({
  entries,
  loading,
}: {
  entries: TimelineEntry[];
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-sky-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">Chat and Call Activity Timeline</p>
        <span className="text-xs text-gray-500">Per selected match</span>
      </div>

      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            Loading activity...
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline activity yet for this match.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${entry.tone}`}>{entry.title}</p>
                <span className="text-xs text-gray-500">{formatRelative(entry.at)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{entry.detail}</p>
              <div className="mt-2">
                <Link
                  href={`/dashboard/messages?matchId=${encodeURIComponent(entry.matchId)}`}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                >
                  Open in messages
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CommunicationActivityPanel({
  slug,
}: {
  slug: string;
}) {
  const { isAuthenticated, accessToken } = useRequireAuth(`/dashboard/advanced/${slug}`);
  const { refresh, userId } = useAuth();
  const { getCurrentTier } = useRevenueCatEntitlements();

  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>([]);
  const [sessions, setSessions] = useState<ScheduledSessionRecord[]>([]);
  const [dateRequests, setDateRequests] = useState<DateRequestRecord[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const tokenOrRefresh = async () => accessToken ?? (await refresh());
  const tier = getCurrentTier();
  const canUseChat = tier === "premium" || tier === "elite";
  const canUseVoice = tier === "premium" || tier === "elite";
  const canUseVideo = tier === "elite";

  const announceSuccess = (message: string) => {
    setSuccessBanner(message);
    showToast(message, { variant: "success", durationMs: 1500 });
    window.setTimeout(() => {
      setSuccessBanner((current) => (current === message ? null : current));
    }, 1500);
  };

  const friendlyError = (err: any, fallback: string) => {
    if (err?.status === 401) return "Session expired. Please sign in again.";
    if (err?.status === 403) {
      if (typeof err?.message === "string" && err.message.length > 0) return err.message;
      return "This feature is locked for your current plan.";
    }
    if (typeof err?.message === "string" && err.message.length > 0) return err.message;
    return fallback;
  };

  const selectedMatch = useMemo(
    () => matches.find((item) => item.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  const visibleSessions = useMemo(
    () => sessions.filter((item) => !selectedMatchId || item.matchId === selectedMatchId),
    [sessions, selectedMatchId]
  );

  const visibleDateRequests = useMemo(
    () => dateRequests.filter((item) => !selectedMatchId || item.matchId === selectedMatchId),
    [dateRequests, selectedMatchId]
  );

  const callMetrics = useMemo(() => {
    const incoming = callLogs.filter((item) => item.direction === "incoming").length;
    const outgoing = callLogs.filter((item) => item.direction === "outgoing").length;
    const missed = callLogs.filter((item) => item.status === "missed").length;
    return { incoming, outgoing, missed };
  }, [callLogs]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const fromMessages = messages.map((item) => ({
      id: `chat-${item.id}`,
      kind: "chat" as const,
      title: item.senderId === userId ? "You sent a message" : "Match sent a message",
      detail: item.content || "Media-only message",
      at: item.createdAt,
      tone: "text-indigo-700",
      matchId: selectedMatchId,
    }));

    const fromCalls = callLogs.map((item) => ({
      id: `call-${item.id}`,
      kind: "call" as const,
      title: `${item.callType === "voice" ? "Voice" : "Video"} ${item.direction} call`,
      detail: `${item.status.toUpperCase()} • Duration ${formatDuration(item.durationSeconds)}`,
      at: item.startedAt,
      tone: callStatusTone(item.status),
      matchId: item.matchId,
    }));

    return [...fromMessages, ...fromCalls].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }, [messages, callLogs, userId, selectedMatchId]);

  const refreshTimeline = async (token: string, matchId: string) => {
    const [messageData, logData] = await Promise.all([
      canUseChat
        ? api.get<MessageRecord[]>(`/api/messages?matchId=${encodeURIComponent(matchId)}`, token)
        : Promise.resolve([] as MessageRecord[]),
      canUseVoice
        ? api.get<{ success: boolean; logs: CallLogRecord[] }>(
            `/api/video-session/logs?matchId=${encodeURIComponent(matchId)}&limit=50`,
            token
          )
        : Promise.resolve({ success: true, logs: [] as CallLogRecord[] }),
    ]);

    setMessages(messageData ?? []);
    setCallLogs(logData.logs ?? []);
  };

  const refreshDateRequests = async (token: string) => {
    const requestData = await localJsonRequest<{ success: boolean; requests: DateRequestRecord[] }>("/api/date-requests", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setDateRequests(requestData.requests ?? []);
  };

  const triggerCallLogEvent = async (
    callType: "voice" | "video",
    direction: "incoming" | "outgoing"
  ) => {
    if (!selectedMatchId) {
      setError("Select a match before logging a call event");
      return;
    }

    setLoadingActions(true);
    setError(null);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      await api.post(
        "/api/video-session/logs",
        {
          matchId: selectedMatchId,
          callType,
          direction,
          status: "connected",
          startedAt: new Date().toISOString(),
          durationSeconds: 180,
          notes: "Manual trigger from communication dashboard",
        },
        token
      );

      await refreshTimeline(token, selectedMatchId);
      announceSuccess("Call log added successfully");
    } catch (e: any) {
      setError(friendlyError(e, "Failed to trigger call log event"));
    } finally {
      setLoadingActions(false);
    }
  };

  const patchDateRequest = async (
    requestId: string,
    status: "accepted" | "declined" | "rescheduled"
  ) => {
    setLoadingActions(true);
    setError(null);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      const payload: any = { id: requestId, status };
      if (status === "rescheduled") {
        payload.scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      await localJsonRequest<{ success: boolean; request: DateRequestRecord }>("/api/date-requests", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      await refreshDateRequests(token);
      const actionCopy =
        status === "accepted"
          ? "Date request accepted successfully"
          : status === "declined"
            ? "Date request declined successfully"
            : "Date request rescheduled successfully";
      announceSuccess(actionCopy);
    } catch (e: any) {
      setError(friendlyError(e, "Failed to update date request"));
    } finally {
      setLoadingActions(false);
    }
  };

  useEffect(() => {
    const loadBase = async () => {
      if (!isAuthenticated) return;
      setLoadingBase(true);
      setError(null);
      try {
        const token = await tokenOrRefresh();
        if (!token) return;

        const [matchData, scheduleData, requestData] = await Promise.all([
          api.get<MatchRecord[]>("/api/matches", token),
          canUseVideo
            ? api.get<{ success: boolean; sessions: ScheduledSessionRecord[] }>("/api/video-session/schedule", token)
            : Promise.resolve({ success: true, sessions: [] as ScheduledSessionRecord[] }),
          localJsonRequest<{ success: boolean; requests: DateRequestRecord[] }>("/api/date-requests", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setMatches(matchData);
        setSessions(scheduleData.sessions ?? []);
        setDateRequests(requestData.requests ?? []);

        if (matchData.length > 0) {
          setSelectedMatchId((current) => (current && matchData.some((item) => item.id === current) ? current : matchData[0].id));
        }
      } catch (e: any) {
        setError(friendlyError(e, "Failed to load communication panel data"));
      } finally {
        setLoadingBase(false);
      }
    };

    void loadBase();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!isAuthenticated || !selectedMatchId) return;
      setLoadingTimeline(true);
      setError(null);
      try {
        const token = await tokenOrRefresh();
        if (!token) return;

        const [messageData, logData] = await Promise.all([
          canUseChat
            ? api.get<MessageRecord[]>(`/api/messages?matchId=${encodeURIComponent(selectedMatchId)}`, token)
            : Promise.resolve([] as MessageRecord[]),
          canUseVoice
            ? api.get<{ success: boolean; logs: CallLogRecord[] }>(
                `/api/video-session/logs?matchId=${encodeURIComponent(selectedMatchId)}&limit=50`,
                token
              )
            : Promise.resolve({ success: true, logs: [] as CallLogRecord[] }),
        ]);

        setMessages(messageData ?? []);
        setCallLogs(logData.logs ?? []);
      } catch (e: any) {
        setError(friendlyError(e, "Failed to load match activity timeline"));
      } finally {
        setLoadingTimeline(false);
      }
    };

    void loadTimeline();
  }, [isAuthenticated, selectedMatchId]);

  if (!isAuthenticated) return null;

  const isVoicePage = slug === "voice-connect";
  const isVideoPage = slug === "video-chat";
  const isDateRequestPage = slug === "date-requests";

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {successBanner ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successBanner}
        </div>
      ) : null}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Access tier: <span className="font-semibold uppercase">{tier}</span>. Free includes browsing and limited likes. Premium adds chat and voice calls. Elite adds video calls and advanced in-call tools.
      </div>

      <div className="rounded-xl border border-sky-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Communication Match Context</p>
            <p className="text-xs text-gray-500">Pick a match to view chat/call timeline and schedule cards</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              className="h-10 rounded-lg border border-sky-200 bg-white px-3 text-sm text-gray-900"
              aria-label="Select match"
            >
              {matches.length === 0 ? <option value="">No matches</option> : null}
              {matches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.matchedUserName || item.otherUser?.displayName || item.id}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              className="border-sky-200"
              onClick={() => {
                setSelectedMatchId("");
                setMessages([]);
                setCallLogs([]);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          {selectedMatch
            ? `Selected: ${selectedMatch.matchedUserName || selectedMatch.otherUser?.displayName || selectedMatch.id}`
            : "Select a match to populate timeline and cards"}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="border-sky-200"
            disabled={loadingActions || !selectedMatchId || !canUseVoice}
            onClick={() => void triggerCallLogEvent("voice", "outgoing")}
          >
            Log Voice Outgoing
          </Button>
          <Button
            variant="outline"
            className="border-sky-200"
            disabled={loadingActions || !selectedMatchId || !canUseVoice}
            onClick={() => void triggerCallLogEvent("voice", "incoming")}
          >
            Log Voice Incoming
          </Button>
          <Button
            variant="outline"
            className="border-sky-200"
            disabled={loadingActions || !selectedMatchId || !canUseVideo}
            onClick={() => void triggerCallLogEvent("video", "outgoing")}
          >
            Log Video Outgoing
          </Button>
          <Button
            variant="outline"
            className="border-sky-200"
            disabled={loadingActions || !selectedMatchId || !canUseVideo}
            onClick={() => void triggerCallLogEvent("video", "incoming")}
          >
            Log Video Incoming
          </Button>
        </div>
      </div>

      {(isVoicePage || isVideoPage) && canUseVoice && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Incoming Calls</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{callMetrics.incoming}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Outgoing Calls</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{callMetrics.outgoing}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Missed Calls</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{callMetrics.missed}</p>
          </div>
        </div>
      )}

      {isVideoPage && (
        <div className="rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Video size={16} className="text-sky-700" />
            <p className="text-sm font-semibold text-gray-900">Scheduled Video Sessions</p>
          </div>
          {!canUseVideo ? (
            <p className="mt-3 text-sm text-amber-700">Video sessions are available on Elite plan only.</p>
          ) : null}
          <div className="mt-3 space-y-2">
            {!canUseVideo ? null : loadingBase ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading schedules...
              </div>
            ) : visibleSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No scheduled sessions for this selection.</p>
            ) : (
              visibleSessions.map((item) => (
                <div key={item.id} className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.matchName || "Match"}</p>
                    <span className="text-xs text-gray-500">{new Date(item.scheduledTime).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {item.status.toUpperCase()} • {item.duration} sec
                    {item.datePlan?.placeName ? ` • ${item.datePlan.placeName}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isDateRequestPage && (
        <div className="rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-sky-700" />
            <p className="text-sm font-semibold text-gray-900">Date Request Schedule Cards</p>
          </div>
          <div className="mt-3 space-y-2">
            {loadingBase ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading date requests...
              </div>
            ) : visibleDateRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No date requests for this selection.</p>
            ) : (
              visibleDateRequests.map((item) => (
                <div key={item.id} className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{new Date(item.scheduledAt).toLocaleString()}</p>
                    <span className="text-xs font-semibold text-sky-700">{item.status.toUpperCase()}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{item.timezone}</p>
                  <div className="mt-1 flex items-start gap-1 text-xs text-gray-600">
                    <MapPin size={12} className="mt-0.5" />
                    <span>
                      {item.placeName} • {item.placeAddress}
                    </span>
                  </div>
                  <a href={item.mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:text-sky-800">
                    Open map
                  </a>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-200"
                      disabled={loadingActions}
                      onClick={() => void patchDateRequest(item.id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-200"
                      disabled={loadingActions}
                      onClick={() => void patchDateRequest(item.id, "declined")}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200"
                      disabled={loadingActions}
                      onClick={() => void patchDateRequest(item.id, "rescheduled")}
                    >
                      Reschedule (+24h)
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-sky-700" />
            <p className="text-sm font-semibold text-gray-900">Recent Call Logs</p>
          </div>
          <div className="mt-3 space-y-2">
            {!canUseVoice ? (
              <p className="text-sm text-amber-700">Voice logs require Premium or Elite plan.</p>
            ) : loadingTimeline ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading call logs...
              </div>
            ) : callLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No call logs for this match yet.</p>
            ) : (
              callLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
                  <p className={`text-sm font-semibold ${callStatusTone(log.status)}`}>
                    {log.callType === "voice" ? "Voice" : "Video"} • {log.direction} • {log.status}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {new Date(log.startedAt).toLocaleString()} • {formatDuration(log.durationSeconds)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-sky-700" />
            <p className="text-sm font-semibold text-gray-900">Recent Messages</p>
          </div>
          <div className="mt-3 space-y-2">
            {!canUseChat ? (
              <p className="text-sm text-amber-700">Chat requires Premium or Elite.</p>
            ) : loadingTimeline ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages for this match yet.</p>
            ) : (
              messages.slice(-5).reverse().map((item) => (
                <div key={item.id} className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.senderId === userId ? "You" : "Match"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{item.content || "Media-only message"}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MatchActivityTimeline entries={timelineEntries} loading={loadingTimeline} />
    </div>
  );
}
