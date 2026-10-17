import { NextResponse } from 'next/server';
import { assignEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { employee_id, group_id } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    assignEmployeeGroup(employee_id, group_id || null);

    return NextResponse.json({ success: true, department_id: id, employee_id, group_id });
  } catch (error: any) {
    console.error('Error assigning employee to group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
