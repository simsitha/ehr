import { NextResponse } from 'next/server';
import { calculateWeeklyAbsentAlReport } from '@/lib/attendanceEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Default to current week's Monday and Sunday
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(now.setDate(diffToMonday + 6));

    const weekStart = searchParams.get('weekStart') || '2026-10-05';
    const weekEnd = searchParams.get('weekEnd') || '2026-10-11';
    const deptFilter = searchParams.get('department') || 'all';
    const groupFilter = searchParams.get('group') || 'all';

    const report = calculateWeeklyAbsentAlReport(weekStart, weekEnd);

    let filteredEmployees = report.employees;

    if (groupFilter !== 'all') {
      if (groupFilter === 'none') {
        filteredEmployees = filteredEmployees.filter(
          (e) => !e.group_name || e.group_name.trim() === '' || e.group_name === 'No Line / General'
        );
      } else {
        filteredEmployees = filteredEmployees.filter((e) => e.group_name === groupFilter);
      }
    }

    return NextResponse.json({
      ...report,
      employees: filteredEmployees,
    });
  } catch (error: any) {
    console.error('Error generating weekly attendance report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
