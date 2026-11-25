"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Mail, Calendar, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";

interface Ticket {
  id: string;
  name: string;
  email: string;
  issueType: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function TicketDetailPage() {
  const params = useParams() as { ticketId: string };
  const ticketId = params.ticketId;
  const [newStatus, setNewStatus] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const queryClient = useQueryClient();
  const { accessToken: token } = useAuth();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      const response = await fetch(
        apiEndpoint(`/support/tickets/${ticketId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch ticket");
      return response.json() as Promise<Ticket>;
    },
    enabled: !!token && !!ticketId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(
        apiEndpoint(`/support/tickets/${ticketId}/status`),
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
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setNewStatus("");
    },
  });

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Ticket not found</p>
            <Link href="/admin/support-tickets">
              <Button variant="ghost" className="mt-4">
                Back to Tickets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/support-tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ticket #{ticket.id.slice(0, 8)}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {getIssueTypeLabel(ticket.issueType)} Issue
              </p>
            </div>
          </div>
          <Badge
            className={
              ticket.status === "resolved"
                ? "bg-green-100 text-green-800"
                : ticket.status === "in_progress"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }
          >
            {ticket.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Customer</div>
                    <div className="font-medium">{ticket.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Email</div>
                    <div className="font-medium">{ticket.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Created</div>
                    <div className="font-medium">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t">
                  <MessageSquare className="w-5 h-5 text-slate-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Customer Message
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                      {ticket.message}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add internal notes about this ticket (visible to staff only)..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <Button disabled>
                  Save Note
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  Note: Full notes feature requires backend integration
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  {newStatus && (
                    <Button
                      className="w-full mt-2"
                      onClick={() => updateStatusMutation.mutate(newStatus)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Status"
                      )}
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <a href={`mailto:${ticket.email}`} className="block">
                    <Button variant="outline" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Customer
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Ticket ID:</span>
                  <span className="font-mono text-xs">{ticket.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium">{getIssueTypeLabel(ticket.issueType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Age:</span>
                  <span>
                    {Math.floor(
                      (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60)
                    )}
                    h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
