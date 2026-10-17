import { ShiftType, ShiftDefinition, ShiftSettings } from './types';

export const SHIFT_COLOR_PRESETS = [
  {
    id: 'blue',
    name: 'Blue (ខៀវ)',
    color: '#2563eb',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
  },
  {
    id: 'amber',
    name: 'Amber (លឿងទុំ)',
    color: '#d97706',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
  },
  {
    id: 'purple',
    name: 'Purple (ស្វាយ)',
    color: '#7c3aed',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800/60',
  },
  {
    id: 'indigo',
    name: 'Indigo (ខៀវចាស់)',
    color: '#4f46e5',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
  },
  {
    id: 'emerald',
    name: 'Emerald (បៃតង)',
    color: '#059669',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
  },
  {
    id: 'rose',
    name: 'Rose (ផ្កាឈូកក្រហម)',
    color: '#e11d48',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
  },
  {
    id: 'cyan',
    name: 'Cyan (ផ្ទៃមេឃ)',
    color: '#0891b2',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800/60',
  },
  {
    id: 'slate',
    name: 'Slate (ប្រផេះ)',
    color: '#64748b',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
  },
  {
    id: 'teal',
    name: 'Teal (បៃតងខៀវ)',
    color: '#0d9488',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-800/60',
  },
  {
    id: 'orange',
    name: 'Orange (ទឹកក្រូច)',
    color: '#ea580c',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800/60',
  },
];

export function getShiftBadgeClasses(color: string): { badgeBg: string; badgeText: string; badgeBorder: string } {
  const match = SHIFT_COLOR_PRESETS.find((p) => p.color.toLowerCase() === color.toLowerCase());
  if (match) {
    return { badgeBg: match.badgeBg, badgeText: match.badgeText, badgeBorder: match.badgeBorder };
  }
  // Default fallback styling
  return {
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
  };
}

export const DEFAULT_SHIFTS: Record<string, ShiftDefinition> = {
  office: {
    id: 'office',
    name_en: 'DAY Office / Normal Day.8h',
    name_km: 'វេនការិយាល័យ / ថ្ងៃធម្មតា (DAY Office / Normal Day.8h)',
    short_code: 'DAY',
    start_time: '07:30',
    end_time: '16:30',
    default_hours: 8.0,
    break_time: '11:30 - 12:30 (1h Lunch)',
    sub_shifts: [
      {
        name_en: 'Morning Shift',
        name_km: 'វេនព្រឹក (Morning)',
        start_time: '07:30',
        end_time: '11:30',
        hours: 4.0,
      },
      {
        name_en: 'Afternoon / Evening',
        name_km: 'វេនរសៀល (Afternoon / Evening)',
        start_time: '12:30',
        end_time: '16:30',
        hours: 4.0,
      },
    ],
    color: '#2563eb',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
    is_active: true,
  },
  morning: {
    id: 'morning',
    name_en: 'Morning Shift',
    name_km: 'វេនព្រឹក (Morning 4h)',
    short_code: 'MOR',
    start_time: '07:30',
    end_time: '11:30',
    default_hours: 4.0,
    color: '#d97706',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    is_active: true,
  },
  evening: {
    id: 'evening',
    name_en: 'Afternoon / Evening',
    name_km: 'វេនរសៀល (Afternoon / Evening 4h)',
    short_code: 'EVE',
    start_time: '12:30',
    end_time: '16:30',
    default_hours: 4.0,
    color: '#7c3aed',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800/60',
    is_active: true,
  },
  night: {
    id: 'night',
    name_en: 'Night Shift',
    name_km: 'វេនយប់ (Night)',
    short_code: 'NGT',
    start_time: '22:00',
    end_time: '06:30',
    default_hours: 8.0,
    color: '#4f46e5',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
    is_active: true,
  },
  weekend_duty: {
    id: 'weekend_duty',
    name_en: 'Weekend Duty',
    name_km: 'វេនប្រចាំការចុងសប្ដាហ៍',
    short_code: 'DUTY',
    start_time: '08:30',
    end_time: '17:30',
    default_hours: 8.0,
    color: '#059669',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    is_active: true,
  },
  on_call: {
    id: 'on_call',
    name_en: 'On-Call / Standby',
    name_km: 'ប្រចាំការត្រៀម (On-Call)',
    short_code: 'CALL',
    start_time: '08:00',
    end_time: '20:00',
    default_hours: 4.0,
    color: '#e11d48',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    is_active: true,
  },
  off: {
    id: 'off',
    name_en: 'Rest Day (OFF)',
    name_km: 'ថ្ងៃសម្រាក (OFF)',
    short_code: 'OFF',
    start_time: '',
    end_time: '',
    default_hours: 0,
    color: '#64748b',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    is_active: true,
  },
  custom: {
    id: 'custom',
    name_en: 'Custom Shift',
    name_km: 'វេនកំណត់ផ្ទាល់',
    short_code: 'CUS',
    start_time: '09:00',
    end_time: '18:00',
    default_hours: 8.0,
    color: '#0891b2',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800/60',
    is_active: true,
  },
};

export const SHIFTS = DEFAULT_SHIFTS as Record<ShiftType, ShiftDefinition>;
export const SHIFT_LIST: ShiftDefinition[] = Object.values(DEFAULT_SHIFTS);

export const DEFAULT_SHIFT_SETTINGS: ShiftSettings = {
  shifts: DEFAULT_SHIFTS,
  isCustomized: false,
};

/**
 * Returns dynamic shift definition by ID with fallback
 */
export function getShiftConfig(
  shiftType: string,
  customShifts?: Record<string, ShiftDefinition>
): ShiftDefinition {
  const map = customShifts || DEFAULT_SHIFTS;
  if (map[shiftType]) return map[shiftType];
  if (DEFAULT_SHIFTS[shiftType]) return DEFAULT_SHIFTS[shiftType];
  return {
    id: shiftType,
    name_en: shiftType.toUpperCase(),
    name_km: shiftType,
    short_code: shiftType.slice(0, 4).toUpperCase(),
    start_time: '08:30',
    end_time: '17:30',
    default_hours: 8.0,
    color: '#2563eb',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/60',
    is_active: true,
  };
}

/**
 * Returns active shift definitions as an array
 */
export function getShiftList(customShifts?: Record<string, ShiftDefinition>): ShiftDefinition[] {
  const map = customShifts || DEFAULT_SHIFTS;
  return Object.values(map).filter((s) => s.is_active !== false);
}

/**
 * Returns Monday date of given date's week (ISO week: Monday to Sunday)
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats a Date to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DayColumn {
  dateStr: string;
  dayOfWeek: number; // 1 = Mon, 7 = Sun
  nameEn: string;
  nameKm: string;
  shortEn: string;
  shortKm: string;
  isToday: boolean;
  isWeekend: boolean;
}

const KH_DAYS = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
const EN_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const KH_DAYS_SHORT = ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស', 'អា'];
const EN_DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getWeekDays(monday: Date, todayStr: string): DayColumn[] {
  const days: DayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = formatDateISO(current);
    days.push({
      dateStr,
      dayOfWeek: i + 1,
      nameEn: EN_DAYS[i],
      nameKm: KH_DAYS[i],
      shortEn: EN_DAYS_SHORT[i],
      shortKm: KH_DAYS_SHORT[i],
      isToday: dateStr === todayStr,
      isWeekend: i >= 5, // Sat or Sun
    });
  }
  return days;
}
