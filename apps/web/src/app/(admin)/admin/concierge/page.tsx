"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeartHandshake, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

type QueueItem = { id: string; status: string; createdAt: string; requester: { displayName?: string | null }; recipient: { displayName?: string | null; conciergeOptOut: boolean } };

export default function AdminConciergePage() {
  const { accessToken, refresh } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => { const token = accessToken ?? (await refresh()); if (token) setQueue(await api.get<QueueItem[]>("/concierge/staff/queue", token)); }, [accessToken, refresh]);
  useEffect(() => { void load().catch((err) => setError(err?.message || "Unable to load concierge operations")); }, [load]);
  const counts = useMemo(() => queue.reduce<Record<string, number>>((all, item) => ({ ...all, [item.status]: (all[item.status] || 0) + 1 }), {}), [queue]);
  return <main className="min-h-screen bg-slate-950 p-6 text-white lg:p-10"><div className="mx-auto max-w-6xl space-y-7"><div><p className="text-sm font-bold uppercase tracking-wider text-pink-400">Admin operations</p><h1 className="mt-2 flex items-center gap-3 text-4xl font-black"><HeartHandshake /> Concierge Oversight</h1><p className="mt-3 max-w-3xl text-slate-300">Monitor staff review, outreach, recipient consent, and safety holds. Staff cannot bypass opt-outs, blocks, or reports.</p></div>{error && <div className="rounded-xl border border-rose-500/40 bg-rose-950 p-4 text-rose-200">{error}</div>}<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["PENDING_REVIEW", "APPROVED", "OUTREACH_SENT", "RECIPIENT_INTERESTED"].map((status) => <div key={status} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase text-slate-400">{status.replaceAll("_", " ")}</p><p className="mt-2 text-4xl font-black">{counts[status] || 0}</p></div>)}</section><section className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-2"><ShieldAlert className="text-amber-400" /><h2 className="text-xl font-bold">Active cases</h2></div><div className="mt-5 divide-y divide-white/10">{queue.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{item.requester.displayName || "Member"} → {item.recipient.displayName || "Recipient"}</p><p className="text-sm text-slate-400">{item.status.replaceAll("_", " ")} · {new Date(item.createdAt).toLocaleString()}</p></div>{item.recipient.conciergeOptOut && <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">OUTREACH PROHIBITED</span>}</div>)}{queue.length === 0 && <p className="py-8 text-center text-slate-400">No active concierge cases.</p>}</div></section></div></main>;
}
