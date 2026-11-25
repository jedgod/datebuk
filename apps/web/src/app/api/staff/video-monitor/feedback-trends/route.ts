import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/staff/video-monitor/feedback-trends
 * Get user feedback sentiment trends over time
 * Requires staff authorization
 */
export async function GET(request: NextRequest) {
  try {
    const staffCookie = request.cookies.get('dp_staff')?.value;
    if (!staffCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Post-call feedback (vibe score, would-meet-again, sentiment) isn't collected
    // anywhere yet — there's no rating step in the video-call flow and no schema for
    // it. Returning an honest empty state rather than fabricated trend numbers until
    // that feedback-collection feature is built.
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error('Error fetching feedback trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback trends' },
      { status: 500 },
    );
  }
}
