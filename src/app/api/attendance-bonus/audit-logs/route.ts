import { NextResponse } from 'next/server';
import { getAttendanceBonusAuditLogs } from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = getAttendanceBonusAuditLogs(periodId, employeeId, limit);

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
