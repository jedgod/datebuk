"use client";

import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCallTimerProps {
  timeRemaining: number;
  isPremium: boolean;
  onExtend: () => void;
}

export function VideoCallTimer({ timeRemaining, isPremium, onExtend }: VideoCallTimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const isLowTime = timeRemaining <= 30;
  const displayTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-black/70 backdrop-blur-xl text-white px-6 py-3 rounded-2xl flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${isLowTime ? "text-red-400 animate-pulse" : "text-white"}`} />
        <span className={`text-2xl font-bold tabular-nums ${isLowTime ? "text-red-400" : "text-white"}`}>
          {displayTime}
        </span>
      </div>
      
      {!isPremium && timeRemaining <= 60 && (
        <Button
          size="sm"
          onClick={onExtend}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Extend +5 min
        </Button>
      )}
    </div>
  );
}
