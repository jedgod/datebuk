"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Clock } from "lucide-react";
import Link from "next/link";

export default function StaffActivityPage() {
  const params = useParams() as { staffId: string };
  const staffId = params.staffId;

  const activities = [
    {
      action: "Resolved ticket #1234",
      timestamp: "10 minutes ago",
      details: "Account verification issue",
    },
    {
      action: "Updated ticket #1233",
      timestamp: "25 minutes ago",
      details: "Added internal note",
    },
    {
      action: "Assigned ticket #1232",
      timestamp: "1 hour ago",
      details: "Payment processing error",
    },
    {
      action: "Logged in",
      timestamp: "2 hours ago",
      details: "Started shift",
    },
    {
      action: "Resolved ticket #1231",
      timestamp: "3 hours ago",
      details: "Profile photo upload issue",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/staff/${staffId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
          <p className="text-slate-600 dark:text-slate-400">Recent actions and events</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{activity.action}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{activity.details}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                    </div>
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
