'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Flag, Volume2, VolumeX, Video, VideoOff, MessageCircle, Clock, GaugeCircle, MoreVertical, PhoneOff } from 'lucide-react';
import { designTokens } from '@/lib/design-tokens';

const SafeHeart = Heart as any;
const SafeFlag = Flag as any;
const SafeClock = Clock as any;

interface VideoDateHeaderProps {
  recipientName: string;
  recipientAge: number;
  recipientVerified: boolean;
  timeElapsed: number;
  maxDuration: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  onReport: () => void;
  onBlock: () => void;
}

export function VideoDateHeader({
  recipientName,
  recipientAge,
  recipientVerified,
  timeElapsed,
  maxDuration,
  connectionQuality,
  onReport,
  onBlock,
}: VideoDateHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const qualityColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  const canExtend = timeElapsed < maxDuration * 60 * 0.8;

  return (
    <div className="w-full border-b border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        {/* Left: Person info */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold text-neutral-900">
              {recipientName}, {recipientAge}
            </h2>
            <p className="text-sm text-neutral-600">
              {recipientVerified && '✓ Verified'}
            </p>
          </div>
        </div>

        {/* Center: Time + Connection + Can Extend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SafeClock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-mono">
              {formatTime(timeElapsed)} / {formatTime(maxDuration * 60)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${qualityColors[connectionQuality]}`} />
            <span className="text-sm capitalize font-medium text-neutral-700">
              {connectionQuality} Connection
            </span>
          </div>
          {canExtend && (
            <Badge variant="secondary" className="text-xs">
              Both can extend
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReport}
            className="flex items-center gap-1"
          >
            <SafeFlag className="w-4 h-4" />
            Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onBlock}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <SafeHeart className="w-4 h-4" />
            Block
          </Button>
        </div>
      </div>

      {/* Purpose & Values */}
      <div className="flex items-center gap-4 text-xs text-neutral-600">
        <div>📍 <strong>Purpose:</strong> Looking for something lasting</div>
        <div>✨ <strong>Values:</strong> Honesty, Growth, Adventure</div>
      </div>
    </div>
  );
}
