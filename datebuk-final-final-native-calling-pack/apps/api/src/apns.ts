import apn from "apn";
import { env } from "./config";

const provider = new apn.Provider({
  token: {
    key: env.APNS_KEY_PATH,
    keyId: env.APNS_KEY_ID,
    teamId: env.APNS_TEAM_ID
  },
  production: env.APNS_PRODUCTION
});

export async function sendApnsVoip(
  token: string,
  payload: Record<string, string>
) {
  const note = new apn.Notification();
  note.topic = `${env.APNS_BUNDLE_ID}.voip`;
  note.pushType = "voip";
  note.priority = 10;
  note.expiry = Math.floor(Date.now() / 1000) + 30;
  note.payload = payload;

  const result = await provider.send(note, token);

  if (result.failed.length) {
    const failure = result.failed[0];
    const reason =
      failure.response?.reason ??
      failure.error?.message ??
      "Unknown APNs failure";

    const error = new Error(reason) as Error & { code?: string };
    error.code = reason;
    throw error;
  }

  return result.sent[0]?.device;
}
