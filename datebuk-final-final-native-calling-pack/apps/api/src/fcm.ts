import fs from "node:fs";
import admin from "firebase-admin";
import { env } from "./config";

const serviceAccount = JSON.parse(
  fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export async function sendFcmCall(
  token: string,
  payload: Record<string, string>
) {
  return admin.messaging().send({
    token,
    data: payload,
    android: {
      priority: "high",
      ttl: 30_000
    }
  });
}
