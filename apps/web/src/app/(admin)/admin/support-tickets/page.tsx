"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";
import Link from "next/link";

interface Ticket {
  id: string;
  name: string;
  email: string;
  issueType: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function SupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { accessToken: token } = useAuth();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets", statusFilter],
    queryFn: async () => {
      const response = await fetch(
        apiEndpoint(`/support/tickets${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch tickets");
      return response.json() as Promise<Ticket[]>;
    },
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(
        apiEndpoint(`/support/tickets/${id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  const filteredTickets = tickets?.filter((ticket) =>
    ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      open: {
        label: "Open",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: Clock,
      },
      in_progress: {
        label: "In Progress",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        icon: MessageSquare,
      },
      resolved: {
        label: "Resolved",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: CheckCircle,
      },
      closed: {
        label: "Closed",
        className: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        icon: XCircle,
      },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge className={cn("flex items-center gap-1", config.className)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      account: "Account",
      payment: "Payment",
      technical: "Technical",
      safety: "Safety",
      feedback: "Feedback",
      other: "Other",
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and respond to user support requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Tickets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Resolved</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets Table */}
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets?.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono text-xs">
                            {ticket.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">{ticket.name}</TableCell>
                          <TableCell className="text-sm">{ticket.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getIssueTypeLabel(ticket.issueType)}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/admin/support-tickets/${ticket.id}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                              {ticket.status === "open" && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: ticket.id,
                                      status: "in_progress",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Start
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
