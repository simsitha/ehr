import { NextResponse } from 'next/server';
import {
  getAttendanceBonusCalculationById,
  getAttendanceBonusAuditLogs,
} from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const calc = getAttendanceBonusCalculationById(id);

    if (!calc) {
      return NextResponse.json({ success: false, error: 'Calculation not found' }, { status: 404 });
    }

    let parsedDetails = null;
    if (calc.details_json) {
      try {
        parsedDetails = JSON.parse(calc.details_json);
      } catch {}
    }

    const auditLogs = getAttendanceBonusAuditLogs(calc.payroll_period_id, calc.employee_id, 20);

    return NextResponse.json({
      success: true,
      calculation: {
        ...calc,
        details: parsedDetails,
      },
      auditLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
