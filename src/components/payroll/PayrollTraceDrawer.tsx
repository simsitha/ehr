'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PayrollRecord } from '@/lib/types';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';
import {
  X,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
  Printer,
  Copy,
  Check,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatLocalizedText } from '@/lib/translations';

interface PayrollTraceDrawerProps {
  payroll: PayrollRecord | null;
  onClose: () => void;
}

export interface DetailedTraceStep {
  id: string;
  category: 'base' | 'allowances' | 'gross' | 'statutory' | 'tax' | 'payout';
  categoryTitle: string;
  categoryTitleKm: string;
  stepNumber: number;
  title: string;
  title_km: string;
  badge: string;
  badgeColor: string;
  legalReference?: string;
  symbolicFormula: string;
  substitutedFormula: string;
  result: string;
  variables: Array<{ label: string; value: string | number }>;
  explanation: string;
  explanation_km: string;
  isTaxStep?: boolean;
  isPayoutStep?: boolean;
  isNssfStep?: boolean;
}

export default function PayrollTraceDrawer({ payroll, onClose }: PayrollTraceDrawerProps) {
  const { language, showToast } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Generate exhaustive step-by-step breakdown dynamically
  const traceSteps: DetailedTraceStep[] = useMemo(() => {
    if (!payroll) return [];

    const base = Number(payroll.base_salary || 210);
    const standardDays = 26;
    const workingDays = Number(payroll.working_days || 26);
    const absentDays = Number(payroll.absent_days || 0);
    const unpaidDays = Number(payroll.unpaid_days ?? (absentDays > 0 ? absentDays : 0));
    const dailyRate = Math.round((base / standardDays) * 10000) / 10000;
    const hourlyRate = Math.round((dailyRate / 8) * 10000) / 10000;
    const unpaidDeduction = Math.round(dailyRate * unpaidDays * 100) / 100;
    const basicWorkingSalary = Number(
      payroll.basic_working_salary ?? Math.max(0, Math.round((base - unpaidDeduction) * 100) / 100)
    );

    const seniority = Number(payroll.seniority_bonus || 0);
    const position = Number(payroll.position_allowance || 0);
    const sewingMatrix = Number(payroll.sewing_skill_matrix || 0);
    const skill = Number(payroll.skill_allowance || 0);
    const transportHousing = Number(payroll.transport_housing ?? 16.0);
    const attendanceBonus = Number(payroll.attendance_allowance || 0);
    const food = Number(payroll.food_allowance ?? 65.0);
    const mealCutOffDays = Math.ceil(unpaidDays);
    const otPay = Number(payroll.overtime_pay || 0);
    const otFood = Number(payroll.overtime_food || 0);
    const achievementBonus = Number(payroll.achievement_bonus || 0);
    const monthlyEvalBonus = Number(payroll.monthly_eval_bonus || 0);

    const gross = Number(
      payroll.gross_salary ??
        Math.round(
          (basicWorkingSalary +
            seniority +
            position +
            sewingMatrix +
            skill +
            transportHousing +
            attendanceBonus +
            food +
            otPay +
            otFood +
            achievementBonus +
            monthlyEvalBonus) *
            100
        ) / 100
    );

    const nonTaxableAmount = Number(payroll.non_taxable_amount ?? Math.max(0, gross - transportHousing));
    const pensionUsd = Number(payroll.pension_usd ?? payroll.insurance_deduction ?? 5.93);
    const pensionKhr = Number(payroll.pension_khr ?? Math.round(pensionUsd * (payroll.nssf_rate_khr || 4049)));
    const gdtRate = Number(payroll.exchange_rate_khr || 4044);
    const nssfRate = Number(payroll.nssf_rate_khr || 4049);

    const taxableSalaryUsd = Number(
      payroll.taxable_salary_usd ?? Math.max(0, Math.round((nonTaxableAmount - pensionUsd) * 100) / 100)
    );
    const taxableSalaryKhr = Number(
      payroll.taxable_salary_khr ?? Math.round(taxableSalaryUsd * gdtRate)
    );

    const dependents = Number(payroll.dependents_count || 0);
    const dependentDeductionKhr = dependents * 150000;
    const taxableBaseKhr = Number(
      payroll.taxable_base_khr ?? Math.max(0, taxableSalaryKhr - dependentDeductionKhr)
    );

    const taxRateStr = payroll.tax_rate || (taxableBaseKhr <= 1500000 ? '0%' : taxableBaseKhr <= 2000000 ? '5%' : taxableBaseKhr <= 8500000 ? '10%' : taxableBaseKhr <= 12500000 ? '15%' : '20%');
    const taxKhr = Number(payroll.tax_khr ?? 0);
    const taxUsd = Number(payroll.tax_usd ?? payroll.tax_deduction ?? 0);

    const afterTaxSalary = Number(
      payroll.after_tax_salary ?? Math.round((gross - taxUsd - pensionUsd) * 100) / 100
    );

    const firstPaid = Number(payroll.first_paid ?? 0);
    const targetBonus = Number(payroll.target_bonus ?? 0);
    const severancePay = Number(payroll.severance_pay ?? 0);
    const secondPaid = Number(
      payroll.second_paid ?? Math.round((afterTaxSalary + severancePay - firstPaid - targetBonus) * 100) / 100
    );
    const totalPaid = Number(payroll.total_paid ?? payroll.net_salary ?? (firstPaid + targetBonus + secondPaid));

    const steps: DetailedTraceStep[] = [
      // 1. Base Salary & Standard Rates
      {
        id: 'step-1-base-rates',
        category: 'base',
        categoryTitle: 'Base Wage & Attendance',
        categoryTitleKm: 'ប្រាក់ខែគោល & វត្តមាន',
        stepNumber: 1,
        title: 'Contractual Base Salary & Daily/Hourly Rates',
        title_km: 'ប្រាក់ខែគោលតាមកិច្ចសន្យា & អត្រាប្រចាំថ្ងៃ/ម៉ោង',
        badge: 'Contract Base',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        legalReference: 'Cambodia Labor Law Art. 104 & Prakas on Minimum Wage',
        symbolicFormula: 'Daily Rate = Base Wage ÷ Standard Factory Working Days (26) | Hourly Rate = Daily Rate ÷ 8h',
        substitutedFormula: `$${base.toFixed(2)} ÷ ${standardDays} days = $${dailyRate.toFixed(4)}/day | $${dailyRate.toFixed(4)} ÷ 8 hours = $${hourlyRate.toFixed(4)}/hr`,
        result: `$${base.toFixed(2)} / month ($${dailyRate.toFixed(2)}/day)`,
        variables: [
          { label: 'Contract Base Salary', value: `$${base.toFixed(2)}` },
          { label: 'Standard Factory Days', value: `${standardDays} days` },
          { label: 'Calculated Daily Rate', value: `$${dailyRate.toFixed(4)}` },
          { label: 'Calculated Hourly Rate', value: `$${hourlyRate.toFixed(4)}` },
        ],
        explanation:
          'The contractual base salary represents the statutory benchmark for all employment compensation. The official Cambodian labor standard denominator is 26 scheduled operating days per month, yielding exact prorated daily ($' +
          dailyRate.toFixed(2) +
          ') and hourly ($' +
          hourlyRate.toFixed(2) +
          ') work rates.',
        explanation_km:
          'ប្រាក់ខែគោលតាមកិច្ចសន្យា គឺជាមូលដ្ឋានគ្រឹះស្របច្បាប់សម្រាប់ការគណនាប្រាក់បំណាច់ទាំងអស់។ ផ្អែកតាមស្តង់ដារច្បាប់ការងារកម្ពុជា ចំនួនថ្ងៃធ្វើការធម្មតាគឺ ២៦ ថ្ងៃក្នុងមួយខែ ដែលកំណត់បានអត្រាប្រចាំថ្ងៃ $' +
          dailyRate.toFixed(2) +
          ' និងអត្រាក្នុងមួយម៉ោង $' +
          hourlyRate.toFixed(2) +
          '។',
      },

      // 2. Attendance & Basic Working Salary
      {
        id: 'step-2-basic-working',
        category: 'base',
        categoryTitle: 'Base Wage & Attendance',
        categoryTitleKm: 'ប្រាក់ខែគោល & វត្តមាន',
        stepNumber: 2,
        title: 'Attendance Proration & Basic Working Salary',
        title_km: 'ការកាត់កងតាមវត្តមានជាក់ស្តែង & ប្រាក់ខែគោលបំពេញការងារ',
        badge: unpaidDays > 0 ? 'Prorated Absence' : 'Full Attendance',
        badgeColor: unpaidDays > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        legalReference: 'Cambodia Labor Law Art. 108 & Factory Timekeeping Policy',
        symbolicFormula: 'Basic Working Salary = Base Wage − [ (Base Wage ÷ 26) × Unpaid Absent Days ]',
        substitutedFormula:
          unpaidDays > 0
            ? `$${base.toFixed(2)} − [ ($${base.toFixed(2)} ÷ 26) × ${unpaidDays.toFixed(1)} days ] = $${base.toFixed(2)} − $${unpaidDeduction.toFixed(2)} = $${basicWorkingSalary.toFixed(2)}`
            : `$${base.toFixed(2)} − [ $0.00 absence deduction ] = $${basicWorkingSalary.toFixed(2)}`,
        result: `$${basicWorkingSalary.toFixed(2)}`,
        variables: [
          { label: 'Scheduled Roster Days', value: `${workingDays} days` },
          { label: 'Actual Days Worked', value: `${(workingDays - unpaidDays).toFixed(1)} days` },
          { label: 'Unpaid / Absent Days', value: `${unpaidDays.toFixed(1)} days` },
          { label: 'Absence Deduction Amount', value: `-$${unpaidDeduction.toFixed(2)}` },
          { label: 'Net Basic Working Salary', value: `$${basicWorkingSalary.toFixed(2)}` },
        ],
        explanation:
          unpaidDays > 0
            ? `When an employee incurs unauthorized absences or unpaid leave, wages are prorated using the daily rate ($${dailyRate.toFixed(4)}/day). Here, ${unpaidDays} absence days reduce the base salary by $${unpaidDeduction.toFixed(2)}, leaving an earned basic working wage of $${basicWorkingSalary.toFixed(2)}.`
            : `The employee fulfilled full scheduled attendance with 0 unauthorized absences or unpaid days, earning 100% of their base wage ($${basicWorkingSalary.toFixed(2)}) without deductions.`,
        explanation_km:
          unpaidDays > 0
            ? `នៅពេលកម្មករមានការអវត្តមានឥតច្បាប់ ឬឈប់សម្រាកគ្មានប្រាក់ឈ្នួល ប្រាក់ខែនឹងត្រូវកាត់កងតាមអត្រាប្រចាំថ្ងៃ ($${dailyRate.toFixed(2)}/ថ្ងៃ)។ សម្រាប់ករណីនេះ អវត្តមាន ${unpaidDays} ថ្ងៃ ត្រូវកាត់ប្រាក់ $${unpaidDeduction.toFixed(2)} ដោយទទួលបានប្រាក់ខែគោលបំពេញការងារសុទ្ធចំនួន $${basicWorkingSalary.toFixed(2)}។`
            : `កម្មករនិយោជិតបានបំពេញការងារពេញលេញដោយគ្មានការអវត្តមានឥតច្បាប់ឡើយ (០ ថ្ងៃ) ដូច្នេះទទួលបានប្រាក់ខែគោលពេញ ១០០% ចំនួន $${basicWorkingSalary.toFixed(2)}។`,
      },

      // 3. Seniority Bonus
      {
        id: 'step-3-seniority',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 3,
        title: 'Seniority Bonus (Tenure Recognition)',
        title_km: 'ប្រាក់រង្វាន់អតីតភាពការងារ (Seniority Bonus)',
        badge: 'Statutory Benefit',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        legalReference: 'Prakas No. 017/00 & Labor Law Article 89',
        symbolicFormula: 'Tenure Scale: Complete 1 yr = $1, 2 yrs = $2, 3 yrs = $3, 4 yrs = $4, 5 yrs = $5, 6 yrs = $6 (+$1/yr up to $11.00/mo cap)',
        substitutedFormula: `Join Date: ${payroll.join_date || 'N/A'} (${calculateSeniorityAllowanceFromDate(payroll.join_date).tenureLabel}) → $${seniority.toFixed(2)} / month`,
        result: `+$${seniority.toFixed(2)}`,
        variables: [
          { label: 'Join Date', value: payroll.join_date || 'N/A' },
          { label: 'Completed Tenure', value: calculateSeniorityAllowanceFromDate(payroll.join_date).tenureLabel },
          { label: 'Monthly Seniority Bonus', value: `+$${seniority.toFixed(2)}` },
          { label: 'Statutory Scale', value: '$1.00/yr (Cap: $11.00)' },
        ],
        explanation:
          (payroll.join_date
            ? `Based on Join Date of ${payroll.join_date}, the employee has completed continuous service of ${calculateSeniorityAllowanceFromDate(payroll.join_date).tenureLabel}. `
            : '') +
          'Cambodian labor legislation and factory scale provide ongoing seniority compensation for continuous tenure: $1.00/month after completion of the 1st year of service, $2.00 for 2 years, $3.00 for 3 years, $4.00 for 4 years, $5.00 for 5 years, $6.00 for 6 years, increasing by $1.00 each subsequent year up to $11.00/month.',
        explanation_km:
          (payroll.join_date
            ? `ផ្អែកតាមថ្ងៃចូលធ្វើការ ${payroll.join_date} កម្មករនិយោជិតបានបម្រើការងារជាប់លាប់ចំនួន ${calculateSeniorityAllowanceFromDate(payroll.join_date).tenureLabel}។ `
            : '') +
          'ច្បាប់ការងារ និងបទបញ្ជាផ្ទៃក្នុងផ្ដល់ប្រាក់រង្វាន់អតីតភាពការងារសម្រាប់ការបម្រើការងារជាប់លាប់៖ បន្ទាប់ពីចប់ឆ្នាំទី១ ទទួលបាន $១/ខែ, ២ ឆ្នាំ $២, ៣ ឆ្នាំ $៣, ៤ ឆ្នាំ $៤, ៥ ឆ្នាំ $៥, ៦ ឆ្នាំ $៦ និងកើនឡើង $១ ក្នុងមួយឆ្នាំៗ រហូតដល់ $១១/ខែ។',
      },

      // 4. Supervisory Position & Leadership Allowance
      {
        id: 'step-4-position',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 4,
        title: 'Supervisory Position & Leadership Allowance',
        title_km: 'ប្រាក់ឧបត្ថម្ភមុខតំណែង & ការទទួលខុសត្រូវ',
        badge: position > 0 ? 'Role Allowance' : 'Standard Non-Supervisory',
        badgeColor: position > 0 ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Hestra Factory Technical Hierarchy Scale',
        symbolicFormula: 'Position Allowance = Contractual Role Premium',
        substitutedFormula: `Position Premium Assigned = $${position.toFixed(2)} / month`,
        result: `+$${position.toFixed(2)}`,
        variables: [
          { label: 'Position / Role', value: payroll.employee_role || 'Staff / Line Worker' },
          { label: 'Position Allowance', value: `+$${position.toFixed(2)}` },
        ],
        explanation:
          'Position allowances compensate section supervisors, technical line leaders, and quality assurance personnel for administrative management, team coordination, and defect oversight responsibilities.',
        explanation_km:
          'ប្រាក់ឧបត្ថម្ភមុខតំណែង ផ្ដល់ជូនសម្រាប់ប្រធានផ្នែក ប្រធានក្រុមដេរ និងអ្នកត្រួតពិនិត្យគុណភាព (QC) សម្រាប់ការទទួលខុសត្រូវលើការដឹកនាំ និងគ្រប់គ្រងសង្វាក់ផលិតកម្ម។',
      },

      // 5. Professional Skill Allowance & Technical Craftsmanship
      {
        id: 'step-5-skill',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 5,
        title: 'Professional Skill Allowance & Technical Matrix',
        title_km: 'ប្រាក់ឧបត្ថម្ភជំនាញវិជ្ជាជីវៈ & បច្ចេកទេស',
        badge: skill > 0 ? 'Skill Premium' : 'General Production',
        badgeColor: skill > 0 ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Hestra Technical Craftsmanship Scale',
        symbolicFormula: 'Skill Premium = Certified Operational Craftsmanship Grade',
        substitutedFormula: `Accredited Skill Matrix Allowance = $${skill.toFixed(2)} / month`,
        result: `+$${skill.toFixed(2)}`,
        variables: [
          { label: 'Technical Specialty', value: payroll.employee_role || 'Skilled Technician' },
          { label: 'Skill Allowance Amount', value: `+$${skill.toFixed(2)}` },
          { label: 'Sewing Matrix Grade Allowance', value: `+$${sewingMatrix.toFixed(2)}` },
        ],
        explanation:
          'Rewards accredited trade expertise (such as machinery maintenance, tooling, precision leather glove cutting, or specialized stitching) that requires multi-year expertise and ensures high factory yields.',
        explanation_km:
          'ផ្ដល់ជូនសម្រាប់ជំនាញវិជ្ជាជីវៈឯកទេស (ដូចជា ជួសជុលម៉ាស៊ីន កាត់ស្បែកស្រោមដៃ ឬដេរឯកទេស) ដែលទាមទារបទពិសោធន៍បច្ចេកទេសខ្ពស់ និងធានាទិន្នផលគុណភាពខ្ពស់។',
      },

      // 6. Transport & Housing Allowance (Statutory Non-Taxable Fringe Benefit)
      {
        id: 'step-6-transport',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 6,
        title: 'Transport & Housing Allowance (Non-Taxable Fringe Benefit)',
        title_km: 'ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ & ស្នាក់នៅ (មិនជាប់ពន្ធ)',
        badge: '100% Tax Exempt',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        legalReference: 'GDT Circular No. 011 & Minimum Wage Prakas (Art. 42)',
        symbolicFormula: 'Housing - Transport: $16.00/mo (>8 days worked) | $8.00/mo (≤8 days worked)',
        substitutedFormula: `Transport & Living Subsidy = $${transportHousing.toFixed(2)} / month`,
        result: `+$${transportHousing.toFixed(2)} (Tax-Free)`,
        variables: [
          { label: 'Monthly Transport Subsidy', value: `+$${transportHousing.toFixed(2)}` },
          { label: 'Standard Rate (>8 days)', value: '$16.00 / month' },
          { label: 'Half Rate (≤8 days)', value: '$8.00 / month' },
          { label: 'Tax Classification', value: 'Non-Taxable Fringe Benefit (Art. 42)' },
        ],
        explanation:
          'Under General Department of Taxation Circular No. 011 and factory policy, the Housing - Transport Allowance is $16.00 monthly when working over 8 days, or $8.00 if working 8 days or fewer (≤ 8 days). It is added to Gross Earnings but strictly excluded from Taxable Salary.',
        explanation_km:
          'យោងតាមសារាចរណែនាំលេខ ០១១ របស់អគ្គនាយកដ្ឋានពន្ធដារ និងគោលការណ៍រោងចក្រ ប្រាក់ឧបត្ថម្ភការស្នាក់នៅ និងធ្វើដំណើរគឺ $១៦.០០ ក្នុងមួយខែសម្រាប់ថ្ងៃធ្វើការលើសពី ៨ ថ្ងៃ ឬ $៨.០០ បើធ្វើការ ៨ ថ្ងៃ ឬតិចជាងនេះ។ ប្រាក់នេះមិនជាប់ពន្ធលើប្រាក់បៀវត្សរ៍ឡើយ។',
      },

      // 7. Attendance Allowance (Non-Absent Bonus)
      {
        id: 'step-7-attendance-bonus',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 7,
        title: 'Attendance Allowance (Non-Absent Monthly Incentive)',
        title_km: 'ប្រាក់ឧបត្ថម្ភវត្តមានទៀងទាត់ (Non-Absent Bonus)',
        badge: attendanceBonus > 0 ? 'Earned Bonus' : 'Ineligible',
        badgeColor: attendanceBonus > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200',
        legalReference: 'Hestra Factory Non-Absent Policy ($15.00–$20.00 Base)',
        symbolicFormula: 'Full Incentive granted when unexcused absence thresholds are respected',
        substitutedFormula: `Monthly Attendance Incentive = $${attendanceBonus.toFixed(2)} / month`,
        result: `+$${attendanceBonus.toFixed(2)}`,
        variables: [
          { label: 'Recorded Absences', value: `${absentDays} days` },
          { label: 'Attendance Incentive Disbursed', value: `+$${attendanceBonus.toFixed(2)}` },
        ],
        explanation:
          'Incentive designed to reward punctuality and continuous line attendance. Employees maintaining full attendance receive the monthly non-absent incentive to avoid line disruptions.',
        explanation_km:
          'ប្រាក់រង្វាន់លើកទឹកចិត្តសម្រាប់បុគ្គលិកដែលមានវត្តមានទៀងទាត់ និងមិនមានការអវត្តមានដែលប៉ះពាល់ដល់ខ្សែសង្វាក់ផលិតកម្ម។',
      },

      // 8. Food & Meal Allowance ($2.50/day, $0 if absent/unpaid or 0.5 day)
      {
        id: 'step-8-food',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 8,
        title: 'Monthly Food & Meal Nutritional Subsidy',
        title_km: 'ប្រាក់ឧបត្ថម្ភអាហារប្រចាំខែ (Meal Allowance)',
        badge: mealCutOffDays > 0 ? `${mealCutOffDays} Day(s) Cut Off ($0 for absent/0.5d)` : 'Full Subsidy',
        badgeColor: mealCutOffDays > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        legalReference: 'Factory Meal Allowance Policy ($2.50/day, $0 if absent/0.5d)',
        symbolicFormula: 'Meal Allowance = (Working Days - Cut Off Days) × $2.50/day',
        substitutedFormula: mealCutOffDays > 0
          ? `(${workingDays} days - ${mealCutOffDays} cut off [absent/0.5d = $0]) × $2.50/day = $${food.toFixed(2)} (-$${(mealCutOffDays * 2.5).toFixed(2)})`
          : `${workingDays} scheduled days × $2.50/day = $${food.toFixed(2)}`,
        result: `+$${food.toFixed(2)}`,
        variables: [
          { label: 'Daily Meal Rate', value: '$2.50 / day' },
          { label: 'Scheduled Work Days', value: `${workingDays} days` },
          { label: 'Unpaid / 0.5-Day Absences', value: `${unpaidDays} day(s) (${mealCutOffDays} day(s) cut off)` },
          { label: 'Net Meal Allowance', value: `+$${food.toFixed(2)}` },
        ],
        explanation: mealCutOffDays > 0
          ? `Meal allowance is $2.50 per working day ($${(workingDays * 2.5).toFixed(2)} standard). Absent (unpaid) or 0.5-day absent days receive $0 for that day. For ${mealCutOffDays} cut-off day(s), $${(mealCutOffDays * 2.5).toFixed(2)} was automatically deducted.`
          : `Full monthly meal subsidy granted at $2.50 per day for ${workingDays} working days ($${food.toFixed(2)}) with zero absences.`,
        explanation_km: mealCutOffDays > 0
          ? `ប្រាក់ឧបត្ថម្ភថ្លៃបាយ $២.៥០ ក្នុងមួយថ្ងៃធ្វើការ (ស្តង់ដារ $${(workingDays * 2.5).toFixed(2)})។ អវត្តមានឥតច្បាប់ ឬអវត្តមានកន្លះថ្ងៃ (០.៥ ថ្ងៃ) គឺទទួលបាន $០ សម្រាប់ថ្ងៃនោះ (កាត់ $២.៥០ ក្នុងមួយថ្ងៃ)។ សម្រាប់ថ្ងៃកាត់ផ្តាច់ ${mealCutOffDays} ថ្ងៃ ត្រូវបានកាត់កងចំនួន $${(mealCutOffDays * 2.5).toFixed(2)} ដោយស្វ័យប្រវត្តិ។`
          : `ប្រាក់ឧបត្ថម្ភថ្លៃបាយពេញលេញ $២.៥០ ក្នុងមួយថ្ងៃ សម្រាប់ ${workingDays} ថ្ងៃធ្វើការ ($${food.toFixed(2)}) ដោយសារគ្មានការអវត្តមាន។`,
      },

      // 9. Overtime Pay & OT Food
      {
        id: 'step-9-overtime',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 9,
        title: 'Overtime Compensation & Extended Shift Meal Allowance',
        title_km: 'ប្រាក់ឈ្នួលថែមម៉ោង & ថ្លៃបាយថែមម៉ោង (OT & Meal)',
        badge: otPay > 0 ? '1.5x Premium' : 'No Overtime',
        badgeColor: otPay > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Cambodia Labor Law Article 139 (150% / 200%)',
        symbolicFormula: 'Overtime Pay = Hourly Rate × Multiplier (1.5x / 2.0x) × Hours + OT Meal Allowance ($1.50 per 2h)',
        substitutedFormula:
          otPay > 0
            ? `OT Base Pay: $${otPay.toFixed(2)} + OT Meal Allowance: $${otFood.toFixed(2)} = $${(otPay + otFood).toFixed(2)}`
            : `$0.00 (No overtime performed this cycle)`,
        result: `+$${(otPay + otFood).toFixed(2)}`,
        variables: [
          { label: 'Base Hourly Rate', value: `$${hourlyRate.toFixed(4)}/hr` },
          { label: 'Statutory OT Multiplier', value: '1.5x (Normal) / 2.0x (Holiday/Night)' },
          { label: 'Overtime Wages (OT Pay)', value: `+$${otPay.toFixed(2)}` },
          { label: 'Overtime Meal Subsidy', value: `+$${otFood.toFixed(2)}` },
          { label: 'Total Overtime Compensation', value: `+$${(otPay + otFood).toFixed(2)}` },
        ],
        explanation:
          'Under Article 139 of the Cambodian Labor Law, overtime performed on standard weekdays beyond 8 hours is remunerated at 150% (1.5x), while night-time, Sunday, and public holiday shifts receive 200% (2.0x). Workers performing 2 or more overtime hours additionally receive statutory meal allowances.',
        explanation_km:
          'អនុលោមតាមមាត្រា ១៣៩ នៃច្បាប់ការងារកម្ពុជា ការថែមម៉ោងនៅថ្ងៃធម្មតាលើស ៨ ម៉ោង ត្រូវគិតប្រាក់ឈ្នួល ១៥០% (១.៥ ដង) ហើយវេនយប់ ថ្ងៃអាទិត្យ ឬថ្ងៃបុណ្យជាតិ ត្រូវគិត ២០០% (២.០ ដង) ព្រមទាំងទទួលបានថ្លៃបាយថែមម៉ោងបន្ថែម។',
      },

      // 10. Sewing Production Output Target Bonus
      {
        id: 'step-10-production-bonus',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 10,
        title: 'Weekly Sewing Output Quota Bonus (B1–B3)',
        title_km: 'ប្រាក់រង្វាន់គោលដៅដេរប្រចាំសប្តាហ៍ (B1–B3)',
        badge: achievementBonus > 0 ? 'Weekly Output Bonus' : 'No Output Bonus',
        badgeColor: achievementBonus > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Hestra Weekly Production Bonus Matrix (Tiers 100%, 110%, 120%)',
        symbolicFormula: 'Monthly Target Output Bonus = Sum of Approved Weekly Tiers ($10 / $15 / $20)',
        substitutedFormula:
          achievementBonus > 0
            ? `Sum of Weekly Production Tiers Achieved = $${achievementBonus.toFixed(2)}`
            : `$0.00 (No target output tiers reached this cycle)`,
        result: `+$${achievementBonus.toFixed(2)}`,
        variables: [
          { label: 'Weekly Target Output Bonus', value: `+$${achievementBonus.toFixed(2)}` },
          { label: 'Target Output Tiers', value: 'Tier 1 ($10/wk) | Tier 2 ($15/wk) | Tier 3 ($20/wk)' },
        ],
        explanation:
          'Sewing operators achieve direct weekly output bonuses by reaching or exceeding production targets (Tier 1 at 100%: +$10/wk, Tier 2 at 110%: +$15/wk, Tier 3 at 120%: +$20/wk). These bonuses automatically flow from weekly production logs into monthly payroll.',
        explanation_km:
          'កម្មករដេរទទួលបានប្រាក់រង្វាន់គោលដៅប្រចាំសប្តាហ៍នៅពេលសម្រេចបានលើសពីចំនួនកំណត់ (កម្រិត ១ ស្មើ ១០០%៖ +$១០, កម្រិត ២ ស្មើ ១១០%៖ +$១៥, កម្រិត ៣ ស្មើ ១២០%៖ +$២០)។ ទិន្នន័យនេះតភ្ជាប់ស្វ័យប្រវត្តិចេញពីតារាងកត់ត្រាផលិតផលដេរប្រចាំសប្តាហ៍។',
      },

      // 11. Monthly Evaluation Bonus (Column 29)
      {
        id: 'step-11-evaluation-bonus',
        category: 'allowances',
        categoryTitle: 'Allowances & Incentives',
        categoryTitleKm: 'ប្រាក់ឧបត្ថម្ភ & រង្វាន់លើកទឹកចិត្ត',
        stepNumber: 11,
        title: 'Monthly Evaluation Bonus (Performance & Attendance Evaluation)',
        title_km: 'ប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ (Monthly Evaluation Bonus - Column 29)',
        badge: monthlyEvalBonus > 0 ? `Tier: $${monthlyEvalBonus.toFixed(0)}/mo` : 'No Eval Bonus ($0)',
        badgeColor: monthlyEvalBonus > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Cambodian Garment Factory 55-Column Standard Ledger (Col 29) & Hestra Evaluation SOP',
        symbolicFormula: 'Monthly Evaluation Bonus = Evaluated Performance Tier ($20 / $15 / $11 / $6 / $0)',
        substitutedFormula:
          monthlyEvalBonus > 0
            ? `Assigned Evaluation Tier = $${monthlyEvalBonus.toFixed(2)} / month`
            : `$0.00 (Disqualified or Standard Baseline: Absences ≥ 2 or Attendance < 90%)`,
        result: `+$${monthlyEvalBonus.toFixed(2)}`,
        variables: [
          { label: 'Evaluation Bonus Disbursed', value: `+$${monthlyEvalBonus.toFixed(2)}` },
          { label: 'Evaluation Standard Tiers', value: '$20 (A+ Lead/105%) | $15 (A 100%) | $11 (B ≥95%) | $6 (C 90-95%)' },
          { label: 'Evaluation Criteria', value: 'Attendance Rate ≥ 90%, Max 1 Absence, Sewing Output & Supervisory Review' },
        ],
        explanation:
          monthlyEvalBonus > 0
            ? `The employee qualified for a $${monthlyEvalBonus.toFixed(2)} monthly evaluation bonus (Cambodian Factory Ledger Column 29). Evaluation is based on strict attendance compliance (zero or at most 1 unexcused absence, attendance rate ≥ 90%), line production quota, and line supervisor evaluation with 1-click supervisory override capability.`
            : `The employee did not receive a monthly evaluation bonus ($0.00). Workers are disqualified if they have 2 or more unauthorized absences, an overall attendance rate below 90%, or do not meet production evaluation standards for the period.`,
        explanation_km:
          monthlyEvalBonus > 0
            ? `បុគ្គលិកទទួលបានប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែចំនួន $${monthlyEvalBonus.toFixed(2)} (តារាងប្រាក់បៀវត្សរ៍រោងចក្រ ៥៥ ជួរឈរ ជួរទី ២៩)។ ការវាយតម្លៃនេះផ្អែកលើការអនុវត្តវត្តមានតឹងរ៉ឹង (អវត្តមានឥតច្បាប់មិនលើសពី ១ ថ្ងៃ អត្រាវត្តមាន ≥ ៩០%) ទិន្នផលផលិតកម្ម និងការវាយតម្លៃរបស់ប្រធានផ្នែក។`
            : `បុគ្គលិកមិនទទួលបានប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែឡើយ ($0.00) ដោយសារមិនបានបំពេញតាមលក្ខខណ្ឌកំណត់ (អវត្តមានឥតច្បាប់ចាប់ពី ២ ថ្ងៃឡើង អត្រាវត្តមានក្រោម ៩០% ឬមិនបំពេញតាមលក្ខណៈវិនិច្ឆ័យវាយតម្លៃ)។`,
      },

      // 12. Gross Earnings Aggregation
      {
        id: 'step-12-gross',
        category: 'gross',
        categoryTitle: 'Gross Earnings Aggregation',
        categoryTitleKm: 'ប្រាក់បៀវត្សរ៍សរុប (Gross Earnings)',
        stepNumber: 12,
        title: 'Total Gross Remuneration (Pre-Deduction Earnings)',
        title_km: 'ប្រាក់បៀវត្សរ៍សរុបមុនកាត់ (Total Gross Salary)',
        badge: 'Gross Earnings',
        badgeColor: 'bg-indigo-600 text-white font-extrabold shadow-xs',
        legalReference: 'Cambodia Labor Law Article 103 (Total Remuneration)',
        symbolicFormula: 'Gross Salary = Basic Working + Seniority + Position + Skill + Transport + Attendance + Food + OT + Performance',
        substitutedFormula: `$${basicWorkingSalary.toFixed(2)} (Basic) + $${seniority.toFixed(2)} (Seniority) + $${position.toFixed(2)} (Pos) + $${skill.toFixed(2)} (Skill) + $${transportHousing.toFixed(2)} (Transport) + $${attendanceBonus.toFixed(2)} (Att) + $${food.toFixed(2)} (Food) + $${(otPay + otFood).toFixed(2)} (OT) + $${achievementBonus.toFixed(2)} (Weekly Output) + $${monthlyEvalBonus.toFixed(2)} (Monthly Eval) = $${gross.toFixed(2)}`,
        result: `$${gross.toFixed(2)}`,
        variables: [
          { label: 'Basic Working Wage', value: `$${basicWorkingSalary.toFixed(2)}` },
          { label: 'Total Allowances & Premiums', value: `$${(gross - basicWorkingSalary).toFixed(2)}` },
          { label: 'Final Total Gross Salary', value: `$${gross.toFixed(2)}` },
        ],
        explanation:
          'Total Gross Salary represents the comprehensive aggregate of all monetary remuneration and statutory supplements earned by the worker during the calendar month prior to government taxation or social security contributions.',
        explanation_km:
          'ប្រាក់បៀវត្សរ៍សរុប (Gross) គឺជាផលបូកសរុបនៃប្រាក់ឈ្នួលគោលជាក់ស្តែង ប្រាក់ឧបត្ថម្ភ ប្រាក់ថែមម៉ោង និងរង្វាន់លើកទឹកចិត្តទាំងអស់របស់កម្មករនិយោជិតក្នុងខែ មុនពេលកាត់ពន្ធ ឬវិភាគទានរបបសន្តិសុខសង្គម។',
      },

      // 13. Non-Taxable Allowance Exemption (Fringe Benefits)
      {
        id: 'step-13-non-taxable',
        category: 'statutory',
        categoryTitle: 'Social Security & Deductions',
        categoryTitleKm: 'របបសន្តិសុខសង្គម & ការកាត់ប្រាក់',
        stepNumber: 13,
        title: 'Non-Taxable Fringe Benefit Exemption',
        title_km: 'ការលើកលែងប្រាក់បន្ទុកមិនជាប់ពន្ធ (Fringe Benefits)',
        badge: 'Tax Exemption',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        legalReference: 'Law on Taxation Article 42 & GDT Circular No. 011',
        symbolicFormula: 'Tax-Exempt Salary Base = Gross Salary − Statutory Non-Taxable Fringe Benefits',
        substitutedFormula: `$${gross.toFixed(2)} (Gross) − $${(gross - nonTaxableAmount).toFixed(2)} (Exempt Allowances) = $${nonTaxableAmount.toFixed(2)}`,
        result: `$${nonTaxableAmount.toFixed(2)} (Pre-Tax Base)`,
        variables: [
          { label: 'Total Gross Salary', value: `$${gross.toFixed(2)}` },
          { label: 'Exempt Transport & Living Allowance', value: `-$${transportHousing.toFixed(2)}` },
          { label: 'Net Pre-Tax Remuneration', value: `$${nonTaxableAmount.toFixed(2)}` },
        ],
        explanation:
          'Under Article 42 of the Cambodian Law on Taxation, transportation and housing allowances are legally classified as exempt fringe benefits and are subtracted from the gross amount to establish the pre-tax salary base.',
        explanation_km:
          'យោងតាមមាត្រា ៤២ នៃច្បាប់ស្តីពីសារពើពន្ធ ប្រាក់ឧបត្ថម្ភការធ្វើដំណើរ និងស្នាក់នៅ ត្រូវបានដកចេញពីប្រាក់ខែសរុប ដើម្បីកំណត់មូលដ្ឋានប្រាក់ឈ្នួលមុនគិតពន្ធ។',
      },

      // 14. NSSF Pension Fund Contribution (2% Capped)
      {
        id: 'step-14-nssf',
        category: 'statutory',
        categoryTitle: 'Social Security & Deductions',
        categoryTitleKm: 'របបសន្តិសុខសង្គម & ការកាត់ប្រាក់',
        stepNumber: 14,
        title: 'NSSF Pension Contribution (2% Mandatory Social Security)',
        title_km: 'ភាគទានរបបសន្តិសុខសង្គម (ប.ស.ស. សោធន ២% ជាប់ពិដាន)',
        badge: 'Mandatory 2% Cap',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        legalReference: 'Prakas No. 249 & Sub-Decree No. 32 (National Social Security Fund)',
        symbolicFormula: '2% Employee Pension, Capped at Contributory Ceiling of 1,200,000 KHR (~$296.37) = Maximum 24,000 KHR ($5.93/month)',
        substitutedFormula:
          gross >= 296.37
            ? `Wage exceeds 1,200,000 KHR ceiling → 1,200,000 KHR × 2% = 24,000 KHR ÷ ${nssfRate} KHR/USD = $${pensionUsd.toFixed(2)} USD`
            : `$${gross.toFixed(2)} × 2% = $${pensionUsd.toFixed(2)} USD (${pensionKhr.toLocaleString()} KHR)`,
        result: `-$${pensionUsd.toFixed(2)} (${pensionKhr.toLocaleString()} KHR)`,
        variables: [
          { label: 'Employee Contribution Rate', value: '2.0%' },
          { label: 'NSSF Contributory Ceiling', value: '1,200,000 KHR ($296.37)' },
          { label: 'Statutory Maximum Pension Cap', value: '24,000 KHR ($5.93)' },
          { label: 'Official NSSF Exchange Rate', value: `${nssfRate} KHR / USD` },
          { label: 'Actual Monthly Pension Deduction', value: `-$${pensionUsd.toFixed(2)}` },
        ],
        explanation:
          'Mandatory social security under Cambodia NSSF framework. Employees contribute 2% towards the National Pension Scheme, but the wage ceiling is legally capped at 1,200,000 KHR. Consequently, any employee earning above $296.37 pays the statutory maximum cap of 24,000 KHR ($5.93 USD). The employer contributes a matching 2%.',
        explanation_km:
          'កាតព្វកិច្ចច្បាប់នៃរបបសន្តិសុខសង្គម ប.ស.ស.។ កម្មករនិយោជិតត្រូវបង់ភាគទាន ២% នៃប្រាក់ឈ្នួលជាប់ភាគទាន ដែលមានពិដានអតិបរមាត្រឹម ១,២០០,០០០ រៀល ស្មើនឹងការកាត់អតិបរមា ២៤,០០០ រៀល ($៥.៩៣) ក្នុងមួយខែ។ និយោជកត្រូវបង់ភាគទាន ២% បន្ថែមទៀតស្មើគ្នា។',
        isNssfStep: true,
      },

      // 15. Taxable Salary in USD & Official GDT KHR Conversion
      {
        id: 'step-15-taxable-khr',
        category: 'tax',
        categoryTitle: 'Cambodia GDT Salary Tax',
        categoryTitleKm: 'ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT)',
        stepNumber: 15,
        title: 'Taxable Salary in USD & Official GDT KHR Conversion',
        title_km: 'ប្រាក់បៀវត្សរ៍គិតពន្ធជារៀលតាមអត្រាពន្ធដារផ្លូវការ',
        badge: 'GDT Official Rate',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        legalReference: 'GDT Monthly Official Exchange Rate (4,044 KHR/USD)',
        symbolicFormula: 'Taxable Salary KHR = [ Pre-Tax Remainder ($) − NSSF Pension ($) ] × Official GDT Exchange Rate',
        substitutedFormula: `[ $${nonTaxableAmount.toFixed(2)} − $${pensionUsd.toFixed(2)} ] × ${gdtRate} KHR/USD = $${taxableSalaryUsd.toFixed(2)} × ${gdtRate} = ${taxableSalaryKhr.toLocaleString()} KHR`,
        result: `${taxableSalaryKhr.toLocaleString()} KHR ($${taxableSalaryUsd.toFixed(2)})`,
        variables: [
          { label: 'Taxable Salary (USD)', value: `$${taxableSalaryUsd.toFixed(2)}` },
          { label: 'Official GDT Exchange Rate', value: `${gdtRate} KHR / USD` },
          { label: 'Gross Taxable Base (KHR)', value: `${taxableSalaryKhr.toLocaleString()} KHR` },
        ],
        explanation:
          'Under General Department of Taxation regulations, all salary tax calculations must be executed in National Khmer Riel (KHR). Net pre-tax earnings minus NSSF pension ($' +
          taxableSalaryUsd.toFixed(2) +
          ') are converted using the monthly GDT official exchange rate (' +
          gdtRate +
          ' KHR/USD).',
        explanation_km:
          'អនុលោមតាមបទប្បញ្ញត្តិរបស់អគ្គនាយកដ្ឋានពន្ធដារ ការគណនាពន្ធលើប្រាក់បៀវត្សរ៍ត្រូវធ្វើឡើងជារូបិយវត្ថុជាតិ (រៀល)។ ប្រាក់ឈ្នួលគិតពន្ធជាដុល្លារ ក្រោយដក ប.ស.ស. ($' +
          taxableSalaryUsd.toFixed(2) +
          ') ត្រូវបានបំប្លែងតាមអត្រាប្តូរប្រាក់ផ្លូវការរបស់ពន្ធដារ (' +
          gdtRate +
          ' រៀល/ដុល្លារ)។',
      },

      // 16. Family Dependent Relief Deductions
      {
        id: 'step-16-dependents',
        category: 'tax',
        categoryTitle: 'Cambodia GDT Salary Tax',
        categoryTitleKm: 'ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT)',
        stepNumber: 16,
        title: 'Family Dependent Tax Relief Deductions',
        title_km: 'ការកាត់បន្ថយបន្ទុកគ្រួសារ (Family Dependent Relief)',
        badge: dependents > 0 ? `${dependents} Dependent(s)` : 'No Dependents',
        badgeColor: dependents > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Law on Taxation Article 47 & Sub-Decree on Tax on Salary',
        symbolicFormula: 'Tax Relief Deduction = Dependents Count × 150,000 KHR / Dependent',
        substitutedFormula:
          dependents > 0
            ? `${dependents} Dependent(s) × 150,000 KHR = −${dependentDeductionKhr.toLocaleString()} KHR | ${taxableSalaryKhr.toLocaleString()} − ${dependentDeductionKhr.toLocaleString()} = ${taxableBaseKhr.toLocaleString()} KHR`
            : `0 Dependents × 150,000 KHR = 0 KHR deduction | Net Base = ${taxableBaseKhr.toLocaleString()} KHR`,
        result: `-${dependentDeductionKhr.toLocaleString()} KHR (Net Base: ${taxableBaseKhr.toLocaleString()} KHR)`,
        variables: [
          { label: 'Registered Dependents', value: `${dependents} dependent(s)` },
          { label: 'Relief per Dependent', value: '150,000 KHR (~$37.09)' },
          { label: 'Total Family Relief Deducted', value: `-${dependentDeductionKhr.toLocaleString()} KHR` },
          { label: 'Final Net Taxable Base KHR', value: `${taxableBaseKhr.toLocaleString()} KHR` },
        ],
        explanation:
          'Tax relief of 150,000 KHR per month (~$37.09) is granted for each registered dependent (non-working homemaker spouse and children under 18 or students under 25). This statutory relief directly reduces the taxable base before progressive bracket application.',
        explanation_km:
          'ច្បាប់សារពើពន្ធកម្ពុជាអនុញ្ញាតឱ្យកាត់បន្ថយបន្ទុកគ្រួសារចំនួន ១៥០,០០០ រៀល ក្នុងមួយខែ សម្រាប់សហព័ទ្ធដែលគ្មានការងារធ្វើ និងកូនក្នុងបន្ទុក (អាយុក្រោម ១៨ ឆ្នាំ ឬនិស្សិតក្រោម ២៥ ឆ្នាំ) ដែលជួយកាត់បន្ថយបន្ទុកពន្ធរបស់កម្មករ។',
      },

      // 17. Cambodia GDT Progressive Tax on Salary Calculation
      {
        id: 'step-17-tax-calculation',
        category: 'tax',
        categoryTitle: 'Cambodia GDT Salary Tax',
        categoryTitleKm: 'ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT)',
        stepNumber: 17,
        title: 'Cambodia GDT Progressive Salary Tax Calculation',
        title_km: 'ការគណនាពន្ធលើប្រាក់បៀវត្សរ៍តាមថ្នាក់កើនតាមលំដាប់',
        badge: `Bracket: ${taxRateStr}`,
        badgeColor: taxUsd > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        legalReference: 'Sub-Decree on Tax on Salary (GDT Progressive Schedule)',
        symbolicFormula:
          taxableBaseKhr <= 1500000
            ? 'Tier 1 (0 to 1.5M KHR): Tax = 0% → 0 KHR ($0.00)'
            : taxableBaseKhr <= 2000000
            ? 'Tier 2 (1.5M to 2M KHR): [ Taxable Base × 5% ] − 75,000 KHR Constant'
            : taxableBaseKhr <= 8500000
            ? 'Tier 3 (2M to 8.5M KHR): [ Taxable Base × 10% ] − 175,000 KHR Constant'
            : taxableBaseKhr <= 12500000
            ? 'Tier 4 (8.5M to 12.5M KHR): [ Taxable Base × 15% ] − 600,000 KHR Constant'
            : 'Tier 5 (> 12.5M KHR): [ Taxable Base × 20% ] − 1,225,000 KHR Constant',
        substitutedFormula:
          taxableBaseKhr <= 1500000
            ? `${taxableBaseKhr.toLocaleString()} KHR ≤ 1,500,000 KHR (0% Exempt Bracket) = 0 KHR ($0.00 USD)`
            : taxableBaseKhr <= 2000000
            ? `[ ${taxableBaseKhr.toLocaleString()} KHR × 5% ] − 75,000 KHR = ${(taxableBaseKhr * 0.05).toFixed(1)} − 75,000 = ${taxKhr.toFixed(1)} KHR ÷ ${gdtRate} = $${taxUsd.toFixed(2)} USD`
            : taxableBaseKhr <= 8500000
            ? `[ ${taxableBaseKhr.toLocaleString()} KHR × 10% ] − 175,000 KHR = ${(taxableBaseKhr * 0.1).toFixed(1)} − 175,000 = ${taxKhr.toFixed(1)} KHR ÷ ${gdtRate} = $${taxUsd.toFixed(2)} USD`
            : taxableBaseKhr <= 12500000
            ? `[ ${taxableBaseKhr.toLocaleString()} KHR × 15% ] − 600,000 KHR = ${(taxableBaseKhr * 0.15).toFixed(1)} − 600,000 = ${taxKhr.toFixed(1)} KHR ÷ ${gdtRate} = $${taxUsd.toFixed(2)} USD`
            : `[ ${taxableBaseKhr.toLocaleString()} KHR × 20% ] − 1,225,000 KHR = ${(taxableBaseKhr * 0.2).toFixed(1)} − 1,225,000 = ${taxKhr.toFixed(1)} KHR ÷ ${gdtRate} = $${taxUsd.toFixed(2)} USD`,
        result: `-$${taxUsd.toFixed(2)} (${Math.round(taxKhr).toLocaleString()} KHR)`,
        variables: [
          { label: 'Progressive Tax Bracket', value: taxRateStr },
          { label: 'Net Taxable Base (KHR)', value: `${taxableBaseKhr.toLocaleString()} KHR` },
          { label: 'Calculated Tax in KHR', value: `${Math.round(taxKhr).toLocaleString()} KHR` },
          { label: 'Converted Tax in USD', value: `-$${taxUsd.toFixed(2)}` },
        ],
        explanation:
          'Cambodia applies progressive marginal salary taxation. With a net taxable base of ' +
          taxableBaseKhr.toLocaleString() +
          ' KHR, the worker falls into the ' +
          taxRateStr +
          ' bracket. Applying the statutory marginal formula and progressive deduction constant yields ' +
          Math.round(taxKhr).toLocaleString() +
          ' KHR ($' +
          taxUsd.toFixed(2) +
          ' USD).',
        explanation_km:
          'ប្រទេសកម្ពុជាអនុវត្តអត្រាពន្ធកើនតាមលំដាប់ថ្នាក់។ ជាមួយនឹងប្រាក់ឈ្នួលគិតពន្ធសុទ្ធ ' +
          taxableBaseKhr.toLocaleString() +
          ' រៀល កម្មករស្ថិតក្នុងថ្នាក់ពន្ធ ' +
          taxRateStr +
          '។ ការគណនាតាមរូបមន្តកាត់កងកម្រិតថ្នាក់ ផ្ដល់នូវទឹកប្រាក់ពន្ធចំនួន ' +
          Math.round(taxKhr).toLocaleString() +
          ' រៀល (ស្មើនឹង $' +
          taxUsd.toFixed(2) +
          ' ដុល្លារ)។',
        isTaxStep: true,
      },

      // 18. After-Tax Net Take-Home Salary
      {
        id: 'step-18-after-tax',
        category: 'payout',
        categoryTitle: 'Net Take-Home & Bi-Monthly Payout',
        categoryTitleKm: 'ប្រាក់ខែសុទ្ធ & ការបើកប្រាក់ ២ លើក',
        stepNumber: 18,
        title: 'After-Tax Net Take-Home Salary (Legal Net Pay)',
        title_km: 'ប្រាក់បៀវត្សរ៍សុទ្ធក្រោយកាត់ពន្ធ & ប.ស.ស. (Net Take-Home)',
        badge: 'Net Take-Home',
        badgeColor: 'bg-emerald-600 text-white font-extrabold shadow-xs',
        legalReference: 'Statutory Take-Home Wage Standard',
        symbolicFormula: 'After-Tax Net Salary = Gross Salary − NSSF Pension Fund ($) − GDT Tax on Salary ($)',
        substitutedFormula: `$${gross.toFixed(2)} (Gross) − $${pensionUsd.toFixed(2)} (NSSF) − $${taxUsd.toFixed(2)} (Tax) = $${afterTaxSalary.toFixed(2)}`,
        result: `$${afterTaxSalary.toFixed(2)}`,
        variables: [
          { label: 'Total Gross Earnings', value: `$${gross.toFixed(2)}` },
          { label: 'NSSF Pension Deduction', value: `-$${pensionUsd.toFixed(2)}` },
          { label: 'GDT Salary Tax Deduction', value: `-$${taxUsd.toFixed(2)}` },
          { label: 'Total Statutory Deductions', value: `-$${(pensionUsd + taxUsd).toFixed(2)}` },
          { label: 'Certified Net Take-Home Pay', value: `$${afterTaxSalary.toFixed(2)}` },
        ],
        explanation:
          'Certified monthly take-home compensation remaining after fulfilling all mandatory social security pension contributions and government salary taxes. This represents 100% of the net entitlement for the cycle.',
        explanation_km:
          'ប្រាក់បៀវត្សរ៍សុទ្ធពិតប្រាកដដែលនៅសល់ បន្ទាប់ពីបានកាត់កងកាតព្វកិច្ចវិភាគទានសោធន ប.ស.ស. និងពន្ធលើប្រាក់បៀវត្សរ៍រួចរាល់។',
      },

      // 19. Severance Pay 5% (Column 50 - Article 73 FDC Contract Expiration/Indemnity)
      {
        id: 'step-19-severance',
        category: 'payout',
        categoryTitle: 'Net Take-Home & Bi-Monthly Payout',
        categoryTitleKm: 'ប្រាក់ខែសុទ្ធ & ការបើកប្រាក់ ២ លើក',
        stepNumber: 19,
        title: 'Severant Pay 5% (FDC Contract Expiration Indemnity - Col 50)',
        title_km: 'ប្រាក់បំណាច់កុងត្រា ៥% (មាត្រា ៧៣ នៃច្បាប់ការងារ - ជួរទី ៥០)',
        badge: severancePay > 0 ? `Severance: $${severancePay.toFixed(2)}` : 'No Severance ($0)',
        badgeColor: severancePay > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200',
        legalReference: 'Cambodia Labor Law Article 73 (FDC 5% Severance) & Column 50 of Ledger',
        symbolicFormula: 'Severance Pay = At least 5% of Contract Wages Paid (Fixed Duration Contracts - FDC)',
        substitutedFormula:
          severancePay > 0
            ? `5% Statutory FDC Severance Disbursed = +$${severancePay.toFixed(2)}`
            : `$0.00 (No FDC contract expiration/severance applicable this cycle or UDC contract)`,
        result: `+$${severancePay.toFixed(2)}`,
        variables: [
          { label: 'Contract Type', value: payroll.contract_type || 'FDC / UDC' },
          { label: 'Severance Indemnity Disbursed', value: `+$${severancePay.toFixed(2)}` },
          { label: 'Statutory Rate', value: '≥ 5% of total contract wages (Labor Law Art. 73)' },
        ],
        explanation:
          severancePay > 0
            ? `Under Article 73 of the Cambodian Labor Law, employees engaged under Fixed Duration Contracts (FDC) are legally entitled to severance payment equal to at least 5% of all wages paid during the length of the contract upon expiration or renewal. Here, +$${severancePay.toFixed(2)} is credited to the employee in Column 50 of the factory ledger.`
            : `The employee does not have severance pay disbursed this cycle ($0.00). Workers on Undetermined Duration Contracts (UDC) receive semi-annual Seniority Indemnity (15 days/yr under Prakas 443) instead of 5% FDC severance.`,
        explanation_km:
          severancePay > 0
            ? `អនុលោមតាមមាត្រា ៧៣ នៃច្បាប់ការងារកម្ពុជា កម្មករនិយោជិតដែលធ្វើការក្រោម កិច្ចសន្យាការងារមានកំណត់ថិរវេលា (ក.ក.ថ / FDC) ត្រូវបានធានាដោយច្បាប់នូវប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥% នៃប្រាក់ឈ្នួលសរុបក្នុងកំឡុងពេលកិច្ចសន្យា។ ទឹកប្រាក់ +$${severancePay.toFixed(2)} ត្រូវបានបញ្ចូលក្នុងជួរឈរទី ៥០ នៃតារាងប្រាក់បៀវត្សរ៍រោងចក្រ។`
            : `បុគ្គលិកពុំមានការទូទាត់ប្រាក់បំណាច់កុងត្រាក្នុងវដ្តនេះឡើយ ($0.00)។ កម្មករនិយោជិតក្រោមកិច្ចសន្យាមិនកំណត់ថិរវេលា (UDC) ទទួលបានប្រាក់បំណាច់អតីតភាពការងារ ១៥ ថ្ងៃ/ឆ្នាំ (ប្រកាស ៤៤៣) ជំនួសឱ្យប្រាក់បំណាច់ ៥% នេះ។`,
      },

      // 20. Factory Bi-Monthly Disbursement Schedule (First & Second Paid)
      {
        id: 'step-20-disbursement',
        category: 'payout',
        categoryTitle: 'Net Take-Home & Bi-Monthly Payout',
        categoryTitleKm: 'ប្រាក់ខែសុទ្ធ & ការបើកប្រាក់ ២ លើក',
        stepNumber: 20,
        title: 'Factory Bi-Monthly Disbursement (First Paid Advance & Second Paid Balance)',
        title_km: 'ការទូទាត់ប្រាក់បៀវត្សរ៍ជា ២ លើក (បើកលើកទី១ & បើកលើកទី២ បញ្ចប់ខែ)',
        badge: '2-Stage Disbursement',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        legalReference: 'Cambodia Labor Law Article 116 (Twice-Monthly Wage Distribution)',
        symbolicFormula: 'Second Paid (Final Balance) = After-Tax Net + Severant Pay 5% (Col 50) − Mid-Month Advance (1st Paid) − Pre-Paid Target Bonus − Adjustments',
        substitutedFormula: severancePay > 0
          ? `$${afterTaxSalary.toFixed(2)} (Net) + $${severancePay.toFixed(2)} (Severance 5%) − $${firstPaid.toFixed(2)} (1st Paid) − $${targetBonus.toFixed(2)} (Bonus) = $${secondPaid.toFixed(2)} (2nd Paid Final Transfer)`
          : `$${afterTaxSalary.toFixed(2)} (Net) − $${firstPaid.toFixed(2)} (1st Paid) − $${targetBonus.toFixed(2)} (Bonus) = $${secondPaid.toFixed(2)} (2nd Paid Final Transfer)`,
        result: `2nd Paid: $${secondPaid.toFixed(2)} (Total Paid: $${totalPaid.toFixed(2)})`,
        variables: [
          { label: 'Total After-Tax Net Salary', value: `$${afterTaxSalary.toFixed(2)}` },
          { label: '1st Paid (Mid-Month Advance on 15th)', value: `-$${firstPaid.toFixed(2)}` },
          { label: 'Pre-Disbursed Weekly Target Bonus', value: `-$${targetBonus.toFixed(2)}` },
          { label: 'Severance Pay 5% (Col 50)', value: `+$${severancePay.toFixed(2)}` },
          { label: '2nd Paid (Month-End Final Balance on 31st)', value: `$${secondPaid.toFixed(2)}` },
          { label: 'Reconciled Total Disbursed to Worker', value: `$${totalPaid.toFixed(2)}` },
        ],
        explanation:
          'Under Article 116 of the Labor Law and Hestra factory standard operating procedure, wages are disbursed in two installments: approximately 30-50% is paid mid-month (15th) as a salary advance (1st Paid: $' +
          firstPaid.toFixed(2) +
          '). At month-end (31st), the final net balance including any statutory severance pay (2nd Paid: $' +
          secondPaid.toFixed(2) +
          ') is transferred, reconciling 100% of the worker’s $' +
          totalPaid.toFixed(2) +
          ' take-home pay.',
        explanation_km:
          'ស្របតាមមាត្រា ១១៦ នៃច្បាប់ការងារ និងនីតិវិធីរោងចក្រ Hestra ប្រាក់ឈ្នួលត្រូវបានបើកជា ២ លើក៖ លើកទី១ បើកនៅពាក់កណ្តាលខែ (ថ្ងៃទី១៥) ជាប្រាក់បើកមុន (First Paid: $' +
          firstPaid.toFixed(2) +
          ')។ នៅចុងខែ (ថ្ងៃទី៣១) ប្រាក់សុទ្ធដែលនៅសល់រួមទាំងប្រាក់បំណាច់កុងត្រា ៥% (Second Paid: $' +
          secondPaid.toFixed(2) +
          ') ត្រូវបានផ្ទេរចូលគណនីធនាគារ ដោយធានាថាបុគ្គលិកទទួលបានប្រាក់ឈ្នួលសុទ្ធពេញលេញ ១០០% ចំនួន $' +
          totalPaid.toFixed(2) +
          '។',
        isPayoutStep: true,
      },
    ];

    return steps;
  }, [payroll]);

  // Filter steps by category and search query
  const filteredSteps = useMemo(() => {
    return traceSteps.filter((st) => {
      const matchesCategory = activeCategory === 'all' || st.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.title.toLowerCase().includes(q) ||
        st.title_km.toLowerCase().includes(q) ||
        st.symbolicFormula.toLowerCase().includes(q) ||
        st.substitutedFormula.toLowerCase().includes(q) ||
        st.result.toLowerCase().includes(q) ||
        st.explanation.toLowerCase().includes(q) ||
        st.explanation_km.toLowerCase().includes(q) ||
        (st.legalReference && st.legalReference.toLowerCase().includes(q))
      );
    });
  }, [traceSteps, activeCategory, searchQuery]);

  // Toggle single step
  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Expand / collapse all
  const areAllExpanded = useMemo(() => {
    return filteredSteps.every((s) => expandedSteps[s.id] !== false);
  }, [filteredSteps, expandedSteps]);

  const handleToggleAll = () => {
    const nextState = !areAllExpanded;
    const updated: Record<string, boolean> = {};
    traceSteps.forEach((s) => {
      updated[s.id] = nextState;
    });
    setExpandedSteps(updated);
  };

  // Copy full audit text summary
  const handleCopySummary = () => {
    if (!payroll) return;
    const textLines = [
      `=== HESTRA HRM - CALCULATION AUDIT TRACE ===`,
      `Employee: ${payroll.employee_name || 'Worker'} (${payroll.employee_id})`,
      `Period: ${payroll.pay_period} | Role: ${payroll.employee_role || 'Staff'}`,
      `Gross Salary: $${Number(payroll.gross_salary || 0).toFixed(2)}`,
      `NSSF Pension (2%): -$${Number(payroll.pension_usd || 5.93).toFixed(2)}`,
      `GDT Salary Tax: -$${Number(payroll.tax_usd || 0).toFixed(2)} (Bracket: ${payroll.tax_rate || '0%'})`,
      `Net Take-Home: $${Number(payroll.net_salary || 0).toFixed(2)}`,
      `1st Paid Advance: $${Number(payroll.first_paid || 0).toFixed(2)}`,
      `2nd Paid Balance: $${Number(payroll.second_paid || 0).toFixed(2)}`,
      `----------------------------------------`,
      `STEP-BY-STEP FORMULAIC BREAKDOWN:`,
      ...traceSteps.map(
        (st, idx) =>
          `${idx + 1}. ${st.title} [${st.result}]\n   Formula: ${st.substitutedFormula}\n   Reference: ${st.legalReference || 'Standard'}`
      ),
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    showToast(
      language === 'km' ? 'បានចម្លងគន្លងគណនាទៅក្តារចម្លង!' : 'Calculation trace summary copied to clipboard!',
      'success'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!payroll) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>{language === 'km' ? 'គន្លងគណនាប្រាក់បៀវត្សរ៍' : 'Calculation Audit Trace'}</span>
                <span className="text-[10px] uppercase font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {traceSteps.length} Steps
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-800">
                  {payroll.employee_name} {payroll.khmer_name ? `(${payroll.khmer_name})` : ''}
                </span>
                <span className="font-mono text-slate-400">• {payroll.employee_id}</span>
                <span className="text-indigo-600 font-semibold">• {payroll.pay_period}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              title="Copy Summary"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
            <button
              onClick={() => window.print()}
              title="Print Calculation Sheet"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Executive Payout Waterfall Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-xl space-y-4 border border-indigo-900/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'km' ? 'ប្រាក់ខែសុទ្ធទូទាត់ចុងក្រោយ' : 'Final Certified Take-Home Pay (Net)'}
                </span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                  ${Number(payroll.net_salary || payroll.total_paid || 0).toFixed(2)}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Statutorily Audited ✓
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10 text-[11px]">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="block text-slate-400 text-[10px]">1. Gross Salary</span>
                <span className="font-bold text-white text-xs mt-0.5 block">
                  ${Number(payroll.gross_salary || 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="block text-slate-400 text-[10px]">2. Deductions (Tax+NSSF)</span>
                <span className="font-bold text-rose-300 text-xs mt-0.5 block">
                  -$
                  {(
                    Number(payroll.tax_usd || payroll.tax_deduction || 0) +
                    Number(payroll.pension_usd || payroll.insurance_deduction || 5.93)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="block text-slate-400 text-[10px]">3. 1st Paid (15th Adv)</span>
                <span className="font-bold text-blue-300 text-xs mt-0.5 block">
                  ${Number(payroll.first_paid || 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="block text-slate-400 text-[10px]">4. 2nd Paid (31st Bal)</span>
                <span className="font-bold text-emerald-300 text-xs mt-0.5 block">
                  ${Number(payroll.second_paid || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <div className="space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formula, tax, pension, overtime, rule, or allowance..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills & Toggle All */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-[11px]">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'all', label: 'All Steps', count: traceSteps.length },
                  { id: 'base', label: '1. Base', count: 2 },
                  { id: 'allowances', label: '2. Allowances & OT', count: 8 },
                  { id: 'gross', label: '3. Gross', count: 1 },
                  { id: 'statutory', label: '4. NSSF', count: 2 },
                  { id: 'tax', label: '5. Tax on Salary', count: 3 },
                  { id: 'payout', label: '6. Net Payout', count: 2 },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              <button
                onClick={handleToggleAll}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 cursor-pointer ml-1"
              >
                {areAllExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>

          {/* Detailed Step Cards Breakdown */}
          <div className="space-y-3.5">
            {filteredSteps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-1">
                <Search size={24} className="mx-auto text-slate-300 mb-1" />
                <p className="font-bold text-slate-600">No calculation steps match your filter</p>
                <p className="text-[11px]">Try clearing your search query or selecting &quot;All Steps&quot;.</p>
              </div>
            ) : (
              filteredSteps.map((st) => {
                const isExpanded = expandedSteps[st.id] !== false;

                return (
                  <div
                    key={st.id}
                    className="rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs overflow-hidden"
                  >
                    {/* Card Header (Clickable to toggle) */}
                    <div
                      onClick={() => toggleStep(st.id)}
                      className="p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-black shrink-0 mt-0.5 shadow-2xs">
                          {st.stepNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {language === 'km' && st.title_km ? st.title_km : st.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${st.badgeColor}`}
                            >
                              {st.badge}
                            </span>
                          </div>

                          {st.legalReference && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              § {st.legalReference}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs shadow-2xs border border-indigo-100/80">
                          {st.result}
                        </span>
                        <span className="text-slate-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </div>

                    {/* Card Details (Collapsible) */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-white animate-in fade-in duration-150">
                        {/* Formula Section */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              1. Symbolic Formula:
                            </span>
                            <span className="text-slate-600 font-semibold">{st.symbolicFormula}</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-200/60">
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">
                              2. Substituted Math Calculation:
                            </span>
                            <span className="text-indigo-900 font-bold">{st.substitutedFormula}</span>
                          </div>
                        </div>

                        {/* Component Variables Grid */}
                        {st.variables && st.variables.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {st.variables.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="bg-slate-50 p-2 rounded-lg border border-slate-200/70"
                              >
                                <span className="block text-[9px] font-medium text-slate-500 truncate">
                                  {v.label}
                                </span>
                                <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                                  {v.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation Box */}
                        <div className="text-[11px] text-slate-700 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/60 space-y-1 leading-relaxed">
                          <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1 uppercase tracking-wider">
                            <Info size={12} />
                            {language === 'km' ? 'ការពន្យល់លម្អិត & គោលការណ៍ច្បាប់' : 'Detailed Explanation & Legal Mechanics:'}
                          </span>
                          <p>{language === 'km' ? st.explanation_km : st.explanation}</p>
                        </div>

                        {/* Contextual Widget: Progressive Tax Table for Step 16 */}
                        {st.isTaxStep && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px]">
                                {language === 'km' ? 'Cambodia GDT Progressive Tax Schedule (អត្រាពន្ធកើនតាមលំដាប់)' : 'Cambodia GDT Progressive Tax Schedule'}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-bold">
                                Active Bracket: {payroll.tax_rate || '0%'}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px] border-collapse text-left font-mono">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-1">Tier</th>
                                    <th className="py-1">Monthly Taxable Base (KHR)</th>
                                    <th className="py-1 text-center">Rate</th>
                                    <th className="py-1">Deduction Constant</th>
                                    <th className="py-1 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {[
                                    { tier: 1, range: '0 – 1,500,000 KHR', rate: '0%', deduct: '0 KHR', usd: '< ~$370.92' },
                                    { tier: 2, range: '1,500,001 – 2,000,000 KHR', rate: '5%', deduct: '75,000 KHR', usd: '$370 – $494' },
                                    { tier: 3, range: '2,000,001 – 8,500,000 KHR', rate: '10%', deduct: '175,000 KHR', usd: '$494 – $2,101' },
                                    { tier: 4, range: '8,500,001 – 12,500,000 KHR', rate: '15%', deduct: '600,000 KHR', usd: '$2,101 – $3,091' },
                                    { tier: 5, range: '> 12,500,000 KHR', rate: '20%', deduct: '1,225,000 KHR', usd: '> $3,091' },
                                  ].map((row) => {
                                    const isCurrent = row.rate === (payroll.tax_rate || '0%');
                                    return (
                                      <tr
                                        key={row.tier}
                                        className={isCurrent ? 'bg-indigo-100/60 font-bold text-indigo-900' : 'text-slate-600'}
                                      >
                                        <td className="py-1">Tier {row.tier}</td>
                                        <td className="py-1">{row.range}</td>
                                        <td className="py-1 text-center font-bold">{row.rate}</td>
                                        <td className="py-1">−{row.deduct}</td>
                                        <td className="py-1 text-right">
                                          {isCurrent ? (
                                            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                              ● Active Tier
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">--</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Contextual Widget: Bi-Monthly Waterfall for Step 18 */}
                        {st.isPayoutStep && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-800 text-[11px] block">
                              Bi-Monthly Wage Reconciliation Flow (Article 116)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-sans block">Total Net Take-Home</span>
                                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                                  ${Number(payroll.after_tax_salary || payroll.net_salary || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-blue-900">
                                <span className="text-[10px] text-blue-600 font-sans block">1st Paid (15th Advance)</span>
                                <span className="font-bold text-xs mt-0.5 block">
                                  -${Number(payroll.first_paid || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-900">
                                <span className="text-[10px] text-emerald-700 font-sans block">2nd Paid (Month-End Bal)</span>
                                <span className="font-bold text-xs mt-0.5 block">
                                  ${Number(payroll.second_paid || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Reference Standard Footnote */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <FileText size={15} className="text-amber-700 shrink-0" />
              Cambodia Labor Law & Hestra Factory Regulatory Framework
            </p>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Standard factory calculation basis: 26 scheduled days/month (8 hours/day). Overtime normal rate: 1.5x (150%), holiday/night rate: 2.0x (200%). Transport & Housing allowance ($16.00) is recognized as a statutory non-taxable fringe benefit under GDT Circular No. 011. NSSF Pension contribution 2% is capped at the 1,200,000 KHR ceiling (24,000 KHR / $5.93 USD). Dependent relief deduction: 150,000 KHR/dependent.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print Audit Sheet</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs cursor-pointer shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
