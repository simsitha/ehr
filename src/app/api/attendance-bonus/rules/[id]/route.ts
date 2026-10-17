import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getAttendanceBonusRuleById,
  saveAttendanceBonusRule,
  deleteAttendanceBonusRule,
} from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = getAttendanceBonusRuleById(id);
    if (!rule) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Administrators can modify attendance bonus rules' },
        { status: 403 }
      );
    }

    const existing = getAttendanceBonusRuleById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const updatedRule = saveAttendanceBonusRule(
      {
        id,
        rule_name: body.rule_name ?? existing.rule_name,
        minimum_attendance_days:
          body.minimum_attendance_days !== undefined
            ? Number(body.minimum_attendance_days)
            : existing.minimum_attendance_days,
        maximum_attendance_days:
          body.maximum_attendance_days !== undefined
            ? (body.maximum_attendance_days === null || body.maximum_attendance_days === ''
                ? null
                : Number(body.maximum_attendance_days))
            : existing.maximum_attendance_days,
        bonus_amount: body.bonus_amount !== undefined ? Number(body.bonus_amount) : existing.bonus_amount,
        currency: body.currency ?? existing.currency,
        effective_from: body.effective_from ?? existing.effective_from,
        effective_to: body.effective_to ?? existing.effective_to,
        is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active,
        priority: body.priority !== undefined ? Number(body.priority) : existing.priority,
      },
      userName
    );

    return NextResponse.json({
      success: true,
      message: `Rule '${updatedRule.rule_name}' updated successfully.`,
      rule: updatedRule,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value || 'Admin';
    const userName = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    if (userRole === 'Employee') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only HR Administrators can delete bonus rules' },
        { status: 403 }
      );
    }

    const deleted = deleteAttendanceBonusRule(id, userName);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Rule '${id}' deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
