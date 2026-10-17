import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getAttendanceBonusPolicyConfig,
  saveAttendanceBonusPolicyConfig,
} from '@/lib/attendanceBonusDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getAttendanceBonusPolicyConfig();
    return NextResponse.json({ success: true, config });
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
        { success: false, error: 'Unauthorized: Only HR Administrators can modify bonus calculation policy' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = saveAttendanceBonusPolicyConfig(body, userName);

    return NextResponse.json({
      success: true,
      message: 'Attendance bonus policy configuration updated successfully.',
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
