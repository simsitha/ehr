import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { approveAttendanceBonus } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Manager';

    // Must be Admin or Manager to approve
    if (userRole !== 'Admin' && userRole !== 'Manager') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Managers or Administrators can approve bonus calculations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { periodId, calculationIds, notes } = body;

    if (!periodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: periodId is mandatory.' },
        { status: 400 }
      );
    }

    const result = approveAttendanceBonus(periodId, userName, calculationIds, notes);

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${result.count} attendance bonus calculation(s).`,
      count: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
