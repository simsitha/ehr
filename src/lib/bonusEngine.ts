import { getDb } from './db';
import { PayrollRulesConfig, isBoardMember } from './types';

export {
  calculateSeniorityBonus,
  calculateSeniorityAllowanceFromDate,
  evaluateSeniorityBonusFromJoinDate,
  DEFAULT_SENIORITY_TIERS,
} from './payrollRules';

/**
 * Evaluates Non-Absent Bonus eligibility and amount
 */
export function evaluateNonAbsentBonus(
  absentDays: number,
  unpaidDays: number,
  rulesConfig: PayrollRulesConfig
): { isEligible: boolean; amount: number } {
  const isEligible = absentDays === 0 && unpaidDays === 0;
  return {
    isEligible,
    amount: isEligible ? rulesConfig.non_absent_bonus_amount : 0,
  };
}

export { computeSewingWeeklyBonus } from './payrollRules';


/**
 * Sums approved sewing production weekly bonuses for an employee in a given month (e.g. '2026-10')
 */
export function getMonthlySewingBonusTotal(employeeId: string, monthPrefix: string): number {
  const db = getDb();
  const row = db.prepare(`
    SELECT SUM(bonus_amount) as total
    FROM sewing_production_weekly
    WHERE employee_id = ?
      AND (month = ? OR week_start LIKE ?)
      AND status = 'Approved'
  `).get(employeeId, monthPrefix, `${monthPrefix}%`) as { total: number | string | null } | undefined;

  return row?.total != null ? Number(row.total) : 0;
}

export interface AutoEvalResultItem {
  employee_id: string;
  employee_name: string;
  khmer_name: string | null;
  role: string | null;
  department_id: string;
  department_name: string | null;
  group_name: string | null;
  base_salary: number;
  current_bonus: number;
  suggested_bonus: number;
  grade: 'Tier A+' | 'Tier A' | 'Tier B' | 'Tier C' | 'Unassigned / $0';
  attendance_rate: number;
  present_days: number;
  absent_days: number;
  reason: string;
}

export interface AutoEvaluationSummary {
  month: string;
  total_evaluated: number;
  current_total_payout: number;
  suggested_total_payout: number;
  tier_summary: Record<string, number>;
  items: AutoEvalResultItem[];
}

/**
 * Evaluates factory staff performance, attendance rate, leadership responsibility,
 * and sewing production targets to generate suggested Monthly Evaluation Bonus tiers.
 */
export function evaluateMonthlyEvaluationBonus(
  month = '2026-10',
  options?: { department?: string; line?: string }
): AutoEvaluationSummary {
  const db = getDb();

  let query = `
    SELECT 
      e.id, 
      e.first_name || ' ' || e.last_name as employee_name, 
      e.khmer_name, 
      e.role,
      e.department_id, 
      d.name as department_name, 
      e.group_name,
      e.salary as base_salary, 
      COALESCE(e.monthly_eval_bonus, 0) as current_bonus,
      e.join_date,
      e.employee_type,
      e.employment_type
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE e.status != 'Terminated'
      AND (
        (e.group_name IS NOT NULL AND TRIM(e.group_name) != '')
        OR (e.group_id IS NOT NULL AND TRIM(e.group_id) != '')
      )
  `;
  const params: any[] = [];

  if (options?.department && options.department !== 'all') {
    query += ` AND e.department_id = ?`;
    params.push(options.department);
  }

  if (options?.line && options.line !== 'all') {
    query += ` AND (e.group_name = ? OR e.group_id = ?)`;
    params.push(options.line, options.line);
  }

  query += ` ORDER BY e.group_name ASC, e.id ASC`;

  const rawEmployees = db.prepare(query).all(...params) as Array<{
    id: string;
    employee_name: string;
    khmer_name: string | null;
    role: string | null;
    department_id: string;
    department_name: string | null;
    group_name: string | null;
    base_salary: number;
    current_bonus: number;
    join_date: string | null;
    employee_type: string | null;
    employment_type: string | null;
  }>;

  const employees = rawEmployees.filter((e) => !isBoardMember(e));

  // Aggregate monthly attendance stats
  const attRows = db.prepare(`
    SELECT 
      employee_id,
      COUNT(CASE WHEN status = 'Present' OR code = '1' THEN 1 END) as present_count,
      COUNT(CASE WHEN status = 'Absent' OR code = 'AB' THEN 1 END) as absent_count,
      COUNT(CASE WHEN code = '0.5' OR status = 'Half Day' THEN 1 END) as half_count,
      COUNT(CASE WHEN code = 'OFF' OR status = 'Rest Day' THEN 1 END) as rest_count,
      COUNT(*) as total_count
    FROM attendance 
    WHERE date LIKE ? 
    GROUP BY employee_id
  `).all(`${month}%`) as Array<{
    employee_id: string;
    present_count: number;
    absent_count: number;
    half_count: number;
    rest_count: number;
    total_count: number;
  }>;

  const attMap = new Map<string, { present: number; absent: number; half: number; rest: number; total: number }>();
  for (const r of attRows) {
    attMap.set(r.employee_id, {
      present: r.present_count,
      absent: r.absent_count,
      half: r.half_count,
      rest: r.rest_count,
      total: r.total_count,
    });
  }

  // Aggregate monthly sewing output performance
  const sewRows = db.prepare(`
    SELECT 
      employee_id, 
      AVG(achievement_pct) as avg_ach, 
      SUM(bonus_amount) as total_bonus
    FROM sewing_production_weekly 
    WHERE (month = ? OR week_start LIKE ?) 
    GROUP BY employee_id
  `).all(month, `${month}%`) as Array<{
    employee_id: string;
    avg_ach: number | null;
    total_bonus: number | null;
  }>;

  const sewMap = new Map<string, { avg_ach: number; total_bonus: number }>();
  for (const r of sewRows) {
    sewMap.set(r.employee_id, {
      avg_ach: r.avg_ach || 0,
      total_bonus: r.total_bonus || 0,
    });
  }

  const productionDepts = new Set(['dept-prod', 'dept-cut', 'dept-qc', 'dept-wh', 'dept-maint', 'dept-turn']);

  const tierSummary: Record<string, number> = {
    '20': 0,
    '15': 0,
    '11': 0,
    '6': 0,
    '0': 0,
  };

  let currentTotalPayout = 0;
  let suggestedTotalPayout = 0;
  const items: AutoEvalResultItem[] = [];

  for (const emp of employees) {
    currentTotalPayout += Number(emp.current_bonus || 0);

    const att = attMap.get(emp.id) || { present: 26, absent: 0, half: 0, rest: 5, total: 31 };
    const sew = sewMap.get(emp.id) || { avg_ach: 0, total_bonus: 0 };

    const scheduled = att.total - att.rest > 0 ? att.total - att.rest : 26;
    const attRate = scheduled > 0 ? Math.round(((att.present + att.half * 0.5) / scheduled) * 1000) / 10 : 100;

    const roleLower = (emp.role || '').toLowerCase();
    const isLeader = ['chief', 'leader', 'supervisor', 'mechanic', 'repairman', 'sample', 'qc inspector', 'pattern'].some(
      (k) => roleLower.includes(k)
    );
    const isProdDept =
      productionDepts.has(emp.department_id) ||
      (emp.group_name && ['Sew', 'Cut', 'QC', 'Pak', 'Set', 'WH', 'Maint', 'T/O'].some((g) => emp.group_name!.includes(g)));

    let suggestedBonus = 0;
    let grade: 'Tier A+' | 'Tier A' | 'Tier B' | 'Tier C' | 'Unassigned / $0' = 'Unassigned / $0';
    let reason = '';

    if (!isProdDept && emp.current_bonus === 0) {
      suggestedBonus = 0;
      grade = 'Unassigned / $0';
      reason = 'ការិយាល័យរដ្ឋបាល/មិនចូលរួមផលិតកម្ម (Office / Admin Role)';
    } else if (att.absent >= 2 || attRate < 90) {
      suggestedBonus = 0;
      grade = 'Unassigned / $0';
      reason = `អវត្តមានលើសកម្រិត (${att.absent} ថ្ងៃ) / វត្តមាន ${attRate}% (Excessive Absences / Att <90%)`;
    } else if (isLeader && attRate >= 98 && att.absent === 0) {
      suggestedBonus = 20;
      grade = 'Tier A+';
      reason = 'តួនាទីដឹកនាំ/បច្ចេកទេស + វត្តមានល្អឥតខ្ចោះ ១០០% (Leadership/Chief Role + 100% Att)';
    } else if (sew.avg_ach >= 105 || sew.total_bonus >= 20) {
      suggestedBonus = 20;
      grade = 'Tier A+';
      reason = `ទិន្នផលដេរលើសគោលដៅ ${sew.avg_ach.toFixed(1)}% >105% (High Output Performance)`;
    } else if (att.absent === 0 && attRate >= 98) {
      if (emp.current_bonus >= 15 || sew.avg_ach >= 100) {
        suggestedBonus = 15;
        grade = 'Tier A';
        reason = 'វត្តមានពេញ ១០០% + បំពេញទិន្នផលស្តង់ដារ (Flawless Attendance + Met Quota)';
      } else {
        suggestedBonus = 11;
        grade = 'Tier B';
        reason = 'ការបំពេញការងារតាមស្តង់ដារ + គ្មានអវត្តមាន (Standard Performance + 0 Absences)';
      }
    } else if (attRate >= 95) {
      suggestedBonus = 11;
      grade = 'Tier B';
      reason = `វត្តមានស្តង់ដារ ${attRate}% ≥95% (Good Standard Attendance ≥95%)`;
    } else if (attRate >= 90) {
      suggestedBonus = 6;
      grade = 'Tier C';
      reason = `កម្រិតឆ្លងមូលដ្ឋាន ${attRate}% (Baseline Passing Attendance Rate 90-95%)`;
    } else {
      suggestedBonus = 0;
      grade = 'Unassigned / $0';
      reason = 'មិនគ្រប់លក្ខខណ្ឌវត្តមាន (Did not meet minimum 90% attendance)';
    }

    tierSummary[String(suggestedBonus)] = (tierSummary[String(suggestedBonus)] || 0) + 1;
    suggestedTotalPayout += suggestedBonus;

    items.push({
      employee_id: emp.id,
      employee_name: emp.employee_name,
      khmer_name: emp.khmer_name,
      role: emp.role,
      department_id: emp.department_id,
      department_name: emp.department_name,
      group_name: emp.group_name,
      base_salary: Number(emp.base_salary || 0),
      current_bonus: Number(emp.current_bonus || 0),
      suggested_bonus: suggestedBonus,
      grade,
      attendance_rate: attRate,
      present_days: att.present,
      absent_days: att.absent,
      reason,
    });
  }

  return {
    month,
    total_evaluated: employees.length,
    current_total_payout: currentTotalPayout,
    suggested_total_payout: suggestedTotalPayout,
    tier_summary: tierSummary,
    items,
  };
}
