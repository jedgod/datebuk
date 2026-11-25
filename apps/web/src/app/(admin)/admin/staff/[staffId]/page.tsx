"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StaffProfilePage() {
  const params = useParams() as { staffId: string };
  const staffId = params.staffId;

  const staff = {
    id: staffId,
    name: "Sarah Johnson",
    email: "sarah.johnson@datepage.com",
    phone: "+1 (555) 123-4567",
    role: "Senior Support Agent",
    status: "online",
    joinedDate: "2023-06-15",
    department: "Customer Support",
  };

  const stats = {
    ticketsResolved: 234,
    avgResponseTime: "2.1 min",
    satisfactionRate: 98,
    activeTickets: 5,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/staff/directory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
            {staff.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{staff.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">{staff.role}</p>
            <Badge className="mt-1 bg-green-100 text-green-800">{staff.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.ticketsResolved}</div>
              <div className="text-sm text-slate-600">Tickets Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
              <div className="text-sm text-slate-600">Avg Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.satisfactionRate}%</div>
              <div className="text-sm text-slate-600">Satisfaction</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.activeTickets}</div>
              <div className="text-sm text-slate-600">Active Tickets</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="assignments">
              <Link href={`/admin/staff/${staffId}/assignments`}>Assignments</Link>
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Link href={`/admin/staff/${staffId}/performance`}>Performance</Link>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Link href={`/admin/staff/${staffId}/activity`}>Activity</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">Email</div>
                    <div>{staff.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">Phone</div>
                    <div>{staff.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">Joined</div>
                    <div>{new Date(staff.joinedDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600">Department</div>
                  <div className="font-medium">{staff.department}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Role</div>
                  <div className="font-medium">{staff.role}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
