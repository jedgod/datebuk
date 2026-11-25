"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, TrendingUp, TrendingDown, Clock, CheckCircle, Users, MessageSquare } from "lucide-react";

export default function ReportsPage() {
  const stats = {
    totalTickets: 248,
    resolvedTickets: 192,
    avgResponseTime: "4m 32s",
    avgResolutionTime: "2h 15m",
    customerSatisfaction: 4.6,
    activeAgents: 8,
  };

  const performanceData = [
    { agent: "You", tickets: 42, resolved: 38, avgTime: "5m 23s", csat: 4.8, trend: "up" },
    { agent: "Sarah K.", tickets: 38, resolved: 35, avgTime: "6m 10s", csat: 4.7, trend: "up" },
    { agent: "Mike T.", tickets: 35, resolved: 30, avgTime: "7m 45s", csat: 4.5, trend: "down" },
    { agent: "Emily R.", tickets: 33, resolved: 29, avgTime: "5m 50s", csat: 4.6, trend: "up" },
  ];

  const categoryBreakdown = [
    { category: "Technical", count: 95, percentage: 38 },
    { category: "Billing", count: 62, percentage: 25 },
    { category: "Account", count: 48, percentage: 19 },
    { category: "General", count: 43, percentage: 18 },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Performance insights and ticket statistics</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Resolved Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">15% faster than last month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">Per ticket</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerSatisfaction}/5.0</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">+0.2 from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Individual agent metrics for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.map((agent) => (
              <div key={agent.agent} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{agent.agent}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.resolved}/{agent.tickets} resolved
                    </p>
                  </div>
                  {agent.trend === "up" ? (
                    <Badge className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improving
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Needs attention
                    </Badge>
                  )}
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <p className="text-2xl font-bold">{agent.avgTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agent.csat}</p>
                    <p className="text-xs text-muted-foreground">CSAT Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Category Breakdown</CardTitle>
          <CardDescription>Distribution of tickets by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {category.count} tickets ({category.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    data-width={category.percentage}
                    style={{ width: `${category.percentage}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
