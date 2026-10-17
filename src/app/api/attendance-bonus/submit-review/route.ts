import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { submitAttendanceBonusForReview } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Officer';

    if (userRole === 'Employee') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR staff can submit calculations for review' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { periodId, notes } = body;

    if (!periodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: periodId is mandatory.' },
        { status: 400 }
      );
    }

    const result = submitAttendanceBonusForReview(periodId, userName, notes);

    return NextResponse.json({
      success: true,
      message: `Successfully submitted ${result.count} calculation(s) for manager review.`,
      count: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
