import { NextResponse } from 'next/server';
import { getDb, createNotification } from '@/lib/db';
import { LeaveRequest, isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id');

    let sql = `
      SELECT 
        lr.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar,
        COALESCE(d.name, 'General') as department_name,
        COALESCE(lm.first_name || ' ' || lm.last_name, lmu.name) as line_manager_name,
        COALESCE(adm.first_name || ' ' || adm.last_name, admu.name) as admin_reviewer_name,
        COALESCE(r.first_name || ' ' || r.last_name, ru.name) as reviewer_name
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON (u.id = lr.employee_id OR u.employee_id = lr.employee_id)
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees lm ON lm.id = lr.line_manager_id
      LEFT JOIN users lmu ON (lmu.id = lr.line_manager_id OR lmu.employee_id = lr.line_manager_id)
      LEFT JOIN employees adm ON adm.id = lr.admin_reviewer_id
      LEFT JOIN users admu ON (admu.id = lr.admin_reviewer_id OR admu.employee_id = lr.admin_reviewer_id)
      LEFT JOIN employees r ON r.id = lr.reviewer_id
      LEFT JOIN users ru ON (ru.id = lr.reviewer_id OR ru.employee_id = lr.reviewer_id)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      if (status === 'Pending') {
        sql += ` AND (lr.status = 'Pending' OR lr.status = 'Pending Manager' OR lr.status = 'Pending Admin')`;
      } else {
        sql += ` AND lr.status = ?`;
        params.push(status);
      }
    }

    if (employeeId) {
      let linkedEmpId = employeeId;
      try {
        const u = db.prepare('SELECT employee_id FROM users WHERE id = ?').get(employeeId) as any;
        if (u && u.employee_id) linkedEmpId = u.employee_id;
      } catch {}
      sql += ` AND (lr.employee_id = ? OR lr.employee_id = ?)`;
      params.push(employeeId, linkedEmpId);
    }

    sql += ` ORDER BY lr.created_at DESC`;

    const records = db.prepare(sql).all(...params) as LeaveRequest[];
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      leave_type = 'Annual',
      start_date,
      end_date,
      days_count,
      reason = '',
    } = body;

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'employee_id, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    let finalEmpId = employee_id;
    const empExists = db.prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
    if (!empExists) {
      const u = db.prepare('SELECT employee_id FROM users WHERE id = ? OR username = ?').get(employee_id, employee_id) as any;
      if (u && u.employee_id) {
        finalEmpId = u.employee_id;
      }
    }

    const targetEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(finalEmpId) as any;
    if (targetEmp && isBoardMember(targetEmp)) {
      return NextResponse.json(
        { error: 'Members of the Board of Directors are exempt from employee leave requests.' },
        { status: 400 }
      );
    }

    // Calculate days if not provided
    let calculatedDays = Number(days_count);
    if (!calculatedDays || calculatedDays <= 0) {
      const d1 = new Date(start_date);
      const d2 = new Date(end_date);
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      calculatedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    const id = `leave-${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Initial status is 'Pending Manager' (First step: Line Manager approval)
    db.prepare(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type, start_date, end_date,
        days_count, reason, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Manager', ?)
    `).run(id, finalEmpId, leave_type, start_date, end_date, calculatedDays, reason, createdAt);

    const record = db.prepare(`
      SELECT 
        lr.*,
        COALESCE(e.first_name || ' ' || e.last_name, u.name, 'Staff Member') as employee_name,
        COALESCE(e.role, u.role, 'Employee') as employee_role,
        COALESCE(e.avatar, u.avatar, '') as employee_avatar
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON (u.id = lr.employee_id OR u.employee_id = lr.employee_id)
      WHERE lr.id = ?
    `).get(id) as any;

    try {
      createNotification({
        title: `Leave request submitted: ${record?.employee_name || 'Staff Member'}`,
        title_km: `សំណើសុំច្បាប់ត្រូវបានបញ្ជូន៖ ${record?.employee_name || 'បុគ្គលិក'}`,
        message: `${leave_type} leave (${calculatedDays} days): ${start_date} to ${end_date}`,
        message_km: `ច្បាប់ប្រភេទ ${leave_type} (${calculatedDays} ថ្ងៃ)៖ ពី ${start_date} ដល់ ${end_date}`,
        type: 'leave',
        link: '/leaves',
        role: 'All',
      });
    } catch (err) {
      console.error('Error creating leave notification:', err);
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
