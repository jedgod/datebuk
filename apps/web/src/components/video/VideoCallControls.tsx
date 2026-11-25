"use client";

import { Mic, MicOff, Video, VideoOff, Phone, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onShowSafety: () => void;
  onEmergency: () => void;
}

export function VideoCallControls({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onShowSafety,
  onEmergency,
}: VideoCallControlsProps) {
  return (
    <div className="flex items-center gap-4 bg-black/70 backdrop-blur-xl px-6 py-4 rounded-full">
      {/* Mute/Unmute */}
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
        }`}
      >
        {isMuted ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Video On/Off */}
      <button
        onClick={onToggleVideo}
        aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
        }`}
      >
        {isVideoOff ? (
          <VideoOff className="w-6 h-6 text-white" />
        ) : (
          <Video className="w-6 h-6 text-white" />
        )}
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        aria-label="End call"
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
      >
        <Phone className="w-7 h-7 text-white rotate-[135deg]" />
      </button>

      {/* Safety/Report */}
      <button
        onClick={onShowSafety}
        aria-label="Safety and reporting options"
        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
      >
        <Shield className="w-6 h-6 text-white" />
      </button>

      {/* Emergency Button */}
      <button
        onClick={onEmergency}
        aria-label="Emergency - call for help"
        className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-all"
      >
        <AlertTriangle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
