/**
 * Communications (DCG) feature flags. All default to the safe value.
 *
 *  DCG_ENABLED                    admin + webhook surfaces of the module (default false)
 *  DCG_LIVE_SMS_ENABLED           actually call Twilio (default false -> dev logs, prod refuses)
 *  DCG_ENV_FALLBACK_ENABLED       allow TWILIO_* env credentials when no DB account is active
 *                                 (default false; never implicit)
 *  DCG_WEBHOOK_SIGNATURE_REQUIRED verify X-Twilio-Signature (default true; cannot be turned
 *                                 off in production)
 */
const on = (v: string | undefined) => (v ?? "").trim().toLowerCase() === "true";

export const dcg = {
  enabled: () => on(process.env.DCG_ENABLED),
  liveSms: () => on(process.env.DCG_LIVE_SMS_ENABLED),
  envFallback: () => on(process.env.DCG_ENV_FALLBACK_ENABLED),
  signatureRequired: () =>
    process.env.NODE_ENV === "production" ? true : (process.env.DCG_WEBHOOK_SIGNATURE_REQUIRED ?? "true").trim().toLowerCase() !== "false",
};
