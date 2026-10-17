import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { postAttendanceBonusToPayroll } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'Payroll Officer';

    if (userRole !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Payroll Officers or Administrators can post bonuses to payroll' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { periodId, calculationIds } = body;

    if (!periodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: periodId is mandatory.' },
        { status: 400 }
      );
    }

    const result = postAttendanceBonusToPayroll(periodId, userName, calculationIds);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${result.count} approved attendance bonus(es) into employee payroll ($${result.totalAmountUsd.toFixed(2)} USD total).`,
      count: result.count,
      totalAmountUsd: result.totalAmountUsd,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
