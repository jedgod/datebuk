import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getRequestAccessTier } from "@/lib/server/subscription-access";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getRequestAccessTier(req, auth.userId);
    const entitlements = {
      premium: tier === "PREMIUM" || tier === "ELITE",
      elite: tier === "ELITE",
    };

    return NextResponse.json(
      {
        entitlements,
        activeSubscriptions:
          tier === "PREMIUM" ? ["PREMIUM"] : tier === "ELITE" ? ["ELITE"] : [],
        allPurchasedProductIds:
          tier === "PREMIUM" ? ["premium_monthly"] : tier === "ELITE" ? ["elite_monthly"] : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Entitlements lookup error:", error);
    return NextResponse.json({ error: "Failed to fetch entitlements" }, { status: 500 });
  }
}
