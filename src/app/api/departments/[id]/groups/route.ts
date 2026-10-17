import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroups, saveEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const groups = getEmployeeGroups(id);
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching department groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(id);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description = '', id: customGroupId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if group with same name already exists in database
    const existing = db.prepare('SELECT * FROM employee_groups WHERE LOWER(name) = LOWER(?)').get(trimmedName) as any;
    if (existing) {
      // If it exists in another department or unassigned, we can reassign or warn
      if (existing.department_id && existing.department_id !== id) {
        return NextResponse.json(
          { error: `A group named "${trimmedName}" already exists in another department.` },
          { status: 409 }
        );
      }
      // If it exists in this department
      if (existing.department_id === id) {
        return NextResponse.json(
          { error: `Group "${trimmedName}" already exists in this department.` },
          { status: 409 }
        );
      }
    }

    const saved = saveEmployeeGroup({
      id: customGroupId || `grp-${Date.now()}`,
      name: trimmedName,
      department_id: id,
      description: description?.trim() || '',
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error adding group to department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
