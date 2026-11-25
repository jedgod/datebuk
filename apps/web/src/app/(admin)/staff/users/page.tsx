"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Phone, MessageSquare, History } from "lucide-react";
import { showToast } from "@/lib/toast";

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    status: "Active",
    joinedDate: "Jan 15, 2024",
    tickets: 3,
    lastSeen: "2 hours ago",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 234-5678",
    status: "Active",
    joinedDate: "Feb 20, 2024",
    tickets: 1,
    lastSeen: "1 day ago",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "+1 (555) 345-6789",
    status: "Inactive",
    joinedDate: "Dec 10, 2023",
    tickets: 5,
    lastSeen: "1 week ago",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@example.com",
    phone: "+1 (555) 456-7890",
    status: "Active",
    joinedDate: "Mar 5, 2024",
    tickets: 2,
    lastSeen: "30 minutes ago",
  },
];

export default function UsersSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
  );

  const handleEmail = () => {
    if (selectedUser) {
      window.location.href = `mailto:${selectedUser.email}?subject=Support Follow-up&body=Hi ${selectedUser.name},%0D%0A%0D%0A`;
      showToast(`Opening email to ${selectedUser.name}`, { variant: "success" });
    }
  };

  const handleCall = () => {
    if (selectedUser) {
      window.location.href = `tel:${selectedUser.phone}`;
      showToast(`Calling ${selectedUser.name} at ${selectedUser.phone}`, { variant: "success" });
    }
  };

  const handleMessage = () => {
    if (selectedUser) {
      showToast(`Opening chat with ${selectedUser.name}...`, { variant: "success" });
      // You can integrate with your live chat system here
      // e.g., router.push(`/staff/chats?user=${selectedUser.id}`);
      setTimeout(() => {
        // Simulate opening chat after delay
        window.location.href = `/staff/chats?user=${selectedUser.id}`;
      }, 500);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Search Results */}
      <div className="flex flex-col border-r lg:w-96">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold mb-4">Users Search</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="h-12 w-12 mb-2" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedUser?.id === user.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{user.name}</p>
                          <Badge variant={user.status === "Active" ? "default" : "outline"} className="ml-2">
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.tickets} tickets</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - User Details */}
      <div className="flex-1 overflow-auto p-6">
        {selectedUser ? (
          <div className="space-y-6">
            {/* User Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedUser.email}`} />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">{selectedUser.name}</CardTitle>
                      <Badge variant={selectedUser.status === "Active" ? "default" : "outline"}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{selectedUser.email}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">Last seen: {selectedUser.lastSeen}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="secondary" onClick={handleCall}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="secondary" onClick={handleMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="text-sm">{selectedUser.joinedDate}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold">{selectedUser.tickets}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                    <p className="text-2xl font-bold text-orange-600">1</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved Tickets</p>
                    <p className="text-2xl font-bold text-green-600">{selectedUser.tickets - 1}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ticket #12345 created</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ticket #12340 resolved</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Search className="mx-auto h-12 w-12 mb-4" />
              <p>Select a user to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
