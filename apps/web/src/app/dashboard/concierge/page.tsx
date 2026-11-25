"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, HeartHandshake, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";

type Service = { id: string; type: string; name: string; shortDescription: string; priceCents: number; turnaroundHours?: number | null };
type RequestItem = { id: string; requesterId: string; recipientId: string; status: string; reason: string; staffMessage?: string | null; createdAt: string; requester: { displayName?: string | null; fullName?: string | null }; recipient: { displayName?: string | null; fullName?: string | null } };
type Overview = { viewerId: string; tier: "FREE" | "PREMIUM" | "ELITE"; wallet: { availableCredits: number; lifetimePurchased: number; lifetimeUsed: number }; requests: RequestItem[] };

const nameOf = (person: { displayName?: string | null; fullName?: string | null }) => person.displayName || person.fullName || "DateBuk member";
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ConciergePage() {
  const { accessToken, refresh, isHydrated, hydrate } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [reason, setReason] = useState("");
  const [requesterMessage, setRequesterMessage] = useState("");
  const [optOut, setOptOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const token = useCallback(async () => accessToken ?? (await refresh()), [accessToken, refresh]);
  const load = useCallback(async () => {
    const currentToken = await token();
    if (!currentToken) return;
    const [nextOverview, catalog] = await Promise.all([
      api.get<Overview>("/concierge/overview", currentToken),
      api.get<{ services: Service[] }>("/concierge/catalog", currentToken),
    ]);
    setOverview(nextOverview);
    setServices(catalog.services || []);
  }, [token]);

  useEffect(() => { if (!isHydrated) hydrate(); }, [hydrate, isHydrated]);
  useEffect(() => { if (isHydrated) void load().catch((err) => setError(err?.message || "Unable to load concierge")); }, [isHydrated, load]);
  const paid = overview?.tier === "PREMIUM" || overview?.tier === "ELITE";

  async function submitRequest() {
    setBusy(true); setError(""); setNotice("");
    try {
      const currentToken = await token();
      if (!currentToken) throw new Error("Please sign in again");
      await api.post("/concierge/requests", { recipientId, reason, requesterMessage }, currentToken);
      setRecipientId(""); setReason(""); setRequesterMessage(""); setNotice("Request submitted for staff safety review."); await load();
    } catch (err: any) { setError(err?.message || "Unable to submit request"); } finally { setBusy(false); }
  }

  async function createOrder(serviceId: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const currentToken = await token();
      if (!currentToken) throw new Error("Please sign in again");
      await api.post("/concierge/orders", { serviceId, intake: {} }, currentToken);
      setNotice("Service order created. Payment confirmation is required before staff assignment.");
    } catch (err: any) { setError(err?.message || "Unable to create order"); } finally { setBusy(false); }
  }

  async function respond(requestId: string, response: string) {
    setBusy(true); setError("");
    try { const currentToken = await token(); await api.post(`/concierge/requests/${requestId}/respond`, { response }, currentToken || undefined); setNotice("Your decision was saved."); await load(); }
    catch (err: any) { setError(err?.message || "Unable to respond"); } finally { setBusy(false); }
  }

  async function savePrivacy() {
    setBusy(true); setError("");
    try { const currentToken = await token(); await api.patch("/concierge/settings", { conciergeOptOut: optOut }, currentToken || undefined); setNotice("Concierge privacy preference saved."); }
    catch (err: any) { setError(err?.message || "Unable to save preference"); } finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 text-slate-900"><div className="flex min-h-screen"><MobileEnterpriseDrawer user={{ name: "You" }} /><EnterpriseSidebar user={{ name: "You" }} /><main className="min-w-0 flex-1 px-4 py-16 sm:px-8 lg:py-10"><div className="mx-auto max-w-7xl space-y-8">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-violet-950 to-rose-950 p-7 text-white shadow-2xl sm:p-10"><div className="flex flex-wrap items-start justify-between gap-6"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.24em] text-pink-300">Consent-first introductions</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">DateBuk Concierge</h1><p className="mt-4 text-white/75">Staff-reviewed introductions and premium dating support without pressure, private-activity disclosure, or off-platform contact.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4"><p className="text-xs uppercase text-white/60">Current access</p><p className="mt-1 flex items-center gap-2 text-xl font-bold"><Crown size={19} /> {overview?.tier || "Loading"}</p><p className="mt-2 text-sm text-white/70">{overview?.wallet.availableCredits ?? 0} introduction credits</p></div></div></section>
    {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-800">{notice}</div>}{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-rose-800">{error}</div>}
    {!paid && overview ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"><Lock className="mx-auto text-amber-700" /><h2 className="mt-3 text-2xl font-bold">Premium or Elite required</h2><p className="mt-2 text-slate-600">Upgrade to access staff-reviewed introductions and premium services.</p><a href="/dashboard/subscription" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">View plans</a></section> : null}
    <section><div className="mb-5 flex items-center gap-3"><Sparkles className="text-pink-600" /><div><h2 className="text-2xl font-black">Premium services</h2><p className="text-sm text-slate-500">Service prices are separate from membership.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{services.map((service) => <article key={service.id} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-pink-600">{humanize(service.type)}</p><h3 className="mt-2 text-lg font-bold">{service.name}</h3><p className="mt-2 flex-1 text-sm text-slate-600">{service.shortDescription}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-black">${(service.priceCents / 100).toFixed(2)}</p>{service.turnaroundHours ? <p className="text-xs text-slate-500">Target: {service.turnaroundHours} hours</p> : null}</div><Button disabled={!paid || busy} onClick={() => void createOrder(service.id)}>Order</Button></div></article>)}</div></section>
    {paid ? <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"><div className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><HeartHandshake className="text-pink-600" /><h2 className="text-2xl font-black">Request an introduction</h2></div><p className="mt-2 text-sm text-slate-500">One credit is consumed at submission and returned if staff rejects before outreach.</p><div className="mt-5 grid gap-4"><label className="text-sm font-semibold">Recipient user ID<input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" placeholder="Member ID from their profile" /></label><label className="text-sm font-semibold">Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Respectful message<textarea value={requesterMessage} onChange={(e) => setRequesterMessage(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border px-4 py-3 font-normal" placeholder="No phone, email, social handles, pressure, or payment offers." /></label><Button disabled={busy || !recipientId || reason.length < 10 || requesterMessage.length < 10} onClick={() => void submitRequest()}>Submit for review</Button></div></div><div className="rounded-3xl border bg-white p-6 shadow-sm"><ShieldCheck className="text-emerald-600" /><h2 className="mt-3 text-xl font-black">Recipient privacy</h2><p className="mt-2 text-sm text-slate-600">Stop all future introductions. Blocks and reports always override staff actions.</p><label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} /><span className="text-sm font-semibold">Opt out of concierge introductions</span></label><Button className="mt-4" variant="outline" disabled={busy} onClick={() => void savePrivacy()}>Save privacy setting</Button></div></section> : null}
    <section><h2 className="text-2xl font-black">My concierge activity</h2><div className="mt-4 space-y-4">{overview?.requests.length ? overview.requests.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-bold">{nameOf(item.requester)} → {nameOf(item.recipient)}</h3><p className="mt-1 text-sm text-slate-500">{humanize(item.status)} · {new Date(item.createdAt).toLocaleString()}</p><p className="mt-3 text-sm">{item.reason}</p>{item.recipientId === overview.viewerId && item.status === "OUTREACH_SENT" && item.staffMessage ? <div className="mt-4 rounded-xl bg-violet-50 p-4"><p className="text-sm">{item.staffMessage}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => void respond(item.id, "INTERESTED")}>Interested</Button><Button size="sm" variant="outline" onClick={() => void respond(item.id, "NOT_INTERESTED")}>Decline</Button><Button size="sm" variant="outline" onClick={() => void respond(item.id, "BLOCK_REQUESTER")}>Block</Button><Button size="sm" variant="outline" onClick={() => void respond(item.id, "OPT_OUT")}>Opt out</Button><Button size="sm" variant="destructive" onClick={() => void respond(item.id, "REPORT")}>Report</Button></div></div> : null}</article>) : <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">No concierge requests yet.</div>}</div></section>
  </div></main></div></div>;
}
