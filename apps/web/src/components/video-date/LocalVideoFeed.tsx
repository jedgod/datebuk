'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

const SafeCheckCircle2 = CheckCircle2 as any;

interface LocalVideoFeedProps {
  localRef: React.RefObject<HTMLVideoElement>;
  username: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export function LocalVideoFeed({
  localRef,
  username,
  isVerified,
  avatarUrl,
}: LocalVideoFeedProps) {
  return (
    <div className="absolute bottom-4 right-4 w-24 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg">
      {/* PiP video */}
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Avatar + Verified badge overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent flex flex-col items-center justify-start p-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{username[0]}</AvatarFallback>
        </Avatar>
        {isVerified && (
          <SafeCheckCircle2 className="w-4 h-4 text-green-400 mt-1" />
        )}
      </div>

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p className="text-xs text-white font-medium truncate">{username}</p>
      </div>
    </div>
  );
}
