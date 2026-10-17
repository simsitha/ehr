import { NextResponse } from 'next/server';
import { getMedicineIssuances, issueMedicine } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id') || undefined;
    const medicineId = searchParams.get('medicine_id') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const issuances = getMedicineIssuances({
      employeeId,
      medicineId,
      startDate,
      endDate,
    });

    return NextResponse.json(issuances);
  } catch (error: any) {
    console.error('Error fetching medicine issuances:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch medicine issuances' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.employee_id || !body.medicine_id || !body.quantity_issued) {
      return NextResponse.json(
        { error: 'Employee, medicine, and quantity are required.' },
        { status: 400 }
      );
    }

    const issuance = issueMedicine({
      medical_record_id: body.medical_record_id || undefined,
      employee_id: body.employee_id,
      medicine_id: body.medicine_id,
      quantity_issued: Number(body.quantity_issued),
      prescription_instruction: body.prescription_instruction || body.instruction,
      dosage: body.dosage,
      frequency: body.frequency,
      duration: body.duration,
      issued_by: body.issued_by || 'Dr. Chea Sokhom (Chief Medical Officer)',
      notes: body.notes,
    });

    return NextResponse.json(issuance, { status: 201 });
  } catch (error: any) {
    console.error('Error issuing medicine:', error);
    return NextResponse.json({ error: error.message || 'Failed to issue medicine' }, { status: 400 });
  }
}
