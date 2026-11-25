import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5050),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  EXPO_PUSH_URL: z.string().url(),
  TURN_URL: z.string().min(1),
  TURN_USERNAME: z.string().min(1),
  TURN_PASSWORD: z.string().min(1),
  WEB_ORIGIN: z.string().min(1)
});

export const env = schema.parse(process.env);
