import { NextResponse } from 'next/server';
import { getDb, getEmployeeGroups } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const department = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        m.avatar as manager_avatar
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      WHERE d.id = ?
    `).get(id) as any;

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const members = db.prepare(`
      SELECT id, first_name, last_name, khmer_name, role, email, phone, avatar, status, employment_type, salary, group_name, group_id
      FROM employees
      WHERE department_id = ? AND status != 'Terminated'
      ORDER BY first_name ASC
    `).all(id);

    const groups = getEmployeeGroups(id);

    return NextResponse.json({
      ...department,
      members,
      employee_count: members.length,
      groups,
      group_count: groups.length,
    });
  } catch (error: any) {
    console.error('Error fetching department details:', error);
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
    const body = await request.json();

    const { name, description = '', manager_id = null, color = '#3b82f6' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE departments 
      SET name = ?, description = ?, manager_id = ?, color = ?
      WHERE id = ?
    `).run(name, description, manager_id, color, id);

    const updated = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        count(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      LEFT JOIN employees e ON e.department_id = d.id AND e.status != 'Terminated'
      WHERE d.id = ?
      GROUP BY d.id, m.first_name, m.last_name
    `).get(id);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating department:', error);
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    db.prepare('UPDATE departments SET name = ? WHERE id = ?').run(name.trim(), id);

    const updated = db.prepare(`
      SELECT 
        d.*,
        m.first_name || ' ' || m.last_name as manager_name,
        count(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees m ON m.id = d.manager_id
      LEFT JOIN employees e ON e.department_id = d.id AND e.status != 'Terminated'
      WHERE d.id = ?
      GROUP BY d.id, m.first_name, m.last_name
    `).get(id);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error renaming department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const deleteTx = db.transaction(() => {
      db.prepare("UPDATE employees SET department_id = '' WHERE department_id = ?").run(id);
      db.prepare("UPDATE job_postings SET department_id = '' WHERE department_id = ?").run(id);
      db.prepare("UPDATE employee_groups SET department_id = NULL WHERE department_id = ?").run(id);
      db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    });

    deleteTx();

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
