import { describe, expect, it } from "vitest";
import crypto from "node:crypto";

describe("TURN REST credentials", () => {
  it("creates an HMAC-SHA1 base64 password", () => {
    const username = "2000000000:user-123";
    const password = crypto
      .createHmac("sha1", "secret")
      .update(username)
      .digest("base64");

    expect(username).toContain(":user-123");
    expect(password.length).toBeGreaterThan(20);
  });
});
