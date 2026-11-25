"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";
import {
  Users,
  UserCog,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  UserPlus,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  MessageSquare,
  Layers,
  Loader2
} from "lucide-react";

const PACK_DASHBOARD_LINKS = [
  { slug: "1-trust-safety", label: "Pack 1 - Trust Safety" },
  { slug: "2-realtime-communication", label: "Pack 2 - Realtime Communication" },
  { slug: "3-ai-matchmaker", label: "Pack 3 - AI Matchmaker" },
  { slug: "4-enterprise-scale", label: "Pack 4 - Enterprise Scale" },
  { slug: "5-global-superapp", label: "Pack 5 - Global Super App" },
];

interface DashboardSummary {
  totalUsers: number;
  staff: { active: number; pending: number; suspended: number; total: number };
  tickets: { open: number; total: number };
  rolesCount: number;
  pendingVerifications: number;
  dbHealthy: boolean;
  recentActivity: Array<{ id: string; actorName: string; action: string; target: string | null; createdAt: string }>;
  recentStaff: Array<{ id: string; name: string; role: string; accountStatus: string }>;
}

function formatActivityAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiEndpoint("/admin/dashboard-summary"), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to load dashboard summary");
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:flex">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search users, staff..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manager</p>
              </div>
            </div>
            <button 
              aria-label="Notifications"
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <Link 
              href="/staff/directory"
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Staff
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={loading ? "—" : (summary?.totalUsers ?? 0).toLocaleString()}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active Staff"
            value={loading ? "—" : String(summary?.staff.active ?? 0)}
            icon={UserCog}
            color="green"
          />
          <MetricCard
            title="Open Tickets"
            value={loading ? "—" : String(summary?.tickets.open ?? 0)}
            icon={AlertCircle}
            color="amber"
          />
          <MetricCard
            title="Database"
            value={loading ? "—" : summary?.dbHealthy ? "Operational" : "Degraded"}
            icon={Activity}
            color="emerald"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Staff Management"
              description="View and manage staff members"
              href="/admin/staff"
              icon={UserCog}
              color="blue"
            />
            <QuickActionCard
              title="Support Tickets"
              description="Manage customer support tickets"
              href="/admin/support-tickets"
              icon={Bell}
              color="orange"
            />
            <QuickActionCard
              title="Live Support"
              description="Monitor live chat sessions"
              href="/admin/live-support"
              icon={Activity}
              color="green"
            />
            <QuickActionCard
              title="User Lookup"
              description="Search and view user details"
              href="/admin/user-lookup"
              icon={Search}
              color="purple"
            />
          </div>
        </div>

        {/* Admin Features Hub */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            Admin Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              title="Staff Management"
              description="List, add, edit, deactivate staff and manage permissions"
              href="/admin/staff"
              icon={UserCog}
              color="blue"
              stats={loading ? "—" : `${summary?.staff.active ?? 0} Active`}
            />
            <FeatureCard
              title="Support Tickets"
              description="Overview and full management of customer support tickets"
              href="/admin/support-tickets"
              icon={AlertCircle}
              color="orange"
              stats={loading ? "—" : `${summary?.tickets.total ?? 0} Total`}
            />
            <FeatureCard
              title="Live Support"
              description="Real-time chat monitoring and active session management"
              href="/admin/live-support"
              icon={Activity}
              color="green"
              stats="Not yet available"
            />
            <FeatureCard
              title="User Lookup"
              description="Advanced search and customer account management"
              href="/admin/user-lookup"
              icon={Search}
              color="purple"
              stats={loading ? "—" : `${(summary?.totalUsers ?? 0).toLocaleString()} Users`}
            />
            <FeatureCard
              title="Performance Reports"
              description="CSAT, AHT, tickets per agent, and activity metrics"
              href="/admin/staff-performance"
              icon={BarChart3}
              color="pink"
              stats="Not yet available"
            />
            <FeatureCard
              title="Staff Notes"
              description="Searchable repository of staff notes and observations"
              href="/admin/staff-notes"
              icon={AlertCircle}
              color="indigo"
              stats="Not yet available"
            />
            <FeatureCard
              title="Queue & Rules"
              description="Visibility into queue, auto-assign rules, and routing logic"
              href="/admin/queue-rules"
              icon={Settings}
              color="cyan"
              stats="Not yet available"
            />
            <FeatureCard
              title="Canned Responses"
              description="Global management of response templates and shortcuts"
              href="/admin/canned-responses"
              icon={MessageSquare}
              color="emerald"
              stats="Not yet available"
            />
            <FeatureCard
              title="Roles & Permissions"
              description="Configure staff roles and manage detailed permissions"
              href="/admin/roles"
              icon={Shield}
              color="amber"
              stats={loading ? "—" : `${summary?.rolesCount ?? 0} Roles`}
            />
            <FeatureCard
              title="Photo Verification"
              description="Review submitted selfies against profile photos"
              href="/admin/verification"
              icon={UserCog}
              color="purple"
              stats={loading ? "—" : `${summary?.pendingVerifications ?? 0} Pending`}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Pack Dashboards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PACK_DASHBOARD_LINKS.map((pack) => (
              <Link
                key={pack.slug}
                href={`/admin/dashboard/packs/${pack.slug}`}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-slate-800 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{pack.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open live pack metrics and feature payload</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Staff Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Staff Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h2>
              <Link href="/staff" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : summary && summary.recentActivity.length > 0 ? (
                summary.recentActivity.map((entry) => (
                  <ActivityItem
                    key={entry.id}
                    user={entry.actorName}
                    action={`${formatActivityAction(entry.action)}${entry.target ? ` (${entry.target.slice(0, 8)}...)` : ""}`}
                    time={timeAgo(entry.createdAt)}
                    type="info"
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No recent activity.</p>
              )}
            </div>
          </div>

          {/* Staff Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserCog className="w-5 h-5 text-green-600" />
                Staff Overview
              </h2>
              <Link href="/staff/directory" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                Manage
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {loading || !summary ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <StaffMetric
                    label="Active Staff"
                    value={String(summary.staff.active)}
                    total={String(summary.staff.total)}
                    percentage={summary.staff.total ? Math.round((summary.staff.active / summary.staff.total) * 100) : 0}
                    color="green"
                  />
                  <StaffMetric
                    label="Pending Setup"
                    value={String(summary.staff.pending)}
                    total={String(summary.staff.total)}
                    percentage={summary.staff.total ? Math.round((summary.staff.pending / summary.staff.total) * 100) : 0}
                    color="amber"
                  />
                  <StaffMetric
                    label="Suspended"
                    value={String(summary.staff.suspended)}
                    total={String(summary.staff.total)}
                    percentage={summary.staff.total ? Math.round((summary.staff.suspended / summary.staff.total) * 100) : 0}
                    color="red"
                  />

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recent Staff</h3>
                    <div className="space-y-2">
                      {summary.recentStaff.length > 0 ? (
                        summary.recentStaff.map((staff) => (
                          <StaffItem
                            key={staff.id}
                            name={staff.name}
                            role={staff.role}
                            status={staff.accountStatus === "ACTIVE" ? "active" : "pending"}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No staff yet.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title="API Services"
            status={loading ? "checking" : summary ? "operational" : "unreachable"}
            icon={Activity}
          />
          <StatusCard
            title="Database"
            status={loading ? "checking" : summary?.dbHealthy ? "operational" : "degraded"}
            icon={BarChart3}
          />
          <StatusCard
            title="Authentication"
            status={loading ? "checking" : summary ? "operational" : "unreachable"}
            icon={Shield}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
type MetricCardProps = {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'emerald' | 'amber';
};

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'green' | 'orange';
};

function QuickActionCard({ title, description, href, icon: Icon, color }: QuickActionCardProps) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-green-500/10 text-green-600",
    orange: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Link
      href={href}
      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all group"
    >
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </Link>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo' | 'cyan' | 'emerald' | 'amber';
  stats: string;
};

function FeatureCard({ title, description, href, icon: Icon, color, stats }: FeatureCardProps) {
  const colors = {
    blue: "from-blue-500 to-blue-600 bg-blue-500/10",
    purple: "from-purple-500 to-purple-600 bg-purple-500/10",
    green: "from-green-500 to-green-600 bg-green-500/10",
    orange: "from-orange-500 to-orange-600 bg-orange-500/10",
    pink: "from-pink-500 to-pink-600 bg-pink-500/10",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-500/10",
    cyan: "from-cyan-500 to-cyan-600 bg-cyan-500/10",
    emerald: "from-emerald-500 to-emerald-600 bg-emerald-500/10",
    amber: "from-amber-500 to-amber-600 bg-amber-500/10",
  };

  const iconColors = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-600",
    pink: "text-pink-600",
    indigo: "text-indigo-600",
    cyan: "text-cyan-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };

  return (
    <Link
      href={href}
      className="group relative h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" />
      
      <div className="relative">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        
        {/* Content */}
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${iconColors[color]}`}>{stats}</span>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
      </div>
    </Link>
  );
}

type ActivityItemProps = {
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning';
};

function ActivityItem({ user, action, time, type }: ActivityItemProps) {
  const typeColors = {
    success: "bg-green-500/10 text-green-600 border-green-200",
    info: "bg-blue-500/10 text-blue-600 border-blue-200",
    warning: "bg-amber-500/10 text-amber-600 border-amber-200",
  };

  const icons = {
    success: CheckCircle,
    info: Activity,
    warning: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className={`p-2 rounded-lg ${typeColors[type]} border`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{user}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{action}</p>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{time}</span>
    </div>
  );
}

type StaffMetricProps = {
  label: string;
  value: string;
  total: string;
  percentage: number;
  color: 'green' | 'amber' | 'red';
};

function StaffMetric({ label, value, total, percentage, color }: StaffMetricProps) {
  const colors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  // Calculate width class based on percentage
  const widthClass = percentage >= 75 ? 'w-3/4' : percentage >= 50 ? 'w-1/2' : percentage >= 25 ? 'w-1/4' : 'w-1/12';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}/{total}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`${colors[color]} h-2 rounded-full transition-all ${widthClass}`}
        />
      </div>
    </div>
  );
}

type StaffItemProps = {
  name: string;
  role: string;
  status: 'active' | 'pending';
};

function StaffItem({ name, role, status }: StaffItemProps) {
  const statusColors = {
    active: "bg-green-500",
    pending: "bg-amber-500",
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
    </div>
  );
}

type StatusCardProps = {
  title: string;
  status: "operational" | "degraded" | "unreachable" | "checking";
  icon: React.ComponentType<{ className?: string }>;
};

function StatusCard({ title, status, icon: Icon }: StatusCardProps) {
  const statusStyles = {
    operational: { dot: "bg-green-500", text: "text-green-600", iconBg: "bg-green-500/10", iconColor: "text-green-600" },
    degraded: { dot: "bg-amber-500", text: "text-amber-600", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
    unreachable: { dot: "bg-red-500", text: "text-red-600", iconBg: "bg-red-500/10", iconColor: "text-red-600" },
    checking: { dot: "bg-slate-400", text: "text-slate-500", iconBg: "bg-slate-500/10", iconColor: "text-slate-500" },
  } as const;
  const style = statusStyles[status];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <Icon className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${style.dot} ${status !== "checking" ? "animate-pulse" : ""}`} />
        <span className={`text-sm font-medium capitalize ${style.text}`}>{status}</span>
      </div>
    </div>
  );
}
