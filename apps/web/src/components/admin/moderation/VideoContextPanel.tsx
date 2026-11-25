"use client";

import { FlaggedVideo } from '@/lib/mockVideoData';
import { AIScoresBadge, SeverityBadge, TrustLevelBadge } from './AIScoresBadge';
import { VideoPreview } from './VideoPreview';
import { X, AlertTriangle, MessageSquare, Heart, Clock, Flag as FlagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoContextPanelProps {
  video: FlaggedVideo | null;
  onClose: () => void;
}

export function VideoContextPanel({ video, onClose }: VideoContextPanelProps) {
  if (!video) return null;

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      nudity: 'Nudity/Sexual Content',
      explicit_audio: 'Explicit Audio',
      harassment: 'Harassment',
      violence: 'Violence',
      spam: 'Spam',
      underage: 'Underage Concern',
      other: 'Other Violation'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{video.userName}</h3>
          <p className="text-xs text-slate-400">{video.userEmail}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded" title="Close panel">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* User Info */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Intent</span>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-semibold capitalize",
              video.userIntent === 'faith' ? 'bg-purple-100 text-purple-700' :
              video.userIntent === 'casual' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            )}>
              {video.userIntent}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trust Level</span>
            <TrustLevelBadge level={video.userTrustLevel} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Previous Flags</span>
            <span className={cn(
              "text-sm font-semibold",
              video.previousFlags > 3 ? 'text-red-600' : 'text-slate-700'
            )}>
              {video.previousFlags} infractions
            </span>
          </div>
        </div>

        {/* Flag Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <FlagIcon size={16} className="text-red-600" />
            Violation Details
          </h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-900">Reason</span>
              <span className="text-sm font-semibold text-red-700">{getReasonLabel(video.flagReason)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-900">Severity</span>
              <SeverityBadge severity={video.severity} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-900">Reports</span>
              <span className="text-sm font-semibold text-red-700">{video.reportCount} users</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-900">Flagged</span>
              <span className="text-xs text-red-600">{formatTimeAgo(video.flaggedAt)}</span>
            </div>
          </div>
        </div>

        {/* AI Scores */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            AI Analysis
          </h4>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <AIScoresBadge
              nudity={video.aiScores.nudityProbability}
              explicitAudio={video.aiScores.explicitAudioScore}
              violence={video.aiScores.violenceScore}
              overallRisk={video.aiScores.overallRiskScore}
            />
          </div>
        </div>

        {/* Video Preview */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Video Preview</h4>
          <VideoPreview
            videoUrl={video.videoId}
            keyframes={video.keyframes}
            audioWaveform={video.audioWaveform}
            violationTimestamps={video.violationTimestamps}
            duration={video.duration}
          />
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Clock size={12} />
            Duration: {Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Recent Chat */}
        {video.recentMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare size={16} />
              Recent Chat
            </h4>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {video.recentMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-slate-700">{msg.text}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatTimeAgo(msg.time)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Details */}
        {video.matchDetails && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Heart size={16} />
              Match Info
            </h4>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                Matched with <span className="font-semibold">{video.matchDetails.matchedWith}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatTimeAgo(video.matchDetails.matchDate)}
              </p>
            </div>
          </div>
        )}

        {/* Reporter Notes */}
        {video.reporterNotes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Reporter Notes</h4>
            <div className="space-y-1">
              {video.reporterNotes.map((note, idx) => (
                <div key={idx} className="bg-amber-50 border-l-2 border-amber-500 p-2 text-sm text-amber-900">
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
