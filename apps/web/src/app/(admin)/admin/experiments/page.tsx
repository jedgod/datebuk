"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { StatCard } from "@/components/admin/StatCard";
import { adminApi } from "@/lib/api";
import { FlaskConical, Play, StopCircle, TrendingUp, Award } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ExperimentsPage() {
  const token = localStorage.getItem("auth_token") || undefined;
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["experiments-list"],
    queryFn: () => adminApi.listExperiments(token),
    refetchInterval: 60000,
  });

  // Mock experiments data - replace with actual API response
  const mockExperiments = [
    {
      id: "exp_001",
      name: "Swipe Button Color",
      description: "Testing green vs blue swipe button",
      status: "running",
      startDate: "2026-02-10",
      endDate: "2026-02-24",
      variants: [
        { name: "Control (Blue)", users: 5000, conversions: 3200, rate: 64 },
        { name: "Variant A (Green)", users: 5100, conversions: 3570, rate: 70 },
      ],
      winner: "variant_a",
      confidence: 95,
      improvementRate: 9.4,
    },
    {
      id: "exp_002",
      name: "Profile Completion Prompt",
      description: "Testing different profile completion messages",
      status: "running",
      startDate: "2026-02-12",
      endDate: "2026-02-26",
      variants: [
        { name: "Control", users: 4200, conversions: 1680, rate: 40 },
        { name: "Variant A (Urgent)", users: 4300, conversions: 1892, rate: 44 },
      ],
      winner: null,
      confidence: 82,
      improvementRate: 10,
    },
    {
      id: "exp_003",
      name: "Match Notification Timing",
      description: "Testing immediate vs 5-minute delayed notifications",
      status: "completed",
      startDate: "2026-01-20",
      endDate: "2026-02-03",
      variants: [
        { name: "Immediate", users: 8500, conversions: 6800, rate: 80 },
        { name: "Delayed", users: 8400, conversions: 5460, rate: 65 },
      ],
      winner: "control",
      confidence: 99,
      improvementRate: -18.8,
    },
  ];

  const runningExperiments = mockExperiments.filter((e) => e.status === "running").length;
  const completedExperiments = mockExperiments.filter((e) => e.status === "completed").length;
  const avgConfidence = Math.round(
    mockExperiments.reduce((acc, e) => acc + e.confidence, 0) / mockExperiments.length
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      running: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      paused: "bg-amber-100 text-amber-800",
      draft: "bg-slate-100 text-slate-800",
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const handleStopExperiment = async (experimentId: string) => {
    try {
      await adminApi.endExperiment(experimentId, token);
      alert("Experiment stopped successfully");
    } catch (error) {
      alert("Failed to stop experiment");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            A/B Testing & Experiments
          </h1>
          <p className="text-slate-600 mt-2">
            Manage and analyze product experiments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Running Experiments"
            value={runningExperiments}
            trend="+2"
            isPositive
            icon={Play}
          />
          <StatCard
            title="Completed Experiments"
            value={completedExperiments}
            trend="+5"
            isPositive
            icon={Award}
          />
          <StatCard
            title="Avg Confidence"
            value={`${avgConfidence}%`}
            trend="+3%"
            isPositive
            icon={TrendingUp}
          />
          <StatCard
            title="Active Users in Tests"
            value="18.5K"
            trend="+8%"
            isPositive
            icon={FlaskConical}
          />
        </div>

        {/* Active Experiments */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Active Experiments
          </h2>
          {mockExperiments
            .filter((exp) => exp.status === "running")
            .map((experiment) => (
              <div
                key={experiment.id}
                className="rounded-lg border bg-white p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {experiment.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          experiment.status
                        )}`}
                      >
                        {experiment.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {experiment.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {experiment.startDate} → {experiment.endDate}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStopExperiment(experiment.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Test
                  </Button>
                </div>

                {/* Comparison Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={experiment.variants.map((v) => ({
                        name: v.name,
                        users: v.users,
                        conversions: v.conversions,
                        rate: v.rate,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="users"
                        fill="#3b82f6"
                        name="Total Users"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="conversions"
                        fill="#10b981"
                        name="Conversions"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="rate"
                        fill="#f59e0b"
                        name="Conversion Rate %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  {experiment.variants.map((variant) => (
                    <div key={variant.name} className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {variant.name}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {variant.rate}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {variant.conversions.toLocaleString()} /{" "}
                        {variant.users.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Confidence
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {experiment.confidence}%
                    </p>
                    <p className="text-xs text-slate-500">Statistical</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Improvement
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        experiment.improvementRate > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {experiment.improvementRate > 0 ? "+" : ""}
                      {experiment.improvementRate}%
                    </p>
                    <p className="text-xs text-slate-500">vs Control</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExperiment(experiment.id)}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </div>
              </div>
            ))}
        </div>

        {/* Completed Experiments Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">
              Completed Experiments
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Experiment Name
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Duration
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Control Rate
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Variant Rate
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Improvement
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Confidence
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockExperiments
                  .filter((exp) => exp.status === "completed")
                  .map((experiment) => (
                    <tr
                      key={experiment.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {experiment.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {experiment.description}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">
                        {experiment.startDate}
                        <br />→ {experiment.endDate}
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-semibold text-slate-900">
                          {experiment.variants[0].rate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-semibold text-slate-900">
                          {experiment.variants[1].rate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-lg font-bold ${
                            experiment.improvementRate > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {experiment.improvementRate > 0 ? "+" : ""}
                          {experiment.improvementRate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {experiment.confidence}%
                          </span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 w-16">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${experiment.confidence}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                          <Award size={14} />
                          {experiment.winner === "control"
                            ? "Control"
                            : "Variant A"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <Award className="text-blue-600" />
            Key Insights from Recent Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                🎨 Color Psychology Wins
              </h3>
              <p className="text-sm text-slate-700">
                Green buttons increased swipe conversion by 9.4%. Users
                associate green with "go" and positive action.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                ⏰ Timing Matters
              </h3>
              <p className="text-sm text-slate-700">
                Immediate notifications outperformed delayed by 18.8%. Users
                prefer instant gratification for matches.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                📝 Urgent Messaging Works
              </h3>
              <p className="text-sm text-slate-700">
                Urgent profile completion prompts increased completion rate by
                10%. FOMO is a powerful motivator.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                📊 Statistical Significance
              </h3>
              <p className="text-sm text-slate-700">
                Maintain 95%+ confidence level for reliable results. Aim for
                5,000+ users per variant for accurate data.
              </p>
            </div>
          </div>
        </div>

        {/* Create New Experiment */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Create New Experiment
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Start a new A/B test to optimize your platform's performance.
          </p>
          <Button>
            <FlaskConical className="mr-2 h-4 w-4" />
            New Experiment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
