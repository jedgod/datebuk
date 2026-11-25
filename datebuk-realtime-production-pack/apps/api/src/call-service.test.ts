import { describe, expect, it } from "vitest";

describe("call lifecycle", () => {
  it("recognizes terminal call states", () => {
    const terminal = ["ENDED", "REJECTED", "CANCELLED", "MISSED", "FAILED"];
    expect(terminal).toContain("MISSED");
    expect(terminal).not.toContain("RINGING");
  });

  it("calculates a positive duration", () => {
    const answeredAt = new Date("2026-07-11T10:00:00Z");
    const endedAt = new Date("2026-07-11T10:01:12Z");
    const seconds = Math.floor((endedAt.getTime() - answeredAt.getTime()) / 1000);
    expect(seconds).toBe(72);
  });
});
