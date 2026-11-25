'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2 } from 'lucide-react';
import type { LocationSettings } from '@/types/video-date-settings';

const SafeSave = Save as any;
const SafeCheckCircle2 = CheckCircle2 as any;

interface LocationSettingsControlProps {
  settings: LocationSettings;
  onSave: (settings: LocationSettings) => Promise<void>;
  isLoading?: boolean;
}

export function LocationSettingsControl({
  settings,
  onSave,
  isLoading = false,
}: LocationSettingsControlProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

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

  const precisionLevels = [
    { value: 'city' as const, label: 'City Level', description: 'Show city only (e.g., "Austin, TX")' },
    {
      value: 'region' as const,
      label: 'Region/State',
      description: 'Show region only (e.g., "Texas")',
    },
    { value: 'hidden' as const, label: 'Hidden', description: 'Do not display location' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Location Display Settings</CardTitle>
        <CardDescription>
          Control location precision and compliance rules for video dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Precision Level */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Display Precision</Label>
          <div className="space-y-2">
            {precisionLevels.map(({ value, label, description }) => (
              <Button
                key={value}
                variant={localSettings.precisionLevel === value ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => {
                  setLocalSettings({
                    ...localSettings,
                    precisionLevel: value,
                  });
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs opacity-70">{description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Require Opt-in */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border-t border-blue-200">
          <Checkbox
            id="require-opt-in"
            checked={localSettings.requireOptIn}
            onCheckedChange={(checked) => {
              setLocalSettings({
                ...localSettings,
                requireOptIn: checked as boolean,
              });
            }}
          />
          <div className="flex-1">
            <Label htmlFor="require-opt-in" className="cursor-pointer font-medium">
              Require User Opt-in
            </Label>
            <p className="text-xs text-gray-600">
              Users must explicitly consent to share location before date starts
            </p>
          </div>
        </div>

        {/* Faith Restrictions */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Faith-based Restrictions</Label>

          <div className="space-y-3">
            <Label className="text-xs font-medium">Apply restrictions to:</Label>
            {(['faith', 'casual', 'professional'] as const).map((intent) => (
              <div key={intent} className="flex items-center space-x-2">
                <Checkbox
                  id={`faith-intent-${intent}`}
                  checked={localSettings.faithRestrictions.applicableIntents.includes(intent)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setLocalSettings({
                        ...localSettings,
                        faithRestrictions: {
                          ...localSettings.faithRestrictions,
                          applicableIntents: [
                            ...localSettings.faithRestrictions.applicableIntents,
                            intent,
                          ],
                        },
                      });
                    } else {
                      setLocalSettings({
                        ...localSettings,
                        faithRestrictions: {
                          ...localSettings.faithRestrictions,
                          applicableIntents: localSettings.faithRestrictions.applicableIntents.filter(
                            (i) => i !== intent,
                          ),
                        },
                      });
                    }
                  }}
                />
                <Label htmlFor={`faith-intent-${intent}`} className="capitalize cursor-pointer">
                  {intent}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t">
            <Label htmlFor="restricted-countries" className="text-xs font-medium">
              Restricted Countries (comma-separated)
            </Label>
            <Input
              id="restricted-countries"
              placeholder="e.g., CN, RU, IR"
              value={localSettings.faithRestrictions.restrictedCountries.join(', ')}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  faithRestrictions: {
                    ...localSettings.faithRestrictions,
                    restrictedCountries: e.target.value
                      .split(',')
                      .map((c) => c.trim().toUpperCase())
                      .filter(Boolean),
                  },
                });
              }}
            />
          </div>
        </div>

        {/* Country Compliance */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Country Compliance Status</Label>
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-semibold text-green-600">✓ Enabled:</span>
              <p className="text-xs text-gray-600">
                {Object.entries(localSettings.countryCompliance)
                  .filter(([, enabled]) => enabled)
                  .length}{' '}
                countries
              </p>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-red-600">✕ Restricted:</span>
              <p className="text-xs text-gray-600">
                {Object.entries(localSettings.countryCompliance)
                  .filter(([, enabled]) => !enabled)
                  .length}{' '}
                countries
              </p>
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
