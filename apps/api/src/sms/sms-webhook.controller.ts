import { Controller, ForbiddenException, Header, Headers, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { DcgEnabledGuard } from "./dcg-enabled.guard";
import { dcg } from "./dcg-config";
import { START_WORDS, STOP_WORDS, nextSmsState, validateTwilioSignature } from "./twilio-signature";

const E164 = /^\+[1-9]\d{7,14}$/;
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Twilio webhooks (delivery status + inbound replies). Authorized solely by Twilio's
 * request signature, checked against the Auth Token of the account named in the payload.
 * Configure in Twilio:  <public API origin>/api/sms/webhooks/status  and  .../inbound
 * (set SMS_WEBHOOK_BASE_URL when the API's public origin differs from API_URL).
 */
@Controller("sms/webhooks")
@UseGuards(DcgEnabledGuard)
export class SmsWebhookController {
  constructor(private prisma: PrismaService, private accounts: SmsAccountsService) {}

  private publicUrl(req: any): string {
    const base = (process.env.SMS_WEBHOOK_BASE_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    return `${base}${req.originalUrl}`;
  }

  private async tokenFor(accountSid: unknown): Promise<string | null> {
    if (typeof accountSid !== "string") return null;
    const fromDb = await this.accounts.webhookTokenFor(accountSid);
    if (fromDb) return fromDb;
    // Environment credentials only count when explicitly allowed.
    if (dcg.envFallback() && process.env.TWILIO_ACCOUNT_SID?.trim() === accountSid && process.env.TWILIO_AUTH_TOKEN) {
      return process.env.TWILIO_AUTH_TOKEN.trim();
    }
    return null;
  }

  private async verify(req: any, signature: string | undefined) {
    const body = (req.body ?? {}) as Record<string, string>;
    const token = await this.tokenFor(body.AccountSid);
    // Unknown/revoked account, or no Auth Token on file (API-key-only accounts can't be verified).
    if (!token) throw new ForbiddenException("invalid_signature");
    if (dcg.signatureRequired() && !validateTwilioSignature(token, signature, this.publicUrl(req), body)) {
      throw new ForbiddenException("invalid_signature");
    }
    return body;
  }

  @Post(":kind")
  @HttpCode(200)
  @Header("Content-Type", "text/xml")
  async handle(@Param("kind") kind: string, @Req() req: any, @Headers("x-twilio-signature") signature?: string) {
    if (kind !== "status" && kind !== "inbound") throw new ForbiddenException("invalid_signature");
    const body = await this.verify(req, signature);

    if (kind === "inbound") {
      const from = body.From;
      const text = (body.Body ?? "").trim();
      if (typeof from === "string" && E164.test(from)) {
        if (body.OptOutType === "STOP" || STOP_WORDS.test(text)) {
          await this.prisma.smsSuppression.upsert({ where: { phone: from }, update: {}, create: { phone: from } });
        } else if (body.OptOutType === "START" || START_WORDS.test(text)) {
          await this.prisma.smsSuppression.deleteMany({ where: { phone: from } });
        }
      }
      return "<Response/>";
    }

    // status callback: mid is our SmsMessage id; sid must agree if we already stored one
    const mid = String((req.query?.mid ?? "") as string);
    const sid = body.MessageSid;
    if (UUID.test(mid) && typeof sid === "string" && /^(SM|MM)[0-9a-f]{32}$/i.test(sid)) {
      const m = await this.prisma.smsMessage.findUnique({ where: { id: mid } });
      if (m && (!m.providerSid || m.providerSid === sid)) {
        const state = nextSmsState(m.state, String(body.MessageStatus ?? ""));
        if (state !== m.state || !m.providerSid) {
          await this.prisma.smsMessage.update({ where: { id: mid }, data: { providerSid: sid, state } });
        }
      }
    }
    return "<Response/>";
  }
}
