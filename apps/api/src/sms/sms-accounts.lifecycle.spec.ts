import { TRANSITIONS, canTransition, type AccountStatus } from "./sms-accounts.service";

describe("provider account lifecycle", () => {
  const all = Object.keys(TRANSITIONS) as AccountStatus[];

  it("revoked is terminal", () => {
    for (const to of all) expect(canTransition("revoked", to)).toBe(false);
  });
  it("pending must be verified before it can become active", () => {
    expect(canTransition("pending", "active")).toBe(false);
    expect(canTransition("pending", "verified")).toBe(true);
  });
  it("only verified or suspended accounts can be activated (re-validation happens in activate())", () => {
    expect(canTransition("verified", "active")).toBe(true);
    expect(canTransition("suspended", "active")).toBe(true);
    expect(canTransition("rotating", "active")).toBe(true); // rotation restores the prior status
    expect(canTransition("pending", "active")).toBe(false);
  });
  it("active, verified and suspended accounts can be rotated; pending cannot", () => {
    for (const from of ["active", "verified", "suspended"] as AccountStatus[]) expect(canTransition(from, "rotating")).toBe(true);
    expect(canTransition("pending", "rotating")).toBe(false);
  });
  it("every non-revoked state can be revoked, except rotating (finish or fail the rotation first)", () => {
    for (const from of ["pending", "verified", "active", "suspended"] as AccountStatus[]) expect(canTransition(from, "revoked")).toBe(true);
    expect(canTransition("rotating", "revoked")).toBe(false);
  });
});
