"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
  const { accessToken, refresh } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const current = queue[idx];

  async function load() {
    try {
      const token = accessToken ?? (await refresh());
      if (!token) return;
      const data = await api.get<any[]>("/api/swipes/recommendations?limit=20", token);
      setQueue(data);
      setIdx(0);
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    }
  }

  useEffect(() => { load(); }, []);

  async function swipe(action: "like" | "pass") {
    try {
      const token = accessToken ?? (await refresh());
      if (!token || !current) return;
      const res = await api.post<any>("/api/swipes", { toId: current.id, action }, token);
      setIdx((i) => i + 1);
      if (res?.matched) alert("It's a match! ✅");
      if (idx + 1 >= queue.length) load();
    } catch (e) {
      console.error("Failed to swipe:", e);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Discover</h1>

      {!current ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
          No more profiles in your queue. <button className="underline font-semibold" onClick={load}>Refresh</button>
        </div>
      ) : (
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
          <div className="text-sm text-black/60">Swipe queue {idx + 1} / {queue.length}</div>
          <div className="mt-3 text-2xl font-extrabold">{current.profile?.displayName ?? "User"}</div>
          <div className="mt-1 text-sm text-black/70">{current.profile?.age ?? ""} • {current.profile?.gender ?? ""}</div>
          <div className="mt-3 text-sm text-black/70">{current.profile?.bio ?? "No bio yet."}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(current.profile?.interests ?? []).map((x: string) => (
              <span key={x} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 border border-black/10">{x}</span>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => swipe("pass")}>Pass</Button>
            <Button onClick={() => swipe("like")}>Like</Button>
          </div>
        </div>
      )}
    </div>
  );
}
