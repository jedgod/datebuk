import { findUserDevices, removeToken } from "./device-store";
import { sendVoipPush } from "./apns";
import { sendAndroidCallPush } from "./fcm";
import type { IncomingCallPayload } from "./types";

export async function deliverIncomingCall(
  calleeId: string,
  payload: IncomingCallPayload
) {
  const devices = findUserDevices(calleeId);

  const results = await Promise.allSettled(
    devices.map(async device => {
      if (device.platform === "IOS") {
        return sendVoipPush(device.token, payload);
      }
      return sendAndroidCallPush(device.token, payload);
    })
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Call push failed", {
        deviceId: devices[index]?.id,
        error: result.reason
      });

      const message = String(result.reason);
      if (
        message.includes("BadDeviceToken") ||
        message.includes("Unregistered") ||
        message.includes("registration-token-not-registered")
      ) {
        removeToken(devices[index].token);
      }
    }
  });

  return {
    attempted: devices.length,
    delivered: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length
  };
}
