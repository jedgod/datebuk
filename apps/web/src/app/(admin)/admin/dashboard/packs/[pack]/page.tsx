"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radio } from "lucide-react";

type PackStatus = {
  module: string;
  status: string;
  updatedAt: string;
};

type PackDashboard = {
  title: string;
  cards: Array<[string, string]>;
  features: string[];
};

const PACKS: Record<string, string> = {
  "1-trust-safety": "Pack 1 - Trust Safety",
  "2-realtime-communication": "Pack 2 - Realtime Communication",
  "3-ai-matchmaker": "Pack 3 - AI Matchmaker",
  "4-enterprise-scale": "Pack 4 - Enterprise Scale",
  "5-global-superapp": "Pack 5 - Global Super App",
};

const PACK_DESCRIPTIONS: Record<string, string> = {
  "1-trust-safety": "Adds trust score, verification, scam/catfish detection, safe date workflow, report/block, and admin safety operations.",
  "2-realtime-communication": "Adds realtime chat, voice notes, video dates, virtual dating rooms, date requests, and call safety controls.",
  "3-ai-matchmaker": "Adds AI compatibility scoring, dating coach, profile optimizer, conversation assistant, and relationship insights.",
  "4-enterprise-scale": "Adds Redis, Kafka, ElasticSearch, vector database, Kubernetes deployment, observability, and multi-region readiness.",
  "5-global-superapp": "Expands DateBuk into dating, friendship, communities, events, marketplace, travel connections, and professional networking.",
};

export default function AdminPackDashboardPage() {
  const params = useParams<{ pack: string }>();
  const pack = params?.pack || "";
  const [status, setStatus] = useState<PackStatus | null>(null);
  const [dashboard, setDashboard] = useState<PackDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => PACKS[pack] || pack, [pack]);
  const description = useMemo(
    () => PACK_DESCRIPTIONS[pack] || "Industrial module payload rendered from pack API.",
    [pack]
  );

  const load = async () => {
    if (!pack) return;
    setLoading(true);
    setError(null);

    try {
      const [statusRes, dashboardRes] = await Promise.all([
        fetch(`/api/packs/${encodeURIComponent(pack)}/status`, { cache: "no-store" }),
        fetch(`/api/packs/${encodeURIComponent(pack)}/dashboard`, { cache: "no-store" }),
      ]);

      const statusData = await statusRes.json();
      const dashboardData = await dashboardRes.json();

      if (!statusRes.ok) {
        throw new Error(statusData?.error || "Failed to load pack status");
      }
      if (!dashboardRes.ok) {
        throw new Error(dashboardData?.error || "Failed to load pack dashboard");
      }

      setStatus(statusData);
      setDashboard(dashboardData);
    } catch (err: any) {
      setError(err?.message || "Failed to load pack dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [pack]);

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-pink-600">DateBuk Next-Level Module</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">{dashboard?.title || title}</h1>
              <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {status?.status || "LOADING"}
                {status?.updatedAt ? ` • Updated ${new Date(status.updatedAt).toLocaleString()}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/dashboard/packs">
                <Button variant="outline">
                  <ArrowLeft size={14} className="mr-2" />
                  Back to Pack
                </Button>
              </Link>
              {pack === "2-realtime-communication" ? (
                <Link href="/admin/video-date/settings">
                  <Button className="bg-slate-950 text-white hover:bg-slate-800">
                    <Radio size={14} className="mr-2" />
                    Open Realtime Pack
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {(dashboard?.cards || []).map((card) => (
            <div key={card[0]} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card[0]}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">{card[1]}</h2>
            </div>
          ))}
          {(!dashboard?.cards || dashboard.cards.length === 0) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">No cards available.</p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Industrial Feature Controls</h2>
            <div className="mt-4 space-y-3">
              {(dashboard?.features || []).map((feature) => (
                <div key={feature} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="font-medium text-slate-800">{feature}</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">ACTIVE</span>
                </div>
              ))}
              {(!dashboard?.features || dashboard.features.length === 0) && (
                <p className="text-sm text-slate-500">No features available.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Operational Workflow</h2>
            <ol className="mt-4 space-y-3 text-slate-700">
              <li>1. Capture user signal and consent.</li>
              <li>2. Process signal through DateBuk rules and AI engine.</li>
              <li>3. Store secure event record in PostgreSQL.</li>
              <li>4. Display action-ready insight to web and mobile users.</li>
            </ol>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
