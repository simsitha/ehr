'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

export type PayrollColumnKey =
  | 'id'
  | 'name'
  | 'group'
  | 'type'
  | 'bankAccount'
  | 'baseSalary'
  | 'workingDays'
  | 'unpaidDays'
  | 'workingSal'
  | 'seniority'
  | 'transport'
  | 'positionPayment'
  | 'nonAbsent'
  | 'otPay'
  | 'targetBonus'
  | 'evalBonus'
  | 'foodAllowance'
  | 'gross'
  | 'nssf'
  | 'tax'
  | 'firstPaid'
  | 'severance'
  | 'secondPaid'
  | 'net'
  | 'status'
  | 'actions';

export type ColumnCategoryKey =
  | 'identity'
  | 'salary'
  | 'allowances'
  | 'statutory'
  | 'payout'
  | 'meta';

export interface PayrollColumnDef {
  key: PayrollColumnKey;
  labelEn: string;
  labelKm: string;
  category: ColumnCategoryKey;
  defaultVisible: boolean;
  minWidth?: string;
  align?: 'left' | 'right' | 'center';
  badge?: string;
  descriptionEn?: string;
  descriptionKm?: string;
}

export const PAYROLL_COLUMNS: PayrollColumnDef[] = [
  // Employee Identity
  {
    key: 'id',
    labelEn: 'Staff ID',
    labelKm: 'អត្តលេខ',
    category: 'identity',
    defaultVisible: true,
    minWidth: '70px',
    align: 'left',
    descriptionEn: 'Employee ID (e.g. HC001)',
    descriptionKm: 'អត្តលេខសម្គាល់បុគ្គលិក',
  },
  {
    key: 'name',
    labelEn: 'Employee Name',
    labelKm: 'ឈ្មោះខ្មែរ / Name',
    category: 'identity',
    defaultVisible: true,
    minWidth: '130px',
    align: 'left',
    descriptionEn: 'Full employee name in Khmer & English',
    descriptionKm: 'ឈ្មោះពេញជាភាសាខ្មែរ និងអង់គ្លេស',
  },
  {
    key: 'group',
    labelEn: 'Group / Dept',
    labelKm: 'ផ្នែក (Department)',
    category: 'identity',
    defaultVisible: true,
    minWidth: '80px',
    align: 'left',
    descriptionEn: 'Department or sewing production line',
    descriptionKm: 'ផ្នែក ឬខ្សែសង្វាក់ផលិតកម្ម',
  },
  {
    key: 'type',
    labelEn: 'Labor Type',
    labelKm: 'ប្រភេទពលកម្ម',
    category: 'identity',
    defaultVisible: true,
    minWidth: '90px',
    align: 'left',
    descriptionEn: 'Direct or indirect labor classification',
    descriptionKm: 'ចំណាត់ថ្នាក់ពលកម្មផ្ទាល់ ឬប្រយោល',
  },
  {
    key: 'bankAccount',
    labelEn: 'Bank Account',
    labelKm: 'គណនីធនាគារ ABA',
    category: 'identity',
    defaultVisible: false,
    minWidth: '110px',
    align: 'left',
    badge: 'Optional',
    descriptionEn: 'Bank name & account number for salary disbursement',
    descriptionKm: 'ឈ្មោះធនាគារ និងលេខគណនីបើកប្រាក់បៀវត្សរ៍',
  },

  // Base Salary & Attendance
  {
    key: 'baseSalary',
    labelEn: 'Base Salary',
    labelKm: 'ប្រាក់ខែគោល',
    category: 'salary',
    defaultVisible: true,
    minWidth: '80px',
    align: 'right',
    descriptionEn: 'Statutory minimum or agreed monthly base wage',
    descriptionKm: 'ប្រាក់ឈ្នួលគោលប្រចាំខែតាមកិច្ចសន្យា',
  },
  {
    key: 'workingDays',
    labelEn: 'Working Days',
    labelKm: 'ថ្ងៃធ្វើការ',
    category: 'salary',
    defaultVisible: false,
    minWidth: '70px',
    align: 'right',
    badge: 'Optional',
    descriptionEn: 'Actual billable working days (normally 26)',
    descriptionKm: 'ចំនួនថ្ងៃធ្វើការជាក់ស្តែង (ធម្មតា ២៦ ថ្ងៃ)',
  },
  {
    key: 'unpaidDays',
    labelEn: 'Unpaid Days',
    labelKm: 'ថ្ងៃអត់ច្បាប់',
    category: 'salary',
    defaultVisible: false,
    minWidth: '70px',
    align: 'right',
    badge: 'Optional',
    descriptionEn: 'Unpaid absence days deducted from wage',
    descriptionKm: 'ថ្ងៃអវត្តមានឥតច្បាប់ដែលត្រូវកាត់កង',
  },
  {
    key: 'workingSal',
    labelEn: 'Working Sal',
    labelKm: 'ប្រាក់ខែជាក់ស្តែង',
    category: 'salary',
    defaultVisible: true,
    minWidth: '80px',
    align: 'right',
    descriptionEn: 'Prorated wage based on attendance: (Base / 26) * Days',
    descriptionKm: 'ប្រាក់ឈ្នួលគិតតាមថ្ងៃធ្វើការជាក់ស្តែង',
  },

  // Allowances & Bonuses
  {
    key: 'seniority',
    labelEn: 'Seniority',
    labelKm: 'អតីតភាពការងារ',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '70px',
    align: 'right',
    descriptionEn: 'Seniority allowance based on years of service ($1-$11)',
    descriptionKm: 'ប្រាក់ឧបត្ថម្ភអតីតភាពការងារ ($១-$១១)',
  },
  {
    key: 'transport',
    labelEn: 'Transport',
    labelKm: 'ស្នាក់នៅ/ធ្វើដំណើរ',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '70px',
    align: 'right',
    descriptionEn: 'Housing & transport allowance ($16/month, $8 if ≤8 days)',
    descriptionKm: 'ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ($១៦/ខែ, $៨ បើ ≤៨ ថ្ងៃ)',
  },
  {
    key: 'positionPayment',
    labelEn: 'Position Payment',
    labelKm: 'ប្រាក់ឧបត្ថម្ភមុខតំណែង',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '85px',
    align: 'right',
    descriptionEn: 'Supervisory position allowance or acting manager payment',
    descriptionKm: 'ប្រាក់ឧបត្ថម្ភមុខតំណែង ឬប្រាក់ទទួលខុសត្រូវបន្ថែម',
  },
  {
    key: 'nonAbsent',
    labelEn: 'Non-Absent',
    labelKm: 'រង្វាន់ទៀងទាត់',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '75px',
    align: 'right',
    descriptionEn: 'Attendance non-absent bonus ($10 full, $5 partial)',
    descriptionKm: 'ប្រាក់រង្វាន់ការងារទៀងទាត់ ($១០ ឬ $៥)',
  },
  {
    key: 'otPay',
    labelEn: 'OT Pay',
    labelKm: 'ប្រាក់ថែមម៉ោង',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '70px',
    align: 'right',
    descriptionEn: 'Overtime compensation at 1.5x / 2.0x statutory rates',
    descriptionKm: 'ប្រាក់ឈ្នួលម៉ោងបន្ថែម (OT 1.5x / 2.0x)',
  },
  {
    key: 'targetBonus',
    labelEn: 'Target Bonus',
    labelKm: 'រង្វាន់ផលិតកម្ម',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '75px',
    align: 'right',
    descriptionEn: 'Weekly sewing line production output bonus (B1-B3)',
    descriptionKm: 'ប្រាក់រង្វាន់ផលិតភាពដេរប្រចាំសប្តាហ៍',
  },
  {
    key: 'evalBonus',
    labelEn: 'Monthly Eval',
    labelKm: 'រង្វាន់វាយតម្លៃ',
    category: 'allowances',
    defaultVisible: true,
    minWidth: '75px',
    align: 'right',
    descriptionEn: 'Column 29 quality & supervisory evaluation incentive',
    descriptionKm: 'ប្រាក់រង្វាន់វាយតម្លៃគុណភាព និងវិន័យជួរទី ២៩',
  },
  {
    key: 'foodAllowance',
    labelEn: 'Food Allowance',
    labelKm: 'ថ្លៃបាយ',
    category: 'allowances',
    defaultVisible: false,
    minWidth: '70px',
    align: 'right',
    badge: 'Optional',
    descriptionEn: 'Meals or overtime food subsidy ($10.00)',
    descriptionKm: 'ប្រាក់ឧបត្ថម្ភថ្លៃបាយហូបចុក',
  },

  // Gross & Statutory Deductions
  {
    key: 'gross',
    labelEn: 'Gross Salary',
    labelKm: 'ប្រាក់បៀវត្សរ៍សរុប',
    category: 'statutory',
    defaultVisible: true,
    minWidth: '85px',
    align: 'right',
    descriptionEn: 'Total earnings before statutory tax & pension withholdings',
    descriptionKm: 'ប្រាក់ចំណូលសរុបមុនកាត់ពន្ធ និង ប.ស.ស',
  },
  {
    key: 'nssf',
    labelEn: 'NSSF Pension',
    labelKm: 'ប.ស.ស សោធន',
    category: 'statutory',
    defaultVisible: true,
    minWidth: '70px',
    align: 'right',
    descriptionEn: '2% statutory pension fund (capped at $5.93 / 24,000 KHR)',
    descriptionKm: 'វិភាគទានសោធននិវត្តន៍ ២% (កំណត់ពិដាន $៥.៩៣)',
  },
  {
    key: 'tax',
    labelEn: 'GDT Tax',
    labelKm: 'ពន្ធលើបៀវត្ស (GDT)',
    category: 'statutory',
    defaultVisible: true,
    minWidth: '70px',
    align: 'right',
    descriptionEn: 'Cambodia GDT progressive Tax on Salary (TOS)',
    descriptionKm: 'ពន្ធលើប្រាក់បៀវត្សរ៍តាមអត្រាកើនឡើងជាលំដាប់',
  },

  // Distribution & Net Payout
  {
    key: 'firstPaid',
    labelEn: '1st Paid',
    labelKm: 'បើកលើកទី១',
    category: 'payout',
    defaultVisible: true,
    minWidth: '75px',
    align: 'right',
    descriptionEn: 'Mid-month advance / first payment installment',
    descriptionKm: 'ប្រាក់បើកលើកទី១ (ពាក់កណ្តាលខែ)',
  },
  {
    key: 'severance',
    labelEn: 'Severant 5%',
    labelKm: 'បំណាច់កុងត្រា ៥%',
    category: 'payout',
    defaultVisible: true,
    minWidth: '80px',
    align: 'right',
    descriptionEn: 'Column 50 FDC 5% contract indemnity payout',
    descriptionKm: 'ប្រាក់បំណាច់កុងត្រា ៥% ជួរទី ៥០ (FDC)',
  },
  {
    key: 'secondPaid',
    labelEn: '2nd Paid',
    labelKm: 'បើកលើកទី២',
    category: 'payout',
    defaultVisible: true,
    minWidth: '75px',
    align: 'right',
    descriptionEn: 'End-of-month final disbursement installment',
    descriptionKm: 'ប្រាក់បើកលើកទី២ (ចុងខែ)',
  },
  {
    key: 'net',
    labelEn: 'Net Take-Home',
    labelKm: 'ប្រាក់សុទ្ធត្រូវបើក',
    category: 'payout',
    defaultVisible: true,
    minWidth: '90px',
    align: 'right',
    descriptionEn: 'Total net payable amount deposited to worker ABA account',
    descriptionKm: 'ប្រាក់បៀវត្សរ៍សុទ្ធចុងក្រោយដែលកម្មករទទួលបាន',
  },

  // Metadata & Actions
  {
    key: 'status',
    labelEn: 'Status',
    labelKm: 'ស្ថានភាព',
    category: 'meta',
    defaultVisible: false,
    minWidth: '75px',
    align: 'center',
    badge: 'Optional',
    descriptionEn: 'Payment status (Processing, Paid, Pending)',
    descriptionKm: 'ស្ថានភាពបើកប្រាក់ (កំពុងដំណើរការ, បានបើក)',
  },
  {
    key: 'actions',
    labelEn: 'Actions',
    labelKm: 'សកម្មភាព',
    category: 'meta',
    defaultVisible: true,
    minWidth: '80px',
    align: 'center',
    descriptionEn: 'Audit Trace and Official Printable Payslip',
    descriptionKm: 'ផ្ទៀងផ្ទាត់រូបមន្ត និងបោះពុម្ពប័ណ្ណបើកប្រាក់',
  },
];

export const CATEGORY_LABELS: Record<
  ColumnCategoryKey,
  { labelEn: string; labelKm: string; color: string }
> = {
  identity: {
    labelEn: 'Staff Identity',
    labelKm: 'អត្តសញ្ញាណបុគ្គលិក',
    color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200',
  },
  salary: {
    labelEn: 'Base & Attendance',
    labelKm: 'ប្រាក់ខែគោល & វត្តមាន',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200',
  },
  allowances: {
    labelEn: 'Allowances & Bonuses',
    labelKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200',
  },
  statutory: {
    labelEn: 'Gross & Tax / NSSF',
    labelKm: 'ប្រាក់សរុប & ពន្ធ / ប.ស.ស',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200',
  },
  payout: {
    labelEn: 'Disbursement & Net Pay',
    labelKm: 'ការទូទាត់ & ប្រាក់សុទ្ធ',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200',
  },
  meta: {
    labelEn: 'Actions & Status',
    labelKm: 'សកម្មភាព & ស្ថានភាព',
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  },
};

export interface ColumnPreset {
  id: string;
  nameEn: string;
  nameKm: string;
  descriptionEn: string;
  descriptionKm: string;
  columnKeys: PayrollColumnKey[];
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  {
    id: 'default',
    nameEn: 'Default (20 Cols)',
    nameKm: 'ស្តង់ដារ (២០ ជួរ)',
    descriptionEn: 'Standard factory payroll ledger view',
    descriptionKm: 'ទម្រង់ស្តង់ដាររោងចក្រធម្មតា',
    columnKeys: PAYROLL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
  },
  {
    id: 'all',
    nameEn: 'Show All (25 Cols)',
    nameKm: 'បង្ហាញទាំងអស់ (២៥ ជួរ)',
    descriptionEn: 'Complete 55-column ledger breakdown',
    descriptionKm: 'បង្ហាញគ្រប់ជួរឈរទាំងអស់នៃបញ្ជីបៀវត្ស',
    columnKeys: PAYROLL_COLUMNS.map((c) => c.key),
  },
  {
    id: 'compact',
    nameEn: 'Executive Summary',
    nameKm: 'សង្ខេបថ្នាក់ដឹកនាំ',
    descriptionEn: 'Compact overview: ID, Name, Dept, Gross, Tax, NSSF, Net',
    descriptionKm: 'មើលត្រឹមអត្តលេខ ឈ្មោះ ផ្នែក ប្រាក់សរុប ពន្ធ ប.ស.ស និងប្រាក់សុទ្ធ',
    columnKeys: ['id', 'name', 'group', 'gross', 'nssf', 'tax', 'net', 'actions'],
  },
  {
    id: 'earnings',
    nameEn: 'Earnings & Bonuses',
    nameKm: 'ប្រាក់ចំណូល & រង្វាន់',
    descriptionEn: 'Focus on working sal, seniority, OT, sewing & eval bonuses',
    descriptionKm: 'ផ្តោតលើប្រាក់ខែជាក់ស្តែង អតីតភាព ថែមម៉ោង និងរង្វាន់ផ្សេងៗ',
    columnKeys: [
      'id',
      'name',
      'group',
      'baseSalary',
      'workingSal',
      'seniority',
      'transport',
      'nonAbsent',
      'otPay',
      'targetBonus',
      'evalBonus',
      'gross',
      'actions',
    ],
  },
  {
    id: 'payouts',
    nameEn: 'Disbursements & Payout',
    nameKm: 'ការបើកប្រាក់ & សុទ្ធ',
    descriptionEn: 'Focus on Gross, 1st Paid, Severance, 2nd Paid, and Net',
    descriptionKm: 'ផ្តោតលើការបើកលើកទី១ បំណាច់កុងត្រា លើកទី២ និងប្រាក់សុទ្ធ',
    columnKeys: [
      'id',
      'name',
      'group',
      'bankAccount',
      'gross',
      'nssf',
      'tax',
      'firstPaid',
      'severance',
      'secondPaid',
      'net',
      'actions',
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<PayrollColumnKey>;
  onToggleColumn: (key: PayrollColumnKey) => void;
  onSetColumns: (keys: PayrollColumnKey[]) => void;
  onResetDefault: () => void;
  language: 'km' | 'en';
}

export default function PayrollColumnVisibilityMenu({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
  onSetColumns,
  onResetDefault,
  language,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ColumnCategoryKey | 'all'>('all');

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter columns by query & category
  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PAYROLL_COLUMNS.filter((col) => {
      if (selectedCategory !== 'all' && col.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        col.labelEn.toLowerCase().includes(q) ||
        col.labelKm.toLowerCase().includes(q) ||
        col.key.toLowerCase().includes(q) ||
        (col.descriptionEn && col.descriptionEn.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const totalCols = PAYROLL_COLUMNS.length;
  const visibleCount = PAYROLL_COLUMNS.filter((c) => visibleColumns.has(c.key)).length;
  const hiddenCount = totalCols - visibleCount;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ maxHeight: '82vh' }}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>{language === 'km' ? 'គ្រប់គ្រងជួរឈរបៀវត្សរ៍' : 'Payroll Column Visibility'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {visibleCount}/{totalCols}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? `លាក់ ឬបង្ហាញជួរឈរ (${hiddenCount} ជួរឈរត្រូវបានលាក់)`
                  : `Show or hide ledger columns (${hiddenCount} hidden)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-3">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>{language === 'km' ? 'ទម្រង់កំណត់រហ័ស (Quick Presets):' : 'Quick Presets:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLUMN_PRESETS.map((preset) => {
              const isMatch =
                preset.columnKeys.length === visibleCount &&
                preset.columnKeys.every((k) => visibleColumns.has(k));

              return (
                <button
                  key={preset.id}
                  onClick={() => onSetColumns(preset.columnKeys)}
                  title={language === 'km' ? preset.descriptionKm : preset.descriptionEn}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isMatch
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {isMatch && <Check size={11} />}
                  <span>{language === 'km' ? preset.nameKm : preset.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកជួរឈរ...' : 'Search column name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ColumnCategoryKey | 'all')}
            className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទ' : 'All Types'}</option>
            <option value="identity">{language === 'km' ? 'អត្តសញ្ញាណ' : 'Identity'}</option>
            <option value="salary">{language === 'km' ? 'ប្រាក់ខែគោល' : 'Base Sal'}</option>
            <option value="allowances">{language === 'km' ? 'ឧបត្ថម្ភ & រង្វាន់' : 'Allowances'}</option>
            <option value="statutory">{language === 'km' ? 'ពន្ធ & ប.ស.ស' : 'Gross & Tax'}</option>
            <option value="payout">{language === 'km' ? 'ការបើក & សុទ្ធ' : 'Payout'}</option>
            <option value="meta">{language === 'km' ? 'ផ្សេងៗ' : 'Actions'}</option>
          </select>
        </div>
      </div>

      {/* Column Checkboxes List */}
      <div className="p-2 overflow-y-auto max-h-[320px] divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredColumns.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            {language === 'km' ? 'រកមិនឃើញជួរឈរដែលស្វែងរកទេ' : 'No matching columns found'}
          </div>
        ) : (
          filteredColumns.map((col) => {
            const isVisible = visibleColumns.has(col.key);
            const catInfo = CATEGORY_LABELS[col.category];

            return (
              <div
                key={col.key}
                onClick={() => onToggleColumn(col.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer group select-none ${
                  isVisible
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'opacity-60 hover:opacity-100 hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                      isVisible
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                    }`}
                  >
                    {isVisible && <Check size={12} strokeWidth={3} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isVisible
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-500 line-through'
                        }`}
                      >
                        {language === 'km' ? col.labelKm : col.labelEn}
                      </span>
                      {col.badge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-semibold uppercase">
                          {col.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {language === 'km' ? `${col.labelEn}${col.descriptionEn ? ` • ${col.descriptionEn}` : ''}` : (col.descriptionEn || col.labelEn)}
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Eye */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${catInfo.color}`}
                  >
                    {language === 'km' ? catInfo.labelKm.split(' ')[0] : catInfo.labelEn.split(' ')[0]}
                  </span>
                  <div
                    className={`p-1 rounded-md transition-colors ${
                      isVisible
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title={isVisible ? 'Visible (Click to hide)' : 'Hidden (Click to show)'}
                  >
                    {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
        <button
          onClick={onResetDefault}
          className="btn-press px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>{language === 'km' ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset Default'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSetColumns(PAYROLL_COLUMNS.map((c) => c.key))}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បង្ហាញទាំងអស់' : 'Show All'}
          </button>
          <button
            onClick={onClose}
            className="btn-press px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
          >
            {language === 'km' ? 'រួចរាល់' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
