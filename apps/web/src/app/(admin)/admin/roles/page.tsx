"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowLeft,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Permission = {
  id: string;
  name: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Set<string>;
  memberCount: number;
  isSystem: boolean; // System roles cannot be deleted
};

const ALL_PERMISSIONS: Permission[] = [
  // My Queue
  { id: "queue.view", name: "View My Queue", description: "Access personal ticket queue" },
  { id: "queue.all", name: "View All Queues", description: "View all team queues (Admin only)" },

  // Tickets
  { id: "tickets.view_own", name: "View Own Tickets", description: "See only assigned tickets" },
  { id: "tickets.view_all", name: "View All Tickets", description: "View all platform tickets" },
  { id: "tickets.close", name: "Close Tickets", description: "Close assigned tickets" },
  { id: "tickets.escalate", name: "Escalate Tickets", description: "Escalate tickets to senior staff" },

  // Users
  { id: "users.search", name: "Search Users", description: "Search customer database" },
  { id: "users.view_details", name: "View User Details", description: "Access detailed user info" },
  { id: "users.edit", name: "Edit User Info", description: "Modify customer details" },

  // Live Chat
  { id: "chat.view", name: "View Live Chats", description: "Monitor active chat sessions" },
  { id: "chat.transfer", name: "Transfer Chats", description: "Transfer chats to other agents" },
  { id: "chat.initiate", name: "Initiate Chat", description: "Start new chat sessions" },

  // Reports
  { id: "reports.view_own", name: "View Own Reports", description: "View personal metrics only" },
  { id: "reports.view_all", name: "View All Reports", description: "View team performance reports" },
  { id: "reports.export", name: "Export Reports", description: "Download report data" },

  // Staff Notes
  { id: "notes.create", name: "Create Notes", description: "Add staff notes" },
  { id: "notes.edit_own", name: "Edit Own Notes", description: "Modify own notes only" },
  { id: "notes.edit_all", name: "Edit All Notes", description: "Modify any note (Senior+)" },
  { id: "notes.delete", name: "Delete Notes", description: "Remove notes (Admin only)" },

  // Staff Management
  { id: "staff.add", name: "Add Staff", description: "Create new staff accounts" },
  { id: "staff.edit", name: "Edit Staff", description: "Modify staff details" },
  { id: "staff.deactivate", name: "Deactivate Staff", description: "Disable staff accounts" },
  { id: "staff.view_activity", name: "View Activity Log", description: "Access staff activity logs" },

  // Queue Rules
  { id: "queue.view_rules", name: "View Queue Rules", description: "View rule configuration" },
  { id: "queue.suggest_rules", name: "Suggest Rules", description: "Propose new rules (Senior only)" },
  { id: "queue.manage_rules", name: "Manage Rules", description: "Create/edit rules (Admin only)" },

  // Canned Responses
  { id: "responses.view", name: "View Responses", description: "Access template library" },
  { id: "responses.use", name: "Use Responses", description: "Apply templates in chats" },
  { id: "responses.propose", name: "Propose Responses", description: "Suggest new templates" },
  { id: "responses.manage", name: "Manage Responses", description: "Create/edit templates (Admin only)" },

  // Roles & Permissions
  { id: "roles.view", name: "View Roles", description: "Access role settings" },
  { id: "roles.manage", name: "Manage Roles", description: "Create/edit roles (Admin only)" },
  { id: "ADMIN_MANAGE_SUBSCRIPTIONS", name: "Manage Subscriptions", description: "Toggle subscription feature flags" },
];

const INITIAL_ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access and management capabilities",
    level: 4,
    permissions: new Set(ALL_PERMISSIONS.map((p) => p.id)),
    memberCount: 2,
    isSystem: true,
  },
  {
    id: "senior_support",
    name: "Senior Support",
    description: "Extended access for experienced team leaders",
    level: 3,
    permissions: new Set([
      "queue.view",
      "queue.all",
      "tickets.view_all",
      "tickets.close",
      "tickets.escalate",
      "users.search",
      "users.view_details",
      "users.edit",
      "chat.view",
      "chat.transfer",
      "chat.initiate",
      "reports.view_all",
      "notes.create",
      "notes.edit_all",
      "staff.view_activity",
      "queue.view_rules",
      "queue.suggest_rules",
      "responses.view",
      "responses.use",
      "responses.propose",
      "roles.view",
    ]),
    memberCount: 5,
    isSystem: true,
  },
  {
    id: "support_agent",
    name: "Regular Support",
    description: "Standard support agent with core ticket handling",
    level: 2,
    permissions: new Set([
      "queue.view",
      "tickets.view_own",
      "tickets.close",
      "users.search",
      "users.view_details",
      "chat.view",
      "chat.transfer",
      "chat.initiate",
      "reports.view_own",
      "notes.create",
      "notes.edit_own",
      "responses.view",
      "responses.use",
      "roles.view",
    ]),
    memberCount: 12,
    isSystem: true,
  },
  {
    id: "junior_support",
    name: "Junior Support",
    description: "Limited access for new team members",
    level: 1,
    permissions: new Set([
      "queue.view",
      "tickets.view_own",
      "users.search",
      "chat.view",
      "reports.view_own",
      "notes.create",
      "responses.view",
      "responses.use",
      "roles.view",
    ]),
    memberCount: 8,
    isSystem: true,
  },
];

export default function RolesAndPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const handleEditClick = (role: Role) => {
    setEditingRole({ ...role, permissions: new Set(role.permissions) });
    setShowDialog(true);
  };

  const handleDeleteClick = (role: Role) => {
    if (role.isSystem) {
      alert("System roles cannot be deleted");
      return;
    }
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      setRoles(roles.filter((r) => r.id !== roleToDelete.id));
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      if (selectedRole?.id === roleToDelete.id) {
        setSelectedRole(null);
      }
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!editingRole) return;

    const newPermissions = new Set(editingRole.permissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }

    setEditingRole({
      ...editingRole,
      permissions: newPermissions,
    });
  };

  const handleSaveRole = () => {
    if (!editingRole) return;

    setRoles(
      roles.map((r) => (r.id === editingRole.id ? editingRole : r))
    );

    setShowDialog(false);
    setEditingRole(null);
    setSelectedRole(editingRole);
  };

  const permissionCategories = [
    {
      title: "Queue Management",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("queue.")),
    },
    {
      title: "Ticket Management",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("tickets.")),
    },
    {
      title: "User Management",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("users.")),
    },
    {
      title: "Live Chat",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("chat.")),
    },
    {
      title: "Reports & Analytics",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("reports.")),
    },
    {
      title: "Staff Notes",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("notes.")),
    },
    {
      title: "Staff Administration",
      permissions: ALL_PERMISSIONS.filter((p) => p.id.startsWith("staff.")),
    },
    {
      title: "Configuration",
      permissions: ALL_PERMISSIONS.filter(
        (p) => p.id.startsWith("responses.") || p.id.startsWith("roles.")
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Roles & Permissions
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage staff roles and their permissions across the platform
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingRole(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Role
          </Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  All Roles
                </h2>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-6 py-4 transition-colors ${
                      selectedRole?.id === role.id
                        ? "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {role.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {Array.from({ length: role.level }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-amber-600"
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Details */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedRole.name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {selectedRole.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEditClick(selectedRole)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button
                        onClick={() => handleDeleteClick(selectedRole)}
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="p-6 space-y-6">
                  {permissionCategories.map((category) => (
                    <div key={category.title}>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                        {category.title}
                      </h3>
                      <div className="space-y-2">
                        {category.permissions.map((permission) => {
                          const hasPermission = selectedRole.permissions.has(permission.id);
                          return (
                            <div
                              key={permission.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div
                                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  hasPermission
                                    ? "bg-green-600 border-green-600"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {hasPermission && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                  {permission.name}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Stats */}
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Permissions Granted
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {selectedRole.permissions.size}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Total Permissions
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {ALL_PERMISSIONS.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center min-h-96">
                <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-center">
                  Select a role to view and manage its permissions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle>
              {editingRole?.id ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.id
                ? "Modify permissions for this role"
                : "Set up a new staff role with specific permissions"}
            </DialogDescription>
          </DialogHeader>

          {editingRole && (
            <div className="space-y-4 py-4">
              {/* Expandable Permission Categories */}
              {permissionCategories.map((category) => (
                <div key={category.title} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {category.title}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {category.permissions.filter((p) =>
                        editingRole.permissions.has(p.id)
                      ).length}/{category.permissions.length}
                    </span>
                  </button>
                  <div className="p-3 space-y-2 bg-white dark:bg-slate-800">
                    {category.permissions.map((permission) => {
                      const hasPermission = editingRole.permissions.has(
                        permission.id
                      );
                      return (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() =>
                              handlePermissionToggle(permission.id)
                            }
                            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {permission.name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {permission.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{roleToDelete?.name}" role?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="destructive"
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
