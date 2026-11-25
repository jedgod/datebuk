import { NextRequest, NextResponse } from "next/server";

interface UserPayload {
  id: string;
  role: string;
  permissions: string[];
}

/**
 * Extract user from request (from JWT token or session)
 * This is a mock implementation - replace with actual auth logic
 */
export function getUserFromRequest(req: NextRequest): UserPayload | null {
  // In a real app, decode JWT token from Authorization header
  // or get from session
  try {
    // Mock user for demonstration
    const user: UserPayload = {
      id: "user-123",
      role: "admin",
      permissions: [
        "view-all-tickets",
        "edit-all-tickets",
        "manage-roles",
        "view-security-logs",
      ],
    };
    return user;
  } catch {
    return null;
  }
}

/**
 * Middleware to check permissions on API routes
 * Usage: const handler = requirePermission(myHandler, "manage-roles");
 */
export function requirePermission(
  handler: (req: NextRequest) => Promise<Response>,
  requiredPermissions: string | string[]
) {
  return async (req: NextRequest) => {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has required permission(s)
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasPermission = permissions.some((p) =>
      user.permissions.includes(p)
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have permission to access this resource",
        },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * Middleware to require ALL permissions
 * Usage: const handler = requireAllPermissions(myHandler, ["manage-roles", "view-security-logs"]);
 */
export function requireAllPermissions(
  handler: (req: NextRequest) => Promise<Response>,
  requiredPermissions: string[]
) {
  return async (req: NextRequest) => {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((p) =>
      user.permissions.includes(p)
    );

    if (!hasAllPermissions) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have all required permissions",
        },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * Check if user has permission
 */
export function checkPermission(
  user: UserPayload | null,
  requiredPermissions: string | string[]
): boolean {
  if (!user) return false;

  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Check if user has all permissions
 */
export function checkAllPermissions(
  user: UserPayload | null,
  requiredPermissions: string[]
): boolean {
  if (!user) return false;

  return requiredPermissions.every((p) =>
    user.permissions.includes(p)
  );
}

/**
 * Log permission denial for audit trail
 */
export async function logPermissionDenial(
  userId: string,
  resource: string,
  requiredPermissions: string[]
) {
  // In a real app, log this to your audit database
  console.warn(
    `[RBAC] Permission denied for user ${userId} on resource ${resource}`,
    requiredPermissions
  );

  // TODO: Send to audit logging service
  // await auditLog.create({
  //   userId,
  //   action: "PERMISSION_DENIED",
  //   resource,
  //   requiredPermissions,
  //   timestamp: new Date(),
  // });
}
