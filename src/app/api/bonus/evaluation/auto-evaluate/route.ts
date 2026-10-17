import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { evaluateMonthlyEvaluationBonus } from '@/lib/bonusEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-10';
    const department = searchParams.get('department') || undefined;
    const line = searchParams.get('line') || undefined;

    const evaluation = evaluateMonthlyEvaluationBonus(month, { department, line });

    return NextResponse.json({
      success: true,
      ...evaluation,
    });
  } catch (error: any) {
    console.error('Error simulating auto-evaluation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      month = '2026-10',
      department,
      line,
      apply = false,
      overrides = {},
    } = body;

    const evaluation = evaluateMonthlyEvaluationBonus(month, { department, line });

    // If apply is false, return the preview simulation
    if (!apply) {
      return NextResponse.json({
        success: true,
        preview: true,
        ...evaluation,
      });
    }

    // Apply auto-evaluation to database
    let updatedCount = 0;
    let totalAppliedPayout = 0;

    const payPeriodPattern = month.includes('10') ? '%October%' : '%August%';

    const updateEmployeeStmt = db.prepare(`
      UPDATE employees 
      SET monthly_eval_bonus = ?
      WHERE id = ?
    `);

    const selectPayrollStmt = db.prepare(`
      SELECT * FROM payrolls 
      WHERE employee_id = ? AND (pay_period LIKE ? OR period_id LIKE ?)
      LIMIT 1
    `);

    const updatePayrollStmt = db.prepare(`
      UPDATE payrolls 
      SET monthly_eval_bonus = ?,
          bonuses = ?,
          gross_salary = ?,
          net_salary = ?,
          second_paid = ?,
          total_paid = ?
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      for (const item of evaluation.items) {
        // If an override was provided for this worker, use it; otherwise use suggested_bonus
        const finalBonus = overrides[item.employee_id] !== undefined
          ? Math.max(0, Number(overrides[item.employee_id]) || 0)
          : item.suggested_bonus;

        // 1. Update employee
        updateEmployeeStmt.run(finalBonus, item.employee_id);
        totalAppliedPayout += finalBonus;
        updatedCount++;

        // 2. Update active payroll if existing
        const payroll = selectPayrollStmt.get(item.employee_id, payPeriodPattern, `%${month}%`) as any;
        if (payroll) {
          const oldEvalBonus = Number(payroll.monthly_eval_bonus || 0);
          const bonusDiff = finalBonus - oldEvalBonus;

          const newGross = Math.round((Number(payroll.gross_salary || 0) + bonusDiff) * 100) / 100;
          const newBonuses = Math.round((Number(payroll.bonuses || 0) + bonusDiff) * 100) / 100;
          const newNet = Math.round((Number(payroll.net_salary || 0) + bonusDiff) * 100) / 100;
          const newSecondPaid = Math.max(0, Math.round((Number(payroll.second_paid || 0) + bonusDiff) * 100) / 100);

          updatePayrollStmt.run(finalBonus, newBonuses, newGross, newNet, newSecondPaid, newNet, payroll.id);
        }
      }
    });

    transaction();

    logAudit({
      user_id: 'admin',
      user_name: 'Administrator',
      action: 'AUTO_EVALUATE_APPLIED',
      module: 'Payroll/Evaluation',
      record_id: month,
      new_value: `Applied evaluation bonus to ${updatedCount} staff (Total Payout: $${totalAppliedPayout.toFixed(2)})`,
    });

    return NextResponse.json({
      success: true,
      applied: true,
      month,
      updated_count: updatedCount,
      total_applied_payout: totalAppliedPayout,
      message: `Successfully auto-evaluated ${updatedCount} employees (Total Payout: $${totalAppliedPayout.toFixed(2)})`,
    });
  } catch (error: any) {
    console.error('Error applying auto-evaluation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
