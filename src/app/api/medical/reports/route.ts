import { NextResponse } from 'next/server';
import { getMedicalReportsData, getMedicalDashboardStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const reports = getMedicalReportsData();
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error fetching medical reports data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch medical reports data' }, { status: 500 });
  }
}
