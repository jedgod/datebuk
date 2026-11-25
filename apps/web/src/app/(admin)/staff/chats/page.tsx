"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, Paperclip, MoreVertical, Clock, RefreshCw, Users } from "lucide-react";
import { showToast } from "@/lib/toast";

// Mock live chat conversations
const mockChats = [
  {
    id: "1",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    status: "active",
    unread: 2,
    lastMessage: "I need help with my account",
    timestamp: "2 min ago",
    messages: [
      { id: 1, sender: "customer", text: "Hi, I need help with my account", time: "10:30 AM" },
      { id: 2, sender: "agent", text: "Hello Sarah! I'd be happy to help. What seems to be the issue?", time: "10:31 AM" },
      { id: 3, sender: "customer", text: "I can't access my premium features", time: "10:32 AM" },
      { id: 4, sender: "customer", text: "It says my subscription expired but I just renewed it", time: "10:32 AM" },
    ],
  },
  {
    id: "2",
    customer: "Mike Davis",
    email: "mike@example.com",
    status: "active",
    unread: 0,
    lastMessage: "Thanks for your help!",
    timestamp: "5 min ago",
    messages: [
      { id: 1, sender: "customer", text: "My payment failed", time: "10:20 AM" },
      { id: 2, sender: "agent", text: "I can help you with that. Let me check your payment history.", time: "10:21 AM" },
      { id: 3, sender: "customer", text: "Okay, thank you", time: "10:22 AM" },
      { id: 4, sender: "agent", text: "I've resent the payment link. Please try again.", time: "10:25 AM" },
      { id: 5, sender: "customer", text: "Thanks for your help!", time: "10:27 AM" },
    ],
  },
  {
    id: "3",
    customer: "Emma Wilson",
    email: "emma@example.com",
    status: "waiting",
    unread: 1,
    lastMessage: "Are you still there?",
    timestamp: "10 min ago",
    messages: [
      { id: 1, sender: "customer", text: "Hello?", time: "10:15 AM" },
      { id: 2, sender: "customer", text: "Are you still there?", time: "10:22 AM" },
    ],
  },
];

// Mock active agents/users
const mockActiveUsers = [
  { id: "1", name: "Agent Sarah", status: "online", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "2", name: "Agent Mike", status: "busy", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: "3", name: "Agent Lisa", status: "online", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "4", name: "Agent John", status: "away", avatar: "https://i.pravatar.cc/150?img=4" },
];

export default function LiveChatsPage() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [message, setMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState(mockActiveUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

  useEffect(() => {
    // Load active users on mount
    loadActiveUsers();
  }, []);

  const loadActiveUsers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActiveUsers(mockActiveUsers);
      showToast(`Loaded ${mockActiveUsers.length} active users`, { variant: "success" });
    } catch (error) {
      showToast("Failed to load active users", { variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMsg = {
        id: selectedChat.messages.length + 1,
        sender: "agent" as const,
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      // Update the selected chat with new message
      const updatedMessages = [...selectedChat.messages, newMsg];
      setSelectedChat({ ...selectedChat, messages: updatedMessages });
      
      showToast("Message sent", { variant: "success" });
      setMessage("");
    }
  };

  const handleEndChat = () => {
    if (selectedChat) {
      showToast(`Chat with ${selectedChat.customer} ended successfully`, { variant: "success" });
      // You can add logic to mark chat as resolved
    }
  };

  const handleSendToUser = (userId: string) => {
    const user = activeUsers.find(u => u.id === userId);
    if (user && selectedChat) {
      showToast(`Transferring chat with ${selectedChat.customer} to ${user.name}`, { variant: "success" });
      // You can add logic to transfer the chat to another agent
    }
  };

  const activeChats = mockChats.filter((c) => c.status === "active").length;
  const waitingChats = mockChats.filter((c) => c.status === "waiting").length;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Chat List */}
      <div className="flex flex-col border-r lg:w-80">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold mb-4">Live Chats</h1>
          <div className="flex gap-2 mb-4">
            <Badge variant="default" className="bg-green-600">
              {activeChats} Active
            </Badge>
            <Badge variant="outline" className="text-orange-600">
              {waitingChats} Waiting
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadActiveUsers}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowActiveUsers(!showActiveUsers)}
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({activeUsers.length})
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                selectedChat?.id === chat.id ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${chat.email}`} />
                    <AvatarFallback>{chat.customer.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                      chat.status === "active" ? "bg-green-500" : "bg-orange-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">{chat.customer}</p>
                    {chat.unread > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{chat.timestamp}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedChat.email}`} />
                    <AvatarFallback>{selectedChat.customer.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedChat.customer}</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          selectedChat.status === "active" ? "bg-green-500" : "bg-orange-500"
                        }`}
                      />
                      <p className="text-sm text-muted-foreground capitalize">{selectedChat.status}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleEndChat}>
                    End Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowActiveUsers(!showActiveUsers)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Users Panel (Sidebar) */}
            {showActiveUsers && (
              <div className="border-b bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Agents ({activeUsers.length})
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadActiveUsers}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeUsers.map((user) => (
                    <Card 
                      key={user.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSendToUser(user.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                              user.status === 'online' ? 'bg-green-500' : 
                              user.status === 'busy' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${msg.sender === "agent" ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        msg.sender === "agent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
