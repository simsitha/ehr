import { NextResponse } from 'next/server';
import { getDb, logAudit, getPayrollRules } from '@/lib/db';
import { computeDailyTargetBonus, DEFAULT_DAILY_TARGET_RULE, DailyTargetRule } from '@/lib/payrollRules';
import { computeEmployeePayroll } from '@/lib/payrollEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { month = '2026-10', period_name = 'October 2026', user_name = 'Administrator' } = body;

    // Check if period is locked
    const periodRow = db.prepare('SELECT * FROM payroll_periods WHERE name = ? OR id = ?').get(period_name, `period-${month}`) as any;
    if (periodRow && periodRow.status === 'Locked') {
      return NextResponse.json(
        { error: 'Cannot post daily target bonus to a locked payroll period.' },
        { status: 403 }
      );
    }

    const periodId = periodRow?.id || `period-${month}`;
    const payPeriodName = periodRow?.name || period_name;

    // Load active daily target rule
    const rule = (db.prepare('SELECT * FROM sewing_daily_target_rules WHERE is_active = 1 LIMIT 1').get() as DailyTargetRule) || DEFAULT_DAILY_TARGET_RULE;

    // Load all production records for the month
    const records = db.prepare(`
      SELECT * FROM sewing_production_weekly
      WHERE (month = ? OR week_start LIKE ?)
    `).all(month, `${month}%`) as any[];

    if (records.length === 0) {
      return NextResponse.json({ error: 'No sewing production records found for this month.' }, { status: 400 });
    }

    // Compute monthly sum of daily target bonuses per employee
    const workerBonusMap = new Map<string, number>();
    for (const r of records) {
      const days = [r.mon_qty || 0, r.tue_qty || 0, r.wed_qty || 0, r.thu_qty || 0, r.fri_qty || 0, r.sat_qty || 0];
      let weeklyDailyTotal = 0;
      for (const qty of days) {
        weeklyDailyTotal += computeDailyTargetBonus(qty, rule).bonusAmount;
      }
      workerBonusMap.set(r.employee_id, Math.round(((workerBonusMap.get(r.employee_id) || 0) + weeklyDailyTotal) * 100) / 100);
    }

    let updatedCount = 0;
    let totalPostedAmount = 0;
    const rulesConfig = getPayrollRules();

    db.transaction(() => {
      for (const [employeeId, targetBonusAmount] of workerBonusMap.entries()) {
        const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as any;
        if (!emp) continue;

        // Check if payroll row exists
        const existingPay = db.prepare(`
          SELECT * FROM payrolls WHERE employee_id = ? AND (pay_period = ? OR period_id = ?)
        `).get(employeeId, payPeriodName, periodId) as any;

        if (existingPay) {
          // Update target_bonus (Column 49) and recalculate second_paid
          const afterTax = Number(existingPay.after_tax_salary || 0);
          const firstPaid = Number(existingPay.first_paid || 0);
          const severance = Number(existingPay.severance_pay || 0);
          const seniorityPayback = Number(existingPay.seniority_payback || 0);
          const paidFoodFee = Number(existingPay.paid_food_fee || 0);

          // Second Paid = AfterTax + Severance + SeniorityPayback - FirstPaid - TargetBonus - FoodFee
          const newSecondPaid = Math.round((afterTax + severance + seniorityPayback - firstPaid - targetBonusAmount - paidFoodFee) * 100) / 100;
          const newTotalPaid = Math.round((firstPaid + targetBonusAmount + newSecondPaid) * 100) / 100;

          db.prepare(`
            UPDATE payrolls 
            SET target_bonus = ?, second_paid = ?, total_paid = ?
            WHERE id = ?
          `).run(targetBonusAmount, newSecondPaid, newTotalPaid, existingPay.id);
        } else {
          // Provision payroll record with target_bonus
          const res = computeEmployeePayroll(emp, periodId, payPeriodName, {
            rulesConfig,
          });
          const p = res.payroll;
          const afterTax = Number(p.after_tax_salary || 0);
          const firstPaid = Number(p.first_paid || 0);
          const severance = Number(p.severance_pay || 0);
          const newSecondPaid = Math.round((afterTax + severance - firstPaid - targetBonusAmount) * 100) / 100;
          const newTotalPaid = Math.round((firstPaid + targetBonusAmount + newSecondPaid) * 100) / 100;

          db.prepare(`
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
              target_bonus = excluded.target_bonus,
              second_paid = excluded.second_paid,
              total_paid = excluded.total_paid
          `).run({
            ...p,
            target_bonus: targetBonusAmount,
            second_paid: newSecondPaid,
            total_paid: newTotalPaid,
            status: 'Processing',
            payment_method: 'Direct Deposit',
            created_at: new Date().toISOString(),
            other_deductions: 0,
          });
        }

        updatedCount++;
        totalPostedAmount = Math.round((totalPostedAmount + targetBonusAmount) * 100) / 100;
      }
    })();

    logAudit({
      user_id: 'usr-admin',
      user_name,
      action: 'POST_DAILY_TARGET_BONUS_TO_PAYROLL',
      module: 'Sewing Production',
      record_id: `posted-${month}`,
      new_value: JSON.stringify({
        month,
        period_name: payPeriodName,
        workers_updated: updatedCount,
        total_posted: totalPostedAmount,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully posted Daily Target Bonus ($${totalPostedAmount.toFixed(2)}) for ${updatedCount} operators to payroll (${payPeriodName})!`,
      workers_updated: updatedCount,
      total_posted_amount: totalPostedAmount,
      period_name: payPeriodName,
    });
  } catch (error: any) {
    console.error('Error in POST /api/bonus/sewing/daily/post-to-payroll:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
