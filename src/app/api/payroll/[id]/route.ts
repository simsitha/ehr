import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const record = db.prepare(`
      SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.khmer_name,
        e.email,
        e.bank_name,
        e.bank_account_number,
        e.national_id,
        e.contract_type,
        e.role as employee_role,
        e.avatar as employee_avatar,
        e.location as employee_location,
        d.name as department_name
      FROM payrolls p
      JOIN employees e ON e.id = p.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE p.id = ?
    `).get(id);

    if (!record) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error fetching payslip:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    db.prepare('UPDATE payrolls SET status = ? WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM payrolls WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating payroll status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
