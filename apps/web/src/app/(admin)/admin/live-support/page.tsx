"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Clock, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

interface ActiveChat {
  id: string;
  userName: string;
  userEmail: string;
  status: "active" | "waiting" | "resolved";
  lastMessage: string;
  unreadCount: number;
  startedAt: Date;
}

export default function LiveSupportPage() {
  const [activeChats] = useState<ActiveChat[]>([
    {
      id: "1",
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      status: "active",
      lastMessage: "I can't access my account",
      unreadCount: 2,
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: "2",
      userName: "Mike Chen",
      userEmail: "mike@example.com",
      status: "waiting",
      lastMessage: "Payment not processing",
      unreadCount: 1,
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: "3", 
      userName: "Emma Wilson",
      userEmail: "emma@example.com",
      status: "active",
      lastMessage: "How do I delete my profile?",
      unreadCount: 0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<string | null>(activeChats[0]?.id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "user-1",
      userName: "Sarah Johnson",
      message: "Hi, I'm having trouble accessing my account",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isStaff: false,
    },
    {
      id: "2",
      userId: "staff-1",
      userName: "Support Agent",
      message: "Hello! I'm here to help. Can you tell me what error you're seeing?",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      isStaff: true,
    },
    {
      id: "3",
      userId: "user-1",
      userName: "Sarah Johnson",
      message: "It says 'Invalid credentials' but I'm sure my password is correct",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isStaff: false,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: "staff-current",
      userName: "Support Agent",
      message: message.trim(),
      timestamp: new Date(),
      isStaff: true,
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "waiting":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "resolved":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const selectedChatData = activeChats.find((chat) => chat.id === selectedChat);

  const stats = {
    active: activeChats.filter((c) => c.status === "active").length,
    waiting: activeChats.filter((c) => c.status === "waiting").length,
    avgResponseTime: "2m 15s",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Live Support Chat</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time customer support conversations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-2xl font-bold">{activeChats.length}</div>
                  <div className="text-sm text-slate-600">Total Chats</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-slate-600">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold text-amber-600">{stats.waiting}</div>
                  <div className="text-sm text-slate-600">Waiting</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-lg font-bold">{stats.avgResponseTime}</div>
                  <div className="text-sm text-slate-600">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Active Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {activeChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      selectedChat === chat.id && "bg-slate-50 dark:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{chat.userName}</div>
                          <div className="text-xs text-slate-500">{chat.userEmail}</div>
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white">{chat.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate mb-2">
                      {chat.lastMessage}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(chat.status)} variant="secondary">
                        {chat.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {Math.floor((Date.now() - chat.startedAt.getTime()) / 60000)}m ago
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedChatData?.userName || "Select a chat"}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedChatData?.userEmail}
                  </p>
                </div>
                {selectedChatData && (
                  <Badge className={getStatusColor(selectedChatData.status)}>
                    {selectedChatData.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.isStaff ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        msg.isStaff
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      )}
                    >
                      <div className="text-sm mb-1">{msg.message}</div>
                      <div
                        className={cn(
                          "text-xs",
                          msg.isStaff ? "text-amber-100" : "text-slate-500"
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !selectedChat}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
