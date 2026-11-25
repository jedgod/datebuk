"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/textfield";
import { staffVideoMonitorApi } from "@/lib/staff-video-monitor-api";

type Item = { key: string; size: number; lastModified: string | null };
type Meta = { ok: true; contentType: string | null; contentLength: number | null; metadata: Record<string,string>; lastModified: string | null };
type Preview = { ok: boolean; url?: string; reason?: string | null };

export default function StaffVideoMonitorQuarantinePage() {
  const [prefix, setPrefix] = useState("quarantine/");
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  async function load() {
    try {
      const data = await staffVideoMonitorApi.get<{ items: Item[] }>(`/quarantine?prefix=${encodeURIComponent(prefix)}`);
      setItems(data.items ?? []);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to load quarantine");
    }
  }

  async function openDetails(key: string) {
    try {
      setOpenKey(key);
      const m = await staffVideoMonitorApi.get<Meta>(`/quarantine/meta?key=${encodeURIComponent(key)}`);
      setMeta(m);
      const p = await staffVideoMonitorApi.get<Preview>(`/quarantine/preview?key=${encodeURIComponent(key)}`);
      setPreview(p);
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to load metadata/preview");
    }
  }

  async function release(key: string) {
    try {
      setBusyKey(key);
      await staffVideoMonitorApi.post("/quarantine/release", { key });
      await load();
      setStatus("Released ✅");
      if (openKey === key) { setOpenKey(null); setMeta(null); setPreview(null); }
    } catch (e: any) {
      setStatus(e?.message ?? "Release failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function del(key: string) {
    try {
      setBusyKey(key);
      await staffVideoMonitorApi.post("/quarantine/delete", { key });
      await load();
      setStatus("Deleted ✅");
      if (openKey === key) { setOpenKey(null); setMeta(null); setPreview(null); }
    } catch (e: any) {
      setStatus(e?.message ?? "Delete failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Staff • Video Monitor — Quarantine</h1>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft space-y-3">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <TextField label="Prefix" value={prefix} onChange={(e)=>setPrefix(e.target.value)} />
          <Button onClick={load}>Load</Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-4">
          <div className="overflow-auto rounded-2xl border border-black/10">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left px-3 py-2">Key</th>
                  <th className="text-left px-3 py-2">Size</th>
                  <th className="text-left px-3 py-2">Last modified</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.key} className={"border-t border-black/5 " + (openKey === it.key ? "bg-emerald-50" : "")}>
                    <td className="px-3 py-2 font-mono text-xs">
                      <button className="underline underline-offset-2" onClick={() => openDetails(it.key)}>{it.key}</button>
                    </td>
                    <td className="px-3 py-2">{it.size}</td>
                    <td className="px-3 py-2">{it.lastModified ? new Date(it.lastModified).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" disabled={busyKey === it.key} onClick={() => release(it.key)}>{busyKey===it.key?"Working…":"Release"}</Button>
                        <Button variant="secondary" disabled={busyKey === it.key} onClick={() => del(it.key)}>{busyKey===it.key?"Working…":"Delete"}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-black/60">No quarantined objects loaded yet.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-black/10 p-4 space-y-3">
            <div className="font-semibold">Details</div>
            {!openKey ? (
              <div className="text-sm text-black/60">Click a key to view metadata and safe preview.</div>
            ) : (
              <>
                <div className="text-xs font-mono break-all">{openKey}</div>
                <div className="text-sm">
                  <div><span className="font-semibold">Reason:</span> {meta?.metadata?.reason ?? "—"}</div>
                  <div><span className="font-semibold">Content-Type:</span> {meta?.contentType ?? "—"}</div>
                  <div><span className="font-semibold">Size:</span> {meta?.contentLength ?? "—"}</div>
                </div>

                <div className="pt-2 border-t border-black/10" />
                <div className="font-semibold text-sm">Safe preview</div>
                {preview?.ok && preview.url ? (
                  <img src={preview.url} alt="Quarantine preview" className="w-full rounded-2xl border border-black/10" />
                ) : (
                  <div className="text-sm text-black/60">{preview?.reason ?? "Preview not available"}</div>
                )}
              </>
            )}
          </div>
        </div>

        {status ? <div className="text-sm text-black/70">{status}</div> : null}
      </div>
    </div>
  );
}
