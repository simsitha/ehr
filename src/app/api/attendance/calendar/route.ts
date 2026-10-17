import { NextResponse } from 'next/server';
import { calculateMonthlyAttendance } from '@/lib/attendanceEngine';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

    const deptFilter = searchParams.get('department') || 'all';
    const groupFilter = searchParams.get('group') || 'all';
    const empSearch = searchParams.get('employee') || '';

    const report = calculateMonthlyAttendance(year, month);

    let filteredEmployees = report.employees;

    if (deptFilter !== 'all') {
      filteredEmployees = filteredEmployees.filter((e) => e.department_id === deptFilter);
    }

    if (groupFilter !== 'all') {
      if (groupFilter === 'none') {
        filteredEmployees = filteredEmployees.filter((e) => !e.group_name || e.group_name.trim() === '');
      } else {
        filteredEmployees = filteredEmployees.filter((e) => e.group_name === groupFilter);
      }
    }

    if (empSearch.trim()) {
      const q = empSearch.toLowerCase().trim();
      filteredEmployees = filteredEmployees.filter(
        (e) =>
          e.employee_id.toLowerCase().includes(q) ||
          e.employee_name.toLowerCase().includes(q) ||
          e.khmer_name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      ...report,
      employees: filteredEmployees,
    });
  } catch (error: any) {
    console.error('Error generating monthly attendance calendar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { employee_id, date, code, hours, notes } = body;

    if (!employee_id || !date || !code) {
      return NextResponse.json(
        { error: 'employee_id, date, and code are required' },
        { status: 400 }
      );
    }

    // Determine status from code
    let status = 'Present';
    if (code === '0.5') status = 'Half Day';
    else if (code === 'AB') status = 'Absent';
    else if (code === 'AL' || code === 'SL' || code === 'ML' || code === 'OL') status = 'On Leave';
    else if (code === 'HL') status = 'Holiday';
    else if (code === 'OFF') status = 'Rest Day';

    const workHours = hours !== undefined ? parseFloat(hours) : code === '1' ? 8.0 : code === '0.5' ? 4.0 : 0.0;
    const id = `att-${employee_id}-${date}`;

    // Get old value for audit
    const oldRow = db.prepare('SELECT code, hours FROM attendance WHERE employee_id = ? AND date = ?').get(employee_id, date) as any;

    db.prepare(`
      INSERT INTO attendance (id, employee_id, date, status, work_hours, notes, code, hours, overtime_hours, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'calendar')
      ON CONFLICT(employee_id, date) DO UPDATE SET
        status = excluded.status,
        work_hours = excluded.work_hours,
        notes = excluded.notes,
        code = excluded.code,
        hours = excluded.hours,
        source = 'calendar'
    `).run(id, employee_id, date, status, workHours, notes || null, code, workHours);

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_ATTENDANCE_CELL',
      module: 'Attendance',
      record_id: `${employee_id}:${date}`,
      old_value: oldRow ? JSON.stringify(oldRow) : null,
      new_value: JSON.stringify({ code, hours: workHours }),
    });

    return NextResponse.json({
      success: true,
      record: {
        id,
        employee_id,
        date,
        code,
        hours: workHours,
        status,
      },
    });
  } catch (error: any) {
    console.error('Error updating attendance cell:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
