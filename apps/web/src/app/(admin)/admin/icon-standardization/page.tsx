"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Bell,
  Plus,
  Search,
  LogOut,
  MessageSquare,
  TrendingUp,
  Eye,
  Home,
  Settings,
  Users,
  UserCog,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  UserPlus,
  ArrowUpRight,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Send,
  Download,
  FilterX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const iconCategories = [
  {
    name: "Navigation & Layout",
    icons: [
      { name: "Home", icon: Home, usage: "Go to dashboard/homepage", context: "Both dashboards" },
      { name: "Settings", icon: Settings, usage: "Configuration & preferences", context: "Both dashboards" },
      { name: "Bell", icon: Bell, usage: "Notifications & alerts", context: "Header in both dashboards" },
      { name: "Search", icon: Search, usage: "Search functionality", context: "Header search bar" },
      { name: "Plus", icon: Plus, usage: "Add new item/create", context: "New ticket, new staff" },
      { name: "ChevronDown", icon: ChevronDown, usage: "Expand/collapse items", context: "Dropdowns & accordions" },
      { name: "ChevronUp", icon: ChevronUp, usage: "Collapse/minimize", context: "Collapse section" },
    ],
  },
  {
    name: "User & Staff Management",
    icons: [
      { name: "Users", icon: Users, usage: "View all users/staff", context: "Admin staff overview" },
      { name: "UserCog", icon: UserCog, usage: "Staff management/roles", context: "Admin staff page" },
      { name: "UserPlus", icon: UserPlus, usage: "Add new staff member", context: "Admin add staff button" },
      { name: "LogOut", icon: LogOut, usage: "Exit/logout", context: "Logout button (both dashboards)" },
    ],
  },
  {
    name: "Feedback & Communication",
    icons: [
      { name: "MessageSquare", icon: MessageSquare, usage: "Messages, feedback, chat", context: "Feedback button & support" },
      { name: "Send", icon: Send, usage: "Send message/submit", context: "Send action buttons" },
    ],
  },
  {
    name: "Monitoring & Analytics",
    icons: [
      { name: "TrendingUp", icon: TrendingUp, usage: "Performance, rankings, metrics", context: "Performance leaderboard, metrics" },
      { name: "Activity", icon: Activity, usage: "Live activity, status", context: "Platform health, activity logs" },
      { name: "BarChart3", icon: BarChart3, usage: "Dashboard overview, analytics", context: "Admin overview page" },
      { name: "Eye", icon: Eye, usage: "View, visibility, tracking", context: "Privacy/tracking transparency" },
      { name: "Clock", icon: Clock, usage: "Time, timing, duration", context: "Wait times, response times" },
      { name: "ArrowUpRight", icon: ArrowUpRight, usage: "Positive trend, growth", context: "Positive metrics" },
    ],
  },
  {
    name: "Security & Access Control",
    icons: [
      { name: "Shield", icon: Shield, usage: "Security, protection, admin", context: "Security features, admin only" },
      { name: "Lock", icon: Lock, usage: "Restricted, locked, permissions denied", context: "Restricted permissions" },
      { name: "Unlock", icon: Unlock, usage: "Granted access, unlocked", context: "Granted permissions" },
    ],
  },
  {
    name: "Status & Actions",
    icons: [
      { name: "CheckCircle", icon: CheckCircle, usage: "Healthy, success, resolved", context: "Healthy status, completed tickets" },
      { name: "AlertCircle", icon: AlertCircle, usage: "Warning, attention needed", context: "Degraded status, pending items" },
    ],
  },
  {
    name: "Data & Management",
    icons: [
      { name: "Edit", icon: Edit, usage: "Modify, edit, update", context: "Edit role, edit settings" },
      { name: "Trash2", icon: Trash2, usage: "Delete, remove", context: "Delete item" },
      { name: "Download", icon: Download, usage: "Export, download data", context: "CSV export, data download" },
      { name: "FilterX", icon: FilterX, usage: "Clear filters, reset", context: "Clear search/filters" },
    ],
  },
];

interface CopiedStates {
  [key: string]: boolean;
}

export default function IconStandardizationPage() {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => setCopiedStates({ ...copiedStates, [id]: false }), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
            <Code2 className="w-8 h-8 text-blue-600" />
            Icon Standardization Guide
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Consistent icon usage across Admin and Staff dashboards for better UX and recognition
          </p>
        </div>

        {/* Overview Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Icon Library</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                We use <strong>Lucide React</strong> icons consistently across the entire platform. All icons are imported from the same library to ensure visual consistency and maintainability.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Icon Categories */}
        <div className="space-y-6">
          {iconCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Icon</th>
                        <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Name</th>
                        <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Usage</th>
                        <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Context</th>
                        <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {category.icons.map((item) => {
                        const Icon = item.icon;
                        const copyId = `${category.name}-${item.name}`;
                        const isCopied = copiedStates[copyId];
                        const importCode = `import { ${item.name} } from "lucide-react";`;

                        return (
                          <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3">
                              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </td>
                            <td className="p-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.usage}</td>
                            <td className="p-3">
                              <Badge variant="outline">{item.context}</Badge>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => copyToClipboard(importCode, copyId)}
                                className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-mono text-slate-700 dark:text-slate-300"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Implementation Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">✓ Do's</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                <li>• Use the same icon for the same action across both dashboards</li>
                <li>• Use size variants consistently: h-4 w-4 for small, h-5 w-5 for medium, h-6 w-6 for large</li>
                <li>• Apply consistent color schemes (text-slate-600 for default, text-blue-600 for interactive)</li>
                <li>• Group related icons by category when implementing</li>
                <li>• Document new icon usage in this guide</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">✗ Don'ts</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                <li>• Don't import from different icon libraries (stick to Lucide React)</li>
                <li>• Don't use inconsistent icon sizes for the same action</li>
                <li>• Don't reuse icons with different meanings across the app</li>
                <li>• Don't apply arbitrary colors—follow the color scheme</li>
                <li>• Don't skip icon accessibility attributes (aria-label, role)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Color Usage</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-600" />
                  <span className="text-slate-600 dark:text-slate-400">text-slate-600 - Default/neutral actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600" />
                  <span className="text-slate-600 dark:text-slate-400">text-blue-600 - Primary/interactive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-600" />
                  <span className="text-slate-600 dark:text-slate-400">text-green-600 - Success/healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600" />
                  <span className="text-slate-600 dark:text-slate-400">text-red-600 - Danger/logout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-600" />
                  <span className="text-slate-600 dark:text-slate-400">text-yellow-600 - Warning/degraded</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Size Standards</h4>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-sm font-mono">
                <li>• Small (navigation, badges): h-4 w-4</li>
                <li>• Medium (buttons, headers): h-5 w-5</li>
                <li>• Large (page headers, hero): h-6 w-6 or h-8 w-8</li>
                <li>• Extra-large (decorative): h-12 w-12 or larger</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
