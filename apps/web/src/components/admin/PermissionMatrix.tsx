"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw } from "lucide-react";

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

interface PermissionMatrixProps {
  roles: RolePermission[];
  permissions: Permission[];
  onSave: (rolePermissions: RolePermission[]) => void;
}

export function PermissionMatrix({ roles, permissions, onSave }: PermissionMatrixProps) {
  const [matrix, setMatrix] = useState<RolePermission[]>(roles);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const togglePermission = (roleId: string, permissionId: string) => {
    setMatrix((prev) =>
      prev.map((role) =>
        role.roleId === roleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permissionId]: !role.permissions[permissionId],
              },
            }
          : role
      )
    );
    setUnsavedChanges(true);
  };

  const resetChanges = () => {
    setMatrix(roles);
    setUnsavedChanges(false);
  };

  const handleSave = () => {
    onSave(matrix);
    setUnsavedChanges(false);
  };

  const categories = Array.from(new Set(permissions.map((p) => p.category))).sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Permission Matrix Editor</CardTitle>
          {unsavedChanges && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetChanges}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-semibold text-slate-900 dark:text-white sticky left-0 bg-slate-50 dark:bg-slate-800 min-w-[200px]">
                  Permission
                </th>
                {matrix.map((role) => (
                  <th
                    key={role.roleId}
                    className="text-center p-3 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 min-w-[120px]"
                  >
                    <div>{role.roleName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryPerms = permissions.filter((p) => p.category === category);
                return (
                  <tbody key={category}>
                    <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={matrix.length + 1} className="p-3">
                        <Badge>{category}</Badge>
                      </td>
                    </tr>
                    {categoryPerms.map((permission) => (
                      <tr
                        key={permission.id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900">
                          {permission.name}
                        </td>
                        {matrix.map((role) => {
                          const hasPermission = role.permissions[permission.id] || false;
                          return (
                            <td
                              key={`${role.roleId}-${permission.id}`}
                              className="text-center p-3 cursor-pointer"
                              onClick={() => togglePermission(role.roleId, permission.id)}
                            >
                              <button
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                  hasPermission
                                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePermission(role.roleId, permission.id);
                                }}
                              >
                                {hasPermission ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-slate-700 dark:text-slate-300">Permission Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-400" />
            </div>
            <span className="text-slate-700 dark:text-slate-300">Permission Denied</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
