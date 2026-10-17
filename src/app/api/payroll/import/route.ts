import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cleanEnglishOnly } from '@/lib/translations';

export const dynamic = 'force-dynamic';

function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim().replace(/[$៛, ]/g, '').replace(/KHR/i, '');
  if (!s || s === '-' || s === '$-' || s === '#REF!') return 0;
  if (s.startsWith('(') && s.endsWith(')')) {
    const inner = s.slice(1, -1);
    const n = parseFloat(inner);
    return isNaN(n) ? 0 : -n;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function convertDate(dStr: any): string {
  if (!dStr) return new Date().toISOString().split('T')[0];
  const s = String(dStr).trim();
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return s;
}

export function parsePayrollTSV(rawText: string) {
  const clean = rawText.replace(/^\uFEFF/, '').trim();
  if (!clean) return { employees: [], headers: [], errorsHealed: 0 };

  const lines = clean.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  const dataLines = lines.filter((l) => {
    const firstCol = l.split('\t')[0].trim();
    // Employee ID usually starts with HC or EMP or is alphanumeric like HC003
    return /^(HC\d+|EMP[-_]?\d+|\d{3,})/i.test(firstCol);
  });

  const parsedEmployees: any[] = [];
  let errorsHealed = 0;

  for (const line of dataLines) {
    const p = line.split('\t').map((c) => c.trim());
    if (p.length < 15) continue;

    const empId = p[0];
    const khmerName = p[1] || '';
    const englishName = p[2] || '';
    const joinDate = convertDate(p[3]);
    const workingPeriod = cleanNum(p[4]);
    const contractRaw = (p[5] || 'UDC').toUpperCase();
    const contractType = contractRaw.includes('UDC') ? 'UDC (មិនកំណត់ថិរវេលា)' : 'FDC (កំណត់ថិរវេលា)';
    const bankName = p[6] || 'ABA Bank';
    const bankAccountName = p[7] || englishName;
    const bankAccountNum = p[8] || '';
    const dob = convertDate(p[9]);
    const nationalId = p[10] || '';
    const genderRaw = (p[11] || 'F').toUpperCase();
    const gender = genderRaw.includes('M') ? 'ប្រុស (Male)' : 'ស្រី (Female)';
    const nationality = cleanEnglishOnly(p[12]) || 'Cambodian';
    const position = p[13] || 'Sewing Worker';

    const basicSalary = cleanNum(p[14]);
    const workingDays = cleanNum(p[15]) || 26;
    const absentDays = cleanNum(p[16]);
    const unpaidDays = cleanNum(p[17]);
    const basicWorkingSalary = cleanNum(p[18]) || basicSalary;
    const seniorityBonus = cleanNum(p[19]);
    const positionAllowance = cleanNum(p[20]);
    const sewingSkillMatrix = cleanNum(p[21]);
    const skillAllowance = cleanNum(p[22]);
    const transportHousing = cleanNum(p[23]);
    const attendanceAllowance = cleanNum(p[24]);
    const foodAllowance = cleanNum(p[25]);
    const overtimePay = cleanNum(p[26]);
    const overtimeFood = cleanNum(p[27]);
    const achievementBonus = cleanNum(p[28]);
    const monthlyEvalBonus = cleanNum(p[29]);
    const annualLeave = cleanNum(p[30]);
    const taxOnSeniority = cleanNum(p[31]);
    const salaryAdjustment = cleanNum(p[32]);
    const totalSalary = cleanNum(p[33]) || (basicWorkingSalary + seniorityBonus + positionAllowance + sewingSkillMatrix + skillAllowance + transportHousing + attendanceAllowance + foodAllowance + overtimePay + overtimeFood + achievementBonus + monthlyEvalBonus + annualLeave + salaryAdjustment);
    const nonTaxableTotal = cleanNum(p[34]) || (totalSalary - transportHousing);
    const pensionFund = cleanNum(p[35]) || 5.93;
    const taxableSalaryUsd = cleanNum(p[36]) || (nonTaxableTotal - pensionFund);
    const taxableSalaryKhr = cleanNum(p[37]) || Math.round(taxableSalaryUsd * 4044);
    const spouse = cleanNum(p[38]);
    const minorChildren = cleanNum(p[39]);
    const deductAmount = cleanNum(p[40]) || (spouse + minorChildren) * 150000;
    const taxableBase = cleanNum(p[41]) || Math.max(0, taxableSalaryKhr - deductAmount);
    const taxRate = p[42] || '0%';
    const taxOnSalaryKhr = cleanNum(p[43]);
    const taxOnSalaryUsd = cleanNum(p[44]) || Math.round((taxOnSalaryKhr / 4044) * 100) / 100;
    const afterTaxSalary = cleanNum(p[45]) || Math.round((totalSalary - taxOnSalaryUsd - pensionFund) * 100) / 100;

    const cashAdj = cleanNum(p[46]);
    const firstPaid = cleanNum(p[47]);
    const paidTargetBonus = cleanNum(p[48]);
    const paidFoodFee = cleanNum(p[49]);
    const severancePay = cleanNum(p[50]);
    const seniorityPayback = cleanNum(p[51]);
    const paidFinalSalary = cleanNum(p[52]);

    // Check for #REF! or missing values in Second Paid & Total Paid
    const rawSecondPaid = p[53] || '';
    const rawTotalPaid = p[54] || '';

    let secondPaid = cleanNum(rawSecondPaid);
    let totalPaid = cleanNum(rawTotalPaid);

    if (!secondPaid || rawSecondPaid.includes('#REF!') || secondPaid <= 0) {
      secondPaid = Math.round((afterTaxSalary - firstPaid - paidTargetBonus - paidFoodFee) * 100) / 100;
      errorsHealed++;
    }
    if (!totalPaid || rawTotalPaid.includes('#REF!') || totalPaid <= 0) {
      totalPaid = Math.round((firstPaid + paidTargetBonus + paidFoodFee + secondPaid) * 100) / 100;
    }

    const laborType = p[56] && p[56].toLowerCase().includes('indirect') ? 'Indirect Labour' : 'Direct Labour';

    parsedEmployees.push({
      id: empId,
      khmer_name: khmerName,
      english_name: englishName,
      join_date: joinDate,
      working_period: workingPeriod,
      contract_type: contractType,
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNum,
      dob,
      national_id: nationalId,
      gender,
      nationality,
      position,
      basic_salary: basicSalary,
      working_days: workingDays,
      absent_days: absentDays,
      unpaid_days: unpaidDays,
      basic_working_salary: basicWorkingSalary,
      seniority_bonus: seniorityBonus,
      position_allowance: positionAllowance,
      sewing_skill_matrix: sewingSkillMatrix,
      skill_allowance: skillAllowance,
      transport_housing: transportHousing,
      attendance_allowance: attendanceAllowance,
      food_allowance: foodAllowance,
      overtime_pay: overtimePay,
      overtime_food: overtimeFood,
      achievement_bonus: achievementBonus,
      monthly_eval_bonus: monthlyEvalBonus,
      annual_leave: annualLeave,
      tax_on_seniority: taxOnSeniority,
      salary_adjustment: salaryAdjustment,
      total_salary: totalSalary,
      non_taxable_total: nonTaxableTotal,
      pension_fund: pensionFund,
      taxable_salary_usd: taxableSalaryUsd,
      taxable_salary_khr: taxableSalaryKhr,
      spouse,
      minor_children: minorChildren,
      deduct_amount: deductAmount,
      taxable_base: taxableBase,
      tax_rate: taxRate,
      tax_on_salary_khr: taxOnSalaryKhr,
      tax_on_salary_usd: taxOnSalaryUsd,
      after_tax_salary: afterTaxSalary,
      first_paid: firstPaid,
      paid_target_bonus: paidTargetBonus,
      paid_food_fee: paidFoodFee,
      severance_pay: severancePay,
      seniority_payback: seniorityPayback,
      paid_final_salary: paidFinalSalary,
      second_paid: secondPaid,
      total_paid: totalPaid,
      labor_type: laborType,
    });
  }

  return { employees: parsedEmployees, errorsHealed };
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { tsvText, period = 'August 2026', paymentDate = '2026-08-31', commit = true } = body;

    if (!tsvText || typeof tsvText !== 'string') {
      return NextResponse.json({ error: 'Missing tsvText payload string.' }, { status: 400 });
    }

    const { employees, errorsHealed } = parsePayrollTSV(tsvText);

    if (employees.length === 0) {
      return NextResponse.json({
        error: 'No valid employee lines starting with HC or EMP were recognized in the TSV data.',
      }, { status: 400 });
    }

    // Calculate totals for preview
    const totalBasic = employees.reduce((acc, e) => acc + e.basic_salary, 0);
    const totalGross = employees.reduce((acc, e) => acc + e.total_salary, 0);
    const totalPension = employees.reduce((acc, e) => acc + e.pension_fund, 0);
    const totalTaxUsd = employees.reduce((acc, e) => acc + e.tax_on_salary_usd, 0);
    const totalTaxKhr = employees.reduce((acc, e) => acc + e.tax_on_salary_khr, 0);
    const totalNetDisbursed = employees.reduce((acc, e) => acc + e.total_paid, 0);
    const totalFirstPaid = employees.reduce((acc, e) => acc + e.first_paid, 0);
    const totalSecondPaid = employees.reduce((acc, e) => acc + e.second_paid, 0);

    // If commit is false, return preview only
    if (!commit) {
      return NextResponse.json({
        success: true,
        preview: true,
        count: employees.length,
        errorsHealed,
        totals: {
          totalBasic,
          totalGross,
          totalPension,
          totalTaxUsd,
          totalTaxKhr,
          totalNetDisbursed,
          totalFirstPaid,
          totalSecondPaid,
        },
        sample: employees.slice(0, 10),
      });
    }

    // Save into database in an atomic transaction
    const nowIso = new Date().toISOString();

    const insertEmp = db.prepare(`
      INSERT INTO employees (
        id, first_name, last_name, khmer_name, email, phone, role, department_id,
        employment_type, employee_type, status, salary, join_date, avatar, location,
        gender, dob, nationality, national_id, contract_type,
        bank_name, bank_account_name, bank_account_number,
        nssf_member, nssf_number, transport_allowance, attendance_allowance,
        meal_allowance, skill_allowance, seniority_bonus, position_allowance,
        sewing_skill_matrix, labor_type, working_period, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, '', ?, ?,
        'ពេញម៉ោង (Full-Time)', 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)', 'Active', ?, ?, '', 'Phnom Penh',
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        'មាន (Yes)', ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        khmer_name = excluded.khmer_name,
        role = excluded.role,
        department_id = excluded.department_id,
        salary = excluded.salary,
        join_date = excluded.join_date,
        gender = excluded.gender,
        dob = excluded.dob,
        national_id = excluded.national_id,
        contract_type = excluded.contract_type,
        bank_name = excluded.bank_name,
        bank_account_name = excluded.bank_account_name,
        bank_account_number = excluded.bank_account_number,
        transport_allowance = excluded.transport_allowance,
        attendance_allowance = excluded.attendance_allowance,
        meal_allowance = excluded.meal_allowance,
        skill_allowance = excluded.skill_allowance,
        seniority_bonus = excluded.seniority_bonus,
        position_allowance = excluded.position_allowance,
        sewing_skill_matrix = excluded.sewing_skill_matrix,
        labor_type = excluded.labor_type,
        working_period = excluded.working_period
    `);

    const insertPay = db.prepare(`
      INSERT INTO payrolls (
        id, employee_id, pay_period, payment_date, base_salary,
        allowances, bonuses, tax_deduction, insurance_deduction, other_deductions,
        net_salary, status, payment_method, created_at,
        working_days, absent_days, unpaid_days, basic_working_salary,
        seniority_bonus, position_allowance, sewing_skill_matrix, skill_allowance,
        transport_housing, attendance_allowance, food_allowance,
        overtime_pay, overtime_food, achievement_bonus, monthly_eval_bonus,
        annual_leave, salary_adjustment, gross_salary, non_taxable_amount,
        taxable_salary_usd, taxable_salary_khr, pension_usd, pension_khr,
        dependents_count, taxable_base_khr, tax_rate, tax_khr, tax_usd,
        after_tax_salary, first_paid, target_bonus,
        severance_pay, seniority_payback, paid_final_salary,
        second_paid, total_paid,
        labor_type, exchange_rate_khr, nssf_rate_khr
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 0,
        ?, 'Paid', 'ABA Direct Transfer', ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, 4044, 4049
      )
      ON CONFLICT(id) DO UPDATE SET
        base_salary = excluded.base_salary,
        allowances = excluded.allowances,
        bonuses = excluded.bonuses,
        tax_deduction = excluded.tax_deduction,
        insurance_deduction = excluded.insurance_deduction,
        net_salary = excluded.net_salary,
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
        labor_type = excluded.labor_type
    `);

    function getDeptId(pos: string): string {
      const p = pos.toLowerCase();
      if (p.includes('sewing') || p.includes('pattern')) return 'dept-prod';
      if (p.includes('qc')) return 'dept-qc';
      if (p.includes('cutting')) return 'dept-cut';
      if (p.includes('warehouse') || p.includes('setting') || p.includes('packing')) return 'dept-wh';
      if (p.includes('repair') || p.includes('maint')) return 'dept-maint';
      if (p.includes('turnover')) return 'dept-turn';
      if (p.includes('delivery') || p.includes('cleaner')) return 'dept-admin';
      return 'dept-prod';
    }

    const tx = db.transaction(() => {
      for (const e of employees) {
        const deptId = getDeptId(e.position);
        const nameParts = e.english_name.split(/\s+/);
        let lastName = e.english_name;
        let firstName = e.english_name;
        if (nameParts.length >= 2) {
          lastName = nameParts[0];
          firstName = nameParts.slice(1).join(' ');
        }
        const email = `${e.id.toLowerCase()}@outlook.com`;

        // 1. Employee
        insertEmp.run(
          e.id, firstName, lastName, e.khmer_name, email, e.position, deptId,
          e.basic_salary, e.join_date,
          e.gender, e.dob, e.nationality, e.national_id, e.contract_type,
          e.bank_name, e.bank_account_name, e.bank_account_number,
          e.national_id, e.transport_housing, e.attendance_allowance,
          e.food_allowance, e.skill_allowance, e.seniority_bonus, e.position_allowance,
          e.sewing_skill_matrix, e.labor_type, e.working_period, nowIso
        );

        // 2. Payroll Record
        const payId = `pay-${period.toLowerCase().replace(/[\s_]+/g, '-')}-${e.id.toLowerCase()}`;
        const allowances = Math.round((e.transport_housing + e.attendance_allowance + e.food_allowance + e.position_allowance + e.sewing_skill_matrix + e.skill_allowance) * 100) / 100;
        const bonuses = Math.round((e.seniority_bonus + e.overtime_pay + e.overtime_food + e.achievement_bonus + e.monthly_eval_bonus + e.annual_leave + e.salary_adjustment) * 100) / 100;

        insertPay.run(
          payId, e.id, period, paymentDate, e.basic_salary,
          allowances, bonuses, e.tax_on_salary_usd, e.pension_fund,
          e.total_paid, nowIso,
          e.working_days, e.absent_days, e.unpaid_days, e.basic_working_salary,
          e.seniority_bonus, e.position_allowance, e.sewing_skill_matrix, e.skill_allowance,
          e.transport_housing, e.attendance_allowance, e.food_allowance,
          e.overtime_pay, e.overtime_food, e.achievement_bonus, e.monthly_eval_bonus,
          e.annual_leave, e.salary_adjustment, e.total_salary, e.non_taxable_total,
          e.taxable_salary_usd, e.taxable_salary_khr, e.pension_fund, Math.round(e.pension_fund * 4049),
          e.spouse + e.minor_children, e.taxable_base, e.tax_rate, e.tax_on_salary_khr, e.tax_on_salary_usd,
          e.after_tax_salary, e.first_paid, e.paid_target_bonus,
          e.severance_pay || 0, e.seniority_payback || 0, e.paid_final_salary || 0,
          e.second_paid, e.total_paid,
          e.labor_type
        );
      }
    });

    tx();

    return NextResponse.json({
      success: true,
      count: employees.length,
      errorsHealed,
      period,
      paymentDate,
      totals: {
        totalBasic,
        totalGross,
        totalPension,
        totalTaxUsd,
        totalTaxKhr,
        totalNetDisbursed,
        totalFirstPaid,
        totalSecondPaid,
      },
    });
  } catch (error: any) {
    console.error('Error importing monthly payroll:', error);
    return NextResponse.json({ error: error.message || 'Internal import error' }, { status: 500 });
  }
}
