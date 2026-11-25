"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

interface IcebreakerPromptProps {
  onDismiss: () => void;
}

const ICEBREAKERS = [
  "What's the most spontaneous thing you've ever done?",
  "If you could travel anywhere right now, where would you go?",
  "What's your go-to karaoke song?",
  "What's something you're really passionate about?",
  "What's the best advice you've ever received?",
  "If you could have dinner with anyone, dead or alive, who would it be?",
  "What's your favorite way to spend a weekend?",
  "What's something that always makes you laugh?",
  "What's a skill you'd love to learn?",
  "What's your favorite childhood memory?",
];

export function IcebreakerPrompt({ onDismiss }: IcebreakerPromptProps) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    // Pick random icebreaker
    const randomPrompt = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
    setPrompt(randomPrompt);
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4">
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-2xl">
        <div className="bg-white rounded-2xl p-6 relative">
          <button
            onClick={onDismiss}
            aria-label="Dismiss icebreaker"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-lg">Icebreaker</h3>
          </div>

          <p className="text-gray-700 text-base leading-relaxed">{prompt}</p>

          <button
            onClick={onDismiss}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
