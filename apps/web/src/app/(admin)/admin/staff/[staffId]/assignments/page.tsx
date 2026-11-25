"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function StaffAssignmentsPage() {
  const params = useParams<{ staffId: string }>();
  const staffId = params!.staffId;

  const assignments = [
    {
      id: "ticket_1",
      title: "Account verification issue",
      priority: "high",
      assignedAt: "2 hours ago",
      dueIn: "4 hours",
    },
    {
      id: "ticket_2",
      title: "Payment not processing",
      priority: "urgent",
      assignedAt: "1 hour ago",
      dueIn: "2 hours",
    },
    {
      id: "ticket_3",
      title: "Profile photo upload error",
      priority: "medium",
      assignedAt: "5 hours ago",
      dueIn: "10 hours",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Assignments</h1>
          <p className="text-slate-600 dark:text-slate-400">Tickets assigned to this staff member</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{assignments.length}</div>
              <div className="text-sm text-slate-600">Active Tickets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {assignments.filter((a) => a.priority === "urgent" || a.priority === "high").length}
              </div>
              <div className="text-sm text-slate-600">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">2.5h</div>
              <div className="text-sm text-slate-600">Avg Time to Close</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Link key={assignment.id} href={`/admin/support-tickets/${assignment.id}`}>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{assignment.title}</div>
                      <Badge className={getPriorityColor(assignment.priority)}>
                        {assignment.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Assigned {assignment.assignedAt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Due in {assignment.dueIn}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
