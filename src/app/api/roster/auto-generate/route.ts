import { NextResponse } from 'next/server';
import { getDb, getShiftSettings } from '@/lib/db';
import { SHIFTS } from '@/lib/roster-shifts';
import { isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { week_start, department_id, template } = body;

    if (!week_start) {
      return NextResponse.json({ error: 'week_start is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const selectedTemplate = template || 'standard_5day';

    // Fetch target employees (excluding Board of Directors members who do not have duty shifts)
    let empSql = "SELECT id, department_id, first_name, last_name, role, employee_type, employment_type FROM employees WHERE status != 'Terminated'";
    const params: any[] = [];
    if (department_id && department_id !== 'all') {
      empSql += ' AND department_id = ?';
      params.push(department_id);
    }
    empSql += ' ORDER BY department_id ASC, first_name ASC';

    const rawEmployees = db.prepare(empSql).all(...params) as any[];
    const employees = rawEmployees.filter((e) => !isBoardMember(e));
    if (employees.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No employees matched the criteria' });
    }

    const [y, m, d] = week_start.split('-').map(Number);
    const startMon = new Date(y, m - 1, d);

    const upsertStmt = db.prepare(`
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

    let generatedCount = 0;
    const createdAt = new Date().toISOString();
    const shiftSettings = getShiftSettings();

    const runBatch = db.transaction(() => {
      employees.forEach((emp, empIdx) => {
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const current = new Date(startMon);
          current.setDate(startMon.getDate() + dayIdx);
          const cYear = current.getFullYear();
          const cMonth = String(current.getMonth() + 1).padStart(2, '0');
          const cDay = String(current.getDate()).padStart(2, '0');
          const dateStr = `${cYear}-${cMonth}-${cDay}`;
          const isWeekend = dayIdx >= 5; // 5 = Sat, 6 = Sun

          let shiftType = 'office';
          let notes = '';

          if (selectedTemplate === 'standard_5day') {
            if (isWeekend) {
              shiftType = 'off';
              notes = dayIdx === 5 ? 'Saturday Rest' : 'Sunday Rest (Art. 147)';
            } else {
              shiftType = 'office';
            }
          } else if (selectedTemplate === 'operational_6day') {
            if (dayIdx === 6) {
              shiftType = 'off';
              notes = 'Sunday Mandatory Rest (Art. 147)';
            } else {
              shiftType = 'office';
            }
          } else if (selectedTemplate === 'rotating_shifts') {
            // Balanced 24/7 rota across staff
            const pattern = (empIdx + dayIdx) % 7;
            if (pattern === 0 || pattern === 1) {
              shiftType = 'morning';
              notes = 'Morning Shift';
            } else if (pattern === 2 || pattern === 3) {
              shiftType = 'evening';
              notes = 'Evening Shift';
            } else if (pattern === 4) {
              shiftType = 'night';
              notes = 'Night Shift';
            } else if (pattern === 5) {
              shiftType = 'weekend_duty';
              notes = 'Duty Shift';
            } else {
              shiftType = 'off';
              notes = 'Weekly Rest (Art. 147)';
            }
          } else if (selectedTemplate === 'weekend_duty_only') {
            // Assign Weekend duty to selected staff on Sat/Sun with weekday compensatory day off
            if (empIdx % 3 === 0 && dayIdx === 5) {
              shiftType = 'weekend_duty';
              notes = 'Saturday Duty';
            } else if (empIdx % 3 === 1 && dayIdx === 6) {
              shiftType = 'weekend_duty';
              notes = 'Sunday Duty';
            } else if (empIdx % 3 === 0 && dayIdx === 0) {
              shiftType = 'off';
              notes = 'Compensatory Rest Day';
            } else if (empIdx % 3 === 1 && dayIdx === 1) {
              shiftType = 'off';
              notes = 'Compensatory Rest Day';
            } else if (isWeekend) {
              shiftType = 'off';
            } else {
              shiftType = 'office';
            }
          }

          const def = shiftSettings.shifts[shiftType] || SHIFTS[shiftType as keyof typeof SHIFTS];
          const startTime = def?.start_time || '';
          const endTime = def?.end_time || '';
          const hours = def?.default_hours ?? 8.0;
          const id = `rst-${emp.id}-${dateStr}`;

          upsertStmt.run(id, emp.id, dateStr, shiftType, startTime, endTime, hours, 'Head Office', notes, createdAt);
          generatedCount++;
        }
      });
    });

    runBatch();

    return NextResponse.json({
      success: true,
      count: generatedCount,
      employeeCount: employees.length,
      weekStart: week_start,
      template: selectedTemplate,
    });
  } catch (error: any) {
    console.error('Error auto-generating duty roster:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
