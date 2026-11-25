import {
  LIMITS,
  PLANS,
  PRICES_CENTS,
  SAFETY_FEATURES,
  decide,
  isKnownFeature,
  limitFor,
  toPlan,
} from "./feature-policy";

describe("feature policy (DSACS port)", () => {
  it("prices: Free $0, Premium $14.99, Elite $29.99", () => {
    expect(PRICES_CENTS).toEqual({ free: 0, premium: 1499, elite: 2999 });
  });

  it("free plan gets 10 likes a day; paid plans are unlimited", () => {
    expect(limitFor("free", "match.likes")).toBe(10);
    expect(limitFor("premium", "match.likes")).toBe(-1);
    expect(limitFor("elite", "match.likes")).toBe(-1);
  });

  it("video is Elite only; voice and chat are Premium and up", () => {
    expect(limitFor("free", "video.start")).toBe(0);
    expect(limitFor("premium", "video.start")).toBe(0);
    expect(limitFor("elite", "video.start")).toBe(-1);
    expect(limitFor("free", "voice.start")).toBe(0);
    expect(limitFor("premium", "voice.start")).toBe(-1);
    expect(limitFor("free", "chat.send")).toBe(0);
    expect(limitFor("premium", "chat.send")).toBe(-1);
  });

  it("safety features are available on every plan, even when suspended or disabled", () => {
    for (const feature of SAFETY_FEATURES) {
      for (const plan of PLANS) {
        expect(decide({ plan, feature, suspended: true, disabled: true })).toBe("ACCESS_GRANTED");
      }
    }
  });

  it("a higher plan never has less than a lower plan", () => {
    for (const [feature, [free, premium, elite]] of Object.entries(LIMITS)) {
      const rank = (n: number) => (n < 0 ? Infinity : n);
      expect(rank(premium)).toBeGreaterThanOrEqual(rank(free));
      expect(rank(elite)).toBeGreaterThanOrEqual(rank(premium));
      expect(isKnownFeature(feature)).toBe(true);
    }
  });

  it("unknown features have no entitlement", () => {
    expect(limitFor("elite", "does.not.exist")).toBe(0);
    expect(isKnownFeature("does.not.exist")).toBe(false);
    expect(decide({ plan: "elite", feature: "does.not.exist" })).toBe("UPGRADE_REQUIRED");
  });

  it("decision order: suspended, then disabled, then plan", () => {
    expect(decide({ plan: "elite", feature: "match.insights", suspended: true, disabled: true })).toBe("ACCOUNT_SUSPENDED");
    expect(decide({ plan: "elite", feature: "match.insights", disabled: true })).toBe("FEATURE_DISABLED");
    expect(decide({ plan: "free", feature: "match.insights" })).toBe("UPGRADE_REQUIRED");
    expect(decide({ plan: "premium", feature: "match.insights" })).toBe("ACCESS_GRANTED");
  });

  it("relationship features need a match, no block and (for voice/video) consent", () => {
    const base = { plan: "elite" as const, feature: "video.start" };
    expect(decide({ ...base, blocked: true, matched: true, consent: true })).toBe("USER_BLOCKED");
    expect(decide({ ...base })).toBe("MATCH_REQUIRED");
    expect(decide({ ...base, matched: true })).toBe("CONSENT_REQUIRED");
    expect(decide({ ...base, matched: true, consent: true })).toBe("ACCESS_GRANTED");
    // chat needs a match but not call-style consent
    expect(decide({ plan: "premium", feature: "chat.send", matched: true })).toBe("ACCESS_GRANTED");
  });

  it("maps tier strings to plans, defaulting to free", () => {
    expect(toPlan("ELITE")).toBe("elite");
    expect(toPlan("Premium")).toBe("premium");
    expect(toPlan("VIP")).toBe("free");
    expect(toPlan("")).toBe("free");
  });
});
