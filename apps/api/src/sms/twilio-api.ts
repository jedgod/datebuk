/** Thin Twilio REST helpers (no SDK). Credentials are passed in, never read from the database here. */

export type TwilioRestCreds = {
  accountSid: string;
  /** Auth Token, or API Key secret when apiKeySid is set. */
  secret: string;
  /** When set, REST calls authenticate as this API Key (SK...) instead of the account SID. */
  apiKeySid?: string;
};

export const basicAuth = (c: TwilioRestCreds) =>
  `Basic ${Buffer.from(`${c.apiKeySid ?? c.accountSid}:${c.secret}`).toString("base64")}`;

export async function twilioGet(url: string, creds: TwilioRestCreds): Promise<{ status: number; body: any | null }> {
  try {
    const res = await fetch(url, { headers: { Authorization: basicAuth(creds) }, signal: AbortSignal.timeout(10_000) });
    return { status: res.status, body: res.ok ? await res.json().catch(() => null) : null };
  } catch {
    return { status: 0, body: null };
  }
}

/** True when Twilio confirms these credentials belong to an active account with this SID. */
export async function validateCredentials(creds: TwilioRestCreds): Promise<boolean> {
  const r = await twilioGet(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}.json`, creds);
  return r.status === 200 && r.body?.sid?.toLowerCase() === creds.accountSid.toLowerCase() && r.body?.status === "active";
}

export async function ownsSmsNumber(creds: TwilioRestCreds, number: string): Promise<boolean> {
  const r = await twilioGet(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(number)}`,
    creds,
  );
  return (r.body?.incoming_phone_numbers ?? []).some((n: any) => n.phone_number === number && n.capabilities?.sms);
}

export async function ownsMessagingService(creds: TwilioRestCreds, serviceSid: string): Promise<boolean> {
  const r = await twilioGet(`https://messaging.twilio.com/v1/Services/${serviceSid}`, creds);
  return r.status === 200 && r.body?.account_sid === creds.accountSid;
}

/** Twilio answers 401 for bad credentials and 403 for a suspended/closed account. */
export const isAuthFailure = (status: number) => status === 401 || status === 403;
