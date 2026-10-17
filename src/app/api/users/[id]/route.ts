import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      role,
      status,
      permissions,
      department_name,
      two_factor_enabled,
      name,
    } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(permissions);
    }
    if (department_name !== undefined) {
      updates.push('department_name = ?');
      values.push(department_name);
    }
    if (two_factor_enabled !== undefined) {
      updates.push('two_factor_enabled = ?');
      values.push(two_factor_enabled ? 1 : 0);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (department_name !== undefined && (user as any).employee_id) {
      const dept = db.prepare('SELECT id FROM departments WHERE name = ? OR id = ?').get(department_name, department_name) as any;
      if (dept) {
        db.prepare('UPDATE employees SET department_id = ? WHERE id = ?').run(dept.id, (user as any).employee_id);
      }
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Prevent deleting the last remaining active administrator account
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (targetUser && targetUser.role === 'Admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Admin' AND status = 'Active'").get() as { count: number };
      if (adminCount.count <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only remaining active Administrator account' },
          { status: 403 }
        );
      }
    }

    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (res.changes === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
