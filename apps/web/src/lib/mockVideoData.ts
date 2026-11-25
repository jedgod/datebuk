// Mock data types for video moderation
export type VideoFlagReason = 'nudity' | 'explicit_audio' | 'harassment' | 'violence' | 'spam' | 'underage' | 'other';
export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'quarantined';
export type UserIntent = 'faith' | 'casual' | 'professional';

export interface AIScores {
  nudityProbability: number;
  explicitAudioScore: number;
  violenceScore: number;
  overallRiskScore: number;
}

export interface FlaggedVideo {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userIntent: UserIntent;
  userTrustLevel: 'new' | 'low' | 'medium' | 'high';
  previousFlags: number;
  
  videoId: string;
  thumbnailUrl: string;
  duration: number; // seconds
  uploadedAt: Date;
  flaggedAt: Date;
  
  aiScores: AIScores;
  flagReason: VideoFlagReason;
  severity: FlagSeverity;
  reportCount: number;
  reporterNotes: string[];
  
  status: ReviewStatus;
  isLive: boolean;
  
  // Video analysis
  keyframes: string[]; // URLs to keyframe thumbnails
  audioWaveform: number[]; // Waveform data points
  violationTimestamps: number[]; // Seconds where violations detected
  
  // Context
  recentMessages: { time: Date; text: string }[];
  matchDetails?: { matchedWith: string; matchDate: Date };
  
  // Optional UI properties
  userAvatar?: string;
  age?: number;
  sessionId?: string;
  // Convenience aliases for backward compatibility
  trustLevel?: 'new' | 'low' | 'medium' | 'high';
  intent?: string;
  nudity?: number;
  explicitAudio?: number;
  violence?: number;
  riskScore?: number;
  timestamp?: Date;
  recentChat?: string;
}

// Mock data generator
export function generateMockFlaggedVideos(count: number): FlaggedVideo[] {
  const reasons: VideoFlagReason[] = ['nudity', 'explicit_audio', 'harassment', 'violence', 'spam'];
  const severities: FlagSeverity[] = ['low', 'medium', 'high', 'critical'];
  const intents: UserIntent[] = ['faith', 'casual', 'professional'];
  const trustLevels: Array<'new' | 'low' | 'medium' | 'high'> = ['new', 'low', 'medium', 'high'];
  const names = ['Emma L.', 'Mark R.', 'Luna F.', 'Jason M.', 'Faith G.', 'Alex K.', 'Sarah P.', 'David T.'];
  
  return Array.from({ length: count }, (_, i) => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const nudityScore = reason === 'nudity' ? 70 + Math.random() * 30 : Math.random() * 40;
    const audioScore = reason === 'explicit_audio' ? 80 + Math.random() * 20 : Math.random() * 50;
    const violenceScore = reason === 'violence' ? 75 + Math.random() * 25 : Math.random() * 30;
    const riskScore = Math.max(nudityScore, audioScore, violenceScore);
    
    return {
      id: `video-${i + 1}`,
      userId: `user-${100 + i}`,
      userName: names[i % names.length],
      userEmail: `${names[i % names.length].toLowerCase().replace(/\s/g, '')}@example.com`,
      userIntent: intents[i % intents.length],
      userTrustLevel: trustLevels[Math.floor(Math.random() * trustLevels.length)],
      previousFlags: Math.floor(Math.random() * 10),
      
      videoId: `vid-${1000 + i}`,
      thumbnailUrl: `/api/placeholder/200/150?text=Video+${i + 1}`,
      duration: 30 + Math.random() * 600, // 30s to 10min
      uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      flaggedAt: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
      
      aiScores: {
        nudityProbability: Math.round(nudityScore),
        explicitAudioScore: Math.round(audioScore),
        violenceScore: Math.round(violenceScore),
        overallRiskScore: Math.round(riskScore),
      },
      flagReason: reason,
      severity,
      reportCount: Math.floor(Math.random() * 10) + 1,
      reporterNotes: [
        'Inappropriate content detected',
        'User behavior concerning',
        'Content violates community guidelines'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      
      status: 'pending',
      isLive: Math.random() > 0.8,
      
      keyframes: Array.from({ length: 6 }, (_, k) => `/api/placeholder/100/75?text=Frame+${k + 1}`),
      audioWaveform: Array.from({ length: 50 }, () => Math.random() * 100),
      violationTimestamps: [15.2, 45.8, 120.5].filter(() => Math.random() > 0.5),
      
      recentMessages: [
        { time: new Date(Date.now() - 5 * 60 * 1000), text: 'Just met, are you alone?' },
        { time: new Date(Date.now() - 3 * 60 * 1000), text: 'Can you show me more?' }
      ],
      matchDetails: {
        matchedWith: names[(i + 1) % names.length],
        matchDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    };
  });
}
