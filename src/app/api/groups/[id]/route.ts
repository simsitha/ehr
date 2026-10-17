import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroupById, saveEmployeeGroup, deleteEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = getEmployeeGroupById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM employee_groups WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, department_id, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const duplicate = db.prepare('SELECT * FROM employee_groups WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, id) as any;
    if (duplicate) {
      return NextResponse.json({ error: `A group named "${trimmedName}" already exists.` }, { status: 409 });
    }

    const saved = saveEmployeeGroup({
      id,
      name: trimmedName,
      department_id: department_id !== undefined ? department_id : existing.department_id,
      description: description !== undefined ? description?.trim() : existing.description,
    });

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteEmployeeGroup(id);
    if (!success) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
