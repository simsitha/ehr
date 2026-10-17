import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getAttendanceBonusRules,
  saveAttendanceBonusRule,
} from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';
    const rules = getAttendanceBonusRules(includeInactive);
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Administrators can configure attendance bonus rules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      rule_name,
      minimum_attendance_days,
      maximum_attendance_days,
      bonus_amount,
      currency = 'USD',
      effective_from,
      effective_to,
      is_active = 1,
      priority = 1,
    } = body;

    if (!rule_name || minimum_attendance_days === undefined || bonus_amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: rule_name, minimum_attendance_days, and bonus_amount are mandatory.',
        },
        { status: 400 }
      );
    }

    if (Number(minimum_attendance_days) < 0 || Number(bonus_amount) < 0) {
      return NextResponse.json(
        { success: false, error: 'Attendance days and bonus amount cannot be negative.' },
        { status: 400 }
      );
    }

    if (
      maximum_attendance_days !== null &&
      maximum_attendance_days !== undefined &&
      Number(maximum_attendance_days) <= Number(minimum_attendance_days)
    ) {
      return NextResponse.json(
        { success: false, error: 'Maximum attendance days must be greater than minimum attendance days.' },
        { status: 400 }
      );
    }

    const rule = saveAttendanceBonusRule(
      {
        rule_name,
        minimum_attendance_days: Number(minimum_attendance_days),
        maximum_attendance_days:
          maximum_attendance_days !== null && maximum_attendance_days !== undefined && maximum_attendance_days !== ''
            ? Number(maximum_attendance_days)
            : null,
        bonus_amount: Number(bonus_amount),
        currency,
        effective_from,
        effective_to,
        is_active: is_active ? 1 : 0,
        priority: Number(priority || 1),
      },
      userName
    );

    return NextResponse.json(
      { success: true, message: `Bonus rule '${rule.rule_name}' saved successfully.`, rule },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
