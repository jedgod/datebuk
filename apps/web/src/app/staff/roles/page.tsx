'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';

interface Permission {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Array<{ permission: Permission }>;
  isSystem: boolean;
}

export default function RolesPage() {
  const { accessToken } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(apiEndpoint('/admin/roles'), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(apiEndpoint('/admin/permissions'), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!rolesRes.ok || !permsRes.ok) throw new Error('Failed to fetch data');

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading roles...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Roles & Permissions</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="col-span-1 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Roles</h2>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">{role.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{role.permissions.length} permissions</p>
                  {role.isSystem && <p className="text-xs text-blue-600 font-medium">System Role</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Role Details */}
          <div className="col-span-2">
            {selectedRole ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRole.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedRole.description}</p>
                  {selectedRole.isSystem && (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      System Role (Cannot be deleted)
                    </span>
                  )}
                </div>

                {/* Permissions by Category */}
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => {
                    const hasPerms = selectedRole.permissions.some(rp =>
                      perms.some(p => p.id === rp.permission.id)
                    );

                    if (!hasPerms) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {perms.map(perm => {
                            const hasPermission = selectedRole.permissions.some(
                              rp => rp.permission.id === perm.id
                            );

                            return (
                              <div
                                key={perm.id}
                                className={`p-3 rounded-lg border-2 ${
                                  hasPermission
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-gray-50 border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{perm.name}</p>
                                    <p className="text-xs text-gray-600">{perm.key}</p>
                                  </div>
                                  {hasPermission && (
                                    <span className="text-green-600 font-bold">✓</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {!selectedRole.isSystem && (
                  <div className="mt-8 pt-6 border-t space-y-2">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                      Edit Role
                    </button>
                    <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">
                      Delete Role
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">Select a role to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
