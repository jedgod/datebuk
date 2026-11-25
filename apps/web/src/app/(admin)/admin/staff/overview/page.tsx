"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function StaffOverviewPage() {
  const stats = {
    totalStaff: 12,
    activeNow: 8,
    ticketsHandled: 145,
    avgResponseTime: "2.5 min",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Overview</h1>
          <p className="text-slate-600 dark:text-slate-400">Monitor team performance and activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalStaff}</div>
                  <div className="text-sm text-slate-600">Total Staff</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeNow}</div>
                  <div className="text-sm text-slate-600">Active Now</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.ticketsHandled}</div>
                  <div className="text-sm text-slate-600">Tickets Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
                  <div className="text-sm text-slate-600">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Sarah Johnson", "Mike Chen", "Emma Davis"].map((name, idx) => (
                <div key={name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-slate-600">
                        {45 - idx * 10} tickets resolved
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {98 - idx * 3}% satisfaction
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
