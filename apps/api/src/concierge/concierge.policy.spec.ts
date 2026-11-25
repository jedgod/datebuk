import { moderateConciergeText } from "./concierge.policy";

describe("concierge text moderation", () => {
  it("allows a respectful introduction request", () => {
    expect(moderateConciergeText("I enjoyed our conversation and would like a respectful introduction.")).toEqual({
      allowed: true,
      decision: "ALLOW",
      matchedRules: [],
    });
  });

  it("rejects off-platform contact information", () => {
    const result = moderateConciergeText("Please ask them to call 301-555-1212.");
    expect(result.allowed).toBe(false);
    expect(result.matchedRules).toContain("OFF_PLATFORM_PHONE");
  });

  it("rejects coercive outreach", () => {
    const result = moderateConciergeText("Make her reply because she owes me an answer.");
    expect(result.allowed).toBe(false);
    expect(result.matchedRules).toContain("COERCION");
  });
});
