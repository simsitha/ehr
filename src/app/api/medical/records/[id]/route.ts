import { NextResponse } from 'next/server';
import { getMedicalRecordById, saveMedicalRecord, deleteMedicalRecord } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = getMedicalRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching medical record by ID:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch medical record' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = saveMedicalRecord({ ...body, id }, body.medicinesToIssue);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating medical record:', error);
    return NextResponse.json({ error: error.message || 'Failed to update medical record' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteMedicalRecord(id);
    return NextResponse.json({ success, id });
  } catch (error: any) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete medical record' }, { status: 500 });
  }
}
