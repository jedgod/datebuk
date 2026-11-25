import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined, // don't add pid/hostname by default (cleaner in containers)
  timestamp: pino.stdTimeFunctions.isoTime,
  // Defense-in-depth: redact common secret-shaped fields if a log call ever includes
  // a full request/user object, even though no current call site logs raw bodies.
  redact: {
    paths: [
      "password", "*.password",
      "newPassword", "*.newPassword",
      "currentPassword", "*.currentPassword",
      "token", "*.token",
      "accessToken", "*.accessToken",
      "refreshToken", "*.refreshToken",
      "secret", "*.secret",
      "tokenHash", "*.tokenHash",
      "backupCodes", "*.backupCodes",
      "authorization", "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
});
