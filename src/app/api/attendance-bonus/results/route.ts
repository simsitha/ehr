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
    const departmentId = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const search = searchParams.get('search') || undefined;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));

    const summary = getAttendanceBonusSummary(periodId);
    const allCalculations = getAttendanceBonusCalculations(periodId, {
      departmentId,
      status,
      tier,
      search,
    });

    const total = allCalculations.length;
    const startIndex = (page - 1) * limit;
    const paginatedCalculations = allCalculations.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      summary,
      calculations: paginatedCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
