import crypto from "node:crypto";
import { env } from "./config";

export function createTurnCredentials(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + env.TURN_CREDENTIAL_TTL_SECONDS;
  const username = `${expiresAt}:${userId}`;

  const credential = crypto
    .createHmac("sha1", env.TURN_SHARED_SECRET)
    .update(username)
    .digest("base64");

  return {
    ttl: env.TURN_CREDENTIAL_TTL_SECONDS,
    expiresAt,
    username,
    credential,
    iceServers: [
      {
        urls: [
          `turn:${env.TURN_HOST}:${env.TURN_PORT}?transport=udp`,
          `turn:${env.TURN_HOST}:${env.TURN_PORT}?transport=tcp`,
          `turns:${env.TURN_HOST}:${env.TURN_TLS_PORT}?transport=tcp`
        ],
        username,
        credential
      }
    ]
  };
}
