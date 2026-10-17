'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText, formatDateDMY } from '@/lib/translations';
import { SalaryOverview, SalaryAdjustment } from '@/lib/types';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';
import {
  Banknote,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building2,
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Calculator,
  Download,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
  Award,
  X,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface EmployeeSalaryItem {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department_id: string;
  department_name: string;
  avatar: string;
  status: string;
  salary: number;
  salary_currency: string;
  salary_frequency: string;
  contract_type: string;
  contract_start: string;
  contract_end: string;
  join_date: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  nssf_member: string;
  nssf_number: string;
  transport_allowance: number;
  meal_allowance: number;
  housing_allowance: number;
  housing_transport_allowance?: number;
  attendance_allowance: number;
  skill_allowance: number;
  seniority_bonus: number;
  pay_grade: string;
  last_salary_review: string;
  totalAllowances: number;
  grossSalary: number;
  isCompliant: boolean;
}

// Cambodia Corporate Standard Pay Grades (USD Benchmark)
const PAY_GRADES = [
  {
    id: 'Grade 1',
    nameKm: 'កម្រិត ១ (កម្រិតដំបូង / Entry-Level)',
    nameEn: 'Grade 1 (Entry / Support Level)',
    min: 208,
    mid: 320,
    max: 450,
    color: 'border-blue-200 bg-blue-50/50 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-700',
    descriptionKm: 'បុគ្គលិកសាកល្បង ការងារជំនួយការ និងបុគ្គលិកបម្រើការងារទូទៅ',
    descriptionEn: 'Probationers, junior assistants, and entry-level support associates',
  },
  {
    id: 'Grade 2',
    nameKm: 'កម្រិត ២ (អ្នកជំនាញ / Specialist)',
    nameEn: 'Grade 2 (Professional Specialist)',
    min: 450,
    mid: 750,
    max: 1100,
    color: 'border-indigo-200 bg-indigo-50/50 text-indigo-800',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    descriptionKm: 'អ្នកជំនាញការងារ មន្ត្រីបច្ចេកទេស និងវិស្វករកម្រិតកណ្តាល',
    descriptionEn: 'Mid-level specialists, functional officers, and associate engineers',
  },
  {
    id: 'Grade 3',
    nameKm: 'កម្រិត ៣ (អ្នកជំនាញជាន់ខ្ពស់ / Senior Lead)',
    nameEn: 'Grade 3 (Senior Lead / Supervisor)',
    min: 1100,
    mid: 1650,
    max: 2300,
    color: 'border-purple-200 bg-purple-50/50 text-purple-800',
    badgeColor: 'bg-purple-100 text-purple-700',
    descriptionKm: 'ប្រធានក្រុមការងារ វិស្វករជាន់ខ្ពស់ និងអ្នកឯកទេសជាន់ខ្ពស់',
    descriptionEn: 'Team leads, senior engineers, and senior functional specialists',
  },
  {
    id: 'Grade 4',
    nameKm: 'កម្រិត ៤ (ប្រធានផ្នែក / Department Manager)',
    nameEn: 'Grade 4 (Department Manager / Head)',
    min: 2300,
    mid: 3400,
    max: 4800,
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    descriptionKm: 'ប្រធាននាយកដ្ឋាន អ្នកគ្រប់គ្រងយុទ្ធសាស្ត្រផ្នែក',
    descriptionEn: 'Department heads, functional managers, and strategic directors',
  },
  {
    id: 'Grade 5',
    nameKm: 'កម្រិត ៥ (ថ្នាក់ដឹកនាំជាន់ខ្ពស់ / Executive)',
    nameEn: 'Grade 5 (Executive Leadership / C-Suite)',
    min: 4800,
    mid: 8000,
    max: 20000,
    color: 'border-amber-200 bg-amber-50/50 text-amber-800',
    badgeColor: 'bg-amber-100 text-amber-700',
    descriptionKm: 'អគ្គនាយក នាយកប្រតិបត្តិ និងថ្នាក់ដឹកនាំកំពូលរបស់ស្ថាប័ន',
    descriptionEn: 'Chief officers, vice presidents, and executive managing directors',
  },
];

// Official Cambodia General Department of Taxation (GDT) Progressive Tax on Salary
function calculateCambodiaToS(grossSalaryUsd: number, dependents: number = 0) {
  const EXCHANGE_RATE = 4100; // Official tax exchange rate KHR per USD
  const grossKhr = grossSalaryUsd * EXCHANGE_RATE;

  // Deduction for dependent spouse & minor children (150,000 KHR per dependent)
  const dependentReliefKhr = dependents * 150000;
  const taxableSalaryKhr = Math.max(0, grossKhr - dependentReliefKhr);

  let taxKhr = 0;
  // Cambodia Progressive Tax Brackets:
  // 0 - 1,500,000 KHR: 0%
  // 1,500,001 - 2,000,000 KHR: 5%
  // 2,000,001 - 8,500,000 KHR: 10%
  // 8,500,001 - 12,500,000 KHR: 15%
  // > 12,500,000 KHR: 20%
  if (taxableSalaryKhr <= 1500000) {
    taxKhr = 0;
  } else if (taxableSalaryKhr <= 2000000) {
    taxKhr = (taxableSalaryKhr - 1500000) * 0.05;
  } else if (taxableSalaryKhr <= 8500000) {
    taxKhr = 500000 * 0.05 + (taxableSalaryKhr - 2000000) * 0.10;
  } else if (taxableSalaryKhr <= 12500000) {
    taxKhr = 500000 * 0.05 + 6500000 * 0.10 + (taxableSalaryKhr - 8500000) * 0.15;
  } else {
    taxKhr = 500000 * 0.05 + 6500000 * 0.10 + 4000000 * 0.15 + (taxableSalaryKhr - 12500000) * 0.20;
  }

  const taxUsd = Math.round((taxKhr / EXCHANGE_RATE) * 100) / 100;

  // Cambodia NSSF Pension deduction (2% employee, capped at 1,200,000 KHR / ~$292.68 USD salary -> max 24,000 KHR / ~$5.85 USD)
  const nssfCapUsd = 1200000 / EXCHANGE_RATE;
  const nssfPensionBaseUsd = Math.min(grossSalaryUsd, nssfCapUsd);
  const nssfEmployeeUsd = Math.round(nssfPensionBaseUsd * 0.02 * 100) / 100;

  const netSalaryUsd = Math.round((grossSalaryUsd - taxUsd - nssfEmployeeUsd) * 100) / 100;

  return {
    grossSalaryUsd,
    taxableSalaryKhr,
    taxKhr: Math.round(taxKhr),
    taxUsd,
    nssfEmployeeUsd,
    netSalaryUsd,
  };
}

export default function SalaryManagementPage() {
  const { language, t, showToast, currentPersona } = useApp();

  const [activeTab, setActiveTab] = useState<'register' | 'history' | 'grades' | 'calculator'>('register');
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState<SalaryOverview | null>(null);
  const [employees, setEmployees] = useState<EmployeeSalaryItem[]>([]);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'adjust' | 'view'>('adjust');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSalaryItem | null>(null);

  // Form states for adjustment
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formNewSalary, setFormNewSalary] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD ($)');
  const [formAdjustmentType, setFormAdjustmentType] = useState('ដំឡើងប្រចាំឆ្នាំ (Annual Merit Increase)');
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPayGrade, setFormPayGrade] = useState('Grade 2');
  const [formHousingTransport, setFormHousingTransport] = useState('0');
  const [formMeal, setFormMeal] = useState('0');
  const [formAttendance, setFormAttendance] = useState('0');
  const [formSkill, setFormSkill] = useState('0');
  const [formSeniority, setFormSeniority] = useState('0');
  const [formBankName, setFormBankName] = useState('ABA Bank');
  const [formBankAccountName, setFormBankAccountName] = useState('');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calculatingSeniority, setCalculatingSeniority] = useState(false);

  // Calculator playground state
  const [calcGrossInput, setCalcGrossInput] = useState<number>(1200);
  const [calcDependentsInput, setCalcDependentsInput] = useState<number>(0);

  // Fetch all salary data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      if (gradeFilter !== 'all') params.append('grade', gradeFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/salary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setEmployees(data.employees || []);
        setAdjustments(data.adjustments || []);
        setDepartmentBreakdown(data.departmentBreakdown || []);
      }
    } catch (err) {
      console.error('Error fetching salary data:', err);
      showToast(language === 'km' ? 'បរាជ័យក្នុងការទាញយកទិន្នន័យប្រាក់បៀវត្សរ៍' : 'Failed to load salary records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentFilter, gradeFilter, searchQuery]);

  // Open adjustment modal for a specific employee
  const handleOpenAdjustModal = (emp?: EmployeeSalaryItem) => {
    const target = emp || employees[0];
    if (target) {
      setSelectedEmployee(target);
      setFormEmployeeId(target.id);
      setFormNewSalary(String(target.salary));
      setFormCurrency(target.salary_currency || 'USD ($)');
      setFormPayGrade(target.pay_grade || 'Grade 2');
      setFormHousingTransport(String((target.housing_allowance || 0) + (target.transport_allowance || 0)));
      setFormMeal(String(target.meal_allowance || 0));
      setFormAttendance(String(target.attendance_allowance || 0));
      setFormSkill(String(target.skill_allowance || 0));
      const calcSeniority = calculateSeniorityAllowanceFromDate(target.join_date).allowance;
      const initialSeniority = Number(target.seniority_bonus || 0) > 0 ? Number(target.seniority_bonus) : calcSeniority;
      setFormSeniority(String(initialSeniority));
      setFormBankName(target.bank_name || 'ABA Bank');
      setFormBankAccountName(target.bank_account_name || target.name);
      setFormBankAccountNumber(target.bank_account_number || '');
      setFormReason('');
      setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  // Switch selected employee in modal dropdown
  const handleSelectEmployeeInModal = (empId: string) => {
    const found = employees.find((e) => e.id === empId);
    if (found) {
      setSelectedEmployee(found);
      setFormEmployeeId(found.id);
      setFormNewSalary(String(found.salary));
      setFormCurrency(found.salary_currency || 'USD ($)');
      setFormPayGrade(found.pay_grade || 'Grade 2');
      setFormHousingTransport(String((found.housing_allowance || 0) + (found.transport_allowance || 0)));
      setFormMeal(String(found.meal_allowance || 0));
      setFormAttendance(String(found.attendance_allowance || 0));
      setFormSkill(String(found.skill_allowance || 0));
      const calcSeniority = calculateSeniorityAllowanceFromDate(found.join_date).allowance;
      const initialSeniority = Number(found.seniority_bonus || 0) > 0 ? Number(found.seniority_bonus) : calcSeniority;
      setFormSeniority(String(initialSeniority));
      setFormBankName(found.bank_name || 'ABA Bank');
      setFormBankAccountName(found.bank_account_name || found.name);
      setFormBankAccountNumber(found.bank_account_number || '');
    }
  };

  // Batch auto-calculate seniority allowance for all employees
  const handleAutoCalculateAllSeniority = async () => {
    if (
      !confirm(
        language === 'km'
          ? 'តើអ្នកពិតជាចង់គណនាប្រាក់អតីតភាព (Seniority Allowance) ដោយស្វ័យប្រវត្តិតាមថ្ងៃចូលបម្រើការងារសម្រាប់បុគ្គលិកទាំងអស់មែនទេ?'
          : 'Recalculate statutory Seniority Allowance ($) for all employees based on continuous tenure from join date?'
      )
    ) {
      return;
    }

    setCalculatingSeniority(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_calculate_seniority_all' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          language === 'km'
            ? `បានគណនា និងធ្វើបច្ចុប្បន្នភាពប្រាក់អតីតភាពការងារសម្រាប់បុគ្គលិក ${data.updated_count || 0} នាក់ជោគជ័យ!`
            : `Successfully auto-calculated seniority allowance (${data.updated_count || 0} employees updated)!`,
          'success'
        );
        fetchData();
      } else {
        showToast(data.error || 'Failed to auto-calculate seniority allowance', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing calculation', 'error');
    } finally {
      setCalculatingSeniority(false);
    }
  };

  // Submit salary adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formNewSalary || Number(formNewSalary) <= 0) {
      showToast(language === 'km' ? 'សូមបញ្ចូលចំនួនប្រាក់ខែឱ្យបានត្រឹមត្រូវ' : 'Please provide a valid salary amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: formEmployeeId,
        new_salary: Number(formNewSalary),
        currency: formCurrency,
        adjustment_type: formAdjustmentType,
        effective_date: formEffectiveDate,
        pay_grade: formPayGrade,
        transport_allowance: 0,
        meal_allowance: Number(formMeal) || 0,
        housing_allowance: Number(formHousingTransport) || 0,
        housing_transport_allowance: Number(formHousingTransport) || 0,
        attendance_allowance: Number(formAttendance) || 0,
        skill_allowance: Number(formSkill) || 0,
        seniority_bonus: Number(formSeniority) || 0,
        bank_name: formBankName,
        bank_account_name: formBankAccountName,
        bank_account_number: formBankAccountNumber,
        reason: formReason,
        approved_by: currentPersona?.name || 'Administrator',
      };

      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          language === 'km'
            ? `បានកែសម្រួលប្រាក់ខែ ${selectedEmployee?.name || formEmployeeId} ដោយជោគជ័យ!`
            : `Salary updated successfully for ${selectedEmployee?.name || formEmployeeId}!`,
          'success'
        );
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Failed to update salary', 'error');
      }
    } catch (err) {
      showToast(language === 'km' ? 'មានបញ្ហាក្នុងការកែសម្រួលប្រាក់ខែ' : 'Error updating salary', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Live calculation of difference in modal
  const adjustmentDiff = useMemo(() => {
    if (!selectedEmployee) return { amount: 0, percent: 0, isIncrease: true };
    const prev = selectedEmployee.salary || 0;
    const current = Number(formNewSalary) || 0;
    const amount = current - prev;
    const percent = prev > 0 ? (amount / prev) * 100 : 0;
    return {
      amount: Math.round(amount * 100) / 100,
      percent: Math.round(percent * 10) / 10,
      isIncrease: amount >= 0,
    };
  }, [selectedEmployee, formNewSalary]);

  // Live simulation of net take-home in modal
  const simulatedTax = useMemo(() => {
    const base = Number(formNewSalary) || 0;
    const totalAlw =
      (Number(formHousingTransport) || 0) +
      (Number(formMeal) || 0) +
      (Number(formAttendance) || 0) +
      (Number(formSkill) || 0) +
      (Number(formSeniority) || 0);
    return calculateCambodiaToS(base + totalAlw, 0);
  }, [formNewSalary, formHousingTransport, formMeal, formAttendance, formSkill, formSeniority]);

  // Export to CSV
  const handleExportCSV = () => {
    if (employees.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យដើម្បីទាញយក' : 'No data to export', 'error');
      return;
    }

    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Role',
      'Pay Grade',
      'Base Salary (USD)',
      'Meal Allowance',
      'Housing - Transport Allowance',
      'Attendance Bonus',
      'Skill Allowance',
      'Seniority Allowance',
      'Gross Salary (USD)',
      'Bank Name',
      'Bank Account Number',
      'Min Wage Compliant',
      'Last Review Date',
    ];

    const rows = employees.map((e) => [
      e.id,
      `"${e.name}"`,
      `"${e.department_name || ''}"`,
      `"${e.role || ''}"`,
      e.pay_grade || 'Grade 2',
      e.salary,
      e.meal_allowance || 0,
      (e.housing_allowance || 0) + (e.transport_allowance || 0),
      e.attendance_allowance || 0,
      e.skill_allowance || 0,
      e.seniority_bonus || 0,
      e.grossSalary,
      `"${e.bank_name || ''}"`,
      `"${e.bank_account_number || ''}"`,
      e.isCompliant ? 'YES' : 'NO',
      formatDateDMY(e.last_salary_review || e.join_date),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hestra_salary_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(language === 'km' ? 'ទាញយកតារាងប្រាក់បៀវត្សរ៍ដោយជោគជ័យ' : 'Salary register CSV exported', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const calculatedResult = useMemo(() => {
    return calculateCambodiaToS(calcGrossInput, calcDependentsInput);
  }, [calcGrossInput, calcDependentsInput]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងសំណង & ប្រាក់បៀវត្សរ៍' : 'Compensation & Benefits'}</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{language === 'km' ? 'កម្ពុជា' : 'Cambodia Law'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Banknote size={22} />
            </div>
            <span>{language === 'km' ? 'គ្រប់គ្រងប្រាក់បៀវត្សរ៍ (Salary Management)' : 'Salary Management'}</span>
          </h1>
          <p className={`text-xs text-slate-500 mt-1 max-w-2xl ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km'
              ? 'ការកំណត់រចនាសម្ព័ន្ធប្រាក់ខែ កម្រិតប្រាក់បៀវត្សរ៍ ប្រាក់ឧបត្ថម្ភ និងការធានាអនុលោមភាពប្រាក់ឈ្នួលអប្បបរមា $២០៨ ស្របតាមច្បាប់ការងារកម្ពុជា។'
              : 'Configure employee salary structures, pay grades, statutory allowances, and monitor Cambodian minimum wage compliance.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span className="hidden sm:inline">{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={14} className="text-slate-500" />
            <span className="hidden sm:inline">{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
          </button>

          <button
            onClick={() => handleOpenAdjustModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{language === 'km' ? 'កែសម្រួលប្រាក់ខែ' : 'Adjust Salary'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Base Payroll */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{language === 'km' ? 'ប្រាក់បៀវត្សរ៍មូលដ្ឋានសរុប' : 'Total Monthly Base Payroll'}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ${(overview?.totalMonthlySalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-slate-400">USD/mo</span>
          </div>
          <p className={`text-[11px] text-slate-500 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'សម្រាប់បុគ្គលិកសកម្មទាំងអស់' : `Across ${overview?.totalEmployees || 0} active employees`}
          </p>
        </div>

        {/* Card 2: Total Allowances */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{language === 'km' ? 'ប្រាក់ឧបត្ថម្ភប្រចាំខែសរុប' : 'Total Monthly Allowances'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              ${(overview?.totalAllowances || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-slate-400">USD/mo</span>
          </div>
          <p className={`text-[11px] text-slate-500 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'ធ្វើដំណើរ អាហារ ស្នាក់នៅ & វត្តមាន' : 'Transport, meal, housing & bonus'}
          </p>
        </div>

        {/* Card 3: Average Salary */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{language === 'km' ? 'ប្រាក់ខែមធ្យមក្នុងស្ថាប័ន' : 'Average Monthly Salary'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ${(overview?.averageSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-slate-400">USD/staff</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>Min: ${overview?.minSalary || 0}</span>
            <span>•</span>
            <span>Max: ${overview?.maxSalary || 0}</span>
          </div>
        </div>

        {/* Card 4: Cambodia Minimum Wage Compliance */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{language === 'km' ? 'អនុលោមភាពប្រាក់ឈ្នួលអប្បបរមា' : 'Cambodia Min Wage Compliance'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">100%</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {language === 'km' ? 'អនុលោមពេញលេញ' : 'Compliant'}
            </span>
          </div>
          <p className={`text-[11px] text-slate-500 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'ប្រាក់ឈ្នួលស្តង់ដារកម្ពុជា: $២០៨/ខែ' : 'Standard 2026 Prakas: $208.00 / month'}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'register'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={16} />
          <span>{language === 'km' ? 'តារាងប្រាក់បៀវត្សរ៍បុគ្គលិក (Register)' : 'Employee Salary Register'}</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-extrabold">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History size={16} />
          <span>{language === 'km' ? 'ប្រវត្តិការកែសម្រួលប្រាក់ខែ (History)' : 'Salary Adjustment History'}</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-extrabold">
            {adjustments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'grades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers size={16} />
          <span>{language === 'km' ? 'កម្រិតប្រាក់បៀវត្សរ៍ (Pay Grades)' : 'Pay Grades & Salary Bands'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'calculator'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calculator size={16} />
          <span>{language === 'km' ? 'គណនាពន្ធ & ប.ស.ស (Tax & NSSF)' : 'Cambodia Tax & NSSF Calculator'}</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: EMPLOYEE SALARY REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ តួនាទី អត្តលេខ...' : 'Search employee, role, ID...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <Filter size={13} />
                <span className="hidden md:inline">{language === 'km' ? 'ផ្នែក:' : 'Dept:'}</span>
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{language === 'km' ? 'គ្រប់នាយកដ្ឋានទាំងអស់' : 'All Departments'}</option>
                {departmentBreakdown.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatLocalizedText(d.name, language)}
                  </option>
                ))}
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{language === 'km' ? 'គ្រប់កម្រិតប្រាក់ខែ' : 'All Pay Grades'}</option>
                {PAY_GRADES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAutoCalculateAllSeniority}
                disabled={calculatingSeniority}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                title={language === 'km' ? 'គណនាប្រាក់អតីតភាពការងារស្វ័យប្រវត្តិតាមថ្ងៃចូលធ្វើការសម្រាប់បុគ្គលិកទាំងអស់' : 'Auto-calculate Seniority Allowance for all employees based on continuous tenure from join date'}
              >
                <Sparkles size={13} className={calculatingSeniority ? 'animate-spin' : ''} />
                <span className="hidden xl:inline">{language === 'km' ? 'គណនាប្រាក់អតីតភាពទាំងអស់' : 'Auto-Calc Seniority (All)'}</span>
                <span className="xl:hidden">{language === 'km' ? 'ប្រាក់អតីតភាព' : 'Auto-Seniority'}</span>
              </button>
            </div>
          </div>

          {/* Employee Salary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'km' ? 'បុគ្គលិក (Employee)' : 'Employee'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'កម្រិត (Grade)' : 'Pay Grade'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'ប្រាក់ខែមូលដ្ឋាន (Base)' : 'Base Salary'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'ប្រាក់ឧបត្ថម្ភ (Allowances)' : 'Allowances'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'ប្រាក់ខែសរុប (Gross)' : 'Gross Pay'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'ធនាគារ (Bank Details)' : 'Bank Details'}</th>
                    <th className="py-3 px-3">{language === 'km' ? 'អនុលោមភាព (Compliance)' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព (Actions)' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600">
                          {language === 'km' ? 'ពុំមានទិន្នន័យបុគ្គលិកស្របតាមលក្ខខណ្ឌ' : 'No employee records match your filter'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => {
                      const gradeObj = PAY_GRADES.find((g) => g.id === emp.pay_grade) || PAY_GRADES[1];
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Employee Name & Role */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.name}
                                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                                  {emp.name ? emp.name.trim().charAt(0).toUpperCase() : 'S'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {emp.role} • <span className="text-slate-400">{formatLocalizedText(emp.department_name || '', language)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Pay Grade Badge */}
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${gradeObj.color}`}>
                              {emp.pay_grade || 'Grade 2'}
                            </span>
                          </td>

                          {/* Base Salary */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">
                              ${Number(emp.salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {emp.salary_currency || 'USD ($)'} / {language === 'km' ? 'ខែ' : 'mo'}
                            </span>
                          </td>

                          {/* Allowances */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-emerald-600">
                              +${Number(emp.totalAllowances || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            {emp.totalAllowances > 0 && (
                              <div className="text-[10px] text-slate-400">
                                {[
                                  ((emp.housing_allowance || 0) + (emp.transport_allowance || 0)) > 0
                                    ? `House-Trans $${((emp.housing_allowance || 0) + (emp.transport_allowance || 0))}`
                                    : '',
                                  emp.meal_allowance > 0 ? `Meal $${emp.meal_allowance}` : '',
                                  emp.attendance_allowance > 0 ? `Att $${emp.attendance_allowance}` : '',
                                  emp.skill_allowance > 0 ? `Skill $${emp.skill_allowance}` : '',
                                  emp.seniority_bonus > 0 ? `Sen $${emp.seniority_bonus}` : '',
                                ].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>

                          {/* Gross Pay */}
                          <td className="py-3.5 px-3">
                            <div className="font-black text-slate-900">
                              ${Number(emp.grossSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Est. Net: ${calculateCambodiaToS(emp.grossSalary).netSalaryUsd.toFixed(2)}
                            </span>
                          </td>

                          {/* Bank Information */}
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <CreditCard size={12} className="text-indigo-600" />
                              <span>{emp.bank_name || 'ABA Bank'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                              {emp.bank_account_number || (language === 'km' ? 'មិនទាន់បញ្ជាក់' : 'Not Provided')}
                            </div>
                          </td>

                          {/* Compliance */}
                          <td className="py-3.5 px-3">
                            {emp.isCompliant ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 size={11} /> {language === 'km' ? 'ស្របច្បាប់' : 'Compliant'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                <AlertTriangle size={11} /> {language === 'km' ? 'ក្រោមអប្បបរមា' : 'Below Min'}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenAdjustModal(emp)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              {language === 'km' ? 'កែសម្រួល' : 'Adjust'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY ADJUSTMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'កំណត់ហេតុនៃការកែសម្រួលប្រាក់បៀវត្សរ៍ (Compensation Audit Log)' : 'Salary Adjustment Audit Trail'}
              </h3>
              <p className={`text-[11px] text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {language === 'km'
                  ? 'រាល់ការកែប្រែ ឬដំឡើងប្រាក់បៀវត្សរ៍ត្រូវបានកត់ត្រាទុកយ៉ាងច្បាស់លាស់សម្រាប់សវនកម្ម'
                  : 'Historical record of all compensation increments, promotions, and merit reviews'}
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              {adjustments.length} {language === 'km' ? 'កំណត់ត្រា' : 'Events'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{language === 'km' ? 'កាលបរិច្ឆេទ (Date)' : 'Effective Date'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'បុគ្គលិក (Employee)' : 'Employee'}</th>
                  <th className="py-3 px-3">{language === 'km' ? 'ប្រភេទ (Type)' : 'Adjustment Type'}</th>
                  <th className="py-3 px-3">{language === 'km' ? 'ប្រាក់ខែចាស់ (Old)' : 'Previous'}</th>
                  <th className="py-3 px-3">{language === 'km' ? 'ប្រាក់ខែថ្មី (New)' : 'New Salary'}</th>
                  <th className="py-3 px-3">{language === 'km' ? 'កំណើន (Change)' : 'Increase'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'មូលហេតុ & អ្នកអនុម័ត (Reason & Approver)' : 'Reason & Approver'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <History size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">
                        {language === 'km' ? 'ពុំទាន់មានកំណត់ហេតុនៃការកែសម្រួលប្រាក់ខែនៅឡើយ' : 'No salary adjustments recorded yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {adj.effective_date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{adj.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{adj.employee_role}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {adj.adjustment_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        ${Number(adj.previous_salary).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        ${Number(adj.new_salary).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                          <ArrowUpRight size={13} />
                          +${Number(adj.increase_amount).toFixed(2)} ({adj.increase_percentage}%)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-700 italic">&ldquo;{adj.reason || 'General review'}&rdquo;</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Approved by <strong className="text-slate-600">{adj.approved_by || 'HR Admin'}</strong>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAY GRADES & SALARY BANDS */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Info size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className={`text-xs text-slate-700 leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              <strong>{language === 'km' ? 'រចនាសម្ព័ន្ធកម្រិតប្រាក់បៀវត្សរ៍ស្តង់ដារកម្ពុជា:' : 'Cambodian Corporate Pay Structure Standards:'}</strong>
              <p className="mt-1 text-slate-600">
                {language === 'km'
                  ? 'ការបែងចែកកម្រិតប្រាក់បៀវត្សរ៍ (Pay Grade Banding) ជួយឱ្យក្រុមហ៊ុនគ្រប់គ្រងថវិកាបៀវត្សរ៍ប្រកបដោយតម្លាភាព សមធម៌ផ្ទៃក្នុង និងស្របតាមច្បាប់ការងារស្តីពីប្រាក់ឈ្នួលអប្បបរមា។'
                  : 'Salary grade banding ensures internal compensation equity, clear career ladders, transparent budget governance, and statutory compliance.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAY_GRADES.map((grade) => {
              const staffInGrade = employees.filter((e) => (e.pay_grade || 'Grade 2') === grade.id);
              const totalGradeSalary = staffInGrade.reduce((sum, e) => sum + e.salary, 0);

              return (
                <div key={grade.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${grade.badgeColor}`}>
                        {grade.id}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {staffInGrade.length} {language === 'km' ? 'នាក់' : 'Staff'}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm mt-2">
                      {language === 'km' ? grade.nameKm : grade.nameEn}
                    </h4>
                    <p className={`text-[11px] text-slate-500 mt-1 leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {language === 'km' ? grade.descriptionKm : grade.descriptionEn}
                    </p>

                    {/* Benchmark Range Card */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <span>Min</span>
                        <span>Midpoint</span>
                        <span>Max</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900">
                        <span>${grade.min}</span>
                        <span className="text-indigo-600">${grade.mid}</span>
                        <span>${grade.max}+</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">{language === 'km' ? 'ចំណាយបៀវត្សរ៍:' : 'Total Group:'}</span>
                    <span className="font-bold text-slate-800">${totalGradeSalary.toLocaleString()} USD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CAMBODIA SALARY TAX & NSSF CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator size={18} className="text-indigo-600" />
                <span>{language === 'km' ? 'ម៉ាស៊ីនគណនាពន្ធប្រាក់បៀវត្សរ៍ & ប.ស.ស' : 'Tax & NSSF Calculator'}</span>
              </h3>
              <p className={`text-xs text-slate-500 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {language === 'km'
                  ? 'គណនាដោយផ្អែកលើតារាងពន្ធប្រាក់បៀវត្សរ៍ឆ្នាំ២០២៦ នៃអគ្គនាយកដ្ឋានពន្ធដារ និងកាតព្វកិច្ចរបបសន្តិសុខសង្គម (ប.ស.ស)។'
                  : 'Simulate gross-to-net salary under 2026 Cambodia General Department of Taxation rules.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'km' ? 'ប្រាក់បៀវត្សរ៍សរុបប្រចាំខែ (Gross Monthly Salary - USD):' : 'Gross Monthly Salary (USD):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={calcGrossInput}
                    onChange={(e) => setCalcGrossInput(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Preset Buttons */}
                <div className="flex gap-2 mt-2">
                  {[250, 500, 1000, 1500, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcGrossInput(preset)}
                      className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'km' ? 'ចំនួនបន្ទុកក្នុងបន្ទុកគ្រួសារ (Spouse & Minor Children):' : 'Eligible Dependents (Rebate 150,000 KHR each):'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={calcDependentsInput}
                  onChange={(e) => setCalcDependentsInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className={`text-[11px] text-slate-400 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'ការកាត់បន្ថយបន្ទុក ១៥០,០០០ រៀល (~$36.50) ក្នុងម្នាក់' : '150,000 KHR (~$36.50 USD) deduction per dependent'}
                </p>
              </div>
            </div>

            {/* Quick Summary in card */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{language === 'km' ? 'ប្រាក់ខែសរុប (Gross):' : 'Gross Salary:'}</span>
                <span className="font-bold text-slate-900">${calculatedResult.grossSalaryUsd.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-rose-600">
                <span>{language === 'km' ? 'ពន្ធលើប្រាក់បៀវត្សរ៍ (ToS):' : 'Salary Tax (ToS):'}</span>
                <span className="font-bold">-${calculatedResult.taxUsd.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600">
                <span>{language === 'km' ? 'ភាគទាន ប.ស.ស បុគ្គលិក (2%):' : 'NSSF Pension (2%):'}</span>
                <span className="font-bold">-${calculatedResult.nssfEmployeeUsd.toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm">
                <span className="font-black text-slate-900">{language === 'km' ? 'ប្រាក់ខែសុទ្ធទទួលបាន (Net Take-Home):' : 'Net Take-Home:'}</span>
                <span className="font-black text-emerald-600 text-base">${calculatedResult.netSalaryUsd.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Detailed Tax Brackets Explanations */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'km' ? 'តារាងអត្រាពន្ធលើប្រាក់បៀវត្សរ៍កម្ពុជាឆ្នាំ ២០២៦ (Cambodia Progressive Tax Brackets)' : '2026 Progressive Tax On Salary (ToS) Schedule'}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">{language === 'km' ? 'ផ្នែកនៃប្រាក់បៀវត្សរ៍ជាប់ពន្ធ (KHR)' : 'Taxable Income Bracket (KHR)'}</th>
                    <th className="py-2.5 px-3">USD (~4,100 KHR)</th>
                    <th className="py-2.5 px-3">{language === 'km' ? 'អត្រាពន្ធ (Rate)' : 'Tax Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className={calcGrossInput * 4100 <= 1500000 ? 'bg-indigo-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{language === 'km' ? '០ ដល់ ១,៥០០,០០០ រៀល' : '0 to 1,500,000 KHR'}</td>
                    <td className="py-2.5 px-3">{language === 'km' ? '$0 ដល់ ~$365' : '$0 to ~$365'}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">{language === 'km' ? '0% (រួចពន្ធ)' : '0% (Tax Exempt)'}</td>
                  </tr>
                  <tr className={calcGrossInput * 4100 > 1500000 && calcGrossInput * 4100 <= 2000000 ? 'bg-indigo-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{language === 'km' ? '១,៥០០,០០១ ដល់ ២,០០០,០០០ រៀល' : '1,500,001 to 2,000,000 KHR'}</td>
                    <td className="py-2.5 px-3">{language === 'km' ? '~$366 ដល់ ~$487' : '~$366 to ~$487'}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-bold">5%</td>
                  </tr>
                  <tr className={calcGrossInput * 4100 > 2000000 && calcGrossInput * 4100 <= 8500000 ? 'bg-indigo-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{language === 'km' ? '២,០០០,០០១ ដល់ ៨,៥០០,០០០ រៀល' : '2,000,001 to 8,500,000 KHR'}</td>
                    <td className="py-2.5 px-3">{language === 'km' ? '~$488 ដល់ ~$2,073' : '~$488 to ~$2,073'}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-bold">10%</td>
                  </tr>
                  <tr className={calcGrossInput * 4100 > 8500000 && calcGrossInput * 4100 <= 12500000 ? 'bg-indigo-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{language === 'km' ? '៨,៥០០,០០១ ដល់ ១២,៥០០,០០០ រៀល' : '8,500,001 to 12,500,000 KHR'}</td>
                    <td className="py-2.5 px-3">{language === 'km' ? '~$2,074 ដល់ ~$3,048' : '~$2,074 to ~$3,048'}</td>
                    <td className="py-2.5 px-3 text-purple-600 font-bold">15%</td>
                  </tr>
                  <tr className={calcGrossInput * 4100 > 12500000 ? 'bg-indigo-50/50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{language === 'km' ? 'លើសពី ១២,៥០០,០០០ រៀល' : 'Above 12,500,000 KHR'}</td>
                    <td className="py-2.5 px-3">{language === 'km' ? 'លើសពី ~$3,048' : 'Above ~$3,048'}</td>
                    <td className="py-2.5 px-3 text-rose-600 font-bold">20%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statutory Employer Contributions info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">
                {language === 'km' ? 'កាតព្វកិច្ចនិយោជកបន្ថែមសម្រាប់ ប.ស.ស (Employer NSSF Liabilities):' : 'Statutory Employer Contributions (Paid by Company):'}
              </span>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                <li>{language === 'km' ? 'របបសោធន (Pension): ២% (អតិបរមា ២៤,០០០ រៀល / ~$5.85)' : 'NSSF Pension: 2% (capped at 24,000 KHR / ~$5.85 USD)'}</li>
                <li>{language === 'km' ? 'ថែទាំសុខភាព (Health Care): ២.៦% (អតិបរមា ៣១,២០០ រៀល / ~$7.61)' : 'Health Care: 2.6% (capped at 31,200 KHR / ~$7.61 USD)'}</li>
                <li>{language === 'km' ? 'ហានិភ័យការងារ (Occupational Risk): ០.៨% (អតិបរមា ៩,៦០០ រៀល / ~$2.34)' : 'Occupational Risk: 0.8% (capped at 9,600 KHR / ~$2.34 USD)'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Salary Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'km' ? 'កែសម្រួលប្រាក់បៀវត្សរ៍បុគ្គលិក' : 'Adjust Employee Salary'}
                  </h3>
                  <p className={`text-xs text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពប្រាក់ខែគោល ប្រាក់ឧបត្ថម្ភ និងកត់ត្រាប្រវត្តិ' : 'Update base pay, regular allowances, and log historical change'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-5">
              {/* Select Employee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'km' ? 'ជ្រើសរើសបុគ្គលិក (Select Employee):' : 'Select Employee:'}
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => handleSelectEmployeeInModal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) - {emp.role} [Current: ${emp.salary}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary & Grade Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ប្រាក់ខែមូលដ្ឋានថ្មី (New Base Salary):' : 'New Base Salary (USD):'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formNewSalary}
                      onChange={(e) => setFormNewSalary(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 1500.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'កម្រិតប្រាក់ខែ (Grade):' : 'Pay Grade:'}
                  </label>
                  <select
                    value={formPayGrade}
                    onChange={(e) => setFormPayGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAY_GRADES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Increment Difference Pill */}
              {selectedEmployee && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {language === 'km' ? 'ប្រាក់ខែចាស់:' : 'Previous Base:'} <strong>${selectedEmployee.salary}</strong>
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      adjustmentDiff.isIncrease ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {adjustmentDiff.isIncrease ? '▲ +' : '▼ -'}$
                    {Math.abs(adjustmentDiff.amount).toFixed(2)} ({adjustmentDiff.percent}%)
                  </span>
                </div>
              )}

              {/* Adjustment Reason & Effective Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ប្រភេទនៃការដំឡើង (Reason Type):' : 'Adjustment Reason / Type:'}
                  </label>
                  <select
                    value={formAdjustmentType}
                    onChange={(e) => setFormAdjustmentType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Annual Merit Increase">{language === 'km' ? 'ដំឡើងប្រចាំឆ្នាំ (Annual Merit Increase)' : 'Annual Merit Increase'}</option>
                    <option value="Promotion Adjustment">{language === 'km' ? 'តម្លើងតំណែង (Promotion Adjustment)' : 'Promotion Adjustment'}</option>
                    <option value="Probation Confirmation">{language === 'km' ? 'ជាប់សាកល្បងការងារ (Probation Confirmation)' : 'Probation Confirmation'}</option>
                    <option value="Market Realignment">{language === 'km' ? 'កែសម្រួលតាមទីផ្សារ (Market Realignment)' : 'Market Realignment'}</option>
                    <option value="Cost of Living Adjustment">{language === 'km' ? 'ប្រាក់ឧបត្ថម្ភជីវភាព (Cost of Living - COLA)' : 'Cost of Living Adjustment (COLA)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'កាលបរិច្ឆេទចូលជាធរមាន (Effective Date):' : 'Effective Date:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formEffectiveDate}
                    onChange={(e) => setFormEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Allowances Breakdown (Collapsible / Group) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'km' ? 'ប្រាក់ឧបត្ថម្ភប្រចាំខែថេរ (Fixed Monthly Allowances - USD):' : 'Fixed Monthly Allowances (USD):'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'km' ? 'ថ្លៃអាហារ (Meal Allowance $)' : 'Meal Allowance ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formMeal}
                      onChange={(e) => setFormMeal(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'km' ? 'ថ្លៃស្នាក់នៅ & ធ្វើដំណើរ (Housing - Transport Allowance $)' : 'Housing - Transport Allowance ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formHousingTransport}
                      onChange={(e) => setFormHousingTransport(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'km' ? 'ប្រាក់វត្តមានការងារ (Attendance Bonus $)' : 'Attendance Bonus ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formAttendance}
                      onChange={(e) => setFormAttendance(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'km' ? 'ប្រាក់ជំនាញ (Skill Allowance $)' : 'Skill Allowance ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formSkill}
                      onChange={(e) => setFormSkill(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        {language === 'km' ? 'ប្រាក់អតីតភាព (Seniority Allowance $)' : 'Seniority Allowance ($)'}
                      </label>
                      {selectedEmployee && (() => {
                        const res = calculateSeniorityAllowanceFromDate(selectedEmployee.join_date);
                        return (
                          <span className="text-[10px] text-indigo-600 font-mono font-bold">
                            {res.tenureLabel} (${res.allowance.toFixed(2)})
                          </span>
                        );
                      })()}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formSeniority}
                        onChange={(e) => setFormSeniority(e.target.value)}
                        className="w-full pl-2.5 pr-14 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedEmployee) {
                            const res = calculateSeniorityAllowanceFromDate(selectedEmployee.join_date);
                            setFormSeniority(String(res.allowance));
                          }
                        }}
                        className="absolute right-1 top-1 bottom-1 px-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-semibold rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        title={language === 'km' ? 'គណនាប្រាក់អតីតភាពស្វ័យប្រវត្តិពីថ្ងៃចូលធ្វើការ' : 'Auto-calculate Seniority Allowance from Join Date'}
                      >
                        ⚡ Auto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ធនាគារ (Bank):' : 'Bank Name:'}
                  </label>
                  <select
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  >
                    <option value="ABA Bank">{language === 'km' ? 'ABA Bank (អេ ប៊ី អេ)' : 'ABA Bank'}</option>
                    <option value="ACLEDA Bank">{language === 'km' ? 'ACLEDA Bank (អេស៊ីលីដា)' : 'ACLEDA Bank'}</option>
                    <option value="Canadia Bank">{language === 'km' ? 'Canadia Bank (កាណាឌីយ៉ា)' : 'Canadia Bank'}</option>
                    <option value="Wing Bank">{language === 'km' ? 'Wing Bank (វីង)' : 'Wing Bank'}</option>
                    <option value="Sathapana Bank">{language === 'km' ? 'Sathapana Bank (សហគ្រាស)' : 'Sathapana Bank'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះគណនី (Account Name):' : 'Account Name:'}
                  </label>
                  <input
                    type="text"
                    value={formBankAccountName}
                    onChange={(e) => setFormBankAccountName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'លេខគណនី (Account No):' : 'Account Number:'}
                  </label>
                  <input
                    type="text"
                    value={formBankAccountNumber}
                    onChange={(e) => setFormBankAccountNumber(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white font-mono"
                    placeholder="e.g. 001 234 567"
                  />
                </div>
              </div>

              {/* Reason / Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'មូលហេតុនៃការកែសម្រួល (Reason / Notes):' : 'Approval Justification:'}
                </label>
                <textarea
                  rows={2}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={language === 'km' ? 'កំណត់សម្គាល់អំពីការដំឡើងប្រាក់បៀវត្សរ៍...' : 'Notes regarding performance, review, or contract amendment...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview Impact */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    {language === 'km' ? 'ប៉ាន់ស្មានប្រាក់ខែសុទ្ធទទួលបាន (Est. Net Pay):' : 'Estimated Monthly Net Take-Home:'}
                  </span>
                  <span className={`text-[11px] text-emerald-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? 'ក្រោយកាត់ពន្ធប្រាក់ខែ & ប.ស.ស' : 'After progressive ToS tax & NSSF deduction'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-700">
                    ${simulatedTax.netSalaryUsd.toFixed(2)} USD
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    (Tax: -${simulatedTax.taxUsd.toFixed(2)} | NSSF: -${simulatedTax.nssfEmployeeUsd.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Confirm Adjustment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
