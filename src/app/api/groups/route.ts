import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroups, saveEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id') || undefined;
    const groups = getEmployeeGroups(departmentId);
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching employee groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, department_id = null, description = '', id: customId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const db = getDb();
    const existing = db.prepare('SELECT * FROM employee_groups WHERE LOWER(name) = LOWER(?)').get(trimmedName) as any;
    if (existing) {
      return NextResponse.json({ error: `Group "${trimmedName}" already exists.` }, { status: 409 });
    }

    const saved = saveEmployeeGroup({
      id: customId || `grp-${Date.now()}`,
      name: trimmedName,
      department_id,
      description: description?.trim() || '',
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
