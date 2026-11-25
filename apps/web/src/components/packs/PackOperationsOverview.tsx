import Link from "next/link";
import { Boxes, Sparkles } from "lucide-react";

const PACKS = [
  ["1-trust-safety", "Pack 1 - Trust Safety", "Trust scoring, verification, scam detection, safe-date workflows, and report/block operations."],
  ["2-realtime-communication", "Pack 2 - Realtime Communication", "Realtime chat, voice notes, video dates, date requests, and call-safety controls."],
  ["3-ai-matchmaker", "Pack 3 - AI Matchmaker", "Compatibility scoring, coaching, profile optimization, and relationship insights."],
  ["4-enterprise-scale", "Pack 4 - Enterprise Scale", "Redis, Kafka, search, observability, deployment, and multi-region readiness."],
  ["5-global-superapp", "Pack 5 - Global Super App", "Communities, events, marketplace, travel connections, and professional networking."],
] as const;

export function PackOperationsOverview({
  audience,
  detailBase,
}: {
  audience: "Admin" | "Staff";
  detailBase?: string;
}) {
  return (
    <main className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3 text-amber-700">
            <Boxes size={20} />
            <p className="text-sm font-bold uppercase tracking-wider">Internal operations</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Pack Operations</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            {audience === "Admin"
              ? "Inspect implementation modules, operational status, and administrative controls."
              : "Review the operational modules used by DateBuk. Configuration changes remain restricted to administrators."}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PACKS.map(([slug, label, summary]) => {
            const content = (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  <Sparkles size={14} /> Module
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-950">{label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-700">Operational</p>
              </>
            );

            return detailBase ? (
              <Link
                key={slug}
                href={`${detailBase}/${slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                {content}
              </Link>
            ) : (
              <article key={slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {content}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
