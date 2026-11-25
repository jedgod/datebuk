import fs from "node:fs";
import admin from "firebase-admin";
import { env } from "./config";
import type { IncomingCallPayload } from "./types";

const serviceAccount = JSON.parse(
  fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export async function sendAndroidCallPush(
  fcmToken: string,
  payload: IncomingCallPayload
) {
  return admin.messaging().send({
    token: fcmToken,
    data: {
      event: "incoming_call",
      callId: payload.callId,
      callerId: payload.callerId,
      callerName: payload.callerName,
      callType: payload.callType,
      expiresAt: payload.expiresAt
    },
    android: {
      priority: "high",
      ttl: 30_000,
      directBootOk: false
    }
  });
}
