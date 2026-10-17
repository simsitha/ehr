import { NextResponse } from 'next/server';
import { getMedicineStockTransactions, recordStockTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get('medicine_id') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;

    const transactions = getMedicineStockTransactions(medicineId, limit);
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching stock transactions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.medicine_id || !body.transaction_type || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Medicine, transaction type, and quantity are required.' },
        { status: 400 }
      );
    }

    const tx = recordStockTransaction({
      medicine_id: body.medicine_id,
      transaction_type: body.transaction_type,
      quantity: Number(body.quantity),
      batch_number: body.batch_number,
      unit_cost: body.unit_cost !== undefined ? Number(body.unit_cost) : undefined,
      supplier_or_dest: body.supplier_or_dest,
      reference_id: body.reference_id,
      performed_by: body.performed_by || 'HR Admin',
      notes: body.notes,
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (error: any) {
    console.error('Error recording stock transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to record stock transaction' }, { status: 400 });
  }
}
