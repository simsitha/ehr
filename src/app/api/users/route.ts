import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];

    if (q) {
      query += ' AND (name LIKE ? OR email LIKE ? OR department_name LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const users = db.prepare(query).all(...params);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      name,
      email,
      role = 'Employee',
      status = 'Active',
      employee_id = null,
      department_name = 'ទូទៅ (General)',
      avatar = '',
      permissions = 'self_service,clock_in,request_leave,view_payslips',
      two_factor_enabled = 0,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const finalEmail = email && typeof email === 'string' && email.trim() ? email.trim() : null;

    // Check email uniqueness if email provided
    if (finalEmail) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(finalEmail);
      if (existing) {
        return NextResponse.json({ error: 'Email already exists in system' }, { status: 409 });
      }
    }

    const id = `usr-${Date.now().toString().slice(-6)}`;
    const createdAt = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO users (
        id, name, email, role, status, employee_id, department_name, avatar,
        two_factor_enabled, permissions, last_login, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Never', ?
      )
    `).run(
      id,
      name,
      finalEmail,
      role,
      status,
      employee_id,
      department_name,
      avatar,
      two_factor_enabled ? 1 : 0,
      permissions,
      createdAt
    );

    if (employee_id && department_name) {
      const dept = db.prepare('SELECT id FROM departments WHERE name = ? OR id = ?').get(department_name, department_name) as any;
      if (dept) {
        db.prepare('UPDATE employees SET department_id = ? WHERE id = ?').run(dept.id, employee_id);
      }
    }

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
