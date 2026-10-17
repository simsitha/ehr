import { getDb } from './db';
import {
  AttendanceStatusCode,
  MonthlyEmployeeAttendance,
  MonthlyAttendanceReport,
  WeeklyAbsentAlReportData,
  WeeklyDayData,
  WeeklyEmployeeRow,
  WeeklyGroupSummaryRow,
  isBoardMember,
} from './types';

/**
 * Authoritative attendance calculation engine.
 * Computes scheduled vs actual working days, present/absent/leave breakdowns,
 * and Non-Absent Bonus eligibility as required by factory procedures.
 * Note: Members of Board of Directors are exempt from attendance requirements.
 */
export function calculateMonthlyAttendance(year: number, month: number): MonthlyAttendanceReport {
  const db = getDb();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Load configured attendance codes
  const statusCodes = (db.prepare('SELECT * FROM attendance_status_codes WHERE is_active = 1').all() as AttendanceStatusCode[]) || [];
  const codeMap = new Map<string, AttendanceStatusCode>(statusCodes.map((c) => [c.code, c]));

  // Load attendance records for the month
  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  // Load active employees
  const rawEmployees = db.prepare(`
    SELECT e.id, e.first_name, e.last_name, e.khmer_name, e.department_id, d.name as department_name,
           e.group_name, e.labor_type, e.status, e.join_date, e.role, e.employee_type, e.employment_type
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.status != 'Terminated'
      AND (e.join_date IS NULL OR e.join_date <= ?)
      AND (e.resignation_date IS NULL OR e.resignation_date >= ?)
    ORDER BY e.group_name, e.id
  `).all(endDate, startDate) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    khmer_name: string | null;
    department_id: string;
    department_name: string | null;
    group_name: string | null;
    labor_type: string | null;
    status: string;
    join_date: string;
    role: string | null;
    employee_type: string | null;
    employment_type: string | null;
  }>;

  // Board members are exempt from attendance tracking
  const employees = rawEmployees.filter((e) => !isBoardMember(e));

  const rawRecords = db.prepare(`
    SELECT employee_id, date, code, hours, overtime_hours, status
    FROM attendance
    WHERE date >= ? AND date <= ?
  `).all(startDate, endDate) as Array<{
    employee_id: string;
    date: string;
    code: string | null;
    hours: number | null;
    overtime_hours: number | null;
    status: string;
  }>;

  // Group records by employee_id -> day (1..31)
  const empRecordsMap = new Map<string, Map<number, { code: string; hours: number; ot: number }>>();
  for (const r of rawRecords) {
    if (!empRecordsMap.has(r.employee_id)) {
      empRecordsMap.set(r.employee_id, new Map());
    }
    const dayNum = parseInt(r.date.split('-')[2], 10);
    const code = r.code || (r.status === 'Present' ? '1' : r.status === 'Absent' ? 'AB' : '1');
    const hours = r.hours ?? 8;
    const ot = r.overtime_hours ?? 0;
    empRecordsMap.get(r.employee_id)!.set(dayNum, { code, hours, ot });
  }

  // Calculate scheduled days (Mon-Sat are standard working days, Sun = rest day)
  let scheduledWorkingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay(); // 0 is Sunday
    if (dayOfWeek !== 0) {
      scheduledWorkingDays++;
    }
  }

  const resultEmployees: MonthlyEmployeeAttendance[] = [];

  let grandPresent = 0;
  let grandAbsent = 0;
  let grandAl = 0;
  let grandSl = 0;
  let grandOtHours = 0;

  for (const emp of employees) {
    const empDayMap = empRecordsMap.get(emp.id) || new Map();
    const days: Record<string, string> = {};

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let alDays = 0;
    let slDays = 0;
    let mlDays = 0;
    let hlDays = 0;
    let olDays = 0;
    let totalWorkHours = 0;
    let totalPaidDays = 0;
    let unpaidDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = String(d).padStart(2, '0');
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const existing = empDayMap.get(d);

      let code = 'OFF';
      let hours = 0;

      if (existing) {
        code = existing.code;
        hours = existing.hours;
        if (existing.ot) grandOtHours += existing.ot;
      } else {
        const dStr = `${monthStr}-${dayKey}`;
        // If employee hasn't joined yet on this date, not scheduled
        if (emp.join_date && dStr < emp.join_date) {
          code = 'OFF';
          hours = 0;
        } else if (dayOfWeek === 0) {
          // Default: Sundays are OFF, Mon-Sat are scheduled
          code = 'OFF';
          hours = 0;
        } else {
          code = '1';
          hours = 8;
        }
      }

      days[dayKey] = code;

      // Evaluation based on code
      if (code === '1') {
        presentDays += 1;
        totalPaidDays += 1;
        totalWorkHours += hours > 0 ? hours : 8;
      } else if (code === '0.5') {
        halfDays += 1;
        presentDays += 0.5;
        absentDays += 0.5;
        unpaidDays += 0.5;
        totalPaidDays += 0.5;
        totalWorkHours += hours > 0 ? hours : 4;
      } else if (code === 'AB') {
        absentDays += 1;
        unpaidDays += 1;
      } else if (code === 'AL') {
        const alVal = hours === 4 ? 0.5 : 1.0;
        alDays += alVal;
        if (hours === 4) {
          presentDays += 0.5;
          totalPaidDays += 1.0;
          totalWorkHours += 8;
        } else {
          totalPaidDays += 1;
          totalWorkHours += 8;
        }
      } else if (code === 'SL') {
        slDays += 1;
        totalPaidDays += 1;
        totalWorkHours += 8;
      } else if (code === 'ML') {
        mlDays += 1;
        totalPaidDays += 1;
      } else if (code === 'HL') {
        hlDays += 1;
        totalPaidDays += 1;
      } else if (code === 'OL') {
        olDays += 1;
        unpaidDays += 1;
      } else if (code === 'OFF') {
        // Rest day
      } else {
        // Custom code check
        const info = codeMap.get(code);
        if (info) {
          if (info.is_paid) {
            totalPaidDays += info.attendance_value;
            totalWorkHours += info.attendance_value * 8;
          } else {
            unpaidDays += 1;
          }
        }
      }
    }

    const actualWorkingDays = presentDays + alDays + slDays + mlDays + hlDays;
    const isEligibleForNonAbsentBonus = absentDays === 0 && unpaidDays === 0;

    grandPresent += presentDays;
    grandAbsent += absentDays;
    grandAl += alDays;
    grandSl += slDays;

    resultEmployees.push({
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      khmer_name: emp.khmer_name || '',
      department_id: emp.department_id,
      department_name: emp.department_name || '',
      group_name: emp.group_name || '',
      labor_type: emp.labor_type || 'Indirect Labour',
      days,
      scheduled_working_days: scheduledWorkingDays,
      actual_working_days: actualWorkingDays,
      present_days: presentDays,
      half_days: halfDays,
      absent_days: absentDays,
      annual_leave_days: alDays,
      sick_leave_days: slDays,
      maternity_leave_days: mlDays,
      holiday_days: hlDays,
      other_leave_days: olDays,
      total_paid_days: totalPaidDays,
      unpaid_days: unpaidDays,
      total_work_hours: totalWorkHours,
      is_non_absent_bonus_eligible: isEligibleForNonAbsentBonus,
    });
  }

  // Aggregate groups and departments
  const groupSet = new Set<string>();
  const deptMap = new Map<string, string>();
  for (const emp of resultEmployees) {
    if (emp.group_name && emp.group_name.trim()) groupSet.add(emp.group_name.trim());
    if (emp.department_id) deptMap.set(emp.department_id, emp.department_name);
  }

  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    year,
    month,
    period_label: periodLabel,
    total_calendar_days: daysInMonth,
    scheduled_working_days: scheduledWorkingDays,
    codes: statusCodes,
    groups: Array.from(groupSet).sort(),
    departments: Array.from(deptMap.entries()).map(([id, name]) => ({ id, name })),
    employees: resultEmployees,
    summary: {
      total_staff: resultEmployees.length,
      avg_present_days:
        resultEmployees.length > 0 ? Math.round((grandPresent / resultEmployees.length) * 10) / 10 : 0,
      total_absent_days: grandAbsent,
      total_al_days: grandAl,
      total_sl_days: grandSl,
      total_ot_hours: grandOtHours,
    },
  };
}

/**
 * Authoritative Weekly Absent + AL Report calculation
 * Corresponds to 10.Absent + AL reporting weekly.xlsx
 */
export function calculateWeeklyAbsentAlReport(weekStart: string, weekEnd: string): WeeklyAbsentAlReportData {
  const db = getDb();

  // Parse start date to create 7 day series (Mon..Sun)
  const startDate = new Date(weekStart);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates: { dateStr: string; label: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = cur.toISOString().split('T')[0];
    dates.push({ dateStr, label: dayNames[i] });
  }

  // Load active employees
  const rawEmployees = db.prepare(`
    SELECT e.id, e.first_name, e.last_name, e.khmer_name, e.group_name, e.labor_type, d.name as department_name,
           e.department_id, e.role, e.employee_type, e.employment_type
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.status != 'Terminated'
      AND (e.join_date IS NULL OR e.join_date <= ?)
      AND (e.resignation_date IS NULL OR e.resignation_date >= ?)
    ORDER BY e.group_name, e.id
  `).all(weekEnd, weekStart) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    khmer_name: string | null;
    group_name: string | null;
    labor_type: string | null;
    department_name: string | null;
    department_id: string;
    role: string | null;
    employee_type: string | null;
    employment_type: string | null;
  }>;

  // Board members are exempt from attendance / absenteeism tracking
  const employees = rawEmployees.filter((e) => !isBoardMember(e));

  // Load attendance in range
  const rawRecords = db.prepare(`
    SELECT employee_id, date, code, hours
    FROM attendance
    WHERE date >= ? AND date <= ?
  `).all(weekStart, weekEnd) as Array<{
    employee_id: string;
    date: string;
    code: string | null;
    hours: number | null;
  }>;

  const recordMap = new Map<string, Map<string, { code: string; hours: number }>>();
  for (const r of rawRecords) {
    if (!recordMap.has(r.employee_id)) {
      recordMap.set(r.employee_id, new Map());
    }
    const code = r.code || '1';
    const hours = r.hours ?? 8;
    recordMap.get(r.employee_id)!.set(r.date, { code, hours });
  }

  const employeeRows: WeeklyEmployeeRow[] = [];
  const groupAccumulator = new Map<
    string,
    {
      headcount: number;
      present: number;
      absent: number;
      al: number;
      half: number;
      other: number;
      scheduled: number;
    }
  >();

  for (const emp of employees) {
    const groupName = emp.group_name && emp.group_name.trim() ? emp.group_name.trim() : 'No Line / General';
    if (!groupAccumulator.has(groupName)) {
      groupAccumulator.set(groupName, {
        headcount: 0,
        present: 0,
        absent: 0,
        al: 0,
        half: 0,
        other: 0,
        scheduled: 0,
      });
    }
    const gStats = groupAccumulator.get(groupName)!;
    gStats.headcount++;

    const days: Record<string, WeeklyDayData> = {};
    let empPresent = 0;
    let empAbsent = 0;
    let empAl = 0;
    let empHalf = 0;
    let empOther = 0;
    let empHours = 0;

    for (let i = 0; i < 7; i++) {
      const { dateStr, label } = dates[i];
      const isSun = i === 6;
      const rec = recordMap.get(emp.id)?.get(dateStr);

      let code = isSun ? 'OFF' : '1';
      let hours = isSun ? 0 : 8;

      if (rec) {
        code = rec.code;
        hours = rec.hours;
      }

      if (!isSun) {
        gStats.scheduled += 1;
      }

      if (code === '1') {
        empPresent += 1;
        empHours += hours;
        gStats.present += 1;
      } else if (code === '0.5') {
        empHalf += 1;
        empPresent += 0.5;
        empAbsent += 0.5;
        empHours += 4;
        gStats.half += 1;
        gStats.present += 0.5;
        gStats.absent += 0.5;
      } else if (code === 'AB') {
        empAbsent += 1;
        gStats.absent += 1;
      } else if (code === 'AL') {
        const alVal = hours === 4 ? 0.5 : 1.0;
        empAl += alVal;
        if (hours === 4) {
          empPresent += 0.5;
          empHours += 8;
          gStats.present += 0.5;
        } else {
          empHours += 8;
        }
        gStats.al += alVal;
      } else if (code === 'OFF') {
        // Rest day
      } else {
        empOther += 1;
        gStats.other += 1;
      }

      days[dateStr] = {
        date: dateStr,
        day_label: label,
        code,
        hours,
      };
    }

    employeeRows.push({
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      khmer_name: emp.khmer_name || '',
      department_name: emp.department_name || '',
      group_name: emp.group_name || '',
      labor_type: emp.labor_type || 'Indirect Labour',
      days,
      total_present: empPresent,
      total_absent: empAbsent,
      total_al: empAl,
      total_half: empHalf,
      total_other: empOther,
      total_hours: empHours,
    });
  }

  // Calculate group summaries
  const groupSummaries: WeeklyGroupSummaryRow[] = [];
  let grandPresent = 0;
  let grandAbsent = 0;
  let grandAl = 0;
  let grandHalf = 0;
  let grandScheduled = 0;

  for (const [groupName, stats] of groupAccumulator.entries()) {
    const rate = stats.scheduled > 0
      ? Math.round(((stats.present + stats.al) / stats.scheduled) * 1000) / 10
      : 100;

    grandPresent += stats.present;
    grandAbsent += stats.absent;
    grandAl += stats.al;
    grandHalf += stats.half;
    grandScheduled += stats.scheduled;

    groupSummaries.push({
      group_name: groupName,
      headcount: stats.headcount,
      total_present: stats.present,
      total_absent: stats.absent,
      total_al: stats.al,
      total_half: stats.half,
      total_other: stats.other,
      attendance_rate: rate,
    });
  }

  // Sort group summaries logically
  groupSummaries.sort((a, b) => a.group_name.localeCompare(b.group_name));

  const overallRate = grandScheduled > 0
    ? Math.round(((grandPresent + grandAl) / grandScheduled) * 1000) / 10
    : 100;

  // Approximate ISO week number
  const targetDate = new Date(startDate.valueOf());
  const dayNumber = (startDate.getDay() + 6) % 7;
  targetDate.setDate(targetDate.getDate() - dayNumber + 3);
  const firstThursday = targetDate.valueOf();
  targetDate.setMonth(0, 1);
  if (targetDate.getDay() !== 4) {
    targetDate.setMonth(0, 1 + ((4 - targetDate.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - targetDate.valueOf()) / 604800000);

  return {
    week_start: weekStart,
    week_end: weekEnd,
    week_number: weekNumber || 40,
    employees: employeeRows,
    group_summaries: groupSummaries,
    total_headcount: employees.length,
    grand_total_present: grandPresent,
    grand_total_absent: grandAbsent,
    grand_total_al: grandAl,
    grand_total_half: grandHalf,
    overall_attendance_rate: overallRate,
  };
}
