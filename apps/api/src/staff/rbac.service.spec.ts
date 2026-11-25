import { RbacService } from "./rbac.service";

/**
 * Regression test for Finding A1: JwtStrategy only ever set `req.user.userId`, but
 * StaffController/AdminRbacController read `req.user.id` (always undefined). Because
 * Prisma silently drops `undefined` filter values (`where: { userId: undefined }`
 * becomes `where: {}`), userHasPermission(undefined, ...) used to match *any* staff
 * member's role, letting a plain authenticated user pass every permission check. The
 * fix added an explicit guard that fails closed instead of broadening the query.
 */
describe("RbacService permission checks reject an unresolved subject", () => {
  function buildService(staffRoleRows: unknown[]) {
    const prisma = {
      staffRole: {
        findMany: jest.fn().mockResolvedValue(staffRoleRows),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    return { service: new RbacService(prisma), prisma };
  }

  it("userHasPermission throws instead of querying when staffId is undefined", async () => {
    const { service, prisma } = buildService([
      { role: { permissions: [{ permission: { key: "manage_staff" } }] } },
    ]);

    await expect(service.userHasPermission(undefined as any, "manage_staff")).rejects.toThrow();
    expect(prisma.staffRole.findMany).not.toHaveBeenCalled();
  });

  it("userHasPermission throws instead of querying when staffId is an empty string", async () => {
    const { service, prisma } = buildService([]);
    await expect(service.userHasPermission("" as any, "manage_staff")).rejects.toThrow();
    expect(prisma.staffRole.findMany).not.toHaveBeenCalled();
  });

  it("userHasAnyPermission and userHasAllPermissions also fail closed on an empty subject", async () => {
    const { service } = buildService([]);
    await expect(service.userHasAnyPermission(undefined as any, ["manage_staff"])).rejects.toThrow();
    await expect(service.userHasAllPermissions(undefined as any, ["manage_staff"])).rejects.toThrow();
  });

  it("userHasPermission still works normally for a real subject id", async () => {
    const { service, prisma } = buildService([
      { role: { permissions: [{ permission: { key: "manage_staff" } }] } },
    ]);

    await expect(service.userHasPermission("real-user-id", "manage_staff")).resolves.toBe(true);
    expect(prisma.staffRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "real-user-id" } }),
    );
  });
});
