import { NextResponse } from 'next/server';
import { getDb, getPayrollRules, logAudit } from '@/lib/db';
import { OvertimeRequest, isBoardMember } from '@/lib/types';
import { calculateOvertimeDuration } from '@/lib/overtimeEngine';
import { calculateHourlyRate } from '@/lib/payrollRules';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g. '2026-10'
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('department_id');
    const group = searchParams.get('group');
    const employeeId = searchParams.get('employee_id');

    let sql = `
      SELECT 
        o.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.khmer_name, '') as khmer_name,
        COALESCE(e.gender, '') as gender,
        COALESCE(e.group_name, 'General') as group_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (month && month !== 'all') {
      sql += ` AND o.date LIKE ?`;
      params.push(`${month}%`);
    }

    if (date) {
      sql += ` AND o.date = ?`;
      params.push(date);
    }

    if (status && status !== 'all') {
      if (status === 'Pending') {
        sql += ` AND (o.status = 'Pending' OR o.status = 'Pending Manager' OR o.status = 'Pending Admin' OR o.status = 'Submitted')`;
      } else {
        sql += ` AND o.status = ?`;
        params.push(status);
      }
    }

    if (departmentId && departmentId !== 'all') {
      sql += ` AND e.department_id = ?`;
      params.push(departmentId);
    }

    if (group && group !== 'all') {
      sql += ` AND e.group_name = ?`;
      params.push(group);
    }

    if (employeeId) {
      sql += ` AND o.employee_id = ?`;
      params.push(employeeId);
    }

    sql += ` ORDER BY o.date DESC, o.created_at DESC`;

    const records = db.prepare(sql).all(...params) as OvertimeRequest[];
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching overtime requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      date,
      start_time,
      end_time,
      hours: rawHours,
      ot_rate_type = 'normal_day_150',
      reason,
      project_name,
      status: reqStatus = 'Submitted',
      user_name = 'Staff Member',
    } = body;

    if (!employee_id || !date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { error: 'Employee, date, start time, end time, and reason are required' },
        { status: 400 }
      );
    }

    // Auto-compute overtime duration if hours not explicitly supplied or calculate safely
    let hours = Number(rawHours);
    if (!hours || isNaN(hours) || hours <= 0) {
      hours = calculateOvertimeDuration(start_time, end_time);
    }

    if (hours <= 0) {
      return NextResponse.json(
        { error: 'Overtime duration must be greater than 0 hours' },
        { status: 400 }
      );
    }

    // Look up employee
    const emp = db.prepare('SELECT salary, department_id, manager_id, role, employee_type, employment_type FROM employees WHERE id = ?').get(employee_id) as any;
    if (emp && isBoardMember(emp)) {
      return NextResponse.json(
        { error: 'Members of the Board of Directors are exempt from overtime tasks.' },
        { status: 400 }
      );
    }
    const salary = emp?.salary || 1000;

    // Load dynamic payroll rules
    const rules = getPayrollRules();
    const workingDays = rules.working_days_per_month || 26;
    const hoursPerDay = rules.daily_working_hours || 8;
    const hourlyRate = calculateHourlyRate(salary, workingDays, hoursPerDay);

    let multiplier = rules.ot_multiplier_normal || 1.5;
    if (ot_rate_type === 'night_200') {
      multiplier = rules.ot_multiplier_night || 2.0;
    } else if (ot_rate_type === 'weekend_200') {
      multiplier = rules.ot_multiplier_weekend || 2.0;
    } else if (ot_rate_type === 'holiday_200') {
      multiplier = rules.ot_multiplier_holiday || 2.0;
    }

    const estimatedPay = Math.round(hourlyRate * multiplier * hours * 100) / 100;
    const id = `ot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO overtime_requests (
        id, employee_id, date, start_time, end_time, hours, ot_rate_type, multiplier,
        hourly_rate, estimated_pay, reason, project_name, status,
        line_manager_id, line_manager_reviewed_at, line_manager_comments,
        admin_reviewer_id, admin_reviewed_at, admin_comments, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        NULL, NULL, NULL,
        NULL, NULL, NULL, ?
      )
    `);

    insertStmt.run(
      id,
      employee_id,
      date,
      start_time,
      end_time,
      hours,
      ot_rate_type,
      multiplier,
      hourlyRate,
      estimatedPay,
      reason,
      project_name || '',
      reqStatus,
      createdAt
    );

    // If approved directly, sync to attendance
    if (reqStatus === 'Approved') {
      const attId = `att-${employee_id}-${date}`;
      db.prepare(`
        INSERT INTO attendance (id, employee_id, date, status, work_hours, overtime_hours, source)
        VALUES (?, ?, ?, 'Present', 8.0, ?, 'overtime_approved')
        ON CONFLICT(employee_id, date) DO UPDATE SET
          overtime_hours = COALESCE(attendance.overtime_hours, 0) + excluded.overtime_hours
      `).run(attId, employee_id, date, hours);
    }

    // Audit log
    logAudit({
      user_name,
      action: 'CREATE_OVERTIME_REQUEST',
      module: 'Overtime',
      record_id: id,
      new_value: JSON.stringify({
        employee_id,
        date,
        hours,
        ot_rate_type,
        estimatedPay,
        status: reqStatus,
      }),
    });

    const created = db.prepare(`
      SELECT 
        o.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.khmer_name, '') as khmer_name,
        COALESCE(e.gender, '') as gender,
        COALESCE(e.group_name, 'General') as group_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE o.id = ?
    `).get(id) as OvertimeRequest;

    return NextResponse.json({ success: true, request: created });
  } catch (error: any) {
    console.error('Error creating overtime request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
