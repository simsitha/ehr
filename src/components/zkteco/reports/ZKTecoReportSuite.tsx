'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Clock,
  Layers,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  Filter,
  Building2,
  Server,
  RefreshCw,
  Sparkles,
  Shield,
  Search,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ZKTecoDailyReport from './ZKTecoDailyReport';
import ZKTecoWeeklyReport from './ZKTecoWeeklyReport';
import ZKTecoMonthlyReport from './ZKTecoMonthlyReport';
import ZKTecoSummaryReport from './ZKTecoSummaryReport';
import { formatLocalizedText } from '@/lib/translations';

export type ReportTab = 'daily' | 'weekly' | 'monthly' | 'summary';

interface DepartmentItem {
  id: string;
  name: string;
  employee_count?: number;
}

interface Props {
  initialTab?: ReportTab;
  embedded?: boolean; // If true, adjusts breadcrumbs/headers when rendered inside /attendance/zkteco
}

export default function ZKTecoReportSuite({ initialTab = 'daily', embedded = false }: Props) {
  const { language, showToast } = useApp();

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);

  // Common Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily Filters
  const [dailyDate, setDailyDate] = useState<string>('2026-10-16');
  const [dailyStatus, setDailyStatus] = useState<string>('all');

  // Weekly Filters (Monday to Sunday)
  const [weekStart, setWeekStart] = useState<string>('2026-10-12');
  const [weekEnd, setWeekEnd] = useState<string>('2026-10-18');

  // Monthly Filters
  const [monthYear, setMonthYear] = useState<number>(2026);
  const [monthNum, setMonthNum] = useState<number>(10);

  // Summary Filters
  const [summaryStart, setSummaryStart] = useState<string>('2026-10-01');
  const [summaryEnd, setSummaryEnd] = useState<string>('2026-10-16');

  // Report Data
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load departments once
  useEffect(() => {
    fetch('/api/departments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      })
      .catch((err) => console.error('Failed to load departments:', err));
  }, []);

  // Fetch report data on parameter changes
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      if (selectedDept && selectedDept !== 'all') {
        params.set('department', selectedDept);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      if (activeTab === 'daily') {
        params.set('date', dailyDate);
        if (dailyStatus !== 'all') params.set('status', dailyStatus);
        const res = await fetch(`/api/attendance/zkteco/reports?${params.toString()}`);
        if (res.ok) setDailyData(await res.json());
      } else if (activeTab === 'weekly') {
        params.set('weekStart', weekStart);
        params.set('weekEnd', weekEnd);
        const res = await fetch(`/api/attendance/zkteco/reports?${params.toString()}`);
        if (res.ok) setWeeklyData(await res.json());
      } else if (activeTab === 'monthly') {
        params.set('year', monthYear.toString());
        params.set('month', monthNum.toString());
        const res = await fetch(`/api/attendance/zkteco/reports?${params.toString()}`);
        if (res.ok) setMonthlyData(await res.json());
      } else if (activeTab === 'summary') {
        params.set('startDate', summaryStart);
        params.set('endDate', summaryEnd);
        const res = await fetch(`/api/attendance/zkteco/reports?${params.toString()}`);
        if (res.ok) setSummaryData(await res.json());
      }
    } catch (err: any) {
      console.error('Failed to fetch ZKTeco report:', err);
      showToast('Failed to load attendance report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    selectedDept,
    searchQuery,
    dailyDate,
    dailyStatus,
    weekStart,
    weekEnd,
    monthYear,
    monthNum,
    summaryStart,
    summaryEnd,
    showToast,
  ]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, refreshTrigger]);

  // Handle Export to CSV
  const handleExportCsv = () => {
    let filename = '';
    let csvRows: string[] = [];

    if (activeTab === 'daily') {
      filename = `HESTRA-ZKTeco-Daily-Report-${dailyDate}.csv`;
      const headers = [
        'AC-No (PIN)',
        'Employee ID',
        'Name',
        'Khmer Name',
        'Department',
        'Shift / Timetable',
        'Check-In',
        'Check-Out',
        'Late (Mins)',
        'Early (Mins)',
        'Work Hours',
        'OT Hours',
        'Status',
        'Terminal',
        'Verification Mode',
        'Notes',
      ];
      csvRows.push(headers.join(','));

      const records = dailyData?.records || [];
      records.forEach((r: any) => {
        csvRows.push([
          `"${r.pin}"`,
          `"${r.employee_id}"`,
          `"${r.employee_name.replace(/"/g, '""')}"`,
          `"${(r.khmer_name || '').replace(/"/g, '""')}"`,
          `"${r.department_name.replace(/"/g, '""')}"`,
          `"${r.shift_name} (${r.timetable_in}-${r.timetable_out})"`,
          `"${r.clock_in || '--'}"`,
          `"${r.clock_out || '--'}"`,
          r.late_minutes,
          r.early_minutes,
          r.work_hours,
          r.overtime_hours,
          `"${r.status}"`,
          `"${r.terminal_name}"`,
          `"${r.verification_method}"`,
          `"${(r.notes || '').replace(/"/g, '""')}"`,
        ].join(','));
      });
    } else if (activeTab === 'weekly') {
      filename = `HESTRA-ZKTeco-Weekly-Report-${weekStart}_to_${weekEnd}.csv`;
      const days = weeklyData?.days_header || [];
      const headers = [
        'AC-No (PIN)',
        'Employee ID',
        'Name',
        'Department',
        ...days.map((d: any) => `${d.day_name} (${d.date.slice(5)})`),
        'Work Days',
        'Work Hours',
        'OT Hours',
        'Late (Mins)',
      ];
      csvRows.push(headers.join(','));

      const records = weeklyData?.records || [];
      records.forEach((r: any) => {
        const dayCols = days.map((d: any) => {
          const punch = r.days?.[d.date];
          if (!punch) return '"--"';
          return `"${punch.clock_in || '--'} - ${punch.clock_out || '--'} [${punch.code || punch.status}]"`;
        });

        csvRows.push([
          `"${r.pin}"`,
          `"${r.employee_id}"`,
          `"${r.employee_name.replace(/"/g, '""')}"`,
          `"${r.department_name.replace(/"/g, '""')}"`,
          ...dayCols,
          r.total_work_days,
          r.total_work_hours,
          r.total_ot_hours,
          r.total_late_minutes,
        ].join(','));
      });
    } else if (activeTab === 'monthly') {
      filename = `HESTRA-ZKTeco-Monthly-Report-${monthYear}-${String(monthNum).padStart(2, '0')}.csv`;
      const days = monthlyData?.days_header || [];
      const headers = [
        'AC-No (PIN)',
        'Employee ID',
        'Name',
        'Department',
        ...days.map((d: any) => `D${d.day}`),
        'Scheduled Days',
        'Actual Days',
        'Work Hours',
        'OT Hours',
        'Late Count',
        'Absent Count',
      ];
      csvRows.push(headers.join(','));

      const records = monthlyData?.records || [];
      records.forEach((r: any) => {
        const dayCols = days.map((d: any) => {
          const cell = r.days?.[String(d.day)];
          return `"${cell ? cell.code : '--'}"`;
        });

        csvRows.push([
          `"${r.pin}"`,
          `"${r.employee_id}"`,
          `"${r.employee_name.replace(/"/g, '""')}"`,
          `"${r.department_name.replace(/"/g, '""')}"`,
          ...dayCols,
          r.scheduled_days,
          r.actual_days,
          r.total_work_hours,
          r.total_ot_hours,
          r.late_count,
          r.absent_count,
        ].join(','));
      });
    } else if (activeTab === 'summary') {
      filename = `HESTRA-ZKTeco-Summary-Report-${summaryStart}_to_${summaryEnd}.csv`;
      const headers = [
        'Department',
        'Headcount',
        'Expected Man-Days',
        'Present Man-Days',
        'Absent Man-Days',
        'Attendance Rate (%)',
        'Absent Rate (%)',
        'Work Hours',
        'OT Hours',
        'Late Instances',
        'Late Minutes',
        'Early Leave Instances',
      ];
      csvRows.push(headers.join(','));

      const depts = summaryData?.department_breakdown || [];
      depts.forEach((d: any) => {
        csvRows.push([
          `"${d.department_name.replace(/"/g, '""')}"`,
          d.headcount,
          d.expected_days,
          d.present_days,
          d.absent_days,
          `${d.attendance_rate}%`,
          `${d.absent_rate}%`,
          d.work_hours,
          d.ot_hours,
          d.late_count,
          d.late_minutes,
          d.early_count,
        ].join(','));
      });
    }

    if (csvRows.length === 0) {
      showToast('No data available to export', 'error');
      return;
    }

    // Add UTF-8 BOM so Excel decodes Khmer script correctly
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filename} successfully!`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Print-Only Formal Company Header & Document Title */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">HESTRA (CAMBODIA) CO., LTD.</h1>
            <h2 className="text-sm font-bold text-slate-800">ក្រុមហ៊ុន ហេស្រ្តា (ខេមបូឌា) ឯ.ក</h2>
            <p className="text-[11px] text-slate-600 mt-1">
              Royal Group Phnom Penh Special Economic Zone (PPSEZ), National Road 4, Sangkat Phleung Chheh Roteh, Khan Posenchey, Phnom Penh
            </p>
            <p className="text-[10px] text-slate-500">
              Tax ID / VATTIN: K009-902100456 | Registration: 00054321
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded uppercase tracking-wider">
              {activeTab === 'daily' && 'Daily Attendance Audit Report'}
              {activeTab === 'weekly' && 'Weekly Attendance Matrix Report'}
              {activeTab === 'monthly' && 'Monthly Time Card (Excel 10)'}
              {activeTab === 'summary' && 'Executive Attendance & Modality Summary'}
            </span>
            <p className="text-[10px] text-slate-600 mt-2 font-mono">
              Printed: {new Date().toLocaleString('en-GB')}
            </p>
            <p className="text-[10px] text-slate-600 font-mono">
              Terminal: ZKTeco SpeedFace-V5L (zk-01)
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between text-xs text-slate-700">
          <div>
            <span className="font-bold">Period / Date: </span>
            {activeTab === 'daily' && dailyDate}
            {activeTab === 'weekly' && `${weekStart} to ${weekEnd}`}
            {activeTab === 'monthly' && `${monthYear}-${String(monthNum).padStart(2, '0')}`}
            {activeTab === 'summary' && `${summaryStart} to ${summaryEnd}`}
          </div>
          <div>
            <span className="font-bold">Department: </span>
            {selectedDept === 'all'
              ? 'All Departments'
              : departments.find((d) => d.id === selectedDept)?.name || selectedDept}
          </div>
          <div>
            <span className="font-bold">Total Enrolled PINs: </span>159 Users (140 Active Staff)
          </div>
        </div>

        <div className="mt-1 pt-1 border-t border-slate-200 flex justify-between text-[11px] text-slate-600 font-mono">
          <div>
            <span className="font-bold font-sans">Official Timetable: </span>
            Morning (AM): 07:30 - 11:30 | Lunch: 11:30 - 12:30 | Afternoon (PM): 12:30 - 16:30
          </div>
          <div>
            <span className="font-bold font-sans">Normal Work: </span>8.0 Hours/Day (Grace Period: 10m)
          </div>
        </div>
      </div>

      {/* Screen Header (Hidden during Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {!embedded && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Link href="/attendance" className="hover:text-indigo-600 transition-colors">
                {language === 'km' ? 'វត្តមាន' : 'Attendance'}
              </Link>
              <ChevronRight size={13} />
              <Link href="/attendance/zkteco" className="hover:text-indigo-600 transition-colors">
                ZKTeco Biometrics
              </Link>
              <ChevronRight size={13} />
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {language === 'km' ? 'របាយការណ៍វត្តមានផ្លូវការ' : 'Official Attendance Reports'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'km' ? 'របាយការណ៍វត្តមាន ZKTeco' : 'ZKTeco Attendance Reports'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  ZKTime.Net Style
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'របាយការណ៍ម៉ោងធ្វើការ វត្តមាន មកយឺត ចេញមុន និងថែមម៉ោង តាមស្តង់ដារ ZKTeco / BioTime'
                  : 'Authentic ZKTeco BioTime / ZKTime.Net style daily, weekly, monthly and executive summary reports'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar: Department, Export CSV, Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Selector */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-8 pr-7 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">
                {language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់ (All Depts)' : 'All Departments (140 Staff)'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatLocalizedText(d.name, language)} {d.employee_count !== undefined ? `(${d.employee_count})` : ''}
                </option>
              ))}
            </select>
            <Building2
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => setRefreshTrigger((k) => k + 1)}
            disabled={loading}
            className="btn-press p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Official Document"
          >
            <Printer size={15} className="text-slate-500" />
            <span>{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCsv}
            className="btn-press px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to CSV (Excel compatible with UTF-8 BOM)"
          >
            <Download size={15} />
            <span>{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Screen only) */}
      <div className="print:hidden p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock size={15} className={activeTab === 'daily' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>{language === 'km' ? '១. របាយការណ៍ប្រចាំថ្ងៃ' : '1. Daily Punch Audit'}</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'weekly'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar size={15} className={activeTab === 'weekly' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>{language === 'km' ? '២. របាយការណ៍ប្រចាំសប្តាហ៍' : '2. Weekly Matrix'}</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={15} className={activeTab === 'monthly' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>{language === 'km' ? '៣. របាយការណ៍ប្រចាំខែ (Excel 10)' : '3. Monthly Time Card'}</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp size={15} className={activeTab === 'summary' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>{language === 'km' ? '៤. របាយការណ៍សង្ខេប & KPIs' : '4. Executive Summary'}</span>
        </button>
      </div>

      {/* Active Tab Content Panel */}
      <div>
        {activeTab === 'daily' && (
          <ZKTecoDailyReport
            data={dailyData}
            loading={loading}
            date={dailyDate}
            onDateChange={setDailyDate}
            statusFilter={dailyStatus}
            onStatusFilterChange={setDailyStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={language}
          />
        )}

        {activeTab === 'weekly' && (
          <ZKTecoWeeklyReport
            data={weeklyData}
            loading={loading}
            weekStart={weekStart}
            weekEnd={weekEnd}
            onWeekChange={(s, e) => {
              setWeekStart(s);
              setWeekEnd(e);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={language}
          />
        )}

        {activeTab === 'monthly' && (
          <ZKTecoMonthlyReport
            data={monthlyData}
            loading={loading}
            year={monthYear}
            month={monthNum}
            onMonthChange={(y, m) => {
              setMonthYear(y);
              setMonthNum(m);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={language}
          />
        )}

        {activeTab === 'summary' && (
          <ZKTecoSummaryReport
            data={summaryData}
            loading={loading}
            startDate={summaryStart}
            endDate={summaryEnd}
            onRangeChange={(s, e) => {
              setSummaryStart(s);
              setSummaryEnd(e);
            }}
            language={language}
          />
        )}
      </div>

      {/* Print-Only Signature Section */}
      <div className="hidden print:block mt-16 pt-6 border-t border-slate-400 page-break-inside-avoid">
        <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-800">
          <div>
            <p className="font-bold uppercase tracking-wider">Prepared By / រៀបចំដោយ</p>
            <p className="text-[10px] text-slate-500 mt-0.5">HR & Timekeeping Officer</p>
            <div className="h-20 border-b border-dashed border-slate-400 mt-2"></div>
            <p className="mt-2 font-mono text-[11px]">Signature & Date</p>
          </div>

          <div>
            <p className="font-bold uppercase tracking-wider">Checked By / ត្រួតពិនិត្យដោយ</p>
            <p className="text-[10px] text-slate-500 mt-0.5">HR & Administration Manager</p>
            <div className="h-20 border-b border-dashed border-slate-400 mt-2"></div>
            <p className="mt-2 font-mono text-[11px]">Signature & Date</p>
          </div>

          <div>
            <p className="font-bold uppercase tracking-wider">Approved By / អនុម័តដោយ</p>
            <p className="text-[10px] text-slate-500 mt-0.5">General Manager / Plant Director</p>
            <div className="h-20 border-b border-dashed border-slate-400 mt-2"></div>
            <p className="mt-2 font-mono text-[11px]">Signature & Date</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[9px] text-slate-400">
          HESTRA (CAMBODIA) CO., LTD. — CONFIDENTIAL INTERNAL DOCUMENT — AUTOMATICALLY AUDITED VIA ZKTECO SPEEDFACE-V5L BIOMETRIC CONTROLLER
        </div>
      </div>
    </div>
  );
}
