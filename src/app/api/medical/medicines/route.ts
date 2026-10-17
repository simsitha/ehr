import { NextResponse } from 'next/server';
import { getMedicines, getMedicineById, saveMedicine, deleteMedicine, getMedicalDashboardStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const id = searchParams.get('id');

    if (id) {
      const item = getMedicineById(id);
      if (!item) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const medicines = getMedicines({ category, status, search });
    const stats = getMedicalDashboardStats();

    return NextResponse.json({
      medicines,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch medicines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.unit || !body.dosage || !body.batch_number) {
      return NextResponse.json(
        { error: 'Medicine name, unit, dosage, and batch number are required.' },
        { status: 400 }
      );
    }

    const saved = saveMedicine({
      name: body.name.trim(),
      generic_name: body.generic_name?.trim() || '',
      category: body.category || 'Analgesics & Antipyretics',
      unit: body.unit.trim(),
      dosage: body.dosage.trim(),
      supplier: body.supplier?.trim() || '',
      batch_number: body.batch_number.trim(),
      expiry_date: body.expiry_date || '',
      quantity_in_stock: Number(body.quantity_in_stock ?? 0),
      min_stock_level: Number(body.min_stock_level ?? 10),
      purchase_price: Number(body.purchase_price ?? 0),
      storage_location: body.storage_location?.trim() || 'Cabinet A1',
      description: body.description?.trim() || '',
      side_effects: body.side_effects?.trim() || '',
    }, body.performed_by || 'HR Admin');

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({ error: error.message || 'Failed to create medicine' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Medicine ID is required for update.' }, { status: 400 });
    }

    const updated = saveMedicine(body, body.performed_by || 'HR Admin');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating medicine:', error);
    return NextResponse.json({ error: error.message || 'Failed to update medicine' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required.' }, { status: 400 });
    }

    const success = deleteMedicine(id);
    return NextResponse.json({ success, id });
  } catch (error: any) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete medicine' }, { status: 500 });
  }
}
