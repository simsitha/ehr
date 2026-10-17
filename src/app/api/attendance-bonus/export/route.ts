import { NextResponse } from 'next/server';
import {
  getAttendanceBonusCalculations,
  getAttendanceBonusSummary,
} from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId') || 'period-2026-10';
    const format = searchParams.get('format') || 'csv';

    const calculations = getAttendanceBonusCalculations(periodId);
    const summary = getAttendanceBonusSummary(periodId);

    if (format === 'json') {
      return NextResponse.json({ summary, calculations });
    }

    // Generate CSV
    const headers = [
      'Employee ID',
      'Employee Name',
      'Khmer Name',
      'Department',
      'Position',
      'Scheduled Days',
      'Present Days',
      'Half Days',
      'Approved Leave Days',
      'Unpaid Leave Days',
      'Absent Days',
      'Qualifying Attendance Days',
      'Attendance Tier',
      'Bonus Amount (USD)',
      'Bonus Amount (KHR)',
      'Status',
      'Calculated At',
      'Approved By',
      'Posted To Payroll At',
    ];

    const rows = calculations.map((c) => [
      `"${c.employee_id}"`,
      `"${c.employee_name || ''}"`,
      `"${c.khmer_name || ''}"`,
      `"${c.department_name || ''}"`,
      `"${c.position || ''}"`,
      c.scheduled_days,
      c.present_days,
      c.half_days,
      c.approved_leave_days,
      c.unpaid_leave_days,
      c.absent_days,
      c.attendance_days,
      `"${c.tier_name || ''}"`,
      c.bonus_amount.toFixed(2),
      c.bonus_amount_khr,
      `"${c.calculation_status}"`,
      `"${c.calculated_at || ''}"`,
      `"${c.approved_by || ''}"`,
      `"${c.posted_to_payroll_at || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-bonus-${summary.period_name.replace(/\s+/g, '_')}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
