"use client";

import { Activity, AlertTriangle, CheckCircle2, Zap, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthMetric {
  label: string;
  status: "healthy" | "degraded" | "critical";
  value: string;
  icon: React.ElementType;
}

const mockHealthMetrics: HealthMetric[] = [
  {
    label: "Overall Status",
    status: "healthy",
    value: "99.9%",
    icon: Activity,
  },
  {
    label: "API Response",
    status: "healthy",
    value: "245ms",
    icon: Zap,
  },
  {
    label: "Database",
    status: "healthy",
    value: "Optimal",
    icon: Server,
  },
  {
    label: "Video Quality",
    status: "degraded",
    value: "720p",
    icon: AlertTriangle,
  },
];

const statusConfig = {
  healthy: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
    icon: CheckCircle2,
  },
  degraded: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
    icon: AlertTriangle,
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
    icon: AlertTriangle,
  },
};

export function PlatformHealth() {
  const overallStatus = mockHealthMetrics.every(m => m.status === "healthy") ? "healthy" : "degraded";

  return (
    <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Platform Health
          </CardTitle>
          <Badge className={`${statusConfig[overallStatus].badge}`}>
            {overallStatus === "healthy" ? "All Systems Operational" : "Some Issues Detected"}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Real-time platform status—check before major sessions
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {mockHealthMetrics.map((metric) => {
            const config = statusConfig[metric.status];
            const Icon = metric.icon;
            const StatusIcon = config.icon;

            return (
              <div
                key={metric.label}
                className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 ${
                    metric.status === "healthy" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
                  }`} />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {metric.label}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          Last updated: {new Date().toLocaleTimeString()} • <a href="/staff/video-monitor/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">View full status</a>
        </p>
      </CardContent>
    </Card>
  );
}
