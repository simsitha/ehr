import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { isBoardMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payPeriod = searchParams.get('pay_period') || 'October 2026';
    const targetType = searchParams.get('target') || 'fdc'; // 'fdc' or 'all'

    const db = getDb();

    // Load active employees
    const rawEmployees = db.prepare(`
      SELECT 
        e.id as employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.khmer_name,
        e.role,
        e.department_id,
        d.name as department_name,
        e.group_name,
        e.contract_type,
        e.contract_start,
        e.contract_end,
        e.salary as base_salary,
        e.employee_type,
        e.employment_type,
        COALESCE(e.severance_pay, 0) as current_severance_pay
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.status != 'Terminated'
      ORDER BY (e.contract_type LIKE '%FDC%') DESC, e.group_name ASC, e.id ASC
    `).all() as any[];

    const employees = rawEmployees.filter((emp) => !isBoardMember(emp));

    let currentTotal = 0;
    let suggestedTotal = 0;

    const items = employees.map((emp) => {
      const isFdc = (emp.contract_type || '').includes('FDC');
      const baseSalary = Number(emp.base_salary || 0);
      const currentVal = Number(emp.current_severance_pay || 0);

      // Cambodian Labor Law Article 73: Severance pay is at least 5% of wages
      // For FDC workers: 5% of monthly wage or contract duration
      let suggestedVal = 0;
      let rationale = '';

      if (isFdc) {
        suggestedVal = Math.round(baseSalary * 0.05 * 100) / 100;
        rationale = `FDC Worker: 5% of Base Salary ($${baseSalary.toFixed(2)}) under Labor Law Art. 73`;
      } else {
        suggestedVal = 0;
        rationale = `UDC Contract Worker: Entitled to Seniority Indemnity (15 days/yr under Prakas 443), exempt from 5% FDC severance`;
      }

      // If targetType is 'all' or 'fdc' and employee is FDC
      if (targetType === 'fdc' && !isFdc) {
        suggestedVal = currentVal; // keep current if not target
      }

      currentTotal += currentVal;
      suggestedTotal += suggestedVal;

      return {
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        khmer_name: emp.khmer_name,
        role: emp.role,
        department_name: emp.department_name,
        group_name: emp.group_name,
        contract_type: emp.contract_type,
        is_fdc: isFdc,
        base_salary: baseSalary,
        current_severance: currentVal,
        suggested_severance: suggestedVal,
        delta: Math.round((suggestedVal - currentVal) * 100) / 100,
        rationale,
      };
    });

    const fdcCount = items.filter((i) => i.is_fdc).length;
    const udcCount = items.filter((i) => !i.is_fdc).length;

    return NextResponse.json({
      success: true,
      pay_period: payPeriod,
      total_employees: items.length,
      fdc_count: fdcCount,
      udc_count: udcCount,
      current_total_payout: Math.round(currentTotal * 100) / 100,
      suggested_total_payout: Math.round(suggestedTotal * 100) / 100,
      net_payout_increase: Math.round((suggestedTotal - currentTotal) * 100) / 100,
      items,
    });
  } catch (error: any) {
    console.error('Error in GET /api/bonus/severance/auto-calculate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { 
      pay_period = 'October 2026', 
      user_name = 'HR Manager', 
      employee_ids, // optional: apply only to specific workers
      custom_rates // optional: { [emp_id]: number }
    } = body;

    // Load target employees (FDC by default, or specific selected IDs)
    let query = `SELECT id, salary, contract_type, COALESCE(severance_pay, 0) as severance_pay FROM employees WHERE status != 'Terminated'`;
    const params: any[] = [];

    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      const placeholders = employee_ids.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...employee_ids);
    } else {
      // Default: all active FDC workers
      query += ` AND contract_type LIKE '%FDC%'`;
    }

    const targetWorkers = db.prepare(query).all(...params) as Array<{
      id: string;
      salary: number;
      contract_type: string;
      severance_pay: number;
    }>;

    if (targetWorkers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No eligible FDC workers found to calculate severance for.',
      }, { status: 400 });
    }

    let appliedCount = 0;
    let totalSeveranceSum = 0;

    const applyTransaction = db.transaction(() => {
      for (const w of targetWorkers) {
        // Calculate 5% or use custom override
        let newSeverance = Math.round(Number(w.salary || 0) * 0.05 * 100) / 100;
        if (custom_rates && custom_rates[w.id] !== undefined) {
          newSeverance = Math.max(0, Math.round(Number(custom_rates[w.id]) * 100) / 100);
        }

        totalSeveranceSum += newSeverance;
        appliedCount++;

        // 1. Update employee record
        db.prepare('UPDATE employees SET severance_pay = ? WHERE id = ?').run(newSeverance, w.id);

        // 2. Reconcile active payroll record if exists
        const payRecord = db.prepare(`
          SELECT * FROM payrolls 
          WHERE employee_id = ? AND (pay_period = ? OR pay_period LIKE ?)
          ORDER BY payment_date DESC LIMIT 1
        `).get(w.id, pay_period, `%${pay_period.split(' ')[0]}%`) as any;

        if (payRecord) {
          const afterTax = Number(payRecord.after_tax_salary || 0);
          const firstPaid = Number(payRecord.first_paid || 0);
          const targetBonus = Number(payRecord.target_bonus || 0);
          const seniorityPayback = Number(payRecord.seniority_payback || 0);
          const paidFoodFee = 0;

          const newSecondPaid = Math.round((afterTax + newSeverance + seniorityPayback - firstPaid - targetBonus - paidFoodFee) * 100) / 100;
          const newTotalPaid = Math.round((firstPaid + targetBonus + paidFoodFee + newSecondPaid) * 100) / 100;

          // Update calculation trace
          let updatedTrace = payRecord.calculation_trace;
          if (updatedTrace) {
            try {
              const traceObj = JSON.parse(updatedTrace);
              if (traceObj.steps && Array.isArray(traceObj.steps)) {
                const existingIdx = traceObj.steps.findIndex((s: any) => 
                  (s.title && s.title.includes('Severance')) || (s.title_km && s.title_km.includes('បំណាច់កុងត្រា'))
                );
                const sevStep = {
                  title: 'Severance Pay 5% (Column 50 - Article 73 FDC Indemnity)',
                  title_km: 'ប្រាក់បំណាច់កុងត្រា ៥% (មាត្រា ៧៣ នៃច្បាប់ការងារ)',
                  formula: `5% of Base Salary ($${Number(w.salary).toFixed(2)}) under Labor Law Art. 73`,
                  result: `+$${newSeverance.toFixed(2)}`,
                  explanation: `Statutory 5% severance payment mandated by Article 73 of the Cambodia Labor Law for Fixed Duration Contracts (FDC / ក.ក.ថ), disbursed upon contract expiration, renewal, or monthly contract settlement.`,
                  explanation_km: `ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% អនុលោមតាមមាត្រា ៧៣ នៃច្បាប់ការងារកម្ពុជា សម្រាប់កិច្ចសន្យាការងារមានកំណត់ថិរវេលា (ក.ក.ថ) ដែលត្រូវទូទាត់ជូនកម្មករនិយោជិត។`,
                  legal_reference: 'Cambodia Labor Law Article 73 & Column 50 of Factory Ledger',
                };
                if (newSeverance > 0) {
                  if (existingIdx >= 0) {
                    traceObj.steps[existingIdx] = sevStep;
                  } else {
                    traceObj.steps.push(sevStep);
                  }
                } else if (existingIdx >= 0) {
                  traceObj.steps.splice(existingIdx, 1);
                }
                updatedTrace = JSON.stringify(traceObj);
              }
            } catch {
              // Ignore trace json error
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
        }
      }
    });

    applyTransaction();

    // Log audit
    logAudit({
      user_name: user_name || 'HR Manager',
      action: 'BATCH_AUTO_CALCULATE_SEVERANCE_5PCT',
      module: 'Bonus & Severance Management',
      record_id: pay_period,
      new_value: JSON.stringify({
        applied_workers_count: appliedCount,
        total_severance_disbursed: Math.round(totalSeveranceSum * 100) / 100,
        pay_period,
      }),
    });

    return NextResponse.json({
      success: true,
      applied_count: appliedCount,
      total_severance_payout: Math.round(totalSeveranceSum * 100) / 100,
      pay_period,
      message: `Successfully calculated and applied 5% Severance Pay to ${appliedCount} FDC workers ($${totalSeveranceSum.toFixed(2)} total).`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/bonus/severance/auto-calculate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
