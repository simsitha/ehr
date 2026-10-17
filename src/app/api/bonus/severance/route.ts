import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractType = searchParams.get('contract_type');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const period = searchParams.get('pay_period') || 'October 2026';

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
        e.contract_type,
        e.contract_start,
        e.contract_end,
        e.join_date,
        e.salary as base_salary,
        COALESCE(e.severance_pay, 0) as severance_pay,
        ROUND(CAST(e.salary * 0.05 AS numeric), 2) as suggested_5_pct,
        e.status,
        p.id as payroll_id,
        p.severance_pay as payroll_severance_pay,
        p.after_tax_salary,
        p.first_paid,
        p.second_paid,
        p.total_paid
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN payrolls p ON p.employee_id = e.id AND p.pay_period = ?
      WHERE e.status != 'Terminated'
    `;
    const params: any[] = [period];

    if (contractType && contractType !== 'all') {
      if (contractType === 'FDC') {
        query += ` AND e.contract_type LIKE '%FDC%'`;
      } else if (contractType === 'UDC') {
        query += ` AND e.contract_type LIKE '%UDC%'`;
      }
    }

    if (department && department !== 'all') {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    if (search && search.trim()) {
      query += ` AND (e.id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ? OR e.role LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY e.severance_pay DESC, (e.contract_type LIKE '%FDC%') DESC, e.id ASC`;

    const workers = db.prepare(query).all(...params) as any[];

    // Overall summary across all active workers
    const allActive = db.prepare(`
      SELECT 
        id,
        contract_type,
        salary,
        COALESCE(severance_pay, 0) as severance_pay,
        ROUND(CAST(salary * 0.05 AS numeric), 2) as suggested_5_pct
      FROM employees 
      WHERE status != 'Terminated'
    `).all() as Array<{
      id: string;
      contract_type: string;
      salary: number;
      severance_pay: number;
      suggested_5_pct: number;
    }>;

    const totalWorkers = allActive.length;
    const fdcWorkers = allActive.filter((w) => (w.contract_type || '').includes('FDC'));
    const udcWorkers = allActive.filter((w) => (w.contract_type || '').includes('UDC'));
    const activeSeveranceWorkers = allActive.filter((w) => Number(w.severance_pay || 0) > 0);
    const totalSeverancePayout = allActive.reduce((sum, w) => sum + Number(w.severance_pay || 0), 0);
    const fdcPotentialPayout = fdcWorkers.reduce((sum, w) => sum + Number(w.suggested_5_pct || 0), 0);
    const avgSeverance = activeSeveranceWorkers.length > 0 
      ? Math.round((totalSeverancePayout / activeSeveranceWorkers.length) * 100) / 100 
      : 0;

    return NextResponse.json({
      success: true,
      workers,
      period,
      summary: {
        total_workers: totalWorkers,
        fdc_count: fdcWorkers.length,
        udc_count: udcWorkers.length,
        active_severance_count: activeSeveranceWorkers.length,
        total_severance_payout: Math.round(totalSeverancePayout * 100) / 100,
        fdc_potential_5pct: Math.round(fdcPotentialPayout * 100) / 100,
        average_severance: avgSeverance,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/bonus/severance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { employee_id, severance_pay, user_name, pay_period = 'October 2026' } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'Missing employee_id' }, { status: 400 });
    }

    const newSeverance = Math.max(0, Math.round(Number(severance_pay || 0) * 100) / 100);

    // 1. Fetch current employee
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id) as any;
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const prevSeverance = Number(emp.severance_pay || 0);

    // 2. Update employees table
    db.prepare('UPDATE employees SET severance_pay = ? WHERE id = ?').run(newSeverance, employee_id);

    // 3. Update active payroll record if exists
    let updatedPayroll: any = null;
    const payRecord = db.prepare(`
      SELECT * FROM payrolls 
      WHERE employee_id = ? AND (pay_period = ? OR pay_period LIKE ?)
      ORDER BY payment_date DESC LIMIT 1
    `).get(employee_id, pay_period, `%${pay_period.split(' ')[0]}%`) as any;

    if (payRecord) {
      const afterTax = Number(payRecord.after_tax_salary || 0);
      const firstPaid = Number(payRecord.first_paid || 0);
      const targetBonus = Number(payRecord.target_bonus || 0);
      const seniorityPayback = Number(payRecord.seniority_payback || 0);
      const paidFoodFee = 0; // standard allowance already in after-tax

      // Reconcile Second Paid & Total Paid with Severant Pay 5%
      const newSecondPaid = Math.round((afterTax + newSeverance + seniorityPayback - firstPaid - targetBonus - paidFoodFee) * 100) / 100;
      const newTotalPaid = Math.round((firstPaid + targetBonus + paidFoodFee + newSecondPaid) * 100) / 100;

      // Update calculation trace if present
      let updatedTrace = payRecord.calculation_trace;
      if (updatedTrace) {
        try {
          const traceObj = JSON.parse(updatedTrace);
          if (traceObj.steps && Array.isArray(traceObj.steps)) {
            // Update or add severance step
            const existingStepIdx = traceObj.steps.findIndex((s: any) => 
              (s.title && s.title.includes('Severance')) || (s.title_km && s.title_km.includes('បំណាច់កុងត្រា'))
            );
            const sevStep = {
              title: 'Severance Pay 5% (Column 50 - Article 73 FDC Indemnity)',
              title_km: 'ប្រាក់បំណាច់កុងត្រា ៥% (មាត្រា ៧៣ នៃច្បាប់ការងារ)',
              formula: `5% statutory severance indemnity on contract wages`,
              result: `+$${newSeverance.toFixed(2)}`,
              explanation: `Statutory 5% severance payment mandated by Article 73 of the Cambodia Labor Law for Fixed Duration Contracts (FDC / ក.ក.ថ), disbursed upon contract expiration, renewal, or monthly contract settlement.`,
              explanation_km: `ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% អនុលោមតាមមាត្រា ៧៣ នៃច្បាប់ការងារកម្ពុជា សម្រាប់កិច្ចសន្យាការងារមានកំណត់ថិរវេលា (ក.ក.ថ) ដែលត្រូវទូទាត់ជូនកម្មករនិយោជិត។`,
              legal_reference: 'Cambodia Labor Law Article 73 & Column 50 of Factory Ledger',
            };
            if (newSeverance > 0) {
              if (existingStepIdx >= 0) {
                traceObj.steps[existingStepIdx] = sevStep;
              } else {
                traceObj.steps.push(sevStep);
              }
            } else if (existingStepIdx >= 0) {
              traceObj.steps.splice(existingStepIdx, 1);
            }
            updatedTrace = JSON.stringify(traceObj);
          }
        } catch {
          // Keep existing trace
        }
      }

      db.prepare(`
        UPDATE payrolls 
        SET severance_pay = ?,
            second_paid = ?,
            total_paid = ?,
            net_salary = ?,
            calculation_trace = ?
        WHERE id = ?
      `).run(newSeverance, newSecondPaid, newTotalPaid, newTotalPaid, updatedTrace, payRecord.id);

      updatedPayroll = {
        id: payRecord.id,
        severance_pay: newSeverance,
        second_paid: newSecondPaid,
        total_paid: newTotalPaid,
        net_salary: newTotalPaid,
      };
    }

    // 4. Log audit entry
    logAudit({
      user_name: user_name || 'Line Supervisor',
      action: 'UPDATE_SEVERANCE_PAY',
      module: 'Bonus & Severance Management',
      record_id: employee_id,
      old_value: `$${prevSeverance.toFixed(2)}`,
      new_value: `$${newSeverance.toFixed(2)} (Period: ${pay_period})`,
    });

    return NextResponse.json({
      success: true,
      employee_id,
      prev_severance: prevSeverance,
      severance_pay: newSeverance,
      updated_payroll: updatedPayroll,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/bonus/severance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
