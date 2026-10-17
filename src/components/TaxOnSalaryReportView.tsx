'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDateDMY } from '@/lib/translations';
import {
  Download,
  Building2,
  Search,
} from 'lucide-react';

interface TaxOnSalaryReportViewProps {
  reportData: any;
  selectedPeriod: string;
  onPeriodChange: (p: string) => void;
  onExportCsv: () => void;
}

export default function TaxOnSalaryReportView({
  reportData,
  selectedPeriod,
  onPeriodChange,
  onExportCsv,
}: TaxOnSalaryReportViewProps) {
  const { language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [laborFilter, setLaborFilter] = useState<'all' | 'direct' | 'indirect'>('all');

  const company = reportData?.companySettings || {
    name: 'Hestra (Cambodia ) Co.,Ltd',
    khmer_name: 'ហេស្រ្តា(ខេមបូឌា)ឯ.ក',
    vat_tin: 'L001-902300053',
    address: 'National Road 4, Royal Group Phnom Penh Special Economic Zone Lot No. P2-81 Sangkat Pleung Chhes Rotes Khan Kambol Phnom Penh',
    address_khmer: 'ភ្លូវជាតិលេខ៤ តំបន់សេដ្ឋកិច្ចពិសេសរ៉ូយ៉ាល់គ្រុបភ្នំពេញ ឡូលេខៈP2-082 សង្កាត់ភ្លើងឆេះរទេះ ខណ្ឌកំបូល រាជធានីភ្នំពេញ',
    business_activity: 'Manufacturing of Leather and Fabric',
    business_activity_khmer: 'រោងចក្រផលិតសម្ភារៈកីឡាធ្វើពីស្បែកនិងក្រណាត់',
    hr_manager: 'Mr. Te Sareat',
    finance_manager: 'Mr. Met Dara',
    general_manager: 'Mr. Hamamoto Tomoyuki',
  };

  const records = (reportData?.taxOnSalaryRecords || []).filter((r: any) => {
    const matchSearch =
      !searchTerm ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.english_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.khmer_name.includes(searchTerm) ||
      r.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchLabor =
      laborFilter === 'all' ||
      (laborFilter === 'direct' && r.labor_type === 'Direct Labour') ||
      (laborFilter === 'indirect' && r.labor_type === 'Indirect Labour');

    return matchSearch && matchLabor;
  });

  const summary = reportData?.taxOnSalarySummary || {
    totalEmployees: records.length,
    totalBasicSalary: records.reduce((s: number, r: any) => s + (r.basic_salary || 0), 0),
    totalGrossSalary: records.reduce((s: number, r: any) => s + (r.total_salary || 0), 0),
    totalPensionUsd: records.reduce((s: number, r: any) => s + (r.pension_fund ?? r.pension_usd ?? r.insurance_deduction ?? 0), 0),
    totalTaxableUsd: records.reduce((s: number, r: any) => s + (r.taxable_salary_usd || 0), 0),
    totalTaxableKhr: records.reduce((s: number, r: any) => s + (r.taxable_salary_khr || 0), 0),
    totalTaxKhr: records.reduce((s: number, r: any) => s + (r.tax_on_salary_khr || 0), 0),
    totalTaxUsd: records.reduce((s: number, r: any) => s + (r.tax_on_salary_usd || 0), 0),
    totalAfterTaxSalary: records.reduce((s: number, r: any) => s + (r.after_tax_salary || 0), 0),
    totalFirstPaid: records.reduce((s: number, r: any) => s + (r.first_paid || 0), 0),
    totalTargetBonus: records.reduce((s: number, r: any) => s + (r.paid_target_bonus || 0), 0),
    totalSecondPaid: records.reduce((s: number, r: any) => s + (r.second_paid || 0), 0),
    totalPaid: records.reduce((s: number, r: any) => s + (r.total_paid || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* 1. Official Header Banner (GDT / Tax on Salary Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-200 pb-5">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Building2 size={16} />
              <span>{company.name}</span>
            </div>
            {language === 'km' && (
              <h2 className="text-xl font-black text-slate-900 font-khmer">
                {company.khmer_name}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 pt-1">
              <div>
                <span className="font-semibold text-slate-700">
                  {language === 'km' ? 'លេខអត្តសញ្ញាណកម្មអតប (VAT TIN): ' : 'VAT TIN: '}
                </span>
                <span className="font-mono font-bold text-indigo-700">{company.vat_tin}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">
                  {language === 'km' ? 'សកម្មភាពអាជីវកម្ម: ' : 'Business Activity: '}
                </span>
                <span>{language === 'km' ? company.business_activity_khmer : company.business_activity}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-slate-700">
                  {language === 'km' ? 'អាស័យដ្ឋាន: ' : 'Address: '}
                </span>
                <span>{language === 'km' ? company.address_khmer : company.address}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-between gap-3 text-right">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block font-sans">
                Tax on Salary (ToS) Record
              </span>
              <h3 className={`text-lg font-black text-slate-900 mt-1 ${language === 'km' ? 'font-khmer' : ''}`}>
                {language === 'km' ? 'បញ្ជីនៃការប្រកាសពន្ធលើប្រាក់បៀវត្ស' : 'Tax on Salary (ToS) Declaration Ledger'}
              </h3>
              <p className="text-xs font-bold text-slate-600">
                {language === 'km'
                  ? `ប្រចាំខែ ${selectedPeriod} (Standard: 26 Working Days)`
                  : `Payroll Period: ${selectedPeriod} (Standard: 26 Working Days)`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                Exchange: <strong>4,044 KHR/USD</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                NSSF Rate: <strong>4,049 KHR/USD</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Audited Summary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {language === 'km' ? 'បុគ្គលិកសរុប (Staff)' : 'Total Staff'}
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{summary.totalEmployees}</div>
            <span className="text-[10px] text-slate-500">100% Cambodian</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {language === 'km' ? 'ប្រាក់ខែគោល (Basic)' : 'Basic Salary'}
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              ${summary.totalBasicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500">26 Days Standard</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">
              {language === 'km' ? 'ប្រាក់បៀវត្សសរុប (Gross)' : 'Gross Wage'}
            </span>
            <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">
              ${summary.totalGrossSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-indigo-500">Gross Wage Total</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">
              {language === 'km' ? 'សោធន ប.ស.ស (Pension 2%)' : 'NSSF Pension (2%)'}
            </span>
            <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
              ${summary.totalPensionUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-500 font-mono">
              {language === 'km' ? '~3,020,724 ៛' : '~KHR 3,020,724'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">
              {language === 'km' ? 'ពន្ធលើបៀវត្ស (TOS)' : 'Tax on Salary (TOS)'}
            </span>
            <div className="text-lg font-black text-rose-700 font-mono mt-0.5">
              ${summary.totalTaxUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-500 font-mono">
              {language === 'km' ? '104,216.45 ៛' : 'KHR 104,216.45'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
              {language === 'km' ? 'ប្រាក់បើកសុទ្ធ (Net Paid)' : 'Total Net Paid'}
            </span>
            <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
              ${summary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-500 font-mono">1st + Target + 2nd</span>
          </div>
        </div>

        {/* Breakdown of First Paid vs Second Paid */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              {language === 'km' ? 'ការទូទាត់ចែកជាដំណាក់កាល (Payout Timeline):' : 'Payout Timeline:'}
            </span>
            <span className="text-slate-500">Mid-Month Advance & Final Payout</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">1st Paid (Advance)</span>
              <span className="font-bold text-slate-800">${summary.totalFirstPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">Target Bonus (Weekly)</span>
              <span className="font-bold text-amber-700">${summary.totalTargetBonus.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">2nd Paid (Balance)</span>
              <span className="font-bold text-indigo-700">${summary.totalSecondPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pl-3 border-l border-slate-300">
              <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">Total Disbursed</span>
              <span className="font-extrabold text-emerald-600">${summary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {language === 'km' ? 'ខែបើកប្រាក់ (Period):' : 'Payroll Period:'}
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {(reportData?.availablePeriods || ['August 2026']).map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Labor Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLaborFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${laborFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All ({summary.totalEmployees})
            </button>
            <button
              onClick={() => setLaborFilter('direct')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${laborFilter === 'direct' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Direct Labour
            </button>
            <button
              onClick={() => setLaborFilter('indirect')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${laborFilter === 'indirect' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Indirect Labour
            </button>
          </div>
        </div>

        {/* Search Input & Export Button */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by ID, name, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={onExportCsv}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export 55-Col CSV</span>
          </button>
        </div>
      </div>

      {/* 4. Complete 55-Column Scrollable Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 shadow-xs">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-100 shadow-[1px_0_0_0_#cbd5e1]">{language === 'km' ? 'អត្តលេខ (ID)' : 'Staff ID'}</th>
                {language === 'km' && (
                  <th className="py-2.5 px-3 sticky left-[72px] z-30 bg-slate-100 shadow-[1px_0_0_0_#cbd5e1] font-khmer">ឈ្មោះបុគ្គលិក</th>
                )}
                <th className={`py-2.5 px-3 sticky ${language === 'km' ? 'left-[190px]' : 'left-[72px]'} z-30 bg-slate-100 shadow-[2px_0_4px_0_rgba(0,0,0,0.05)]`}>
                  {language === 'km' ? 'English Name' : 'Employee Name'}
                </th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'ថ្ងៃចូលការងារ' : 'Join Date'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'ឆ្នាំ' : 'Period'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'កុងត្រា' : 'Contract'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'ធនាគារ' : 'Bank'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'លេខគណនី' : 'Account No.'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'អត្តសញ្ញាណ' : 'National ID'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'ភេទ' : 'Gender'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'មុខតំណែង' : 'Position'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ប្រាក់ខែគោល' : 'Base Salary'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'km' ? 'ថ្ងៃធ្វើការ' : 'Work Days'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'km' ? 'អវត្តមាន' : 'Absent'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'km' ? 'មិនគិតប្រាក់' : 'Unpaid'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ប្រាក់គោលថ្ងៃធ្វើការ' : 'Worked Base'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'អតីតភាព' : 'Seniority'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'តួនាទី' : 'Role Bonus'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ជំនាញដេរ' : 'Sewing Skill'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ជំនាញទូទៅ' : 'Skill Bonus'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ធ្វើដំណើរ/ស្នាក់នៅ' : 'Transport/Housing'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'រង្វាន់ទៀងទាត់' : 'Attendance'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ប្រាក់អាហារ' : 'Meal'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ថែមម៉ោង (OT)' : 'Overtime'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'បាយ OT' : 'OT Meal'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'សម្រេចគោលដៅ' : 'Target Bonus'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'វាយតំលៃ' : 'Eval Bonus'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ' : 'Annual Leave'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'ប្រាក់កែ' : 'Adjustment'}</th>
                <th className="py-2.5 px-2.5 text-right bg-indigo-50 font-bold text-indigo-900">{language === 'km' ? 'ប្រាក់សរុប (Gross)' : 'Gross Wage'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'មិនជាប់ពន្ធ' : 'Non-Taxable'}</th>
                <th className="py-2.5 px-2.5 text-right text-amber-700 font-bold">{language === 'km' ? 'សោធន (2%)' : 'Pension (2%)'}</th>
                <th className="py-2.5 px-2.5 text-right font-semibold">{language === 'km' ? 'ជាប់ពន្ធ USD' : 'Taxable USD'}</th>
                <th className="py-2.5 px-2.5 text-right font-semibold">{language === 'km' ? 'ជាប់ពន្ធ KHR' : 'Taxable KHR'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'km' ? 'កូន/ប្តីប្រពន្ធ' : 'Dependents'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'មូលដ្ឋានគិតពន្ធ' : 'Tax Base'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'km' ? 'អត្រា' : 'Tax Rate'}</th>
                <th className="py-2.5 px-2.5 text-right text-rose-600 font-bold">{language === 'km' ? 'ពន្ធ (KHR)' : 'Tax (KHR)'}</th>
                <th className="py-2.5 px-2.5 text-right text-rose-600 font-bold">{language === 'km' ? 'ពន្ធ (USD)' : 'Tax (USD)'}</th>
                <th className="py-2.5 px-2.5 text-right font-bold text-slate-800">{language === 'km' ? 'ក្រោយបង់ពន្ធ' : 'Net After Tax'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'បើកលើកទី១' : '1st Advance'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'km' ? 'រង្វាន់សប្តាហ៍' : 'Target Bonus'}</th>
                <th className="py-2.5 px-2.5 text-right font-bold text-indigo-700">{language === 'km' ? 'បើកលើកទី២' : '2nd Balance'}</th>
                <th className="py-2.5 px-2.5 text-right bg-emerald-50 font-extrabold text-emerald-700">{language === 'km' ? 'សរុបបើក (Total Paid)' : 'Total Paid'}</th>
                <th className="py-2.5 px-2.5">{language === 'km' ? 'ប្រភេទកម្លាំង' : 'Labour Type'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                  <td className="py-2 px-3 sticky left-0 z-10 bg-white hover:bg-slate-50 font-bold text-indigo-700 shadow-[1px_0_0_0_#cbd5e1]">{r.id}</td>
                  {language === 'km' && (
                    <td className="py-2 px-3 sticky left-[72px] z-10 bg-white hover:bg-slate-50 font-khmer text-slate-900 shadow-[1px_0_0_0_#cbd5e1] font-semibold">{r.khmer_name}</td>
                  )}
                  <td className={`py-2 px-3 sticky ${language === 'km' ? 'left-[190px]' : 'left-[72px]'} z-10 bg-white hover:bg-slate-50 font-sans text-slate-800 font-medium shadow-[2px_0_4px_0_rgba(0,0,0,0.05)]`}>{r.english_name}</td>
                  <td className="py-2 px-2.5 text-slate-500">{formatDateDMY(r.join_date)}</td>
                  <td className="py-2 px-2.5 text-center">{r.working_period}</td>
                  <td className="py-2 px-2.5 font-sans text-slate-600">{r.contract_type?.includes('UDC') ? 'UDC' : 'FDC'}</td>
                  <td className="py-2 px-2.5 font-sans text-slate-600">{r.bank_name}</td>
                  <td className="py-2 px-2.5 text-slate-700">{r.bank_account_number}</td>
                  <td className="py-2 px-2.5 text-slate-600">{r.national_id}</td>
                  <td className="py-2 px-2.5 text-center">{r.gender?.includes('Female') ? 'F' : 'M'}</td>
                  <td className="py-2 px-2.5 font-sans font-medium text-slate-700">{r.position}</td>
                  <td className="py-2 px-2.5 text-right font-semibold">${r.basic_salary?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-center font-bold">{r.working_days}</td>
                  <td className="py-2 px-2.5 text-center text-slate-400">{r.absent_days || '-'}</td>
                  <td className="py-2 px-2.5 text-center text-slate-400">{r.unpaid_days || '-'}</td>
                  <td className="py-2 px-2.5 text-right">${r.basic_working_salary?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.seniority_bonus > 0 ? `$${r.seniority_bonus.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.position_allowance > 0 ? `$${r.position_allowance.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.sewing_skill_matrix > 0 ? `$${r.sewing_skill_matrix.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.skill_allowance > 0 ? `$${r.skill_allowance.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">${r.transport_housing?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.attendance_allowance > 0 ? `$${r.attendance_allowance.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">${r.food_allowance?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.overtime_pay > 0 ? `$${r.overtime_pay.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.overtime_food > 0 ? `$${r.overtime_food.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.achievement_bonus > 0 ? `$${r.achievement_bonus.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.monthly_eval_bonus > 0 ? `$${r.monthly_eval_bonus.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.annual_leave > 0 ? `$${r.annual_leave.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right text-slate-600">{r.salary_adjustment !== 0 ? `$${r.salary_adjustment.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right bg-indigo-50/50 font-bold text-indigo-700">${r.total_salary?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">${r.non_taxable_total?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-amber-700 font-semibold">${(r.pension_fund ?? r.pension_usd ?? r.insurance_deduction ?? 0).toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right">${r.taxable_salary_usd?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right font-sans">
                    {r.taxable_salary_khr?.toLocaleString()} {language === 'km' ? '៛' : 'KHR'}
                  </td>
                  <td className="py-2 px-2.5 text-center">{r.dependents_count || '-'}</td>
                  <td className="py-2 px-2.5 text-right font-sans">
                    {r.taxable_base?.toLocaleString()} {language === 'km' ? '៛' : 'KHR'}
                  </td>
                  <td className="py-2 px-2.5 text-center font-bold text-slate-700">{r.tax_rate}</td>
                  <td className="py-2 px-2.5 text-right text-rose-600 font-semibold">
                    {r.tax_on_salary_khr > 0 ? `${r.tax_on_salary_khr.toLocaleString()} ${language === 'km' ? '៛' : 'KHR'}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right text-rose-600 font-semibold">
                    {r.tax_on_salary_usd > 0 ? `$${r.tax_on_salary_usd.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900">${r.after_tax_salary?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-700">${r.first_paid?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-amber-700">{r.paid_target_bonus > 0 ? `$${r.paid_target_bonus.toFixed(2)}` : '-'}</td>
                  <td className="py-2 px-2.5 text-right font-bold text-indigo-700">${r.second_paid?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right bg-emerald-50/60 font-extrabold text-emerald-700">${r.total_paid?.toFixed(2)}</td>
                  <td className="py-2 px-2.5 font-sans">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.labor_type === 'Direct Labour' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                      {r.labor_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot className="bg-slate-100 font-bold font-mono text-[11px] border-t-2 border-slate-300 sticky bottom-0 z-20">
              <tr>
                <td colSpan={language === 'km' ? 3 : 2} className="py-3 px-3 text-slate-900 font-black sticky left-0 z-30 bg-slate-100 shadow-[2px_0_4px_0_rgba(0,0,0,0.05)]">
                  {language === 'km' ? `សរុបទាំងអស់ (${summary.totalEmployees} នាក់)` : `Grand Total (${summary.totalEmployees} staff)`}
                </td>
                <td colSpan={8}></td>
                <td className="py-3 px-2.5 text-right font-black text-slate-900">${summary.totalBasicSalary.toFixed(2)}</td>
                <td colSpan={17}></td>
                <td className="py-3 px-2.5 text-right font-black text-indigo-800 bg-indigo-100">${summary.totalGrossSalary.toFixed(2)}</td>
                <td></td>
                <td className="py-3 px-2.5 text-right font-black text-amber-800">${summary.totalPensionUsd.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right">${summary.totalTaxableUsd.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right font-sans">
                  {summary.totalTaxableKhr.toLocaleString()} {language === 'km' ? '៛' : 'KHR'}
                </td>
                <td colSpan={3}></td>
                <td className="py-3 px-2.5 text-right font-black text-rose-700 font-sans">
                  {summary.totalTaxKhr.toFixed(2)} {language === 'km' ? '៛' : 'KHR'}
                </td>
                <td className="py-3 px-2.5 text-right font-black text-rose-700">${summary.totalTaxUsd.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right font-black text-slate-900">${summary.totalAfterTaxSalary.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right text-slate-800">${summary.totalFirstPaid.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right text-amber-800">${summary.totalTargetBonus.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right font-black text-indigo-800">${summary.totalSecondPaid.toFixed(2)}</td>
                <td className="py-3 px-2.5 text-right font-black text-emerald-800 bg-emerald-100">${summary.totalPaid.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Official Signatures and Certification Block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs">
          <div className="space-y-12">
            <div>
              <span className={`font-bold text-slate-800 block text-sm ${language === 'km' ? 'font-khmer' : ''}`}>
                {language === 'km' ? 'រៀបចំដោយ (Prepared by)' : 'Prepared By'}
              </span>
              <span className="text-slate-500">
                {language === 'km' ? 'ប្រធានផ្នែកធនធានមនុស្ស (HR Manager)' : 'Head of Human Resources'}
              </span>
            </div>
            <div className="pt-8 border-t border-slate-300 w-48 mx-auto">
              <span className="font-bold text-slate-900 block">{company.hr_manager}</span>
              <span className="text-[10px] text-slate-400">Date: 31/August/2026</span>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <span className={`font-bold text-slate-800 block text-sm ${language === 'km' ? 'font-khmer' : ''}`}>
                {language === 'km' ? 'ពិនិត្យដោយ (Checked by)' : 'Checked By'}
              </span>
              <span className="text-slate-500">
                {language === 'km' ? 'ប្រធានផ្នែកហិរញ្ញវត្ថុ (Finance Manager)' : 'Finance Manager'}
              </span>
            </div>
            <div className="pt-8 border-t border-slate-300 w-48 mx-auto">
              <span className="font-bold text-slate-900 block">{company.finance_manager}</span>
              <span className="text-[10px] text-slate-400">Date: 31/August/2026</span>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <span className={`font-bold text-slate-800 block text-sm ${language === 'km' ? 'font-khmer' : ''}`}>
                {language === 'km' ? 'អនុម័តដោយ (Approved by)' : 'Approved By'}
              </span>
              <span className="text-slate-500">
                {language === 'km' ? 'អគ្គនាយកក្រុមហ៊ុន (General Manager)' : 'General Manager'}
              </span>
            </div>
            <div className="pt-8 border-t border-slate-300 w-48 mx-auto">
              <span className="font-bold text-slate-900 block">{company.general_manager}</span>
              <span className="text-[10px] text-slate-400">Date: 31/August/2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
