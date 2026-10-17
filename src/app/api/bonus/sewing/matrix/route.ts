import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const line = searchParams.get('line');
    const search = searchParams.get('search');

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
        e.group_name,
        e.salary as base_salary,
        COALESCE(e.sewing_skill_matrix, 0) as sewing_skill_matrix,
        e.pay_grade,
        e.status
      FROM employees e
      WHERE (
        e.department_id = 'dept-prod' 
        OR e.group_name LIKE 'Sew%' 
        OR e.role LIKE '%Sew%' 
        OR e.id LIKE 'HC%'
        OR e.sewing_skill_matrix > 0
      )
      AND e.status != 'Terminated'
    `;
    const params: any[] = [];

    if (line && line !== 'all') {
      const lNorm = line.toLowerCase().replace(/[\s_.-]+/g, '');
      if (lNorm === '1' || lNorm === 'l1' || lNorm === 'line1' || lNorm === 'sewl1' || lNorm === 'b1' || lNorm === 'batch1' || lNorm === 'sewingline1') {
        query += ` AND (e.group_name = 'Sewing Line 1' OR e.group_name = 'Sew-L.1' OR e.group_name = 'Line 1')`;
      } else if (lNorm === '2' || lNorm === 'l2' || lNorm === 'line2' || lNorm === 'sewl2' || lNorm === 'b2' || lNorm === 'batch2' || lNorm === 'sewingline2') {
        query += ` AND (e.group_name = 'Sewing Line 2' OR e.group_name = 'Sew-L.2' OR e.group_name = 'Line 2')`;
      } else if (lNorm === '3' || lNorm === 'l3' || lNorm === 'line3' || lNorm === 'sewl3' || lNorm === 'b3' || lNorm === 'batch3' || lNorm === 'sewingline3') {
        query += ` AND (e.group_name = 'Sewing Line 3' OR e.group_name = 'Sew-L.3' OR e.group_name = 'Line 3')`;
      } else {
        query += ` AND e.group_name = ?`;
        params.push(line);
      }
    }

    if (search && search.trim()) {
      query += ` AND (e.id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY e.sewing_skill_matrix DESC, e.group_name ASC, e.id ASC`;

    const workers = db.prepare(query).all(...params) as any[];

    // Compute summary metrics
    const totalWorkers = workers.length;
    const activeMatrixWorkers = workers.filter((w) => w.sewing_skill_matrix > 0);
    const totalPayout = workers.reduce((sum, w) => sum + Number(w.sewing_skill_matrix || 0), 0);
    const avgPayout = activeMatrixWorkers.length > 0 ? Math.round((totalPayout / activeMatrixWorkers.length) * 100) / 100 : 0;
    const maxAllowance = workers.length > 0 ? Math.max(...workers.map((w) => Number(w.sewing_skill_matrix || 0))) : 0;

    // Tiers distribution
    const tiers: Record<number, number> = {};
    workers.forEach((w) => {
      const val = Number(w.sewing_skill_matrix || 0);
      if (val > 0) {
        tiers[val] = (tiers[val] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      workers,
      summary: {
        total_workers: totalWorkers,
        active_matrix_count: activeMatrixWorkers.length,
        total_payout: totalPayout,
        average_payout: avgPayout,
        max_allowance: maxAllowance,
        tier_distribution: tiers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sewing matrix workers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      employee_id,
      sewing_skill_matrix,
      updateActivePayroll = true,
      month = '2026-10',
    } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    const allowance = Math.max(0, Number(sewing_skill_matrix) || 0);

    // Update in employees table
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id) as any;
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const prevAllowance = Number(emp.sewing_skill_matrix || 0);
    db.prepare('UPDATE employees SET sewing_skill_matrix = ? WHERE id = ?').run(allowance, employee_id);

    // Optionally update active/unlocked payrolls
    let updatedPayrollsCount = 0;
    if (updateActivePayroll) {
      const payrollRows = db.prepare(`
        SELECT p.* FROM payrolls p
        LEFT JOIN payroll_periods pr ON p.period_id = pr.id
        WHERE p.employee_id = ?
        AND (pr.status != 'Locked' OR pr.status IS NULL)
      `).all(employee_id) as any[];

      const updatePayStmt = db.prepare(`
        UPDATE payrolls
        SET 
          sewing_skill_matrix = @allowance,
          allowances = allowances - @prevAllowance + @allowance,
          gross_salary = gross_salary - @prevAllowance + @allowance,
          net_salary = net_salary - @prevAllowance + @allowance,
          total_paid = total_paid - @prevAllowance + @allowance,
          second_paid = second_paid - @prevAllowance + @allowance
        WHERE id = @id
      `);

      for (const p of payrollRows) {
        updatePayStmt.run({
          id: p.id,
          allowance,
          prevAllowance: Number(p.sewing_skill_matrix || 0),
        });
        updatedPayrollsCount++;
      }
    }

    logAudit({
      user_id: 'usr-admin',
      user_name: 'Administrator',
      action: 'UPDATE_SEWING_MATRIX_ALLOWANCE',
      module: 'Bonus & Compensation',
      record_id: employee_id,
      old_value: JSON.stringify({ sewing_skill_matrix: prevAllowance }),
      new_value: JSON.stringify({
        sewing_skill_matrix: allowance,
        updatedPayrollsCount,
      }),
    });

    return NextResponse.json({
      success: true,
      employee_id,
      sewing_skill_matrix: allowance,
      prev_allowance: prevAllowance,
      updated_payrolls_count: updatedPayrollsCount,
    });
  } catch (error: any) {
    console.error('Error updating sewing matrix allowance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
