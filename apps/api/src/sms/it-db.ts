import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Integration-test helper. The schema allows only ONE active provider account (a partial unique
 * index - that is a production safety property). Test files that need an active account therefore
 * take turns: creating one waits and retries while another file's test still holds it.
 */
export async function createAccountWithRetry(prisma: PrismaClient, args: Prisma.TwilioAccountCreateArgs, maxWaitMs = 90_000) {
  const started = Date.now();
  for (;;) {
    try {
      return await prisma.twilioAccount.create(args);
    } catch (e: any) {
      const clash = e?.code === "P2002" && args.data.status === "active";
      if (!clash || Date.now() - started > maxWaitMs) throw e;
      await new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 250)));
    }
  }
}
