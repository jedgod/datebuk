'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowupSettingsControl } from '@/components/admin/video-date/FollowupSettingsControl';
import { IcebreakerSettingsControl } from '@/components/admin/video-date/IcebreakerSettingsControl';
import { SafetySettingsControl } from '@/components/admin/video-date/SafetySettingsControl';
import { LocationSettingsControl } from '@/components/admin/video-date/LocationSettingsControl';
import { ReadinessScoringControl } from '@/components/admin/video-date/ReadinessScoringControl';
import { ActiveVideoReviewQueue } from '@/components/admin/video-date/ActiveVideoReviewQueue';
import { Activity, ArrowLeft, CalendarClock, MapPin, Shield } from 'lucide-react';
import type {
  CalendarFollowupSettings,
  IcebreakerSettings,
  SafetyReportSettings,
  LocationSettings,
  ReadinessScoringSettings,
} from '@/types/video-date-settings';

interface AdminVideoDateDashboardProps {
  initialSettings?: {
    followup: CalendarFollowupSettings;
    icebreaker: IcebreakerSettings;
    safety: SafetyReportSettings;
    location: LocationSettings;
    readiness: ReadinessScoringSettings;
  };
}

const SafeArrowLeft = ArrowLeft as any;
const SafeActivity = Activity as any;
const SafeCalendarClock = CalendarClock as any;
const SafeMapPin = MapPin as any;
const SafeShield = Shield as any;

type VideoDateSettingsState = NonNullable<AdminVideoDateDashboardProps['initialSettings']>;

const defaultSettings: VideoDateSettingsState = {
  followup: {
    enabledByIntent: { faith: true, casual: true, professional: true },
    rules: { bothMustAccept: true, cooldownDays: 1, maxPerWeek: 3 },
    integrationsAllowed: ['google', 'apple', 'internal'],
    updatedAt: new Date(),
    updatedBy: 'system',
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
    updatedAt: new Date(),
    updatedBy: 'system',
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
    updatedAt: new Date(),
    updatedBy: 'system',
  },
  location: {
    precisionLevel: 'city',
    requireOptIn: true,
    faithRestrictions: {
      applicableIntents: ['faith'],
      restrictedCountries: [],
    },
    countryCompliance: {},
    updatedAt: new Date(),
    updatedBy: 'system',
  },
  readiness: {
    enabled: true,
    formula: { punctuality: 40, engagement: 35, respect: 25 },
    thresholds: { ready: 75, needsCoaching: 50, restricted: 25 },
    updatedAt: new Date(),
    updatedBy: 'system',
  },
};

export default function AdminVideoDateDashboard({
  initialSettings,
}: AdminVideoDateDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active-queue');

  // Initialize with defaults if not provided
  const [settings, setSettings] = useState<VideoDateSettingsState>(initialSettings ?? defaultSettings);

  const handleSaveSettings = async (
    settingType: keyof typeof settings,
    newValue: any,
  ) => {
    setIsLoading(true);
    try {
      // API call to save settings
      const response = await fetch('/api/admin/video-date/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: settingType, settings: newValue }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSettings((prev) => ({
        ...prev,
        [settingType]: newValue,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const adminFeatureCards = [
    { label: 'Live Review', value: '24', helper: 'Video and audio sessions under active sampling', icon: SafeActivity, tone: 'text-emerald-300' },
    { label: 'Predate Requests', value: '42', helper: 'Premium and Elite schedule requests needing oversight', icon: SafeCalendarClock, tone: 'text-sky-300' },
    { label: 'Safety Signals', value: '31', helper: 'Blocks, reports, and privacy changes monitored by staff', icon: SafeShield, tone: 'text-rose-300' },
    { label: 'Location Checks', value: '19', helper: 'Live date and approximate-location sharing checks', icon: SafeMapPin, tone: 'text-amber-300' },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <div className="space-y-3">
        <a href="/admin/dashboard" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
          <SafeArrowLeft size={18} />
          <span className="font-semibold">Return to Dashboard</span>
        </a>
        <h1 className="text-3xl font-bold text-white">Video Date Controls</h1>
        <p className="text-slate-400">
          Configure policies, rules, staff monitoring, and settings for all user-facing video dating features.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminFeatureCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-slate-950/20">
              <div className="flex items-center justify-between">
                <Icon size={20} className={card.tone} />
                <span className="text-2xl font-bold text-white">{card.value}</span>
              </div>
              <h2 className="mt-3 font-semibold text-white">{card.label}</h2>
              <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
            </div>
          );
        })}
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 border border-slate-700 bg-slate-900 p-1 text-slate-300">
          <TabsTrigger value="active-queue">Active Queue</TabsTrigger>
          <TabsTrigger value="followup">Follow-ups</TabsTrigger>
          <TabsTrigger value="icebreaker">Icebreaker</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="active-queue">
          <ActiveVideoReviewQueue />
        </TabsContent>

        <TabsContent value="followup">
          <FollowupSettingsControl
            settings={settings.followup}
            onSave={(newSettings) => handleSaveSettings('followup', newSettings)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="icebreaker">
          <IcebreakerSettingsControl
            settings={settings.icebreaker}
            onSave={(newSettings) => handleSaveSettings('icebreaker', newSettings)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="safety">
          <SafetySettingsControl
            settings={settings.safety}
            onSave={(newSettings) => handleSaveSettings('safety', newSettings)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="location">
          <LocationSettingsControl
            settings={settings.location}
            onSave={(newSettings) => handleSaveSettings('location', newSettings)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="readiness">
          <ReadinessScoringControl
            settings={settings.readiness}
            onSave={(newSettings) => handleSaveSettings('readiness', newSettings)}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Audit Trail Note */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
        <p className="font-semibold">All settings changes are logged and audited</p>
        <p className="text-slate-400 text-xs mt-1">
          Each setting modification is recorded with timestamp, admin ID, and previous values for compliance and rollback capability.
        </p>
      </div>
    </div>
  );
}

