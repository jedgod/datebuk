import { expectedTwilioSignature, nextSmsState, validateTwilioSignature, STOP_WORDS, START_WORDS } from "./twilio-signature";

// Test vector published in Twilio's "Validating requests" documentation.
const URL = "https://mycompany.com/myapp.php?foo=1&bar=2";
const TOKEN = "12345";
const PARAMS = {
  CallSid: "CA1234567890ABCDE",
  Caller: "+14158675310",
  Digits: "1234",
  From: "+14158675310",
  To: "+18005551212",
};
const SIGNATURE = "GvWf1cFY/Q7PnoempGyD5oXAezc=";

describe("Twilio webhook signature", () => {
  it("matches Twilio's documented test vector", () => {
    expect(expectedTwilioSignature(TOKEN, URL, PARAMS)).toBe(SIGNATURE);
    expect(validateTwilioSignature(TOKEN, SIGNATURE, URL, PARAMS)).toBe(true);
  });

  it("rejects a tampered body, URL, token or missing signature", () => {
    expect(validateTwilioSignature(TOKEN, SIGNATURE, URL, { ...PARAMS, Digits: "9999" })).toBe(false);
    expect(validateTwilioSignature(TOKEN, SIGNATURE, URL + "&x=1", PARAMS)).toBe(false);
    expect(validateTwilioSignature("wrong", SIGNATURE, URL, PARAMS)).toBe(false);
    expect(validateTwilioSignature(TOKEN, undefined, URL, PARAMS)).toBe(false);
    expect(validateTwilioSignature(TOKEN, "short", URL, PARAMS)).toBe(false);
  });
});

describe("SMS delivery state", () => {
  it("only moves forward", () => {
    expect(nextSmsState("accepted", "sent")).toBe("sent");
    expect(nextSmsState("sent", "delivered")).toBe("delivered");
    expect(nextSmsState("delivered", "sent")).toBe("delivered");
    expect(nextSmsState("sent", "sent")).toBe("sent");
  });
  it("ignores unknown states", () => {
    expect(nextSmsState("sent", "bogus")).toBe("sent");
  });
});

describe("opt-out keywords", () => {
  it("recognises STOP and START variants", () => {
    for (const w of ["STOP", "stop", "Unsubscribe", "QUIT"]) expect(STOP_WORDS.test(w)).toBe(true);
    for (const w of ["START", "yes", "unstop"]) expect(START_WORDS.test(w)).toBe(true);
    expect(STOP_WORDS.test("please stop texting me")).toBe(false);
  });
});
