import { NextResponse } from 'next/server';
import { assignM365Account } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account_id, employee_id, performed_by = 'IT Administrator', notes } = body;

    if (!account_id) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    const updated = assignM365Account(account_id, employee_id || null, performed_by, notes);
    if (!updated) {
      return NextResponse.json({ error: 'M365 Account not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error assigning/returning M365 account:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
