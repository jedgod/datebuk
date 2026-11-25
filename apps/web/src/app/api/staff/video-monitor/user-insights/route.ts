import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/staff/video-monitor/user-insights
 * Get aggregated user feedback patterns and insights
 * Requires staff authorization
 */
export async function GET(request: NextRequest) {
  try {
    const staffCookie = request.cookies.get('dp_staff')?.value;
    if (!staffCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Depends on the same not-yet-built feedback-collection feature as feedback-trends
    // (see that route for context). Returning an honest empty state rather than
    // fabricated user data.
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error('Error fetching user insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user insights' },
      { status: 500 },
    );
  }
}
