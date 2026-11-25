"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  videoUrl: string;
  keyframes: string[];
  audioWaveform: number[];
  violationTimestamps: number[];
  duration: number;
  className?: string;
}

export function VideoPreview({ 
  videoUrl, 
  keyframes, 
  audioWaveform, 
  violationTimestamps, 
  duration,
  className 
}: VideoPreviewProps) {
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (timestamp: number) => {
    setCurrentTime(timestamp);
    const frameIndex = Math.floor((timestamp / duration) * keyframes.length);
    setSelectedFrame(Math.min(frameIndex, keyframes.length - 1));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Keyframe Mosaic */}
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-px bg-slate-800">
          {keyframes.map((frame, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedFrame(idx);
                setCurrentTime((idx / keyframes.length) * duration);
              }}
              className={cn(
                "relative aspect-video bg-slate-700 hover:ring-2 hover:ring-amber-500 transition-all",
                selectedFrame === idx && "ring-2 ring-amber-500"
              )}
            >
              <div className="w-full h-full bg-slate-600 flex items-center justify-center text-xs text-slate-400">
                Frame {idx + 1}
              </div>
              {/* Violation indicator */}
              {violationTimestamps.some(ts => 
                Math.abs(ts - (idx / keyframes.length) * duration) < duration / keyframes.length
              ) && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Waveform */}
      <div className="bg-slate-100 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 size={14} className="text-slate-600" />
          <span className="text-xs font-medium text-slate-700">Audio Analysis</span>
        </div>
        <div className="flex items-end justify-between h-16 gap-px">
          {audioWaveform.map((amplitude, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 rounded-t transition-all",
                amplitude > 70 ? "bg-red-500" : amplitude > 40 ? "bg-amber-500" : "bg-slate-400"
              )}
              style={{ height: `${amplitude}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Scrubber with violation markers */}
      <div className="space-y-2">
        <div className="relative h-2 bg-slate-200 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            handleSeek(percentage * duration);
          }}
        >
          {/* Progress */}
          <div 
            className="absolute left-0 top-0 h-full bg-amber-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Violation markers */}
          {violationTimestamps.map((ts, idx) => (
            <div
              key={idx}
              className="absolute top-0 w-1 h-full bg-red-600 rounded-full"
              style={{ left: `${(ts / duration) * 100}%` }}
              title={`Violation at ${formatTime(ts)}`}
            />
          ))}
          
          {/* Playhead */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-amber-500 rounded-full shadow-lg"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{formatTime(currentTime)}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
          <span className={cn(
            "font-medium",
            violationTimestamps.length > 0 ? "text-red-600" : "text-green-600"
          )}>
            {violationTimestamps.length} violations
          </span>
        </div>
      </div>
    </div>
  );
}
