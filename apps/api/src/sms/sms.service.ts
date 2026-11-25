import { Injectable } from "@nestjs/common";
import { SmsOutboxService, E164, type SmsDelivery } from "./sms-outbox.service";

export { E164 };
export type { SmsDelivery };

/**
 * The application-facing way to text someone. It does not call Twilio: it enqueues into the
 * durable outbox (SmsOutboxService), which reserves spending budget atomically, re-authorizes
 * at dispatch time, and sends from a leased worker.
 *
 * Returns "queued" when the message is in the outbox, or "logged" in development when sending
 * is switched off (DCG_LIVE_SMS_ENABLED) or no provider account is active.
 */
@Injectable()
export class SmsService {
  constructor(private outbox: SmsOutboxService) {}

  async send(
    toE164: string,
    body: string,
    opts: { purpose?: string; userId?: string | null; ref?: string | null; idempotencyKey?: string; ttlSeconds?: number } = {},
  ): Promise<SmsDelivery> {
    return (await this.outbox.enqueue(toE164, body, opts)).delivery;
  }

  async isConfigured(): Promise<boolean> {
    return (await this.outbox.resolveSender()) !== null;
  }
}
