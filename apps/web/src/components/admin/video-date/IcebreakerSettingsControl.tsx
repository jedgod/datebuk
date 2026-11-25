'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import type { IcebreakerSettings } from '@/types/video-date-settings';

const SafeSave = Save as any;
const SafePlus = Plus as any;
const SafeCheckCircle2 = CheckCircle2 as any;

interface IcebreakerSettingsControlProps {
  settings: IcebreakerSettings;
  onSave: (settings: IcebreakerSettings) => Promise<void>;
  isLoading?: boolean;
}

export function IcebreakerSettingsControl({
  settings,
  onSave,
  isLoading = false,
}: IcebreakerSettingsControlProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [newBanTopic, setNewBanTopic] = useState('');

  const handleAddBanTopic = () => {
    if (newBanTopic.trim()) {
      setLocalSettings({
        ...localSettings,
        safetyFilters: {
          ...localSettings.safetyFilters,
          banTopics: [...localSettings.safetyFilters.banTopics, newBanTopic],
        },
      });
      setNewBanTopic('');
    }
  };

  const handleRemoveBanTopic = (topic: string) => {
    setLocalSettings({
      ...localSettings,
      safetyFilters: {
        ...localSettings.safetyFilters,
        banTopics: localSettings.safetyFilters.banTopics.filter((t) => t !== topic),
      },
    });
  };

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
        <CardTitle>AI Icebreaker Settings</CardTitle>
        <CardDescription>
          Configure AI-powered conversation starters for each date intent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            id="icebreaker-enabled"
            checked={localSettings.enabled}
            onCheckedChange={(checked) => {
              setLocalSettings({
                ...localSettings,
                enabled: checked as boolean,
              });
            }}
          />
          <Label htmlFor="icebreaker-enabled" className="cursor-pointer flex-1">
            Enable AI Icebreaker Feature
          </Label>
        </div>

        {/* AI Provider */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">AI Provider</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['openai', 'anthropic', 'local'] as const).map((provider) => (
              <Button
                key={provider}
                variant={localSettings.aiProvider === provider ? 'default' : 'outline'}
                onClick={() => {
                  setLocalSettings({
                    ...localSettings,
                    aiProvider: provider,
                  });
                }}
              >
                {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Local'}
              </Button>
            ))}
          </div>
        </div>

        {/* Tone Presets */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Tone Presets per Intent</Label>
          {(['faith', 'casual', 'professional'] as const).map((intent) => (
            <div key={intent} className="space-y-2">
              <Label htmlFor={`tone-${intent}`} className="capitalize text-sm">
                {intent} Tone
              </Label>
              <Input
                id={`tone-${intent}`}
                placeholder={`e.g., "respectful and values-aligned" for faith`}
                value={localSettings.tonePresets[intent]}
                onChange={(e) => {
                  setLocalSettings({
                    ...localSettings,
                    tonePresets: {
                      ...localSettings.tonePresets,
                      [intent]: e.target.value,
                    },
                  });
                }}
              />
            </div>
          ))}
        </div>

        {/* Safety Filters */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Safety Filters</Label>

          <div className="space-y-2">
            <Label htmlFor="min-length" className="text-sm">
              Minimum Response Length
            </Label>
            <Input
              id="min-length"
              type="number"
              min="0"
              value={localSettings.safetyFilters.minLength}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  safetyFilters: {
                    ...localSettings.safetyFilters,
                    minLength: Number(e.target.value),
                  },
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-length" className="text-sm">
              Maximum Response Length
            </Label>
            <Input
              id="max-length"
              type="number"
              min="1"
              value={localSettings.safetyFilters.maxLength}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  safetyFilters: {
                    ...localSettings.safetyFilters,
                    maxLength: Number(e.target.value),
                  },
                });
              }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Banned Topics</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a banned topic..."
                value={newBanTopic}
                onChange={(e) => setNewBanTopic(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddBanTopic();
                }}
              />
              <Button onClick={handleAddBanTopic} size="sm">
                <SafePlus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.safetyFilters.banTopics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                  <button
                    className="ml-2 hover:text-red-600"
                    onClick={() => handleRemoveBanTopic(topic)}
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Rate Limits</Label>

          <div className="space-y-2">
            <Label htmlFor="per-user" className="text-sm">
              Per User (per day)
            </Label>
            <Input
              id="per-user"
              type="number"
              min="1"
              value={localSettings.rateLimit.perUser}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  rateLimit: {
                    ...localSettings.rateLimit,
                    perUser: Number(e.target.value),
                  },
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="per-day" className="text-sm">
              Global (per day)
            </Label>
            <Input
              id="per-day"
              type="number"
              min="1"
              value={localSettings.rateLimit.perDay}
              onChange={(e) => {
                setLocalSettings({
                  ...localSettings,
                  rateLimit: {
                    ...localSettings.rateLimit,
                    perDay: Number(e.target.value),
                  },
                });
              }}
            />
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
