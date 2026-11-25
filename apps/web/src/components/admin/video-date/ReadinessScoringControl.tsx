'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle2, BarChart3 } from 'lucide-react';
import type { ReadinessScoringSettings } from '@/types/video-date-settings';

const SafeSave = Save as any;
const SafeCheckCircle2 = CheckCircle2 as any;
const SafeBarChart3 = BarChart3 as any;

interface ReadinessScoringControlProps {
  settings: ReadinessScoringSettings;
  onSave: (settings: ReadinessScoringSettings) => Promise<void>;
  isLoading?: boolean;
}

export function ReadinessScoringControl({
  settings,
  onSave,
  isLoading = false,
}: ReadinessScoringControlProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const totalWeight = Object.values(localSettings.formula).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      setSavedMessage('Settings saved successfully');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Date Readiness Scoring</CardTitle>
        <CardDescription>
          Define scoring criteria to assess user readiness for video dating
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            id="readiness-enabled"
            checked={localSettings.enabled}
            onCheckedChange={(checked) => {
              setLocalSettings({
                ...localSettings,
                enabled: checked as boolean,
              });
            }}
          />
          <Label htmlFor="readiness-enabled" className="cursor-pointer flex-1">
            Enable Readiness Scoring System
          </Label>
        </div>

        {/* Scoring Formula */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Scoring Weights</Label>
          <p className="text-xs text-gray-500">
            Percentage contribution to final score (total: {totalWeight}%)
          </p>

          <div className="space-y-4">
            {['punctuality', 'engagement', 'respect'].map((criterion) => {
              const weight =
                localSettings.formula[criterion as keyof typeof localSettings.formula];
              return (
                <div key={criterion} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`weight-${criterion}`} className="capitalize">
                      {criterion}
                    </Label>
                    <span className="text-sm font-semibold text-blue-600">{weight}%</span>
                  </div>
                  <Input
                    id={`weight-${criterion}`}
                    type="range"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) => {
                      setLocalSettings({
                        ...localSettings,
                        formula: {
                          ...localSettings.formula,
                          [criterion]: Number(e.target.value),
                        },
                      });
                    }}
                    className="h-2"
                  />
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${weight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalWeight !== 100 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Weights total {totalWeight}% - should equal 100% for accurate scoring
            </div>
          )}
        </div>

        {/* Thresholds */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Score Thresholds</Label>
          <p className="text-xs text-gray-500">Define what each score range means</p>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="ready-threshold">Ready Threshold (0-100)</Label>
                <span className="text-sm font-semibold text-green-600">
                  {localSettings.thresholds.ready}+
                </span>
              </div>
              <Input
                id="ready-threshold"
                type="number"
                min="0"
                max="100"
                value={localSettings.thresholds.ready}
                onChange={(e) => {
                  setLocalSettings({
                    ...localSettings,
                    thresholds: {
                      ...localSettings.thresholds,
                      ready: Number(e.target.value),
                    },
                  });
                }}
              />
              <p className="text-xs text-gray-600">
                Score above this: User is ready for video dating
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="coaching-threshold">Needs Coaching Threshold (0-100)</Label>
                <span className="text-sm font-semibold text-yellow-600">
                  {localSettings.thresholds.needsCoaching}+
                </span>
              </div>
              <Input
                id="coaching-threshold"
                type="number"
                min="0"
                max="100"
                value={localSettings.thresholds.needsCoaching}
                onChange={(e) => {
                  setLocalSettings({
                    ...localSettings,
                    thresholds: {
                      ...localSettings.thresholds,
                      needsCoaching: Number(e.target.value),
                    },
                  });
                }}
              />
              <p className="text-xs text-gray-600">
                Score below this: User offered coaching resources
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="restricted-threshold">Restricted Threshold (0-100)</Label>
                <span className="text-sm font-semibold text-red-600">
                  Below {localSettings.thresholds.restricted}
                </span>
              </div>
              <Input
                id="restricted-threshold"
                type="number"
                min="0"
                max="100"
                value={localSettings.thresholds.restricted}
                onChange={(e) => {
                  setLocalSettings({
                    ...localSettings,
                    thresholds: {
                      ...localSettings.thresholds,
                      restricted: Number(e.target.value),
                    },
                  });
                }}
              />
              <p className="text-xs text-gray-600">
                Score below this: User restricted from video dating temporarily
              </p>
            </div>
          </div>
        </div>

        {/* Score Reference */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <SafeBarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Scoring Tiers</p>
              <div className="mt-2 space-y-1 text-blue-800 text-xs">
                <div>
                  🟢 <span className="font-semibold">{localSettings.thresholds.ready}+:</span> Ready
                  to date
                </div>
                <div>
                  🟡 <span className="font-semibold">{localSettings.thresholds.needsCoaching}-{localSettings.thresholds.ready - 1}:</span> Offer coaching
                </div>
                <div>
                  🔴 <span className="font-semibold">&lt; {localSettings.thresholds.restricted}:</span> Temporarily
                  restricted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            {savedMessage && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <SafeCheckCircle2 className="w-4 h-4" />
                {savedMessage}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving || isLoading}>
            <SafeSave className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
