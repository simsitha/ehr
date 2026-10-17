import { DEFAULT_PAYROLL_RULES, calculateHourlyRate, calculateTaxOnSalary } from './payrollRules';
import { evaluateNonAbsentBonus, evaluateSeniorityBonusFromJoinDate, getMonthlySewingBonusTotal } from './bonusEngine';
import { Employee, PayrollRecord, PayrollRulesConfig, isBoardMember } from './types';

export interface AuthoritativePayrollResult {
  payroll: Partial<PayrollRecord>;
  trace: {
    steps: Array<{ title: string; formula: string; result: string | number }>;
    formula_definitions: Record<string, string>;
  };
}

/**
 * Resolves a canonical 'YYYY-MM' key from a pay period name or ID.
 * Supports: 'October 2026', 'September 2026', 'August 2026', 'period-2026-10', '2026-10', Khmer month names, etc.
 */
export function parseMonthKeyFromPeriod(payPeriodName?: string, periodId?: string): string {
  if (periodId) {
    const idMatch = periodId.match(/(\d{4})-(\d{2})/);
    if (idMatch) return `${idMatch[1]}-${idMatch[2]}`;
  }

  if (!payPeriodName) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const directMatch = payPeriodName.match(/(\d{4})-(\d{2})/);
  if (directMatch) return `${directMatch[1]}-${directMatch[2]}`;

  const yearMatch = payPeriodName.match(/\b(20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  const lower = payPeriodName.toLowerCase();
  const months: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  for (const [abbr, mm] of Object.entries(months)) {
    if (lower.includes(abbr)) {
      return `${year}-${mm}`;
    }
  }

  const khmerMonths: Record<string, string> = {
    'មករា': '01',
    'កុម្ភៈ': '02',
    'មីនា': '03',
    'មេសា': '04',
    'ឧសភា': '05',
    'មិថុនា': '06',
    'កក្កដា': '07',
    'សីហា': '08',
    'កញ្ញា': '09',
    'តុលា': '10',
    'វិច្ឆិកា': '11',
    'ធ្នូ': '12',
  };

  for (const [km, mm] of Object.entries(khmerMonths)) {
    if (lower.includes(km)) {
      return `${year}-${mm}`;
    }
  }

  return `${year}-10`;
}

/**
 * Computes authoritative factory payroll for an employee in a given period.
 * Adheres to 8.2 2nd Payroll Test.xlsx calculations and Cambodia labor laws.
 * Note: Members of the Board of Directors are exempt from salary and payroll processing.
 */
export function computeEmployeePayroll(
  employee: Partial<Employee>,
  periodId: string,
  payPeriodName: string,
  options?: {
    rulesConfig?: PayrollRulesConfig;
    absentDays?: number;
    unpaidDays?: number;
    halfDays?: number;
    overtimeHours?: number;
    sewingBonus?: number;
    monthlyEvalBonus?: number;
    severancePay?: number;
    seniorityPayback?: number;
    paidFinalSalary?: number;
    firstPaidAdvance?: number;
    paidFoodFee?: number;
    dependentsCount?: number;
    foodAllowanceOverride?: number;
    actualWorkingDays?: number;
    workedDays?: number;
    transportHousingOverride?: number;
    attendanceBonusOverride?: number;
    attendanceBonusTier?: string;
    positionAllowanceOverride?: number;
  }
): AuthoritativePayrollResult {
  // Members of Board of Directors do not need salary / payroll processing
  if (isBoardMember(employee)) {
    const payPeriodKey = parseMonthKeyFromPeriod(payPeriodName, periodId);
    return {
      payroll: {
        id: `pay-${periodId}-${employee.id}`,
        employee_id: employee.id || '',
        pay_period: payPeriodName,
        payment_date: `${payPeriodKey}-31`,
        period_id: periodId,
        base_salary: 0,
        gross_salary: 0,
        net_salary: 0,
        tax_deduction: 0,
        insurance_deduction: 0,
        other_deductions: 0,
        allowances: 0,
        bonuses: 0,
        status: 'Paid',
        calculation_trace: JSON.stringify({
          exempt: true,
          reason: 'Member of the Board of Directors is exempt from salary and payroll processing.',
        }),
      },
      trace: {
        steps: [
          {
            title: 'Board of Directors Exemption',
            formula: 'Board Member = Exempt from Salary',
            result: '$0.00 (Exempt)',
          },
        ],
        formula_definitions: {
          BOD_EXEMPT: 'Members of the Board of Directors do not receive salary or attend operational duties.',
        },
      },
    };
  }
  const rules = options?.rulesConfig || DEFAULT_PAYROLL_RULES;

  const basicSalary = employee.salary || 210.0;
  const workingDays = rules.working_days_per_month || 26;
  const hoursPerDay = rules.daily_working_hours || 8;
  const absentDays = options?.absentDays ?? 0;
  const unpaidDays = options?.unpaidDays ?? (absentDays > 0 ? absentDays : 0);

  // Trace steps collector
  const steps: Array<{
    title: string;
    title_km?: string;
    formula: string;
    result: string | number;
    explanation?: string;
    explanation_km?: string;
    legal_reference?: string;
  }> = [];

  // 1. Basic Working Salary = Basic - (Basic / WorkingDays * UnpaidDays)
  const dailyRate = Math.round((basicSalary / workingDays) * 10000) / 10000;
  const unpaidDeduction = Math.round(dailyRate * unpaidDays * 100) / 100;
  const basicWorkingSalary = Math.max(0, Math.round((basicSalary - unpaidDeduction) * 100) / 100);
  steps.push({
    title: 'Basic Working Salary',
    title_km: 'ប្រាក់ខែគោលបំពេញការងារ',
    formula: `$${basicSalary} - ($${basicSalary} / ${workingDays} × ${unpaidDays} unpaid days)`,
    result: `$${basicWorkingSalary.toFixed(2)}`,
    explanation: `Calculated by deducting unpaid absences from the monthly basic wage based on ${workingDays} scheduled working days. Daily rate is $${dailyRate.toFixed(2)}/day.`,
    explanation_km: `គណនាដោយកាត់កងថ្ងៃអវត្តមានឥតច្បាប់ចេញពីប្រាក់ខែគោលផ្អែកលើ ${workingDays} ថ្ងៃធ្វើការក្នុងមួយខែ។ អត្រាប្រចាំថ្ងៃគឺ $${dailyRate.toFixed(2)}/ថ្ងៃ។`,
    legal_reference: 'Labor Law Standard Base (26 days/mo)',
  });

  // 2. Seniority Bonus (calculated from Join Date)
  const joinDate = employee.join_date || '2024-01-01';
  let refDateStr: string | undefined;
  try {
    const monthKey = parseMonthKeyFromPeriod(payPeriodName, periodId);
    const [pYear, pMonth] = monthKey.split('-').map(Number);
    if (pYear && pMonth) {
      // Last day of the payroll period month
      const lastDayOfMonth = new Date(Date.UTC(pYear, pMonth, 0));
      refDateStr = lastDayOfMonth.toISOString().split('T')[0];
    }
  } catch {}

  const { yearsWorked, bonusAmount: seniorityBonus } = evaluateSeniorityBonusFromJoinDate(
    joinDate,
    refDateStr,
    rules.seniority_tiers
  );
  steps.push({
    title: 'Seniority Bonus',
    title_km: 'ប្រាក់រង្វាន់អតីតភាពការងារ',
    formula: `Join Date: ${joinDate} → ${yearsWorked} complete years worked → scale lookup`,
    result: `$${seniorityBonus.toFixed(2)}`,
    explanation: `Awarded for continuous tenure: $0 (<1 yr), $1 (1 yr), $2 (2 yrs), $3 (3 yrs), $4 (4 yrs), $5 (5 yrs), $6 (6 yrs), increasing by $1/yr up to the statutory cap of $11/mo.`,
    explanation_km: `ផ្ដល់ជូនតាមរយៈពេលការងារជាប់លាប់៖ $០ (<១ ឆ្នាំ), $១ (១ ឆ្នាំ), $២ (២ ឆ្នាំ), $៣ (៣ ឆ្នាំ), $៤ (៤ ឆ្នាំ), $៥ (៥ ឆ្នាំ), $៦ (៦ ឆ្នាំ) កើនឡើង $១/ឆ្នាំ រហូតដល់កម្រិតអតិបរមា $១១/ខែ។`,
    legal_reference: 'Prakas No. 017/00 & Art. 89',
  });

  // 3. Position and Skill Allowances
  const positionAllowance = options?.positionAllowanceOverride !== undefined
    ? options.positionAllowanceOverride
    : (employee.position_allowance ?? 0);
  const sewingSkillMatrix = employee.sewing_skill_matrix ?? 0;
  const skillAllowance = employee.skill_allowance ?? 0;
  steps.push({
    title: 'Position & Skill Allowances',
    title_km: 'ប្រាក់ឧបត្ថម្ភមុខតំណែង និងជំនាញ',
    formula: `Pos: $${positionAllowance} + Matrix: $${sewingSkillMatrix} + Skill: $${skillAllowance}`,
    result: `$${(positionAllowance + sewingSkillMatrix + skillAllowance).toFixed(2)}`,
    explanation: `Sum of supervisory position allowance, sewing technical skill matrix, and special craftsmanship allowance.`,
    explanation_km: `សរុបប្រាក់ឧបត្ថម្ភមុខតំណែងគ្រប់គ្រង តារាងជំនាញបច្ចេកទេសដេរ និងប្រាក់លើកទឹកចិត្តជំនាញវិជ្ជាជីវៈ។`,
    legal_reference: 'Factory Technical Scale',
  });

  // 4. Housing - Transport Allowance (Non-taxable fringe benefit under Cambodia Law)
  // Standard Factory Policy: $16.00 monthly.
  // Less than or equal to 8 days worked: get $8.00. Over 8 days: get $16.00.
  const baseMonthlyRate = (rules.housing_transport_monthly ?? 16.0);
  const halfAmountRate = (rules.housing_transport_half_amount ?? 8.0);
  const thresholdDays = (rules.housing_transport_threshold_days ?? 8);

  // Compute days worked in the month
  let daysWorked: number;
  if (options?.actualWorkingDays !== undefined) {
    daysWorked = options.actualWorkingDays;
  } else if (options?.workedDays !== undefined) {
    daysWorked = options.workedDays;
  } else {
    const periodKey = parseMonthKeyFromPeriod(payPeriodName, periodId);
    const [pYear, pMonth] = periodKey.split('-').map((v) => parseInt(v, 10));
    const totalDaysInMonth = new Date(pYear, pMonth, 0).getDate();
    const periodStart = `${periodKey}-01`;
    const periodEnd = `${periodKey}-${String(totalDaysInMonth).padStart(2, '0')}`;

    let scheduledDaysForEmp = 0;
    const empJoinDate = employee.join_date;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${periodKey}-${String(d).padStart(2, '0')}`;
      const dow = new Date(pYear, pMonth - 1, d).getDay();
      if (dow !== 0) {
        if (!empJoinDate || dStr >= empJoinDate) {
          scheduledDaysForEmp++;
        }
      }
    }

    const scheduledBase = scheduledDaysForEmp > 0 ? scheduledDaysForEmp : workingDays;
    const effectiveAbsent = Math.max(unpaidDays, absentDays);
    daysWorked = Math.max(0, scheduledBase - effectiveAbsent);
  }

  // Check if employee has a custom higher allowance (e.g. senior officer $50)
  const combinedHousingTransport = (Number(employee.transport_allowance || 0) + Number(employee.housing_allowance || 0));
  const fullMonthlyAllowance = combinedHousingTransport > 16.0
    ? combinedHousingTransport
    : baseMonthlyRate;

  let transportHousing: number;
  if (options?.transportHousingOverride !== undefined) {
    transportHousing = options.transportHousingOverride;
  } else if (daysWorked <= 0) {
    transportHousing = 0;
  } else if (daysWorked <= thresholdDays) {
    // ≤ 8 days: get $8.00 (or 50% for custom allowances)
    transportHousing = fullMonthlyAllowance > 16.0
      ? Math.round((fullMonthlyAllowance * 0.5) * 100) / 100
      : halfAmountRate;
  } else {
    // > 8 days: get $16.00 (or full custom allowance)
    transportHousing = fullMonthlyAllowance;
  }

  steps.push({
    title: 'Housing - Transport Allowance',
    title_km: 'ប្រាក់ឧបត្ថម្ភការស្នាក់នៅ និងធ្វើដំណើរ',
    formula: daysWorked <= thresholdDays
      ? `Days Worked (${daysWorked.toFixed(1)}) ≤ ${thresholdDays} days → $${transportHousing.toFixed(2)} (Half Allowance)`
      : `Days Worked (${daysWorked.toFixed(1)}) > ${thresholdDays} days → $${transportHousing.toFixed(2)} (Full Allowance)`,
    result: `$${transportHousing.toFixed(2)}`,
    explanation: daysWorked <= thresholdDays
      ? `Worked ${daysWorked.toFixed(1)} days (≤ ${thresholdDays} days threshold). Entitled to half-month allowance of $${transportHousing.toFixed(2)}. Fully non-taxable fringe benefit under Cambodia labor regulations.`
      : `Worked ${daysWorked.toFixed(1)} days (> ${thresholdDays} days threshold). Entitled to full monthly allowance of $${transportHousing.toFixed(2)}. Fully non-taxable fringe benefit under Cambodia labor regulations.`,
    explanation_km: daysWorked <= thresholdDays
      ? `បំពេញការងារបាន ${daysWorked.toFixed(1)} ថ្ងៃ (≤ ${thresholdDays} ថ្ងៃ)។ ទទួលបានប្រាក់ឧបត្ថម្ភការស្នាក់នៅ និងធ្វើដំណើរកន្លះខែចំនួន $${transportHousing.toFixed(2)} (មិនជាប់ពន្ធ)។`
      : `បំពេញការងារបាន ${daysWorked.toFixed(1)} ថ្ងៃ (លើសពី ${thresholdDays} ថ្ងៃ)។ ទទួលបានប្រាក់ឧបត្ថម្ភការស្នាក់នៅ និងធ្វើដំណើរពេញមួយខែចំនួន $${transportHousing.toFixed(2)} (មិនជាប់ពន្ធ)។`,
    legal_reference: 'GDT Circular No. 011 & Factory Transport Policy ($16/mo, $8 if ≤8 days)',
  });

  // 5. Attendance Allowance (Authoritative Attendance Bonus / Non-Absent Incentive)
  let attendanceAllowance: number;
  let isAttendanceEligible: boolean;
  let attendanceBonusTierName: string = '';

  if (options?.attendanceBonusOverride !== undefined) {
    attendanceAllowance = Math.round(Number(options.attendanceBonusOverride) * 100) / 100;
    isAttendanceEligible = attendanceAllowance > 0;
    attendanceBonusTierName = options.attendanceBonusTier || (attendanceAllowance >= 20 ? 'Tier 1 ($20.00)' : attendanceAllowance >= 15 ? 'Tier 2 ($15.00)' : attendanceAllowance >= 10 ? 'Tier 3 ($10.00)' : attendanceAllowance >= 5 ? 'Tier 4 ($5.00)' : 'Ineligible ($0.00)');
  } else {
    const nonAbsent = evaluateNonAbsentBonus(absentDays, unpaidDays, rules);
    attendanceAllowance = nonAbsent.amount;
    isAttendanceEligible = nonAbsent.isEligible;
    attendanceBonusTierName = nonAbsent.isEligible ? 'Full Attendance ($15.00)' : 'Ineligible ($0.00)';
  }

  steps.push({
    title: 'Attendance Bonus / Non-Absent Allowance',
    title_km: 'ប្រាក់រង្វាន់វត្តមានទៀងទាត់ (Attendance Bonus)',
    formula: attendanceBonusTierName
      ? `${attendanceBonusTierName} → $${attendanceAllowance.toFixed(2)}`
      : `Absent: ${absentDays}, Unpaid: ${unpaidDays} → $${attendanceAllowance.toFixed(2)}`,
    result: `$${attendanceAllowance.toFixed(2)}`,
    explanation: attendanceAllowance > 0
      ? `Qualified for monthly attendance bonus under approved tiered attendance structure (${attendanceBonusTierName}). Rewarding punctual, continuous line attendance.`
      : `Ineligible for attendance bonus ($0.00) due to insufficient attendance days or recorded unauthorized absences.`,
    explanation_km: attendanceAllowance > 0
      ? `ទទួលបានប្រាក់រង្វាន់វត្តមានទៀងទាត់ប្រចាំខែតាមកម្រិតអនុម័ត (${attendanceBonusTierName}) ដើម្បីលើកទឹកចិត្តដល់ការបំពេញការងារជាប់លាប់។`
      : `មិនទទួលបានប្រាក់រង្វាន់វត្តមាន ($០.០០) ដោយសារមិនទាន់គ្រប់ចំនួនថ្ងៃកំណត់ ឬមានអវត្តមាន។`,
    legal_reference: 'Factory Attendance Bonus Tier Policy ($20 / $15 / $10 / $5)',
  });

  // 6. Food / Meal Allowance ($2.50/day, $0 if absent/unpaid or 0.5 day)
  const mealDailyRate = rules.meal_allowance_per_day ?? 2.5;
  const standardFullMonthMeal = Math.round(workingDays * mealDailyRate * 100) / 100;

  let foodAllowance: number;
  let baseMealAllowance: number;
  let mealDeduction: number;
  let mealCutOffDays: number;

  const effectiveAbsent = Math.max(unpaidDays, absentDays);
  const halfDaysCount = options?.halfDays ?? 0;
  if (halfDaysCount > 0) {
    const fullDays = Math.max(0, Math.floor(effectiveAbsent - (halfDaysCount * 0.5)));
    mealCutOffDays = fullDays + halfDaysCount;
  } else {
    mealCutOffDays = Math.ceil(effectiveAbsent);
  }

  if (options?.foodAllowanceOverride !== undefined) {
    foodAllowance = options.foodAllowanceOverride;
    baseMealAllowance = foodAllowance;
    mealDeduction = 0;
    mealCutOffDays = 0;
  } else {
    baseMealAllowance = (employee.meal_allowance && Number(employee.meal_allowance) > standardFullMonthMeal)
      ? Number(employee.meal_allowance)
      : standardFullMonthMeal;
    mealDeduction = Math.round(mealCutOffDays * mealDailyRate * 100) / 100;
    foodAllowance = Math.max(0, Math.round((baseMealAllowance - mealDeduction) * 100) / 100);
  }

  steps.push({
    title: 'Meal Allowance',
    title_km: 'ប្រាក់ឧបត្ថម្ភអាហារ (ថ្លៃបាយ)',
    formula: mealCutOffDays > 0
      ? `Base ($${baseMealAllowance.toFixed(2)}) - (${mealCutOffDays} day(s) cut off [absent/0.5d = $0] × $${mealDailyRate.toFixed(2)})`
      : `${workingDays} working days × $${mealDailyRate.toFixed(2)}/day`,
    result: `$${foodAllowance.toFixed(2)}`,
    explanation: mealCutOffDays > 0
      ? `Meal allowance is $${mealDailyRate.toFixed(2)}/day ($${baseMealAllowance.toFixed(2)}/mo base for ${workingDays} working days). Absent (unpaid) or 0.5-day absent days receive $0 for that day. Deducted $${mealDeduction.toFixed(2)} (${mealCutOffDays} day(s) cut off at $${mealDailyRate.toFixed(2)}/day).`
      : `Full monthly meal allowance of $${mealDailyRate.toFixed(2)}/day for ${workingDays} working days ($${foodAllowance.toFixed(2)}) with 0 absent days.`,
    explanation_km: mealCutOffDays > 0
      ? `ប្រាក់ឧបត្ថម្ភអាហារ $${mealDailyRate.toFixed(2)} ក្នុងមួយថ្ងៃ (ប្រាក់គោល $${baseMealAllowance.toFixed(2)}/ខែ ផ្អែកលើ ${workingDays} ថ្ងៃធ្វើការ)។ អវត្តមានឥតច្បាប់ ឬអវត្តមានកន្លះថ្ងៃ (០.៥ ថ្ងៃ) គឺទទួលបាន $០ សម្រាប់ថ្ងៃនោះ (កាត់ $${mealDailyRate.toFixed(2)} ក្នុងមួយថ្ងៃ)។ បានកាត់កងចំនួន $${mealDeduction.toFixed(2)} (សរុប ${mealCutOffDays} ថ្ងៃកាត់ផ្តាច់)។`
      : `ប្រាក់ឧបត្ថម្ភអាហារពេញលេញ $${mealDailyRate.toFixed(2)} ក្នុងមួយថ្ងៃ សម្រាប់ ${workingDays} ថ្ងៃធ្វើការ ($${foodAllowance.toFixed(2)}) ដោយសារគ្មានការអវត្តមាន។`,
    legal_reference: 'Factory Meal Policy ($2.50/day, $0 if absent or 0.5 day)',
  });

  // 7. Overtime Pay
  const hourlyRate = calculateHourlyRate(basicSalary, workingDays, hoursPerDay);
  const otHours = options?.overtimeHours ?? 0;
  const otMultiplier = rules.ot_multiplier_normal || 1.5;
  const overtimePay = Math.round(hourlyRate * otMultiplier * otHours * 100) / 100;
  const overtimeFood = otHours >= 2 ? Math.round((otHours / 2) * 1.5 * 100) / 100 : 0;
  steps.push({
    title: 'Overtime Pay & Meal Allowance',
    title_km: 'ប្រាក់ឈ្នួលថែមម៉ោង និងថ្លៃបាយថែមម៉ោង',
    formula: `Base Hourly ($${hourlyRate}) × ${otMultiplier} × ${otHours}h + OT Food ($${overtimeFood})`,
    result: `$${(overtimePay + overtimeFood).toFixed(2)}`,
    explanation: `Base hourly rate = $${basicSalary} / 26 / 8 = $${hourlyRate}/h. Overtime calculated at ${otMultiplier}x multiplier plus $1.50 meal allowance per 2h of overtime.`,
    explanation_km: `អត្រាមូលដ្ឋានក្នុងមួយម៉ោង = $${basicSalary} / ២៦ / ៨ = $${hourlyRate}/ម៉ោង។ ប្រាក់ថែមម៉ោងគិតគុណនឹង ${otMultiplier} ដង បូកបន្ថែមថ្លៃបាយ $១.៥០ ក្នុង ២ ម៉ោង OT។`,
    legal_reference: 'Labor Law Article 139 (150% / 200%)',
  });

  // 8. Weekly Sewing Production Bonus (Achievement Bonus)
  let achievementBonus = options?.sewingBonus ?? 0;
  if (!options?.sewingBonus && employee.id) {
    const monthKey = parseMonthKeyFromPeriod(payPeriodName, periodId);
    achievementBonus = getMonthlySewingBonusTotal(employee.id, monthKey);
  }
  steps.push({
    title: 'Sewing Production Target Bonus',
    title_km: 'ប្រាក់រង្វាន់គោលដៅផលិតផលដេរ (Achievement)',
    formula: `Monthly sum of approved weekly line targets (T1: $10, T2: $15, T3: $20)`,
    result: `$${achievementBonus.toFixed(2)}`,
    explanation: `Weekly performance incentives awarded when the sewing line meets or exceeds output targets (100% = $10, 110% = $15, 120% = $20).`,
    explanation_km: `ប្រាក់លើកទឹកចិត្តប្រចាំសប្តាហ៍ផ្ដល់ជូននៅពេលខ្សែសង្វាក់ដេរសម្រេចបានលើសគោលដៅកំណត់ (១០០% = $១០, ១១០% = $១៥, ១២០% = $២០)។`,
    legal_reference: 'Factory Production Target Matrix',
  });

  const monthlyEvalBonus = options?.monthlyEvalBonus ?? employee.monthly_eval_bonus ?? 0;
  if (monthlyEvalBonus > 0) {
    steps.push({
      title: 'Monthly Evaluation Bonus',
      title_km: 'ប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ (Evaluation)',
      formula: `Monthly performance evaluation tier rating allowance`,
      result: `$${monthlyEvalBonus.toFixed(2)}`,
      explanation: `Discretionary monthly performance appraisal incentive awarded based on production supervisor and departmental monthly evaluations (Tiers: $6, $11, $15, $20).`,
      explanation_km: `ប្រាក់រង្វាន់វាយតម្លៃការងារប្រចាំខែផ្ដល់ជូនតាមលទ្ធផលវាយតម្លៃរបស់ប្រធានផ្នែក និងមេការ (កម្រិត៖ $៦, $១១, $១៥, $២០)។`,
      legal_reference: 'Factory Performance Evaluation Policy',
    });
  }
  const annualLeave = 0;
  const salaryAdjustment = 0;

  // 9. Total Salary (Gross)
  const totalSalary = Math.round(
    (basicWorkingSalary +
      seniorityBonus +
      positionAllowance +
      sewingSkillMatrix +
      skillAllowance +
      transportHousing +
      attendanceAllowance +
      foodAllowance +
      overtimePay +
      overtimeFood +
      achievementBonus +
      monthlyEvalBonus +
      annualLeave +
      salaryAdjustment) *
      100
  ) / 100;
  steps.push({
    title: 'Total Gross Salary',
    title_km: 'ប្រាក់បៀវត្សរ៍សរុប (Gross)',
    formula: `Sum of all basic, bonuses, allowances, and OT`,
    result: `$${totalSalary.toFixed(2)}`,
    explanation: `Sum total of all earnings before statutory deductions, insurance, and government taxes.`,
    explanation_km: `ផលបូកនៃចំណូលសរុបទាំងអស់របស់កម្មករនិយោជិត មុនពេលកាត់កងវិភាគទាន និងពន្ធរបស់រដ្ឋ។`,
    legal_reference: 'Gross Remuneration',
  });

  // 10. Non-taxable total = Gross - Transport Housing
  const nonTaxableTotal = Math.round((totalSalary - transportHousing) * 100) / 100;
  steps.push({
    title: 'Non-Taxable Amount (Fringe Benefit Exemption)',
    title_km: 'ប្រាក់បន្ទុកមិនជាប់ពន្ធ',
    formula: `Gross ($${totalSalary.toFixed(2)}) - Transport/Housing ($${transportHousing.toFixed(2)})`,
    result: `$${nonTaxableTotal.toFixed(2)}`,
    explanation: `Transport & housing allowance ($16) is subtracted from Gross as it is an exempt fringe benefit under tax law.`,
    explanation_km: `ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦) ត្រូវបានដកចេញពីប្រាក់បៀវត្សរ៍សរុប ដោយសារជាប្រាក់បន្ទុកមិនជាប់ពន្ធស្របតាមច្បាប់។`,
    legal_reference: 'Law on Taxation Art. 42',
  });

  // 11. NSSF Pension Fund (2% of contributory wage, capped at 1,200,000 KHR / 24,000 KHR max)
  const nssfRate = rules.nssf_rate_khr || 4049;
  const grossKhr = Math.round(totalSalary * nssfRate);
  const contributoryBaseKhr = totalSalary <= 0 ? 0 : Math.min(1200000, Math.max(400000, grossKhr));
  const pensionFundKhr = Math.round(contributoryBaseKhr * 0.02);
  const pensionFundUsd = Math.round((pensionFundKhr / nssfRate) * 100) / 100;
  const isCapped = grossKhr >= 1200000;

  steps.push({
    title: 'NSSF Pension Contribution',
    title_km: 'បេឡាជាតិរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២%)',
    formula: isCapped
      ? `Wage (${grossKhr.toLocaleString()} KHR) ≥ 1,200,000 KHR ceiling → Capped at 24,000 KHR ÷ ${nssfRate} KHR/USD = $${pensionFundUsd.toFixed(2)}`
      : `Contributory wage (${contributoryBaseKhr.toLocaleString()} KHR) × 2% = ${pensionFundKhr.toLocaleString()} KHR ÷ ${nssfRate} KHR/USD = $${pensionFundUsd.toFixed(2)}`,
    result: `-$${pensionFundUsd.toFixed(2)} (${pensionFundKhr.toLocaleString()} KHR)`,
    explanation: isCapped
      ? `Mandatory 2% employee pension deduction. Contributory wage exceeds statutory ceiling (1,200,000 KHR), capping deduction at statutory maximum 24,000 KHR ($${pensionFundUsd.toFixed(2)} USD).`
      : `Mandatory 2% employee pension deduction applied to contributory wage (${contributoryBaseKhr.toLocaleString()} KHR), yielding ${pensionFundKhr.toLocaleString()} KHR ($${pensionFundUsd.toFixed(2)} USD).`,
    explanation_km: isCapped
      ? `ការកាត់ប្រាក់សោធននិវត្តន៍ ២% របស់កម្មករនិយោជិត។ ប្រាក់ឈ្នួលជាប់ភាគទានលើសពិដានច្បាប់ (១,២០០,០០០ រៀល) ដូច្នេះការកាត់ត្រូវកំណត់ត្រឹមពិដានអតិបរមា ២៤,០០០ រៀល ($${pensionFundUsd.toFixed(2)}) ក្នុងមួយខែ។`
      : `ការកាត់ប្រាក់សោធននិវត្តន៍ ២% នៃប្រាក់ឈ្នួលជាប់ភាគទាន (${contributoryBaseKhr.toLocaleString()} រៀល) ស្មើនឹង ${pensionFundKhr.toLocaleString()} រៀល ($${pensionFundUsd.toFixed(2)}) ក្នុងមួយខែ។`,
    legal_reference: 'Prakas No. 249 & Sub-Decree No. 32',
  });

  // 12. Taxable Salary (USD & KHR)
  const taxableSalaryUsd = Math.max(0, Math.round((nonTaxableTotal - pensionFundUsd) * 100) / 100);
  const gdtRate = rules.gdt_rate_khr || 4044;
  const taxableSalaryKhr = Math.round(taxableSalaryUsd * gdtRate);
  steps.push({
    title: 'Taxable Salary (USD & KHR)',
    title_km: 'ប្រាក់បៀវត្សរ៍គិតពន្ធ (ដុល្លារ និងរៀល)',
    formula: `($${nonTaxableTotal.toFixed(2)} - $${pensionFundUsd}) × ${gdtRate} GDT Rate`,
    result: `${taxableSalaryKhr.toLocaleString()} KHR ($${taxableSalaryUsd.toFixed(2)})`,
    explanation: `Taxable salary in KHR after deducting employee NSSF pension and exempt allowances, converted using the GDT monthly official exchange rate (${gdtRate} KHR/USD).`,
    explanation_km: `ប្រាក់បៀវត្សរ៍គិតពន្ធគិតជារៀល ក្រោយដកប្រាក់សោធន ប.ស.ស. និងប្រាក់ឧបត្ថម្ភមិនជាប់ពន្ធ ដោយគុណនឹងអត្រាប្តូរប្រាក់ផ្លូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (${gdtRate} រៀល/ដុល្លារ)។`,
    legal_reference: 'GDT Monthly Official Rate',
  });

  // 13. Dependent Deductions (150,000 KHR per dependent)
  const dependentsCount = options?.dependentsCount ?? 0;
  const deductAmountKhr = dependentsCount * (rules.tax_relief_per_dependent_khr || 150000);
  const taxableBaseKhr = Math.max(0, taxableSalaryKhr - deductAmountKhr);
  steps.push({
    title: 'Family Dependent Deductions',
    title_km: 'ការកាត់បន្ថយបន្ទុកគ្រួសារ',
    formula: `${dependentsCount} dependent(s) × 150,000 KHR`,
    result: `-${deductAmountKhr.toLocaleString()} KHR`,
    explanation: `Cambodia tax relief allows a statutory deduction of 150,000 KHR (~$37.05) per dependent spouse and dependent child under 18.`,
    explanation_km: `ច្បាប់ពន្ធដារកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងម្នាក់ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក។`,
    legal_reference: 'Law on Taxation Art. 47',
  });

  // 14. GDT Progressive Tax on Salary
  const { rate: taxRate, taxKhr: taxOnSalaryKhr } = calculateTaxOnSalary(taxableBaseKhr);
  const taxOnSalaryUsd = Math.round((taxOnSalaryKhr / gdtRate) * 100) / 100;
  steps.push({
    title: 'Tax on Salary (GDT Progressive)',
    title_km: 'ពន្ធលើប្រាក់បៀវត្សរ៍ (តាមថ្នាក់កើនតាមលំដាប់)',
    formula: `Base: ${taxableBaseKhr.toLocaleString()} KHR → ${taxRate} bracket`,
    result: `${taxOnSalaryKhr.toLocaleString()} KHR ($${taxOnSalaryUsd.toFixed(2)})`,
    explanation: `Computed using Cambodia progressive tax brackets: 0% (up to 1.5M KHR), 5% (1.5M-2M), 10% (2M-8.5M), 15% (8.5M-12.5M), 20% (>12.5M).`,
    explanation_km: `គណនាតាមតារាងពន្ធកើនតាមលំដាប់៖ ០% (រហូតដល់ ១.៥លានរៀល), ៥% (១.៥-២លាន), ១០% (២-៨.៥លាន), ១៥% (៨.៥-១២.៥លាន), ២០% (លើស ១២.៥លាន)។`,
    legal_reference: 'Sub-Decree on Tax on Salary',
  });

  // 15. After-Tax Salary = Gross - Tax USD - Pension USD
  const afterTaxSalary = Math.round((totalSalary - taxOnSalaryUsd - pensionFundUsd) * 100) / 100;
  steps.push({
    title: 'After-Tax Net Salary',
    title_km: 'ប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ និង ប.ស.ស.',
    formula: `$${totalSalary.toFixed(2)} - $${taxOnSalaryUsd.toFixed(2)} tax - $${pensionFundUsd.toFixed(2)} pension`,
    result: `$${afterTaxSalary.toFixed(2)}`,
    explanation: `The legal take-home pay remaining after settling all statutory tax and social security obligations.`,
    explanation_km: `ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីកាត់កងកាតព្វកិច្ចពន្ធដារ និងរបបសន្តិសុខសង្គមរួចរាល់។`,
    legal_reference: 'Net Remuneration',
  });

  // 16. Severance Pay 5% (Column 50 - Article 73 FDC Contract Expiration/Indemnity)
  const severancePay = options?.severancePay ?? employee.severance_pay ?? 0;
  if (severancePay > 0) {
    steps.push({
      title: 'Severance Pay 5% (FDC Article 73 Indemnity)',
      title_km: 'ប្រាក់បំណាច់កុងត្រា ៥% (មាត្រា ៧៣ នៃច្បាប់ការងារ)',
      formula: `5% statutory severance indemnity on contract wages`,
      result: `+$${severancePay.toFixed(2)}`,
      explanation: `Statutory 5% severance payment mandated by Article 73 of the Cambodia Labor Law for Fixed Duration Contracts (FDC / ក.ក.ថ), disbursed upon contract expiration, renewal, or monthly contract settlement.`,
      explanation_km: `ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% អនុលោមតាមមាត្រា ៧៣ នៃច្បាប់ការងារកម្ពុជា សម្រាប់កិច្ចសន្យាការងារមានកំណត់ថិរវេលា (ក.ក.ថ) ដែលត្រូវទូទាត់ជូនកម្មករនិយោជិត។`,
      legal_reference: 'Cambodia Labor Law Article 73 & Column 50 of Factory Ledger',
    });
  }

  // 17. Distribution: First Paid, Second Paid, Total Paid
  const firstPaid = options?.firstPaidAdvance ?? 0;
  const paidTargetBonus = achievementBonus;
  const paidFoodFee = options?.paidFoodFee ?? 0;
  const seniorityPayback = options?.seniorityPayback ?? 0;
  const paidFinalSalary = options?.paidFinalSalary ?? 0;

  const secondPaid = Math.round((afterTaxSalary + severancePay + seniorityPayback - firstPaid - paidTargetBonus - paidFoodFee) * 100) / 100;
  const totalPaid = Math.round((firstPaid + paidTargetBonus + paidFoodFee + secondPaid) * 100) / 100;
  steps.push({
    title: 'Final Disbursement (Second Paid)',
    title_km: 'ការទូទាត់ប្រាក់ដំណាក់កាលចុងក្រោយ (បើកលើកទី ២)',
    formula: severancePay > 0
      ? `After-Tax ($${afterTaxSalary}) + Severance 5% ($${severancePay}) - 1st Paid ($${firstPaid}) - Target Bonus ($${paidTargetBonus}) - Food ($${paidFoodFee})`
      : `After-Tax ($${afterTaxSalary}) - 1st Paid ($${firstPaid}) - Target Bonus ($${paidTargetBonus}) - Food ($${paidFoodFee})`,
    result: `$${secondPaid.toFixed(2)} (Total: $${totalPaid.toFixed(2)})`,
    explanation: `Net settlement disbursed to employee at month-end, adding any severance indemnity and deducting mid-month salary advances (1st Paid), weekly bonus payouts, or canteen adjustments.`,
    explanation_km: `ប្រាក់បើកជាក់ស្តែងចុងខែដល់ដៃបុគ្គលិក ដោយបូកបន្ថែមប្រាក់បំណាច់ ៥% និងកាត់កងប្រាក់បើកមុនលើកទី១ ប្រាក់រង្វាន់គោលដៅដេរដែលបានបើក និងថ្លៃបាយ។`,
    legal_reference: 'Factory Bi-Monthly Payment Schedule',
  });

  const traceObj = {
    steps,
    formula_definitions: {
      basic_working_salary: 'Basic Salary - (Basic Salary / Working Days * Unpaid Days)',
      hourly_rate: 'Basic Salary / Working Days / Daily Hours',
      overtime_pay: 'Hourly Rate * OT Multiplier * OT Hours',
      non_taxable: 'Gross Salary - Housing - Transport Allowance ($16)',
      taxable_khr: '(Non Taxable - NSSF Pension) * GDT Exchange Rate',
      after_tax: 'Total Gross - Tax USD - NSSF Pension USD',
      second_paid: 'After Tax + Severant Pay 5% - First Paid - Target Bonus - Food Fee',
    },
  };

  const payroll: Partial<PayrollRecord> = {
    id: `PAY-${periodId}-${employee.id}`,
    employee_id: employee.id!,
    period_id: periodId,
    pay_period: payPeriodName,
    join_date: employee.join_date,
    payment_date: new Date().toISOString().split('T')[0],
    base_salary: basicSalary,
    allowances: transportHousing + foodAllowance + positionAllowance + skillAllowance + sewingSkillMatrix,
    bonuses: seniorityBonus + attendanceAllowance + achievementBonus,
    tax_deduction: taxOnSalaryUsd,
    insurance_deduction: pensionFundUsd,
    other_deductions: 0,
    net_salary: totalPaid,
    status: 'Processing',
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
    salary_adjustment: salaryAdjustment,
    gross_salary: totalSalary,
    non_taxable_amount: nonTaxableTotal,
    taxable_salary_usd: taxableSalaryUsd,
    taxable_salary_khr: taxableSalaryKhr,
    pension_usd: pensionFundUsd,
    pension_khr: pensionFundKhr,
    dependents_count: dependentsCount,
    taxable_base_khr: taxableBaseKhr,
    tax_rate: taxRate,
    tax_khr: taxOnSalaryKhr,
    tax_usd: taxOnSalaryUsd,
    after_tax_salary: afterTaxSalary,
    first_paid: firstPaid,
    target_bonus: paidTargetBonus,
    severance_pay: severancePay,
    seniority_payback: seniorityPayback,
    paid_final_salary: paidFinalSalary,
    second_paid: secondPaid,
    total_paid: totalPaid,
    labor_type: employee.labor_type || 'Direct Labour',
    exchange_rate_khr: gdtRate,
    nssf_rate_khr: nssfRate,
    calculation_trace: JSON.stringify(traceObj),
  };

  return {
    payroll,
    trace: traceObj,
  };
}
