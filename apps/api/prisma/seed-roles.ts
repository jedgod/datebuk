import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...');

  // Clear existing
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  // ============ PERMISSIONS ============
  const permissions = [
    // Staff Management
    { key: 'manage_staff', name: 'Manage Staff', category: 'staff_management' },
    { key: 'create_staff', name: 'Create Staff', category: 'staff_management' },
    { key: 'view_staff', name: 'View Staff', category: 'staff_management' },
    { key: 'edit_staff', name: 'Edit Staff', category: 'staff_management' },
    { key: 'revoke_staff', name: 'Revoke Staff Access', category: 'staff_management' },
    { key: 'view_staff_activity', name: 'View Staff Activity', category: 'staff_management' },
    { key: 'view_staff_performance', name: 'View Staff Performance', category: 'staff_management' },

    // Task Management
    { key: 'assign_tasks', name: 'Assign Tasks', category: 'task_management' },
    { key: 'view_tasks', name: 'View Tasks', category: 'task_management' },
    { key: 'edit_tasks', name: 'Edit Tasks', category: 'task_management' },
    { key: 'complete_tasks', name: 'Complete Tasks', category: 'task_management' },

    // Security & Fraud
    { key: 'view_fraud', name: 'View Fraud Events', category: 'security' },
    { key: 'manage_fraud', name: 'Manage Fraud Events', category: 'security' },
    { key: 'ban_user', name: 'Ban Users', category: 'security' },
    { key: 'moderate_content', name: 'Moderate Content', category: 'security' },

    // Analytics & Reports
    { key: 'view_analytics', name: 'View Analytics', category: 'analytics' },
    { key: 'export_data', name: 'Export Data', category: 'analytics' },
    { key: 'view_reports', name: 'View Reports', category: 'analytics' },

    // System Management
    { key: 'manage_roles', name: 'Manage Roles', category: 'system' },
    { key: 'manage_permissions', name: 'Manage Permissions', category: 'system' },
    { key: 'view_logs', name: 'View Logs', category: 'system' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map(p => prisma.permission.create({ data: p }))
  );

  console.log(`Created ${createdPermissions.length} permissions`);

  // ============ ROLES ============
  const roleDefinitions = [
    {
      name: 'SUPPORT_AGENT',
      description: 'Basic support agent - can handle tasks and view cases',
      permissionKeys: ['view_tasks', 'complete_tasks', 'view_staff_activity'],
    },
    {
      name: 'SUPPORT_MANAGER',
      description: 'Support manager - can assign tasks and manage agents',
      permissionKeys: [
        'view_tasks',
        'complete_tasks',
        'assign_tasks',
        'view_staff_activity',
        'view_staff_performance',
        'view_analytics',
      ],
    },
    {
      name: 'FRAUD_SPECIALIST',
      description: 'Handles fraud detection and prevention',
      permissionKeys: [
        'view_fraud',
        'manage_fraud',
        'ban_user',
        'view_analytics',
        'export_data',
        'view_tasks',
        'complete_tasks',
      ],
    },
    {
      name: 'MODERATOR',
      description: 'Content moderation specialist',
      permissionKeys: [
        'moderate_content',
        'ban_user',
        'view_analytics',
        'view_tasks',
        'complete_tasks',
      ],
    },
    {
      name: 'STAFF_ADMIN',
      description: 'Staff administration - manage staff accounts and roles',
      permissionKeys: [
        'manage_staff',
        'create_staff',
        'view_staff',
        'edit_staff',
        'revoke_staff',
        'view_staff_activity',
        'view_staff_performance',
      ],
    },
    {
      name: 'SYSTEM_ADMIN',
      description: 'Full system access',
      permissionKeys: Object.values(permissions).map(p => p.key), // All permissions
    },
  ];

  const roles = await Promise.all(
    roleDefinitions.map(async role => {
      const permissionIds = createdPermissions
        .filter(p => role.permissionKeys.includes(p.key))
        .map(p => p.id);

      return prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          isSystem: true,
          permissions: {
            create: permissionIds.map(permissionId => ({ permissionId })),
          },
        },
      });
    })
  );

  console.log(`Created ${roles.length} roles`);

  console.log('✅ Roles and permissions seeded successfully');
}

seedRolesAndPermissions()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
