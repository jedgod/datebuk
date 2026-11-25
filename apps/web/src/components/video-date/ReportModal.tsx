'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Flag, AlertTriangle } from 'lucide-react';

const SafeFlag = Flag as any;
const SafeAlertTriangle = AlertTriangle as any;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: SafetyReport) => void;
  recipientName: string;
}

export interface SafetyReport {
  category: 'inappropriate' | 'harassment' | 'fraud' | 'safety' | 'emergency' | 'other';
  description: string;
  blockUser: boolean;
  endCall: boolean;
}

const reportCategories = [
  { value: 'inappropriate', label: 'Inappropriate behavior or content', icon: '⚠️' },
  { value: 'harassment', label: 'Harassment or threats', icon: '🚫' },
  { value: 'fraud', label: 'Catfishing or fraud suspicion', icon: '🎭' },
  { value: 'safety', label: 'Safety concern', icon: '🛡️' },
  { value: 'emergency', label: 'Immediate danger or emergency', icon: '🆘' },
  { value: 'other', label: 'Other reason', icon: '📋' },
];

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  recipientName,
}: ReportModalProps) {
  const [category, setCategory] = useState<SafetyReport['category']>('inappropriate');
  const [description, setDescription] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [endCall, setEndCall] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      category,
      description,
      blockUser,
      endCall,
    });
    // Reset
    setCategory('inappropriate');
    setDescription('');
    setBlockUser(false);
    setEndCall(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SafeFlag className="w-5 h-5 text-red-500" />
            Report {recipientName}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Your report is confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              What's the issue?
            </Label>
            <RadioGroup value={category} onValueChange={(val) => setCategory(val as SafetyReport['category'])}>
              <div className="space-y-2">
                {reportCategories.map((cat) => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat.value} id={cat.value} />
                    <Label htmlFor={cat.value} className="font-normal cursor-pointer">
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {category === 'emergency' && (
            <div className="flex gap-2 text-xs text-red-800 bg-red-50 p-3 rounded-lg border border-red-200">
              <SafeAlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <p>
                If you are in immediate danger, contact local emergency services now. This report goes to our
                safety team for review — it is not a substitute for calling 911 or your local equivalent.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Tell us more about what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm h-24"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="block"
                checked={blockUser}
                onCheckedChange={(val) => setBlockUser(val as boolean)}
              />
              <Label htmlFor="block" className="font-normal cursor-pointer text-sm">
                Block this user
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="endcall"
                checked={endCall}
                onCheckedChange={(val) => setEndCall(val as boolean)}
              />
              <Label htmlFor="endcall" className="font-normal cursor-pointer text-sm">
                End call immediately
              </Label>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 text-xs text-neutral-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <SafeAlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <p>
              False reports violate our community guidelines and may result in account suspension.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="bg-red-500 hover:bg-red-600"
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
