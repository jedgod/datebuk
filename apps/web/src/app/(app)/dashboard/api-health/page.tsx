"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

export default function DashboardApiHealthPage() {
  const { accessToken, refresh } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = accessToken ?? (await refresh());
        if (!token) return;
        const data = await api.get("/users/me", token);
        setMe(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, [accessToken, refresh]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
        <div className="font-bold">API Health</div>
        <div className="mt-1 text-sm text-black/70">
          This page calls <code className="px-1 py-0.5 bg-black/5 rounded">GET /users/me</code>.
        </div>
        <pre className="mt-4 overflow-auto rounded-2xl bg-black text-white p-4 text-xs">{JSON.stringify(me, null, 2)}</pre>
      </div>
    </div>
  );
}
