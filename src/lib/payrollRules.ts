import { PayrollRulesConfig, SeniorityTier, SewingBonusRule } from './types';

export const DEFAULT_SENIORITY_TIERS: SeniorityTier[] = [
  { years: 1, amount: 1.0 },
  { years: 2, amount: 2.0 },
  { years: 3, amount: 3.0 },
  { years: 4, amount: 4.0 },
  { years: 5, amount: 5.0 },
  { years: 6, amount: 6.0 },
  { years: 7, amount: 7.0 },
  { years: 8, amount: 8.0 },
  { years: 9, amount: 9.0 },
  { years: 10, amount: 10.0 },
  { years: 11, amount: 11.0 },
];

export const DEFAULT_PAYROLL_RULES: PayrollRulesConfig = {
  working_days_per_month: 26,
  daily_working_hours: 8,
  ot_multiplier_normal: 1.5,
  ot_multiplier_night: 2.0,
  ot_multiplier_weekend: 1.5,
  ot_multiplier_holiday: 2.0,
  non_absent_bonus_amount: 15.0,
  non_absent_bonus_allowed_leaves: ['AL', 'HL', 'OFF'],
  seniority_tiers: DEFAULT_SENIORITY_TIERS,
  nssf_employee_rate: 0.02,
  nssf_employer_rate: 0.02,
  nssf_cap_khr: 1200000,
  nssf_rate_khr: 4049,
  gdt_rate_khr: 4044,
  tax_relief_per_dependent_khr: 150000,
  meal_allowance_per_day: 2.5,
  housing_transport_monthly: 16.0,
  housing_transport_threshold_days: 8,
  housing_transport_half_amount: 8.0,
};

/**
 * Safely parses various date formats (YYYY-MM-DD, DD/MM/YYYY, ISO string, Date object)
 */
export function parseDateFlexible(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const s = String(val).trim();
  if (!s) return null;

  // Match DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10) - 1;
    const y = parseInt(ddmmyyyy[3], 10);
    const dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // YYYY-MM-DD or ISO
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Calculates continuous completed tenure and seniority allowance from join date
 * Under Cambodia Garment & Textile statutory scale (Prakas No. 017/00 & Art. 89)
 */
export function calculateSeniorityAllowanceFromDate(
  joinDateInput?: string | Date | null,
  referenceDateInput?: string | Date | null,
  tiers: SeniorityTier[] = DEFAULT_SENIORITY_TIERS
): {
  yearsWorked: number;
  monthsWorked: number;
  allowance: number;
  tenureLabel: string;
} {
  const joinDate = parseDateFlexible(joinDateInput);
  if (!joinDate) {
    return { yearsWorked: 0, monthsWorked: 0, allowance: 0, tenureLabel: 'No join date' };
  }

  const refDate = parseDateFlexible(referenceDateInput) || new Date();

  let years = refDate.getFullYear() - joinDate.getFullYear();
  let months = refDate.getMonth() - joinDate.getMonth();
  if (refDate.getDate() < joinDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const completeYears = Math.max(0, years);
  const totalMonths = Math.max(0, completeYears * 12 + months);
  const allowance = calculateSeniorityBonus(completeYears, tiers);

  let tenureLabel = '';
  if (completeYears === 0) {
    tenureLabel = `${months} ${months === 1 ? 'month' : 'months'} (< 1 yr)`;
  } else if (completeYears === 1) {
    tenureLabel = `1 yr${months > 0 ? ` ${months} mo` : ''}`;
  } else {
    tenureLabel = `${completeYears} yrs${months > 0 ? ` ${months} mo` : ''}`;
  }

  return {
    yearsWorked: completeYears,
    monthsWorked: totalMonths,
    allowance,
    tenureLabel,
  };
}

/**
 * Calculates seniority bonus in USD based on complete years worked
 */
export function calculateSeniorityBonus(yearsWorked: number, tiers: SeniorityTier[] = DEFAULT_SENIORITY_TIERS): number {
  if (yearsWorked < 1) return 0;
  const sorted = [...tiers].sort((a, b) => b.years - a.years);
  for (const tier of sorted) {
    if (yearsWorked >= tier.years) {
      return tier.amount;
    }
  }
  return 0;
}

/**
 * Evaluates seniority bonus from join date (used across payroll engines)
 */
export function evaluateSeniorityBonusFromJoinDate(
  joinDateStr: string,
  referenceDateStr?: string,
  tiers = DEFAULT_SENIORITY_TIERS
): { yearsWorked: number; bonusAmount: number } {
  const res = calculateSeniorityAllowanceFromDate(joinDateStr, referenceDateStr, tiers);
  return {
    yearsWorked: res.yearsWorked,
    bonusAmount: res.allowance,
  };
}

/**
 * Computes hourly rate = basicSalary / workingDays / dailyHours
 */
export function calculateHourlyRate(basicSalary: number, workingDays = 26, dailyHours = 8): number {
  if (workingDays <= 0 || dailyHours <= 0) return 0;
  return Math.round((basicSalary / workingDays / dailyHours) * 10000) / 10000;
}

/**
 * Overtime amount = hourlyRate * multiplier * hours
 */
export function calculateOvertimeAmount(hourlyRate: number, multiplier = 1.5, hours = 0): number {
  return Math.round(hourlyRate * multiplier * hours * 100) / 100;
}

/**
 * Cambodia General Department of Taxation (GDT) Progressive Salary Tax
 * @param taxableBaseKhr In Khmer Riel after dependent allowances
 */
export function calculateTaxOnSalary(taxableBaseKhr: number): { rate: string; taxKhr: number } {
  if (taxableBaseKhr <= 1500000) {
    return { rate: '0%', taxKhr: 0 };
  } else if (taxableBaseKhr <= 2000000) {
    const tax = Math.round(taxableBaseKhr * 0.05 - 75000);
    return { rate: '5%', taxKhr: Math.max(0, tax) };
  } else if (taxableBaseKhr <= 8500000) {
    const tax = Math.round(taxableBaseKhr * 0.1 - 175000);
    return { rate: '10%', taxKhr: Math.max(0, tax) };
  } else if (taxableBaseKhr <= 12500000) {
    const tax = Math.round(taxableBaseKhr * 0.15 - 600000);
    return { rate: '15%', taxKhr: Math.max(0, tax) };
  } else {
    const tax = Math.round(taxableBaseKhr * 0.2 - 1225000);
    return { rate: '20%', taxKhr: Math.max(0, tax) };
  }
}

/**
 * Computes sewing production weekly bonus according to target rules
 */
export function computeSewingWeeklyBonus(
  totalQty: number,
  rule?: Partial<SewingBonusRule>
): {
  achievementPct: number;
  bonusAmount: number;
  tier: 'B3' | 'B2' | 'B1' | 'Base' | 'None';
  tierLabel: string;
} {
  const target = rule?.weekly_target_qty || 1200;
  const pct = target > 0 ? Math.round((totalQty / target) * 1000) / 10 : 0;

  const tier3Pct = rule?.tier_3_min_pct ?? 120;
  const tier3Bonus = rule?.tier_3_bonus ?? 20;

  const tier2Pct = rule?.tier_2_min_pct ?? 110;
  const tier2Bonus = rule?.tier_2_bonus ?? 15;

  const tier1Pct = rule?.tier_1_min_pct ?? 100;
  const tier1Bonus = rule?.tier_1_bonus ?? 10;

  const baseBonus = rule?.base_bonus ?? 5;

  let bonus = 0;
  let tier: 'B3' | 'B2' | 'B1' | 'Base' | 'None' = 'None';
  let tierLabel = 'Below Target (<90%)';

  if (pct >= tier3Pct) {
    bonus = tier3Bonus;
    tier = 'B3';
    tierLabel = 'Tier 3 (B3 ≥120%)';
  } else if (pct >= tier2Pct) {
    bonus = tier2Bonus;
    tier = 'B2';
    tierLabel = 'Tier 2 (B2 ≥110%)';
  } else if (pct >= tier1Pct) {
    bonus = tier1Bonus;
    tier = 'B1';
    tierLabel = 'Tier 1 (B1 ≥100%)';
  } else if (pct >= 90) {
    bonus = baseBonus;
    tier = 'Base';
    tierLabel = 'Base Target (≥90%)';
  }

  return {
    achievementPct: pct,
    bonusAmount: bonus,
    tier,
    tierLabel,
  };
}

export interface DailyTargetRule {
  id?: string;
  rule_name?: string;
  daily_target_qty: number;
  base_min_pct: number;
  base_bonus: number;
  tier_1_min_pct: number;
  tier_1_bonus: number;
  tier_2_min_pct: number;
  tier_2_bonus: number;
  tier_3_min_pct: number;
  tier_3_bonus: number;
}

export const DEFAULT_DAILY_TARGET_RULE: DailyTargetRule = {
  daily_target_qty: 200,
  base_min_pct: 90,
  base_bonus: 0.5,
  tier_1_min_pct: 100,
  tier_1_bonus: 1.5,
  tier_2_min_pct: 110,
  tier_2_bonus: 2.5,
  tier_3_min_pct: 120,
  tier_3_bonus: 3.5,
};

export function computeDailyTargetBonus(
  dailyQty: number,
  rule: Partial<DailyTargetRule> = DEFAULT_DAILY_TARGET_RULE
): {
  achievementPct: number;
  bonusAmount: number;
  tier: 'B3' | 'B2' | 'B1' | 'Base' | 'None';
  tierLabel: string;
} {
  const target = rule.daily_target_qty || 200;
  const pct = target > 0 ? Math.round((dailyQty / target) * 1000) / 10 : 0;

  const t3Pct = rule.tier_3_min_pct ?? 120;
  const t3Bonus = rule.tier_3_bonus ?? 3.5;

  const t2Pct = rule.tier_2_min_pct ?? 110;
  const t2Bonus = rule.tier_2_bonus ?? 2.5;

  const t1Pct = rule.tier_1_min_pct ?? 100;
  const t1Bonus = rule.tier_1_bonus ?? 1.5;

  const basePct = rule.base_min_pct ?? 90;
  const baseBonus = rule.base_bonus ?? 0.5;

  if (pct >= t3Pct) {
    return { achievementPct: pct, bonusAmount: t3Bonus, tier: 'B3', tierLabel: `Tier 3 (B3 ≥${t3Pct}%)` };
  } else if (pct >= t2Pct) {
    return { achievementPct: pct, bonusAmount: t2Bonus, tier: 'B2', tierLabel: `Tier 2 (B2 ≥${t2Pct}%)` };
  } else if (pct >= t1Pct) {
    return { achievementPct: pct, bonusAmount: t1Bonus, tier: 'B1', tierLabel: `Tier 1 (B1 ≥${t1Pct}%)` };
  } else if (pct >= basePct) {
    return { achievementPct: pct, bonusAmount: baseBonus, tier: 'Base', tierLabel: `Base (≥${basePct}%)` };
  }
  return { achievementPct: pct, bonusAmount: 0, tier: 'None', tierLabel: `Below Target (<${basePct}%)` };
}


