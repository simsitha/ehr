import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const defaultMonth = new Date().toISOString().substring(0, 7);
    const month = url.searchParams.get('month') || defaultMonth;
    const deptId = url.searchParams.get('department_id') || 'all';

    // 1. All departments
    const departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();

    // 2. Headcount & Demographics
    let empQuery = `
      SELECT 
        e.*,
        d.name as department_name,
        d.color as department_color
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
    `;
    if (deptId !== 'all') {
      empQuery += ` WHERE e.department_id = ?`;
    }
    const employees = deptId === 'all' 
      ? (db.prepare(empQuery).all() as any[])
      : (db.prepare(empQuery).all(deptId) as any[]);

    // 3. Attendance Summary for Month
    const attendanceRows = db.prepare(`
      SELECT 
        a.*,
        e.department_id
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date LIKE ?
    `).all(`${month}%`) as any[];

    const empAttendanceMap: Record<string, any> = {};
    employees.forEach((emp) => {
      empAttendanceMap[emp.id] = {
        id: emp.id,
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        role: emp.role || 'Staff',
        department: emp.department_name || 'General',
        department_id: emp.department_id,
        present: 0,
        late: 0,
        absent: 0,
        remote: 0,
        totalHours: 0,
        total_hours: 0,
        overtimeHours: 0,
        overtime_hours: 0,
      };
    });

    attendanceRows.forEach((row) => {
      if (empAttendanceMap[row.employee_id]) {
        if (row.status === 'Present') empAttendanceMap[row.employee_id].present += 1;
        else if (row.status === 'Late') empAttendanceMap[row.employee_id].late += 1;
        else if (row.status === 'Absent') empAttendanceMap[row.employee_id].absent += 1;
        else if (row.status === 'Remote') empAttendanceMap[row.employee_id].remote += 1;

        const hours = Number(row.work_hours || 0);
        const otHours = Number(row.overtime_hours || 0);
        empAttendanceMap[row.employee_id].totalHours += hours;
        empAttendanceMap[row.employee_id].total_hours += hours;
        empAttendanceMap[row.employee_id].overtimeHours += otHours;
        empAttendanceMap[row.employee_id].overtime_hours += otHours;
      }
    });

    const attendanceSummary = Object.values(empAttendanceMap).filter(
      (item) => deptId === 'all' || item.department_id === deptId
    );

    // 4. Payroll & Banking Disbursement Report
    const periodParam = url.searchParams.get('period');
    const availablePeriods = (db.prepare('SELECT pay_period FROM payrolls GROUP BY pay_period ORDER BY MAX(payment_date) DESC, MAX(id) DESC').all() as any[]).map((r) => r.pay_period);
    const latestPeriodRow = db.prepare('SELECT pay_period FROM payrolls ORDER BY payment_date DESC, id DESC LIMIT 1').get() as { pay_period: string } | undefined;
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const selectedPayrollPeriod = periodParam || latestPeriodRow?.pay_period || 'August 2026';

    let payrollRecords = db.prepare(`
      SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.khmer_name,
        e.role,
        e.email,
        e.phone,
        e.department_id,
        e.bank_account_number,
        e.bank_name,
        e.nssf_number,
        e.national_id,
        e.dob,
        e.gender,
        e.nationality,
        e.join_date,
        e.contract_type,
        d.name as department_name
      FROM payrolls p
      JOIN employees e ON e.id = p.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE p.pay_period = ?
    `).all(selectedPayrollPeriod) as any[];

    if (payrollRecords.length === 0) {
      // Fallback: Provide active employee payroll projection
      payrollRecords = db.prepare(`
        SELECT 
          0 as id,
          e.id as employee_id,
          e.first_name,
          e.last_name,
          e.khmer_name,
          e.role,
          e.email,
          e.phone,
          e.salary as base_salary,
          (COALESCE(e.transport_allowance, 0) + COALESCE(e.meal_allowance, 0) + COALESCE(e.housing_allowance, 0) + COALESCE(e.attendance_allowance, 0) + COALESCE(e.skill_allowance, 0)) as allowances,
          0 as bonuses,
          0 as tax_deduction,
          (e.salary + COALESCE(e.transport_allowance, 0) + COALESCE(e.meal_allowance, 0) + COALESCE(e.housing_allowance, 0) + COALESCE(e.attendance_allowance, 0) + COALESCE(e.skill_allowance, 0)) as net_salary,
          'Active Schedule' as status,
          'ABA Bank Transfer' as payment_method,
          e.department_id,
          e.bank_account_number,
          e.bank_name,
          e.nssf_number,
          d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'Active'
      `).all() as any[];
    }

    // Calculate NSSF and Cambodia Banking Data
    const NSSF_CEILING_KHR = 1200000; // 1,200,000 KHR (~$300 USD)
    const EXCHANGE_RATE = 4100; // 4,100 KHR per USD
    const NSSF_CEILING_USD = NSSF_CEILING_KHR / EXCHANGE_RATE; // ~$292.68 USD

    const bankDisbursement = payrollRecords.map((p) => {
      const monthlyBase = p.base_salary || 0;
      const allowances = p.allowances || 0;
      const bonuses = p.bonuses || 0;
      const gross = monthlyBase + allowances + bonuses;

      // NSSF Statutory breakdown (Cambodia Prakas)
      const contributorySalaryUsd = Math.min(monthlyBase, NSSF_CEILING_USD);
      const contributorySalaryKhr = Math.min(monthlyBase * EXCHANGE_RATE, NSSF_CEILING_KHR);

      // Pension: 2% employee, 2% employer
      const pensionEmployeeUsd = Math.round(contributorySalaryUsd * 0.02 * 100) / 100;
      const pensionEmployerUsd = Math.round(contributorySalaryUsd * 0.02 * 100) / 100;

      // Health Care: 2.6% employer
      const healthEmployerUsd = Math.round(contributorySalaryUsd * 0.026 * 100) / 100;

      // Occupational Risk: 0.8% employer
      const riskEmployerUsd = Math.round(contributorySalaryUsd * 0.008 * 100) / 100;

      const totalNssfEmployerUsd = pensionEmployerUsd + healthEmployerUsd + riskEmployerUsd;
      const totalNssfPayableUsd = pensionEmployeeUsd + totalNssfEmployerUsd;

      const bankAccountNumber = p.bank_account_number || '-';
      const nssfMemberId = p.nssf_number || '-';

      return {
        id: p.id,
        employee_id: p.employee_id,
        employee_name: `${p.first_name} ${p.last_name}`,
        role: p.role,
        department: p.department_name || 'General',
        email: p.email,
        phone: p.phone,
        bank_account_aba: bankAccountNumber,
        bank_account_acleda: bankAccountNumber,
        nssf_member_id: nssfMemberId,
        base_salary: monthlyBase,
        allowances,
        bonuses,
        gross_salary: gross,
        tax_withholding: p.tax_deduction,
        nssf_employee: pensionEmployeeUsd,
        nssf_employer: totalNssfEmployerUsd,
        nssf_total_payable: totalNssfPayableUsd,
        contributory_wage_usd: Math.round(contributorySalaryUsd * 100) / 100,
        contributory_wage_khr: Math.round(contributorySalaryKhr),
        pension_employee: pensionEmployeeUsd,
        pension_employer: pensionEmployerUsd,
        health_employer: healthEmployerUsd,
        risk_employer: riskEmployerUsd,
        net_salary_usd: p.net_salary,
        net_salary_khr: Math.round(p.net_salary * EXCHANGE_RATE),
        status: p.status,
        payment_method: p.payment_method,
      };
    }).filter((p) => deptId === 'all' || employees.some(e => e.id === p.employee_id && (deptId === 'all' || e.department_id === deptId)));

    // 5. Leave Balances & Utilization
    const leaveBalances = db.prepare(`
      SELECT 
        lb.*,
        e.first_name,
        e.last_name,
        e.role,
        e.department_id,
        d.name as department_name
      FROM leave_balances lb
      JOIN employees e ON e.id = lb.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
    `).all() as any[];

    // 6. Aggregate KPIs & Tax on Salary Records
    const companySettingsRow = db.prepare("SELECT value FROM system_meta WHERE key = 'company_settings'").get() as { value: string } | undefined;
    let companySettings: any = {
      name: "Hestra (Cambodia ) Co.,Ltd",
      khmer_name: "ហេស្រ្តា(ខេមបូឌា)ឯ.ក",
      vat_tin: "L001-902300053",
      address: "National Road 4, Royal Group Phnom Penh Special Economic Zone Lot No. P2-81 Sangkat Pleung Chhes Rotes Khan Kambol Phnom Penh",
      address_khmer: "ភ្លូវជាតិលេខ៤ តំបន់សេដ្ឋកិច្ចពិសេសរ៉ូយ៉ាល់គ្រុបភ្នំពេញ ឡូលេខៈP2-082 សង្កាត់ភ្លើងឆេះរទេះ ខណ្ឌកំបូល រាជធានីភ្នំពេញ",
      business_activity: "Manufacturing of Leather and Fabric",
      business_activity_khmer: "រោងចក្រផលិតសម្ភារៈកីឡាធ្វើពីស្បែកនិងក្រណាត់",
      currency: "USD ($) & KHR (៛)",
      hr_manager: "Mr. Te Sareat",
      finance_manager: "Mr. Met Dara",
      general_manager: "Mr. Hamamoto Tomoyuki",
      nssf_exchange_rate: 4049,
      gdt_exchange_rate: 4044
    };
    if (companySettingsRow?.value) {
      try {
        companySettings = { ...companySettings, ...JSON.parse(companySettingsRow.value) };
      } catch (e) {}
    }

    const taxOnSalaryRecords = payrollRecords.map((p) => ({
      id: p.id,
      employee_id: p.employee_id,
      khmer_name: p.khmer_name || '',
      english_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      join_date: p.join_date || '',
      working_period: p.working_period || 0,
      contract_type: p.contract_type || 'UDC',
      bank_name: p.bank_name || 'ABA Bank',
      bank_account_name: p.bank_account_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      bank_account_number: p.bank_account_number || '',
      dob: p.dob || '',
      national_id: p.national_id || '',
      gender: p.gender || 'ស្រី (Female)',
      nationality: p.nationality || 'Cambodian',
      position: p.role || '',
      department: p.department_name || '',
      basic_salary: Number(p.base_salary || 0),
      working_days: Number(p.working_days || 26),
      absent_days: Number(p.absent_days || 0),
      unpaid_days: Number(p.unpaid_days || 0),
      basic_working_salary: Number(p.basic_working_salary || p.base_salary || 0),
      seniority_bonus: Number(p.seniority_bonus || 0),
      position_allowance: Number(p.position_allowance || 0),
      sewing_skill_matrix: Number(p.sewing_skill_matrix || 0),
      skill_allowance: Number(p.skill_allowance || 0),
      transport_housing: Number(p.transport_housing || 0),
      attendance_allowance: Number(p.attendance_allowance || 0),
      food_allowance: Number(p.food_allowance || 0),
      overtime_pay: Number(p.overtime_pay || 0),
      overtime_food: Number(p.overtime_food || 0),
      achievement_bonus: Number(p.achievement_bonus || 0),
      monthly_eval_bonus: Number(p.monthly_eval_bonus || 0),
      annual_leave: Number(p.annual_leave || 0),
      salary_adjustment: Number(p.salary_adjustment || 0),
      total_salary: Number(p.gross_salary || (p.base_salary + p.allowances + p.bonuses) || 0),
      non_taxable_total: Number(p.non_taxable_amount || 0),
      pension_fund: Number(p.pension_usd || p.insurance_deduction || 0),
      taxable_salary_usd: Number(p.taxable_salary_usd || 0),
      taxable_salary_khr: Number(p.taxable_salary_khr || 0),
      dependents_count: Number(p.dependents_count || 0),
      taxable_base: Number(p.taxable_base_khr || 0),
      tax_rate: p.tax_rate || '0%',
      tax_on_salary_khr: Number(p.tax_khr || 0),
      tax_on_salary_usd: Number(p.tax_usd || p.tax_deduction || 0),
      after_tax_salary: Number(p.after_tax_salary || p.net_salary || 0),
      first_paid: Number(p.first_paid || 0),
      paid_target_bonus: Number(p.target_bonus || 0),
      second_paid: Number(p.second_paid || 0),
      total_paid: Number(p.total_paid || p.net_salary || 0),
      labor_type: p.labor_type || 'Direct Labour',
    }));

    const taxOnSalarySummary = {
      totalEmployees: taxOnSalaryRecords.length,
      totalBasicSalary: taxOnSalaryRecords.reduce((s, r) => s + r.basic_salary, 0),
      totalGrossSalary: taxOnSalaryRecords.reduce((s, r) => s + r.total_salary, 0),
      totalPensionUsd: taxOnSalaryRecords.reduce((s, r) => s + r.pension_fund, 0),
      totalTaxableUsd: taxOnSalaryRecords.reduce((s, r) => s + r.taxable_salary_usd, 0),
      totalTaxableKhr: taxOnSalaryRecords.reduce((s, r) => s + r.taxable_salary_khr, 0),
      totalTaxKhr: taxOnSalaryRecords.reduce((s, r) => s + r.tax_on_salary_khr, 0),
      totalTaxUsd: taxOnSalaryRecords.reduce((s, r) => s + r.tax_on_salary_usd, 0),
      totalAfterTaxSalary: taxOnSalaryRecords.reduce((s, r) => s + r.after_tax_salary, 0),
      totalFirstPaid: taxOnSalaryRecords.reduce((s, r) => s + r.first_paid, 0),
      totalTargetBonus: taxOnSalaryRecords.reduce((s, r) => s + r.paid_target_bonus, 0),
      totalSecondPaid: taxOnSalaryRecords.reduce((s, r) => s + r.second_paid, 0),
      totalPaid: taxOnSalaryRecords.reduce((s, r) => s + r.total_paid, 0),
    };

    const totalHeadcount = employees.length;
    const activeHeadcount = employees.filter((e) => e.status === 'Active' || e.status === 'Remote').length;
    const onLeaveHeadcount = employees.filter((e) => e.status === 'On Leave').length;

    const totalGrossPayroll = bankDisbursement.reduce((sum, item) => sum + item.gross_salary, 0);
    const totalNetDisbursement = bankDisbursement.reduce((sum, item) => sum + item.net_salary_usd, 0);
    const totalTaxWithheld = bankDisbursement.reduce((sum, item) => sum + item.tax_withholding, 0);
    const totalNssfContributions = bankDisbursement.reduce((sum, item) => sum + item.nssf_total_payable, 0);

    const totalDaysPresent = attendanceSummary.reduce((sum, item) => sum + item.present + item.remote, 0);
    const totalDaysPossible = attendanceSummary.length * 5;
    const companyAttendanceRate = totalDaysPossible > 0 ? Math.round((totalDaysPresent / totalDaysPossible) * 1000) / 10 : 96.5;

    return NextResponse.json({
      month,
      department_id: deptId,
      period: selectedPayrollPeriod,
      availablePeriods,
      companySettings,
      taxOnSalaryRecords,
      taxOnSalarySummary,
      departments,
      kpis: {
        totalHeadcount,
        activeHeadcount,
        onLeaveHeadcount,
        companyAttendanceRate,
        totalGrossPayroll,
        totalNetDisbursement,
        totalTaxWithheld,
        totalNssfContributions,
        exchangeRate: EXCHANGE_RATE,
      },
      attendanceSummary,
      bankDisbursement,
      leaveBalances: leaveBalances.filter(
        (lb) => deptId === 'all' || lb.department_id === deptId
      ),
      departmentsSummary: departments.map((dept: any) => {
        const deptEmps = employees.filter((e) => e.department_id === dept.id);
        const deptSalary = deptEmps.reduce((sum, e) => sum + Math.round(e.salary / 12), 0);
        return {
          id: dept.id,
          name: dept.name,
          color: dept.color,
          employeeCount: deptEmps.length,
          monthlySalaryBudget: deptSalary,
          sharePercent: totalHeadcount > 0 ? Math.round((deptEmps.length / totalHeadcount) * 100) : 0,
        };
      }),
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ error: 'Failed to generate report data' }, { status: 500 });
  }
}
