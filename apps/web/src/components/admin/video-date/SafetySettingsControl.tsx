'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { SafetyReportSettings, SafetyReportCategory } from '@/types/video-date-settings';

const SafeSave = Save as any;
const SafeAlertTriangle = AlertTriangle as any;
const SafeCheckCircle2 = CheckCircle2 as any;

interface SafetySettingsControlProps {
  settings: SafetyReportSettings;
  onSave: (settings: SafetyReportSettings) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_CATEGORIES: SafetyReportCategory[] = [
  {
    id: 'harassment',
    name: 'Harassment',
    description: 'Unwanted contact or persistent inappropriate behavior',
    severity: 'high',
    autoAction: 'mute',
  },
  {
    id: 'inappropriate-content',
    name: 'Inappropriate Content',
    description: 'Sexual or explicit content shared during date',
    severity: 'high',
    autoAction: 'suspend',
  },
  {
    id: 'safety-concern',
    name: 'Safety Concern',
    description: 'Personal safety threatened during call',
    severity: 'critical',
    autoAction: 'suspend',
  },
  {
    id: 'misrepresentation',
    name: 'Misrepresentation',
    description: 'Profile does not match person on call',
    severity: 'medium',
    autoAction: 'none',
  },
  {
    id: 'scam-attempt',
    name: 'Scam Attempt',
    description: 'Financial or personal information solicitation',
    severity: 'critical',
    autoAction: 'shadowBan',
  },
];

export function SafetySettingsControl({
  settings,
  onSave,
  isLoading = false,
}: SafetySettingsControlProps) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Safety Report Settings</CardTitle>
        <CardDescription>
          Define report categories and automatic enforcement actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Compliance Requirements</Label>
          <div className="space-y-3">
            {[
              { key: 'gdprEnabled', label: 'GDPR Compliance' },
              { key: 'coppaEnabled', label: 'COPPA (Child Safety)' },
              { key: 'faithBasedSafeguards', label: 'Faith-based Value Safeguards' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={
                    localSettings.compliance[key as keyof typeof localSettings.compliance]
                  }
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      compliance: {
                        ...localSettings.compliance,
                        [key]: checked,
                      },
                    });
                  }}
                />
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Actions */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Automatic Actions on Report</Label>
          <p className="text-xs text-gray-500">
            These actions trigger when a report is verified
          </p>
          <div className="space-y-3">
            {[
              { key: 'mute', label: 'Mute Account', description: 'Prevent video/audio' },
              { key: 'suspend', label: 'Suspend Account', description: '24-48 hour suspension' },
              {
                key: 'shadowBan',
                label: 'Shadow Ban',
                description: 'Hide from matchmaking, no notification',
              },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id={`action-${key}`}
                  checked={
                    localSettings.autoActions[key as keyof typeof localSettings.autoActions]
                  }
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      autoActions: {
                        ...localSettings.autoActions,
                        [key]: checked,
                      },
                    });
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={`action-${key}`} className="cursor-pointer font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Categories */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-semibold">Report Categories</Label>
          <div className="space-y-3">
            {localSettings.categories.map((category) => (
              <div
                key={category.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>
                  <Badge className={getSeverityColor(category.severity)}>
                    {category.severity}
                  </Badge>
                </div>
                {category.autoAction && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <SafeAlertTriangle className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-700">
                      Auto-action: <span className="font-semibold">{category.autoAction}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-3">
            <SafeAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Enforcement Critical</p>
              <p className="text-yellow-800 text-xs mt-1">
                These settings directly impact user safety and legal compliance. Changes require
                admin review and audit logging.
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
          <Button onClick={handleSave} disabled={saving || isLoading} className="bg-red-600 hover:bg-red-700">
            <SafeSave className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
