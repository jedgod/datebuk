import { MAX_DISPATCH_ATTEMPTS, applyProviderStatus, canTransitionSms, classifyHttp, isTerminal, retryDelaySeconds, type SmsState } from "./sms-state";

describe("SMS delivery state model", () => {
  const states: SmsState[] = ["queued", "dispatching", "accepted", "scheduled", "sending", "sent", "delivered", "undelivered", "failed", "canceled", "uncertain"];

  it("terminal states never move", () => {
    for (const from of ["delivered", "undelivered", "failed", "canceled"] as SmsState[]) {
      expect(isTerminal(from)).toBe(true);
      for (const to of states) expect(canTransitionSms(from, to)).toBe(false);
    }
  });

  it("an ambiguous result can only be resolved forward by evidence, never re-queued", () => {
    expect(canTransitionSms("uncertain", "queued")).toBe(false);
    expect(canTransitionSms("uncertain", "dispatching")).toBe(false);
    expect(canTransitionSms("uncertain", "delivered")).toBe(true);
    expect(canTransitionSms("uncertain", "failed")).toBe(true);
  });

  it("only a rate-limited dispatch may return to queued", () => {
    for (const from of states.filter((s) => s !== "dispatching")) expect(canTransitionSms(from, "queued")).toBe(false);
    expect(canTransitionSms("dispatching", "queued")).toBe(true);
  });

  it("applies in-order callbacks", () => {
    expect(applyProviderStatus("accepted", "sending")).toBe("sending");
    expect(applyProviderStatus("sending", "sent")).toBe("sent");
    expect(applyProviderStatus("sent", "delivered")).toBe("delivered");
  });

  it("tolerates skipped steps; a delayed earlier-state callback after a later one is ignored", () => {
    expect(applyProviderStatus("accepted", "delivered")).toBe("delivered");
    expect(applyProviderStatus("delivered", "sent")).toBeNull();
    expect(applyProviderStatus("delivered", "sending")).toBeNull();
  });

  it("ignores duplicates and unknown statuses", () => {
    expect(applyProviderStatus("sent", "sent")).toBeNull();
    expect(applyProviderStatus("sent", "banana")).toBeNull();
    expect(applyProviderStatus("sent", "")).toBeNull();
  });

  it("a callback cannot advance a message that was never dispatched", () => {
    expect(applyProviderStatus("queued", "delivered")).toBeNull();
    expect(applyProviderStatus("queued", "sent")).toBeNull();
    expect(applyProviderStatus("canceled", "delivered")).toBeNull();
  });

  it("an uncertain message is resolved by a genuine callback", () => {
    expect(applyProviderStatus("uncertain", "delivered")).toBe("delivered");
    expect(applyProviderStatus("uncertain", "queued")).toBe("accepted"); // Twilio queued = we were accepted
    expect(applyProviderStatus("uncertain", "failed")).toBe("failed");
  });

  it("maps Twilio queued to accepted and read to delivered", () => {
    expect(applyProviderStatus("dispatching", "queued")).toBe("accepted");
    expect(applyProviderStatus("sent", "read")).toBe("delivered");
  });
});

describe("provider response classification (what may be retried)", () => {
  it("2xx is accepted", () => {
    expect(classifyHttp(201)).toBe("accepted");
    expect(classifyHttp(200)).toBe("accepted");
  });
  it("429 is safe to retry; nothing was accepted", () => {
    expect(classifyHttp(429)).toBe("retry");
  });
  it("401/403 fail and flag the account", () => {
    expect(classifyHttp(401)).toBe("auth_failure");
    expect(classifyHttp(403)).toBe("auth_failure");
  });
  it("other 4xx are definite failures and are NOT retried", () => {
    for (const s of [400, 404, 409, 422]) expect(classifyHttp(s)).toBe("failed");
  });
  it("5xx, timeouts and no response are ambiguous - never retried", () => {
    for (const s of [500, 502, 503, 504]) expect(classifyHttp(s)).toBe("uncertain");
    expect(classifyHttp(null)).toBe("uncertain");
    expect(classifyHttp(0)).toBe("uncertain");
  });
  it("backoff grows and is capped", () => {
    expect(retryDelaySeconds(1)).toBe(15);
    expect(retryDelaySeconds(2)).toBe(30);
    expect(retryDelaySeconds(3)).toBe(60);
    expect(retryDelaySeconds(20)).toBe(900);
    expect(MAX_DISPATCH_ATTEMPTS).toBeGreaterThan(1);
  });
});
