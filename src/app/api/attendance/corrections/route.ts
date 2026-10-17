import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAttendanceCorrection, getAttendanceCorrections } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const employeeId = searchParams.get('employee_id') || undefined;

    const corrections = getAttendanceCorrections(date, employeeId);
    return NextResponse.json(corrections);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Only HR Administrators can submit attendance corrections' }, { status: 403 });
    }

    const body = await request.json();
    const { attendance_id, employee_id, date, field_changed, old_value, new_value, reason } = body;

    if (!attendance_id || !employee_id || !date || !field_changed || !new_value || !reason) {
      return NextResponse.json(
        { error: 'Missing required correction fields: attendance_id, employee_id, date, field_changed, new_value, and reason are required.' },
        { status: 400 }
      );
    }

    const correction = createAttendanceCorrection({
      attendance_id,
      employee_id,
      date,
      field_changed,
      old_value,
      new_value,
      reason,
      changed_by: adminUser,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance correction recorded for ${employee_id} on ${date}. Raw device logs remain preserved.`,
      correction,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
