"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";

/**
 * Communications Center (admin) / Communications Operations (staff).
 *
 * Every number and control here comes from the authenticated API (/api/admin/sms/*); there is
 * no mock data. Managing provider accounts needs superadmin AND a fresh MFA step-up: a 403
 * with code STEP_UP_REQUIRED opens the authenticator prompt and the action is retried.
 * Credentials are write-only: the API never returns a token or secret.
 */

type Mode = "admin" | "staff";
type Tab = "overview" | "health" | "accounts" | "messages" | "fraud" | "compliance" | "audit" | "webhooks";

type Account = {
  id: string;
  name: string;
  accountSid: string;
  status: "pending" | "verified" | "active" | "suspended" | "rotating" | "revoked";
  statusReason: string | null;
  authMode: "auth_token" | "api_key";
  hasAuthToken: boolean;
  keyVersion: number;
  lastValidatedAt: string | null;
  rotatedAt: string | null;
  dailySegmentLimit: number | null;
  monthlySegmentLimit: number | null;
  allowedPrefixes: string[];
  senders: { id: string; senderNumber: string | null; messagingServiceSid: string | null; enabled: boolean }[];
  usage: { segmentsToday: number; segmentsThisMonth: number };
};

type Analytics = {
  total: number;
  segments: number;
  deliveryRate: number | null;
  needsReconciliation: number;
  byState: Record<string, number>;
  byPurpose: Record<string, number>;
  perDay: { day: string; messages: number; segments: number }[];
};

type Msg = { id: string; createdAt: string; purpose: string; recipientLast4: string; state: string; segments: number; providerSid: string | null };
type AuditItem = { id: string; action: string; actorUserId: string | null; createdAt: string; ip: string | null; metadata: any };
type WebhookCfg = { baseUrl: string | null; httpsOk: boolean; statusUrl: string | null; inboundUrl: string | null; signatureRequired: boolean; flags: { enabled: boolean; liveSms: boolean; envFallback: boolean }; note: string };

type Health = {
  at: string;
  queue: { queued: number; dueNow: number; dispatching: number; oldestDueAgeSeconds: number };
  reconciliation: { uncertain: number; needsReview: number; oldestUncertainAgeSeconds: number };
  delivery: { last24h: { total: number; byState: Record<string, number>; failureRatePct: number | null; medianLatencySeconds: number | null } };
  budget: { accountId: string; name: string; segmentsToday: number; dailyLimit: number | null; pct: number | null }[];
  security: { webhookRejections5m: number; openRiskEvents: number; highRiskEventsLastHour: number; otpRequestsLastHour: number };
  worker: { sweepsLast10m: number };
  control: { stopped: boolean; reason: string | null };
};
type AlertRow = { id: string; ruleId: string; severity: string; summary: string; status: string; createdAt: string };
type RiskRow = { id: string; kind: string; score: number; severity: string; action: string; status: string; createdAt: string; subjectHash: string | null; ipHash: string | null };
type Reg = { id: string; accountId: string; type: string; status: string; brandId: string | null; campaignId: string | null; senderId: string | null; evidenceNote: string | null; expiresAt: string | null; submittedAt: string | null };
type ConsentView = { current: { purpose: string; status: string; source: string; policyVersion: string | null; updatedAt: string }[]; events: { id: string; recipientLast4: string; purpose: string; action: string; source: string; policyVersion: string | null; createdAt: string }[] };

class ApiFail extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  verified: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  pending: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  rotating: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  suspended: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  revoked: "bg-red-500/15 text-red-300 border-red-500/40",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  sent: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  accepted: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  queued: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  failed: "bg-red-500/15 text-red-300 border-red-500/40",
  undelivered: "bg-red-500/15 text-red-300 border-red-500/40",
  uncertain: "bg-amber-500/15 text-amber-300 border-amber-500/40",
};

const Badge = ({ value }: { value: string }) => (
  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[value] ?? STATUS_STYLE.pending}`}>{value}</span>
);

const card = "rounded-lg border border-white/10 bg-white/5 p-3";
const input = "w-full rounded-lg border border-white/15 bg-slate-950/60 px-2.5 py-1.5 text-[13px] text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";
const btn = "rounded-md px-2.5 py-1 text-xs font-medium transition disabled:opacity-40";
const btnPrimary = `${btn} bg-amber-500 text-slate-950 hover:bg-amber-400`;
const btnGhost = `${btn} border border-white/15 text-slate-200 hover:bg-white/10`;
const btnDanger = `${btn} border border-red-500/50 text-red-300 hover:bg-red-500/10`;

export function CommunicationsConsole({ mode }: { mode: Mode }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookCfg | null>(null);
  const [days, setDays] = useState(7);
  const [health, setHealth] = useState<Health | null>(null);
  const [alertRows, setAlertRows] = useState<AlertRow[]>([]);
  const [riskRows, setRiskRows] = useState<RiskRow[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [reviewMsgs, setReviewMsgs] = useState<Msg[]>([]);
  const [consentPhone, setConsentPhone] = useState("");
  const [consentView, setConsentView] = useState<ConsentView | null>(null);
  const [regForm, setRegForm] = useState({ accountId: "", type: "A2P_10DLC_BRAND", brandId: "", campaignId: "", expiresAt: "" });
  const [evidence, setEvidence] = useState<{ reg: Reg; to: string } | null>(null);
  const [evidenceText, setEvidenceText] = useState("");

  // ---- step-up (MFA re-confirmation) ----
  const stepUp = useRef<{ token: string; expires: number } | null>(null);
  const [stepPrompt, setStepPrompt] = useState<{ resolve: (t: string | null) => void } | null>(null);
  const [stepCode, setStepCode] = useState("");
  const [stepErr, setStepErr] = useState<string | null>(null);

  const rawCall = useCallback(
    async (method: string, path: string, body?: unknown, step?: string) => {
      const res = await fetch(apiEndpoint(path), {
        method,
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(step ? { "X-Step-Up-Token": step } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      if (!res.ok) {
        const m = data?.message;
        throw new ApiFail(res.status, Array.isArray(m) ? m.join(", ") : m || `Request failed (${res.status})`, data?.code);
      }
      return data;
    },
    [accessToken],
  );

  const askForStepUp = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        setStepCode("");
        setStepErr(null);
        setStepPrompt({ resolve });
      }),
    [],
  );

  /** Run a management call, prompting for MFA when needed and retrying once. */
  const manage = useCallback(
    async (method: string, path: string, body?: unknown) => {
      const cached = stepUp.current && stepUp.current.expires > Date.now() + 5_000 ? stepUp.current.token : null;
      try {
        return await rawCall(method, path, body, cached ?? undefined);
      } catch (e) {
        if (e instanceof ApiFail && e.code === "STEP_UP_REQUIRED") {
          stepUp.current = null;
          const t = await askForStepUp();
          if (!t) throw new ApiFail(0, "Multi-factor confirmation cancelled");
          return rawCall(method, path, body, t);
        }
        throw e;
      }
    },
    [rawCall, askForStepUp],
  );

  const submitStepUp = async () => {
    try {
      const r = await rawCall("POST", "/auth/step-up", { code: stepCode.trim() });
      stepUp.current = { token: r.stepUpToken, expires: Date.now() + r.expiresInSeconds * 1000 };
      stepPrompt?.resolve(r.stepUpToken);
      setStepPrompt(null);
    } catch (e) {
      setStepErr(e instanceof ApiFail && e.status === 401 ? "That code isn't valid. Try the next one." : (e as Error).message);
    }
  };
  const cancelStepUp = () => {
    stepPrompt?.resolve(null);
    setStepPrompt(null);
  };

  // ---- loading ----
  const guard = async <T,>(f: () => Promise<T>): Promise<T | undefined> => {
    setError(null);
    try {
      return await f();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadAnalytics = useCallback(() => guard(async () => setAnalytics(await rawCall("GET", `/admin/sms/analytics?days=${days}`))), [rawCall, days]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadAccounts = useCallback(() => guard(async () => setAccounts((await rawCall("GET", "/admin/sms/accounts")).accounts)), [rawCall]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadMessages = useCallback(
    (append = false, before?: string | null) =>
      guard(async () => {
        const q = new URLSearchParams({ limit: "25" });
        if (stateFilter) q.set("state", stateFilter);
        if (append && before) q.set("before", before);
        const r = await rawCall("GET", `/admin/sms/messages?${q}`);
        setMessages((prev) => (append ? [...prev, ...r.items] : r.items));
        setNextBefore(r.nextBefore);
      }),
    [rawCall, stateFilter], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const loadAudit = useCallback(() => guard(async () => setAudit((await rawCall("GET", "/admin/sms/audit?limit=100")).items)), [rawCall]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadWebhooks = useCallback(() => guard(async () => setWebhooks(await rawCall("GET", "/admin/sms/webhook-config"))), [rawCall]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHealth = useCallback(
    () =>
      guard(async () => {
        setHealth(await rawCall("GET", "/admin/sms/health"));
        setAlertRows((await rawCall("GET", "/admin/sms/alerts")).items);
        setReviewMsgs((await rawCall("GET", "/admin/sms/messages/needs-review")).items);
      }),
    [rawCall], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const loadFraud = useCallback(() => guard(async () => setRiskRows((await rawCall("GET", "/admin/sms/risk-events")).items)), [rawCall]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadCompliance = useCallback(
    () =>
      guard(async () => {
        setRegs((await rawCall("GET", "/admin/sms/compliance")).items);
        setAccounts((await rawCall("GET", "/admin/sms/accounts")).accounts);
      }),
    [rawCall], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!accessToken) return;
    if (tab === "health") void loadHealth();
    if (tab === "fraud") void loadFraud();
    if (tab === "compliance") void loadCompliance();
    if (tab === "overview") void loadAnalytics();
    if (tab === "accounts") void loadAccounts();
    if (tab === "messages") void loadMessages(false);
    if (tab === "audit") void loadAudit();
    if (tab === "webhooks") void loadWebhooks();
  }, [accessToken, tab, loadAnalytics, loadAccounts, loadMessages, loadAudit, loadWebhooks, loadHealth, loadFraud, loadCompliance]);

  // ---- actions (admin) ----
  const act = async (label: string, f: () => Promise<unknown>, after?: () => unknown) => {
    setNotice(null);
    await guard(async () => {
      await f();
      setNotice(`${label} - done`);
      await after?.();
    });
  };

  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState({ name: "", accountSid: "", authToken: "", apiKeySid: "", apiKeySecret: "" });
  const [rotateFor, setRotateFor] = useState<Account | null>(null);
  const [rot, setRot] = useState({ authToken: "", apiKeySid: "", apiKeySecret: "" });
  const [spendFor, setSpendFor] = useState<Account | null>(null);
  const [spend, setSpend] = useState({ daily: "", monthly: "", prefixes: "+1" });
  const [senderFor, setSenderFor] = useState<Account | null>(null);
  const [snd, setSnd] = useState({ kind: "number" as "number" | "service", value: "" });
  const [migration, setMigration] = useState<any>(null);

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "health", label: "Health & alerts" },
      { id: "accounts", label: "Provider accounts" },
      { id: "messages", label: "Message history" },
      { id: "fraud", label: "Fraud & consent" },
      { id: "compliance", label: "Compliance" },
      { id: "audit", label: "Audit" },
      { id: "webhooks", label: "Webhooks" },
    ],
    [],
  );

  const admin = mode === "admin";

  return (
    // Own dark surface: the console is styled for dark and is mounted inside layouts with light content areas.
    <div className="space-y-3 rounded-xl bg-slate-900 p-3 text-slate-100 md:p-4">
      <div>
        <h1 className="text-lg font-bold">{admin ? "Communications Center" : "Communications Operations"}</h1>
        <p className="text-xs text-slate-400">
          {admin
            ? "Twilio provider accounts, senders, spending controls, delivery and audit. Changes require MFA confirmation."
            : "Read-only view of SMS delivery, history and audit. Provider administration is superadmin-only."}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`${btn} ${tab === t.id ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}

      {/* ---------- Overview ---------- */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Period</span>
            {[1, 7, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`${btn} ${days === d ? "bg-white/15" : "text-slate-400 hover:bg-white/10"}`}>
                {d === 1 ? "24h" : `${d}d`}
              </button>
            ))}
          </div>
          {!analytics ? (
            <p className="text-slate-400">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
                <Stat label="Messages" value={analytics.total} />
                <Stat label="Segments billed" value={analytics.segments} />
                <Stat label="Delivery rate" value={analytics.deliveryRate == null ? "-" : `${analytics.deliveryRate}%`} />
                <Stat label="Needs reconciliation" value={analytics.needsReconciliation} warn={analytics.needsReconciliation > 0} hint="Outcome unknown. Never auto-retried; check with Twilio before resending." />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className={card}>
                  <h3 className="mb-1.5 text-sm font-semibold">By delivery state</h3>
                  {Object.keys(analytics.byState).length === 0 ? <p className="text-sm text-slate-400">No messages in this period.</p> : (
                    <ul className="space-y-1 text-sm">
                      {Object.entries(analytics.byState).map(([s, n]) => (
                        <li key={s} className="flex items-center justify-between"><Badge value={s} /><span>{n}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={card}>
                  <h3 className="mb-1.5 text-sm font-semibold">Per day</h3>
                  {analytics.perDay.length === 0 ? <p className="text-sm text-slate-400">No data.</p> : (
                    <table className="w-full text-xs"><thead className="text-left text-slate-400"><tr><th>Day</th><th>Messages</th><th>Segments</th></tr></thead>
                      <tbody>{analytics.perDay.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.messages}</td><td>{d.segments}</td></tr>)}</tbody></table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------- Accounts ---------- */}
      {tab === "accounts" && (
        <div className="space-y-3">
          {admin && (
            <div className="flex flex-wrap gap-2">
              <button className={btnPrimary} onClick={() => setShowRegister(true)}>Register Twilio account</button>
              <button className={btnGhost} onClick={() => act("Credential migration (dry run)", async () => setMigration(await manage("POST", "/admin/sms/credentials/migrate?dryRun=true")))}>Credential migration - dry run</button>
              <button className={btnGhost} onClick={() => act("Credential migration", async () => setMigration(await manage("POST", "/admin/sms/credentials/migrate")), loadAccounts)}>Migrate credentials to current key</button>
            </div>
          )}
          {migration && (
            <div className={card + " text-sm"}>
              <p className="font-semibold">{migration.dryRun ? "Dry run" : "Migration"}: {migration.migrated} to migrate/migrated, {migration.alreadyCurrent} already current, {migration.failed.length} failed (target key v{migration.targetVersion}).</p>
              <p className="text-slate-400">Keys still in use: {migration.remainingKeyVersions.map((k: any) => `v${k.version} (${k.accounts})`).join(", ") || "none"}. Retire an old key only when only the current version remains.</p>
            </div>
          )}
          {!accounts ? <p className="text-slate-400">Loading…</p> : accounts.length === 0 ? (
            <div className={card}><p className="text-slate-300">No provider accounts yet.{admin ? " Register one, add a sender, then activate it." : ""}</p></div>
          ) : accounts.map((a) => (
            <div key={a.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{a.name}</h3><Badge value={a.status} /></div>
                  <p className="font-mono text-xs text-slate-400">{a.accountSid}</p>
                  <p className="text-xs text-slate-400">
                    {a.authMode === "api_key" ? "API key" : "Auth token"} · key v{a.keyVersion === 0 ? "legacy" : a.keyVersion}
                    {a.lastValidatedAt && ` · validated ${new Date(a.lastValidatedAt).toLocaleString()}`}
                    {a.rotatedAt && ` · rotated ${new Date(a.rotatedAt).toLocaleDateString()}`}
                  </p>
                  {a.statusReason && <p className="text-xs text-amber-300">Reason: {a.statusReason}</p>}
                  {!a.hasAuthToken && a.status !== "revoked" && <p className="text-xs text-amber-300">No Auth Token on file: webhooks for this account cannot be verified.</p>}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Today: <b className="text-slate-100">{a.usage.segmentsToday}</b>{a.dailySegmentLimit ? ` / ${a.dailySegmentLimit}` : ""} segments</p>
                  <p>This month: <b className="text-slate-100">{a.usage.segmentsThisMonth}</b>{a.monthlySegmentLimit ? ` / ${a.monthlySegmentLimit}` : ""}</p>
                  <p>Destinations: {a.allowedPrefixes.join(", ")}</p>
                </div>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <p className="text-slate-400">Senders</p>
                {a.senders.length === 0 ? <p className="text-slate-500">None. Add a sender before activating.</p> : a.senders.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5">
                    <span className="font-mono text-xs">{s.senderNumber ?? s.messagingServiceSid}</span>
                    <span className="flex items-center gap-2"><Badge value={s.enabled ? "active" : "suspended"} />
                      {admin && s.enabled && <button className={btnDanger} onClick={() => act("Sender disabled", () => manage("POST", `/admin/sms/senders/${s.id}/disable`), loadAccounts)}>Disable</button>}
                    </span>
                  </div>
                ))}
              </div>

              {admin && a.status !== "revoked" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button className={btnGhost} onClick={() => act("Validated", () => rawCall("POST", `/admin/sms/accounts/${a.id}/validate`), loadAccounts)}>Validate</button>
                  <button className={btnGhost} onClick={() => setSenderFor(a)}>Add sender</button>
                  {a.status !== "active" && <button className={btnPrimary} onClick={() => act("Activated", () => manage("POST", `/admin/sms/accounts/${a.id}/activate`), loadAccounts)}>Activate</button>}
                  {a.status === "active" && <button className={btnGhost} onClick={() => act("Suspended", () => manage("POST", `/admin/sms/accounts/${a.id}/suspend`, { reason: "suspended from dashboard" }), loadAccounts)}>Suspend</button>}
                  <button className={btnGhost} onClick={() => { setRot({ authToken: "", apiKeySid: "", apiKeySecret: "" }); setRotateFor(a); }}>Rotate credentials</button>
                  <button className={btnGhost} onClick={() => { setSpend({ daily: a.dailySegmentLimit?.toString() ?? "", monthly: a.monthlySegmentLimit?.toString() ?? "", prefixes: a.allowedPrefixes.join(", ") }); setSpendFor(a); }}>Spending &amp; destinations</button>
                  <button className={btnDanger} onClick={() => { if (confirm(`Revoke "${a.name}"? Its credentials are wiped and this cannot be undone.`)) void act("Revoked", () => manage("POST", `/admin/sms/accounts/${a.id}/revoke`), loadAccounts); }}>Revoke</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------- Messages ---------- */}
      {tab === "messages" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select className={input + " max-w-[200px]"} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">All states</option>
              {["queued", "accepted", "sent", "delivered", "undelivered", "failed", "uncertain"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className={btnGhost} onClick={() => loadMessages(false)}>Refresh</button>
          </div>
          <div className={card + " overflow-x-auto p-0"}>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-400"><tr><th className="p-2">Time</th><th>Purpose</th><th>To</th><th>State</th><th>Segments</th>{admin && <th>Resolve</th>}</tr></thead>
              <tbody>
                {messages.length === 0 ? <tr><td colSpan={admin ? 6 : 5} className="p-4 text-slate-400">No messages.</td></tr> : messages.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="p-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td><td>{m.purpose}</td><td className="font-mono">•••{m.recipientLast4}</td><td><Badge value={m.state} /></td><td>{m.segments}</td>
                    {admin && (
                      <td className="whitespace-nowrap pr-3">
                        {m.state === "uncertain" ? (
                          <span className="flex gap-1">
                            <button className={btnGhost} title="Twilio confirms it was sent" onClick={() => act("Marked sent", () => manage("POST", `/admin/sms/messages/${m.id}/reconcile`, { outcome: "sent" }), () => loadMessages(false))}>Was sent</button>
                            <button className={btnGhost} title="Twilio confirms it was NOT sent. Nothing is resent automatically." onClick={() => act("Marked not sent", () => manage("POST", `/admin/sms/messages/${m.id}/reconcile`, { outcome: "not_sent" }), () => loadMessages(false))}>Not sent</button>
                          </span>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextBefore && <button className={btnGhost} onClick={() => loadMessages(true, nextBefore)}>Load more</button>}
          <p className="text-xs text-slate-500">Only the last four digits of a number are kept. Recipient and text are held encrypted in the outbox only until dispatch, then erased.</p>
        </div>
      )}

      {/* ---------- Audit ---------- */}
      {tab === "audit" && (
        <div className={card + " overflow-x-auto p-0"}>
          <table className="w-full text-xs">
            <thead className="text-left text-slate-400"><tr><th className="p-2">Time</th><th>Action</th><th>Actor</th><th>Details</th></tr></thead>
            <tbody>
              {audit.length === 0 ? <tr><td colSpan={4} className="p-4 text-slate-400">No audit records.</td></tr> : audit.map((a) => (
                <tr key={a.id} className="border-t border-white/5 align-top">
                  <td className="p-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="font-mono text-xs">{a.action}</td>
                  <td className="font-mono text-xs">{a.actorUserId ? a.actorUserId.slice(0, 8) : "system"}</td>
                  <td className="max-w-[420px] truncate font-mono text-xs text-slate-400">{a.metadata ? JSON.stringify(a.metadata) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Webhooks ---------- */}
      {tab === "webhooks" && (
        <div className="space-y-3">
          {!webhooks ? <p className="text-slate-400">Loading…</p> : (
            <>
              <div className={card + " space-y-2 text-sm"}>
                <p className={webhooks.httpsOk ? "text-emerald-300" : "text-amber-300"}>{webhooks.note}</p>
                <Copy label="Status callback URL" value={webhooks.statusUrl} />
                <Copy label="Inbound (replies / STOP) URL" value={webhooks.inboundUrl} />
              </div>
              <div className={card + " grid gap-2 text-sm md:grid-cols-4"}>
                <Flag label="Signature required" on={webhooks.signatureRequired} />
                <Flag label="Module enabled" on={webhooks.flags.enabled} />
                <Flag label="Live SMS" on={webhooks.flags.liveSms} />
                <Flag label="Env credential fallback" on={webhooks.flags.envFallback} neutralWhenOff />
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------- Health & alerts ---------- */}
      {tab === "health" && (
        <div className="space-y-3">
          {!health ? <p className="text-slate-400">Loading…</p> : (
            <>
              {health.control.stopped && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                  <b>Emergency stop is ON</b>{health.control.reason ? ` - ${health.control.reason}` : ""}. Nothing new is being sent; queued messages are waiting.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
                <Stat label="Queued (due now)" value={`${health.queue.queued} (${health.queue.dueNow})`} warn={health.queue.dueNow > 0 && health.queue.oldestDueAgeSeconds > 300} hint="Oldest due message age shown below" />
                <Stat label="Oldest due" value={`${health.queue.oldestDueAgeSeconds}s`} />
                <Stat label="Uncertain" value={health.reconciliation.uncertain} warn={health.reconciliation.uncertain > 0} />
                <Stat label="Needs review" value={health.reconciliation.needsReview} warn={health.reconciliation.needsReview > 0} />
                <Stat label="Failure rate 24h" value={health.delivery.last24h.failureRatePct == null ? "-" : `${health.delivery.last24h.failureRatePct}%`} />
                <Stat label="Median delivery" value={health.delivery.last24h.medianLatencySeconds == null ? "-" : `${health.delivery.last24h.medianLatencySeconds}s`} />
                <Stat label="Signature rejections 5m" value={health.security.webhookRejections5m} warn={health.security.webhookRejections5m > 0} />
                <Stat label="Open fraud events" value={health.security.openRiskEvents} warn={health.security.openRiskEvents > 0} />
              </div>
              <div className={card}>
                <h3 className="mb-1.5 text-sm font-semibold">Spending today</h3>
                {health.budget.length === 0 ? <p className="text-sm text-slate-400">No provider accounts.</p> : health.budget.map((b) => (
                  <div key={b.accountId} className="mb-2 text-sm">
                    <div className="flex justify-between"><span>{b.name}</span><span>{b.segmentsToday}{b.dailyLimit ? ` / ${b.dailyLimit}` : " (no cap)"} segments</span></div>
                    {b.pct != null && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${b.pct >= 100 ? "bg-red-400" : b.pct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, b.pct)}%` }} /></div>}
                  </div>
                ))}
              </div>
              {admin && (
                <div className={card + " flex flex-wrap items-center gap-2"}>
                  <button className={health.control.stopped ? btnPrimary : btnDanger} onClick={() => {
                    if (health.control.stopped) void act("Emergency stop released", () => manage("POST", "/admin/sms/emergency-stop", { on: false }), loadHealth);
                    else { const reason = prompt("Reason for the emergency stop (recorded in the audit log)?"); if (reason) void act("Emergency stop engaged", () => manage("POST", "/admin/sms/emergency-stop", { on: true, reason }), loadHealth); }
                  }}>{health.control.stopped ? "Release emergency stop" : "EMERGENCY STOP - halt all SMS"}</button>
                  <button className={btnGhost} onClick={() => act("Reconciliation run", async () => { const r = await manage("POST", "/admin/sms/reconcile/run"); setNotice(`Reconciliation: checked ${r.checked}, updated ${r.updated}, escalated ${r.escalated}${r.rateLimited ? " (provider rate-limited)" : ""}${r.skipped ? " (another worker holds the lease)" : ""}`); }, loadHealth)}>Run reconciliation now</button>
                  <span className="text-xs text-slate-500">Reconciliation never resends a message.</span>
                </div>
              )}
              <div className={card + " overflow-x-auto p-0"}>
                <h3 className="px-3 pt-2 text-sm font-semibold">Alerts</h3>
                <table className="w-full text-xs"><thead className="text-left text-slate-400"><tr><th className="p-2">Time</th><th>Rule</th><th>Severity</th><th>Summary</th><th>Status</th></tr></thead>
                  <tbody>{alertRows.length === 0 ? <tr><td colSpan={5} className="p-4 text-slate-400">No communications alerts.</td></tr> : alertRows.map((a) => (
                    <tr key={a.id} className="border-t border-white/5"><td className="p-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td><td className="font-mono text-xs">{a.ruleId}</td><td><Badge value={a.severity === "critical" || a.severity === "high" ? "failed" : a.severity === "medium" ? "uncertain" : "queued"} /> {a.severity}</td><td>{a.summary}</td><td><Badge value={a.status === "open" ? "uncertain" : "delivered"} /> {a.status}</td></tr>
                  ))}</tbody></table>
                <p className="p-3 text-xs text-slate-500">Acknowledge and resolve alerts in the Security Alerts console; the same incident record is used.</p>
              </div>
              <div className={card + " overflow-x-auto p-0"}>
                <h3 className="px-3 pt-2 text-sm font-semibold">Messages needing review</h3>
                <table className="w-full text-xs"><thead className="text-left text-slate-400"><tr><th className="p-2">Time</th><th>State</th><th>Detail</th>{admin && <th>Resolve</th>}</tr></thead>
                  <tbody>{reviewMsgs.length === 0 ? <tr><td colSpan={admin ? 4 : 3} className="p-4 text-slate-400">Nothing to review.</td></tr> : reviewMsgs.map((m) => (
                    <tr key={m.id} className="border-t border-white/5"><td className="p-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td><td><Badge value={m.state} /></td><td className="text-xs text-slate-400">{(m as any).lastError ?? ""}</td>
                      {admin && <td className="whitespace-nowrap pr-3">{m.state === "uncertain" ? <span className="flex gap-1"><button className={btnGhost} onClick={() => act("Marked sent", () => manage("POST", `/admin/sms/messages/${m.id}/reconcile`, { outcome: "sent" }), loadHealth)}>Was sent</button><button className={btnGhost} onClick={() => act("Marked not sent", () => manage("POST", `/admin/sms/messages/${m.id}/reconcile`, { outcome: "not_sent" }), loadHealth)}>Not sent</button></span> : null}</td>}
                    </tr>
                  ))}</tbody></table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------- Fraud & consent ---------- */}
      {tab === "fraud" && (
        <div className="space-y-3">
          <div className={card + " overflow-x-auto p-0"}>
            <h3 className="px-3 pt-2 text-sm font-semibold">Fraud events</h3>
            <p className="px-3 pb-2 text-xs text-slate-500">Throttles and temporary blocks only - no account is ever suspended automatically. IPs and numbers are shown as short hash prefixes.</p>
            <table className="w-full text-xs"><thead className="text-left text-slate-400"><tr><th className="p-2">Time</th><th>Kind</th><th>Score</th><th>Action</th><th>Status</th><th>Review</th></tr></thead>
              <tbody>{riskRows.length === 0 ? <tr><td colSpan={6} className="p-4 text-slate-400">No fraud events.</td></tr> : riskRows.map((r) => (
                <tr key={r.id} className="border-t border-white/5"><td className="p-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td><td className="font-mono text-xs">{r.kind}</td><td>{r.score}</td><td><Badge value={r.action === "blocked" ? "failed" : r.action === "throttled" ? "uncertain" : "queued"} /> {r.action}</td><td>{r.status}</td>
                  <td className="whitespace-nowrap pr-3">{r.status === "open" ? <span className="flex gap-1"><button className={btnGhost} onClick={() => act("Event confirmed", () => rawCall("POST", `/admin/sms/risk-events/${r.id}/review`, { decision: "confirmed" }), loadFraud)}>Confirm</button><button className={btnGhost} onClick={() => act("Event dismissed", () => rawCall("POST", `/admin/sms/risk-events/${r.id}/review`, { decision: "dismissed" }), loadFraud)}>Dismiss</button></span> : null}</td></tr>
              ))}</tbody></table>
          </div>
          <div className={card + " space-y-3"}>
            <h3 className="font-semibold">Consent lookup</h3>
            <p className="text-xs text-slate-500">Look up a recipient's consent and opt-out history. The number is sent in a request body (never a URL) and only the last four digits are shown. STOP always wins; staff cannot override an opt-out.</p>
            <div className="flex gap-2">
              <input className={input} placeholder="+14155550123" value={consentPhone} onChange={(e) => setConsentPhone(e.target.value)} autoComplete="off" />
              <button className={btnPrimary} disabled={!consentPhone.trim()} onClick={() => guard(async () => setConsentView(await rawCall("POST", "/admin/sms/consent/lookup", { phone: consentPhone.trim() })))}>Look up</button>
            </div>
            {consentView && (
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">Current state</p>
                {consentView.current.length === 0 ? <p className="text-slate-500">No consent records.</p> : <ul>{consentView.current.map((c) => <li key={c.purpose} className="flex justify-between"><span className="font-mono text-xs">{c.purpose}</span><span><Badge value={c.status === "granted" ? "delivered" : "failed"} /> {c.source}{c.policyVersion ? ` · policy ${c.policyVersion}` : ""}</span></li>)}</ul>}
                <p className="text-slate-400">History (newest first)</p>
                <ul className="space-y-0.5">{consentView.events.map((e) => <li key={e.id} className="flex justify-between text-xs"><span>{new Date(e.createdAt).toLocaleString()} · •••{e.recipientLast4}</span><span><b>{e.action}</b> {e.purpose === "*" ? "(all)" : e.purpose} · {e.source}</span></li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Compliance ---------- */}
      {tab === "compliance" && (
        <div className="space-y-3">
          <div className={card + " text-sm text-slate-300"}>
            <p>US messaging needs approved carrier registration: <b>A2P 10DLC</b> (brand + campaign) for local numbers and Messaging Services, or <b>toll-free verification</b> for toll-free numbers. Record what Twilio/the carriers report; approval requires an evidence reference. A sender without every required approval cannot send (enforced in production).</p>
          </div>
          {admin && (
            <div className={card + " grid gap-2 md:grid-cols-3"}>
              <select className={input} value={regForm.accountId} onChange={(e) => setRegForm({ ...regForm, accountId: e.target.value })}><option value="">Provider account…</option>{(accounts ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select className={input} value={regForm.type} onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}><option value="A2P_10DLC_BRAND">A2P 10DLC - brand</option><option value="A2P_10DLC_CAMPAIGN">A2P 10DLC - campaign</option><option value="TOLLFREE_VERIFICATION">Toll-free verification</option></select>
              <input className={input} placeholder="Brand ID (optional)" value={regForm.brandId} onChange={(e) => setRegForm({ ...regForm, brandId: e.target.value })} />
              <input className={input} placeholder="Campaign ID (optional)" value={regForm.campaignId} onChange={(e) => setRegForm({ ...regForm, campaignId: e.target.value })} />
              <input className={input} type="date" title="Expiry (optional)" value={regForm.expiresAt} onChange={(e) => setRegForm({ ...regForm, expiresAt: e.target.value })} />
              <button className={btnPrimary} disabled={!regForm.accountId} onClick={() => act("Registration recorded", () => manage("POST", "/admin/sms/compliance", clean({ ...regForm, expiresAt: regForm.expiresAt ? new Date(regForm.expiresAt).toISOString() : "" })), loadCompliance)}>Record registration (pending)</button>
            </div>
          )}
          <div className={card + " overflow-x-auto p-0"}>
            <table className="w-full text-xs"><thead className="text-left text-slate-400"><tr><th className="p-2">Type</th><th>Account</th><th>Status</th><th>Identifiers</th><th>Evidence</th><th>Expires</th>{admin && <th>Update</th>}</tr></thead>
              <tbody>{regs.length === 0 ? <tr><td colSpan={admin ? 7 : 6} className="p-4 text-slate-400">No registrations recorded.</td></tr> : regs.map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top"><td className="p-2 font-mono text-xs">{r.type}</td><td>{(accounts ?? []).find((a) => a.id === r.accountId)?.name ?? r.accountId.slice(0, 8)}{r.senderId ? " (one sender)" : ""}</td><td><Badge value={r.status === "approved" ? "active" : r.status === "pending" ? "pending" : r.status === "rejected" || r.status === "suspended" ? "failed" : "revoked"} /> {r.status}</td><td className="text-xs text-slate-400">{[r.brandId && `brand ${r.brandId}`, r.campaignId && `campaign ${r.campaignId}`].filter(Boolean).join(" · ")}</td><td className="max-w-[220px] truncate text-xs text-slate-400" title={r.evidenceNote ?? ""}>{r.evidenceNote ?? ""}</td><td className="text-xs">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : ""}</td>
                  {admin && <td className="whitespace-nowrap pr-3"><span className="flex flex-wrap gap-1">
                    {r.status === "pending" && <><button className={btnPrimary} onClick={() => { setEvidenceText(""); setEvidence({ reg: r, to: "approved" }); }}>Approve…</button><button className={btnDanger} onClick={() => act("Marked rejected", () => manage("POST", `/admin/sms/compliance/${r.id}/status`, { status: "rejected", evidenceNote: "rejected by provider" }), loadCompliance)}>Rejected</button></>}
                    {r.status === "approved" && <><button className={btnGhost} onClick={() => act("Marked suspended", () => manage("POST", `/admin/sms/compliance/${r.id}/status`, { status: "suspended" }), loadCompliance)}>Suspended</button></>}
                    {r.status === "suspended" && <button className={btnPrimary} onClick={() => { setEvidenceText(""); setEvidence({ reg: r, to: "approved" }); }}>Reinstate…</button>}
                    {(r.status === "rejected" || r.status === "expired") && <button className={btnGhost} onClick={() => act("Resubmitted", () => manage("POST", `/admin/sms/compliance/${r.id}/status`, { status: "pending" }), loadCompliance)}>Resubmit</button>}
                  </span></td>}
                </tr>
              ))}</tbody></table>
          </div>
        </div>
      )}

      {/* ---------- Dialogs ---------- */}
      {showRegister && (
        <Modal title="Register Twilio account" onClose={() => setShowRegister(false)}>
          <p className="text-xs text-slate-400">Credentials are checked against Twilio, then stored encrypted. They can't be viewed again.</p>
          <input className={input} placeholder="Name (e.g. DateBuk production)" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
          <input className={input} placeholder="Account SID (AC…)" value={reg.accountSid} onChange={(e) => setReg({ ...reg, accountSid: e.target.value })} autoComplete="off" />
          <input className={input} type="password" placeholder="Auth Token (needed to verify webhooks)" value={reg.authToken} onChange={(e) => setReg({ ...reg, authToken: e.target.value })} autoComplete="off" />
          <p className="text-xs text-slate-500">Optional - send with an API Key instead of the Auth Token:</p>
          <input className={input} placeholder="API Key SID (SK…)" value={reg.apiKeySid} onChange={(e) => setReg({ ...reg, apiKeySid: e.target.value })} autoComplete="off" />
          <input className={input} type="password" placeholder="API Key secret" value={reg.apiKeySecret} onChange={(e) => setReg({ ...reg, apiKeySecret: e.target.value })} autoComplete="off" />
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowRegister(false)}>Cancel</button>
            <button className={btnPrimary} disabled={!reg.name || !reg.accountSid} onClick={() => act("Account registered", () => manage("POST", "/admin/sms/accounts", clean(reg)), async () => { setShowRegister(false); setReg({ name: "", accountSid: "", authToken: "", apiKeySid: "", apiKeySecret: "" }); await loadAccounts(); })}>Validate &amp; register</button>
          </div>
        </Modal>
      )}
      {rotateFor && (
        <Modal title={`Rotate credentials - ${rotateFor.name}`} onClose={() => setRotateFor(null)}>
          <p className="text-xs text-slate-400">The replacement is validated with Twilio first. If it fails, nothing changes. Rotation never activates an account by itself.</p>
          <input className={input} type="password" placeholder="New Auth Token" value={rot.authToken} onChange={(e) => setRot({ ...rot, authToken: e.target.value })} autoComplete="off" />
          <input className={input} placeholder="New API Key SID (SK…)" value={rot.apiKeySid} onChange={(e) => setRot({ ...rot, apiKeySid: e.target.value })} autoComplete="off" />
          <input className={input} type="password" placeholder="New API Key secret" value={rot.apiKeySecret} onChange={(e) => setRot({ ...rot, apiKeySecret: e.target.value })} autoComplete="off" />
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setRotateFor(null)}>Cancel</button>
            <button className={btnPrimary} disabled={!rot.authToken && !(rot.apiKeySid && rot.apiKeySecret)} onClick={() => act("Credentials rotated", () => manage("POST", `/admin/sms/accounts/${rotateFor.id}/rotate`, clean(rot)), async () => { setRotateFor(null); await loadAccounts(); })}>Validate &amp; rotate</button>
          </div>
        </Modal>
      )}
      {spendFor && (
        <Modal title={`Spending & destinations - ${spendFor.name}`} onClose={() => setSpendFor(null)}>
          <label className="text-xs text-slate-400">Daily segment limit (blank = no cap)</label>
          <input className={input} inputMode="numeric" value={spend.daily} onChange={(e) => setSpend({ ...spend, daily: e.target.value })} />
          <label className="text-xs text-slate-400">Monthly segment limit (blank = no cap)</label>
          <input className={input} inputMode="numeric" value={spend.monthly} onChange={(e) => setSpend({ ...spend, monthly: e.target.value })} />
          <label className="text-xs text-slate-400">Allowed destination prefixes (comma separated, e.g. +1, +44)</label>
          <input className={input} value={spend.prefixes} onChange={(e) => setSpend({ ...spend, prefixes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setSpendFor(null)}>Cancel</button>
            <button className={btnPrimary} onClick={() => act("Spending controls saved", () => manage("POST", `/admin/sms/accounts/${spendFor.id}/spending`, {
              dailySegmentLimit: spend.daily.trim() === "" ? null : Number(spend.daily),
              monthlySegmentLimit: spend.monthly.trim() === "" ? null : Number(spend.monthly),
              allowedPrefixes: spend.prefixes.split(",").map((p) => p.trim()).filter(Boolean),
            }), async () => { setSpendFor(null); await loadAccounts(); })}>Save</button>
          </div>
        </Modal>
      )}
      {senderFor && (
        <Modal title={`Add sender - ${senderFor.name}`} onClose={() => setSenderFor(null)}>
          <div className="flex gap-2">
            <button className={`${btn} ${snd.kind === "number" ? "bg-white/15" : "text-slate-400"}`} onClick={() => setSnd({ kind: "number", value: "" })}>Phone number</button>
            <button className={`${btn} ${snd.kind === "service" ? "bg-white/15" : "text-slate-400"}`} onClick={() => setSnd({ kind: "service", value: "" })}>Messaging Service</button>
          </div>
          <input className={input} placeholder={snd.kind === "number" ? "+14155550123" : "MG…"} value={snd.value} onChange={(e) => setSnd({ ...snd, value: e.target.value })} />
          <p className="text-xs text-slate-500">Twilio confirms the account owns it. This dashboard never buys numbers.</p>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setSenderFor(null)}>Cancel</button>
            <button className={btnPrimary} disabled={!snd.value.trim()} onClick={() => act("Sender added", () => manage("POST", "/admin/sms/senders", { accountId: senderFor.id, ...(snd.kind === "number" ? { number: snd.value.trim() } : { messagingServiceSid: snd.value.trim() }) }), async () => { setSenderFor(null); await loadAccounts(); })}>Verify &amp; add</button>
          </div>
        </Modal>
      )}
      {evidence && (
        <Modal title={`Record approval - ${evidence.reg.type}`} onClose={() => setEvidence(null)}>
          <p className="text-xs text-slate-400">Enter the reference to the real approval (Twilio console ticket/SID and date, or the carrier notice). This is kept in the audit trail; nothing is approved without it.</p>
          <textarea className={input} rows={3} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="e.g. Twilio brand registration BN… approved 2026-11-20, ticket #12345" />
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setEvidence(null)}>Cancel</button>
            <button className={btnPrimary} disabled={evidenceText.trim().length < 5} onClick={() => act("Approval recorded", () => manage("POST", `/admin/sms/compliance/${evidence.reg.id}/status`, { status: evidence.to, evidenceNote: evidenceText.trim() }), async () => { setEvidence(null); await loadCompliance(); })}>Record approval</button>
          </div>
        </Modal>
      )}
      {stepPrompt && (
        <Modal title="Confirm it's you" onClose={cancelStepUp}>
          <p className="text-sm text-slate-300">Enter the 6-digit code from your authenticator app to continue. This confirmation lasts 5 minutes.</p>
          <input className={input + " text-center text-lg tracking-widest"} inputMode="numeric" maxLength={6} autoFocus placeholder="123456" value={stepCode} onChange={(e) => setStepCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && stepCode.length === 6 && submitStepUp()} />
          {stepErr && <p className="text-sm text-red-300">{stepErr}</p>}
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={cancelStepUp}>Cancel</button>
            <button className={btnPrimary} disabled={stepCode.length !== 6} onClick={submitStepUp}>Confirm</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const clean = <T extends Record<string, string>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v.trim() !== "")) as Partial<T>;

function Stat({ label, value, warn, hint }: { label: string; value: number | string; warn?: boolean; hint?: string }) {
  return (
    <div className={`${card} ${warn ? "border-amber-500/50" : ""}`} title={hint}>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-xl font-bold leading-tight ${warn ? "text-amber-300" : ""}`}>{value}</p>
    </div>
  );
}

function Flag({ label, on, neutralWhenOff }: { label: string; on: boolean; neutralWhenOff?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
      <span className="text-slate-300">{label}</span>
      <span className={on ? "text-emerald-300" : neutralWhenOff ? "text-slate-400" : "text-amber-300"}>{on ? "on" : "off"}</span>
    </div>
  );
}

function Copy({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-black/30 px-2 py-1 text-xs">{value ?? "Set SMS_WEBHOOK_BASE_URL"}</code>
        {value && <button className={btnGhost} onClick={() => navigator.clipboard?.writeText(value)}>Copy</button>}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="w-full max-w-md space-y-2.5 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}
