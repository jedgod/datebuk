"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy, Award, Target, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

// Mock performance data
const staffPerformanceData = [
  {
    id: "staff_1",
    name: "Sarah Johnson",
    role: "Senior Support Agent",
    ticketsResolved: 156,
    csat: 98,
    aht: "2.1 min",
    fcr: 92,
    trending: "up",
    rank: 1,
  },
  {
    id: "staff_2",
    name: "James Wilson",
    role: "Team Lead",
    ticketsResolved: 142,
    csat: 96,
    aht: "2.3 min",
    fcr: 88,
    trending: "up",
    rank: 2,
  },
  {
    id: "you",
    name: "You (Anthony Tony)",
    role: "Support Agent",
    ticketsResolved: 128,
    csat: 92,
    aht: "5m 23s",
    fcr: 85,
    trending: "stable",
    rank: 3,
    isCurrentUser: true,
  },
  {
    id: "staff_3",
    name: "Emma Davis",
    role: "Support Agent",
    ticketsResolved: 112,
    csat: 89,
    aht: "3.2 min",
    fcr: 80,
    trending: "down",
    rank: 4,
  },
  {
    id: "staff_4",
    name: "Mike Chen",
    role: "Support Agent",
    ticketsResolved: 104,
    csat: 88,
    aht: "3.8 min",
    fcr: 78,
    trending: "up",
    rank: 5,
  },
];

export default function PerformanceLeaderboardPage() {
  const [sortBy, setSortBy] = useState<"csat" | "tickets" | "aht" | "fcr">("csat");

  const sortedData = [...staffPerformanceData].sort((a, b) => {
    switch (sortBy) {
      case "csat":
        return b.csat - a.csat;
      case "tickets":
        return b.ticketsResolved - a.ticketsResolved;
      case "aht": {
        // Convert to minutes for comparison
        const ahtA = a.aht.includes("m") ? parseInt(a.aht) : 0;
        const ahtB = b.aht.includes("m") ? parseInt(b.aht) : 0;
        return ahtA - ahtB;
      }
      case "fcr":
        return b.fcr - a.fcr;
      default:
        return 0;
    }
  });

  const currentUser = sortedData.find((s) => s.isCurrentUser);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Performance Leaderboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            See how you compare to your peers. Rankings reset weekly.
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 flex-wrap">
          {["csat", "tickets", "aht", "fcr"].map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "default" : "outline"}
              onClick={() => setSortBy(option as any)}
              className="capitalize"
            >
              Sort by {option === "csat" ? "CSAT" : option === "tickets" ? "Tickets" : option === "aht" ? "AHT" : "FCR"}
            </Button>
          ))}
        </div>

        {/* Your Rank Card */}
        {currentUser && (
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Your Current Rank</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">#{currentUser.rank}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    You're performing better than {5 - currentUser.rank} of your teammates
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">CSAT Score</p>
                    <p className="text-2xl font-bold text-green-600">{currentUser.csat}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Tickets Today</p>
                    <p className="text-2xl font-bold text-blue-600">{currentUser.ticketsResolved}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 font-semibold">CSAT</th>
                    <th className="text-center py-3 px-4 font-semibold">Tickets</th>
                    <th className="text-center py-3 px-4 font-semibold">AHT</th>
                    <th className="text-center py-3 px-4 font-semibold">FCR</th>
                    <th className="text-center py-3 px-4 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                        staff.isCurrentUser ? "bg-amber-50 dark:bg-amber-900/10" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 ? (
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          ) : idx === 1 ? (
                            <Award className="w-5 h-5 text-slate-400" />
                          ) : idx === 2 ? (
                            <Target className="w-5 h-5 text-orange-600" />
                          ) : (
                            <span className="font-bold text-slate-600 dark:text-slate-400">#{idx + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {staff.name}
                            {staff.isCurrentUser && (
                              <Badge variant="secondary" className="ml-2">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{staff.role}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-semibold ${staff.csat >= 95 ? "text-green-600" : "text-slate-600"}`}>
                          {staff.csat}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-blue-600">{staff.ticketsResolved}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-slate-600 dark:text-slate-400">{staff.aht}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-semibold ${staff.fcr >= 90 ? "text-green-600" : "text-slate-600"}`}>
                          {staff.fcr}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {staff.trending === "up" ? (
                          <ArrowUp className="w-4 h-4 text-green-600 mx-auto" />
                        ) : staff.trending === "down" ? (
                          <ArrowDown className="w-4 h-4 text-red-600 mx-auto" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              How to Improve Your Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Increase CSAT",
                  tips: ["Be thorough in responses", "Follow up on resolutions", "Ask for feedback"],
                },
                {
                  title: "Reduce AHT",
                  tips: ["Use canned responses", "Improve typing speed", "Know your resources"],
                },
                {
                  title: "Boost FCR",
                  tips: ["Solve problems first contact", "Research before responding", "Transfer strategically"],
                },
                {
                  title: "Resolve More",
                  tips: ["Manage your queue efficiently", "Avoid distractions", "Request help when needed"],
                },
              ].map((section) => (
                <div key={section.title} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-semibold text-slate-900 dark:text-white mb-3">{section.title}</p>
                  <ul className="space-y-2">
                    {section.tips.map((tip) => (
                      <li key={tip} className="text-xs text-slate-600 dark:text-slate-400">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Link href="/staff">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
