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
type Tab = "overview" | "accounts" | "messages" | "audit" | "webhooks";

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

const card = "rounded-xl border border-white/10 bg-white/5 p-4";
const input = "w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none";
const btn = "rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40";
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

  useEffect(() => {
    if (!accessToken) return;
    if (tab === "overview") void loadAnalytics();
    if (tab === "accounts") void loadAccounts();
    if (tab === "messages") void loadMessages(false);
    if (tab === "audit") void loadAudit();
    if (tab === "webhooks") void loadWebhooks();
  }, [accessToken, tab, loadAnalytics, loadAccounts, loadMessages, loadAudit, loadWebhooks]);

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
      { id: "accounts", label: "Provider accounts" },
      { id: "messages", label: "Message history" },
      { id: "audit", label: "Audit" },
      { id: "webhooks", label: "Webhooks" },
    ],
    [],
  );

  const admin = mode === "admin";

  return (
    <div className="space-y-5 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">{admin ? "Communications Center" : "Communications Operations"}</h1>
        <p className="text-sm text-slate-400">
          {admin
            ? "Twilio provider accounts, senders, spending controls, delivery and audit. Changes require MFA confirmation."
            : "Read-only view of SMS delivery, history and audit. Provider administration is superadmin-only."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
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
        <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Messages" value={analytics.total} />
                <Stat label="Segments billed" value={analytics.segments} />
                <Stat label="Delivery rate" value={analytics.deliveryRate == null ? "-" : `${analytics.deliveryRate}%`} />
                <Stat label="Needs reconciliation" value={analytics.needsReconciliation} warn={analytics.needsReconciliation > 0} hint="Outcome unknown. Never auto-retried; check with Twilio before resending." />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className={card}>
                  <h3 className="mb-2 font-semibold">By delivery state</h3>
                  {Object.keys(analytics.byState).length === 0 ? <p className="text-sm text-slate-400">No messages in this period.</p> : (
                    <ul className="space-y-1 text-sm">
                      {Object.entries(analytics.byState).map(([s, n]) => (
                        <li key={s} className="flex items-center justify-between"><Badge value={s} /><span>{n}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={card}>
                  <h3 className="mb-2 font-semibold">Per day</h3>
                  {analytics.perDay.length === 0 ? <p className="text-sm text-slate-400">No data.</p> : (
                    <table className="w-full text-sm"><thead className="text-left text-slate-400"><tr><th>Day</th><th>Messages</th><th>Segments</th></tr></thead>
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
        <div className="space-y-4">
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

              <div className="mt-3 space-y-1 text-sm">
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
                <div className="mt-3 flex flex-wrap gap-2">
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
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400"><tr><th className="p-3">Time</th><th>Purpose</th><th>To</th><th>State</th><th>Segments</th></tr></thead>
              <tbody>
                {messages.length === 0 ? <tr><td colSpan={5} className="p-4 text-slate-400">No messages.</td></tr> : messages.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="p-3 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td><td>{m.purpose}</td><td className="font-mono">•••{m.recipientLast4}</td><td><Badge value={m.state} /></td><td>{m.segments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextBefore && <button className={btnGhost} onClick={() => loadMessages(true, nextBefore)}>Load more</button>}
          <p className="text-xs text-slate-500">Only the last four digits of a number are stored. Message bodies are never stored.</p>
        </div>
      )}

      {/* ---------- Audit ---------- */}
      {tab === "audit" && (
        <div className={card + " overflow-x-auto p-0"}>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400"><tr><th className="p-3">Time</th><th>Action</th><th>Actor</th><th>Details</th></tr></thead>
            <tbody>
              {audit.length === 0 ? <tr><td colSpan={4} className="p-4 text-slate-400">No audit records.</td></tr> : audit.map((a) => (
                <tr key={a.id} className="border-t border-white/5 align-top">
                  <td className="p-3 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
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
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-amber-300" : ""}`}>{value}</p>
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
      <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}
