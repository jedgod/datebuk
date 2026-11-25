"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { StatCard } from "@/components/admin/StatCard";
import { RiskScoreGauge } from "@/components/admin/RiskScoreGauge";
import { adminApi } from "@/lib/api";
import { Shield, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RiskScoresPage() {
  const token = localStorage.getItem("auth_token") || undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-risk-stats"],
    queryFn: () => adminApi.getFraudStats(token),
    refetchInterval: 30000,
  });

  // Mock user risk data - replace with actual API call
  const mockUserRisks = [
    {
      userId: "user_123",
      email: "john.doe@example.com",
      riskScore: 78,
      trend: "up",
      factors: {
        ml_score: 82,
        ip_reputation: 65,
        device_trust: 90,
        velocity: 75,
        account_age: 45,
        behavior: 88,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      userId: "user_456",
      email: "jane.smith@example.com",
      riskScore: 35,
      trend: "down",
      factors: {
        ml_score: 40,
        ip_reputation: 55,
        device_trust: 85,
        velocity: 30,
        account_age: 70,
        behavior: 45,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      userId: "user_789",
      email: "bob.johnson@example.com",
      riskScore: 92,
      trend: "up",
      factors: {
        ml_score: 95,
        ip_reputation: 88,
        device_trust: 50,
        velocity: 98,
        account_age: 30,
        behavior: 92,
      },
      lastUpdated: new Date().toISOString(),
    },
  ];

  const filteredUsers = mockUserRisks.filter((user) =>
    searchQuery
      ? user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const avgRisk = (stats as any)?.avgRiskScore ?? 42;
  const highRiskUsers = mockUserRisks.filter((u) => u.riskScore >= 70).length;
  const mediumRiskUsers = mockUserRisks.filter(
    (u) => u.riskScore >= 40 && u.riskScore < 70
  ).length;
  const lowRiskUsers = mockUserRisks.filter((u) => u.riskScore < 40).length;

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-100";
    if (score >= 40) return "text-amber-600 bg-amber-100";
    return "text-green-600 bg-green-100";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            User Risk Scores
          </h1>
          <p className="text-slate-600 mt-2">
            Analyze user risk profiles and fraud indicators
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Average Risk Score"
            value={avgRisk}
            trend="-2.1%"
            isPositive
            icon={Shield}
          />
          <StatCard
            title="High Risk Users"
            value={highRiskUsers}
            trend="+5"
            variant="destructive"
            icon={AlertTriangle}
          />
          <StatCard
            title="Medium Risk Users"
            value={mediumRiskUsers}
            trend="+2"
            variant="warning"
            icon={TrendingUp}
          />
          <StatCard
            title="Low Risk Users"
            value={lowRiskUsers}
            trend="+12"
            isPositive
            icon={TrendingDown}
          />
        </div>

        {/* Search & Filter */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Search Users
          </h2>
          <div className="flex gap-4">
            <Input
              placeholder="Search by email or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          </div>
        </div>

        {/* User Risk Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">
              User Risk Profiles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    User
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Risk Score
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Risk Level
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Trend
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Last Updated
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.userId} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.email}
                        </p>
                        <p className="text-sm text-slate-500">{user.userId}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {user.riskScore}
                        </span>
                        <div className="flex-1 bg-slate-200 rounded-full h-2 w-20">
                          <div
                            className={`h-2 rounded-full ${
                              user.riskScore >= 70
                                ? "bg-red-600"
                                : user.riskScore >= 40
                                ? "bg-amber-500"
                                : "bg-green-600"
                            }`}
                            style={{ width: `${user.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(
                          user.riskScore
                        )}`}
                      >
                        {getRiskLabel(user.riskScore)}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.trend === "up" ? (
                        <TrendingUp className="text-red-600" size={20} />
                      ) : (
                        <TrendingDown className="text-green-600" size={20} />
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {new Date(user.lastUpdated).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user.userId)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Factor Breakdown */}
        {selectedUser && (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">
              Risk Factor Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockUserRisks
                .find((u) => u.userId === selectedUser)
                ?.factors &&
                Object.entries(
                  mockUserRisks.find((u) => u.userId === selectedUser)
                    ?.factors || {}
                ).map(([factor, score]) => (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {factor.replace("_", " ")}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {score}
                      </span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          score >= 70
                            ? "bg-red-600"
                            : score >= 40
                            ? "bg-amber-500"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Overall Risk Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskScoreGauge score={avgRisk} />
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">
              Risk Distribution
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    High Risk (70-100)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {highRiskUsers}
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (highRiskUsers / mockUserRisks.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Medium Risk (40-69)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {mediumRiskUsers}
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-amber-500 h-3 rounded-full"
                    style={{
                      width: `${
                        (mediumRiskUsers / mockUserRisks.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Low Risk (0-39)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {lowRiskUsers}
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (lowRiskUsers / mockUserRisks.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
