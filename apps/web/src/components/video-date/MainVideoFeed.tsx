'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

const SafeMapPin = MapPin as any;

interface MainVideoFeedProps {
  remoteRef: React.RefObject<HTMLVideoElement>;
  recipientName: string;
  recipientLocation: string;
}

export function MainVideoFeed({
  remoteRef,
  recipientName,
  recipientLocation,
}: MainVideoFeedProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 rounded-lg overflow-hidden">
      {/* Video stream */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Location overlay badge */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
        <SafeMapPin className="w-4 h-4 text-red-500" />
        <span className="text-sm text-white font-medium">
          Location: {recipientLocation}
        </span>
      </div>

      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
