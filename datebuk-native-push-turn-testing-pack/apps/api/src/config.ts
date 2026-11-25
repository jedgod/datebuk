import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5051),
  JWT_SECRET: z.string().min(32),
  APNS_KEY_PATH: z.string(),
  APNS_KEY_ID: z.string(),
  APNS_TEAM_ID: z.string(),
  APNS_BUNDLE_ID: z.string(),
  APNS_PRODUCTION: z.string().default("false").transform(v => v === "true"),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string(),
  TURN_HOST: z.string(),
  TURN_PORT: z.coerce.number().default(3478),
  TURN_TLS_PORT: z.coerce.number().default(5349),
  TURN_SHARED_SECRET: z.string().min(24),
  TURN_CREDENTIAL_TTL_SECONDS: z.coerce.number().min(60).max(3600).default(600)
});

export const env = schema.parse(process.env);
