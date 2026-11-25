import { ConflictException, Controller, ForbiddenException, Header, Headers, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { SmsAccountsService } from "./sms-accounts.service";
import { DcgEnabledGuard } from "./dcg-enabled.guard";
import { dcg } from "./dcg-config";
import { START_WORDS, STOP_WORDS, validateTwilioSignature } from "./twilio-signature";
import { applyProviderStatus } from "./sms-state";

const E164 = /^\+[1-9]\d{7,14}$/;
const UUID = /^[0-9a-f-]{36}$/i;
const MESSAGE_SID = /^(SM|MM)[0-9a-f]{32}$/i;
const TWIML = "<Response/>";

/**
 * Twilio webhooks (delivery status + inbound replies).
 *
 * Authentication: the request signature is verified against the Auth Token of the account named
 * in the payload - never a global token. A status callback may then only touch a message that was
 * sent through THAT account.
 *
 * State changes go through the transition model in sms-state.ts: replays are acknowledged and
 * ignored (SmsWebhookEvent), late or out-of-order callbacks cannot move a message backwards, and
 * a genuine callback is what resolves an `uncertain` message.
 *
 * Configure in Twilio:  <public API origin>/api/sms/webhooks/status  and  .../inbound
 * (set SMS_WEBHOOK_BASE_URL when the API's public origin differs from API_URL).
 */
@Controller("sms/webhooks")
@UseGuards(DcgEnabledGuard)
export class SmsWebhookController {
  constructor(private prisma: PrismaService, private accounts: SmsAccountsService) {}

  /** The URL Twilio actually called, rebuilt from our configured public origin (not from Host headers). */
  private publicUrl(req: any): string {
    const base = (process.env.SMS_WEBHOOK_BASE_URL || process.env.API_URL || "").trim().replace(/\/$/, "");
    return `${base}${req.originalUrl}`;
  }

  /** accountId null = the (explicitly enabled) environment-credential account. */
  private async authFor(accountSid: unknown): Promise<{ accountId: string | null; token: string } | null> {
    if (typeof accountSid !== "string") return null;
    const fromDb = await this.accounts.webhookAuthFor(accountSid);
    if (fromDb) return fromDb;
    if (dcg.envFallback() && process.env.TWILIO_ACCOUNT_SID?.trim() === accountSid && process.env.TWILIO_AUTH_TOKEN) {
      return { accountId: null, token: process.env.TWILIO_AUTH_TOKEN.trim() };
    }
    return null;
  }

  private async verify(req: any, signature: string | undefined) {
    const body = (req.body ?? {}) as Record<string, string>;
    const auth = await this.authFor(body.AccountSid);
    // Unknown/revoked account, or no Auth Token on file (API-key-only accounts can't be verified).
    if (!auth) throw new ForbiddenException("invalid_signature");
    if (dcg.signatureRequired() && !validateTwilioSignature(auth.token, signature, this.publicUrl(req), body)) {
      throw new ForbiddenException("invalid_signature");
    }
    return { body, accountId: auth.accountId };
  }

  @Post(":kind")
  @HttpCode(200)
  @Header("Content-Type", "text/xml")
  async handle(@Param("kind") kind: string, @Req() req: any, @Headers("x-twilio-signature") signature?: string) {
    if (kind !== "status" && kind !== "inbound") throw new ForbiddenException("invalid_signature");
    const { body, accountId } = await this.verify(req, signature);

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
      return TWIML;
    }

    // ---- status callback ----------------------------------------------------------
    const sid = body.MessageSid;
    const status = String(body.MessageStatus ?? "").toLowerCase();
    if (typeof sid !== "string" || !MESSAGE_SID.test(sid) || !status) return TWIML;

    const mid = String((req.query?.mid ?? "") as string);
    const message = UUID.test(mid)
      ? await this.prisma.smsMessage.findUnique({ where: { id: mid } })
      : await this.prisma.smsMessage.findUnique({ where: { providerSid: sid } });
    if (!message) return TWIML; // not one of ours (or already purged) - acknowledge, change nothing

    // A callback may only affect a message sent through the account that signed it.
    if ((message.accountId ?? null) !== (accountId ?? null)) {
      throw new ForbiddenException("account_mismatch");
    }
    // ...and if we already know its provider id, it must be the same message.
    if (message.providerSid && message.providerSid !== sid) {
      throw new ConflictException("message_mismatch");
    }

    // Replay protection: each (account, message, status) is applied at most once.
    const eventKey = createHash("sha256").update(`${body.AccountSid}|${sid}|${status}`).digest("hex");
    try {
      await this.prisma.smsWebhookEvent.create({ data: { eventKey, accountSid: String(body.AccountSid), providerSid: sid, status } });
    } catch (e: any) {
      if (e?.code === "P2002") return TWIML; // duplicate delivery
      throw e;
    }

    // Optimistic transition: re-read and re-apply if another callback won the race.
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.prisma.smsMessage.findUnique({ where: { id: message.id } });
      if (!current) break;
      const next = applyProviderStatus(current.state, status);
      // Late, duplicate, backwards or premature (message not dispatched yet): ignore entirely -
      // in particular never bind a provider id onto a message we haven't sent.
      if (!next) break;
      const r = await this.prisma.smsMessage.updateMany({
        where: { id: current.id, state: current.state },
        data: {
          state: next,
          ...(current.providerSid ? {} : { providerSid: sid }),
          // A provider callback proves the message left the outbox: nothing readable is kept.
          toEncrypted: null,
          bodyEncrypted: null,
          lastError: null,
        },
      });
      if (r.count === 1) break;
    }
    return TWIML;
  }
}
