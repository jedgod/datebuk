/**
 * Video Moderation API Types
 * Matches the recommended API specification
 */

export interface VideoModerationItem {
  video_id: string;
  user_id: string;
  match_id: string | null;
  duration_sec: number;
  created_at: string;
  status: "pending" | "in_review" | "approved" | "flagged" | "escalated";
  ai_scores: {
    nudity: number;
    explicit_audio: number;
    violence: number;
    deepfake: number;
  };
  flags: string[];
  report_count: number;
  priority: "low" | "medium" | "high" | "critical";
  thumbnail_url: string;
  keyframe_urls: string[];
  waveform_url: string | null;
  context: {
    intent: string;
    last_message_snippet: string;
  };
  // Legacy fields for backwards compatibility
  _legacy?: {
    id: string;
    userName: string;
    userEmail: string;
    userTrustLevel: string;
    uploadedAt: string;
    flaggedAt: string;
    audioWaveform: number[];
    violationTimestamps: number[];
    isLive: boolean;
    matchDetails: any;
  };
}

export interface VideoQueueResponse {
  data: VideoModerationItem[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  };
}

export interface VideoModerationMetrics {
  pending: number;
  inReview: number;
  approved: number;
  flagged: number;
  escalated: number;
  liveCount: number;
  avgHandleSeconds: number;
  total: number;
}

export type VideoModerationDecision = "approved" | "flagged" | "escalated";

export interface VideoQueueFilters {
  status?: string;
  severity?: string;
  minRiskScore?: number;
  isLive?: boolean;
  page?: number;
  limit?: number;
}
