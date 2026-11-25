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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock } from 'lucide-react';

const SafeCalendar = Calendar as any;
const SafeClock = Clock as any;

export interface FollowUpRequest {
  interested: boolean;
  suggestedDate?: string;
  suggestedTime?: string;
  message?: string;
}

interface CalendarFollowupFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (followUp: FollowUpRequest) => void;
  recipientName: string;
}

export function CalendarFollowupFlow({
  isOpen,
  onClose,
  onSubmit,
  recipientName,
}: CalendarFollowupFlowProps) {
  const [interested, setInterested] = useState<boolean | null>(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (interested === null) return;

    onSubmit({
      interested,
      suggestedDate: interested ? suggestedDate : undefined,
      suggestedTime: interested ? suggestedTime : undefined,
      message: interested ? message : undefined,
    });

    // Reset
    setInterested(null);
    setSuggestedDate('');
    setSuggestedTime('');
    setMessage('');
  };

  const isValid =
    interested !== null &&
    (!interested || (suggestedDate && suggestedTime));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Plan Your Next Date</DialogTitle>
          <DialogDescription>
            Would you like to meet {recipientName} again?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Interest Selection */}
          <RadioGroup
            value={interested === null ? '' : interested.toString()}
            onValueChange={(val) => setInterested(val === 'true')}
          >
            <div className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer flex-1">
                <div className="font-medium">Yes, I'm interested! 🎉</div>
                <div className="text-xs text-neutral-600">Let's plan something</div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no" className="cursor-pointer flex-1">
                <div className="font-medium">Not right now</div>
                <div className="text-xs text-neutral-600">No pressure, good luck!</div>
              </Label>
            </div>
          </RadioGroup>

          {/* Date & Time Selection (only if interested) */}
          {interested && (
            <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <Label htmlFor="date" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <SafeCalendar className="w-4 h-4" />
                  Suggested Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={suggestedDate}
                  onChange={(e) => setSuggestedDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="time" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <SafeClock className="w-4 h-4" />
                  Suggested Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium mb-2">
                  Personal Message (optional)
                </Label>
                <Input
                  id="message"
                  placeholder="E.g., Coffee at downtown cafe?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Mutual note */}
          {interested === false && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-neutral-700">
              ℹ️ If they express interest, their profile will appear in your matches.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip for now
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
