import { NextResponse } from 'next/server';
import {
  getEmployeeMedicalRecords,
  getMedicalRecordById,
  saveMedicalRecord,
  deleteMedicalRecord,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id') || undefined;
    const departmentId = searchParams.get('department_id') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const id = searchParams.get('id');

    if (id) {
      const record = getMedicalRecordById(id);
      if (!record) {
        return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    const records = getEmployeeMedicalRecords({
      employeeId,
      departmentId,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch medical records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.employee_id || !body.symptoms || !body.diagnosis) {
      return NextResponse.json(
        { error: 'Employee, symptoms/reason for visit, and diagnosis are required.' },
        { status: 400 }
      );
    }

    const saved = saveMedicalRecord(
      {
        employee_id: body.employee_id,
        visit_date: body.visit_date,
        visit_time: body.visit_time,
        symptoms: body.symptoms.trim(),
        diagnosis: body.diagnosis.trim(),
        temperature: body.temperature ? Number(body.temperature) : undefined,
        blood_pressure: body.blood_pressure?.trim() || undefined,
        heart_rate: body.heart_rate ? Number(body.heart_rate) : undefined,
        respiratory_rate: body.respiratory_rate ? Number(body.respiratory_rate) : undefined,
        weight_kg: body.weight_kg ? Number(body.weight_kg) : undefined,
        medicine_prescribed: body.medicine_prescribed?.trim() || '',
        dosage: body.dosage?.trim() || '',
        frequency: body.frequency?.trim() || '',
        duration: body.duration?.trim() || '',
        doctor_name: body.doctor_name?.trim() || 'Dr. Chea Sokhom (Chief Medical Officer)',
        medical_notes: body.medical_notes?.trim() || '',
        recommended_action: body.recommended_action?.trim() || '',
        medical_leave_granted: body.medical_leave_granted ? 1 : 0,
        medical_leave_days: Number(body.medical_leave_days || 0),
        follow_up_date: body.follow_up_date || undefined,
        status: body.status || 'Completed',
      },
      body.medicinesToIssue || []
    );

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medical record:', error);
    return NextResponse.json({ error: error.message || 'Failed to create medical record' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 });
    }

    const success = deleteMedicalRecord(id);
    return NextResponse.json({ success, id });
  } catch (error: any) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete medical record' }, { status: 500 });
  }
}
