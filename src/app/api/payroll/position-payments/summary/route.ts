import { NextResponse } from 'next/server';
import { getPositionPaymentSummary } from '@/lib/positionPaymentDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || undefined;

    const summary = getPositionPaymentSummary(period);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching position payment summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
