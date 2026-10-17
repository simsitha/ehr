import { NextResponse } from 'next/server';
import { getDb, getShiftSettings } from '@/lib/db';
import { DutyRosterEntry } from '@/lib/types';
import { SHIFTS } from '@/lib/roster-shifts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week_start');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const month = searchParams.get('month');
    const departmentId = searchParams.get('department_id');
    const employeeId = searchParams.get('employee_id');

    let sql = `
      SELECT 
        r.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM duty_roster r
      JOIN employees e ON e.id = r.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (weekStart) {
      const [y, m, d] = weekStart.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const endYear = end.getFullYear();
      const endMonth = String(end.getMonth() + 1).padStart(2, '0');
      const endDay = String(end.getDate()).padStart(2, '0');
      const weekEndStr = `${endYear}-${endMonth}-${endDay}`;

      sql += ` AND r.date >= ? AND r.date <= ?`;
      params.push(weekStart, weekEndStr);
    } else if (startDate && endDate) {
      sql += ` AND r.date >= ? AND r.date <= ?`;
      params.push(startDate, endDate);
    } else if (month) {
      sql += ` AND r.date LIKE ?`;
      params.push(`${month}%`);
    }

    if (departmentId && departmentId !== 'all') {
      sql += ` AND e.department_id = ?`;
      params.push(departmentId);
    }

    if (employeeId) {
      sql += ` AND r.employee_id = ?`;
      params.push(employeeId);
    }

    sql += ` ORDER BY d.name ASC, e.first_name ASC, r.date ASC`;

    const records = db.prepare(sql).all(...params) as DutyRosterEntry[];
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching duty roster:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { employee_id, date, shift_type, start_time, end_time, hours, location, notes } = body;

    if (!employee_id || !date || !shift_type) {
      return NextResponse.json({ error: 'employee_id, date, and shift_type are required' }, { status: 400 });
    }

    // If shift_type is 'clear', remove the record
    if (shift_type === 'clear') {
      db.prepare('DELETE FROM duty_roster WHERE employee_id = ? AND date = ?').run(employee_id, date);
      return NextResponse.json({ success: true, cleared: true });
    }

    // Default times & hours from dynamic shift settings config if not provided
    const shiftSettings = getShiftSettings();
    const shiftDef = shiftSettings.shifts[shift_type] || SHIFTS[shift_type as keyof typeof SHIFTS];
    const finalStart = start_time !== undefined ? start_time : (shiftDef?.start_time || '');
    const finalEnd = end_time !== undefined ? end_time : (shiftDef?.end_time || '');
    const finalHours = hours !== undefined ? Number(hours) : (shiftDef?.default_hours ?? 8.0);
    const finalLocation = location || 'Head Office';
    const finalNotes = notes || '';
    const id = `rst-${employee_id}-${date}`;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO duty_roster (id, employee_id, date, shift_type, start_time, end_time, hours, location, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id, date) DO UPDATE SET
        shift_type = excluded.shift_type,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        hours = excluded.hours,
        location = excluded.location,
        notes = excluded.notes
    `);

    stmt.run(id, employee_id, date, shift_type, finalStart, finalEnd, finalHours, finalLocation, finalNotes, createdAt);

    // Return the updated full record
    const updated = db.prepare(`
      SELECT 
        r.*,
        COALESCE(e.first_name || ' ' || e.last_name, 'Staff Member') as employee_name,
        COALESCE(e.role, 'Employee') as employee_role,
        COALESCE(e.avatar, '') as employee_avatar,
        COALESCE(e.department_id, '') as department_id,
        COALESCE(d.name, 'General') as department_name
      FROM duty_roster r
      JOIN employees e ON e.id = r.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE r.employee_id = ? AND r.date = ?
    `).get(employee_id, date) as DutyRosterEntry;

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error('Error updating duty roster entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const employeeId = searchParams.get('employee_id');
    const date = searchParams.get('date');
    const clearWeek = searchParams.get('clear_week');
    const departmentId = searchParams.get('department_id');

    if (id) {
      db.prepare('DELETE FROM duty_roster WHERE id = ?').run(id);
      return NextResponse.json({ success: true });
    }

    if (employeeId && date) {
      db.prepare('DELETE FROM duty_roster WHERE employee_id = ? AND date = ?').run(employeeId, date);
      return NextResponse.json({ success: true });
    }

    if (clearWeek) {
      const [y, m, d] = clearWeek.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

      if (departmentId && departmentId !== 'all') {
        db.prepare(`
          DELETE FROM duty_roster 
          WHERE date >= ? AND date <= ?
          AND employee_id IN (SELECT id FROM employees WHERE department_id = ?)
        `).run(clearWeek, endStr, departmentId);
      } else {
        db.prepare(`DELETE FROM duty_roster WHERE date >= ? AND date <= ?`).run(clearWeek, endStr);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing parameters for delete' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting roster:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
