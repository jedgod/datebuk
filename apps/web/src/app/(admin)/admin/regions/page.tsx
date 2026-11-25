"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, Pencil, Shield, Trash2, X } from "lucide-react";
import { showToast } from "@/lib/toast";

type RegionRule = {
  id: string;
  region: string;
  visibility: "allow" | "limited" | "blocked";
  note?: string;
  createdAt: string;
};

export default function AdminRegionsPage() {
  const [rules, setRules] = useState<RegionRule[]>([]);
  const [region, setRegion] = useState("");
  const [visibility, setVisibility] = useState<"allow" | "limited" | "blocked">("allow");
  const [note, setNote] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/regions", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch region rules");
      }
      setRules(data.rules || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch region rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const createRule = async () => {
    if (!region.trim()) {
      setError("Region is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: region.trim(), visibility, note: note.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to create region rule");
      }

      showToast("Region rule saved successfully", { variant: "success", durationMs: 1500 });
      setRegion("");
      setNote("");
      setVisibility("allow");
      await loadRules();
    } catch (err: any) {
      setError(err?.message || "Failed to create region rule");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (rule: RegionRule) => {
    setEditingRuleId(rule.id);
    setRegion(rule.region);
    setVisibility(rule.visibility);
    setNote(rule.note || "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingRuleId(null);
    setRegion("");
    setVisibility("allow");
    setNote("");
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingRuleId) return;
    if (!region.trim()) {
      setError("Region is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/regions/${encodeURIComponent(editingRuleId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: region.trim(), visibility, note: note.trim() || "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update region rule");
      }

      showToast("Region rule updated", { variant: "success", durationMs: 1500 });
      cancelEdit();
      await loadRules();
    } catch (err: any) {
      setError(err?.message || "Failed to update region rule");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    const confirmed = window.confirm("Delete this region rule?");
    if (!confirmed) return;

    setDeletingRuleId(ruleId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/regions/${encodeURIComponent(ruleId)}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete region rule");
      }

      showToast("Region rule deleted", { variant: "success", durationMs: 1500 });
      if (editingRuleId === ruleId) {
        cancelEdit();
      }
      await loadRules();
    } catch (err: any) {
      setError(err?.message || "Failed to delete region rule");
    } finally {
      setDeletingRuleId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">Admin Regions</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">Manage regional visibility rules for geo matching.</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingRuleId ? "Edit Region Rule" : "Create Region Rule"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Region (e.g. Europe, West Africa, US-East)"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />

            <select
              id="region-visibility"
              title="Region visibility"
              aria-label="Region visibility"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "allow" | "limited" | "blocked")}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="allow">Allow</option>
              <option value="limited">Limited</option>
              <option value="blocked">Blocked</option>
            </select>

            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {editingRuleId ? (
              <>
                <Button onClick={() => void saveEdit()} disabled={saving}>
                  {saving ? "Saving..." : "Update Rule"}
                </Button>
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X size={14} className="mr-1" />
                  Cancel Edit
                </Button>
              </>
            ) : (
              <Button onClick={() => void createRule()} disabled={saving}>
                {saving ? "Saving..." : "Save Rule"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Current Region Rules</h2>
            <Button variant="outline" onClick={() => void loadRules()} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Loading region rules...
              </div>
            ) : rules.length === 0 ? (
              <p className="text-sm text-slate-500">No region rules configured yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Region</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Visibility</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Note</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Created</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="bg-white">
                      <td className="px-3 py-2 text-sm font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          <Globe size={14} className="text-slate-500" />
                          {rule.region}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{rule.visibility}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{rule.note || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{new Date(rule.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => beginEdit(rule)}>
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingRuleId === rule.id}
                            onClick={() => void deleteRule(rule.id)}
                          >
                            {deletingRuleId === rule.id ? (
                              <Loader2 size={14} className="mr-1 animate-spin" />
                            ) : (
                              <Trash2 size={14} className="mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
