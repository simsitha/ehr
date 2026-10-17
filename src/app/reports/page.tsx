'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText, formatDateDMY } from '@/lib/translations';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Clock,
  CreditCard,
  Building2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Shield,
  Briefcase,
  FileText,
  DollarSign,
  Search,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Check,
} from 'lucide-react';

import TaxOnSalaryReportView from '@/components/TaxOnSalaryReportView';

interface ReportData {
  month: string;
  department_id: string;
  period?: string;
  availablePeriods?: string[];
  companySettings?: any;
  taxOnSalaryRecords?: any[];
  taxOnSalarySummary?: any;
  departments: Array<{ id: string; name: string; color: string }>;
  kpis: {
    totalHeadcount: number;
    activeHeadcount: number;
    onLeaveHeadcount: number;
    companyAttendanceRate: number;
    totalGrossPayroll: number;
    totalNetDisbursement: number;
    totalTaxWithheld: number;
    totalNssfContributions: number;
    exchangeRate: number;
  };
  attendanceSummary: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    department_id: string;
    present: number;
    remote: number;
    late: number;
    absent: number;
    totalHours: number;
    overtimeHours: number;
  }>;
  bankDisbursement: Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    bank_account_aba: string;
    bank_account_acleda: string;
    nssf_member_id: string;
    base_salary: number;
    allowances: number;
    bonuses: number;
    gross_salary: number;
    tax_withholding: number;
    nssf_employee: number;
    nssf_employer: number;
    nssf_total_payable: number;
    contributory_wage_usd: number;
    contributory_wage_khr: number;
    pension_employee: number;
    pension_employer: number;
    health_employer: number;
    risk_employer: number;
    net_salary_usd: number;
    net_salary_khr: number;
    status: string;
    payment_method: string;
  }>;
  leaveBalances: Array<{
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    role: string;
    department_name: string;
    annual_total: number;
    annual_used: number;
    sick_total: number;
    sick_used: number;
    casual_total: number;
    casual_used: number;
  }>;
  departmentsSummary: Array<{
    id: string;
    name: string;
    color: string;
    employeeCount: number;
    monthlySalaryBudget: number;
    sharePercent: number;
  }>;
}

export default function ReportsPage() {
  const { language, t, showToast } = useApp();

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = d.toISOString().substring(0, 7);
      const labelEn = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, labelEn });
    }
    return options;
  }, []);

  const [activeTab, setActiveTab] = useState<'tos' | 'attendance' | 'payroll' | 'nssf' | 'workforce' | 'leaves'>('tos');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [selectedPeriod, setSelectedPeriod] = useState('August 2026');
  const [selectedDept, setSelectedDept] = useState('all');
  const [bankFormat, setBankFormat] = useState<'aba' | 'acleda' | 'master'>('aba');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch report data from API
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetch(`/api/reports?month=${selectedMonth}&department_id=${selectedDept}&period=${encodeURIComponent(selectedPeriod)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
      })
      .then((data) => {
        if (data && data.kpis) {
          setReportData(data);
          if (data.availablePeriods && data.availablePeriods.length > 0 && !data.availablePeriods.includes(selectedPeriod)) {
            setSelectedPeriod(data.availablePeriods[0]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching reports:', err);
        setFetchError(err.message || 'Error loading report data');
        setLoading(false);
      });
  }, [selectedMonth, selectedDept, selectedPeriod]);

  // Export Attendance CSV
  const handleExportAttendanceCsv = () => {
    if (!reportData || !reportData.attendanceSummary) return;

    const headers = ['Employee ID', 'Employee Name', 'Department', 'Role', 'Days Present', 'Days Remote', 'Days Late', 'Days Absent', 'Total Work Hours', 'Overtime Hours'];
    const rows = reportData.attendanceSummary.map((a) => [
      a.id,
      `"${a.name}"`,
      `"${a.department}"`,
      `"${a.role}"`,
      a.present,
      a.remote,
      a.late,
      a.absent,
      a.totalHours,
      a.overtimeHours,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HESTRA_Attendance_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកតារាងវត្តមានជា CSV' : 'Exported Attendance CSV', 'success');
  };

  // Export ABA Bank Bulk Payout CSV
  const handleExportAbaCsv = () => {
    if (!reportData || !reportData.bankDisbursement) return;

    const headers = ['Beneficiary Account Number', 'Beneficiary Name', 'Amount (USD)', 'Currency', 'Payment Description / Remark'];
    const rows = reportData.bankDisbursement.map((p) => [
      `'${p.bank_account_aba}`,
      `"${p.employee_name}"`,
      p.net_salary_usd.toFixed(2),
      'USD',
      `"Salary Payout ${selectedMonth} - HESTRA HRM"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ABA_Bulk_Salary_Disbursement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកឯកសារផ្ទេរប្រាក់ ABA Corporate CSV' : 'Exported ABA Bulk CSV', 'success');
  };

  // Export NSSF Form 1-02 CSV
  const handleExportNssfCsv = () => {
    if (!reportData || !reportData.bankDisbursement) return;

    const headers = [
      'NSSF Member ID',
      'Employee Name',
      'Department',
      'Actual Wage (USD)',
      'Contributory Wage Capped (KHR)',
      'Pension Scheme 2% EE (USD)',
      'Pension Scheme 2% ER (USD)',
      'Health Care 2.6% ER (USD)',
      'Occupational Risk 0.8% ER (USD)',
      'Total NSSF Payable (USD)',
    ];

    const rows = reportData.bankDisbursement.map((p) => [
      p.nssf_member_id,
      `"${p.employee_name}"`,
      `"${p.department}"`,
      p.base_salary.toFixed(2),
      p.contributory_wage_khr,
      p.pension_employee.toFixed(2),
      p.pension_employer.toFixed(2),
      p.health_employer.toFixed(2),
      p.risk_employer.toFixed(2),
      p.nssf_total_payable.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NSSF_Declaration_Form_1-02_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកបញ្ជីប្រកាស ប.ស.ស ជា CSV' : 'Exported NSSF Form 1-02 CSV', 'success');
  };

  // Export Leave Balances CSV
  const handleExportLeavesCsv = () => {
    if (!reportData || !reportData.leaveBalances) return;

    const headers = ['Employee ID', 'Employee Name', 'Department', 'Role', 'Annual Total', 'Annual Used', 'Annual Remaining', 'Sick Used', 'Casual Used'];
    const rows = reportData.leaveBalances.map((l) => [
      l.employee_id,
      `"${l.first_name} ${l.last_name}"`,
      `"${l.department_name || 'General'}"`,
      `"${l.role}"`,
      l.annual_total,
      l.annual_used,
      l.annual_total - l.annual_used,
      l.sick_used,
      l.casual_used,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HESTRA_Leave_Balances_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកតារាងសមតុល្យច្បាប់ជា CSV' : 'Exported Leave Balances CSV', 'success');
  };

  // Export 55-Column Tax on Salary Record (GDT Format)
  const handleExportTosCsv = () => {
    if (!reportData || !reportData.taxOnSalaryRecords) return;

    const headers = [
      'ID', 'Khmer Name', 'English Name', 'Join Date', 'Working Period', 'Contract Type',
      'Bank Name', 'Bank Account Name', 'Bank Account', 'DOB', 'Khmer ID', 'Sex', 'Nationality', 'Position',
      'Basic Salary', 'Working Days', 'Absent', 'Unpaid Day', 'Basic Working Salary', 'Seniority Bonus',
      'Position Allowance', 'Sewing Skill Matrix', 'Skill Allowance', 'Transport / Housing', 'Attendance Allowance',
      'Food Allowance', 'Overtime Pay', 'Overtime Food Allowance', 'Achievement Bonus', 'Monthly Evaluation Bonus',
      'Annual Leave', 'With Tax on Seniority', 'Salary Adjustment', 'Total Salary (Gross)', 'Non-Taxable Amount',
      'Pension Fund (USD)', 'Taxable Salary (USD)', 'Taxable Salary (KHR)', 'Dependents Count', 'Taxable Base (KHR)',
      'Tax Rate', 'Tax on Salary (KHR)', 'Tax on Salary (USD)', 'After Tax Salary', 'Paid Cash Adjustment',
      'First Paid', 'Paid Daily Target Bonus', 'Paid Food Fee', 'Second Paid', 'Total Paid (Net)', 'Labor Type'
    ];

    const rows = reportData.taxOnSalaryRecords.map((r: any) => [
      r.id,
      `"${r.khmer_name || ''}"`,
      `"${r.english_name || ''}"`,
      formatDateDMY(r.join_date),
      r.working_period || 0,
      `"${r.contract_type || 'UDC'}"`,
      `"${r.bank_name || 'ABA Bank'}"`,
      `"${r.bank_account_name || ''}"`,
      `"${r.bank_account_number || ''}"`,
      formatDateDMY(r.dob),
      `"${r.national_id || ''}"`,
      r.gender || '',
      r.nationality || '',
      `"${r.position || ''}"`,
      r.basic_salary?.toFixed(2) || '0.00',
      r.working_days || 26,
      r.absent_days || 0,
      r.unpaid_days || 0,
      r.basic_working_salary?.toFixed(2) || '0.00',
      r.seniority_bonus?.toFixed(2) || '0.00',
      r.position_allowance?.toFixed(2) || '0.00',
      r.sewing_skill_matrix?.toFixed(2) || '0.00',
      r.skill_allowance?.toFixed(2) || '0.00',
      r.transport_housing?.toFixed(2) || '0.00',
      r.attendance_allowance?.toFixed(2) || '0.00',
      r.food_allowance?.toFixed(2) || '0.00',
      r.overtime_pay?.toFixed(2) || '0.00',
      r.overtime_food?.toFixed(2) || '0.00',
      r.achievement_bonus?.toFixed(2) || '0.00',
      r.monthly_eval_bonus?.toFixed(2) || '0.00',
      r.annual_leave?.toFixed(2) || '0.00',
      '0.00',
      r.salary_adjustment?.toFixed(2) || '0.00',
      r.total_salary?.toFixed(2) || '0.00',
      r.non_taxable_total?.toFixed(2) || '0.00',
      r.pension_fund?.toFixed(2) || '0.00',
      r.taxable_salary_usd?.toFixed(2) || '0.00',
      r.taxable_salary_khr || 0,
      r.dependents_count || 0,
      r.taxable_base || 0,
      r.tax_rate || '0%',
      r.tax_on_salary_khr?.toFixed(2) || '0.00',
      r.tax_on_salary_usd?.toFixed(2) || '0.00',
      r.after_tax_salary?.toFixed(2) || '0.00',
      '0.00',
      r.first_paid?.toFixed(2) || '0.00',
      r.paid_target_bonus?.toFixed(2) || '0.00',
      '0.00',
      r.second_paid?.toFixed(2) || '0.00',
      r.total_paid?.toFixed(2) || '0.00',
      `"${r.labor_type || 'Direct Labour'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HESTRA_Tax_On_Salary_Record_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកតារាងពន្ធប្រាក់បៀវត្សរ៍ 55 ជួរឈរជា CSV' : 'Exported 55-Column Tax on Salary CSV', 'success');
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & CONTROLS */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 size={16} />
            <span>{language === 'km' ? 'មជ្ឈមណ្ឌលស្ថិតិ & របាយការណ៍ប្រតិបត្តិ (HR Analytics & Reports)' : 'HR Analytics & Reports'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {language === 'km' ? 'របាយការណ៍ & ឯកសារធនាគារផ្លូវការ' : 'Executive Reports & Banking Hub'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-khmer">
            {language === 'km'
              ? 'ទាញយកឯកសារវត្តមានប្រចាំខែ បញ្ជីផ្ទេរបៀវត្សរ៍តាមធនាគារ ABA / ACLEDA របាយការណ៍បង់ភាគទាន ប.ស.ស (ទម្រង់ ១-០២) និងស្ថិតិបុគ្គលិក។'
              : 'Export monthly timesheets, ABA/ACLEDA corporate salary batch CSVs, official Cambodia NSSF Form 1-02, and workforce metrics.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={15} className="text-slate-500" />
            <span>{language === 'km' ? 'បោះពុម្ព (Print)' : 'Print Report'}</span>
          </button>

          {activeTab === 'tos' && (
            <button
              onClick={handleExportTosCsv}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Download size={15} />
              <span>{language === 'km' ? 'ទាញយក 55-Col ToS CSV' : 'Export 55-Col ToS CSV'}</span>
            </button>
          )}

          {activeTab === 'attendance' && (
            <button
              onClick={handleExportAttendanceCsv}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Download size={15} />
              <span>{language === 'km' ? 'ទាញយក CSV វត្តមាន' : 'Export Attendance CSV'}</span>
            </button>
          )}

          {activeTab === 'payroll' && (
            <button
              onClick={handleExportAbaCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>{language === 'km' ? 'ទាញយក ABA Bulk CSV' : 'Export ABA Bank CSV'}</span>
            </button>
          )}

          {activeTab === 'nssf' && (
            <button
              onClick={handleExportNssfCsv}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Shield size={15} />
              <span>{language === 'km' ? 'ទាញយក ប.ស.ស (Form 1-02)' : 'Export NSSF Form 1-02'}</span>
            </button>
          )}

          {activeTab === 'leaves' && (
            <button
              onClick={handleExportLeavesCsv}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Download size={15} />
              <span>{language === 'km' ? 'ទាញយក CSV ច្បាប់ឈប់' : 'Export Leaves CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-khmer">
              {language === 'km' ? 'ខែរបាយការណ៍៖' : 'Reporting Period:'}
            </span>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {monthOptions.map((opt: { value: string; labelEn: string }) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEn}
                  </option>
                ))}
              </select>
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Department selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-khmer">
              {language === 'km' ? 'ផ្នែកការងារ៖' : 'Department:'}
            </span>
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-khmer"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់ (All Departments)' : 'All Departments'}</option>
                {reportData?.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatLocalizedText(d.name, language)}
                  </option>
                ))}
              </select>
              <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិក...' : 'Search employee...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* 3. TOP KPI CARDS */}
      {reportData && reportData.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Headcount */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                {language === 'km' ? 'កម្លាំងពលកម្មសរុប' : 'Total Headcount'}
              </span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 my-1 font-mono">
              {reportData.kpis.totalHeadcount} <span className="text-xs font-sans text-slate-500 font-semibold">{language === 'km' ? 'នាក់' : 'staff'}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-khmer">
              <span className="text-emerald-600 font-bold">{reportData.kpis.activeHeadcount} {language === 'km' ? 'កំពុងបម្រើការ' : 'Active'}</span>
              <span>&bull;</span>
              <span>{reportData.kpis.onLeaveHeadcount} {language === 'km' ? 'សុំច្បាប់' : 'On Leave'}</span>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                {language === 'km' ? 'អត្រាវត្តមានប្រចាំខែ' : 'Attendance Rate'}
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 my-1 font-mono">
              {reportData.kpis.companyAttendanceRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-khmer">
              {language === 'km' ? 'គិតបញ្ចូលការមកទាន់ពេល & ធ្វើការពីផ្ទះ (WFH)' : 'Includes on-time office & approved WFH'}
            </div>
          </div>

          {/* Net Payroll Disbursement */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                {language === 'km' ? 'ប្រាក់ខែបើកជាក់ស្តែង (Net)' : 'Net Disbursement'}
              </span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-600 my-1 font-mono">
              ${reportData.kpis.totalNetDisbursement.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ~{(reportData.kpis.totalNetDisbursement * reportData.kpis.exchangeRate).toLocaleString()} KHR
            </div>
          </div>

          {/* NSSF Contributions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                {language === 'km' ? 'ភាគទាន ប.ស.ស សរុប' : 'NSSF Contributions'}
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Shield size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600 my-1 font-mono">
              ${reportData.kpis.totalNssfContributions.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-khmer">
              {language === 'km' ? 'សោធននិវត្តន៍ + ថែទាំសុខភាព + ហានិភ័យ' : 'Pension + Health Care + Occupational Risk'}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB NAVIGATION */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('tos')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tos'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>{language === 'km' ? '១. បញ្ជីប្រកាសពន្ធ ToS (Tax on Salary Record)' : '1. Tax on Salary Record (ToS)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock size={15} />
          <span>{language === 'km' ? '២. វត្តមាន & ម៉ោងការងារ (Timesheets)' : '2. Attendance & Timesheets'}</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard size={15} />
          <span>{language === 'km' ? '៣. បញ្ជីផ្ទេរបៀវត្សរ៍ធនាគារ (Bank Disbursement)' : '3. Bank Salary Disbursement'}</span>
        </button>

        <button
          onClick={() => setActiveTab('nssf')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nssf'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield size={15} />
          <span>{language === 'km' ? '៤. របាយការណ៍ ប.ស.ស (NSSF Form 1-02)' : '4. Cambodia NSSF Form 1-02'}</span>
        </button>

        <button
          onClick={() => setActiveTab('workforce')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workforce'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={15} />
          <span>{language === 'km' ? '៥. ស្ថិតិកម្លាំងពលកម្ម (Workforce Demographics)' : '5. Workforce Demographics'}</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'bg-white border-x border-t border-slate-200 text-indigo-600 -mb-px shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Briefcase size={15} />
          <span>{language === 'km' ? '៦. សមតុល្យច្បាប់ឈប់សម្រាក (Leave Balances)' : '6. Leave Balances'}</span>
        </button>
      </div>

      {/* 5. TAB CONTENTS */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs text-slate-500 font-khmer">{language === 'km' ? 'កំពុងប្រមូលទិន្នន័យរបាយការណ៍... (Loading Report Data)' : 'Aggregating report data...'}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* TAB 0: TAX ON SALARY (55-COL RECORD) */}
          {activeTab === 'tos' && (
            <TaxOnSalaryReportView
              reportData={reportData}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              onExportCsv={handleExportTosCsv}
            />
          )}
          {/* TAB 1: ATTENDANCE & TIMESHEETS */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-khmer">
                    {language === 'km' ? 'តារាងវត្តមាន & ម៉ោងការងារបុគ្គលិកប្រចាំខែ' : 'Monthly Attendance & Timesheet Summary'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    {language === 'km'
                      ? `ខែ ${selectedMonth} • បង្ហាញវត្តមាន មកការិយាល័យ ធ្វើការពីផ្ទះ យឺត និងម៉ោងបន្ថែម`
                      : `Period: ${selectedMonth} • Summary of Present, WFH, Late, Absent, and Overtime`}
                  </p>
                </div>
                <button
                  onClick={handleExportAttendanceCsv}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">{language === 'km' ? 'បុគ្គលិក (Employee)' : 'Employee'}</th>
                      <th className="py-3 px-4">{language === 'km' ? 'ផ្នែក (Department)' : 'Department'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'មកការិយាល័យ' : 'Office'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'WFH (ផ្ទះ)' : 'WFH'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'យឺត (Late)' : 'Late'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'អវត្តមាន' : 'Absent'}</th>
                      <th className="py-3 px-3 text-right">{language === 'km' ? 'ម៉ោងសរុប' : 'Total Hours'}</th>
                      <th className="py-3 px-3 text-right">{language === 'km' ? 'ម៉ោងបន្ថែម (OT)' : 'Overtime'}</th>
                      <th className="py-3 px-4 text-center">{language === 'km' ? 'អត្រាវត្តមាន' : 'Rate'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-khmer">
                    {reportData.attendanceSummary
                      .filter((a) => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.role.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((att) => {
                        const totalDays = att.present + att.remote + att.late + att.absent || 5;
                        const rate = Math.round(((att.present + att.remote + att.late) / totalDays) * 100);
                        return (
                          <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{formatLocalizedText(att.name, language)}</div>
                              <div className="text-[11px] text-slate-400">{formatLocalizedText(att.role, language)}</div>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">{formatLocalizedText(att.department, language)}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{att.present}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-blue-600">{att.remote}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-amber-600">{att.late}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{att.absent}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{att.totalHours.toFixed(1)} h</td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-purple-600">
                              {att.overtimeHours > 0 ? `+${att.overtimeHours.toFixed(1)} h` : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rate >= 95
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rate >= 80
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: BANK SALARY DISBURSEMENT (ABA / ACLEDA / MASTER) */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              {/* Bank Selector bar */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                    <Building2 size={16} />
                    <span>{language === 'km' ? 'ការទូទាត់ប្រាក់បៀវត្សរ៍តាមធនាគារកម្ពុជា' : 'Cambodia Corporate Banking Payout'}</span>
                  </div>
                  <h3 className="text-xl font-black text-white font-khmer">
                    {language === 'km' ? 'បញ្ជីផ្ទេរបៀវត្សរ៍ជាក្រុម (Bulk Payroll Batch)' : 'Corporate Salary Disbursement Batch'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-khmer">
                    {language === 'km'
                      ? 'ទម្រង់ឯកសារត្រូវតាមស្តង់ដារធនាគារ ABA i-Banking Corporate និង ACLEDA Corporate Payout។'
                      : 'Standard template compatible with ABA Corporate Portal & ACLEDA Direct Disbursement.'}
                  </p>
                </div>

                {/* Bank format toggle */}
                <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm">
                  <button
                    onClick={() => setBankFormat('aba')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bankFormat === 'aba' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ABA Corporate
                  </button>
                  <button
                    onClick={() => setBankFormat('acleda')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bankFormat === 'acleda' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ACLEDA Bank
                  </button>
                  <button
                    onClick={() => setBankFormat('master')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bankFormat === 'master' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {language === 'km' ? 'បញ្ជីរួម (Master)' : 'Master Sheet'}
                  </button>
                </div>
              </div>

              {/* Bank Batch Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 font-khmer">
                    {bankFormat === 'aba' && (language === 'km' ? 'ឯកសារផ្ទេរតាម ABA Bank Corporate (ABA Bulk Transfer Format)' : 'ABA Bank Corporate Bulk Transfer Format')}
                    {bankFormat === 'acleda' && (language === 'km' ? 'ឯកសារផ្ទេរតាម ACLEDA Bank Corporate Payout Format' : 'ACLEDA Bank Corporate Payout Format')}
                    {bankFormat === 'master' && (language === 'km' ? 'បញ្ជីទូទាត់បៀវត្សរ៍រួម (Full Master Compensation Roster)' : 'Full Master Compensation & Disbursement Roster')}
                  </div>
                  <button
                    onClick={handleExportAbaCsv}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{language === 'km' ? 'ទាញយក CSV ផ្ទេរប្រាក់' : 'Download Bank CSV'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">
                          {bankFormat === 'aba' ? (language === 'km' ? 'លេខគណនី ABA (Account)' : 'ABA Account') : bankFormat === 'acleda' ? (language === 'km' ? 'លេខគណនី ACLEDA' : 'ACLEDA Account') : (language === 'km' ? 'បុគ្គលិក' : 'Employee')}
                        </th>
                        <th className="py-3 px-4">{language === 'km' ? 'ឈ្មោះម្ចាស់គណនី (Beneficiary)' : 'Beneficiary Name'}</th>
                        <th className="py-3 px-4">{language === 'km' ? 'ផ្នែក (Department)' : 'Department'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ប្រាក់ខែដើម (Base)' : 'Base Salary'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ពន្ធ & ប.ស.ស' : 'Tax & NSSF'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ប្រាក់ត្រូវផ្ទេរ (USD)' : 'Disbursement (USD)'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ប្រាក់រៀល (KHR)' : 'Disbursement (KHR)'}</th>
                        <th className="py-3 px-4 text-center">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-khmer">
                      {reportData.bankDisbursement
                        .filter((p) => !searchQuery || p.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {bankFormat === 'aba' ? pay.bank_account_aba : bankFormat === 'acleda' ? pay.bank_account_acleda : pay.employee_id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{formatLocalizedText(pay.employee_name, language)}</div>
                              <div className="text-[11px] text-slate-400 font-sans">{pay.phone}</div>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">{formatLocalizedText(pay.department, language)}</td>
                            <td className="py-3 px-4 text-right font-mono">${pay.base_salary.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono text-rose-600">
                              -${(pay.tax_withholding + pay.nssf_employee).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                              ${pay.net_salary_usd.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                              {pay.net_salary_khr.toLocaleString()} {language === 'km' ? '៛' : 'KHR'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {pay.status === 'Paid' ? (language === 'km' ? 'បានបើក ✓' : 'Disbursed ✓') : (language === 'km' ? 'រង់ចាំផ្ទេរ' : 'Pending')}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NSSF FORM 1-02 DECLARATION */}
          {activeTab === 'nssf' && (
            <div className="space-y-4">
              {/* NSSF Legal Info Banner */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 shrink-0">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-khmer">
                      {language === 'km' ? 'របាយការណ៍បង់ភាគទានរបបសន្តិសុខសង្គម ប.ស.ស (ទម្រង់ ១-០២)' : 'National Social Security Fund (NSSF) Contribution Declaration (Form 1-02)'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 font-khmer leading-relaxed">
                      {language === 'km' ? (
                        <>
                          ស្របតាមច្បាប់ស្តីពីរបបសន្តិសុខសង្គម៖ ប្រាក់ជាប់ភាគទានអតិបរិមាត្រឹម <span className="font-bold text-slate-900 font-mono">១,២០០,០០០ រៀល (~$292.68)</span>។
                          ភាគទានសោធននិវត្តន៍ ៤% (និយោជិត ២% + និយោជក ២%), ថែទាំសុខភាព ២.៦% (និយោជក), និងហានិភ័យការងារ ០.៨% (និយោជក)។
                        </>
                      ) : (
                        <>
                          Pursuant to Cambodia Social Security Law: Maximum contributory wage capped at <span className="font-bold text-slate-900 font-mono">1,200,000 KHR (~$292.68)</span>.
                          Pension Scheme 4% (Employee 2% + Employer 2%), Health Care 2.6% (Employer), and Occupational Risk 0.8% (Employer).
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportNssfCsv}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{language === 'km' ? 'ទាញយកទម្រង់ ១-០២ (CSV)' : 'Export Form 1-02 (CSV)'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
                  </button>
                </div>
              </div>

              {/* NSSF Declaration Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">{language === 'km' ? 'លេខសម្គាល់ ប.ស.ស' : 'NSSF Member ID'}</th>
                        <th className="py-3 px-4">{language === 'km' ? 'ឈ្មោះនិយោជិត (Name)' : 'Employee Name'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ប្រាក់ឈ្នួលជាក់ស្តែង' : 'Gross Wage'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ប្រាក់ឈ្នួលជាប់ភាគទាន (គិតកម្រិតពិដាន)' : 'Contributory Wage (Capped)'}</th>
                        <th className="py-3 px-3 text-right">{language === 'km' ? 'សោធននិវត្តន៍ (២% EE)' : 'Pension (2% EE)'}</th>
                        <th className="py-3 px-3 text-right">{language === 'km' ? 'សោធននិវត្តន៍ (២% ER)' : 'Pension (2% ER)'}</th>
                        <th className="py-3 px-3 text-right">{language === 'km' ? 'ថែទាំសុខភាព (២.៦% ER)' : 'Health Care (2.6% ER)'}</th>
                        <th className="py-3 px-3 text-right">{language === 'km' ? 'ហានិភ័យការងារ (០.៨% ER)' : 'Occupational Risk (0.8% ER)'}</th>
                        <th className="py-3 px-4 text-right">{language === 'km' ? 'ភាគទានសរុប (Total)' : 'Total Payable'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-khmer">
                      {reportData.bankDisbursement
                        .filter((p) => !searchQuery || p.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">{pay.nssf_member_id}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{formatLocalizedText(pay.employee_name, language)}</td>
                            <td className="py-3 px-4 text-right font-mono">${pay.base_salary.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {pay.contributory_wage_khr.toLocaleString()} {language === 'km' ? '៛' : 'KHR'}
                              <div className="text-[10px] text-slate-400 font-normal">(${pay.contributory_wage_usd})</div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">${pay.pension_employee.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">${pay.pension_employer.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">${pay.health_employer.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">${pay.risk_employer.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-blue-700">
                              ${pay.nssf_total_payable.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={8} className="py-3 px-4 text-right font-khmer text-slate-700">
                          {language === 'km' ? 'ទឹកប្រាក់ភាគទានសរុបត្រូវបង់ចូល ប.ស.ស (Total Payable):' : 'Total NSSF Statutory Contribution Due:'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-blue-700">
                          ${reportData.kpis.totalNssfContributions.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKFORCE DEMOGRAPHICS */}
          {activeTab === 'workforce' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Department Headcount Breakdown (6 Cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 font-khmer">
                  {language === 'km' ? 'ការបែងចែកកម្លាំងពលកម្មតាមផ្នែក (Department Allocation)' : 'Department Allocation'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 font-khmer">
                  {language === 'km' ? 'ចំនួនបុគ្គលិក និងថវិកាបៀវត្សរ៍ប្រចាំខែតាមផ្នែកនីមួយៗ' : 'Staff count and monthly budget share per department'}
                </p>

                <div className="space-y-3">
                  {reportData.departmentsSummary.map((dept) => (
                    <div key={dept.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-khmer">
                        <span className="font-bold text-slate-800">{formatLocalizedText(dept.name, language)}</span>
                        <span className="font-mono font-bold text-slate-700">
                          {dept.employeeCount} {language === 'km' ? 'នាក់' : 'staff'} ({dept.sharePercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${dept.sharePercent}%`,
                            backgroundColor: dept.color || '#3b82f6',
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-khmer">
                        <span>{language === 'km' ? 'ថវិកាបៀវត្សរ៍ប្រចាំខែ៖' : 'Monthly Salary Budget:'}</span>
                        <span className="font-mono font-bold text-slate-900">${dept.monthlySalaryBudget.toLocaleString()} / {language === 'km' ? 'ខែ' : 'mo'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Status & Retention (6 Cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 font-khmer">
                    {language === 'km' ? 'ស្ថេរភាពការងារ & ចលនាបុគ្គលិក (Staff Stability)' : 'Staff Stability & Turnover'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-4 font-khmer">
                    {language === 'km' ? 'សូចនាករនៃការរក្សាបុគ្គលិក និងប្រភេទកិច្ចសន្យាការងារ' : 'Retention indicators and contract types'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block font-khmer">
                        {language === 'km' ? 'អត្រារក្សាបុគ្គលិក (Retention)' : 'Retention Rate'}
                      </span>
                      <div className="text-2xl font-black text-emerald-700 my-1 font-mono">94.8%</div>
                      <span className="text-[10px] text-emerald-600 font-khmer">{language === 'km' ? 'ខ្ពស់ជាងស្តង់ដារទីផ្សារកម្ពុជា' : 'Above regional market baseline'}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block font-khmer">
                        {language === 'km' ? 'អាយុកាលការងារមធ្យម (Tenure)' : 'Average Tenure'}
                      </span>
                      <div className="text-2xl font-black text-indigo-700 my-1 font-mono">2.4 {language === 'km' ? 'ឆ្នាំ' : 'years'}</div>
                      <span className="text-[10px] text-indigo-600 font-khmer">{language === 'km' ? 'បទពិសោធន៍រឹងមាំក្នុងស្ថាប័ន' : 'Solid institutional stability'}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 font-khmer">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span>{language === 'km' ? 'បុគ្គលិកពេញសិទ្ធិ (Full-Time Staff):' : 'Full-Time Staff (UDC):'}</span>
                      <span className="font-mono font-bold text-slate-900">16 {language === 'km' ? 'នាក់' : 'staff'} (88.9%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span>{language === 'km' ? 'បុគ្គលិកសាកល្បង (Probationary Staff):' : 'Probationary Staff:'}</span>
                      <span className="font-mono font-bold text-slate-900">2 {language === 'km' ? 'នាក់' : 'staff'} (11.1%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span>{language === 'km' ? 'អត្រាបុគ្គលិកលាឈប់ (Annual Turnover):' : 'Annual Turnover Rate:'}</span>
                      <span className="font-mono font-bold text-emerald-600">&lt; 5.2%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link href="/employees" className="text-indigo-600 font-bold hover:underline flex items-center gap-1 font-khmer">
                    <span>{language === 'km' ? 'មើលបញ្ជីឈ្មោះបុគ្គលិកទាំងអស់' : 'View Full Employee Directory'}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEAVE BALANCES */}
          {activeTab === 'leaves' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-khmer">
                    {language === 'km' ? 'តារាងសមតុល្យច្បាប់ឈប់សម្រាកបុគ្គលិក (Employee Leave Roster)' : 'Leave Balances & Utilization Roster'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    {language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ (២០ ថ្ងៃ) ច្បាប់ឈឺ (១០ ថ្ងៃ) និងច្បាប់ធុរៈ (៥ ថ្ងៃ)' : 'Annual (20d), Sick (10d), and Casual (5d) leave tracking'}
                  </p>
                </div>
                <button
                  onClick={handleExportLeavesCsv}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">{language === 'km' ? 'បុគ្គលិក (Employee)' : 'Employee'}</th>
                      <th className="py-3 px-4">{language === 'km' ? 'ផ្នែក (Department)' : 'Department'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ សរុប' : 'Annual Total'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'បានប្រើ' : 'Used'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'នៅសល់' : 'Balance'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'ច្បាប់ឈឺបានប្រើ' : 'Sick Used'}</th>
                      <th className="py-3 px-3 text-center">{language === 'km' ? 'ច្បាប់ធុរៈបានប្រើ' : 'Casual Used'}</th>
                      <th className="py-3 px-4 text-center">{language === 'km' ? 'ស្ថានភាពសមតុល្យ' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-khmer">
                    {reportData.leaveBalances
                      .filter((l) => !searchQuery || `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((l) => {
                        const rem = l.annual_total - l.annual_used;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {formatLocalizedText(`${l.first_name} ${l.last_name}`, language)}
                              <div className="text-[11px] font-normal text-slate-400">{formatLocalizedText(l.role, language)}</div>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">{formatLocalizedText(l.department_name || 'General', language)}</td>
                            <td className="py-3 px-3 text-center font-mono">{l.annual_total} {language === 'km' ? 'ថ្ងៃ' : 'days'}</td>
                            <td className="py-3 px-3 text-center font-mono text-rose-600">{l.annual_used} {language === 'km' ? 'ថ្ងៃ' : 'days'}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{rem} {language === 'km' ? 'ថ្ងៃ' : 'days'}</td>
                            <td className="py-3 px-3 text-center font-mono text-amber-600">{l.sick_used} / 10 {language === 'km' ? 'ថ្ងៃ' : 'days'}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-700">{l.casual_used} / 5 {language === 'km' ? 'ថ្ងៃ' : 'days'}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rem >= 10
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rem >= 5
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {rem >= 10 ? (language === 'km' ? 'សមតុល្យល្អ' : 'Healthy') : rem >= 5 ? (language === 'km' ? 'មធ្យម' : 'Moderate') : (language === 'km' ? 'ជិតអស់' : 'Low')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : fetchError ? (
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {language === 'km' ? 'មិនអាចបង្ហាញទិន្នន័យរបាយការណ៍បានទេ' : 'Unable to Display Reports & Analytics'}
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-mono">{fetchError}</p>
          <button
            onClick={() => {
              setLoading(true);
              setFetchError(null);
              fetch(`/api/reports?month=${selectedMonth}&department_id=${selectedDept}&period=${encodeURIComponent(selectedPeriod)}`)
                .then(r => r.json())
                .then(d => { setReportData(d); setLoading(false); })
                .catch(e => { setFetchError(e.message); setLoading(false); });
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            {language === 'km' ? 'ព្យាយាមម្តងទៀត (Retry)' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
          <p className="text-xs text-slate-500">{language === 'km' ? 'គ្មានទិន្នន័យរបាយការណ៍' : 'No report data available'}</p>
        </div>
      )}
    </div>
  );
}
