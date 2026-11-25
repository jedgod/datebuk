'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  MoreVertical,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SafeMessageCircle = MessageCircle as any;
const SafeSparkles = Sparkles as any;
const SafeVolume2 = Volume2 as any;
const SafeVolumeX = VolumeX as any;
const SafeVideo = Video as any;
const SafeVideoOff = VideoOff as any;
const SafeMoreVertical = MoreVertical as any;
const SafePhone = Phone as any;

interface VideoDateControlsProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onToggleIcebreaker: () => void;
  onMore: () => void;
  onEndCall: () => void;
}

export function VideoDateControls({
  isAudioMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  onToggleIcebreaker,
  onMore,
  onEndCall,
}: VideoDateControlsProps) {
  return (
    <div className="w-full border-t border-neutral-200 bg-white px-4 py-3 flex items-center justify-center gap-3">
      {/* Mute */}
      <Button
        size="lg"
        variant={isAudioMuted ? 'destructive' : 'secondary'}
        className="rounded-full w-12 h-12 p-0"
        onClick={onToggleMute}
      >
        {isAudioMuted ? (
          <SafeVolumeX className="w-5 h-5" />
        ) : (
          <SafeVolume2 className="w-5 h-5" />
        )}
      </Button>

      {/* Camera */}
      <Button
        size="lg"
        variant={isVideoOff ? 'destructive' : 'secondary'}
        className="rounded-full w-12 h-12 p-0"
        onClick={onToggleVideo}
      >
        {isVideoOff ? (
          <SafeVideoOff className="w-5 h-5" />
        ) : (
          <SafeVideo className="w-5 h-5" />
        )}
      </Button>

      {/* Chat */}
      <Button
        size="lg"
        variant="secondary"
        className="rounded-full w-12 h-12 p-0"
        onClick={onToggleChat}
      >
        <SafeMessageCircle className="w-5 h-5" />
      </Button>

      {/* Icebreaker */}
      <Button
        size="lg"
        variant="secondary"
        className="rounded-full w-12 h-12 p-0"
        onClick={onToggleIcebreaker}
      >
        <SafeSparkles className="w-5 h-5" />
      </Button>

      {/* More */}
      <Button
        size="lg"
        variant="secondary"
        className="rounded-full w-12 h-12 p-0"
        onClick={onMore}
      >
        <SafeMoreVertical className="w-5 h-5" />
      </Button>

      {/* End Call - prominent red */}
      <div className="ml-6">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 p-0 bg-red-500 hover:bg-red-600 text-white"
          onClick={onEndCall}
        >
          <SafePhone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}
