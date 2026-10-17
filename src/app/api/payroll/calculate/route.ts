import { NextResponse } from 'next/server';
import { getDb, getPayrollRules, logAudit } from '@/lib/db';
import { computeEmployeePayroll, parseMonthKeyFromPeriod } from '@/lib/payrollEngine';
import { calculateMonthlyAttendance } from '@/lib/attendanceEngine';
import { isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { periodId = 'period-2026-10', payPeriodName = 'October 2026', user_name } = body;

    // Check if period is locked
    const periodRow = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(periodId) as any;
    if (periodRow && periodRow.status === 'Locked') {
      return NextResponse.json(
        { error: 'Cannot recalculate locked payroll period. Please unlock period first.' },
        { status: 403 }
      );
    }

    const rules = getPayrollRules();

    // Parse month from periodId or name (e.g., October 2026 -> 2026, 10)
    const monthKey = parseMonthKeyFromPeriod(payPeriodName, periodId);
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 10;

    // Run authoritative attendance engine for the month (already skips board members)
    const attendanceReport = calculateMonthlyAttendance(year, month);
    const attMap = new Map(attendanceReport.employees.map((e) => [e.employee_id, e]));

    // Load active employees, excluding Board of Directors members (no salary / payroll required)
    const allEmployees = db.prepare(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status != 'Terminated'
      ORDER BY e.id ASC
    `).all() as any[];
    const employees = allEmployees.filter((emp) => !isBoardMember(emp));

    // Load overtime hours in month for each employee
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const otRows = db.prepare(`
      SELECT employee_id, SUM(hours) as ot_hours
      FROM overtime_requests
      WHERE date LIKE ? AND status = 'Approved'
      GROUP BY employee_id
    `).all(`${monthPrefix}%`) as Array<{ employee_id: string; ot_hours: number }>;
    const otMap = new Map(otRows.map((r) => [r.employee_id, r.ot_hours]));

    // Load approved / posted attendance bonus calculations if available
    let attBonusMap = new Map<string, { bonus_amount: number; tier_name: string }>();
    try {
      const attBonusRows = db.prepare(`
        SELECT employee_id, bonus_amount, tier_name
        FROM attendance_bonus_calculations
        WHERE (payroll_period_id = ? OR period_name = ?)
          AND calculation_status IN ('Approved', 'Posted')
      `).all(periodId, payPeriodName) as Array<{ employee_id: string; bonus_amount: number; tier_name: string }>;
      attBonusMap = new Map(attBonusRows.map((b) => [b.employee_id, b]));
    } catch {}

    // Load active position payments for this period
    let posPaymentMap = new Map<string, number>();
    try {
      const posRows = db.prepare(`
        SELECT employee_id, amount, currency
        FROM position_payments
        WHERE (payroll_period = ? OR payroll_period = ?)
          AND status = 'Active'
      `).all(payPeriodName, periodId) as Array<{ employee_id: string; amount: number; currency: string }>;
      const gdtRate = rules.gdt_rate_khr || 4044;
      for (const r of posRows) {
        let val = Number(r.amount) || 0;
        if (r.currency === 'KHR') {
          val = Math.round((val / gdtRate) * 100) / 100;
        }
        posPaymentMap.set(r.employee_id, Math.round(((posPaymentMap.get(r.employee_id) || 0) + val) * 100) / 100);
      }
    } catch {}

    const insertOrUpdatePay = db.prepare(`
      INSERT INTO payrolls (
        id, employee_id, pay_period, payment_date, base_salary, allowances, bonuses,
        tax_deduction, insurance_deduction, other_deductions, net_salary, status,
        payment_method, created_at, working_days, absent_days, unpaid_days,
        basic_working_salary, seniority_bonus, position_allowance, sewing_skill_matrix,
        skill_allowance, transport_housing, attendance_allowance, food_allowance,
        overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus, annual_leave,
        salary_adjustment, gross_salary, non_taxable_amount, taxable_salary_usd,
        taxable_salary_khr, pension_usd, pension_khr, dependents_count, taxable_base_khr,
        tax_rate, tax_khr, tax_usd, after_tax_salary, first_paid, target_bonus,
        severance_pay, seniority_payback, paid_final_salary,
        second_paid, total_paid, labor_type, exchange_rate_khr, nssf_rate_khr,
        calculation_trace, period_id
      ) VALUES (
        @id, @employee_id, @pay_period, @payment_date, @base_salary, @allowances, @bonuses,
        @tax_deduction, @insurance_deduction, @other_deductions, @net_salary, @status,
        @payment_method, @created_at, @working_days, @absent_days, @unpaid_days,
        @basic_working_salary, @seniority_bonus, @position_allowance, @sewing_skill_matrix,
        @skill_allowance, @transport_housing, @attendance_allowance, @food_allowance,
        @overtime_pay, @overtime_food, @achievement_bonus, @monthly_eval_bonus, @annual_leave,
        @salary_adjustment, @gross_salary, @non_taxable_amount, @taxable_salary_usd,
        @taxable_salary_khr, @pension_usd, @pension_khr, @dependents_count, @taxable_base_khr,
        @tax_rate, @tax_khr, @tax_usd, @after_tax_salary, @first_paid, @target_bonus,
        @severance_pay, @seniority_payback, @paid_final_salary,
        @second_paid, @total_paid, @labor_type, @exchange_rate_khr, @nssf_rate_khr,
        @calculation_trace, @period_id
      )
      ON CONFLICT(id) DO UPDATE SET
        base_salary = excluded.base_salary,
        allowances = excluded.allowances,
        bonuses = excluded.bonuses,
        tax_deduction = excluded.tax_deduction,
        insurance_deduction = excluded.insurance_deduction,
        net_salary = excluded.net_salary,
        status = excluded.status,
        working_days = excluded.working_days,
        absent_days = excluded.absent_days,
        unpaid_days = excluded.unpaid_days,
        basic_working_salary = excluded.basic_working_salary,
        seniority_bonus = excluded.seniority_bonus,
        position_allowance = excluded.position_allowance,
        sewing_skill_matrix = excluded.sewing_skill_matrix,
        skill_allowance = excluded.skill_allowance,
        transport_housing = excluded.transport_housing,
        attendance_allowance = excluded.attendance_allowance,
        food_allowance = excluded.food_allowance,
        overtime_pay = excluded.overtime_pay,
        overtime_food = excluded.overtime_food,
        achievement_bonus = excluded.achievement_bonus,
        monthly_eval_bonus = excluded.monthly_eval_bonus,
        annual_leave = excluded.annual_leave,
        salary_adjustment = excluded.salary_adjustment,
        gross_salary = excluded.gross_salary,
        non_taxable_amount = excluded.non_taxable_amount,
        taxable_salary_usd = excluded.taxable_salary_usd,
        taxable_salary_khr = excluded.taxable_salary_khr,
        pension_usd = excluded.pension_usd,
        pension_khr = excluded.pension_khr,
        dependents_count = excluded.dependents_count,
        taxable_base_khr = excluded.taxable_base_khr,
        tax_rate = excluded.tax_rate,
        tax_khr = excluded.tax_khr,
        tax_usd = excluded.tax_usd,
        after_tax_salary = excluded.after_tax_salary,
        first_paid = excluded.first_paid,
        target_bonus = excluded.target_bonus,
        severance_pay = excluded.severance_pay,
        seniority_payback = excluded.seniority_payback,
        paid_final_salary = excluded.paid_final_salary,
        second_paid = excluded.second_paid,
        total_paid = excluded.total_paid,
        calculation_trace = excluded.calculation_trace
    `);

    let totalGross = 0;
    let totalNet = 0;
    let count = 0;

    const calcAll = db.transaction(() => {
      for (const emp of employees) {
        const att = attMap.get(emp.id);
        const absentDays = att ? att.absent_days : 0;
        const unpaidDays = att ? att.unpaid_days : 0;
        const halfDays = att ? att.half_days : 0;
        const otHours = otMap.get(emp.id) || 0;
        const approvedAttBonus = attBonusMap.get(emp.id);

        const result = computeEmployeePayroll(emp, periodId, payPeriodName, {
          rulesConfig: rules,
          absentDays,
          unpaidDays,
          halfDays,
          actualWorkingDays: att ? att.actual_working_days : undefined,
          overtimeHours: otHours,
          monthlyEvalBonus: Number(emp.monthly_eval_bonus || 0),
          severancePay: Number(emp.severance_pay || 0),
          attendanceBonusOverride: approvedAttBonus ? Number(approvedAttBonus.bonus_amount) : undefined,
          attendanceBonusTier: approvedAttBonus ? approvedAttBonus.tier_name : undefined,
          positionAllowanceOverride: posPaymentMap.has(emp.id) ? posPaymentMap.get(emp.id) : Number(emp.position_allowance || 0),
        });

        const p = result.payroll;
        totalGross += p.gross_salary || 0;
        totalNet += p.net_salary || 0;
        count++;

        insertOrUpdatePay.run({
          id: p.id,
          employee_id: p.employee_id,
          pay_period: p.pay_period,
          payment_date: p.payment_date,
          base_salary: p.base_salary,
          allowances: p.allowances,
          bonuses: p.bonuses,
          tax_deduction: p.tax_deduction,
          insurance_deduction: p.insurance_deduction,
          other_deductions: 0,
          net_salary: p.net_salary,
          status: 'Processing',
          payment_method: 'Direct Deposit',
          created_at: new Date().toISOString(),
          working_days: p.working_days,
          absent_days: p.absent_days,
          unpaid_days: p.unpaid_days,
          basic_working_salary: p.basic_working_salary,
          seniority_bonus: p.seniority_bonus,
          position_allowance: p.position_allowance,
          sewing_skill_matrix: p.sewing_skill_matrix,
          skill_allowance: p.skill_allowance,
          transport_housing: p.transport_housing,
          attendance_allowance: p.attendance_allowance,
          food_allowance: p.food_allowance,
          overtime_pay: p.overtime_pay,
          overtime_food: p.overtime_food,
          achievement_bonus: p.achievement_bonus,
          monthly_eval_bonus: p.monthly_eval_bonus,
          annual_leave: p.annual_leave,
          salary_adjustment: p.salary_adjustment,
          gross_salary: p.gross_salary,
          non_taxable_amount: p.non_taxable_amount,
          taxable_salary_usd: p.taxable_salary_usd,
          taxable_salary_khr: p.taxable_salary_khr,
          pension_usd: p.pension_usd,
          pension_khr: p.pension_khr,
          dependents_count: p.dependents_count,
          taxable_base_khr: p.taxable_base_khr,
          tax_rate: p.tax_rate,
          tax_khr: p.tax_khr,
          tax_usd: p.tax_usd,
          after_tax_salary: p.after_tax_salary,
          first_paid: p.first_paid,
          target_bonus: p.target_bonus,
          severance_pay: p.severance_pay || 0,
          seniority_payback: p.seniority_payback || 0,
          paid_final_salary: p.paid_final_salary || 0,
          second_paid: p.second_paid,
          total_paid: p.total_paid,
          labor_type: p.labor_type,
          exchange_rate_khr: p.exchange_rate_khr,
          nssf_rate_khr: p.nssf_rate_khr,
          calculation_trace: p.calculation_trace,
          period_id: periodId,
        });
      }
    });

    calcAll();

    logAudit({
      user_name: user_name || 'Administrator',
      action: 'CALCULATE_PERIOD_PAYROLL',
      module: 'Payroll Engine',
      record_id: periodId,
      new_value: JSON.stringify({ count, totalGross, totalNet }),
    });

    return NextResponse.json({
      success: true,
      message: `Calculated payroll for ${count} employees in ${payPeriodName}`,
      count,
      total_gross: Math.round(totalGross * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
    });
  } catch (error: any) {
    console.error('Error calculating period payroll:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
