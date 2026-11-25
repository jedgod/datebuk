"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { StatCard } from "@/components/admin/StatCard";
import { adminApi } from "@/lib/api";
import { Clock, CheckCircle, AlertTriangle, TrendingUp, User } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ModeratorQueuePage() {
  const token = localStorage.getItem("auth_token") || undefined;
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: queueData, isLoading } = useQuery({
    queryKey: ["moderator-queue"],
    queryFn: () => adminApi.getModeratorQueue(token),
    refetchInterval: 30000,
  });

  const { data: queueStats } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: () => adminApi.getQueueStats(token),
    refetchInterval: 30000,
  });

  // Mock queue items - replace with actual API response
  const mockQueueItems = [
    {
      id: "queue_001",
      userId: "user_123",
      email: "john.doe@example.com",
      reason: "Suspicious profile photos",
      priority: "high",
      status: "pending",
      assignedTo: null,
      waitTime: "2h 15m",
      timestamp: new Date(Date.now() - 8100000).toISOString(),
    },
    {
      id: "queue_002",
      userId: "user_456",
      email: "jane.smith@example.com",
      reason: "Multiple user reports",
      priority: "urgent",
      status: "assigned",
      assignedTo: "mod_sarah",
      waitTime: "45m",
      timestamp: new Date(Date.now() - 2700000).toISOString(),
    },
    {
      id: "queue_003",
      userId: "user_789",
      email: "bob.johnson@example.com",
      reason: "Inappropriate messages",
      priority: "medium",
      status: "pending",
      assignedTo: null,
      waitTime: "5h 30m",
      timestamp: new Date(Date.now() - 19800000).toISOString(),
    },
    {
      id: "queue_004",
      userId: "user_321",
      email: "alice.williams@example.com",
      reason: "Fake profile suspected",
      priority: "low",
      status: "pending",
      assignedTo: null,
      waitTime: "1h 10m",
      timestamp: new Date(Date.now() - 4200000).toISOString(),
    },
  ];

  // Mock moderator leaderboard
  const mockModerators = [
    { id: "mod_sarah", name: "Sarah Chang", reviewsToday: 24, accuracy: 98 },
    { id: "mod_mike", name: "Mike Peterson", reviewsToday: 19, accuracy: 95 },
    { id: "mod_lisa", name: "Lisa Kumar", reviewsToday: 16, accuracy: 97 },
  ];

  const filteredQueue = mockQueueItems.filter((item) => {
    const matchesPriority =
      priorityFilter === "all" || item.priority === priorityFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const pendingCount = mockQueueItems.filter((i) => i.status === "pending").length;
  const assignedCount = mockQueueItems.filter((i) => i.status === "assigned").length;
  const urgentCount = mockQueueItems.filter((i) => i.priority === "urgent").length;
  const avgWaitTime = "3h 12m";

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: "bg-red-600 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-amber-500 text-white",
      low: "bg-blue-500 text-white",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      assigned: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const handleAssign = async (itemId: string, moderatorId: string) => {
    try {
      await adminApi.assignQueueItem(itemId, moderatorId, token);
      alert("Queue item assigned successfully");
    } catch (error) {
      alert("Failed to assign queue item");
    }
  };

  const handleReview = async (itemId: string, approved: boolean) => {
    try {
      await adminApi.reviewQueueItem(
        itemId,
        approved ? "approved" : "rejected",
        "Reviewed by admin",
        token
      );
      alert(`Queue item ${approved ? "approved" : "rejected"}`);
    } catch (error) {
      alert("Failed to review queue item");
    }
  };

  const handleEscalate = async (itemId: string) => {
    try {
      await adminApi.escalateQueueItem(itemId, token);
      alert("Queue item escalated to supervisor");
    } catch (error) {
      alert("Failed to escalate queue item");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Moderator Queue
          </h1>
          <p className="text-slate-600 mt-2">
            Review and manage content moderation tasks
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Reviews"
            value={pendingCount}
            trend="+3"
            variant="warning"
            icon={Clock}
          />
          <StatCard
            title="Assigned Tasks"
            value={assignedCount}
            trend="+5"
            isPositive
            icon={User}
          />
          <StatCard
            title="Urgent Cases"
            value={urgentCount}
            trend="+1"
            variant="destructive"
            icon={AlertTriangle}
          />
          <StatCard
            title="Avg Wait Time"
            value={avgWaitTime}
            trend="-15m"
            isPositive
            icon={TrendingUp}
          />
        </div>

        {/* Filters & Search */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={priorityFilter === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("all")}
              >
                All Priority
              </Button>
              <Button
                variant={priorityFilter === "urgent" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("urgent")}
              >
                Urgent
              </Button>
              <Button
                variant={priorityFilter === "high" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("high")}
              >
                High
              </Button>
              <Button
                variant={priorityFilter === "medium" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("medium")}
              >
                Medium
              </Button>
              <Button
                variant={priorityFilter === "low" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("low")}
              >
                Low
              </Button>
            </div>
            <Input
              placeholder="Search by user, ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-80"
            />
          </div>
        </div>

        {/* Queue Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">
              Moderation Queue
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Queue ID
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    User
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Reason
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Priority
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Wait Time
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Assigned To
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b hover:bg-slate-50 transition-colors ${
                        item.priority === "urgent" ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-900">
                          {item.id}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.email}
                          </p>
                          <p className="text-sm text-slate-500">{item.userId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700">
                          {item.reason}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(
                            item.priority
                          )}`}
                        >
                          {item.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-slate-900">
                          {item.waitTime}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700">
                          {item.assignedTo || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {item.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssign(item.id, "mod_sarah")}
                            >
                              Assign
                            </Button>
                          )}
                          {item.status === "assigned" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReview(item.id, true)}
                                className="text-green-600 border-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEscalate(item.id)}
                                className="text-orange-600 border-orange-600"
                              >
                                Escalate
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No queue items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Urgent Cases Section */}
        <div className="rounded-lg border bg-red-50 border-red-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-900 flex items-center gap-2">
            <AlertTriangle className="text-red-600" />
            Urgent Cases Requiring Immediate Attention
          </h2>
          <div className="space-y-3">
            {mockQueueItems
              .filter((item) => item.priority === "urgent")
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.email}
                      </p>
                      <p className="text-sm text-slate-600">{item.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Waiting: {item.waitTime}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssign(item.id, "mod_sarah")}
                    >
                      Take Action
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Moderator Leaderboard */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Moderator Leaderboard (Today)
          </h2>
          <div className="space-y-3">
            {mockModerators.map((mod, index) => (
              <div
                key={mod.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{mod.name}</p>
                    <p className="text-sm text-slate-600">
                      {mod.reviewsToday} reviews today
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {mod.accuracy}%
                  </p>
                  <p className="text-xs text-slate-600">Accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
