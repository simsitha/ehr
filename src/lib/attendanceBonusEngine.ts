import {
  AttendanceBonusRule,
  AttendanceBonusPolicyConfig,
  AttendanceBonusCalculation,
  DailyAttendanceDetail,
} from './types';

export const DEFAULT_ATTENDANCE_BONUS_POLICY: AttendanceBonusPolicyConfig = {
  count_annual_leave: false,
  count_sick_leave: false,
  count_public_holidays: false,
  count_maternity_leave: false,
  count_special_leave: false,
  half_day_attendance_weight: 0.5,
  late_threshold_penalty: 0,
  currency: 'USD',
  gdt_exchange_rate: 4044,
};

export const DEFAULT_BONUS_RULES: AttendanceBonusRule[] = [
  {
    id: 'rule-tier-1',
    rule_name: 'Tier 1: 25.0+ Days',
    minimum_attendance_days: 25.0,
    maximum_attendance_days: null,
    bonus_amount: 20.0,
    currency: 'USD',
    is_active: 1,
    priority: 1,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
  },
  {
    id: 'rule-tier-2',
    rule_name: 'Tier 2: 24.5 to <25.0 Days',
    minimum_attendance_days: 24.5,
    maximum_attendance_days: 25.0,
    bonus_amount: 15.0,
    currency: 'USD',
    is_active: 1,
    priority: 2,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
  },
  {
    id: 'rule-tier-3',
    rule_name: 'Tier 3: 24.0 to <24.5 Days',
    minimum_attendance_days: 24.0,
    maximum_attendance_days: 24.5,
    bonus_amount: 10.0,
    currency: 'USD',
    is_active: 1,
    priority: 3,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
  },
  {
    id: 'rule-tier-4',
    rule_name: 'Tier 4: 23.0 to <24.0 Days',
    minimum_attendance_days: 23.0,
    maximum_attendance_days: 24.0,
    bonus_amount: 5.0,
    currency: 'USD',
    is_active: 1,
    priority: 4,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
  },
];

/**
 * Decimal-safe rounding to specified decimal places
 */
export function roundToDecimals(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates attendance bonus according to active rules and tiers.
 * Matches exact requirements of Section 2 & 11 test cases:
 * - 26 days -> $20.00
 * - 25 days -> $20.00
 * - 24.99 days -> $15.00
 * - 24.5 days -> $15.00
 * - 24.49 days -> $10.00
 * - 24.0 days -> $10.00
 * - 23.99 days -> $5.00
 * - 23.0 days -> $5.00
 * - 22.99 days -> $0.00
 * - 0 days -> $0.00
 */
export function calculateAttendanceBonus(
  attendanceDays: number,
  rules?: AttendanceBonusRule[]
): {
  bonusAmount: number;
  tierName: string;
  ruleId: string | null;
  minimumDays: number;
  maximumDays: number | null;
} {
  const safeDays = Math.max(0, roundToDecimals(attendanceDays, 2));
  const activeRules = (rules && rules.length > 0 ? rules : DEFAULT_BONUS_RULES)
    .filter((r) => r.is_active === 1)
    .sort((a, b) => b.minimum_attendance_days - a.minimum_attendance_days);

  for (const rule of activeRules) {
    const min = Number(rule.minimum_attendance_days);
    const max = rule.maximum_attendance_days !== null && rule.maximum_attendance_days !== undefined
      ? Number(rule.maximum_attendance_days)
      : null;

    if (max === null || isNaN(max)) {
      if (safeDays >= min) {
        return {
          bonusAmount: roundToDecimals(Number(rule.bonus_amount), 2),
          tierName: rule.rule_name,
          ruleId: rule.id,
          minimumDays: min,
          maximumDays: null,
        };
      }
    } else {
      if (safeDays >= min && safeDays < max) {
        return {
          bonusAmount: roundToDecimals(Number(rule.bonus_amount), 2),
          tierName: rule.rule_name,
          ruleId: rule.id,
          minimumDays: min,
          maximumDays: max,
        };
      }
    }
  }

  // Under lowest threshold
  const lowestMin = activeRules.length > 0
    ? Math.min(...activeRules.map((r) => Number(r.minimum_attendance_days)))
    : 23.0;

  return {
    bonusAmount: 0.0,
    tierName: `Ineligible (< ${lowestMin} days)`,
    ruleId: null,
    minimumDays: 0,
    maximumDays: lowestMin,
  };
}

/**
 * Evaluates qualifying attendance days for an employee based on company policy.
 */
export function computeQualifyingAttendanceDays(params: {
  presentDays: number;
  halfDays: number;
  annualLeaveDays?: number;
  sickLeaveDays?: number;
  publicHolidayDays?: number;
  maternityLeaveDays?: number;
  specialLeaveDays?: number;
  policy?: Partial<AttendanceBonusPolicyConfig>;
}): {
  qualifyingDays: number;
  approvedLeaveDaysCounted: number;
  leaveBreakdown: {
    al: number;
    sl: number;
    hl: number;
    ml: number;
    ol: number;
  };
} {
  const policy = { ...DEFAULT_ATTENDANCE_BONUS_POLICY, ...(params.policy || {}) };
  const halfDayWeight = policy.half_day_attendance_weight ?? 0.5;

  const al = params.annualLeaveDays || 0;
  const sl = params.sickLeaveDays || 0;
  const hl = params.publicHolidayDays || 0;
  const ml = params.maternityLeaveDays || 0;
  const ol = params.specialLeaveDays || 0;

  let approvedLeaveDaysCounted = 0;
  if (policy.count_annual_leave) approvedLeaveDaysCounted += al;
  if (policy.count_sick_leave) approvedLeaveDaysCounted += sl;
  if (policy.count_public_holidays) approvedLeaveDaysCounted += hl;
  if (policy.count_maternity_leave) approvedLeaveDaysCounted += ml;
  if (policy.count_special_leave) approvedLeaveDaysCounted += ol;

  const presentDaysPortion = Math.max(0, params.presentDays);
  const halfDaysPortion = Math.max(0, params.halfDays * halfDayWeight);

  const qualifyingDays = roundToDecimals(
    presentDaysPortion + halfDaysPortion + approvedLeaveDaysCounted,
    2
  );

  return {
    qualifyingDays,
    approvedLeaveDaysCounted: roundToDecimals(approvedLeaveDaysCounted, 2),
    leaveBreakdown: { al, sl, hl, ml, ol },
  };
}

/**
 * Generates an explanation message for why an employee received a specific attendance bonus.
 */
export function generateBonusExplanation(params: {
  employeeName: string;
  attendanceDays: number;
  scheduledDays: number;
  bonusAmount: number;
  tierName: string;
  absentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
  exchangeRate: number;
}): {
  explanationEn: string;
  explanationKm: string;
} {
  const {
    employeeName,
    attendanceDays,
    scheduledDays,
    bonusAmount,
    tierName,
    absentDays,
    halfDays,
    approvedLeaveDays,
    exchangeRate,
  } = params;

  const khrAmount = Math.round(bonusAmount * exchangeRate);

  if (bonusAmount > 0) {
    const en = `${employeeName} achieved ${attendanceDays.toFixed(1)} qualifying attendance days out of ${scheduledDays} scheduled days (${halfDays} half-day(s), ${approvedLeaveDays} approved leave day(s), ${absentDays} absent day(s)). Qualified for ${tierName} with a monthly attendance bonus of $${bonusAmount.toFixed(2)} USD (${khrAmount.toLocaleString()} KHR).`;
    const km = `${employeeName} សម្រេចបានវត្តមានបំពេញការងារសរុប ${attendanceDays.toFixed(1)} ថ្ងៃ នៃចំនួន ${scheduledDays} ថ្ងៃកំណត់ (កន្លះថ្ងៃ៖ ${halfDays}, ច្បាប់អនុញ្ញាត៖ ${approvedLeaveDays}, អវត្តមាន៖ ${absentDays})។ ទទួលបានសិទ្ធិតាមកម្រិត «${tierName}» ជាមួយនឹងប្រាក់រង្វាន់វត្តមានទៀងទាត់ចំនួន $${bonusAmount.toFixed(2)} ដុល្លារ (${khrAmount.toLocaleString()} រៀល)។`;
    return { explanationEn: en, explanationKm: km };
  } else {
    const en = `${employeeName} recorded ${attendanceDays.toFixed(1)} qualifying attendance days out of ${scheduledDays} scheduled days, which is below the minimum threshold of 23.0 days required to qualify for an attendance bonus ($0.00 USD).`;
    const km = `${employeeName} មានវត្តមានសរុប ${attendanceDays.toFixed(1)} ថ្ងៃ នៃចំនួន ${scheduledDays} ថ្ងៃកំណត់ ដែលមិនទាន់ដល់កម្រិតអប្បបរមា ២៣.០ ថ្ងៃ ដើម្បីទទួលបានប្រាក់រង្វាន់វត្តមានឡើយ ($០.០០ ដុល្លារ)។`;
    return { explanationEn: en, explanationKm: km };
  }
}
