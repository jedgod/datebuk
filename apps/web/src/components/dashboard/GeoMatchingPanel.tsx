"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/stores/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type MatchScope = "NEARBY" | "SAME_COUNTRY" | "SAME_CONTINENT" | "GLOBAL";

type GeoPreference = {
  matchScope: MatchScope;
  travelMode?: boolean;
  globalMode?: boolean;
  showCountryOnly?: boolean;
  locationEnabled?: boolean;
};

type ApproxLocation = {
  countryCode: string;
  continent: string;
  city: string | null;
  source: string;
  precision: string;
};

type RankedProfile = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  continent: string;
  regionalScore: number;
  reason: string;
};

const SCOPES: MatchScope[] = ["NEARBY", "SAME_COUNTRY", "SAME_CONTINENT", "GLOBAL"];

// These endpoints are Next.js route handlers on this same origin (apps/web), not the
// external apps/api backend — must use a plain same-origin fetch, not the `api` helper
// (which always resolves against the external API's base URL).
async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export default function GeoMatchingPanel() {
  const { isAuthenticated, accessToken } = useRequireAuth("/dashboard/advanced/nearby-singles");
  const { refresh } = useAuth();

  const [location, setLocation] = useState<ApproxLocation | null>(null);
  const [preference, setPreference] = useState<GeoPreference>({ matchScope: "SAME_CONTINENT" });
  const [matches, setMatches] = useState<RankedProfile[]>([]);
  const [policyRules, setPolicyRules] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenOrRefresh = async () => accessToken ?? (await refresh());

  const topMatches = useMemo(() => matches.slice(0, 8), [matches]);

  const loadAll = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      const [locationData, preferenceData, policyData] = await Promise.all([
        fetchJson<{ location: ApproxLocation }>("/api/geo/detect", token),
        fetchJson<{ success: boolean; preference: GeoPreference }>("/api/geo/preferences", token),
        fetchJson<{ title: string; rules: string[] }>("/api/privacy/location-policy", token),
      ]);

      setLocation(locationData.location);
      setPreference(preferenceData.preference);
      setPolicyRules(policyData.rules || []);

      const regionalData = await fetchJson<{
        viewer: ApproxLocation;
        preference: GeoPreference;
        matches: RankedProfile[];
      }>("/api/matches/regional", token, {
        method: "POST",
        body: JSON.stringify({
          viewerLocation: locationData.location,
          preference: preferenceData.preference,
        }),
      });

      setMatches(regionalData.matches || []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load nearby singles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [isAuthenticated]);

  const savePreference = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      const preferenceData = await fetchJson<{ success: boolean; preference: GeoPreference }>(
        "/api/geo/preferences",
        token,
        { method: "POST", body: JSON.stringify(preference) }
      );

      setPreference(preferenceData.preference);

      const regionalData = await fetchJson<{
        viewer: ApproxLocation;
        preference: GeoPreference;
        matches: RankedProfile[];
      }>("/api/matches/regional", token, {
        method: "POST",
        body: JSON.stringify({
          viewerLocation: location,
          preference: preferenceData.preference,
        }),
      });

      setMatches(regionalData.matches || []);
      showToast("Regional preference saved successfully", { variant: "success", durationMs: 1500 });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-emerald-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-emerald-700" />
          <p className="text-sm font-semibold text-gray-900">Approximate Location Context</p>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {location
            ? `${location.city || "Unknown city"}, ${location.countryCode} • ${location.continent} • ${location.precision}`
            : "Location not detected yet"}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Globe2 size={16} className="text-emerald-700" />
          <p className="text-sm font-semibold text-gray-900">Regional Match Scope</p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setPreference((prev) => ({ ...prev, matchScope: scope }))}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                preference.matchScope === scope
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {scope.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(preference.travelMode)}
              onChange={(event) =>
                setPreference((prev) => ({ ...prev, travelMode: event.target.checked }))
              }
            />
            Travel mode boost
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(preference.globalMode)}
              onChange={(event) =>
                setPreference((prev) => ({ ...prev, globalMode: event.target.checked }))
              }
            />
            Global mode boost
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(preference.showCountryOnly)}
              onChange={(event) =>
                setPreference((prev) => ({ ...prev, showCountryOnly: event.target.checked }))
              }
            />
            Show country only
          </label>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Travel mode boosts cross-border matches. Global mode expands ranking globally with extra scoring weight.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="border-emerald-200" disabled={saving || loading} onClick={() => void savePreference()}>
            {saving ? "Saving..." : "Save Scope"}
          </Button>
          <Button variant="outline" className="border-emerald-200" disabled={saving || loading} onClick={() => void loadAll()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Nearby and Regional Matches</p>
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading regional matches...
            </div>
          ) : topMatches.length === 0 ? (
            <p className="text-sm text-gray-500">No matches found for current scope.</p>
          ) : (
            topMatches.map((match) => (
              <div key={match.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{match.name}</p>
                  <span className="text-xs font-semibold text-emerald-700">Score {match.regionalScore}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {match.city}, {match.countryCode} • {match.continent}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Reason: {match.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700" />
          <p className="text-sm font-semibold text-gray-900">Location Privacy Rules</p>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-gray-600">
          {policyRules.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
