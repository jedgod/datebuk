import { NextRequest, NextResponse } from 'next/server';

interface DateFollowUpBody {
  matchId: string;
  interested: boolean;
  suggestedDate?: string;
  suggestedTime?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    await request.json() as DateFollowUpBody;

    // TODO: In production, integrate with backend
    // 1. Get current user from cookies (userId)
    // 2. Store follow-up request (matchId, userId, interested, suggestedDate)
    // 3. If both users interested -> create match scheduling
    // 4. Send notification to other user

    return NextResponse.json(
      { error: 'Date follow-up scheduling is not yet available', available: false },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit follow-up' },
      { status: 400 }
    );
  }
}
