import { getDb, logAudit, getPayrollRules } from './db';
import {
  PositionPayment,
  PositionPaymentSummary,
  PositionPaymentType,
  PositionPaymentStatus,
  PositionPaymentCurrency,
  PayrollPeriod,
} from './types';
import { computeEmployeePayroll } from './payrollEngine';

/**
 * Ensures position_payments table and necessary indexes exist in PostgreSQL.
 */
export function initPositionPaymentTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS position_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      payment_name TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'Allowance',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      payroll_period TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      end_date TEXT,
      taxable BOOLEAN DEFAULT TRUE,
      include_in_nssf BOOLEAN DEFAULT TRUE,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT DEFAULT 'Administrator',
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_position_payments_emp_period ON position_payments(employee_id, payroll_period);
    CREATE INDEX IF NOT EXISTS idx_position_payments_period_status ON position_payments(payroll_period, status);
    CREATE INDEX IF NOT EXISTS idx_position_payments_created ON position_payments(created_at DESC);
  `);
}

/**
 * Checks if a payroll period is locked or finalized.
 */
export function isPayrollPeriodLocked(payrollPeriod: string): {
  isLocked: boolean;
  periodName: string;
  reason?: string;
} {
  const db = getDb();
  const period = db
    .prepare('SELECT * FROM payroll_periods WHERE name = ? OR id = ?')
    .get(payrollPeriod, payrollPeriod) as any;

  if (period) {
    const status = String(period.status || '').toLowerCase();
    if (status === 'locked' || status === 'paid' || status === 'finalized') {
      return {
        isLocked: true,
        periodName: period.name || payrollPeriod,
        reason: `Payroll period "${period.name || payrollPeriod}" is locked (${period.status}). Changes to position payments are not permitted unless the period is reopened.`,
      };
    }
  }
  return { isLocked: false, periodName: payrollPeriod };
}

export interface PositionPaymentFilters {
  employee_id?: string;
  payroll_period?: string;
  department_id?: string;
  payment_type?: string;
  status?: string;
  search?: string;
}

/**
 * Retrieves list of position payments with employee and department metadata.
 */
export function getPositionPayments(filters?: PositionPaymentFilters): PositionPayment[] {
  initPositionPaymentTable();
  const db = getDb();

  let sql = `
    SELECT 
      p.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.role as current_position,
      e.department_id as department_id,
      d.name as department_name
    FROM position_payments p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.payroll_period && filters.payroll_period !== 'all') {
    sql += ` AND p.payroll_period = ?`;
    params.push(filters.payroll_period);
  }

  if (filters?.employee_id && filters.employee_id !== 'all') {
    sql += ` AND p.employee_id = ?`;
    params.push(filters.employee_id);
  }

  if (filters?.department_id && filters.department_id !== 'all') {
    sql += ` AND e.department_id = ?`;
    params.push(filters.department_id);
  }

  if (filters?.payment_type && filters.payment_type !== 'all') {
    sql += ` AND p.payment_type = ?`;
    params.push(filters.payment_type);
  }

  if (filters?.status && filters.status !== 'all') {
    sql += ` AND p.status = ?`;
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const q = `%${filters.search.trim().toLowerCase()}%`;
    sql += ` AND (
      LOWER(p.employee_id) LIKE ? OR 
      LOWER(e.first_name || ' ' || e.last_name) LIKE ? OR 
      LOWER(COALESCE(e.khmer_name, '')) LIKE ? OR 
      LOWER(p.payment_name) LIKE ? OR
      LOWER(COALESCE(d.name, '')) LIKE ? OR
      LOWER(COALESCE(e.role, '')) LIKE ?
    )`;
    params.push(q, q, q, q, q, q);
  }

  sql += ` ORDER BY p.created_at DESC, p.id DESC`;

  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    employee_name: r.employee_name,
    khmer_name: r.khmer_name,
    current_position: r.current_position,
    department_id: r.department_id,
    department_name: r.department_name,
    payment_name: r.payment_name,
    payment_type: r.payment_type as PositionPaymentType,
    amount: Number(r.amount) || 0,
    currency: (r.currency || 'USD') as PositionPaymentCurrency,
    payroll_period: r.payroll_period,
    effective_date: r.effective_date,
    end_date: r.end_date || null,
    taxable: r.taxable === true || r.taxable === 1 || r.taxable === 'true',
    include_in_nssf: r.include_in_nssf === true || r.include_in_nssf === 1 || r.include_in_nssf === 'true',
    remarks: r.remarks || null,
    status: r.status as PositionPaymentStatus,
    created_by: r.created_by,
    updated_by: r.updated_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Retrieves a single position payment by ID.
 */
export function getPositionPaymentById(id: string): PositionPayment | null {
  initPositionPaymentTable();
  const db = getDb();

  const sql = `
    SELECT 
      p.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.role as current_position,
      e.department_id as department_id,
      d.name as department_name
    FROM position_payments p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE p.id = ?
  `;

  const r = db.prepare(sql).get(id) as any;
  if (!r) return null;

  return {
    id: r.id,
    employee_id: r.employee_id,
    employee_name: r.employee_name,
    khmer_name: r.khmer_name,
    current_position: r.current_position,
    department_id: r.department_id,
    department_name: r.department_name,
    payment_name: r.payment_name,
    payment_type: r.payment_type as PositionPaymentType,
    amount: Number(r.amount) || 0,
    currency: (r.currency || 'USD') as PositionPaymentCurrency,
    payroll_period: r.payroll_period,
    effective_date: r.effective_date,
    end_date: r.end_date || null,
    taxable: r.taxable === true || r.taxable === 1 || r.taxable === 'true',
    include_in_nssf: r.include_in_nssf === true || r.include_in_nssf === 1 || r.include_in_nssf === 'true',
    remarks: r.remarks || null,
    status: r.status as PositionPaymentStatus,
    created_by: r.created_by,
    updated_by: r.updated_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Calculates summary metrics for Position Payments.
 * Keeps USD and KHR amounts separate!
 */
export function getPositionPaymentSummary(payrollPeriod?: string): PositionPaymentSummary {
  initPositionPaymentTable();
  const db = getDb();

  let sql = `SELECT * FROM position_payments WHERE status = 'Active'`;
  const params: any[] = [];

  if (payrollPeriod && payrollPeriod !== 'all') {
    sql += ` AND payroll_period = ?`;
    params.push(payrollPeriod);
  }

  const rows = db.prepare(sql).all(...params) as any[];

  let totalUsdAmount = 0;
  let totalKhrAmount = 0;
  const employeeIds = new Set<string>();

  for (const row of rows) {
    const amt = Number(row.amount) || 0;
    const curr = (row.currency || 'USD').toUpperCase();
    if (curr === 'KHR') {
      totalKhrAmount += amt;
    } else {
      totalUsdAmount += amt;
    }
    if (row.employee_id) {
      employeeIds.add(row.employee_id);
    }
  }

  return {
    totalPayments: rows.length,
    totalUsdAmount: Math.round(totalUsdAmount * 100) / 100,
    totalKhrAmount: Math.round(totalKhrAmount),
    distinctEmployeesCount: employeeIds.size,
  };
}

export interface CreatePositionPaymentInput {
  employee_id: string;
  payment_name: string;
  payment_type?: PositionPaymentType;
  amount: number;
  currency: PositionPaymentCurrency;
  payroll_period: string;
  effective_date: string;
  end_date?: string | null;
  taxable?: boolean;
  include_in_nssf?: boolean;
  remarks?: string | null;
  status?: PositionPaymentStatus;
  created_by?: string;
}

/**
 * Creates a new position payment record.
 * Automatically synchronizes with the Factory Payroll Ledger.
 */
export function createPositionPayment(input: CreatePositionPaymentInput): PositionPayment {
  initPositionPaymentTable();
  const db = getDb();

  // 1. Validation
  if (!input.employee_id || !input.employee_id.trim()) {
    throw new Error('Employee is required.');
  }
  if (!input.payment_name || !input.payment_name.trim()) {
    throw new Error('Payment Name is required.');
  }
  const numAmount = Number(input.amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Payment Amount must be a valid number greater than or equal to 0.');
  }
  const currency = (input.currency || 'USD').toUpperCase() as PositionPaymentCurrency;
  if (currency !== 'USD' && currency !== 'KHR') {
    throw new Error('Currency must be USD or KHR.');
  }
  if (!input.payroll_period || !input.payroll_period.trim()) {
    throw new Error('Payroll Period is required.');
  }
  if (!input.effective_date || !input.effective_date.trim()) {
    throw new Error('Effective Date is required.');
  }

  // Validate dates
  const effDt = new Date(input.effective_date);
  if (isNaN(effDt.getTime())) {
    throw new Error('Invalid Effective Date format.');
  }
  if (input.end_date && input.end_date.trim()) {
    const endDt = new Date(input.end_date);
    if (isNaN(endDt.getTime())) {
      throw new Error('Invalid End Date format.');
    }
    if (endDt < effDt) {
      throw new Error('End Date cannot be earlier than Effective Date.');
    }
  }

  // Check employee existence
  const emp = db.prepare('SELECT id, first_name, last_name FROM employees WHERE id = ?').get(input.employee_id) as any;
  if (!emp) {
    throw new Error(`Employee with ID "${input.employee_id}" does not exist.`);
  }

  // 2. Check payroll locking rules
  const lockCheck = isPayrollPeriodLocked(input.payroll_period);
  if (lockCheck.isLocked) {
    throw new Error(lockCheck.reason);
  }

  // 3. Prevent duplicate active payment for same employee, payment name, and payroll period
  const status = (input.status || 'Active') as PositionPaymentStatus;
  if (status === 'Active') {
    const duplicate = db
      .prepare(`
        SELECT id FROM position_payments 
        WHERE employee_id = ? 
          AND LOWER(TRIM(payment_name)) = LOWER(TRIM(?)) 
          AND payroll_period = ? 
          AND status = 'Active'
      `)
      .get(input.employee_id, input.payment_name.trim(), input.payroll_period) as any;

    if (duplicate) {
      throw new Error(
        `An active position payment with the name "${input.payment_name.trim()}" already exists for ${emp.first_name} ${emp.last_name} in ${input.payroll_period}.`
      );
    }
  }

  const id = `POS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();
  const createdBy = input.created_by || 'Administrator';

  db.prepare(`
    INSERT INTO position_payments (
      id, employee_id, payment_name, payment_type, amount, currency,
      payroll_period, effective_date, end_date, taxable, include_in_nssf,
      remarks, status, created_by, updated_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    id,
    input.employee_id,
    input.payment_name.trim(),
    input.payment_type || 'Allowance',
    numAmount,
    currency,
    input.payroll_period,
    input.effective_date,
    input.end_date || null,
    input.taxable ?? true,
    input.include_in_nssf ?? true,
    input.remarks ? input.remarks.trim() : null,
    status,
    createdBy,
    createdBy,
    now,
    now
  );

  // Log audit
  logAudit({
    user_name: createdBy,
    action: 'CREATE_POSITION_PAYMENT',
    module: 'Payroll',
    record_id: id,
    old_value: null,
    new_value: JSON.stringify({
      employee_id: input.employee_id,
      payment_name: input.payment_name.trim(),
      amount: numAmount,
      currency,
      payroll_period: input.payroll_period,
      status,
    }),
  });

  // Automatically sync to Factory Payroll Ledger
  syncEmployeePayrollForPositionPayment(input.employee_id, input.payroll_period);

  return getPositionPaymentById(id)!;
}

export interface UpdatePositionPaymentInput {
  payment_name?: string;
  payment_type?: PositionPaymentType;
  amount?: number;
  currency?: PositionPaymentCurrency;
  payroll_period?: string;
  effective_date?: string;
  end_date?: string | null;
  taxable?: boolean;
  include_in_nssf?: boolean;
  remarks?: string | null;
  status?: PositionPaymentStatus;
  updated_by?: string;
}

/**
 * Updates an existing position payment.
 * Automatically synchronizes with the Factory Payroll Ledger.
 */
export function updatePositionPayment(id: string, input: UpdatePositionPaymentInput): PositionPayment {
  initPositionPaymentTable();
  const db = getDb();

  const existing = getPositionPaymentById(id);
  if (!existing) {
    throw new Error(`Position payment with ID "${id}" was not found.`);
  }

  // Check locking for existing period
  const lockCheck1 = isPayrollPeriodLocked(existing.payroll_period);
  if (lockCheck1.isLocked) {
    throw new Error(lockCheck1.reason);
  }

  // If changing to another period, check locking for the new period as well
  if (input.payroll_period && input.payroll_period !== existing.payroll_period) {
    const lockCheck2 = isPayrollPeriodLocked(input.payroll_period);
    if (lockCheck2.isLocked) {
      throw new Error(lockCheck2.reason);
    }
  }

  const newPaymentName = input.payment_name !== undefined ? input.payment_name.trim() : existing.payment_name;
  if (!newPaymentName) {
    throw new Error('Payment Name cannot be empty.');
  }

  const newAmount = input.amount !== undefined ? Number(input.amount) : existing.amount;
  if (isNaN(newAmount) || newAmount < 0) {
    throw new Error('Payment Amount must be a valid number greater than or equal to 0.');
  }

  const newCurrency = (input.currency || existing.currency).toUpperCase() as PositionPaymentCurrency;
  const newPeriod = input.payroll_period || existing.payroll_period;
  const newStatus = input.status || existing.status;
  const newEffectiveDate = input.effective_date || existing.effective_date;
  const newEndDate = input.end_date !== undefined ? input.end_date : existing.end_date;

  // Validate dates
  const effDt = new Date(newEffectiveDate);
  if (isNaN(effDt.getTime())) {
    throw new Error('Invalid Effective Date format.');
  }
  if (newEndDate && newEndDate.trim()) {
    const endDt = new Date(newEndDate);
    if (isNaN(endDt.getTime()) || endDt < effDt) {
      throw new Error('End Date cannot be earlier than Effective Date.');
    }
  }

  // Check duplicate active payment
  if (newStatus === 'Active') {
    const duplicate = db
      .prepare(`
        SELECT id FROM position_payments 
        WHERE employee_id = ? 
          AND LOWER(TRIM(payment_name)) = LOWER(TRIM(?)) 
          AND payroll_period = ? 
          AND status = 'Active'
          AND id != ?
      `)
      .get(existing.employee_id, newPaymentName, newPeriod, id) as any;

    if (duplicate) {
      throw new Error(
        `An active position payment with the name "${newPaymentName}" already exists for this employee in ${newPeriod}.`
      );
    }
  }

  const now = new Date().toISOString();
  const updatedBy = input.updated_by || 'Administrator';

  db.prepare(`
    UPDATE position_payments SET
      payment_name = ?,
      payment_type = ?,
      amount = ?,
      currency = ?,
      payroll_period = ?,
      effective_date = ?,
      end_date = ?,
      taxable = ?,
      include_in_nssf = ?,
      remarks = ?,
      status = ?,
      updated_by = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    newPaymentName,
    input.payment_type || existing.payment_type,
    newAmount,
    newCurrency,
    newPeriod,
    newEffectiveDate,
    newEndDate || null,
    input.taxable !== undefined ? input.taxable : existing.taxable,
    input.include_in_nssf !== undefined ? input.include_in_nssf : existing.include_in_nssf,
    input.remarks !== undefined ? (input.remarks ? input.remarks.trim() : null) : existing.remarks,
    newStatus,
    updatedBy,
    now,
    id
  );

  // Log audit
  logAudit({
    user_name: updatedBy,
    action: 'UPDATE_POSITION_PAYMENT',
    module: 'Payroll',
    record_id: id,
    old_value: JSON.stringify({
      payment_name: existing.payment_name,
      amount: existing.amount,
      currency: existing.currency,
      payroll_period: existing.payroll_period,
      status: existing.status,
    }),
    new_value: JSON.stringify({
      payment_name: newPaymentName,
      amount: newAmount,
      currency: newCurrency,
      payroll_period: newPeriod,
      status: newStatus,
    }),
  });

  // Automatically sync to Factory Payroll Ledger
  syncEmployeePayrollForPositionPayment(existing.employee_id, existing.payroll_period);
  if (newPeriod !== existing.payroll_period) {
    syncEmployeePayrollForPositionPayment(existing.employee_id, newPeriod);
  }

  return getPositionPaymentById(id)!;
}

/**
 * Toggles status (Active / Inactive) of a position payment.
 */
export function togglePositionPaymentStatus(
  id: string,
  targetStatus?: PositionPaymentStatus,
  userName?: string
): PositionPayment {
  const existing = getPositionPaymentById(id);
  if (!existing) {
    throw new Error(`Position payment with ID "${id}" was not found.`);
  }

  const nextStatus: PositionPaymentStatus =
    targetStatus || (existing.status === 'Active' ? 'Inactive' : 'Active');

  return updatePositionPayment(id, {
    status: nextStatus,
    updated_by: userName || 'Administrator',
  });
}

/**
 * Deletes a position payment record, subject to payroll locking rules.
 * Automatically synchronizes with the Factory Payroll Ledger.
 */
export function deletePositionPayment(id: string, userName?: string): boolean {
  initPositionPaymentTable();
  const db = getDb();

  const existing = getPositionPaymentById(id);
  if (!existing) {
    throw new Error(`Position payment with ID "${id}" was not found.`);
  }

  // Check period lock
  const lockCheck = isPayrollPeriodLocked(existing.payroll_period);
  if (lockCheck.isLocked) {
    throw new Error(lockCheck.reason);
  }

  db.prepare('DELETE FROM position_payments WHERE id = ?').run(id);

  // Log audit
  logAudit({
    user_name: userName || 'Administrator',
    action: 'DELETE_POSITION_PAYMENT',
    module: 'Payroll',
    record_id: id,
    old_value: JSON.stringify({
      employee_id: existing.employee_id,
      payment_name: existing.payment_name,
      amount: existing.amount,
      currency: existing.currency,
      payroll_period: existing.payroll_period,
    }),
    new_value: null,
  });

  // Re-sync employee payroll
  syncEmployeePayrollForPositionPayment(existing.employee_id, existing.payroll_period);

  return true;
}

/**
 * Recalculates and synchronizes an employee's payroll ledger record
 * for the selected payroll period whenever position payments change.
 */
export function syncEmployeePayrollForPositionPayment(employeeId: string, payrollPeriod: string): void {
  const db = getDb();

  // Find existing payroll record for this employee and period
  const payrollRow = db
    .prepare('SELECT * FROM payrolls WHERE employee_id = ? AND pay_period = ?')
    .get(employeeId, payrollPeriod) as any;

  if (!payrollRow) {
    // If the payroll ledger has not been generated for this period yet,
    // the saved position payment will automatically be loaded when "Calculate Period" is run.
    return;
  }

  // If period is locked, do not modify
  const lockCheck = isPayrollPeriodLocked(payrollPeriod);
  if (lockCheck.isLocked) {
    return;
  }

  // Retrieve all active position payments for this employee & period
  const activePayments = db
    .prepare(`
      SELECT amount, currency, taxable, include_in_nssf
      FROM position_payments
      WHERE employee_id = ? AND payroll_period = ? AND status = 'Active'
    `)
    .all(employeeId, payrollPeriod) as any[];

  const rules = getPayrollRules();
  const gdtRate = rules.gdt_rate_khr || 4044;

  let totalPositionUsd = 0;
  for (const pay of activePayments) {
    let amt = Number(pay.amount) || 0;
    if (pay.currency === 'KHR') {
      amt = Math.round((amt / gdtRate) * 100) / 100;
    }
    totalPositionUsd += amt;
  }
  totalPositionUsd = Math.round(totalPositionUsd * 100) / 100;

  // Retrieve employee record
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as any;
  if (!emp) return;

  // Compute authoritatively
  const periodId = payrollRow.period_id || 'period-2026-10';
  const result = computeEmployeePayroll(emp, periodId, payrollPeriod, {
    rulesConfig: rules,
    absentDays: payrollRow.absent_days || 0,
    unpaidDays: payrollRow.unpaid_days || 0,
    actualWorkingDays: payrollRow.working_days || 26,
    overtimeHours: (payrollRow.overtime_pay || 0) > 0 ? (payrollRow.overtime_pay / 1.5) : 0,
    monthlyEvalBonus: Number(payrollRow.monthly_eval_bonus || emp.monthly_eval_bonus || 0),
    severancePay: Number(payrollRow.severance_pay || emp.severance_pay || 0),
    attendanceBonusOverride: Number(payrollRow.attendance_allowance || 0),
    positionAllowanceOverride: totalPositionUsd,
  });

  const p = result.payroll;

  // Update the existing payroll row in the database
  db.prepare(`
    UPDATE payrolls SET
      position_allowance = ?,
      allowances = ?,
      gross_salary = ?,
      non_taxable_amount = ?,
      taxable_salary_usd = ?,
      taxable_salary_khr = ?,
      pension_usd = ?,
      pension_khr = ?,
      dependents_count = ?,
      taxable_base_khr = ?,
      tax_rate = ?,
      tax_khr = ?,
      tax_usd = ?,
      tax_deduction = ?,
      insurance_deduction = ?,
      after_tax_salary = ?,
      net_salary = ?,
      total_paid = ?,
      second_paid = ?
    WHERE id = ?
  `).run(
    totalPositionUsd,
    p.allowances,
    p.gross_salary,
    p.non_taxable_amount,
    p.taxable_salary_usd,
    p.taxable_salary_khr,
    p.pension_usd,
    p.pension_khr,
    p.dependents_count,
    p.taxable_base_khr,
    p.tax_rate,
    p.tax_khr,
    p.tax_usd,
    p.tax_deduction,
    p.insurance_deduction,
    p.after_tax_salary,
    p.net_salary,
    p.total_paid,
    p.second_paid,
    payrollRow.id
  );
}
