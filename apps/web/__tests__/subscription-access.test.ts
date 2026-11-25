import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_FEATURES } from "../src/config/subscription-features";
import { PLAN_CATALOG } from "../src/lib/plans";
import { hasCapability } from "../src/lib/subscription-access-policy";

describe("subscription access hierarchy", () => {
  it("orders pricing from Free to Premium to Elite", () => {
    expect(PLAN_CATALOG.FREE.priceMonthly).toBe(0);
    expect(PLAN_CATALOG.PREMIUM.priceMonthly).toBe(14.99);
    expect(PLAN_CATALOG.ELITE.priceMonthly).toBe(29.99);
  });

  it("gives Premium communication and Elite all communication capabilities", () => {
    expect(hasCapability("FREE", "CHAT")).toBe(false);
    expect(hasCapability("FREE", "VOICE")).toBe(false);
    expect(hasCapability("FREE", "VIDEO")).toBe(false);

    expect(hasCapability("PREMIUM", "CHAT")).toBe(true);
    expect(hasCapability("PREMIUM", "VOICE")).toBe(true);
    expect(hasCapability("PREMIUM", "VIDEO")).toBe(false);
    expect(hasCapability("PREMIUM", "INCALL")).toBe(false);

    expect(hasCapability("ELITE", "CHAT")).toBe(true);
    expect(hasCapability("ELITE", "VOICE")).toBe(true);
    expect(hasCapability("ELITE", "VIDEO")).toBe(true);
    expect(hasCapability("ELITE", "INCALL")).toBe(true);
  });

  it("makes every Premium feature available to Elite", () => {
    const premiumFeatures = SUBSCRIPTION_FEATURES.filter((feature) =>
      feature.plans.includes("PREMIUM"),
    );

    expect(premiumFeatures.length).toBeGreaterThan(0);
    expect(
      premiumFeatures.every((feature) => feature.plans.includes("ELITE")),
    ).toBe(true);
  });
});
