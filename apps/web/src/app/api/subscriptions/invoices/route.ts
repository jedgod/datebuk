import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth";

/**
 * The billing-history table on /dashboard/subscription previously showed
 * two hardcoded fake rows ("Basic Plan" — a tier name that doesn't even
 * exist — dated 2026-02-15, plus a "$19.000" typo) regardless of what the
 * signed-in user had actually paid. Real billing records already exist in
 * SubscriptionInvoice (written by the Stripe webhook on each paid invoice);
 * this just exposes the caller's own rows.
 */
export async function GET(req: NextRequest) {
  const { userId } = getAuthContext(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.subscriptionInvoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      amountPaid: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
      hostedInvoiceUrl: true,
    },
  });

  return NextResponse.json({ invoices });
}
