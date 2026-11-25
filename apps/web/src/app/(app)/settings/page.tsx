"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

async function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type SessionRow = {
  id: string;
  refreshTokenId: string;
  createdAt: string;
  revokedAt?: string | null;
  rotatedAt?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  reuseDetectedAt?: string | null;
};

export default function SettingsPage() {
  const auth = useAuth();
  const { accessToken, refresh, currentSessionId, refreshTokenId } = auth;

  const [status, setStatus] = useState<string>("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);

  async function tokenOrRefresh() {
    return accessToken ?? (await refresh());
  }

  async function enablePush() {
    try {
      setStatus("Requesting permission…");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setStatus("Permission denied.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
      if (!vapid) return setStatus("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(vapid),
      });

      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      await api.post("/api/push/subscribe", { subscription: sub.toJSON() }, token);
      setStatus("Push enabled ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to enable push");
    }
  }

  async function testPush() {
    try {
      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      await api.post("/api/push/send", { payload: { title: "DateBuk", body: "Test notification", url: "/messages" } }, token);
      setStatus("Test notification enqueued ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to send test");
    }
  }

  async function sendVerification() {
    const token = await tokenOrRefresh();
    if (!token) return setStatus("Not authenticated");
    await api.post("/api/auth/send-verification", {}, token);
    setStatus("Verification email enqueued (check worker logs) ✅");
  }

  async function loadSessions() {
    try {
      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      const data = await api.get<SessionRow[]>("/api/sessions", token);
      setSessions(data);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to load sessions");
    }
  }

  async function revokeSession(id: string) {
    try {
      setBusySessionId(id);
      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      await api.post("/api/sessions/revoke", { sessionId: id }, token);
      await loadSessions();
      setStatus("Session revoked ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to revoke");
    } finally {
      setBusySessionId(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Settings</h1>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft space-y-3">
        <div className="font-bold">Push notifications</div>
        <div className="text-sm text-black/70">Enable Web Push for message alerts.</div>
        <div className="flex gap-3">
          <Button onClick={enablePush}>Enable Push</Button>
          <Button variant="secondary" onClick={testPush}>Send Test</Button>
        </div>

        <div className="pt-4 border-t border-black/10" />
        <div className="font-bold">Email verification</div>
        <div className="text-sm text-black/70">Verification emails are sent via the background worker.</div>
        <Button variant="secondary" onClick={sendVerification}>Send verification email</Button>

        <div className="pt-4 border-t border-black/10" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold">Device sessions</div>
            <div className="text-sm text-black/70">Manage sessions by device/IP. Your current session is highlighted.</div>
          </div>
          <Button variant="secondary" onClick={loadSessions}>Refresh list</Button>
        </div>

        <div className="overflow-auto rounded-2xl border border-black/10">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">IP</th>
                <th className="text-left px-3 py-2">User-Agent</th>
                <th className="text-left px-3 py-2">Reuse</th>
                <th className="text-right px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td className="px-3 py-4 text-black/60" colSpan={6}>No sessions loaded yet. Click “Refresh list”.</td></tr>
              ) : sessions.map((s) => {
                const isCurrent = (currentSessionId && s.id === currentSessionId) || (refreshTokenId && s.refreshTokenId === refreshTokenId);
                const state = s.revokedAt ? "REVOKED" : (s.rotatedAt ? "ROTATED" : "ACTIVE");
                return (
                  <tr key={s.id} className={isCurrent ? "bg-emerald-50" : ""}>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{state}{isCurrent ? " • CURRENT" : ""}</div>
                      <div className="text-xs text-black/60">tokenId: {s.refreshTokenId}</div>
                    </td>
                    <td className="px-3 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{s.ip ?? "—"}</td>
                    <td className="px-3 py-2 text-black/70">{(s.userAgent ?? "—").slice(0, 72)}</td>
                    <td className="px-3 py-2">{s.reuseDetectedAt ? "⚠️ " + new Date(s.reuseDetectedAt).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="secondary"
                        disabled={Boolean(s.revokedAt) || busySessionId === s.id}
                        onClick={() => revokeSession(s.id)}
                      >
                        {busySessionId === s.id ? "Revoking…" : "Revoke"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {status ? <div className="text-sm text-black/80 pt-2 whitespace-pre-wrap">{status}</div> : null}
      </div>
    </div>
  );
}
