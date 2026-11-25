import apn from "apn";
import { env } from "./config";
import type { IncomingCallPayload } from "./types";

const provider = new apn.Provider({
  token: {
    key: env.APNS_KEY_PATH,
    keyId: env.APNS_KEY_ID,
    teamId: env.APNS_TEAM_ID
  },
  production: env.APNS_PRODUCTION
});

export async function sendVoipPush(
  voipToken: string,
  payload: IncomingCallPayload
) {
  const notification = new apn.Notification();

  notification.topic = `${env.APNS_BUNDLE_ID}.voip`;
  notification.pushType = "voip";
  notification.priority = 10;
  notification.expiry = Math.floor(Date.now() / 1000) + 30;
  notification.payload = {
    event: "incoming_call",
    ...payload
  };

  const result = await provider.send(notification, voipToken);

  if (result.failed.length) {
    const failure = result.failed[0];
    throw new Error(
      `APNs VoIP push failed: ${JSON.stringify(failure.response ?? failure.error)}`
    );
  }

  return result.sent;
}

export function closeApns() {
  provider.shutdown();
}
