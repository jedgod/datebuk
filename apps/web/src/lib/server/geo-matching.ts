import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export type MatchScope = "NEARBY" | "SAME_COUNTRY" | "SAME_CONTINENT" | "GLOBAL";

export type GeoPreference = {
  matchScope: MatchScope;
  travelMode?: boolean;
  globalMode?: boolean;
  showCountryOnly?: boolean;
  locationEnabled?: boolean;
};

export type ApproxLocation = {
  ipHash: string;
  country: string;
  countryCode: string;
  continent: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  source: "IP";
  precision: "APPROXIMATE";
};

export type RegionalProfile = {
  id: string;
  name: string;
  countryCode: string;
  continent: string;
  city: string;
  baseScore: number;
};

export type RankedRegionalProfile = RegionalProfile & {
  regionalScore: number;
  reason: string;
};

type RegionRule = {
  id: string;
  region: string;
  visibility: "allow" | "limited" | "blocked";
  note?: string;
  createdAt: string;
};

type RegionRuleMutation = {
  region?: string;
  visibility?: "allow" | "limited" | "blocked";
  note?: string;
};

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  US: "North America",
  CA: "North America",
  MX: "North America",
  BR: "South America",
  AR: "South America",
  CO: "South America",
  GB: "Europe",
  FR: "Europe",
  DE: "Europe",
  ES: "Europe",
  IT: "Europe",
  NG: "Africa",
  GH: "Africa",
  KE: "Africa",
  ZA: "Africa",
  IN: "Asia",
  PK: "Asia",
  BD: "Asia",
  CN: "Asia",
  JP: "Asia",
  KR: "Asia",
  AU: "Oceania",
  NZ: "Oceania",
};

const LOCATION_SETTINGS_VERSION = "geo_v1";

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function hashIp(ip: string): string {
  const salt = process.env.HASH_SALT;
  if (!salt) throw new Error("HASH_SALT is required for location hashing");
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function continentForCountry(countryCode: string): string {
  return COUNTRY_TO_CONTINENT[countryCode] || "North America";
}

function cityFallback(countryCode: string): string {
  if (countryCode === "US") return "Bowie";
  if (countryCode === "GB") return "London";
  if (countryCode === "NG") return "Lagos";
  if (countryCode === "GH") return "Accra";
  if (countryCode === "CA") return "Toronto";
  return "Unknown";
}

export function detectLocationFromRequest(req: NextRequest): ApproxLocation {
  const ip = clientIp(req);
  const countryCode =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "US";
  const city = req.headers.get("x-vercel-ip-city") || cityFallback(countryCode);

  return {
    ipHash: hashIp(ip),
    country: countryCode,
    countryCode,
    continent: continentForCountry(countryCode),
    city,
    latitude: null,
    longitude: null,
    source: "IP",
    precision: "APPROXIMATE",
  };
}

function defaultPreference(): GeoPreference {
  return {
    matchScope: "SAME_CONTINENT",
    travelMode: false,
    globalMode: false,
    showCountryOnly: false,
    locationEnabled: true,
  };
}

function normalizePreference(payload: Partial<GeoPreference>, fallback: GeoPreference): GeoPreference {
  const allowedScopes: MatchScope[] = ["NEARBY", "SAME_COUNTRY", "SAME_CONTINENT", "GLOBAL"];
  const scope: MatchScope = allowedScopes.includes(payload.matchScope as MatchScope)
    ? (payload.matchScope as MatchScope)
    : fallback.matchScope;

  return {
    ...fallback,
    ...payload,
    matchScope: scope,
  };
}

function extractPreferenceFromLocationPayload(locationPayload: unknown): GeoPreference | null {
  if (!locationPayload || typeof locationPayload !== "object" || Array.isArray(locationPayload)) {
    return null;
  }

  const payload = locationPayload as Record<string, unknown>;
  const version = payload.geoSettingsVersion;
  if (version !== LOCATION_SETTINGS_VERSION) return null;
  const preferences = payload.geoPreferences;
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) return null;

  const pref = preferences as Partial<GeoPreference>;
  return normalizePreference(pref, defaultPreference());
}

export async function getPreferenceForUser(userId: string): Promise<GeoPreference> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { location: true },
  });

  const stored = extractPreferenceFromLocationPayload(profile?.location);
  if (stored) return stored;
  return defaultPreference();
}

export async function savePreferenceForUser(userId: string, payload: Partial<GeoPreference>): Promise<GeoPreference> {
  const existing = await getPreferenceForUser(userId);
  const next = normalizePreference(payload, existing);

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { location: true },
  });

  const locationObject =
    profile?.location && typeof profile.location === "object" && !Array.isArray(profile.location)
      ? (profile.location as Record<string, unknown>)
      : {};

  const nextLocationPayload = {
    ...locationObject,
    geoSettingsVersion: LOCATION_SETTINGS_VERSION,
    geoPreferences: next,
    geoPreferencesUpdatedAt: new Date().toISOString(),
  };

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: "DateBuk User",
      location: nextLocationPayload,
      photos: [],
    },
    update: {
      location: nextLocationPayload,
    },
  });

  return next;
}

/**
 * Real candidate pool for regional matching — replaces a previous hardcoded list of 6
 * demo profiles that showed identically to every viewer regardless of who they were or
 * where they were located. Location comes from User.locationCity/locationCountry (set at
 * signup from real IP intelligence, see AuthService.signup), not the viewer-only
 * Profile.location JSON blob used for geoPreferences above.
 */
export async function getRegionalCandidates(viewerId: string, limit = 50): Promise<RegionalProfile[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      accountStatus: "ACTIVE",
      profile: { isNot: null },
    },
    take: limit,
    select: {
      id: true,
      locationCity: true,
      locationCountry: true,
      trustScore: true,
      profile: { select: { displayName: true } },
    },
  });

  return users.map((user) => {
    const countryCode = user.locationCountry || "US";
    return {
      id: user.id,
      name: user.profile?.displayName || "Member",
      countryCode,
      continent: continentForCountry(countryCode),
      city: user.locationCity || cityFallback(countryCode),
      baseScore: Math.min(50 + user.trustScore, 95),
    };
  });
}

export function rankProfiles(
  viewer: ApproxLocation,
  profiles: RegionalProfile[],
  preference: GeoPreference
): RankedRegionalProfile[] {
  const scope = preference.globalMode ? "GLOBAL" : preference.matchScope || "SAME_CONTINENT";
  return profiles
    .map((profile) => {
      let score = profile.baseScore || 50;
      const reasons: string[] = [];

      if (viewer.city && viewer.city === profile.city) {
        score += 30;
        reasons.push("same city");
      }
      if (viewer.countryCode && viewer.countryCode === profile.countryCode) {
        score += 25;
        reasons.push("same country");
      }
      if (viewer.continent && viewer.continent === profile.continent) {
        score += 20;
        reasons.push("same continent");
      }

      if (preference.travelMode && viewer.countryCode !== profile.countryCode) {
        score += 14;
        reasons.push("travel mode cross-border boost");
      }

      if (preference.globalMode) {
        score += 10;
        reasons.push("global mode boost");
      }

      if (scope === "SAME_COUNTRY" && viewer.countryCode !== profile.countryCode) score -= 60;
      if (scope === "SAME_CONTINENT" && viewer.continent !== profile.continent) score -= 40;
      if (scope === "NEARBY" && viewer.city !== profile.city) score -= 55;
      if (scope === "GLOBAL") score += 5;

      return {
        ...profile,
        regionalScore: score,
        reason: reasons.length > 0 ? reasons.join(", ") : "compatibility baseline",
      };
    })
    .filter((item) => scope === "GLOBAL" || item.regionalScore >= 35)
    .sort((a, b) => b.regionalScore - a.regionalScore);
}

export async function getRegionalMatches(
  viewerId: string,
  viewer: ApproxLocation,
  preference: GeoPreference
): Promise<RankedRegionalProfile[]> {
  const candidates = await getRegionalCandidates(viewerId);
  return rankProfiles(viewer, candidates, preference);
}

export function getPrivacyPolicyRules(): string[] {
  return [
    "Use approximate location by default.",
    "Hash IP addresses before storing.",
    "Allow users to show country only.",
    "Allow users to disable location-based matching.",
    "Use GPS only after explicit permission.",
  ];
}

export async function listRegionRules(): Promise<RegionRule[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ["ADMIN_REGION_RULE_CREATE", "ADMIN_REGION_RULE_UPDATE", "ADMIN_REGION_RULE_DELETE"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
    },
  });

  const state = new Map<string, RegionRule>();

  for (const entry of logs) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
          ? (entry.metadata as Record<string, unknown>)
          : null;

      const ruleId =
        typeof metadata?.ruleId === "string" && metadata.ruleId.length > 0
          ? metadata.ruleId
          : entry.action === "ADMIN_REGION_RULE_CREATE"
            ? entry.id
            : null;

      if (!ruleId) {
        continue;
      }

      if (entry.action === "ADMIN_REGION_RULE_DELETE") {
        state.delete(ruleId);
        continue;
      }

      const region = typeof metadata?.region === "string" ? metadata.region : null;
      const visibility =
        metadata?.visibility === "allow" || metadata?.visibility === "limited" || metadata?.visibility === "blocked"
          ? (metadata.visibility as "allow" | "limited" | "blocked")
          : null;

      const existing = state.get(ruleId);
      const nextRegion = region || existing?.region;
      const nextVisibility = visibility || existing?.visibility;

      if (!nextRegion || !nextVisibility) {
        continue;
      }

      state.set(ruleId, {
        id: ruleId,
        region: nextRegion,
        visibility: nextVisibility,
        note: typeof metadata?.note === "string" ? metadata.note : existing?.note,
        createdAt: existing?.createdAt || entry.createdAt.toISOString(),
      });
    }

  return Array.from(state.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addRegionRule(
  payload: { region: string; visibility: "allow" | "limited" | "blocked"; note?: string },
  actorUserId?: string
): Promise<RegionRule> {
  const ruleId = crypto.randomUUID();
  const created = await prisma.auditLog.create({
    data: {
      action: "ADMIN_REGION_RULE_CREATE",
      actorUserId,
      metadata: {
        ruleId,
        region: payload.region,
        visibility: payload.visibility,
        note: payload.note,
      },
    },
  });

  return {
    id: ruleId,
    region: payload.region,
    visibility: payload.visibility,
    note: payload.note,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function updateRegionRule(
  ruleId: string,
  payload: RegionRuleMutation,
  actorUserId?: string
): Promise<RegionRule | null> {
  const rules = await listRegionRules();
  const existing = rules.find((item) => item.id === ruleId);
  if (!existing) return null;

  const next: RegionRule = {
    ...existing,
    region: payload.region || existing.region,
    visibility: payload.visibility || existing.visibility,
    note: payload.note === undefined ? existing.note : payload.note,
  };

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_REGION_RULE_UPDATE",
      actorUserId,
      metadata: {
        ruleId,
        region: next.region,
        visibility: next.visibility,
        note: next.note,
      },
    },
  });

  return next;
}

export async function deleteRegionRule(ruleId: string, actorUserId?: string): Promise<boolean> {
  const rules = await listRegionRules();
  const existing = rules.find((item) => item.id === ruleId);
  if (!existing) return false;

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_REGION_RULE_DELETE",
      actorUserId,
      metadata: {
        ruleId,
      },
    },
  });

  return true;
}
