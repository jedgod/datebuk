"use client";

import { useState } from 'react';
import { FlaggedVideo } from '@/lib/mockVideoData';
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  AlertTriangle,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuarantineVideoReviewProps {
  videos: FlaggedVideo[];
  onRelease?: (videoIds: string[]) => void;
  onDelete?: (videoIds: string[]) => void;
  className?: string;
}

export function QuarantineVideoReview({ 
  videos, 
  onRelease, 
  onDelete,
  className 
}: QuarantineVideoReviewProps) {
  const [selectedVideo, setSelectedVideo] = useState<FlaggedVideo | null>(videos[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(98); // 1:38
  const [duration] = useState(272); // 4:32

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-yellow-400';
  };

  return (
    <div className={cn("flex gap-4 h-[calc(100vh-180px)]", className)}>
      {/* Left Sidebar - Quarantined Items */}
      <div className="w-56 bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Quarantine</h3>
          <p className="text-xs text-slate-400">4, filtering</p>
        </div>

        <div className="space-y-2">
          {videos.slice(0, 3).map((video, index) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={cn(
                "w-full rounded-lg overflow-hidden border-2 transition-all",
                selectedVideo?.id === video.id 
                  ? "border-amber-500 ring-2 ring-amber-500/20" 
                  : "border-transparent hover:border-slate-600"
              )}
            >
              <div className="aspect-video bg-slate-700 relative">
                {/* Placeholder for video thumbnail */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="text-slate-500" size={24} />
                </div>
              </div>
              <div className="p-2 bg-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{index === 0 ? '100:00' : index === 1 ? '20/05' : '20/05'}</span>
                  <span className="text-red-400">{video.severity === 'high' ? 'High Risk' : 'Med Risk'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar icons */}
        <div className="pt-4 space-y-3 border-t border-slate-700">
          <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-slate-400" />
          </button>
          <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
            <User size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Quarantine</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
                Preview
              </button>
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm text-slate-900 font-semibold">
                Roadtest
              </button>
            </div>
          </div>
        </div>

        {/* Video Queue Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Video Quarantine Queue</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white">
                Enlisting
              </button>
              <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex items-center gap-1">
                Risk Scorer <ChevronDown size={12} />
              </button>
              <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex items-center gap-1">
                Resolve <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-2 mt-4 text-xs text-slate-400 uppercase">
            <div className="col-span-1">
              <input type="checkbox" className="rounded" />
            </div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-1">100:03</div>
            <div className="col-span-1">P01</div>
            <div className="col-span-1">P14</div>
            <div className="col-span-1">P1</div>
            <div className="col-span-1">P18</div>
            <div className="col-span-1">OS</div>
            <div className="col-span-2">Heat/Hate</div>
            <div className="col-span-2 text-right">Aura Score</div>
          </div>
        </div>

        {/* Main Video Analysis Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-12 gap-4">
            {/* Keyframes Grid */}
            <div className="col-span-9">
              <div className="grid grid-cols-10 gap-1 mb-4">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "aspect-video rounded",
                      i % 10 === 3 || i % 10 === 4 ? "bg-amber-500/30" : "bg-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Audio Waveform */}
            <div className="col-span-3 flex flex-col gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  {Array.from({ length: 80 }).map((_, i) => {
                    const height = Math.random() * 40 + 10;
                    const y = 30 - height / 2;
                    return (
                      <rect
                        key={i}
                        x={i * 2.5}
                        y={y}
                        width="1.5"
                        height={height}
                        fill="#f59e0b"
                        opacity={0.8}
                      />
                    );
                  })}
                </svg>
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button className="p-1 hover:bg-slate-700 rounded">
                    {isMuted ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-slate-400" />}
                  </button>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  {Array.from({ length: 80 }).map((_, i) => {
                    const height = Math.random() * 30 + 5;
                    const y = 30 - height / 2;
                    return (
                      <rect
                        key={i}
                        x={i * 2.5}
                        y={y}
                        width="1.5"
                        height={height}
                        fill="#f59e0b"
                        opacity={0.6}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Video Timeline */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{formatTime(currentTime)}</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(currentTime / duration) * 100}%, #334155 ${(currentTime / duration) * 100}%, #334155 100%)`
                  }}
                />
              </div>
              <span className="text-sm text-slate-400">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-700 rounded">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-slate-400">
                    <rect x="2" y="2" width="3" height="12" />
                    <rect x="7" y="2" width="3" height="12" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
                >
                  {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">1x</span>
                  <div className="h-4 w-px bg-slate-600" />
                  <button className="p-1 hover:bg-slate-700 rounded">
                    {isMuted ? <VolumeX size={16} className="text-slate-400" /> : <Volume2 size={16} className="text-slate-400" />}
                  </button>
                  <input type="range" min={0} max={100} className="w-16 h-1" />
                </div>

                <span className="text-xs text-slate-400">1 OBH 18</span>
              </div>

              <div className="flex gap-2">
                <button className="p-1 hover:bg-slate-700 rounded">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" className="text-slate-400">
                    <circle cx="8" cy="8" r="6" strokeWidth="1.5" />
                  </svg>
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
                  Perform
                </button>
                <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm text-slate-900 font-semibold">
                  Resotool
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Violation Details */}
      {selectedVideo && (
        <div className="w-80 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Violation</h3>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Confidence</h4>
              
              {/* User Info */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {selectedVideo.userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white">Previous Flag</h5>
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400">High count | 0/50 : 1</p>
                </div>
              </div>

              {/* Violation Scores */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-sm text-white">Nudity (4 flag)</span>
                  <span className={cn("ml-auto text-lg font-bold", getConfidenceColor(92))}>
                    92%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-orange-500" />
                  <span className="text-sm text-white">Explicit Audio Score</span>
                  <span className={cn("ml-auto text-lg font-bold", getConfidenceColor(65))}>
                    65%
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                <div>
                  <h5 className="text-sm font-semibold text-slate-400">Alaide Gomis</h5>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-sm text-slate-300">
                    Seemblan crepay, let's meet privately.
                  </p>
                </div>

                <div>
                  <div className="text-sm">
                    <span className="text-slate-400">Trust Level: </span>
                    <span className="text-white font-semibold">New</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-slate-400">Sope (148 TP)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-slate-700 flex gap-2">
                <button 
                  onClick={() => onDelete?.([selectedVideo.id])}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                >
                  <span>Permanent Delist</span>
                  <ChevronDown size={14} />
                </button>
                <button className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="2" y="2" width="4" height="4" />
                    <rect x="10" y="2" width="4" height="4" />
                    <rect x="2" y="10" width="4" height="4" />
                    <rect x="10" y="10" width="4" height="4" />
                  </svg>
                  Seiat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
