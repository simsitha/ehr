import { getDb } from './db';
import {
  AttendanceBonusRule,
  AttendanceBonusPolicyConfig,
  AttendanceBonusCalculation,
  AttendanceBonusSummary,
  AttendanceBonusAuditLog,
  AttendanceBonusStatus,
  DailyAttendanceDetail,
  PayrollPeriod,
  isBoardMember,
} from './types';
import {
  DEFAULT_BONUS_RULES,
  DEFAULT_ATTENDANCE_BONUS_POLICY,
  calculateAttendanceBonus,
  computeQualifyingAttendanceDays,
  generateBonusExplanation,
  roundToDecimals,
} from './attendanceBonusEngine';
import { calculateMonthlyAttendance } from './attendanceEngine';

/**
 * Initializes the attendance bonus module tables in PostgreSQL.
 */
export function initAttendanceBonusTables(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_bonus_rules (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      minimum_attendance_days REAL NOT NULL,
      maximum_attendance_days REAL,
      bonus_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      effective_from TEXT,
      effective_to TEXT,
      is_active INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_bonus_calculations (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      payroll_period_id TEXT NOT NULL,
      period_name TEXT NOT NULL,
      attendance_days REAL NOT NULL,
      scheduled_days REAL NOT NULL,
      present_days REAL NOT NULL,
      half_days REAL NOT NULL DEFAULT 0,
      approved_leave_days REAL NOT NULL DEFAULT 0,
      unpaid_leave_days REAL NOT NULL DEFAULT 0,
      absent_days REAL NOT NULL DEFAULT 0,
      late_count INTEGER DEFAULT 0,
      early_departure_count INTEGER DEFAULT 0,
      applied_rule_id TEXT,
      tier_name TEXT,
      bonus_amount REAL NOT NULL DEFAULT 0,
      bonus_amount_khr REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      calculation_status TEXT NOT NULL DEFAULT 'Pending',
      calculated_at TEXT NOT NULL,
      calculated_by TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      approved_by TEXT,
      approved_at TEXT,
      rejection_reason TEXT,
      posted_to_payroll_at TEXT,
      posted_by TEXT,
      notes TEXT,
      details_json TEXT,
      UNIQUE(employee_id, payroll_period_id)
    );
    CREATE INDEX IF NOT EXISTS idx_att_bonus_period ON attendance_bonus_calculations(payroll_period_id);
    CREATE INDEX IF NOT EXISTS idx_att_bonus_emp ON attendance_bonus_calculations(employee_id);
    CREATE INDEX IF NOT EXISTS idx_att_bonus_status ON attendance_bonus_calculations(calculation_status);

    CREATE TABLE IF NOT EXISTS attendance_bonus_audit_logs (
      id TEXT PRIMARY KEY,
      calculation_id TEXT,
      employee_id TEXT,
      payroll_period_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      previous_attendance_days REAL,
      new_attendance_days REAL,
      previous_bonus_amount REAL,
      new_bonus_amount REAL,
      previous_status TEXT,
      new_status TEXT,
      reason TEXT,
      metadata_json TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_att_bonus_audit_period ON attendance_bonus_audit_logs(payroll_period_id);
    CREATE INDEX IF NOT EXISTS idx_att_bonus_audit_emp ON attendance_bonus_audit_logs(employee_id);
    CREATE INDEX IF NOT EXISTS idx_att_bonus_audit_time ON attendance_bonus_audit_logs(timestamp DESC);
  `);

  // Seed default rules if table is empty
  try {
    const countRow = db.prepare('SELECT count(*) as count FROM attendance_bonus_rules').get() as { count: number };
    if (!countRow || Number(countRow.count) === 0) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      for (const rule of DEFAULT_BONUS_RULES) {
        db.prepare(`
          INSERT INTO attendance_bonus_rules (
            id, rule_name, minimum_attendance_days, maximum_attendance_days,
            bonus_amount, currency, is_active, priority, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          rule.id,
          rule.rule_name,
          rule.minimum_attendance_days,
          rule.maximum_attendance_days,
          rule.bonus_amount,
          rule.currency,
          rule.is_active,
          rule.priority || 1,
          'System Initializer',
          now,
          now
        );
      }
    }
  } catch (err) {
    console.error('Error seeding attendance_bonus_rules:', err);
  }
}

/**
 * Gets attendance bonus policy configuration from system_meta.
 */
export function getAttendanceBonusPolicyConfig(): AttendanceBonusPolicyConfig {
  const db = getDb();
  try {
    const row = db.prepare("SELECT value FROM system_meta WHERE key = 'attendance_bonus_config'").get() as { value: string } | undefined;
    if (row && row.value) {
      return { ...DEFAULT_ATTENDANCE_BONUS_POLICY, ...JSON.parse(row.value) };
    }
  } catch (err) {
    console.error('Error reading attendance_bonus_config:', err);
  }
  return DEFAULT_ATTENDANCE_BONUS_POLICY;
}

/**
 * Saves attendance bonus policy configuration in system_meta.
 */
export function saveAttendanceBonusPolicyConfig(
  config: Partial<AttendanceBonusPolicyConfig>,
  performedBy: string = 'HR Admin'
): AttendanceBonusPolicyConfig {
  const db = getDb();
  const current = getAttendanceBonusPolicyConfig();
  const updated: AttendanceBonusPolicyConfig = { ...current, ...config };

  db.prepare(`
    INSERT INTO system_meta (key, value)
    VALUES ('attendance_bonus_config', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(updated));

  logAttendanceBonusAudit({
    payroll_period_id: 'SYSTEM',
    action: 'RULE_CHANGE',
    performed_by: performedBy,
    reason: 'Updated attendance bonus policy configuration',
    metadata_json: JSON.stringify(updated),
  });

  return updated;
}

/**
 * Retrieves all configured attendance bonus rules.
 */
export function getAttendanceBonusRules(includeInactive: boolean = false): AttendanceBonusRule[] {
  const db = getDb();
  initAttendanceBonusTables();

  let query = 'SELECT * FROM attendance_bonus_rules';
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY priority ASC, minimum_attendance_days DESC';

  const rows = db.prepare(query).all() as any[];
  return rows.map((r) => ({
    ...r,
    minimum_attendance_days: Number(r.minimum_attendance_days),
    maximum_attendance_days: r.maximum_attendance_days !== null ? Number(r.maximum_attendance_days) : null,
    bonus_amount: Number(r.bonus_amount),
    is_active: Number(r.is_active),
    priority: Number(r.priority || 1),
  }));
}

/**
 * Retrieves a single attendance bonus rule by ID.
 */
export function getAttendanceBonusRuleById(id: string): AttendanceBonusRule | null {
  const db = getDb();
  initAttendanceBonusTables();
  const row = db.prepare('SELECT * FROM attendance_bonus_rules WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    minimum_attendance_days: Number(row.minimum_attendance_days),
    maximum_attendance_days: row.maximum_attendance_days !== null ? Number(row.maximum_attendance_days) : null,
    bonus_amount: Number(row.bonus_amount),
    is_active: Number(row.is_active),
    priority: Number(row.priority || 1),
  };
}

/**
 * Creates or updates an attendance bonus rule.
 */
export function saveAttendanceBonusRule(
  rule: Partial<AttendanceBonusRule> & { rule_name: string; minimum_attendance_days: number; bonus_amount: number },
  performedBy: string = 'HR Admin'
): AttendanceBonusRule {
  const db = getDb();
  initAttendanceBonusTables();

  const id = rule.id || `rule-${Date.now()}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const existing = getAttendanceBonusRuleById(id);

  const min = roundToDecimals(Number(rule.minimum_attendance_days), 2);
  const max = rule.maximum_attendance_days !== null && rule.maximum_attendance_days !== undefined
    ? roundToDecimals(Number(rule.maximum_attendance_days), 2)
    : null;
  const amount = roundToDecimals(Number(rule.bonus_amount), 2);
  const currency = rule.currency || 'USD';
  const isActive = rule.is_active !== undefined ? (rule.is_active ? 1 : 0) : 1;
  const priority = rule.priority ?? (existing?.priority || 1);

  if (existing) {
    db.prepare(`
      UPDATE attendance_bonus_rules
      SET rule_name = ?,
          minimum_attendance_days = ?,
          maximum_attendance_days = ?,
          bonus_amount = ?,
          currency = ?,
          effective_from = ?,
          effective_to = ?,
          is_active = ?,
          priority = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      rule.rule_name,
      min,
      max,
      amount,
      currency,
      rule.effective_from || null,
      rule.effective_to || null,
      isActive,
      priority,
      now,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO attendance_bonus_rules (
        id, rule_name, minimum_attendance_days, maximum_attendance_days,
        bonus_amount, currency, effective_from, effective_to,
        is_active, priority, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      rule.rule_name,
      min,
      max,
      amount,
      currency,
      rule.effective_from || null,
      rule.effective_to || null,
      isActive,
      priority,
      performedBy,
      now,
      now
    );
  }

  logAttendanceBonusAudit({
    payroll_period_id: 'SYSTEM',
    action: 'RULE_CHANGE',
    performed_by: performedBy,
    reason: `${existing ? 'Updated' : 'Created'} rule: ${rule.rule_name} (Min: ${min}, Max: ${max}, Bonus: $${amount})`,
    metadata_json: JSON.stringify({ id, ...rule }),
  });

  return getAttendanceBonusRuleById(id)!;
}

/**
 * Deletes an attendance bonus rule.
 */
export function deleteAttendanceBonusRule(id: string, performedBy: string = 'HR Admin'): boolean {
  const db = getDb();
  initAttendanceBonusTables();

  const existing = getAttendanceBonusRuleById(id);
  if (!existing) return false;

  db.prepare('DELETE FROM attendance_bonus_rules WHERE id = ?').run(id);

  logAttendanceBonusAudit({
    payroll_period_id: 'SYSTEM',
    action: 'RULE_CHANGE',
    performed_by: performedBy,
    reason: `Deleted bonus rule: ${existing.rule_name} (${id})`,
    metadata_json: JSON.stringify(existing),
  });

  return true;
}

/**
 * Logs an entry in the attendance bonus audit log.
 */
export function logAttendanceBonusAudit(entry: {
  calculation_id?: string | null;
  employee_id?: string | null;
  payroll_period_id: string;
  action: AttendanceBonusAuditLog['action'];
  performed_by: string;
  previous_attendance_days?: number | null;
  new_attendance_days?: number | null;
  previous_bonus_amount?: number | null;
  new_bonus_amount?: number | null;
  previous_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
  metadata_json?: string | null;
}): void {
  const db = getDb();
  initAttendanceBonusTables();

  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO attendance_bonus_audit_logs (
        id, calculation_id, employee_id, payroll_period_id, action,
        performed_by, previous_attendance_days, new_attendance_days,
        previous_bonus_amount, new_bonus_amount, previous_status,
        new_status, reason, metadata_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.calculation_id || null,
      entry.employee_id || null,
      entry.payroll_period_id,
      entry.action,
      entry.performed_by,
      entry.previous_attendance_days ?? null,
      entry.new_attendance_days ?? null,
      entry.previous_bonus_amount ?? null,
      entry.new_bonus_amount ?? null,
      entry.previous_status || null,
      entry.new_status || null,
      entry.reason || null,
      entry.metadata_json || null,
      now
    );
  } catch (err) {
    console.error('Failed to write attendance bonus audit log:', err);
  }
}

/**
 * Retrieves audit logs for attendance bonuses.
 */
export function getAttendanceBonusAuditLogs(
  payrollPeriodId?: string,
  employeeId?: string,
  limit: number = 100
): AttendanceBonusAuditLog[] {
  const db = getDb();
  initAttendanceBonusTables();

  let query = 'SELECT * FROM attendance_bonus_audit_logs WHERE 1=1';
  const params: any[] = [];

  if (payrollPeriodId && payrollPeriodId !== 'all') {
    query += ' AND payroll_period_id = ?';
    params.push(payrollPeriodId);
  }
  if (employeeId) {
    query += ' AND employee_id = ?';
    params.push(employeeId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params) as AttendanceBonusAuditLog[];
}

/**
 * Calculates attendance bonus for all eligible employees for a specified payroll period.
 */
export function calculatePeriodAttendanceBonuses(
  periodId: string,
  performedBy: string = 'HR Administrator',
  options?: { forceRecalculate?: boolean }
): {
  summary: AttendanceBonusSummary;
  calculations: AttendanceBonusCalculation[];
} {
  const db = getDb();
  initAttendanceBonusTables();

  // 1. Resolve payroll period details
  const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ? OR name = ?').get(periodId, periodId) as PayrollPeriod | undefined;
  if (!period) {
    throw new Error(`Payroll period '${periodId}' not found.`);
  }

  // Check if period is already Paid / Locked and not forcing recalculation
  if (period.status === 'Paid' && !options?.forceRecalculate) {
    throw new Error(
      `Payroll period '${period.name}' has already been finalized and locked. Authorized reopening workflow required to modify.`
    );
  }

  // Parse Year and Month from period
  let year = 2026;
  let month = 10;
  if (period.start_date) {
    const parts = period.start_date.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  // 2. Fetch active rules & policy
  const activeRules = getAttendanceBonusRules(false);
  const policy = getAttendanceBonusPolicyConfig();
  const exchangeRate = policy.gdt_exchange_rate || 4044;

  // 3. Retrieve monthly attendance report from authoritative attendanceEngine
  const attReport = calculateMonthlyAttendance(year, month);

  // 4. Fetch daily clock details from attendance table for rich breakdown
  const rawAttendance = db.prepare(`
    SELECT id, employee_id, date, clock_in, clock_out, work_hours, overtime_hours, status, code, notes
    FROM attendance
    WHERE date >= ? AND date <= ?
  `).all(startDate, endDate) as Array<{
    id: string;
    employee_id: string;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    work_hours: number | null;
    overtime_hours: number | null;
    status: string;
    code: string | null;
    notes: string | null;
  }>;

  const rawAttMap = new Map<string, typeof rawAttendance[0]>();
  for (const r of rawAttendance) {
    rawAttMap.set(`${r.employee_id}_${r.date}`, r);
  }

  // 5. Fetch attendance corrections for this month
  const corrections = db.prepare(`
    SELECT * FROM attendance_corrections
    WHERE date >= ? AND date <= ?
  `).all(startDate, endDate) as Array<{
    id: string;
    employee_id: string;
    date: string;
    field_changed: string;
    old_value: string;
    new_value: string;
    reason: string;
    changed_by: string;
    changed_at: string;
  }>;
  const correctionsMap = new Map<string, typeof corrections>();
  for (const c of corrections) {
    if (!correctionsMap.has(c.employee_id)) {
      correctionsMap.set(c.employee_id, []);
    }
    correctionsMap.get(c.employee_id)!.push(c);
  }

  // 6. Fetch existing calculations to preserve reviewed/approved status if not forcing
  const existingCalcs = db.prepare(
    'SELECT * FROM attendance_bonus_calculations WHERE payroll_period_id = ?'
  ).all(period.id) as AttendanceBonusCalculation[];
  const existingMap = new Map<string, AttendanceBonusCalculation>(
    existingCalcs.map((c) => [c.employee_id, c])
  );

  const nowIso = new Date().toISOString();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const results: AttendanceBonusCalculation[] = [];
  const actionType = existingCalcs.length > 0 ? 'RECALCULATE' : 'CALCULATE';

  db.transaction(() => {
    for (const empAtt of attReport.employees) {
      const empId = empAtt.employee_id;
      const existing = existingMap.get(empId);

      // Do not overwrite already Posted calculations without explicit reopening
      if (existing && existing.calculation_status === 'Posted' && !options?.forceRecalculate) {
        results.push(existing);
        continue;
      }

      // Compute qualifying attendance days according to policy
      const { qualifyingDays, approvedLeaveDaysCounted, leaveBreakdown } = computeQualifyingAttendanceDays({
        presentDays: empAtt.present_days,
        halfDays: empAtt.half_days,
        annualLeaveDays: empAtt.annual_leave_days,
        sickLeaveDays: empAtt.sick_leave_days,
        publicHolidayDays: empAtt.holiday_days,
        maternityLeaveDays: empAtt.maternity_leave_days,
        specialLeaveDays: empAtt.other_leave_days,
        policy,
      });

      // Match bonus tiers
      const bonusEvaluation = calculateAttendanceBonus(qualifyingDays, activeRules);
      const bonusUsd = bonusEvaluation.bonusAmount;
      const bonusKhr = Math.round(bonusUsd * exchangeRate);

      // Build daily calendar breakdown for employee detail modal
      const dailyDetails: DailyAttendanceDetail[] = [];
      let lateCount = 0;
      let earlyDepartureCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeekIndex = new Date(year, month - 1, d).getDay();
        const dayOfWeek = dayNames[dayOfWeekIndex];
        const isRestDay = dayOfWeekIndex === 0; // Sunday is rest day
        const codeKey = String(d).padStart(2, '0');
        const code = empAtt.days[codeKey] || (isRestDay ? 'OFF' : '1');

        const raw = rawAttMap.get(`${empId}_${dStr}`);
        const clockIn = raw?.clock_in || (code === '1' ? '07:30:00' : null);
        const clockOut = raw?.clock_out || (code === '1' ? '16:30:00' : null);
        const workHours = raw?.work_hours ?? (code === '1' ? 8 : code === '0.5' ? 4 : 0);
        const otHours = raw?.overtime_hours ?? 0;

        // Check late: standard factory shift starts at 07:30
        let lateMins = 0;
        if (clockIn && clockIn > '07:35:00' && code !== 'OFF' && code !== 'AB') {
          const [h, m] = clockIn.split(':').map((v) => parseInt(v, 10));
          lateMins = Math.max(0, h * 60 + m - (7 * 60 + 30));
          if (lateMins > 0) lateCount++;
        }

        // Check early departure: standard shift ends at 16:30
        let earlyMins = 0;
        if (clockOut && clockOut < '16:25:00' && code !== 'OFF' && code !== 'AB') {
          const [h, m] = clockOut.split(':').map((v) => parseInt(v, 10));
          earlyMins = Math.max(0, 16 * 60 + 30 - (h * 60 + m));
          if (earlyMins > 0) earlyDepartureCount++;
        }

        const isHalfDay = code === '0.5' || (code === 'AL' && workHours === 4);
        let qualifies = false;
        let contribution = 0;

        if (code === '1') {
          qualifies = true;
          contribution = 1.0;
        } else if (isHalfDay) {
          qualifies = true;
          contribution = policy.half_day_attendance_weight ?? 0.5;
        } else if (code === 'AL' && policy.count_annual_leave) {
          qualifies = true;
          contribution = 1.0;
        } else if (code === 'SL' && policy.count_sick_leave) {
          qualifies = true;
          contribution = 1.0;
        } else if (code === 'HL' && policy.count_public_holidays) {
          qualifies = true;
          contribution = 1.0;
        }

        dailyDetails.push({
          date: dStr,
          day_of_month: d,
          day_of_week: dayOfWeek,
          is_rest_day: isRestDay,
          is_scheduled: !isRestDay,
          code,
          status: code === '1' ? 'Present' : code === '0.5' ? 'Half-Day' : code === 'AB' ? 'Absent' : code,
          clock_in: clockIn,
          clock_out: clockOut,
          work_hours: workHours,
          overtime_hours: otHours,
          is_half_day: isHalfDay,
          qualifies_for_bonus: qualifies,
          attendance_contribution: contribution,
          late_minutes: lateMins,
          early_departure_minutes: earlyMins,
          notes: raw?.notes || null,
        });
      }

      // Generate calculation explanation
      const explanations = generateBonusExplanation({
        employeeName: empAtt.employee_name,
        attendanceDays: qualifyingDays,
        scheduledDays: empAtt.scheduled_working_days,
        bonusAmount: bonusUsd,
        tierName: bonusEvaluation.tierName,
        absentDays: empAtt.absent_days,
        halfDays: empAtt.half_days,
        approvedLeaveDays: approvedLeaveDaysCounted,
        exchangeRate,
      });

      const empCorrections = correctionsMap.get(empId) || [];

      const detailsJson = JSON.stringify({
        dailyDetails,
        leaveBreakdown,
        appliedPolicy: policy,
        tierEvaluation: bonusEvaluation,
        explanations,
        corrections: empCorrections,
      });

      const calcId = `att-bonus-${period.id}-${empId}`;
      const status: AttendanceBonusStatus =
        existing && existing.calculation_status !== 'Posted'
          ? existing.calculation_status
          : 'Pending';

      // Insert or replace calculation record
      db.prepare(`
        INSERT INTO attendance_bonus_calculations (
          id, employee_id, payroll_period_id, period_name,
          attendance_days, scheduled_days, present_days, half_days,
          approved_leave_days, unpaid_leave_days, absent_days,
          late_count, early_departure_count, applied_rule_id, tier_name,
          bonus_amount, bonus_amount_khr, currency, calculation_status,
          calculated_at, calculated_by, details_json
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
        ON CONFLICT(employee_id, payroll_period_id) DO UPDATE SET
          attendance_days = excluded.attendance_days,
          scheduled_days = excluded.scheduled_days,
          present_days = excluded.present_days,
          half_days = excluded.half_days,
          approved_leave_days = excluded.approved_leave_days,
          unpaid_leave_days = excluded.unpaid_leave_days,
          absent_days = excluded.absent_days,
          late_count = excluded.late_count,
          early_departure_count = excluded.early_departure_count,
          applied_rule_id = excluded.applied_rule_id,
          tier_name = excluded.tier_name,
          bonus_amount = excluded.bonus_amount,
          bonus_amount_khr = excluded.bonus_amount_khr,
          currency = excluded.currency,
          calculation_status = CASE WHEN attendance_bonus_calculations.calculation_status = 'Posted' THEN 'Posted' ELSE excluded.calculation_status END,
          calculated_at = excluded.calculated_at,
          calculated_by = excluded.calculated_by,
          details_json = excluded.details_json
      `).run(
        calcId,
        empId,
        period.id,
        period.name,
        qualifyingDays,
        empAtt.scheduled_working_days,
        empAtt.present_days,
        empAtt.half_days,
        approvedLeaveDaysCounted,
        empAtt.unpaid_days,
        empAtt.absent_days,
        lateCount,
        earlyDepartureCount,
        bonusEvaluation.ruleId,
        bonusEvaluation.tierName,
        bonusUsd,
        bonusKhr,
        'USD',
        status,
        nowIso,
        performedBy,
        detailsJson
      );

      results.push({
        id: calcId,
        employee_id: empId,
        employee_name: empAtt.employee_name,
        khmer_name: empAtt.khmer_name,
        department_id: empAtt.department_id,
        department_name: empAtt.department_name,
        group_name: empAtt.group_name,
        payroll_period_id: period.id,
        period_name: period.name,
        attendance_days: qualifyingDays,
        scheduled_days: empAtt.scheduled_working_days,
        present_days: empAtt.present_days,
        half_days: empAtt.half_days,
        approved_leave_days: approvedLeaveDaysCounted,
        unpaid_leave_days: empAtt.unpaid_days,
        absent_days: empAtt.absent_days,
        late_count: lateCount,
        early_departure_count: earlyDepartureCount,
        applied_rule_id: bonusEvaluation.ruleId,
        tier_name: bonusEvaluation.tierName,
        bonus_amount: bonusUsd,
        bonus_amount_khr: bonusKhr,
        currency: 'USD',
        calculation_status: status,
        calculated_at: nowIso,
        calculated_by: performedBy,
        details_json: detailsJson,
      });
    }

    // Audit log
    logAttendanceBonusAudit({
      payroll_period_id: period.id,
      action: actionType,
      performed_by: performedBy,
      reason: `${actionType === 'RECALCULATE' ? 'Recalculated' : 'Calculated'} attendance bonuses for ${results.length} employees in ${period.name}`,
      metadata_json: JSON.stringify({
        total_employees: results.length,
        eligible_count: results.filter((r) => r.bonus_amount > 0).length,
        total_bonus_usd: results.reduce((acc, r) => acc + r.bonus_amount, 0),
      }),
    });
  })();

  const summary = getAttendanceBonusSummary(period.id);
  return { summary, calculations: results };
}

/**
 * Retrieves calculated attendance bonuses for a period with filters and joins employee details.
 */
export function getAttendanceBonusCalculations(
  periodId: string,
  filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
    tier?: string;
  }
): AttendanceBonusCalculation[] {
  const db = getDb();
  initAttendanceBonusTables();

  let query = `
    SELECT 
      c.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name,
      e.department_id,
      d.name as department_name,
      e.role as position,
      e.group_name,
      e.avatar,
      e.join_date
    FROM attendance_bonus_calculations c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE c.payroll_period_id = ?
  `;
  const params: any[] = [periodId];

  if (filters?.departmentId && filters.departmentId !== 'all') {
    query += ' AND e.department_id = ?';
    params.push(filters.departmentId);
  }

  if (filters?.status && filters.status !== 'all') {
    query += ' AND c.calculation_status = ?';
    params.push(filters.status);
  }

  if (filters?.tier && filters.tier !== 'all') {
    query += ' AND c.tier_name = ?';
    params.push(filters.tier);
  }

  if (filters?.search && filters.search.trim()) {
    const s = `%${filters.search.trim()}%`;
    query += ` AND (
      c.employee_id ILIKE ? OR
      e.first_name ILIKE ? OR
      e.last_name ILIKE ? OR
      e.khmer_name ILIKE ?
    )`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY c.bonus_amount DESC, c.attendance_days DESC, c.employee_id ASC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    ...r,
    attendance_days: Number(r.attendance_days),
    scheduled_days: Number(r.scheduled_days),
    present_days: Number(r.present_days),
    half_days: Number(r.half_days),
    approved_leave_days: Number(r.approved_leave_days),
    unpaid_leave_days: Number(r.unpaid_leave_days),
    absent_days: Number(r.absent_days),
    late_count: Number(r.late_count || 0),
    early_departure_count: Number(r.early_departure_count || 0),
    bonus_amount: Number(r.bonus_amount),
    bonus_amount_khr: Number(r.bonus_amount_khr),
  }));
}

/**
 * Retrieves a single attendance bonus calculation by ID (with full employee & details data).
 */
export function getAttendanceBonusCalculationById(id: string): AttendanceBonusCalculation | null {
  const db = getDb();
  initAttendanceBonusTables();

  const query = `
    SELECT 
      c.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name,
      e.department_id,
      d.name as department_name,
      e.role as position,
      e.group_name,
      e.avatar,
      e.join_date
    FROM attendance_bonus_calculations c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE c.id = ? OR (c.employee_id = ? AND c.payroll_period_id = ?)
  `;
  const row = db.prepare(query).get(id, id, id) as any;
  if (!row) return null;

  return {
    ...row,
    attendance_days: Number(row.attendance_days),
    scheduled_days: Number(row.scheduled_days),
    present_days: Number(row.present_days),
    half_days: Number(row.half_days),
    approved_leave_days: Number(row.approved_leave_days),
    unpaid_leave_days: Number(row.unpaid_leave_days),
    absent_days: Number(row.absent_days),
    late_count: Number(row.late_count || 0),
    early_departure_count: Number(row.early_departure_count || 0),
    bonus_amount: Number(row.bonus_amount),
    bonus_amount_khr: Number(row.bonus_amount_khr),
  };
}

/**
 * Generates summary statistics for a payroll period's attendance bonus.
 */
export function getAttendanceBonusSummary(periodId: string): AttendanceBonusSummary {
  const db = getDb();
  initAttendanceBonusTables();

  const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ? OR name = ?').get(periodId, periodId) as PayrollPeriod | undefined;
  const pId = period?.id || periodId;
  const pName = period?.name || periodId;
  const pStatus = period?.status || 'Processing';

  const rows = db.prepare(`
    SELECT calculation_status, tier_name, bonus_amount, bonus_amount_khr
    FROM attendance_bonus_calculations
    WHERE payroll_period_id = ?
  `).all(pId) as Array<{
    calculation_status: AttendanceBonusStatus;
    tier_name: string | null;
    bonus_amount: number;
    bonus_amount_khr: number;
  }>;

  const total = rows.length;
  let eligible = 0;
  let totalBonusUsd = 0;
  let totalBonusKhr = 0;
  let pendingCount = 0;
  let reviewedCount = 0;
  let approvedCount = 0;
  let postedCount = 0;
  let approvedBonusUsd = 0;
  let approvedBonusKhr = 0;
  const tierDistribution: Record<string, number> = {};

  for (const r of rows) {
    const amt = Number(r.bonus_amount);
    const khr = Number(r.bonus_amount_khr);

    if (amt > 0) eligible++;
    totalBonusUsd += amt;
    totalBonusKhr += khr;

    if (r.calculation_status === 'Pending') pendingCount++;
    else if (r.calculation_status === 'Reviewed') reviewedCount++;
    else if (r.calculation_status === 'Approved') {
      approvedCount++;
      approvedBonusUsd += amt;
      approvedBonusKhr += khr;
    } else if (r.calculation_status === 'Posted') {
      postedCount++;
      approvedBonusUsd += amt;
      approvedBonusKhr += khr;
    }

    const t = r.tier_name || 'Ineligible (< 23 days)';
    tierDistribution[t] = (tierDistribution[t] || 0) + 1;
  }

  return {
    payroll_period_id: pId,
    period_name: pName,
    period_status: pStatus,
    total_employees: total,
    eligible_employees: eligible,
    ineligible_employees: total - eligible,
    total_bonus_usd: roundToDecimals(totalBonusUsd, 2),
    total_bonus_khr: Math.round(totalBonusKhr),
    pending_hr_review: pendingCount,
    reviewed_count: reviewedCount,
    approved_count: approvedCount,
    posted_count: postedCount,
    approved_bonus_amount_usd: roundToDecimals(approvedBonusUsd, 2),
    approved_bonus_amount_khr: Math.round(approvedBonusKhr),
    tier_distribution: tierDistribution,
  };
}

/**
 * Submits calculations for HR review (moves 'Pending' -> 'Reviewed').
 */
export function submitAttendanceBonusForReview(
  periodId: string,
  performedBy: string = 'HR Officer',
  notes?: string
): { success: boolean; count: number } {
  const db = getDb();
  initAttendanceBonusTables();

  const nowIso = new Date().toISOString();
  let count = 0;

  db.transaction(() => {
    const res = db.prepare(`
      UPDATE attendance_bonus_calculations
      SET calculation_status = 'Reviewed',
          reviewed_by = ?,
          reviewed_at = ?,
          notes = COALESCE(?, notes)
      WHERE payroll_period_id = ? AND calculation_status = 'Pending'
    `).run(performedBy, nowIso, notes || null, periodId);

    count = res.changes;

    logAttendanceBonusAudit({
      payroll_period_id: periodId,
      action: 'SUBMIT_REVIEW',
      performed_by: performedBy,
      previous_status: 'Pending',
      new_status: 'Reviewed',
      reason: notes || `Submitted ${count} attendance bonus calculation(s) for manager review`,
      metadata_json: JSON.stringify({ count }),
    });
  })();

  return { success: true, count };
}

/**
 * Approves attendance bonus calculations (moves 'Reviewed' or 'Pending' -> 'Approved').
 */
export function approveAttendanceBonus(
  periodId: string,
  performedBy: string = 'HR Manager',
  calculationIds?: string[],
  notes?: string
): { success: boolean; count: number } {
  const db = getDb();
  initAttendanceBonusTables();

  const nowIso = new Date().toISOString();
  let count = 0;

  db.transaction(() => {
    let query = `
      UPDATE attendance_bonus_calculations
      SET calculation_status = 'Approved',
          approved_by = ?,
          approved_at = ?,
          rejection_reason = NULL,
          notes = COALESCE(?, notes)
      WHERE payroll_period_id = ? AND calculation_status IN ('Pending', 'Reviewed', 'Rejected')
    `;
    const params: any[] = [performedBy, nowIso, notes || null, periodId];

    if (calculationIds && calculationIds.length > 0) {
      const placeholders = calculationIds.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...calculationIds);
    }

    const res = db.prepare(query).run(...params);
    count = res.changes;

    logAttendanceBonusAudit({
      payroll_period_id: periodId,
      action: 'APPROVE',
      performed_by: performedBy,
      previous_status: 'Reviewed',
      new_status: 'Approved',
      reason: notes || `Approved ${count} attendance bonus calculation(s)`,
      metadata_json: JSON.stringify({ count, calculationIds: calculationIds || 'ALL' }),
    });
  })();

  return { success: true, count };
}

/**
 * Rejects attendance bonus calculations with a mandatory reason.
 */
export function rejectAttendanceBonus(
  periodId: string,
  performedBy: string = 'HR Manager',
  reason: string,
  calculationIds?: string[]
): { success: boolean; count: number } {
  const db = getDb();
  initAttendanceBonusTables();

  if (!reason || !reason.trim()) {
    throw new Error('A rejection reason is required.');
  }

  const nowIso = new Date().toISOString();
  let count = 0;

  db.transaction(() => {
    let query = `
      UPDATE attendance_bonus_calculations
      SET calculation_status = 'Rejected',
          approved_by = NULL,
          approved_at = NULL,
          rejection_reason = ?,
          notes = ?
      WHERE payroll_period_id = ? AND calculation_status IN ('Pending', 'Reviewed', 'Approved')
    `;
    const params: any[] = [reason.trim(), `Rejected: ${reason.trim()}`, periodId];

    if (calculationIds && calculationIds.length > 0) {
      const placeholders = calculationIds.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...calculationIds);
    }

    const res = db.prepare(query).run(...params);
    count = res.changes;

    logAttendanceBonusAudit({
      payroll_period_id: periodId,
      action: 'REJECT',
      performed_by: performedBy,
      new_status: 'Rejected',
      reason: reason.trim(),
      metadata_json: JSON.stringify({ count, calculationIds: calculationIds || 'ALL' }),
    });
  })();

  return { success: true, count };
}

/**
 * Transfers approved attendance bonus amounts into employee payroll records (`payrolls.attendance_allowance`).
 * Uses an atomic transaction and locks calculation records as 'Posted'.
 */
export function postAttendanceBonusToPayroll(
  periodId: string,
  performedBy: string = 'Payroll Officer',
  calculationIds?: string[]
): { success: boolean; count: number; totalAmountUsd: number } {
  const db = getDb();
  initAttendanceBonusTables();

  // 1. Verify period is valid and not already permanently finalized
  const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ? OR name = ?').get(periodId, periodId) as PayrollPeriod | undefined;
  if (!period) {
    throw new Error(`Payroll period '${periodId}' not found.`);
  }

  // 2. Fetch approved calculations to post
  let selectQuery = `
    SELECT c.*, e.salary, e.join_date
    FROM attendance_bonus_calculations c
    JOIN employees e ON e.id = c.employee_id
    WHERE c.payroll_period_id = ? AND c.calculation_status = 'Approved'
  `;
  const selectParams: any[] = [period.id];

  if (calculationIds && calculationIds.length > 0) {
    const placeholders = calculationIds.map(() => '?').join(',');
    selectQuery += ` AND c.id IN (${placeholders})`;
    selectParams.push(...calculationIds);
  }

  const approvedCalcs = db.prepare(selectQuery).all(...selectParams) as Array<AttendanceBonusCalculation & { salary: number; join_date: string }>;

  if (approvedCalcs.length === 0) {
    throw new Error('No approved attendance bonus calculations found ready to post.');
  }

  const nowIso = new Date().toISOString();
  let postedCount = 0;
  let totalPostedUsd = 0;

  db.transaction(() => {
    for (const calc of approvedCalcs) {
      const bonusAmt = Number(calc.bonus_amount || 0);

      // Check if employee has a payroll record for this period
      const existingPay = db.prepare(`
        SELECT id, allowances, bonuses, gross_salary, net_salary, attendance_allowance
        FROM payrolls
        WHERE employee_id = ? AND (period_id = ? OR pay_period = ?)
      `).get(calc.employee_id, period.id, period.name) as any;

      if (existingPay) {
        // Update existing payroll record: adjust attendance_allowance and recalculate totals
        const oldAtt = Number(existingPay.attendance_allowance || 0);
        const diff = bonusAmt - oldAtt;
        const newBonuses = Math.max(0, roundToDecimals(Number(existingPay.bonuses || 0) + diff, 2));
        const newGross = Math.max(0, roundToDecimals(Number(existingPay.gross_salary || 0) + diff, 2));
        const newNet = Math.max(0, roundToDecimals(Number(existingPay.net_salary || 0) + diff, 2));

        db.prepare(`
          UPDATE payrolls
          SET attendance_allowance = ?,
              bonuses = ?,
              gross_salary = ?,
              net_salary = ?
          WHERE id = ?
        `).run(bonusAmt, newBonuses, newGross, newNet, existingPay.id);
      } else {
        // Create new payroll record entry for this employee and period
        const payId = `PAY-${period.id}-${calc.employee_id}`;
        const baseSalary = Number(calc.salary || 210.0);
        const grossSalary = roundToDecimals(baseSalary + bonusAmt, 2);

        db.prepare(`
          INSERT INTO payrolls (
            id, employee_id, pay_period, period_id, payment_date,
            base_salary, allowances, bonuses, attendance_allowance,
            gross_salary, net_salary, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', ?)
          ON CONFLICT(id) DO UPDATE SET
            attendance_allowance = excluded.attendance_allowance,
            bonuses = excluded.bonuses,
            gross_salary = excluded.gross_salary,
            net_salary = excluded.net_salary
        `).run(
          payId,
          calc.employee_id,
          period.name,
          period.id,
          period.end_date || nowIso.split('T')[0],
          baseSalary,
          0,
          bonusAmt,
          bonusAmt,
          grossSalary,
          grossSalary,
          nowIso
        );
      }

      // Mark calculation record as Posted
      db.prepare(`
        UPDATE attendance_bonus_calculations
        SET calculation_status = 'Posted',
            posted_to_payroll_at = ?,
            posted_by = ?,
            notes = COALESCE(notes, '') || ' [Transferred to payroll on ' || ? || ']'
        WHERE id = ?
      `).run(nowIso, performedBy, nowIso.substring(0, 10), calc.id);

      postedCount++;
      totalPostedUsd += bonusAmt;
    }

    logAttendanceBonusAudit({
      payroll_period_id: period.id,
      action: 'POST_TO_PAYROLL',
      performed_by: performedBy,
      previous_status: 'Approved',
      new_status: 'Posted',
      reason: `Transferred ${postedCount} approved attendance bonus(es) into payroll ledger ($${roundToDecimals(totalPostedUsd, 2)} USD total)`,
      metadata_json: JSON.stringify({
        posted_count: postedCount,
        total_amount_usd: roundToDecimals(totalPostedUsd, 2),
      }),
    });
  })();

  return {
    success: true,
    count: postedCount,
    totalAmountUsd: roundToDecimals(totalPostedUsd, 2),
  };
}
