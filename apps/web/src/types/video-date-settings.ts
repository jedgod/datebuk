/**
 * Video Date Feature Settings Types
 * Defines all admin-controlled settings for video date features
 */

// Calendar Follow-up Settings
export interface CalendarFollowupSettings {
  enabledByIntent: {
    faith: boolean;
    casual: boolean;
    professional: boolean;
  };
  rules: {
    bothMustAccept: boolean;
    cooldownDays: number;
    maxPerWeek: number;
  };
  integrationsAllowed: ('google' | 'apple' | 'internal')[];
  updatedAt: Date;
  updatedBy: string;
}

// AI Icebreaker Settings
export interface IcebreakerSettings {
  enabled: boolean;
  promptTemplates: {
    faith: string[];
    casual: string[];
    professional: string[];
  };
  safetyFilters: {
    banTopics: string[];
    minLength: number;
    maxLength: number;
  };
  tonePresets: {
    faith: string;
    casual: string;
    professional: string;
  };
  aiProvider: 'openai' | 'anthropic' | 'local';
  rateLimit: {
    perUser: number;
    perDay: number;
  };
  updatedAt: Date;
  updatedBy: string;
}

// Safety Report Settings
export interface SafetyReportSettings {
  categories: SafetyReportCategory[];
  autoActions: {
    mute: boolean;
    suspend: boolean;
    shadowBan: boolean;
  };
  compliance: {
    gdprEnabled: boolean;
    coppaEnabled: boolean;
    faithBasedSafeguards: boolean;
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface SafetyReportCategory {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAction?: 'none' | 'mute' | 'suspend' | 'shadowBan';
}

// Location Display Settings
export interface LocationSettings {
  precisionLevel: 'city' | 'region' | 'hidden';
  requireOptIn: boolean;
  faithRestrictions: {
    applicableIntents: ('faith' | 'casual' | 'professional')[];
    restrictedCountries: string[];
  };
  countryCompliance: {
    [country: string]: boolean;
  };
  updatedAt: Date;
  updatedBy: string;
}

// Post-date Reflection Settings
export interface ReflectionSettings {
  enabled: boolean;
  reflectionQuestions: {
    faith: string[];
    casual: string[];
    professional: string[];
  };
  aiTone: 'supportive' | 'neutral' | 'values-focused';
  dataRetention: {
    retentionDays: number;
    anonymizeAfter: boolean;
  };
  affectsMatching: boolean;
  updatedAt: Date;
  updatedBy: string;
}

// Date Readiness Scoring Settings
export interface ReadinessScoringSettings {
  enabled: boolean;
  formula: {
    punctuality: number;
    engagement: number;
    respect: number;
  };
  thresholds: {
    ready: number;
    needsCoaching: number;
    restricted: number;
  };
  updatedAt: Date;
  updatedBy: string;
}

// Subscription Gating Settings
export interface SubscriptionGatingSettings {
  featuresByPlan: {
    [planName: string]: VideoDateFeature[];
  };
  trialRules: {
    trialDays: number;
    trialFeatures: VideoDateFeature[];
  };
  regionPricing: {
    [region: string]: {
      currency: string;
      monthlyPrice: number;
    };
  };
  communityDiscounts: {
    faith: number;
    community: number;
  };
  updatedAt: Date;
  updatedBy: string;
}

export type VideoDateFeature =
  | 'calendar_followup'
  | 'icebreaker'
  | 'video_call'
  | 'message'
  | 'location_view'
  | 'reflection';

// System Settings
export interface VideoDateSystemSettings {
  enabledIntents: ('faith' | 'casual' | 'professional')[];
  maxCallDuration: number;
  recordingEnabled: boolean;
  encryptionRequired: boolean;
  auditLoggingEnabled: boolean;
  dataModels: {
    userProfileFields: string[];
    matchingAlgorithm: string;
    consentRequirements: string[];
  };
  updatedAt: Date;
  updatedBy: string;
}

// Aggregated Settings Response
export interface VideoDateAllSettings {
  followup: CalendarFollowupSettings;
  icebreaker: IcebreakerSettings;
  safety: SafetyReportSettings;
  location: LocationSettings;
  reflection: ReflectionSettings;
  readiness: ReadinessScoringSettings;
  subscription: SubscriptionGatingSettings;
  system: VideoDateSystemSettings;
  version: string;
  lastUpdated: Date;
}

// Settings Audit Log
export interface SettingsAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  settingsType: keyof VideoDateAllSettings;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  reason?: string;
}
