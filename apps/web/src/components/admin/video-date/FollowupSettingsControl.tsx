'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Save } from 'lucide-react';
import type { CalendarFollowupSettings } from '@/types/video-date-settings';

const SafeCheckCircle2 = CheckCircle2 as any;
const SafeSave = Save as any;

interface FollowupSettingsControlProps {
  settings: CalendarFollowupSettings;
  onSave: (settings: CalendarFollowupSettings) => Promise<void>;
  isLoading?: boolean;
}

export function FollowupSettingsControl({
  settings,
  onSave,
  isLoading = false,
}: FollowupSettingsControlProps) {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calendar Follow-up Rules</CardTitle>
        <CardDescription>
          Control when and how users can schedule follow-up dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intent Toggle */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Enable by Intent</Label>
          <div className="grid grid-cols-3 gap-4">
            {['faith', 'casual', 'professional'].map((intent) => (
              <div key={intent} className="flex items-center space-x-2">
                <Checkbox
                  id={`intent-${intent}`}
                  checked={localSettings.enabledByIntent[intent as keyof typeof localSettings.enabledByIntent]}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      enabledByIntent: {
                        ...localSettings.enabledByIntent,
                        [intent]: checked,
                      },
                    });
                  }}
                />
                <Label htmlFor={`intent-${intent}`} className="capitalize cursor-pointer">
                  {intent}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Follow-up Rules</Label>

          <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
            <Checkbox
              id="both-accept"
              checked={localSettings.rules.bothMustAccept}
              onCheckedChange={(checked) => {
                setLocalSettings({
                  ...localSettings,
                  rules: {
                    ...localSettings.rules,
                    bothMustAccept: checked as boolean,
                  },
                });
              }}
            />
            <Label htmlFor="both-accept" className="cursor-pointer flex-1">
              Both parties must accept to schedule
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldown">Cooldown Between Follows (days)</Label>
            <Input
              id="cooldown"
              type="number"
              min="0"
              max="90"
              value={localSettings.rules.cooldownDays}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  rules: {
                    ...localSettings.rules,
                    cooldownDays: Number(e.target.value),
                  },
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-week">Maximum Follow-ups Per Week</Label>
            <Input
              id="max-week"
              type="number"
              min="1"
              max="20"
              value={localSettings.rules.maxPerWeek}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  rules: {
                    ...localSettings.rules,
                    maxPerWeek: Number(e.target.value),
                  },
                });
              }}
            />
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Calendar Integrations</Label>
          <div className="space-y-2">
            {(['google', 'apple', 'internal'] as const).map((integration) => (
              <div key={integration} className="flex items-center space-x-2">
                <Checkbox
                  id={`integration-${integration}`}
                  checked={localSettings.integrationsAllowed.includes(integration)}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      integrationsAllowed: checked
                        ? [...localSettings.integrationsAllowed, integration]
                        : localSettings.integrationsAllowed.filter((i) => i !== integration),
                    });
                  }}
                />
                <Label htmlFor={`integration-${integration}`} className="capitalize cursor-pointer">
                  {integration} Calendar
                </Label>
              </div>
            ))}
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
