import { decide, namesMatch, type DecisionInput } from "./decision";

const NOW = new Date("2026-11-24T12:00:00Z");

function good(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    id: { firstName: "Star", lastName: "Frank", dob: "1998-03-10", expiry: "2030-01-01", docType: "DRIVER LICENSE FRONT" },
    face: { idFaceFound: true, selfieToIdSimilarity: 97, selfieToSelfieSimilarity: 99 },
    liveness: { passed: true },
    account: { dateOfBirth: new Date("1998-03-10T00:00:00Z"), fullName: "Star Frank" },
    now: NOW,
    ...overrides,
  };
}

describe("identity decision", () => {
  it("accepts a valid ID with a matching, live selfie", () => {
    const d = decide(good());
    expect(d.approved).toBe(true);
    expect(d.reasons).toEqual([]);
    expect(d.checks).toMatchObject({ ageOk: true, docExpired: false, dobMatches: true, nameMatches: true, livenessPassed: true });
  });

  it("rejects when the selfie does not match the ID photo", () => {
    const d = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: 62, selfieToSelfieSimilarity: 99 } }));
    expect(d.approved).toBe(false);
    expect(d.reasons.join(" ")).toMatch(/doesn't match the photo/);
  });

  it("rejects when no face match was returned at all", () => {
    const d = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: null, selfieToSelfieSimilarity: 99 } }));
    expect(d.approved).toBe(false);
  });

  it("rejects when the ID has no readable face", () => {
    const d = decide(good({ face: { idFaceFound: false, selfieToIdSimilarity: null, selfieToSelfieSimilarity: 99 } }));
    expect(d.approved).toBe(false);
    expect(d.reasons.join(" ")).toMatch(/find a face on your ID/);
  });

  it("rejects when the two selfies are not the same person", () => {
    const d = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: 97, selfieToSelfieSimilarity: 40 } }));
    expect(d.approved).toBe(false);
    expect(d.reasons.join(" ")).toMatch(/two selfies/);
  });

  it("rejects when liveness fails", () => {
    const d = decide(good({ liveness: { passed: false, reason: "Turn your head to one side for the second selfie." } }));
    expect(d.approved).toBe(false);
    expect(d.reasons).toContain("Turn your head to one side for the second selfie.");
  });

  it("applies the similarity threshold inclusively", () => {
    const at = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: 90, selfieToSelfieSimilarity: 90 } }));
    const below = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: 89.9, selfieToSelfieSimilarity: 90 } }));
    expect(at.approved).toBe(true);
    expect(below.approved).toBe(false);
  });

  it("rejects an expired ID but accepts one expiring today", () => {
    expect(decide(good({ id: { ...good().id, expiry: "2026-11-23" } })).approved).toBe(false);
    expect(decide(good({ id: { ...good().id, expiry: "2026-11-24" } })).approved).toBe(true);
  });

  it("rejects under-18 holders, and accepts exactly 18 today", () => {
    const under = decide(good({ id: { ...good().id, dob: "2008-11-25" }, account: {} }));
    const exactly18 = decide(good({ id: { ...good().id, dob: "2008-11-24" }, account: {} }));
    expect(under.approved).toBe(false);
    expect(under.checks.ageOk).toBe(false);
    expect(exactly18.approved).toBe(true);
  });

  it("rejects when the ID date of birth differs from the account", () => {
    const d = decide(good({ account: { dateOfBirth: new Date("1990-01-01T00:00:00Z"), fullName: "Star Frank" } }));
    expect(d.approved).toBe(false);
    expect(d.checks.dobMatches).toBe(false);
  });

  it("rejects when the date of birth or expiry cannot be read", () => {
    expect(decide(good({ id: { ...good().id, dob: null } })).approved).toBe(false);
    expect(decide(good({ id: { ...good().id, expiry: null } })).approved).toBe(false);
  });

  it("treats a name mismatch as informational unless required", () => {
    const account = { dateOfBirth: new Date("1998-03-10T00:00:00Z"), fullName: "Someone Else" };
    const soft = decide(good({ account }));
    expect(soft.approved).toBe(true);
    expect(soft.checks.nameMatches).toBe(false);
    expect(decide(good({ account, requireNameMatch: true })).approved).toBe(false);
  });

  it("never puts document data in the user-facing reasons", () => {
    const d = decide(good({ face: { idFaceFound: true, selfieToIdSimilarity: 10, selfieToSelfieSimilarity: 10 } }));
    expect(d.reasons.join(" ")).not.toMatch(/1998|Star|Frank/);
  });
});

describe("namesMatch", () => {
  it("ignores case, accents and extra middle names on the ID", () => {
    expect(namesMatch("jose garcia", "JOSÉ LUIS", "GARCÍA")).toBe(true);
  });
  it("fails when a name part is missing", () => {
    expect(namesMatch("Jane Doe", "Jane", "Smith")).toBe(false);
  });
  it("fails on empty input", () => {
    expect(namesMatch("", "A", "B")).toBe(false);
    expect(namesMatch("A B", null, null)).toBe(false);
  });
});
