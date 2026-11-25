"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ChevronDown, ChevronUp, Edit, Plus, Lock, Unlock } from "lucide-react";
import Link from "next/link";

interface Permission {
  name: string;
  description: string;
  category: "ticket" | "staff" | "moderation" | "security" | "config";
}

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  color: string;
  permissions: Permission[];
  tier: "basic" | "standard" | "advanced" | "admin";
}

const roles: Role[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    description: "Unrestricted access to all features and settings",
    usersCount: 2,
    color: "red",
    tier: "admin",
    permissions: [
      // Ticket Management
      { name: "View All Tickets", description: "Access to all tickets in the system", category: "ticket" },
      { name: "Edit All Tickets", description: "Modify any ticket", category: "ticket" },
      { name: "Delete Tickets", description: "Permanently remove tickets", category: "ticket" },
      { name: "Assign Any Ticket", description: "Reassign tickets to any staff member", category: "ticket" },
      { name: "Override Decisions", description: "Override ticket decisions", category: "ticket" },

      // Staff Management
      { name: "View All Staff", description: "See all staff members and profiles", category: "staff" },
      { name: "Create Staff", description: "Add new staff members", category: "staff" },
      { name: "Edit Staff", description: "Modify staff profiles and data", category: "staff" },
      { name: "Delete Staff", description: "Remove staff accounts", category: "staff" },
      { name: "View Activity Log", description: "See all staff activity logs", category: "staff" },
      { name: "View Performance", description: "Access all staff performance metrics", category: "staff" },
      { name: "Manage Roles", description: "Create, edit, and assign roles", category: "staff" },

      // Moderation
      { name: "Moderate Content", description: "Review and approve/reject content", category: "moderation" },
      { name: "Broadcast Messages", description: "Send system-wide announcements", category: "moderation" },
      { name: "Quarantine Videos", description: "Manage quarantined videos", category: "moderation" },
      { name: "Override Moderation", description: "Override AI moderation decisions", category: "moderation" },

      // Security
      { name: "View Security Logs", description: "Access security event logs", category: "security" },
      { name: "Manage Security", description: "Configure security settings", category: "security" },
      { name: "View Risk Scores", description: "See user risk assessments", category: "security" },
      { name: "IP Monitoring", description: "Track and monitor IP addresses", category: "security" },

      // Configuration
      { name: "Configure System", description: "Change system settings", category: "config" },
      { name: "Manage Integrations", description: "Set up and manage integrations", category: "config" },
      { name: "Run Experiments", description: "Create and manage A/B tests", category: "config" },
      { name: "Access API", description: "Full API access", category: "config" },
    ],
  },
  {
    id: "manager",
    name: "Support Manager",
    description: "Manage support team and tickets",
    usersCount: 3,
    color: "blue",
    tier: "advanced",
    permissions: [
      { name: "View Assigned Tickets", description: "See tickets assigned to team", category: "ticket" },
      { name: "Edit Team Tickets", description: "Modify team's tickets", category: "ticket" },
      { name: "Assign Team Tickets", description: "Assign tickets to team members", category: "ticket" },
      { name: "View Team Staff", description: "See team member profiles", category: "staff" },
      { name: "View Team Activity", description: "See team activity logs", category: "staff" },
      { name: "View Team Performance", description: "Access team performance metrics", category: "staff" },
      { name: "Moderate Content", description: "Review flagged content", category: "moderation" },
      { name: "View Risk Scores", description: "See user risk assessments", category: "security" },
      { name: "View Reports", description: "Generate team reports", category: "config" },
    ],
  },
  {
    id: "agent",
    name: "Support Agent",
    description: "Handle customer support tickets",
    usersCount: 7,
    color: "green",
    tier: "standard",
    permissions: [
      { name: "View Own Tickets", description: "See assigned tickets only", category: "ticket" },
      { name: "Edit Own Tickets", description: "Modify own assigned tickets", category: "ticket" },
      { name: "Request Transfer", description: "Request ticket reassignment", category: "ticket" },
      { name: "View Own Performance", description: "See personal performance metrics", category: "staff" },
      { name: "View Own Activity", description: "See personal activity log", category: "staff" },
      { name: "View Moderation Queue", description: "See moderation items (read-only)", category: "moderation" },
      { name: "Submit Feedback", description: "Provide feature requests and feedback", category: "config" },
    ],
  },
  {
    id: "readonly",
    name: "Read Only",
    description: "View-only access to dashboard",
    usersCount: 0,
    color: "gray",
    tier: "basic",
    permissions: [
      { name: "View Dashboard", description: "Access readonly dashboard", category: "ticket" },
      { name: "View Reports", description: "Generate and view reports", category: "config" },
    ],
  },
];

const categoryNames = {
  ticket: "📋 Ticket Management",
  staff: "👥 Staff Management",
  moderation: "🎬 Content Moderation",
  security: "🔐 Security & Monitoring",
  config: "⚙️ System Configuration",
};

export default function StaffRolesPage() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Roles & Granular Permissions
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage role-based access control with fine-grained permission control
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Role
          </Button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{
                      backgroundColor: role.color === "red" ? "#ef4444" : role.color === "blue" ? "#3b82f6" : role.color === "green" ? "#22c55e" : "#9ca3af",
                    }}
                  />
                  <p className="font-semibold text-slate-900 dark:text-white">{role.name}</p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{role.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{role.usersCount} users</Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {role.tier}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Role Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                {/* Role Header */}
                <button
                  onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: role.color === "red" ? "#ef4444" : role.color === "blue" ? "#3b82f6" : role.color === "green" ? "#22c55e" : "#9ca3af",
                      }}
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{role.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{role.usersCount} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {role.tier}
                    </Badge>
                    {expandedRole === role.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </button>

                {/* Role Details */}
                {expandedRole === role.id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-6">
                    {/* Permissions by Category */}
                    {["ticket", "staff", "moderation", "security", "config"].map((category) => {
                      const categoryPermissions = role.permissions.filter((p) => p.category === category);
                      if (categoryPermissions.length === 0) return null;

                      return (
                        <div key={category}>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                            {categoryNames[category as keyof typeof categoryNames]}
                          </h4>
                          <div className="space-y-2 ml-4">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.name} className="flex items-start gap-3">
                                <Unlock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {permission.name}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Denied Permissions (for non-admin roles) */}
                    {role.id !== "superadmin" && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Restricted Access</h4>
                        <div className="space-y-2 ml-4">
                          {[
                            "Delete Tickets",
                            "Delete Staff",
                            "Manage Roles",
                            "Configure System",
                            "Run Experiments",
                          ].map((denied) => (
                            <div key={denied} className="flex items-start gap-3">
                              <Lock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 dark:text-slate-400">{denied}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Role
                      </Button>
                      <Button variant="outline" size="sm">
                        View Members
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permission Inheritance */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Roles are organized in a hierarchy where higher-tier roles build on lower ones:
              </p>
              <div className="space-y-2">
                {[
                  { tier: "Admin", role: "Superadmin", perms: "Unrestricted access" },
                  { tier: "Advanced", role: "Support Manager", perms: "Team management + ticket access" },
                  { tier: "Standard", role: "Support Agent", perms: "Personal queue + feedback" },
                  { tier: "Basic", role: "Read Only", perms: "Dashboard viewing only" },
                ].map((item) => (
                  <div key={item.role} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white w-24">{item.tier}</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.role}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.perms}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>✓ Use the principle of least privilege - assign only necessary permissions</li>
              <li>✓ Regularly review staff roles and permissions</li>
              <li>✓ Create custom roles for specific workflows</li>
              <li>✓ Log all permission changes for audit trails</li>
              <li>✓ Require approval for Admin role assignment</li>
              <li>✓ Implement time-based permissions for sensitive operations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
