"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
import { Lock, Shield, AlertCircle } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  category: string;
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: {
    [key: string]: boolean;
  };
}

const allPermissions: Permission[] = [
  // Ticket Management
  { id: "view-all-tickets", name: "View All Tickets", category: "Ticket Management" },
  { id: "edit-all-tickets", name: "Edit All Tickets", category: "Ticket Management" },
  { id: "delete-tickets", name: "Delete Tickets", category: "Ticket Management" },
  { id: "assign-any-ticket", name: "Assign Any Ticket", category: "Ticket Management" },
  { id: "override-decisions", name: "Override Decisions", category: "Ticket Management" },

  // Staff Management
  { id: "view-all-staff", name: "View All Staff", category: "Staff Management" },
  { id: "create-staff", name: "Create Staff", category: "Staff Management" },
  { id: "edit-staff", name: "Edit Staff", category: "Staff Management" },
  { id: "delete-staff", name: "Delete Staff", category: "Staff Management" },
  { id: "view-activity-log", name: "View Activity Log", category: "Staff Management" },
  { id: "view-performance", name: "View Performance", category: "Staff Management" },
  { id: "manage-roles", name: "Manage Roles", category: "Staff Management" },

  // Moderation
  { id: "moderate-content", name: "Moderate Content", category: "Content Moderation" },
  { id: "broadcast-messages", name: "Broadcast Messages", category: "Content Moderation" },
  { id: "quarantine-videos", name: "Quarantine Videos", category: "Content Moderation" },
  { id: "override-moderation", name: "Override Moderation", category: "Content Moderation" },

  // Security
  { id: "view-security-logs", name: "View Security Logs", category: "Security" },
  { id: "manage-security", name: "Manage Security", category: "Security" },
  { id: "view-risk-scores", name: "View Risk Scores", category: "Security" },
  { id: "ip-monitoring", name: "IP Monitoring", category: "Security" },

  // Configuration
  { id: "configure-system", name: "Configure System", category: "System Configuration" },
  { id: "manage-integrations", name: "Manage Integrations", category: "System Configuration" },
  { id: "run-experiments", name: "Run Experiments", category: "System Configuration" },
  { id: "access-api", name: "Access API", category: "System Configuration" },
];

const defaultMatrix: RolePermission[] = [
  {
    roleId: "superadmin",
    roleName: "Superadmin",
    permissions: {
      "view-all-tickets": true,
      "edit-all-tickets": true,
      "delete-tickets": true,
      "assign-any-ticket": true,
      "override-decisions": true,
      "view-all-staff": true,
      "create-staff": true,
      "edit-staff": true,
      "delete-staff": true,
      "view-activity-log": true,
      "view-performance": true,
      "manage-roles": true,
      "moderate-content": true,
      "broadcast-messages": true,
      "quarantine-videos": true,
      "override-moderation": true,
      "view-security-logs": true,
      "manage-security": true,
      "view-risk-scores": true,
      "ip-monitoring": true,
      "configure-system": true,
      "manage-integrations": true,
      "run-experiments": true,
      "access-api": true,
    },
  },
  {
    roleId: "manager",
    roleName: "Support Manager",
    permissions: {
      "view-all-tickets": true,
      "edit-all-tickets": true,
      "delete-tickets": false,
      "assign-any-ticket": true,
      "override-decisions": false,
      "view-all-staff": true,
      "create-staff": false,
      "edit-staff": true,
      "delete-staff": false,
      "view-activity-log": true,
      "view-performance": true,
      "manage-roles": false,
      "moderate-content": true,
      "broadcast-messages": false,
      "quarantine-videos": true,
      "override-moderation": false,
      "view-security-logs": true,
      "manage-security": false,
      "view-risk-scores": true,
      "ip-monitoring": false,
      "configure-system": false,
      "manage-integrations": false,
      "run-experiments": false,
      "access-api": false,
    },
  },
  {
    roleId: "agent",
    roleName: "Support Agent",
    permissions: {
      "view-all-tickets": false,
      "edit-all-tickets": false,
      "delete-tickets": false,
      "assign-any-ticket": false,
      "override-decisions": false,
      "view-all-staff": false,
      "create-staff": false,
      "edit-staff": false,
      "delete-staff": false,
      "view-activity-log": false,
      "view-performance": true,
      "manage-roles": false,
      "moderate-content": false,
      "broadcast-messages": false,
      "quarantine-videos": false,
      "override-moderation": false,
      "view-security-logs": false,
      "manage-security": false,
      "view-risk-scores": false,
      "ip-monitoring": false,
      "configure-system": false,
      "manage-integrations": false,
      "run-experiments": false,
      "access-api": false,
    },
  },
  {
    roleId: "readonly",
    roleName: "Read Only",
    permissions: {
      "view-all-tickets": true,
      "edit-all-tickets": false,
      "delete-tickets": false,
      "assign-any-ticket": false,
      "override-decisions": false,
      "view-all-staff": false,
      "create-staff": false,
      "edit-staff": false,
      "delete-staff": false,
      "view-activity-log": false,
      "view-performance": false,
      "manage-roles": false,
      "moderate-content": false,
      "broadcast-messages": false,
      "quarantine-videos": false,
      "override-moderation": false,
      "view-security-logs": false,
      "manage-security": false,
      "view-risk-scores": false,
      "ip-monitoring": false,
      "configure-system": false,
      "manage-integrations": false,
      "run-experiments": false,
      "access-api": false,
    },
  },
];

export default function RBACManagementPage() {
  const [matrix, setMatrix] = useState<RolePermission[]>(defaultMatrix);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  const handleSaveMatrix = (updatedMatrix: RolePermission[]) => {
    setSaveStatus("saving");
    // Simulate API call
    setTimeout(() => {
      setMatrix(updatedMatrix);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  const calculatePermissionStats = (roleId: string) => {
    const role = matrix.find((r) => r.roleId === roleId);
    if (!role) return { total: 0, granted: 0 };
    const granted = Object.values(role.permissions).filter(Boolean).length;
    const total = Object.keys(role.permissions).length;
    return { granted, total };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
            <Lock className="w-8 h-8 text-blue-600" />
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure granular permissions for each role using the matrix below
          </p>
        </div>

        {/* Info Alert */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Permission Changes Apply Immediately</p>
              <p>Users will have new permissions on their next action. Changes are logged for audit purposes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {matrix.map((role) => {
            const stats = calculatePermissionStats(role.roleId);
            return (
              <Card key={role.roleId}>
                <CardContent className="p-4">
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">{role.roleName}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Permissions Granted:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stats.granted}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Permissions:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stats.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(stats.granted / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permission Matrix */}
        <PermissionMatrix
          roles={matrix}
          permissions={allPermissions}
          onSave={handleSaveMatrix}
        />

        {/* Save Status */}
        {saveStatus !== "idle" && (
          <Card
            className={`border-2 ${
              saveStatus === "success"
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
            }`}
          >
            <CardContent className="p-4">
              <p
                className={`text-sm font-semibold ${
                  saveStatus === "success"
                    ? "text-green-800 dark:text-green-200"
                    : "text-blue-800 dark:text-blue-200"
                }`}
              >
                {saveStatus === "saving" ? "Saving permissions..." : "✓ Permissions saved successfully"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>RBAC Implementation Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Frontend Enforcement</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Use the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">usePermission</code> hook to check permissions</li>
                <li>✓ Hide UI elements users don't have access to</li>
                <li>✓ Show disabled state for permitted but unavailable features</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Backend Enforcement</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ All API routes must validate user permissions</li>
                <li>✓ Return 403 Forbidden for unauthorized access</li>
                <li>✓ Log permission denial attempts</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Best Practices</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Never trust client-side permission checks alone</li>
                <li>✓ Cache permissions for 5-10 minutes to reduce database queries</li>
                <li>✓ Require re-authentication for sensitive operations</li>
                <li>✓ Review and audit permission assignments regularly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
