import { StaffService } from "./staff.service";
import { hashSecret } from "../common/security/hash";

/**
 * Regression test for Finding A4: changePassword() used to hash the supplied
 * `currentPassword` into an unused local variable and never actually compared it
 * against the stored hash, so any string was accepted as "the current password" and
 * the account password was overwritten unconditionally.
 */
// bcrypt at the production cost (12) takes seconds on a loaded machine; hash once and allow for it.
jest.setTimeout(60_000);

describe("StaffService.changePassword", () => {
  let realHash: string;
  beforeAll(async () => {
    realHash = await hashSecret("the-real-current-password");
  });

  async function buildService(storedPasswordHash: string) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "u1", password: storedPasswordHash }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "u1", ...data })),
      },
      session: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    } as any;
    // changePassword() must not touch the alert or RBAC services. These stubs throw on any
    // access, so the test fails loudly if that ever changes (rather than silently passing).
    const mustNotBeUsed = (name: string) =>
      new Proxy({}, { get: (_t, prop) => { throw new Error(`${name}.${String(prop)} used by changePassword`); } }) as any;
    return {
      service: new StaffService(prisma, mustNotBeUsed("SecurityAlertService"), mustNotBeUsed("RbacService")),
      prisma,
    };
  }

  it("rejects the change when currentPassword does not match the stored hash", async () => {
    const storedHash = realHash;
    const { service, prisma } = await buildService(storedHash);

    await expect(
      service.changePassword("u1", "totally-wrong-guess", "brandNewPassw0rd"),
    ).rejects.toThrow();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("accepts the change when currentPassword matches the stored hash", async () => {
    const storedHash = realHash;
    const { service, prisma } = await buildService(storedHash);

    await expect(
      service.changePassword("u1", "the-real-current-password", "brandNewPassw0rd"),
    ).resolves.toBeDefined();
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    // Changing the password must also revoke every other live session for that account.
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("does not revoke sessions or update anything when the current password is wrong", async () => {
    const storedHash = realHash;
    const { service, prisma } = await buildService(storedHash);
    await expect(service.changePassword("u1", "wrong", "brandNewPassw0rd")).rejects.toBeDefined();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.session.updateMany).not.toHaveBeenCalled();
  });
});
