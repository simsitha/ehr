import { NextResponse } from 'next/server';
import { assignITAsset } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asset_id, employee_id, performed_by = 'IT Administrator', notes } = body;

    if (!asset_id) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    const updated = assignITAsset(asset_id, employee_id || null, performed_by, notes);
    if (!updated) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error assigning/returning IT asset:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
