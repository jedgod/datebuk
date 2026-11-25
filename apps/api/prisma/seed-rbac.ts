/**
 * Bootstraps the DB-backed staff RBAC system (Permission / Role / RolePermission /
 * StaffRole). Without this, every one of those tables starts empty and there is no
 * code path anywhere that can create the first row — createStaff requires manage_staff,
 * creating a Role requires manage_roles, and both require a StaffRole assignment that
 * can only exist after a Role does. Safe to re-run: every write is an upsert.
 *
 * Usage:
 *   npx ts-node prisma/seed-rbac.ts
 *     -> creates/updates the canonical permission set and a "Super Admin" system role
 *        containing all of them. Does not touch any user.
 *
 *   BOOTSTRAP_ADMIN_EMAIL=you@example.com npx ts-node prisma/seed-rbac.ts
 *     -> also creates (or elevates, if the email already exists) that user to
 *        role: SUPERADMIN and assigns them the Super Admin StaffRole.
 *        Optionally set BOOTSTRAP_ADMIN_PASSWORD to pick the password; otherwise one
 *        is generated and printed once (never stored in plaintext).
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { hashSecret } from "../src/common/security/hash";

const prisma = new PrismaClient();

// Every permission key actually checked via RbacService.userHasPermission /
// @RequireStaffPermission anywhere in the codebase (staff.controller.ts,
// admin-rbac.controller.ts) as of this writing.
const BOOTSTRAP_PERMISSIONS: Array<{ key: string; name: string; category: string; description: string }> = [
  { key: "manage_staff", name: "Manage Staff", category: "staff_management", description: "Create, update, suspend, and revoke staff accounts" },
  { key: "manage_roles", name: "Manage Roles", category: "staff_management", description: "Create, update, and delete staff roles" },
  { key: "revoke_staff", name: "Revoke Staff", category: "staff_management", description: "Suspend or revoke a staff member's access" },
  { key: "assign_tasks", name: "Assign Tasks", category: "task_management", description: "Assign task items to staff" },
  { key: "view_staff_activity", name: "View Staff Activity", category: "staff_management", description: "View another staff member's activity log" },
  { key: "view_staff_performance", name: "View Staff Performance", category: "staff_management", description: "View another staff member's performance metrics" },
  { key: "manage_permissions", name: "Manage Permissions", category: "security", description: "Create new permission definitions" },
];

const SUPER_ADMIN_ROLE_NAME = "Super Admin";

async function main() {
  const permissions = await Promise.all(
    BOOTSTRAP_PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { key: p.key },
        update: { name: p.name, category: p.category, description: p.description },
        create: p,
      }),
    ),
  );
  console.log(`✓ ${permissions.length} bootstrap permissions ensured`);

  const role = await prisma.role.upsert({
    where: { name: SUPER_ADMIN_ROLE_NAME },
    update: {},
    create: {
      name: SUPER_ADMIN_ROLE_NAME,
      description: "Full staff-management access. Created by the RBAC bootstrap seed — cannot be deleted (isSystem).",
      isSystem: true,
    },
  });

  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: {},
        create: { roleId: role.id, permissionId: p.id },
      }),
    ),
  );
  console.log(`✓ "${SUPER_ADMIN_ROLE_NAME}" role ensured with all ${permissions.length} permissions attached`);

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  if (!email) {
    console.log("\nBOOTSTRAP_ADMIN_EMAIL not set — permission/role bootstrap complete, no user created.");
    console.log(`Re-run with BOOTSTRAP_ADMIN_EMAIL=you@example.com to also create (or elevate) the first Super Admin user.`);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const providedPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const generatedPassword = providedPassword || randomBytes(12).toString("hex");

  let userId: string;
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "SUPERADMIN", accountStatus: "ACTIVE" },
    });
    userId = existing.id;
    console.log(`\n✓ Existing user ${email} elevated to role: SUPERADMIN (password unchanged)`);
  } else {
    const passwordHash = await hashSecret(generatedPassword);
    const created = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        emailVerified: true,
        role: "SUPERADMIN",
        accountStatus: "ACTIVE",
        mustChangePassword: !providedPassword,
        staffProfile: { create: { displayName: "Super Admin" } },
      },
    });
    userId = created.id;
    console.log(`\n✓ Created ${email} with role: SUPERADMIN`);
    if (!providedPassword) {
      console.log(`  Generated password (shown once, not stored anywhere): ${generatedPassword}`);
      console.log(`  mustChangePassword is set — they'll be required to pick a new one on first login.`);
    }
  }

  await prisma.staffRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
  console.log(`✓ Assigned "${SUPER_ADMIN_ROLE_NAME}" StaffRole to ${email}`);
  console.log("\nBootstrap complete.");
}

main()
  .catch((e) => {
    console.error("❌ RBAC bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
