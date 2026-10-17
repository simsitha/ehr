import { NextResponse } from 'next/server';
import { ZKTecoReportService } from '@/lib/zkteco/report-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const departmentId = searchParams.get('department') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    if (type === 'daily') {
      const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
      const data = ZKTecoReportService.getDailyReport({ date, departmentId, status, search });
      return NextResponse.json(data);
    }

    if (type === 'weekly') {
      const weekStart = searchParams.get('weekStart') || undefined;
      const weekEnd = searchParams.get('weekEnd') || undefined;
      const data = ZKTecoReportService.getWeeklyReport({ weekStart, weekEnd, departmentId, search });
      return NextResponse.json(data);
    }

    if (type === 'monthly') {
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
      const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
      const data = ZKTecoReportService.getMonthlyReport({ year, month, departmentId, search });
      return NextResponse.json(data);
    }

    if (type === 'summary') {
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const data = ZKTecoReportService.getSummaryReport({ startDate, endDate, departmentId });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Invalid report type: ${type}. Expected: daily, weekly, monthly, summary` }, { status: 400 });
  } catch (err: any) {
    console.error('Error generating ZKTeco report:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
