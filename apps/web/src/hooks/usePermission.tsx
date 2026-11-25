import { useCallback } from "react";

interface UserRole {
  id: string;
  permissions: string[];
}

// Mock hook - replace with actual context/API call
export function usePermission() {
  // In a real app, this would come from UserContext or API
  const userPermissions = [
    "view-all-tickets",
    "edit-all-tickets",
    "view-all-staff",
    "manage-roles",
  ];

  const hasPermission = useCallback(
    (permission: string | string[]) => {
      if (Array.isArray(permission)) {
        // Check if user has ANY of the permissions
        return permission.some((p) => userPermissions.includes(p));
      }
      return userPermissions.includes(permission);
    },
    [userPermissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      // Check if user has ALL of the permissions
      return permissions.every((p) => userPermissions.includes(p));
    },
    [userPermissions]
  );

  const requiresPermission = useCallback(
    (permission: string | string[], fallback?: React.ReactNode) => {
      return {
        allowed: hasPermission(permission),
        fallback: fallback || null,
      };
    },
    [hasPermission]
  );

  return {
    hasPermission,
    hasAllPermissions,
    requiresPermission,
    userPermissions,
  };
}

/**
 * Higher-order component to protect routes/components
 * Usage: const Protected = withPermission(MyComponent, "manage-roles");
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string | string[],
  fallback?: React.ReactNode
) {
  return function PermissionGuard(props: P) {
    const { hasPermission } = usePermission();

    if (!hasPermission(requiredPermissions)) {
      return (
        (fallback as React.ReactNode) || (
          <div className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              You don't have permission to access this content.
            </p>
          </div>
        )
      );
    }

    return <Component {...props} />;
  };
}
