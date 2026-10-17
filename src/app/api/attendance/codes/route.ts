import { NextResponse } from 'next/server';
import { getAttendanceStatusCodes, saveAttendanceStatusCode, logAudit } from '@/lib/db';
import { AttendanceStatusCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const codes = getAttendanceStatusCodes();
    return NextResponse.json(codes);
  } catch (error: any) {
    console.error('Error fetching attendance status codes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AttendanceStatusCode;

    if (!body.code || !body.name_en || !body.name_km) {
      return NextResponse.json(
        { error: 'code, name_en, and name_km are required' },
        { status: 400 }
      );
    }

    saveAttendanceStatusCode({
      code: body.code.toUpperCase().trim(),
      name_en: body.name_en.trim(),
      name_km: body.name_km.trim(),
      description: body.description || '',
      is_paid: body.is_paid ? 1 : 0,
      attendance_value: typeof body.attendance_value === 'number' ? body.attendance_value : 1.0,
      payroll_effect: body.payroll_effect || 'full',
      badge_color: body.badge_color || '#059669',
      badge_bg: body.badge_bg || '#ecfdf5',
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    });

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_ATTENDANCE_CODE',
      module: 'Attendance Codes',
      record_id: body.code,
      new_value: JSON.stringify(body),
    });

    const allCodes = getAttendanceStatusCodes();
    return NextResponse.json({ success: true, codes: allCodes });
  } catch (error: any) {
    console.error('Error saving attendance status code:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
