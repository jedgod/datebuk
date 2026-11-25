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
import { Slider } from '@/components/ui/slider';
import { Heart, MessageSquare, Zap } from 'lucide-react';

const SafeHeart = Heart as any;
const SafeMessageSquare = MessageSquare as any;
const SafeZap = Zap as any;

export interface DateFeedback {
  overallVibe: number; // 1-10
  connectionLevel: 'low' | 'medium' | 'high' | 'very_high';
  wouldMeetAgain: boolean;
  highlights: string[];
  reflections: string;
}

interface PostDateReflectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: DateFeedback) => void;
  recipientName: string;
}

const vibeEmojis = ['😶', '😕', '😐', '🙂', '😊', '😄', '😃', '😍', '🔥', '💕'];

export function PostDateReflection({
  isOpen,
  onClose,
  onSubmit,
  recipientName,
}: PostDateReflectionProps) {
  const [vibeScore, setVibeScore] = useState([5]);
  const [connectionLevel, setConnectionLevel] = useState<DateFeedback['connectionLevel']>('medium');
  const [wouldMeetAgain, setWouldMeetAgain] = useState<boolean | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [reflections, setReflections] = useState('');

  const highlightOptions = [
    { id: 'conversation', label: 'Great conversation', icon: '💬' },
    { id: 'chemistry', label: 'Good chemistry', icon: '⚡' },
    { id: 'humor', label: 'Made me laugh', icon: '😂' },
    { id: 'authentic', label: 'Felt authentic', icon: '✨' },
    { id: 'passion', label: 'Shared passion', icon: '🔥' },
  ];

  const toggleHighlight = (id: string) => {
    setHighlights((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (wouldMeetAgain === null) return;

    onSubmit({
      overallVibe: vibeScore[0],
      connectionLevel,
      wouldMeetAgain,
      highlights,
      reflections,
    });

    // Reset
    setVibeScore([5]);
    setConnectionLevel('medium');
    setWouldMeetAgain(null);
    setHighlights([]);
    setReflections('');
  };

  const isValid = wouldMeetAgain !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How was your date?</DialogTitle>
          <DialogDescription>
            Help us understand your experience and improve matches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vibe Score */}
          <div>
            <Label className="text-sm font-medium mb-3 flex items-center gap-2">
              <SafeHeart className="w-4 h-4 text-red-500" />
              Overall Vibe
            </Label>
            <div className="flex items-center justify-between gap-2">
              <Slider
                value={vibeScore}
                onValueChange={setVibeScore}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <div className="text-2xl w-8 text-center">
                {vibeEmojis[vibeScore[0] - 1]}
              </div>
            </div>
            <div className="text-xs text-neutral-600 text-center mt-1">
              {vibeScore[0]}/10
            </div>
          </div>

          {/* Connection Level */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <SafeZap className="w-4 h-4 text-amber-500" />
              Connection Level
            </Label>
            <RadioGroup value={connectionLevel} onValueChange={(val) => setConnectionLevel(val as DateFeedback['connectionLevel'])}>
              <div className="space-y-2">
                {[
                  { value: 'low', label: 'Low - Just friendly vibes' },
                  { value: 'medium', label: 'Medium - Good potential' },
                  { value: 'high', label: 'High - Real connection' },
                  { value: 'very_high', label: 'Very High - Sparks flew! ✨' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value} className="font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Highlights */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <SafeMessageSquare className="w-4 h-4 text-blue-500" />
              What stood out?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {highlightOptions.map((opt) => (
                <Button
                  key={opt.id}
                  variant={highlights.includes(opt.id) ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => toggleHighlight(opt.id)}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reflections */}
          <div>
            <Label htmlFor="reflections" className="text-sm font-medium mb-2 block">
              Any other thoughts? (optional)
            </Label>
            <Textarea
              id="reflections"
              placeholder="What was on your mind?"
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              className="text-sm h-20"
            />
          </div>

          {/* Would Meet Again */}
          <div className="p-3 border-2 border-dashed border-neutral-300 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">
              Would you meet again?
            </Label>
            <div className="flex gap-2">
              <Button
                variant={wouldMeetAgain === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWouldMeetAgain(true)}
                className="flex-1"
              >
                ❤️ Yes!
              </Button>
              <Button
                variant={wouldMeetAgain === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWouldMeetAgain(false)}
                className="flex-1"
              >
                👋 Not for me
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Save Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
