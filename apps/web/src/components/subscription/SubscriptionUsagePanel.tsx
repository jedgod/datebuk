"use client";

import { useEffect, useMemo, useState } from "react";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";

type Feature = {
  feature: string;
  included: boolean;
  unlimited: boolean;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  disabled: boolean;
};
type Usage = { plan: "free" | "premium" | "elite"; priceCents: number; resetsAt: string; features: Feature[] };

const GROUP_LABEL: Record<string, string> = {
  match: "Matching",
  chat: "Messaging",
  voice: "Voice",
  video: "Video",
  ai: "AI assistance",
  profile: "Profile",
  date: "Dates",
  events: "Events",
  location: "Location",
  privacy: "Privacy",
  ads: "Ads",
};

const pretty = (f: string) => f.split(".").slice(1).join(" ").replace(/_/g, " ");

/**
 * Live plan entitlements and today's quota usage for the signed-in user. Every limit and every
 * price comes from GET /api/subscriptions/usage (the server's feature policy) - nothing about a
 * plan is hard-coded in this component.
 */
export function SubscriptionUsagePanel() {
  const accessToken = useAuth((s) => s.accessToken);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let live = true;
    fetch(apiEndpoint("/subscriptions/usage"), { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Couldn't load your plan usage.");
        return r.json();
      })
      .then((u) => live && setUsage(u))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [accessToken]);

  const groups = useMemo(() => {
    const g = new Map<string, Feature[]>();
    for (const f of usage?.features ?? []) {
      const key = f.feature.split(".")[0];
      g.set(key, [...(g.get(key) ?? []), f]);
    }
    return [...g.entries()];
  }, [usage]);

  if (error) return <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{error}</div>;
  if (!usage) return <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">Loading your plan usage…</div>;

  const quotas = usage.features.filter((f) => f.limit != null && !f.disabled);
  const price = usage.priceCents === 0 ? "Free" : `$${(usage.priceCents / 100).toFixed(2)}/month`;

  return (
    <section className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-5" aria-label="Plan usage">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">
          Your plan: <span className="text-pink-400 capitalize">{usage.plan}</span> <span className="text-sm font-normal text-white/60">· {price}</span>
        </h2>
        <p className="text-xs text-white/50">Daily limits reset {new Date(usage.resetsAt).toLocaleString()}</p>
      </div>

      {quotas.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quotas.map((f) => {
            const pct = f.limit ? Math.min(100, Math.round(((f.used ?? 0) / f.limit) * 100)) : 0;
            return (
              <div key={f.feature} className="rounded-xl bg-black/20 p-3">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{pretty(f.feature)}</span>
                  <span className="text-white/70">
                    {f.used}/{f.limit} today
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full ${pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                </div>
                {f.remaining === 0 && <p className="mt-1 text-xs text-red-300">Limit reached - resets tomorrow.</p>}
              </div>
            );
          })}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-white/70">What&apos;s included in your plan</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(([key, items]) => (
            <div key={key}>
              <h3 className="mb-1 text-sm font-semibold text-white/90">{GROUP_LABEL[key] ?? key}</h3>
              <ul className="space-y-0.5 text-sm">
                {items.map((f) => (
                  <li key={f.feature} className="flex items-center justify-between gap-2">
                    <span className={`capitalize ${f.included && !f.disabled ? "text-white/90" : "text-white/40"}`}>{pretty(f.feature)}</span>
                    <span className={f.disabled ? "text-amber-300" : f.included ? "text-emerald-300" : "text-white/40"}>
                      {f.disabled ? "unavailable" : !f.included ? "upgrade" : f.unlimited ? "included" : `${f.limit}/day`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
