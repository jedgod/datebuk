import { NextRequest, NextResponse } from "next/server";

// KNOWN GAP (see ultra_datebuk-08-01-2026.txt, M-12): this route and its
// consumer (components/admin/video-date/ActiveVideoReviewQueue.tsx) are
// still in-memory mock data, not backed by a database. Unlike the sibling
// /api/admin/video-date/settings route (now backed by VideoDateSetting),
// this one was deliberately NOT wired to real persistence in this pass: a
// fully real backend queue already exists at apps/api's
// admin/moderator.controller.ts (GET/POST /admin/moderator/queue/*, backed
// by the ModeratorQueue + FraudEvent Prisma models), but its data shape is
// fraud-event review, not this component's "video date safety review" shape
// (different fields: fraudEvent/explanation/feedback vs. this mock's
// user/type/risk/feature/assigned/status/age). Mapping one onto the other
// without a product decision on whether they're actually the same feature
// risks shipping an incorrect/confusing rewiring. Treat this file as a UI
// prototype until that's resolved, not as done.
type QueueItem = {
  id: string;
  user: string;
  type: string;
  risk: number;
  feature: string;
  assigned: string;
  status: string;
  age: string;
};

type ModeratorStats = {
  name: string;
  initials: string;
  score: number;
  load: number;
  status: "online" | "busy" | "offline";
};

type FeatureSignal = {
  label: string;
  value: number;
  note: string;
};

const queueItems: QueueItem[] = [
  { id: "q1", user: "Enmal23", type: "Live video", risk: 92, feature: "Live room", assigned: "Ilonize Pration", status: "Needs review", age: "2m" },
  { id: "q2", user: "Mark87", type: "Predate check", risk: 78, feature: "Date planner", assigned: "Sorced Ermisen", status: "Screening", age: "5m" },
  { id: "q3", user: "LunaFun", type: "Chat excerpt", risk: 64, feature: "Icebreaker", assigned: "Mario Coniat", status: "Queued", age: "8m" },
  { id: "q4", user: "JasonM", type: "Location alert", risk: 85, feature: "Location share", assigned: "Flog", status: "Needs review", age: "8m" },
  { id: "q5", user: "FaithfulGuy", type: "Safety block", risk: 88, feature: "Safety controls", assigned: "Unassigned", status: "New", age: "10m" },
];

const moderators: ModeratorStats[] = [
  { name: "Ilonize Pration", initials: "IP", score: 91, load: 8, status: "online" },
  { name: "Sorced Ermisen", initials: "SE", score: 91, load: 6, status: "online" },
  { name: "Flog", initials: "F", score: 75, load: 10, status: "busy" },
  { name: "Mario Coniat", initials: "MC", score: 89, load: 5, status: "online" },
  { name: "Uenare Gode", initials: "UG", score: 68, load: 3, status: "offline" },
];

const userFeatureSignals: FeatureSignal[] = [
  { label: "Date Planner Requests", value: 42, note: "Premium and Elite scheduling activity" },
  { label: "Icebreaker Messages", value: 318, note: "AI prompts requiring safety sampling" },
  { label: "Location Sharing", value: 19, note: "Approximate and live-date location checks" },
  { label: "Safety Blocks", value: 27, note: "Blocked communication and privacy changes" },
];

function isAdmin(req: NextRequest): boolean {
  return Boolean(req.cookies.get("dp_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      queueItems,
      moderators,
      userFeatureSignals,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, itemId, moderatorName, decision } = body as {
      action?: "assign" | "decision";
      itemId?: string;
      moderatorName?: string;
      decision?: "approved" | "escalated" | "restricted";
    };

    if (!action || !itemId) {
      return NextResponse.json({ error: "Missing action or itemId" }, { status: 400 });
    }

    const idx = queueItems.findIndex((item) => item.id === itemId);
    if (idx < 0) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    if (action === "assign") {
      if (!moderatorName) {
        return NextResponse.json({ error: "Missing moderatorName" }, { status: 400 });
      }

      queueItems[idx] = {
        ...queueItems[idx],
        assigned: moderatorName,
        status: "Screening",
      };

      return NextResponse.json(
        {
          success: true,
          message: `${moderatorName} assigned to ${queueItems[idx].user}.`,
          queueItems,
        },
        { status: 200 }
      );
    }

    if (action === "decision") {
      const statusByDecision: Record<string, string> = {
        approved: "Approved",
        escalated: "Escalated",
        restricted: "Restricted",
      };

      const mappedStatus = decision ? statusByDecision[decision] : undefined;
      if (!mappedStatus) {
        return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
      }

      queueItems[idx] = {
        ...queueItems[idx],
        status: mappedStatus,
      };

      return NextResponse.json(
        {
          success: true,
          message: `${queueItems[idx].user} marked as ${decision}.`,
          queueItems,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process queue action", error);
    return NextResponse.json({ error: "Failed to process queue action" }, { status: 500 });
  }
}
