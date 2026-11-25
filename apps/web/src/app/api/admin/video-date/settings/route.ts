import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/server/auth';

// Kept in sync with the fields (admin)/admin/video-date/settings/page.tsx
// actually renders (followup/icebreaker/safety/location/readiness); the
// other three (reflection/subscription/system) are accepted on write for
// forward-compatibility but have no UI yet, so no default shape is assumed
// for them.
const VIDEO_DATE_SETTINGS_TYPES = [
  'followup',
  'icebreaker',
  'safety',
  'location',
  'reflection',
  'readiness',
  'subscription',
  'system',
] as const;
type SettingsType = (typeof VIDEO_DATE_SETTINGS_TYPES)[number];

const DEFAULT_SETTINGS: Partial<Record<SettingsType, Record<string, unknown>>> = {
  followup: {
    enabledByIntent: { faith: true, casual: true, professional: true },
    rules: { bothMustAccept: true, cooldownDays: 1, maxPerWeek: 3 },
    integrationsAllowed: ['google', 'apple', 'internal'],
  },
  icebreaker: {
    enabled: true,
    promptTemplates: {
      faith: ['What brings you to faith-based dating?'],
      casual: ['What do you like to do for fun?'],
      professional: ['What do you do professionally?'],
    },
    safetyFilters: { banTopics: ['politics', 'religion'], minLength: 5, maxLength: 500 },
    tonePresets: {
      faith: 'respectful and values-aligned',
      casual: 'fun and lighthearted',
      professional: 'warm and professional',
    },
    aiProvider: 'openai',
    rateLimit: { perUser: 10, perDay: 1000 },
  },
  safety: {
    categories: [
      {
        id: 'harassment',
        name: 'Harassment',
        description: 'Unwanted contact',
        severity: 'high',
        autoAction: 'mute',
      },
    ],
    autoActions: { mute: true, suspend: true, shadowBan: false },
    compliance: { gdprEnabled: true, coppaEnabled: true, faithBasedSafeguards: true },
  },
  location: {
    precisionLevel: 'city',
    requireOptIn: true,
    faithRestrictions: { applicableIntents: ['faith'], restrictedCountries: [] },
    countryCompliance: {},
  },
  readiness: {
    enabled: true,
    formula: { punctuality: 40, engagement: 35, respect: 25 },
    thresholds: { ready: 75, needsCoaching: 50, restricted: 25 },
  },
};

function isAdmin(req: NextRequest): boolean {
  return Boolean(req.cookies.get('dp_admin')?.value);
}

/**
 * POST /api/admin/video-date/settings
 * Save video date feature settings.
 *
 * Previously this had no persistence at all — a "TODO: Implement database
 * save" comment and a hardcoded `auditId`/`timestamp` in the response, with
 * nothing actually written anywhere. Now backed by VideoDateSetting (see
 * schema.prisma) plus a real AuditLog entry, matching the pattern already
 * used by apps/web/src/lib/server/geo-matching.ts for admin region rules.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, settings } = body;

    if (!type || !settings) {
      return NextResponse.json({ error: 'Missing type or settings' }, { status: 400 });
    }

    if (!VIDEO_DATE_SETTINGS_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid settings type' }, { status: 400 });
    }

    const actorUserId = getAuthContext(request).userId ?? undefined;

    const saved = await prisma.videoDateSetting.upsert({
      where: { type },
      create: { type, value: settings, updatedBy: actorUserId },
      update: { value: settings, updatedBy: actorUserId },
    });

    const audit = await prisma.auditLog.create({
      data: {
        action: 'ADMIN_VIDEO_DATE_SETTINGS_UPDATE',
        actorUserId,
        metadata: { type, settings },
      },
    });

    return NextResponse.json(
      {
        success: true,
        type,
        message: 'Settings saved successfully',
        timestamp: saved.updatedAt,
        auditId: audit.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

/**
 * GET /api/admin/video-date/settings
 * Retrieve all video date settings, seeded with defaults for any category
 * that has never been saved yet.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.videoDateSetting.findMany();
    const stored = new Map(rows.map((row) => [row.type, row]));

    const displayedTypes: SettingsType[] = ['followup', 'icebreaker', 'safety', 'location', 'readiness'];
    const settings: Record<string, unknown> = {};
    for (const type of displayedTypes) {
      const row = stored.get(type);
      settings[type] = {
        ...(row ? (row.value as Record<string, unknown>) : DEFAULT_SETTINGS[type]),
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedBy ?? null,
      };
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
