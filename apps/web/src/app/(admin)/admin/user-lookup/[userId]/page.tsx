"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  MessageSquare,
  Heart,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function UserDetailPage() {
  const params = useParams() as { userId: string };
  const userId = params.userId;

  // Mock user data
  const user = {
    id: userId,
    email: "john.doe@example.com",
    name: "John Doe",
    createdAt: "2024-01-15",
    status: "active",
    verifiedEmail: true,
    profileComplete: 85,
    lastActive: "2 hours ago",
  };

  const stats = {
    matches: 12,
    messages: 145,
    likes: 34,
    reports: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/user-lookup">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Profile</h1>
            <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* User Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.matches}</div>
                  <div className="text-sm text-slate-600">Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.messages}</div>
                  <div className="text-sm text-slate-600">Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.likes}</div>
                  <div className="text-sm text-slate-600">Likes Sent</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.reports}</div>
                  <div className="text-sm text-slate-600">Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">User ID</div>
                    <div className="font-mono text-sm">{user.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Email</div>
                    <div className="flex items-center gap-2">
                      <span>{user.email}</span>
                      {user.verifiedEmail && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Name</div>
                    <div>{user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Status</div>
                    <Badge
                      className={
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Member Since</div>
                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Last Active</div>
                    <div>{user.lastActive}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile Completeness</span>
                    <span className="font-semibold">{user.profileComplete}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${user.profileComplete}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Activity className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Logged in</div>
                      <div className="text-xs text-slate-600">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Heart className="w-5 h-5 text-red-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Sent a like</div>
                      <div className="text-xs text-slate-600">5 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Sent message</div>
                      <div className="text-xs text-slate-600">1 day ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Risk Score</div>
                  <Badge className="bg-green-100 text-green-800">Low Risk (15/100)</Badge>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Failed Login Attempts</div>
                  <div>0</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Reported By Others</div>
                  <div>{stats.reports} reports</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                <Button variant="outline" className="w-full justify-start text-amber-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend Account
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
