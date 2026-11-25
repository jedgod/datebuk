"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

interface FeatureRow {
  id: string;
  tierName: string;
  featureName: string;
  isEnabled: boolean;
  displayOrder: number;
  featureValue?: string | null;
}

export default function SubscriptionFeaturesAdminPage() {
  const { accessToken, refresh } = useAuth();
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const featureGroups = useMemo(() => {
    const grouped = new Map<string, FeatureRow[]>();
    rows.forEach((row) => {
      const list = grouped.get(row.featureName) ?? [];
      list.push(row);
      grouped.set(row.featureName, list);
    });

    return Array.from(grouped.entries()).map(([featureName, list]) => {
      const byTier = new Map(list.map((item) => [item.tierName, item]));
      return {
        featureName,
        displayOrder: Math.min(...list.map((item) => item.displayOrder ?? 0)),
        tiers: {
          FREE: byTier.get("FREE"),
          PREMIUM: byTier.get("PREMIUM"),
          ELITE: byTier.get("ELITE"),
        },
      };
    });
  }, [rows]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = accessToken ?? (await refresh());
        if (!token) {
          setStatus("Not authenticated.");
          return;
        }
        const data = await api.get<FeatureRow[]>("/admin/subscription-features", token);
        setRows(data ?? []);
        setStatus("");
      } catch (error: any) {
        setStatus(error?.message ?? "Failed to load features.");
      }
    };

    load();
  }, [accessToken, refresh]);

  const updateFeature = (featureName: string, tierName: string, enabled: boolean) => {
    setRows((prev) =>
      prev.map((row) =>
        row.featureName === featureName && row.tierName === tierName
          ? { ...row, isEnabled: enabled }
          : row
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("");
    try {
      const token = accessToken ?? (await refresh());
      if (!token) {
        setStatus("Not authenticated.");
        return;
      }

      await api.post(
        "/admin/subscription-features",
        {
          features: rows.map((row) => ({
            tierName: row.tierName,
            featureName: row.featureName,
            isEnabled: row.isEnabled,
            displayOrder: row.displayOrder,
            featureValue: row.featureValue ?? null,
          })),
        },
        token
      );
      setStatus("Saved successfully.");
    } catch (error: any) {
      setStatus(error?.message ?? "Failed to save features.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Subscription Feature Flags</h1>
          <p className="text-slate-400">
            Toggle feature availability per plan. Changes apply immediately to subscription UI.
          </p>
        </div>

        <Card className="border border-slate-700 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Plan Entitlements</CardTitle>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-wide text-slate-400">
              <div className="col-span-5">Feature</div>
              <div className="col-span-2 text-center">FREE</div>
              <div className="col-span-2 text-center">PREMIUM</div>
              <div className="col-span-3 text-center">ELITE</div>
            </div>

            {featureGroups
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((group) => (
                <div
                  key={group.featureName}
                  className="grid grid-cols-12 items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                >
                  <div className="col-span-5 text-white font-medium">
                    {group.featureName}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={group.tiers.FREE?.isEnabled ?? false}
                      onCheckedChange={(value) => updateFeature(group.featureName, "FREE", value)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={group.tiers.PREMIUM?.isEnabled ?? false}
                      onCheckedChange={(value) => updateFeature(group.featureName, "PREMIUM", value)}
                    />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <Switch
                      checked={group.tiers.ELITE?.isEnabled ?? false}
                      onCheckedChange={(value) => updateFeature(group.featureName, "ELITE", value)}
                    />
                  </div>
                </div>
              ))}

            {status ? (
              <div className="text-sm text-amber-300">{status}</div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
