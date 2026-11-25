"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Download, X, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type Ticket = {
  id: string;
  customer: string;
  email: string;
  status: string;
  priority: string;
  category: string;
  created: string;
  assignedTo: string;
  notes?: string[];
  priorityNote?: string;
};

// Mock data for all support tickets
const allTickets: Ticket[] = [
  { id: "12345", customer: "John Doe", email: "john@example.com", status: "Open", priority: "High", category: "Technical", created: "2 hours ago", assignedTo: "You", notes: [], priorityNote: "VIP account" },
  { id: "12346", customer: "Jane Smith", email: "jane@example.com", status: "In Progress", priority: "Medium", category: "Billing", created: "4 hours ago", assignedTo: "Sarah K.", notes: ["Awaiting invoice"] },
  { id: "12347", customer: "Bob Johnson", email: "bob@example.com", status: "Open", priority: "Low", category: "General", created: "5 hours ago", assignedTo: "Unassigned", notes: [] },
  { id: "12348", customer: "Alice Williams", email: "alice@example.com", status: "Resolved", priority: "High", category: "Technical", created: "1 day ago", assignedTo: "You", notes: ["Resolved successfully"] },
  { id: "12349", customer: "Charlie Brown", email: "charlie@example.com", status: "Open", priority: "Medium", category: "Account", created: "2 days ago", assignedTo: "Mike T.", notes: [] },
  { id: "12350", customer: "Diana Prince", email: "diana@example.com", status: "In Progress", priority: "High", category: "Technical", created: "3 hours ago", assignedTo: "You", notes: [], priorityNote: "High priority client" },
  { id: "12351", customer: "Ethan Hunt", email: "ethan@example.com", status: "Open", priority: "Low", category: "Billing", created: "6 hours ago", assignedTo: "Unassigned", notes: [] },
  { id: "12352", customer: "Fiona Green", email: "fiona@example.com", status: "Resolved", priority: "Medium", category: "General", created: "3 days ago", assignedTo: "Sarah K.", notes: [] },
  { id: "12353", customer: "George Martin", email: "george@example.com", status: "Open", priority: "High", category: "Technical", created: "1 hour ago", assignedTo: "You", notes: [] },
  { id: "12354", customer: "Hannah Lee", email: "hannah@example.com", status: "In Progress", priority: "Medium", category: "Account", created: "8 hours ago", assignedTo: "Mike T.", notes: ["Pending customer response"] },
];

export default function AllTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newNote, setNewNote] = useState("");

  const filteredTickets = allTickets.filter((ticket) => {
    const matchesSearch =
      ticket.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority.toLowerCase() === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: allTickets.length,
    open: allTickets.filter((t) => t.status === "Open").length,
    inProgress: allTickets.filter((t) => t.status === "In Progress").length,
    resolved: allTickets.filter((t) => t.status === "Resolved").length,
  };

  const handleAddNote = () => {
    if (!selectedTicket || !newNote.trim()) return;
    const updatedTicket = {
      ...selectedTicket,
      notes: [...(selectedTicket.notes ?? []), newNote],
    };
    setSelectedTicket(updatedTicket);
    setNewNote("");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Tickets ({filteredTickets.length})</h1>
          <p className="text-muted-foreground">All support tickets across the platform</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, email, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </CardContent>
      </Card>

      {/* Main content + Details panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tickets Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedTicket?.id === ticket.id ? "bg-muted" : ""
                      }`}
                    >
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell>
                        <div>{ticket.customer}</div>
                        <div className="text-xs text-muted-foreground">{ticket.email}</div>
                      </TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.status === "Open"
                              ? "destructive"
                              : ticket.status === "In Progress"
                              ? "default"
                              : "outline"
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.priority === "High"
                              ? "destructive"
                              : ticket.priority === "Medium"
                              ? "default"
                              : "outline"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.assignedTo}</TableCell>
                      <TableCell className="text-muted-foreground">{ticket.created}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={selectedTicket?.id === ticket.id ? "primary" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details Panel */}
        {selectedTicket && (
          <Card className="lg:col-span-1 h-fit sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedTicket.customer}`} />
                    <AvatarFallback>{selectedTicket.customer.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedTicket.customer}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ticket Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">TICKET ID</p>
                  <p className="font-mono text-sm">#{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">STATUS</p>
                  <Badge
                    variant={
                      selectedTicket.status === "Open"
                        ? "destructive"
                        : selectedTicket.status === "In Progress"
                        ? "default"
                        : "outline"
                    }
                  >
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">PRIORITY</p>
                  <Badge
                    variant={
                      selectedTicket.priority === "High"
                        ? "destructive"
                        : selectedTicket.priority === "Medium"
                        ? "default"
                        : "outline"
                    }
                  >
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">CATEGORY</p>
                  <p className="text-sm">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">ASSIGNED TO</p>
                  <p className="text-sm">{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">CREATED</p>
                  <p className="text-sm">{selectedTicket.created}</p>
                </div>
              </div>

              <Separator />

              {/* Priority Note */}
              {selectedTicket.priorityNote && (
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
                    <AlertCircle className="h-3 w-3" /> PRIORITY NOTE
                  </p>
                  <p className="text-sm bg-amber-50 dark:bg-amber-950 p-2 rounded">
                    {selectedTicket.priorityNote}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">INTERNAL NOTES</p>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {(selectedTicket.notes ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No notes yet</p>
                  ) : (
                    (selectedTicket.notes ?? []).map((note, idx) => (
                      <div key={idx} className="bg-muted p-2 rounded text-sm">
                        {note}
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <Button size="sm" onClick={handleAddNote} className="w-full">
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button className="w-full" size="sm">
                  Assign Ticket
                </Button>
                <Button className="w-full" size="sm" variant="outline">
                  Change Status
                </Button>
                <Button className="w-full" size="sm" variant="outline">
                  Resolve Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
