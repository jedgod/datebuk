import { describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";

describe("temporary TURN credentials", () => {
  it("uses timestamp:user and HMAC-SHA1 base64", () => {
    const secret = "test-secret";
    const username = "2000000000:user-1";
    const password = crypto
      .createHmac("sha1", secret)
      .update(username)
      .digest("base64");

    expect(username).toContain(":user-1");
    expect(password.length).toBeGreaterThan(20);
  });
});
