'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { VideoDateHeader } from '@/components/video-date/VideoDateHeader';
import { MainVideoFeed } from '@/components/video-date/MainVideoFeed';
import { LocalVideoFeed } from '@/components/video-date/LocalVideoFeed';
import { VideoDateControls } from '@/components/video-date/VideoDateControls';
import { VideoDateChat, type Message } from '@/components/video-date/VideoDateChat';
import { ReportModal, type SafetyReport } from '@/components/video-date/ReportModal';
import { CalendarFollowupFlow, type FollowUpRequest } from '@/components/video-date/CalendarFollowupFlow';
import { PostDateReflection, type DateFeedback } from '@/components/video-date/PostDateReflection';
import { useVideoDate } from '@/hooks/useVideoDate';
import { useCallLocation } from '@/hooks/useCallLocation';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';
import { MapPin } from 'lucide-react';

const SafeMapPin = MapPin as any;

export default function VideoDatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = (params?.roomId as string) || 'unknown';
  const callToken = searchParams?.get('callToken') || undefined;
  const mode = (searchParams?.get('media') === 'voice' ? 'voice' : 'video') as 'voice' | 'video';
  const { location, error: locationError } = useCallLocation();
  const accessToken = useAuth((s) => s.accessToken);

  // WebRTC state
  const {
    localRef,
    remoteRef,
    state,
    error: callError,
    remoteUserId,
    toggleMute,
    toggleVideo,
    endCall,
  } = useVideoDate(roomId, mode, callToken);

  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  // Mock partner data - in production, fetch from API
  const partnerData = {
    name: 'Sarah',
    age: 28,
    verified: true,
    location: 'Fairfax, VA',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  };

  const handleSendMessage = (content: string) => {
    const message: Message = {
      id: Math.random().toString(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    // In production, send via WebRTC data channel or API
    // For now, simulate remote response
    setTimeout(() => {
      const response: Message = {
        id: Math.random().toString(),
        sender: 'remote',
        content: "That's cool! 😊",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handleUseIcebreaker = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleReport = async (report: SafetyReport) => {
    setShowReport(false);
    if (!remoteUserId) {
      setSafetyMessage("Can't identify the other participant yet — try again once the call has connected.");
      return;
    }
    try {
      await api.post(
        '/safety/report',
        {
          userId: remoteUserId,
          category: report.category,
          description: report.description,
          block: report.blockUser,
        },
        accessToken || undefined
      );
      setSafetyMessage('Report submitted. Thanks for keeping our community safe.');
      if (report.endCall || report.blockUser) {
        handleEndCall();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSafetyMessage('Failed to submit report. Please try again.');
    }
  };

  const handleBlock = async () => {
    if (!remoteUserId) {
      setSafetyMessage("Can't identify the other participant yet — try again once the call has connected.");
      return;
    }
    try {
      await api.post('/safety/block', { userId: remoteUserId }, accessToken || undefined);
      setSafetyMessage('User blocked.');
    } catch (error) {
      console.error('Error blocking user:', error);
      setSafetyMessage('Failed to block user. Please try again.');
    } finally {
      handleEndCall();
    }
  };

  const handleFollowup = async (followUp: FollowUpRequest) => {
    try {
      const response = await fetch('/api/date-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: roomId,
          ...followUp,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit follow-up');

      setShowFollowup(false);
      setShowReflection(true);
    } catch (error) {
      console.error('Error submitting follow-up:', error);
    }
  };

  const handleReflection = async (feedback: DateFeedback) => {
    try {
      const response = await fetch('/api/date-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: roomId,
          ...feedback,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setShowReflection(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleEndCall = () => {
    endCall();
    setShowFollowup(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-neutral-100">
      {/* Header */}
      <VideoDateHeader
        recipientName={partnerData.name}
        recipientAge={partnerData.age}
        recipientVerified={partnerData.verified}
        timeElapsed={state.timeElapsed}
        maxDuration={20}
        connectionQuality={state.connectionQuality}
        onReport={() => setShowReport(true)}
        onBlock={() => void handleBlock()}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Feed Section */}
        <div className="flex-1 flex flex-col relative">
          {/* Remote Video */}
          <div className="flex-1 relative">
            <MainVideoFeed
              remoteRef={remoteRef}
              recipientName={partnerData.name}
              recipientLocation={partnerData.location}
            />

            {/* Local Video PiP */}
            <LocalVideoFeed
              localRef={localRef}
              username="You"
              isVerified={true}
              avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=You"
            />
            {callError ? (
              <div className="absolute inset-x-4 top-16 z-30 rounded-lg bg-red-950/90 px-4 py-3 text-sm text-white">
                {callError}. Check browser camera/microphone permissions and try again.
              </div>
            ) : null}
            {safetyMessage ? (
              <div className="absolute inset-x-4 top-16 z-30 rounded-lg bg-neutral-900/90 px-4 py-3 text-sm text-white">
                {safetyMessage}
              </div>
            ) : null}
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
              <SafeMapPin className="h-4 w-4 text-rose-400" />
              {location ? `Your location: ${location.label}` : locationError || 'Detecting your location…'}
            </div>
          </div>

          {/* Chat Sidebar (if visible) */}
          {showChat && (
            <div className="w-72 border-l border-neutral-200 flex flex-col bg-white">
              <VideoDateChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onUseIcebreaker={handleUseIcebreaker}
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <VideoDateControls
        isAudioMuted={state.isAudioMuted}
        isVideoOff={state.isVideoOff}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleIcebreaker={() => setShowChat(true)}
        onMore={() => {}} // TODO: Show more options
        onEndCall={handleEndCall}
      />

      {/* Modals */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
        recipientName={partnerData.name}
      />

      <CalendarFollowupFlow
        isOpen={showFollowup}
        onClose={() => setShowFollowup(false)}
        onSubmit={handleFollowup}
        recipientName={partnerData.name}
      />

      <PostDateReflection
        isOpen={showReflection}
        onClose={() => setShowReflection(false)}
        onSubmit={handleReflection}
        recipientName={partnerData.name}
      />
    </div>
  );
}
