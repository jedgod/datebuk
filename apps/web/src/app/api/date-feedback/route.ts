import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from "@/lib/server/auth";
import { createDateFeedback, listDateFeedbackForUser } from "@/lib/server/communication-store";

interface DateFeedbackBody {
  matchId?: string;
  dateRequestId?: string;
  partnerUserId?: string;
  partnerName?: string;
  partnerAttitude: string;
  partnerReaction: string;
  comfortLevel: string;
  recommendedAction: string;
  notes: string;
}

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { success: true, feedback: listDateFeedbackForUser(auth.userId) },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthContext(request);
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DateFeedbackBody = await request.json();

    if (!body.partnerAttitude || !body.partnerReaction || !body.comfortLevel || !body.recommendedAction) {
      return NextResponse.json(
        { error: "partnerAttitude, partnerReaction, comfortLevel, and recommendedAction are required" },
        { status: 400 }
      );
    }

    const feedback = createDateFeedback({
      userId: auth.userId,
      matchId: body.matchId,
      dateRequestId: body.dateRequestId,
      partnerUserId: body.partnerUserId,
      partnerName: body.partnerName,
      partnerAttitude: body.partnerAttitude,
      partnerReaction: body.partnerReaction,
      comfortLevel: body.comfortLevel,
      recommendedAction: body.recommendedAction,
      notes: body.notes || "",
    });

    return NextResponse.json(
      {
        success: true,
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 400 }
    );
  }
}
