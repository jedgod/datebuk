'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Zap } from 'lucide-react';

const SafeSend = Send as any;
const SafeMessageCircle = MessageCircle as any;
const SafeZap = Zap as any;

export interface Message {
  id: string;
  sender: 'user' | 'remote';
  content: string;
  timestamp: Date;
}

interface VideoDateChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onUseIcebreaker: (prompt: string) => void;
}

export function VideoDateChat({
  messages,
  onSendMessage,
  onUseIcebreaker,
}: VideoDateChatProps) {
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const icebreakers = [
    "What's your hidden talent?",
    "Dream vacation destination?",
    "Favorite childhood memory?",
    "What makes you laugh the most?",
    "Most adventurous thing you've done?",
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-neutral-200">
      <Tabs defaultValue="chat" className="flex flex-col flex-1 h-full">
        {/* Tab Headers */}
        <TabsList className="w-full rounded-none border-b border-neutral-200 px-4 pt-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <SafeMessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="icebreakers" className="flex items-center gap-2">
            <SafeZap className="w-4 h-4" />
            Icebreakers
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-col flex-1 p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t border-neutral-200 p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Say something..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                className="px-3"
              >
                <SafeSend className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Icebreakers Tab */}
        <TabsContent value="icebreakers" className="flex-1 p-4 m-0">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              <p className="text-xs text-neutral-600 mb-3">
                💡 Click to share an icebreaker question
              </p>
              {icebreakers.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => onUseIcebreaker(prompt)}
                >
                    <SafeZap className="w-3 h-3 mr-2 flex-shrink-0 text-amber-500" />
                  <span className="text-xs">{prompt}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
