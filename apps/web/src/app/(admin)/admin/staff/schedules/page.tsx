"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock } from "lucide-react";

export default function StaffSchedulesPage() {
  const schedule = [
    {
      day: "Monday",
      staff: [
        { name: "Sarah Johnson", shift: "9:00 AM - 5:00 PM", status: "scheduled" },
        { name: "Mike Chen", shift: "1:00 PM - 9:00 PM", status: "scheduled" },
      ],
    },
    {
      day: "Tuesday",
      staff: [
        { name: "Emma Davis", shift: "9:00 AM - 5:00 PM", status: "scheduled" },
        { name: "James Wilson", shift: "1:00 PM - 9:00 PM", status: "scheduled" },
      ],
    },
    {
      day: "Wednesday",
      staff: [
        { name: "Sarah Johnson", shift: "9:00 AM - 5:00 PM", status: "scheduled" },
        { name: "Mike Chen", shift: "1:00 PM - 9:00 PM", status: "scheduled" },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Schedules</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage shift schedules and coverage</p>
          </div>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-slate-600">On Duty Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-slate-600">Total Staff</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-slate-600">Coverage Rate</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>This Week's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((daySchedule) => (
                <div key={daySchedule.day} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-semibold text-lg mb-2">{daySchedule.day}</div>
                  <div className="space-y-2">
                    {daySchedule.staff.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{member.shift}</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">{member.status}</Badge>
                        </div>
                      </div>
                    ))}
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
