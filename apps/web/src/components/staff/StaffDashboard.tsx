// components/staff/StaffDashboard.tsx
"use client";

import { useState } from "react";
import { Bell, Plus, Search, LogOut, MessageSquare, TrendingUp, Eye, Home } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { performLogout } from "@/lib/logout";
import { FeedbackModal } from "./FeedbackModal";
import { PlatformHealth } from "./PlatformHealth";

import { StatsCards } from "./StatsCards";
import { TicketTable } from "./TicketTable";
import { CustomerPanel } from "./CustomerPanel";

type Ticket = {
  id: string;
  customer: string;
  status: string;
  priority: string;
  age: string;
  notes?: string[];
  priorityNote?: string;
  assignedTo?: string;
};

const mockTickets: Ticket[] = [
  {
    id: "12345",
    customer: "John Doe",
    status: "Pending",
    priority: "High",
    age: "12pm",
    notes: ["VIP account, prioritize response"],
    priorityNote: "Live Chat - Product issue - High urgency",
    assignedTo: "You",
  },
  { id: "12346", customer: "Johny Walt", status: "Pending", priority: "Medium", age: "11pm", notes: [] },
  { id: "12347", customer: "Sarah Johnson", status: "In Progress", priority: "High", age: "10am", notes: [] },
  { id: "12348", customer: "Mike Chen", status: "Pending", priority: "Low", age: "9am", notes: [] },
  { id: "12349", customer: "Emily Davis", status: "Resolved", priority: "Medium", age: "Yesterday", notes: [] },
  { id: "12350", customer: "David Brown", status: "Pending", priority: "High", age: "8am", notes: [] },
  { id: "12351", customer: "Lisa Wilson", status: "In Progress", priority: "Medium", age: "7am", notes: [] },
  { id: "12352", customer: "Tom Anderson", status: "Pending", priority: "Low", age: "Yesterday", notes: [] },
  { id: "12353", customer: "Anna Martinez", status: "Pending", priority: "High", age: "6am", notes: [] },
  { id: "12354", customer: "James Taylor", status: "Resolved", priority: "Medium", age: "Yesterday", notes: [] },
];

const mockStats = {
  openTickets: 42,
  aht: "5m 23s",
  csat: "92%",
};

export function StaffDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(mockTickets[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const handleLogout = () => {
    performLogout({
      logout: () => {}, // No-op since performLogout handles cookie clearing
      router,
      redirectTo: "/admin/staff/login",
      toastMessage: "Staff logged out",
    });
  };

  const handleUserSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = tickets.filter(
        (ticket) =>
          ticket.customer.toLowerCase().includes(query.toLowerCase()) ||
          ticket.id.includes(query)
      );
      // Filter results would show, or you could set a searchResults state
    }
  };

  const handleNewTicket = () => {
    const customer = window.prompt("Customer name?");
    if (!customer) return;
    const rawPriority = window.prompt("Priority (High/Medium/Low)?", "Medium") ?? "Medium";
    const priority = ["High", "Medium", "Low"].includes(rawPriority) ? rawPriority : "Medium";
    
    const newTicket: Ticket = {
      id: String(Date.now()),
      customer,
      status: "Pending",
      priority,
      age: "Just now",
      notes: [],
      assignedTo: "You",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
  };

  const handleEndChatResolve = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: "Resolved" } : ticket
      )
    );
  };

  const handleTransfer = (ticketId: string) => {
    const assignee = window.prompt("Transfer to which agent?");
    if (!assignee) return;
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, assignedTo: assignee } : ticket
      )
    );
  };

  const handleAddNote = (ticketId: string, note: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, notes: [...(ticket.notes ?? []), note] }
          : ticket
      )
    );
  };

  const handleUpdatePriorityNote = (ticketId: string, note: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priorityNote: note } : ticket
      )
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Top Bar */}
      <header className="border-b bg-card sticky top-0 z-30 flex h-16 items-center gap-4 px-4 lg:px-6 shrink-0">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets or customers..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchQuery}
              onChange={(e) => handleUserSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeedbackModal(true)}
            className="hidden md:flex gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Feedback
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/staff/performance-leaderboard")}
            className="hidden md:flex gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Rankings
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/staff/tracking-transparency")}
            className="hidden md:flex gap-2"
          >
            <Eye className="h-4 w-4" />
            Privacy
          </Button>

          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]">
              3
            </Badge>
          </Button>

          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@agent" />
            <AvatarFallback>AG</AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="p-4 lg:p-6 border-b space-y-4">
            <StatsCards {...mockStats} />
            <PlatformHealth />
          </div>

          <div className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Queue</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Active: {mockStats.openTickets}</Badge>
                <Button size="sm" onClick={handleNewTicket}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            </div>

            <TicketTable
              tickets={tickets}
              selectedId={selectedTicket?.id}
              onSelect={(ticket) => setSelectedTicketId(ticket.id)}
            />
          </div>
        </main>

        {/* Right contextual panel */}
        {selectedTicket && (
          <div className="hidden w-96 border-l bg-white lg:flex flex-col overflow-y-auto">
            <CustomerPanel
              ticket={selectedTicket}
              onEndChatResolve={handleEndChatResolve}
              onTransfer={handleTransfer}
              onAddNote={handleAddNote}
              onUpdatePriorityNote={handleUpdatePriorityNote}
            />
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div>
  );
}
