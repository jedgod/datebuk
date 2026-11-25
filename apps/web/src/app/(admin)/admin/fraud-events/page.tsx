"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { StatCard } from "@/components/admin/StatCard";
import { FraudEventsChart } from "@/components/admin/FraudEventsChart";
import { adminApi } from "@/lib/api";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FraudEventsPage() {
  const token = localStorage.getItem("auth_token") || undefined;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-fraud-stats"],
    queryFn: () => adminApi.getFraudStats(token),
    refetchInterval: 30000,
  });

  // Mock fraud events data - replace with actual API response
  const mockEvents = [
    {
      id: "evt_001",
      eventType: "suspicious_login",
      userId: "user_123",
      email: "john.doe@example.com",
      riskScore: 85,
      action: "blocked",
      status: "pending",
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100",
      details: "Multiple failed login attempts from new location",
    },
    {
      id: "evt_002",
      eventType: "profile_manipulation",
      userId: "user_456",
      email: "jane.smith@example.com",
      riskScore: 72,
      action: "flagged",
      status: "reviewed",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: "10.0.0.50",
      details: "Rapid profile changes detected",
    },
    {
      id: "evt_003",
      eventType: "payment_fraud",
      userId: "user_789",
      email: "bob.johnson@example.com",
      riskScore: 95,
      action: "blocked",
      status: "confirmed",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: "172.16.0.25",
      details: "Stolen credit card detected",
    },
  ];

  const filteredEvents = mockEvents.filter((event) => {
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      event.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalEvents = (stats as any)?.totalEvents ?? 0;
  const pendingReviews = mockEvents.filter((e) => e.status === "pending").length;
  const blockedCount = mockEvents.filter((e) => e.action === "blocked").length;
  const fraudRate = (stats as any)?.fraudRate ?? 0;

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      reviewed: "bg-blue-100 text-blue-800",
      confirmed: "bg-red-100 text-red-800",
      dismissed: "bg-green-100 text-green-800",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getActionBadge = (action: string) => {
    const styles = {
      blocked: "bg-red-100 text-red-800",
      flagged: "bg-amber-100 text-amber-800",
      allowed: "bg-green-100 text-green-800",
    };
    return styles[action as keyof typeof styles] || styles.flagged;
  };

  const handleApprove = async (eventId: string) => {
    try {
      await adminApi.provideFraudFeedback(eventId, "legitimate", "Approved by admin", token);
      alert("Event marked as legitimate");
    } catch (error) {
      alert("Failed to approve event");
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      await adminApi.provideFraudFeedback(eventId, "fraud", "Confirmed fraud by admin", token);
      alert("Event confirmed as fraud");
    } catch (error) {
      alert("Failed to reject event");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Fraud Event Management
          </h1>
          <p className="text-slate-600 mt-2">
            Review and manage fraud detection events
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events (24h)"
            value={totalEvents}
            trend="+8.5%"
            isPositive={false}
            icon={AlertTriangle}
          />
          <StatCard
            title="Pending Reviews"
            value={pendingReviews}
            trend="+3"
            variant="warning"
            icon={Clock}
          />
          <StatCard
            title="Blocked Events"
            value={blockedCount}
            trend="+12"
            variant="destructive"
            icon={XCircle}
          />
          <StatCard
            title="Fraud Rate"
            value={`${fraudRate}%`}
            trend="-0.5%"
            isPositive
            icon={CheckCircle}
          />
        </div>

        {/* Fraud Events Chart */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            24-Hour Fraud Trend
          </h2>
          <FraudEventsChart data={(stats as any)?.hourly} isLoading={isLoading} />
        </div>

        {/* Filters & Search */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All Events
              </Button>
              <Button
                variant={statusFilter === "pending" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "reviewed" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("reviewed")}
              >
                Reviewed
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmed")}
              >
                Confirmed
              </Button>
            </div>
            <Input
              placeholder="Search by user, ID, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-80"
            />
          </div>
        </div>

        {/* Events Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">
              Fraud Events
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Event ID
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    User
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Risk Score
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Action
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Time
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-900">
                          {event.id}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {event.email}
                          </p>
                          <p className="text-sm text-slate-500">
                            {event.userId}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700 capitalize">
                          {event.eventType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">
                            {event.riskScore}
                          </span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 w-16">
                            <div
                              className={`h-2 rounded-full ${
                                event.riskScore >= 70
                                  ? "bg-red-600"
                                  : event.riskScore >= 40
                                  ? "bg-amber-500"
                                  : "bg-green-600"
                              }`}
                              style={{ width: `${event.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getActionBadge(
                            event.action
                          )}`}
                        >
                          {event.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {event.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(event.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(event.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No fraud events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Details Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.slice(0, 2).map((event) => (
            <div key={event.id} className="rounded-lg border bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {event.eventType.replace("_", " ").toUpperCase()}
                  </h3>
                  <p className="text-sm text-slate-600">{event.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                    event.status
                  )}`}
                >
                  {event.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">User:</span>
                  <span className="font-medium text-slate-900">
                    {event.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IP Address:</span>
                  <span className="font-mono text-slate-900">
                    {event.ipAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Risk Score:</span>
                  <span className="font-bold text-slate-900">
                    {event.riskScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Action Taken:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionBadge(
                      event.action
                    )}`}
                  >
                    {event.action}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-700">{event.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
