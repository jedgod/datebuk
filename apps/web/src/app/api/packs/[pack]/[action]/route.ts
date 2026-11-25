import { NextRequest, NextResponse } from "next/server";

type PackDefinition = {
  module: string;
  title: string;
  cards: Array<[string, string]>;
  features: string[];
};

const PACKS: Record<string, PackDefinition> = {
  "1-trust-safety": {
    module: "Trust, Safety & Relationship Intelligence",
    title: "Trust, Safety & Relationship Intelligence",
    cards: [
      ["Trust Score", "92/100"],
      ["Verification", "4/5"],
      ["Safety Alerts", "2"],
      ["Safe Dates", "3"],
    ],
    features: [
      "Video verification",
      "Government ID review",
      "Scam message flags",
      "Safe date check-in",
      "Blocked users",
      "Admin safety queue",
    ],
  },
  "2-realtime-communication": {
    module: "Realtime Communication Suite",
    title: "Realtime Communication Suite",
    cards: [
      ["Active Chats", "48"],
      ["Voice Notes", "124"],
      ["Video Dates", "7"],
      ["Date Requests", "13"],
    ],
    features: [
      "Socket.IO chat",
      "Typing indicators",
      "Voice messages",
      "Video date rooms",
      "Read receipts",
      "Emergency call reporting",
    ],
  },
  "3-ai-matchmaker": {
    module: "AI Matchmaker Platform",
    title: "AI Matchmaker Platform",
    cards: [
      ["AI Match Score", "96%"],
      ["Profile Strength", "88%"],
      ["Coach Tips", "12"],
      ["Predicted Replies", "High"],
    ],
    features: [
      "Compatibility predictor",
      "AI dating coach",
      "Profile optimization",
      "Conversation starter",
      "Long-term potential score",
      "Smart recommendations",
    ],
  },
  "4-enterprise-scale": {
    module: "Enterprise Scale Platform",
    title: "Enterprise Scale Platform",
    cards: [
      ["API Health", "99.99%"],
      ["Realtime Nodes", "8"],
      ["Search Index", "Ready"],
      ["Regions", "3"],
    ],
    features: [
      "Redis cache",
      "Kafka event bus",
      "Elasticsearch profile search",
      "Vector matching",
      "Kubernetes manifests",
      "Prometheus metrics",
    ],
  },
  "5-global-superapp": {
    module: "Global Super-App Ecosystem",
    title: "Global Super-App Ecosystem",
    cards: [
      ["Communities", "230"],
      ["Events", "46"],
      ["Travel Matches", "19"],
      ["Market Listings", "81"],
    ],
    features: [
      "Dating mode",
      "Friendship mode",
      "Professional networking",
      "Interest groups",
      "Events and meetups",
      "Travel connections",
    ],
  },
};

function resolvePack(pack: string): PackDefinition | null {
  if (PACKS[pack]) return PACKS[pack];
  const mapped = pack.replace("pack-", "");
  return PACKS[mapped] || null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pack: string; action: string }> }
) {
  try {
    const params = await context.params;
    const pack = resolvePack(params.pack);
    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    if (params.action === "status") {
      return NextResponse.json(
        { module: pack.module, status: "READY", updatedAt: new Date().toISOString() },
        { status: 200 }
      );
    }

    if (params.action === "dashboard") {
      return NextResponse.json(
        {
          title: pack.title,
          cards: pack.cards,
          features: pack.features,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  } catch (error) {
    console.error("Pack route GET error:", error);
    return NextResponse.json({ error: "Failed to fetch pack data" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ pack: string; action: string }> }
) {
  try {
    const params = await context.params;
    const pack = resolvePack(params.pack);
    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    if (params.action !== "event") {
      return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ ok: true, event: body, saved: true, pack: pack.module }, { status: 201 });
  } catch (error) {
    console.error("Pack route POST error:", error);
    return NextResponse.json({ error: "Failed to save pack event" }, { status: 500 });
  }
}
