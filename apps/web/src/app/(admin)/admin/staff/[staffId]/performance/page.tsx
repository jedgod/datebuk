"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Star } from "lucide-react";
import Link from "next/link";

export default function StaffPerformancePage() {
  const params = useParams() as { staffId: string };
  const staffId = params.staffId;

  const metrics = {
    weeklyResolved: 45,
    satisfactionRate: 98,
    avgResponseTime: "2.1 min",
    firstContactResolution: 85,
  };

  const recentFeedback = [
    { rating: 5, comment: "Very helpful and quick response!", date: "2 days ago" },
    { rating: 5, comment: "Resolved my issue perfectly.", date: "3 days ago" },
    { rating: 4, comment: "Good support, took a bit longer than expected.", date: "5 days ago" },
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Performance Metrics</h1>
          <p className="text-slate-600 dark:text-slate-400">Track staff performance over time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">+12%</span>
              </div>
              <div className="text-2xl font-bold">{metrics.weeklyResolved}</div>
              <div className="text-sm text-slate-600">Tickets This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.satisfactionRate}%</div>
              <div className="text-sm text-slate-600">Satisfaction Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
              <div className="text-sm text-slate-600">Avg Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.firstContactResolution}%</div>
              <div className="text-sm text-slate-600">First Contact Resolution</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFeedback.map((feedback, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-slate-600 ml-2">{feedback.date}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Performance chart visualization would go here
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
