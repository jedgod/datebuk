"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/textfield";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: any;
};

export default function AdminAuditPage() {
  const { accessToken, refresh } = useAuth();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function tokenOrRefresh() { return accessToken ?? (await refresh()); }

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (action) p.set("action", action);
    if (actorUserId) p.set("actorUserId", actorUserId);
    if (targetUserId) p.set("targetUserId", targetUserId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("limit", "50");
    if (cursor) p.set("cursor", cursor);
    return p.toString();
  }, [q, action, actorUserId, targetUserId, from, to, cursor]);

  const exportUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (action) p.set("action", action);
    if (actorUserId) p.set("actorUserId", actorUserId);
    if (targetUserId) p.set("targetUserId", targetUserId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return `/admin/audit/export?${p.toString()}`;
  }, [action, actorUserId, targetUserId, from, to]);

  async function load(reset = true) {
    try {
      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      if (reset) setCursor(null);
      const qs = reset ? queryString.replace(/(&?cursor=[^&]*)/,"") : queryString;
      const data = await api.get<{ items: AuditRow[]; nextCursor: string | null }>(`/admin/audit?${qs}`, token);
      setRows(data.items);
      setCursor(data.nextCursor);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to load");
    }
  }

  async function nextPage() {
    if (!cursor) return;
    await load(false);
  }

  async function downloadExport() {
    try {
      const token = await tokenOrRefresh();
      if (!token) return setStatus("Not authenticated");
      // fetch CSV and download
      const resp = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "audit_logs.csv";
      a.click();
      setStatus("Export downloaded ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Export failed");
    }
  }

  useEffect(() => { load(true); /* initial */ }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Admin • Audit</h1>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <TextField label="Search (q)" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="AUTH, CHAT, ADMIN…" />
          <TextField label="Action" value={action} onChange={(e)=>setAction(e.target.value)} placeholder="ADMIN_PUSH_BROADCAST…" />
          <TextField label="Actor userId" value={actorUserId} onChange={(e)=>setActorUserId(e.target.value)} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <TextField label="Target userId" value={targetUserId} onChange={(e)=>setTargetUserId(e.target.value)} />
          <TextField label="From (ISO date)" value={from} onChange={(e)=>setFrom(e.target.value)} placeholder="2026-01-01T00:00:00Z" />
          <TextField label="To (ISO date)" value={to} onChange={(e)=>setTo(e.target.value)} placeholder="2026-12-31T23:59:59Z" />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => load(true)}>Apply filters</Button>
          <Button variant="secondary" onClick={downloadExport}>Export CSV</Button>
          <Button variant="secondary" disabled={!cursor} onClick={nextPage}>Next page</Button>
        </div>

        <div className="overflow-auto rounded-2xl border border-black/10">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Actor</th>
                <th className="text-left px-3 py-2">Target</th>
                <th className="text-left px-3 py-2">IP</th>
                <th className="text-left px-3 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-black/5">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 font-semibold">{r.action}</td>
                  <td className="px-3 py-2">{r.actorUserId ?? "—"}</td>
                  <td className="px-3 py-2">{r.targetUserId ?? "—"}</td>
                  <td className="px-3 py-2">{r.ip ?? "—"}</td>
                  <td className="px-3 py-2 text-black/70">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r.metadata ?? {}, null, 2)}</pre>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? <tr><td colSpan={6} className="px-3 py-4 text-black/60">No audit events found.</td></tr> : null}
            </tbody>
          </table>
        </div>

        {status ? <div className="text-sm text-black/70">{status}</div> : null}
      </div>
    </div>
  );
}
