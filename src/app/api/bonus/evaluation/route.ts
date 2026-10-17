import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const line = searchParams.get('line');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const tier = searchParams.get('tier');

    const db = getDb();

    let query = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.first_name || ' ' || e.last_name as employee_name,
        e.khmer_name,
        e.role,
        e.department_id,
        d.name as department_name,
        e.group_name,
        e.salary as base_salary,
        COALESCE(e.monthly_eval_bonus, 0) as monthly_eval_bonus,
        COALESCE(e.sewing_skill_matrix, 0) as sewing_skill_matrix,
        e.pay_grade,
        e.employee_type,
        e.employment_type,
        e.status
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.status != 'Terminated'
        AND (
          (e.group_name IS NOT NULL AND TRIM(e.group_name) != '')
          OR (e.group_id IS NOT NULL AND TRIM(e.group_id) != '')
        )
    `;
    const params: any[] = [];

    if (department && department !== 'all') {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    if (line && line !== 'all') {
      const lNorm = line.toLowerCase().replace(/[\s_.-]+/g, '');
      if (lNorm === '1' || lNorm === 'l1' || lNorm === 'line1' || lNorm === 'sewl1' || lNorm === 'b1' || lNorm === 'batch1' || lNorm === 'sewingline1') {
        query += ` AND (e.group_name = 'Sewing Line 1' OR e.group_name = 'Sew-L.1' OR e.group_name = 'Line 1' OR e.group_id = 'grp-sew1')`;
      } else if (lNorm === '2' || lNorm === 'l2' || lNorm === 'line2' || lNorm === 'sewl2' || lNorm === 'b2' || lNorm === 'batch2' || lNorm === 'sewingline2') {
        query += ` AND (e.group_name = 'Sewing Line 2' OR e.group_name = 'Sew-L.2' OR e.group_name = 'Line 2' OR e.group_id = 'grp-sew2')`;
      } else if (lNorm === '3' || lNorm === 'l3' || lNorm === 'line3' || lNorm === 'sewl3' || lNorm === 'b3' || lNorm === 'batch3' || lNorm === 'sewingline3') {
        query += ` AND (e.group_name = 'Sewing Line 3' OR e.group_name = 'Sew-L.3' OR e.group_name = 'Line 3' OR e.group_id = 'grp-sew3')`;
      } else {
        query += ` AND (e.group_name = ? OR e.group_id = ?)`;
        params.push(line, line);
      }
    }

    if (tier && tier !== 'all') {
      if (tier === '0') {
        query += ` AND (e.monthly_eval_bonus IS NULL OR e.monthly_eval_bonus = 0)`;
      } else {
        query += ` AND e.monthly_eval_bonus = ?`;
        params.push(Number(tier));
      }
    }

    if (search && search.trim()) {
      query += ` AND (e.id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ? OR e.role LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY e.monthly_eval_bonus DESC, e.group_name ASC, e.id ASC`;

    const rawWorkers = db.prepare(query).all(...params) as any[];
    const workers = rawWorkers.filter((w) => !isBoardMember(w));

    // Overall summary across all active workers (excluding board members)
    const allActiveRows = db.prepare(`
      SELECT 
        e.role, e.department_id, d.name as department_name, e.employee_type, e.employment_type,
        COALESCE(e.monthly_eval_bonus, 0) as monthly_eval_bonus 
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.status != 'Terminated'
        AND (
          (e.group_name IS NOT NULL AND TRIM(e.group_name) != '')
          OR (e.group_id IS NOT NULL AND TRIM(e.group_id) != '')
        )
    `).all() as any[];
    const allActive = allActiveRows.filter((w) => !isBoardMember(w));

    const totalWorkers = allActive.length;
    const activeEvalWorkers = allActive.filter((w) => w.monthly_eval_bonus > 0);
    const totalPayout = allActive.reduce((sum, w) => sum + Number(w.monthly_eval_bonus || 0), 0);
    const avgPayout = activeEvalWorkers.length > 0 ? Math.round((totalPayout / activeEvalWorkers.length) * 100) / 100 : 0;
    const maxBonus = allActive.length > 0 ? Math.max(...allActive.map((w) => Number(w.monthly_eval_bonus || 0))) : 0;

    const tiers: Record<number, number> = {};
    allActive.forEach((w) => {
      const val = Number(w.monthly_eval_bonus || 0);
      if (val > 0) {
        tiers[val] = (tiers[val] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      workers,
      summary: {
        total_workers: totalWorkers,
        active_eval_count: activeEvalWorkers.length,
        total_payout: totalPayout,
        average_payout: avgPayout,
        max_bonus: maxBonus,
        tier_distribution: tiers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching monthly evaluation bonus:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      monthly_eval_bonus,
      updateActivePayroll = true,
      month = '2026-10',
    } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    const bonusValue = Math.max(0, Number(monthly_eval_bonus) || 0);

    // 1. Update in employees table
    db.prepare(`
      UPDATE employees 
      SET monthly_eval_bonus = ?
      WHERE id = ?
    `).run(bonusValue, employee_id);

    // 2. If updateActivePayroll is true, update the payrolls record for this employee
    if (updateActivePayroll) {
      const payPeriodPattern = month.includes('10') ? '%October%' : '%August%';
      const payroll = db.prepare(`
        SELECT * FROM payrolls 
        WHERE employee_id = ? AND (pay_period LIKE ? OR period_id LIKE ?)
        LIMIT 1
      `).get(employee_id, payPeriodPattern, `%${month}%`) as any;

      if (payroll) {
        const oldEvalBonus = Number(payroll.monthly_eval_bonus || 0);
        const bonusDiff = bonusValue - oldEvalBonus;

        const newGross = Math.round((Number(payroll.gross_salary || 0) + bonusDiff) * 100) / 100;
        const newBonuses = Math.round((Number(payroll.bonuses || 0) + bonusDiff) * 100) / 100;
        const newNet = Math.round((Number(payroll.net_salary || 0) + bonusDiff) * 100) / 100;
        const newSecondPaid = Math.max(0, Math.round((Number(payroll.second_paid || 0) + bonusDiff) * 100) / 100);

        db.prepare(`
          UPDATE payrolls 
          SET monthly_eval_bonus = ?,
              bonuses = ?,
              gross_salary = ?,
              net_salary = ?,
              second_paid = ?,
              total_paid = ?
          WHERE id = ?
        `).run(bonusValue, newBonuses, newGross, newNet, newSecondPaid, newNet, payroll.id);
      }
    }

    logAudit({
      user_id: 'admin',
      user_name: 'Administrator',
      action: 'UPDATE_EVALUATION_BONUS',
      module: 'Payroll/Evaluation',
      record_id: employee_id,
      new_value: `$${bonusValue.toFixed(2)}`,
    });

    return NextResponse.json({
      success: true,
      employee_id,
      monthly_eval_bonus: bonusValue,
      message: `Monthly Evaluation Bonus updated to $${bonusValue.toFixed(2)}`,
    });
  } catch (error: any) {
    console.error('Error updating monthly evaluation bonus:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
