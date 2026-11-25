"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/textfield";
import { staffVideoMonitorApi } from "@/lib/staff-video-monitor-api";

type UserRow = { id: string; email: string; emailVerified: boolean; isAdmin: boolean; createdAt: string; profile?: { displayName?: string } | null };
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

export default function StaffVideoMonitorSessionsPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function searchUsers() {
    try {
      const data = await staffVideoMonitorApi.get<UserRow[]>(`/users?q=${encodeURIComponent(q)}&limit=50`);
      setUsers(data);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to search");
    }
  }

  async function loadSessions(user: UserRow) {
    try {
      setSelectedUser(user);
      const data = await staffVideoMonitorApi.get<SessionRow[]>(`/sessions?userId=${encodeURIComponent(user.id)}`);
      setSessions(data);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to load sessions");
    }
  }

  async function revokeSession(sessionId: string) {
    try {
      setBusy(sessionId);
      await staffVideoMonitorApi.post("/sessions/revoke", { sessionId });
      if (selectedUser) await loadSessions(selectedUser);
      setStatus("Session revoked ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to revoke");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Staff • Video Monitor — Sessions</h1>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft space-y-3">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <TextField label="Search users (email or display name)" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="demo@datepage.app" />
          <Button onClick={searchUsers}>Search</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-black/10 overflow-auto">
            <div className="px-3 py-2 text-sm font-semibold bg-black/5">Users</div>
            <div className="divide-y">
              {users.map((u) => (
                <button
                  key={u.id}
                  className={"w-full text-left px-3 py-2 hover:bg-black/5 " + (selectedUser?.id === u.id ? "bg-emerald-50" : "")}
                  onClick={() => loadSessions(u)}
                >
                  <div className="font-semibold">{u.profile?.displayName ?? "—"}</div>
                  <div className="text-xs text-black/60">{u.email} • {u.emailVerified ? "verified" : "unverified"} • {u.isAdmin ? "admin" : "user"}</div>
                </button>
              ))}
              {users.length === 0 ? <div className="px-3 py-3 text-sm text-black/60">Search to load users.</div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 overflow-auto">
            <div className="px-3 py-2 text-sm font-semibold bg-black/5">Sessions {selectedUser ? `• ${selectedUser.email}` : ""}</div>
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">IP</th>
                  <th className="text-left px-3 py-2">User-Agent</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const state = s.revokedAt ? "REVOKED" : (s.rotatedAt ? "ROTATED" : "ACTIVE");
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2">
                        <div className="font-semibold">{state}</div>
                        <div className="text-xs text-black/60">tokenId: {s.refreshTokenId}</div>
                        {s.reuseDetectedAt ? <div className="text-xs text-amber-700">Reuse: {new Date(s.reuseDetectedAt).toLocaleString()}</div> : null}
                      </td>
                      <td className="px-3 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{s.ip ?? "—"}</td>
                      <td className="px-3 py-2 text-black/70">{(s.userAgent ?? "—").slice(0, 72)}</td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="secondary" disabled={Boolean(s.revokedAt) || busy === s.id} onClick={() => revokeSession(s.id)}>
                          {busy === s.id ? "Revoking…" : "Revoke"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {selectedUser && sessions.length === 0 ? <tr><td colSpan={5} className="px-3 py-3 text-sm text-black/60">No sessions.</td></tr> : null}
                {!selectedUser ? <tr><td colSpan={5} className="px-3 py-3 text-sm text-black/60">Select a user to view sessions.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        {status ? <div className="text-sm text-black/70">{status}</div> : null}
      </div>
    </div>
  );
}
