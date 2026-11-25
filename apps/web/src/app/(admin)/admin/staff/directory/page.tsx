"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function StaffDirectoryPage() {
  const [search, setSearch] = useState("");

  const staffMembers = [
    {
      id: "staff_1",
      name: "Sarah Johnson",
      email: "sarah.johnson@datepage.com",
      role: "Senior Support Agent",
      status: "online",
      ticketsToday: 12,
    },
    {
      id: "staff_2",
      name: "Mike Chen",
      email: "mike.chen@datepage.com",
      role: "Support Agent",
      status: "online",
      ticketsToday: 8,
    },
    {
      id: "staff_3",
      name: "Emma Davis",
      email: "emma.davis@datepage.com",
      role: "Support Agent",
      status: "away",
      ticketsToday: 5,
    },
    {
      id: "staff_4",
      name: "James Wilson",
      email: "james.wilson@datepage.com",
      role: "Team Lead",
      status: "online",
      ticketsToday: 15,
    },
  ];

  const filteredStaff = staffMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "away":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Directory</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your support team</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search staff by name or email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStaff.map((member) => (
                <Link key={member.id} href={`/admin/staff/${member.id}`}>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-slate-600">{member.email}</div>
                        <div className="text-sm text-slate-500">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{member.ticketsToday}</div>
                        <div className="text-xs text-slate-600">Tickets Today</div>
                      </div>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
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
