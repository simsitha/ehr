import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rejectAttendanceBonus } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Manager';

    if (userRole !== 'Admin' && userRole !== 'Manager') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Managers or Administrators can reject bonus calculations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { periodId, reason, calculationIds } = body;

    if (!periodId || !reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: periodId and a clear rejection reason are mandatory.' },
        { status: 400 }
      );
    }

    const result = rejectAttendanceBonus(periodId, userName, reason, calculationIds);

    return NextResponse.json({
      success: true,
      message: `Successfully rejected ${result.count} calculation(s) with reason: ${reason}`,
      count: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
