import { NextResponse } from 'next/server';
import { getRawTransactions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id') || undefined;
    const date = searchParams.get('date') || undefined;
    const employeeId = searchParams.get('employee_id') || undefined;
    const isProcessedStr = searchParams.get('is_processed');
    const isProcessed = isProcessedStr !== null && isProcessedStr !== undefined ? Number(isProcessedStr) : undefined;
    const limit = Number(searchParams.get('limit')) || 200;

    const transactions = getRawTransactions({
      deviceId,
      date,
      employeeId,
      isProcessed,
      limit,
    });

    return NextResponse.json(transactions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
