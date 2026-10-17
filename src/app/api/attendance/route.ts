import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { AttendanceRecord, isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    let employeeId = searchParams.get('employee_id');

    let userRole: string | undefined;
    let authId: string | undefined;
    try {
      const cookieStore = await cookies();
      userRole = cookieStore.get('hestra_role')?.value;
      authId = cookieStore.get('hestra_auth')?.value;
    } catch {
      if (request && 'cookies' in request && (request as any).cookies?.get) {
        userRole = (request as any).cookies.get('hestra_role')?.value;
        authId = (request as any).cookies.get('hestra_auth')?.value;
      }
    }

    // If requester is an Employee, enforce filtering strictly to their own attendance records
    if (userRole === 'Employee' && authId) {
      employeeId = authId;
      // Resolve user id to employee id if needed
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ? OR username = ?').get(authId, authId) as any;
      if (u && u.employee_id) {
        employeeId = u.employee_id;
      }
    }

    let sql = `
      SELECT 
        a.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar,
        COALESCE(d.name, 'General') as department_name,
        e.department_id,
        e.employee_type,
        e.employment_type
      FROM attendance a
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN users u ON (u.id = a.employee_id OR u.employee_id = a.employee_id)
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      sql += ` AND a.date = ?`;
      params.push(date);
    }

    if (month) {
      sql += ` AND a.date LIKE ?`;
      params.push(`${month}%`);
    }

    if (startDate && endDate) {
      sql += ` AND a.date >= ? AND a.date <= ?`;
      params.push(startDate, endDate);
    }

    if (employeeId) {
      let linkedEmpId = employeeId;
      try {
        const u = db.prepare('SELECT employee_id FROM users WHERE id = ?').get(employeeId) as any;
        if (u && u.employee_id) linkedEmpId = u.employee_id;
      } catch {}
      sql += ` AND (a.employee_id = ? OR a.employee_id = ?)`;
      params.push(employeeId, linkedEmpId);
    }

    sql += ` ORDER BY a.date DESC, a.clock_in ASC`;

    const rawRecords = db.prepare(sql).all(...params) as any[];
    const records = rawRecords.filter((r) => !isBoardMember({
      role: r.employee_role,
      department_name: r.department_name,
      department_id: r.department_id,
      employee_type: r.employee_type,
      employment_type: r.employment_type,
    })) as AttendanceRecord[];
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      date = new Date().toISOString().split('T')[0],
      clock_in = '09:00:00',
      clock_out = null,
      status = 'Present',
      work_hours = 8,
      notes = '',
    } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    let finalEmpId = employee_id;
    const empExists = db.prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
    if (!empExists) {
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ? OR username = ?').get(employee_id, employee_id) as any;
      if (u && u.employee_id) finalEmpId = u.employee_id;
    }

    const targetEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(finalEmpId) as any;
    if (targetEmp && isBoardMember(targetEmp)) {
      return NextResponse.json(
        { error: 'Members of the Board of Directors are exempt from attendance tracking.' },
        { status: 400 }
      );
    }

    const id = `att-${finalEmpId}-${date}`;

    db.prepare(`
      INSERT INTO attendance (id, employee_id, date, clock_in, clock_out, status, work_hours, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id, date) DO UPDATE SET
        clock_in = excluded.clock_in,
        clock_out = excluded.clock_out,
        status = excluded.status,
        work_hours = excluded.work_hours,
        notes = excluded.notes
    `).run(id, finalEmpId, date, clock_in, clock_out, status, Number(work_hours), notes);

    const record = db.prepare(`
      SELECT 
        a.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar
      FROM attendance a
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN users u ON (u.id = a.employee_id OR u.employee_id = a.employee_id)
      WHERE a.id = ?
    `).get(id);

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
