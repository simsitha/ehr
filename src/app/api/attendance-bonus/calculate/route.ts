import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { calculatePeriodAttendanceBonuses } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Administrators and Managers can calculate attendance bonuses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { periodId, forceRecalculate = false } = body;

    if (!periodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: periodId is mandatory.' },
        { status: 400 }
      );
    }

    const result = calculatePeriodAttendanceBonuses(periodId, userName, { forceRecalculate });

    return NextResponse.json({
      success: true,
      message: `Successfully calculated attendance bonuses for ${result.calculations.length} employees in ${result.summary.period_name}.`,
      summary: result.summary,
      totalEmployees: result.calculations.length,
      eligibleEmployees: result.summary.eligible_employees,
      totalBonusUsd: result.summary.total_bonus_usd,
      totalBonusKhr: result.summary.total_bonus_khr,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
