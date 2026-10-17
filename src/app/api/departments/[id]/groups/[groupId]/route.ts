import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroupById, saveEmployeeGroup, deleteEmployeeGroup } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const group = getEmployeeGroupById(groupId);
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
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id, groupId } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM employee_groups WHERE id = ?').get(groupId) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const duplicate = db.prepare('SELECT * FROM employee_groups WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, groupId) as any;
    if (duplicate) {
      return NextResponse.json({ error: `A group named "${trimmedName}" already exists.` }, { status: 409 });
    }

    const saved = saveEmployeeGroup({
      id: groupId,
      name: trimmedName,
      department_id: id,
      description: description !== undefined ? description?.trim() : existing.description,
    });

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error updating department group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const success = deleteEmployeeGroup(groupId);
    if (!success) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting department group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
