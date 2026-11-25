"use client";

import { Check, Flag, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIScoresBadgeProps {
  nudity: number;
  explicitAudio: number;
  violence?: number;
  overallRisk: number;
  compact?: boolean;
}

export function AIScoresBadge({ nudity, explicitAudio, violence, overallRisk, compact = false }: AIScoresBadgeProps) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 80) return 'text-red-700';
    if (score >= 60) return 'text-orange-700';
    if (score >= 40) return 'text-yellow-700';
    return 'text-green-700';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white", getRiskColor(overallRisk))}>
          <TrendingUp size={12} />
          {overallRisk}%
        </div>
        {nudity > 50 && (
          <div className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
            Nudity: {nudity}%
          </div>
        )}
        {explicitAudio > 50 && (
          <div className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
            Audio: {explicitAudio}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Nudity</span>
        <span className={cn("text-xs font-semibold", getRiskTextColor(nudity))}>{nudity}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all", getRiskColor(nudity))} style={{ width: `${nudity}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Explicit Audio</span>
        <span className={cn("text-xs font-semibold", getRiskTextColor(explicitAudio))}>{explicitAudio}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all", getRiskColor(explicitAudio))} style={{ width: `${explicitAudio}%` }} />
      </div>

      {violence !== undefined && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Violence</span>
            <span className={cn("text-xs font-semibold", getRiskTextColor(violence))}>{violence}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={cn("h-full transition-all", getRiskColor(violence))} style={{ width: `${violence}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
  };

  const { bg, text, label } = config[severity];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold", bg, text)}>
      <Flag size={12} />
      {label}
    </span>
  );
}

interface TrustLevelBadgeProps {
  level: 'new' | 'low' | 'medium' | 'high';
}

export function TrustLevelBadge({ level }: TrustLevelBadgeProps) {
  const config = {
    new: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'New' },
    low: { bg: 'bg-red-100', text: 'text-red-700', label: 'Low Trust' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium Trust' },
    high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High Trust' },
  };

  const { bg, text, label } = config[level];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium", bg, text)}>
      {label}
    </span>
  );
}
