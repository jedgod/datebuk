"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Home,
  MapPin,
  Megaphone,
  MessageSquareText,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QueueMode = "live" | "predate" | "monitoring";
type QueueFilter = "all" | "high" | "live";

type QueueItem = {
  id: string;
  user: string;
  type: string;
  risk: number;
  feature: string;
  assigned: string;
  status: string;
  age: string;
};

type ModeratorStats = {
  name: string;
  initials: string;
  score: number;
  load: number;
  status: "online" | "busy" | "offline";
};

const queueItems: QueueItem[] = [
  { id: "q1", user: "Enmal23", type: "Live video", risk: 92, feature: "Live room", assigned: "Ilonize Pration", status: "Needs review", age: "2m" },
  { id: "q2", user: "Mark87", type: "Predate check", risk: 78, feature: "Date planner", assigned: "Sorced Ermisen", status: "Screening", age: "5m" },
  { id: "q3", user: "LunaFun", type: "Chat excerpt", risk: 64, feature: "Icebreaker", assigned: "Mario Coniat", status: "Queued", age: "8m" },
  { id: "q4", user: "JasonM", type: "Location alert", risk: 85, feature: "Location share", assigned: "Flog", status: "Needs review", age: "8m" },
  { id: "q5", user: "FaithfulGuy", type: "Safety block", risk: 88, feature: "Safety controls", assigned: "Unassigned", status: "New", age: "10m" },
];

const moderators: ModeratorStats[] = [
  { name: "Ilonize Pration", initials: "IP", score: 91, load: 8, status: "online" },
  { name: "Sorced Ermisen", initials: "SE", score: 91, load: 6, status: "online" },
  { name: "Flog", initials: "F", score: 75, load: 10, status: "busy" },
  { name: "Mario Coniat", initials: "MC", score: 89, load: 5, status: "online" },
  { name: "Uenare Gode", initials: "UG", score: 68, load: 3, status: "offline" },
];

const userFeatureSignals = [
  { label: "Date Planner Requests", value: 42, icon: CalendarClock, tone: "text-sky-300", note: "Premium and Elite scheduling activity" },
  { label: "Icebreaker Messages", value: 318, icon: MessageSquareText, tone: "text-violet-300", note: "AI prompts requiring safety sampling" },
  { label: "Location Sharing", value: 19, icon: MapPin, tone: "text-emerald-300", note: "Approximate and live-date location checks" },
  { label: "Safety Blocks", value: 27, icon: Shield, tone: "text-rose-300", note: "Blocked communication and privacy changes" },
];

export function ActiveVideoReviewQueue() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>(queueItems);
  const [moderatorList, setModeratorList] = useState<ModeratorStats[]>(moderators);
  const [signals, setSignals] = useState(userFeatureSignals);
  const [mode, setMode] = useState<QueueMode>("live");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(queueItems[0].id);
  const [showModerators, setShowModerators] = useState(true);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [notice, setNotice] = useState("Live review queue is monitoring user video-date tools.");

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const response = await fetch("/api/admin/video-date/queue", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load queue");
        }

        const data = await response.json();
        setQueue(data.queueItems ?? []);
        setModeratorList(data.moderators ?? []);
        setSignals(data.userFeatureSignals ?? userFeatureSignals);
      } catch (error) {
        console.error("Failed to load video review queue:", error);
        setNotice("Using fallback queue data. Backend queue is temporarily unavailable.");
      } finally {
        setIsLoadingQueue(false);
      }
    };

    loadQueue();
  }, []);

  useEffect(() => {
    if (!queue.length) return;
    if (!selected || !queue.some((item) => item.id === selected)) {
      setSelected(queue[0].id);
    }
  }, [queue, selected]);

  const visibleQueue = useMemo(() => {
    return queue
      .filter((item) => (mode === "predate" ? item.type === "Predate check" : true))
      .filter((item) => (mode === "monitoring" ? item.feature !== "Live room" : true))
      .filter((item) => (filter === "high" ? item.risk >= 85 : filter === "live" ? item.type === "Live video" : true))
      .filter((item) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [item.user, item.type, item.feature, item.assigned, item.status].some((value) =>
          value.toLowerCase().includes(query)
        );
      });
  }, [filter, mode, search]);

  const selectedItem = queue.find((item) => item.id === selected) ?? visibleQueue[0] ?? null;

  const assignModerator = async (name: string) => {
    if (!selectedItem) {
      setNotice("Select a queue item before assigning staff.");
      return;
    }

    try {
      const response = await fetch("/api/admin/video-date/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          itemId: selectedItem.id,
          moderatorName: name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign moderator");
      }

      const data = await response.json();
      setQueue(data.queueItems ?? queue);
      setNotice(data.message ?? `${name} assigned to ${selectedItem.user}.`);
    } catch (error) {
      console.error("Failed to assign moderator:", error);
      setNotice("Failed to assign moderator. Please try again.");
    }
  };

  const reviewSelected = async (decision: "approved" | "escalated" | "restricted") => {
    if (!selectedItem) {
      setNotice("No queue item matches the current filters.");
      return;
    }

    try {
      const response = await fetch("/api/admin/video-date/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decision",
          itemId: selectedItem.id,
          decision,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply review decision");
      }

      const data = await response.json();
      setQueue(data.queueItems ?? queue);
      setNotice(data.message ?? `${selectedItem.user} marked as ${decision}.`);
    } catch (error) {
      console.error("Failed to apply review decision:", error);
      setNotice("Failed to update queue item. Please try again.");
    }
  };

  return (
    <div className="grid min-h-[680px] gap-4 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
      <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl shadow-slate-950/30">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-base font-bold text-white">Video Date</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-300">Admin monitoring</p>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filter === "high"}
              onChange={() => setFilter(filter === "high" ? "all" : "high")}
              className="rounded border-slate-600 accent-amber-500"
            />
            High severity only
          </label>
        </div>

        <div className="mt-5 space-y-2 border-t border-slate-800 pt-5">
          {[
            { label: "Dashboard", icon: Home, action: () => router.push("/admin/dashboard"), active: false },
            { label: "Staff Monitor", icon: Users, action: () => setMode("monitoring"), active: mode === "monitoring" },
            { label: "Policy Settings", icon: Settings, action: () => setNotice("Use the tabs above to edit policy settings."), active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  item.active ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staff watch list</div>
          <div className="mt-3 space-y-3">
            {signals.slice(0, 3).map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="flex items-center gap-3">
                  <Icon size={17} className={signal.tone} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-200">{signal.label}</div>
                    <div className="text-xs text-slate-500">{signal.value} events today</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-slate-950/30">
        <div className="border-b border-slate-800 bg-slate-950/60 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white">Active Video Review Queue</h2>
              <p className="mt-1 text-sm text-slate-400">Monitor live rooms, predate checks, safety blocks, and location sharing.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("predate");
                  setNotice("Predate screening queue opened.");
                }}
                className={cn("rounded-lg px-4 py-2 text-sm font-semibold", mode === "predate" ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-white hover:bg-slate-700")}
              >
                Predate
              </button>
              <button
                onClick={() => router.push("/admin/push")}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Megaphone size={16} />
                Send Broadcast
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-800 bg-slate-900 px-5 py-4 md:grid-cols-4">
          {[
            ["Pending Reviews", visibleQueue.length.toString(), "text-white"],
            ["High Risk", visibleQueue.filter((item) => item.risk >= 85).length.toString(), "text-red-300"],
            ["Avg Handle Time", "6.5m", "text-sky-300"],
            ["AI Agreement", "85%", "text-emerald-300"],
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className={cn("mt-1 text-2xl font-bold", tone)}>{value}</div>
            </div>
          ))}
        </div>

        <div className="border-b border-slate-800 bg-slate-950/40 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, feature, moderator..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            {[
              ["all", "All"],
              ["high", "High Risk"],
              ["live", "Live"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as QueueFilter)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  filter === value ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="space-y-3">
            {visibleQueue.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={cn(
                  "grid w-full gap-3 rounded-xl border p-4 text-left transition-colors md:grid-cols-[minmax(150px,1.5fr)_70px_minmax(100px,1fr)_minmax(100px,1fr)_45px]",
                  selectedItem?.id === item.id ? "border-amber-500 bg-amber-500/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{item.user}</div>
                  <div className="truncate text-sm text-slate-400">{item.type} | {item.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Risk</div>
                  <div className={cn("font-bold", item.risk >= 85 ? "text-red-300" : item.risk >= 75 ? "text-amber-300" : "text-emerald-300")}>{item.risk}%</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Feature</div>
                  <div className="truncate text-sm text-slate-200">{item.feature}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Assigned</div>
                  <div className="truncate text-sm text-slate-200">{item.assigned}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Age</div>
                  <div className="text-sm text-slate-300">{item.age}</div>
                </div>
              </button>
            ))}

            {visibleQueue.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
                No queue items match the current filters.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <AlertTriangle size={18} className="text-amber-300" />
              Review Actions
            </h3>
            <p className="mt-2 text-sm text-slate-400">{selectedItem ? `${selectedItem.user} is selected for review.` : "No queue item selected."}</p>
            <div className="mt-5 space-y-2">
              <button onClick={() => reviewSelected("approved")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500">
                <CheckCircle2 size={17} />
                Approve
              </button>
              <button onClick={() => reviewSelected("escalated")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 font-semibold text-slate-950 hover:bg-amber-400">
                <Bell size={17} />
                Escalate
              </button>
              <button onClick={() => reviewSelected("restricted")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-500">
                <Shield size={17} />
                Restrict User Tool
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">{notice}</div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950/40 p-5">
          <h3 className="font-bold text-white">User Feature Monitoring</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {signals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <Icon size={19} className={signal.tone} />
                    <span className="text-xl font-bold text-white">{signal.value}</span>
                  </div>
                  <div className="mt-3 font-semibold text-slate-100">{signal.label}</div>
                  <p className="mt-1 text-xs text-slate-500">{signal.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-slate-950/30">
        <button
          onClick={() => setShowModerators((value) => !value)}
          className="flex w-full items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-4"
        >
          <span className="font-bold text-white">Moderator</span>
          <ChevronDown size={16} className={cn("text-slate-400 transition-transform", showModerators && "rotate-180")} />
        </button>

        {showModerators && (
          <div className="space-y-3 p-4">
            {moderatorList.map((mod, idx) => (
              <button
                key={mod.name}
                onClick={() => assignModerator(mod.name)}
                className="flex w-full items-center gap-3 rounded-lg bg-slate-800 p-3 text-left transition-colors hover:bg-slate-700"
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                  idx === 0 ? "bg-gradient-to-br from-purple-400 to-pink-500" :
                  idx === 1 ? "bg-gradient-to-br from-blue-400 to-cyan-500" :
                  idx === 2 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                  "bg-gradient-to-br from-emerald-400 to-teal-500"
                )}>
                  {mod.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{mod.name}</div>
                  <div className="text-xs text-slate-500">{mod.status} | {mod.load} assigned</div>
                </div>
                <div className={cn("text-base font-bold", mod.score >= 85 ? "text-emerald-300" : mod.score >= 70 ? "text-amber-300" : "text-slate-400")}>{mod.score}%</div>
              </button>
            ))}
          </div>
        )}
        {isLoadingQueue ? (
          <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">Loading queue from backend...</p>
        ) : null}
      </aside>
    </div>
  );
}
