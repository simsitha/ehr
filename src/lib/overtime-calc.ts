import { OvertimeRateType, OvertimeRateConfig, OvertimeSettings } from './types';

export type { OvertimeRateConfig };

export const OVERTIME_RATES: Record<OvertimeRateType, OvertimeRateConfig> = {
  normal_day_150: {
    id: 'normal_day_150',
    multiplier: 1.5,
    label_km: 'ថ្ងៃធ្វើការធម្មតា (150%)',
    label_en: 'Normal Working Day (150%)',
    short_label: '150% ធម្មតា',
    short_label_en: '150% Regular',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
    law_reference: 'មាត្រា ១៣៩ ច្បាប់ការងារ',
    description_km: 'ការងារលើស ៨ ម៉ោង/ថ្ងៃ នៅថ្ងៃធ្វើការធម្មតា គិតប្រាក់ឈ្នួល ១៥០% (១.៥ ដង)។',
    description_en: 'Hours worked beyond 8 hours on a regular working day paid at 150% (1.5x).',
  },
  night_200: {
    id: 'night_200',
    multiplier: 2.0,
    label_km: 'ថែមម៉ោងពេលយប់ (200%)',
    label_en: 'Night Overtime 22:00-06:00 (200%)',
    short_label: '200% ពេលយប់',
    short_label_en: '200% Night',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
    law_reference: 'មាត្រា ១៣៩ & ១៤៤ ច្បាប់ការងារ',
    description_km: 'ការងារថែមម៉ោងចន្លោះម៉ោង ២២:០០ ដល់ ០៦:០០ ព្រឹក គិតប្រាក់ឈ្នួល ២០០% (២ ដង)។',
    description_en: 'Overtime between 22:00 and 06:00 paid at 200% (2.0x normal wage).',
  },
  weekend_200: {
    id: 'weekend_200',
    multiplier: 2.0,
    label_km: 'ថ្ងៃសម្រាកប្រចាំសប្ដាហ៍ / អាទិត្យ (200%)',
    label_en: 'Weekly Rest Day / Sunday (200%)',
    short_label: '200% ថ្ងៃសម្រាក',
    short_label_en: '200% Rest Day',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    law_reference: 'មាត្រា ១៤៧ ច្បាប់ការងារ',
    description_km: 'ការងារនៅថ្ងៃសម្រាកប្រចាំសប្ដាហ៍ (ថ្ងៃអាទិត្យ ឬថ្ងៃកំណត់) គិតប្រាក់ឈ្នួល ២០០% (២ ដង)។',
    description_en: 'Work performed on mandatory weekly rest day paid at 200% (2.0x normal wage).',
  },
  holiday_200: {
    id: 'holiday_200',
    multiplier: 2.0,
    label_km: 'ថ្ងៃបុណ្យជាតិផ្លូវការ (200%)',
    label_en: 'Official Public Holiday (200%)',
    short_label: '200% បុណ្យជាតិ',
    short_label_en: '200% Holiday',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    law_reference: 'មាត្រា ១៦២ ច្បាប់ការងារ & ប្រកាសក្រសួង',
    description_km: 'ការងារនៅថ្ងៃបុណ្យជាតិផ្លូវការដែលមានប្រាក់ឈ្នួល គិតបន្ថែម ២០០% (២ ដង)។',
    description_en: 'Work performed on official paid public holidays paid at 200% (2.0x normal wage).',
  },
};

export const OVERTIME_RATE_LIST = Object.values(OVERTIME_RATES);

/**
 * Standard Cambodian regular work hours divisor per month:
 * 26 days * 8 hours = 208 hours/month.
 */
export const STANDARD_MONTHLY_HOURS = 208;

export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  standardMonthlyHours: STANDARD_MONTHLY_HOURS,
  rates: OVERTIME_RATES,
  isCustomized: false,
};

/**
 * Computes base hourly rate from monthly base salary using standard or customized divisor
 */
export function getBaseHourlyRate(monthlySalary: number, customDivisor: number = STANDARD_MONTHLY_HOURS): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  const divisor = customDivisor > 0 ? customDivisor : STANDARD_MONTHLY_HOURS;
  return Number((monthlySalary / divisor).toFixed(4));
}

/**
 * Helper to retrieve specific rate config with fallback to custom settings or defaults
 */
export function getOvertimeRateConfig(
  rateType: OvertimeRateType,
  customRates?: Record<OvertimeRateType, OvertimeRateConfig>
): OvertimeRateConfig {
  const rates = customRates || OVERTIME_RATES;
  return rates[rateType] || rates.normal_day_150 || OVERTIME_RATES.normal_day_150;
}

/**
 * Computes total overtime pay based on Cambodian Labor Law formula:
 * OT Pay = Hours * (Monthly Salary / Divisor) * Multiplier
 */
export function calculateOvertimePay(
  monthlySalary: number,
  hours: number,
  rateType: OvertimeRateType,
  customRates?: Record<OvertimeRateType, OvertimeRateConfig>,
  customDivisor?: number
): {
  hourlyRate: number;
  otHourlyRate: number;
  multiplier: number;
  totalPay: number;
  khrPay: number;
} {
  const config = getOvertimeRateConfig(rateType, customRates);
  const divisor = customDivisor && customDivisor > 0 ? customDivisor : STANDARD_MONTHLY_HOURS;
  const baseRate = getBaseHourlyRate(monthlySalary, divisor);
  const otHourlyRate = Number((baseRate * config.multiplier).toFixed(4));
  const totalPay = Number((hours * otHourlyRate).toFixed(2));
  const khrPay = Math.round(totalPay * 4100);

  return {
    hourlyRate: baseRate,
    otHourlyRate,
    multiplier: config.multiplier,
    totalPay,
    khrPay,
  };
}
