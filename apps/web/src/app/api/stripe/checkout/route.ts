import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const auth = getAuthContext(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();
  const allowedPriceIds = (process.env.STRIPE_ALLOWED_PRICE_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!priceId || !allowedPriceIds.includes(priceId)) {
    return NextResponse.json({ error: "Invalid subscription price" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: auth.userId,
    metadata: {
      userId: auth.userId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
