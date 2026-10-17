'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Users,
  Award,
} from 'lucide-react';
import { AttendanceStatusCode, MonthlyEmployeeAttendance, MonthlyAttendanceReport } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';

export default function MonthlyAttendanceCalendar() {
  const { showToast, language } = useApp();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const m = p.get('month');
      if (m) {
        const parsed = parseInt(m.includes('-') ? m.split('-')[1] : m, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
      }
    }
    return 8; // Default to August 2026 (matching official factory payroll dataset)
  });
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyAttendanceReport | null>(null);

  // Cell editing popover state
  const [activeCell, setActiveCell] = useState<{
    employee_id: string;
    employee_name: string;
    date: string;
    dayNumber: number;
    currentCode: string;
  } | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', String(year));
      params.append('month', String(month));
      if (selectedDept !== 'all') params.append('department', selectedDept);
      if (selectedGroup !== 'all') params.append('group', selectedGroup);
      if (searchQuery.trim()) params.append('employee', searchQuery.trim());

      const res = await fetch(`/api/attendance/calendar?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch calendar');
      setReport(data);
    } catch (err: any) {
      console.error('Error loading calendar:', err);
      showToast(err.message || 'Error loading attendance calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month, selectedDept, selectedGroup, searchQuery]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const isSunday = date.getDay() === 0;
      arr.push({
        dayNumber: d,
        dayStr: String(d).padStart(2, '0'),
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isSunday,
        dayName: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }
    return arr;
  }, [year, month, daysInMonth]);

  const handleCellClick = (emp: MonthlyEmployeeAttendance, day: { dayNumber: number; dateStr: string }) => {
    const currentCode = emp.days[String(day.dayNumber).padStart(2, '0')] || 'OFF';
    setActiveCell({
      employee_id: emp.employee_id,
      employee_name: emp.khmer_name || emp.employee_name,
      date: day.dateStr,
      dayNumber: day.dayNumber,
      currentCode,
    });
  };

  const handleUpdateCode = async (newCode: string) => {
    if (!activeCell) return;
    try {
      const res = await fetch('/api/attendance/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: activeCell.employee_id,
          date: activeCell.date,
          code: newCode,
        }),
      });
      if (!res.ok) throw new Error('Failed to update code');

      showToast(
        language === 'km'
          ? `បានកែសម្រួលកូដវត្តមាន ${newCode} សម្រាប់ ${activeCell.employee_name}`
          : `Updated attendance code to ${newCode} for ${activeCell.employee_name}`,
        'success'
      );
      setActiveCell(null);
      fetchReport();
    } catch (err: any) {
      showToast(err.message || 'Error updating cell', 'error');
    }
  };

  const getCodeBadge = (code: string) => {
    const codeStyles: Record<string, { bg: string; text: string; border: string }> = {
      '1': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
      '0.5': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      AB: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300 font-bold' },
      AL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      ML: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      HL: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      SL: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
      OL: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      OFF: { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' },
    };

    const s = codeStyles[code] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border} shadow-2xs transition-transform hover:scale-110`}
      >
        {code}
      </span>
    );
  };

  const handleExportCsv = () => {
    if (!report) return;
    const headerCols = [
      'Emp ID',
      'Khmer Name',
      'English Name',
      'Department',
      'Group',
      'Classification',
      ...daysArray.map((d) => `Day ${d.dayNumber}`),
      'Scheduled',
      'Actual',
      'Present',
      'Absent',
      'AL',
      'SL',
      'Hours',
      'Non-Absent Bonus ($15)',
    ];

    const rows = report.employees.map((e) => [
      e.employee_id,
      `"${e.khmer_name || ''}"`,
      `"${e.employee_name}"`,
      `"${e.department_name}"`,
      `"${e.group_name}"`,
      `"${e.labor_type}"`,
      ...daysArray.map((d) => e.days[d.dayStr] || 'OFF'),
      e.scheduled_working_days,
      e.actual_working_days,
      e.present_days,
      e.absent_days,
      e.annual_leave_days,
      e.sick_leave_days,
      e.total_work_hours,
      e.is_non_absent_bonus_eligible ? 'ELIGIBLE ($15)' : 'INELIGIBLE ($0)',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headerCols.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `HESTRA-Monthly-Attendance-${year}-${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      language === 'km' ? 'បានទាញយកតារាងវត្តមានប្រចាំខែជា CSV រួចរាល់! ✓' : 'Monthly Attendance CSV exported! ✓',
      'success'
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Year Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Month Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { m: 8, y: 2026, label: language === 'km' ? 'សីហា ២០២៦ (Aug)' : 'Aug 2026' },
              { m: 9, y: 2026, label: language === 'km' ? 'កញ្ញា ២០២៦ (Sep)' : 'Sep 2026' },
              { m: 10, y: 2026, label: language === 'km' ? 'តុលា ២០២៦ (Oct)' : 'Oct 2026' },
            ].map((item) => (
              <button
                key={`${item.y}-${item.m}`}
                onClick={() => {
                  setMonth(item.m);
                  setYear(item.y);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  month === item.m && year === item.y
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់ (All Depts)' : 'All Departments'}</option>
            {report?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {formatLocalizedText(d.name, language)}
              </option>
            ))}
          </select>

          {/* Factory Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-indigo-700 bg-indigo-50/50"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ក្រុមទាំងអស់ (All Groups)' : 'All Groups'}</option>
            <option value="none">{language === 'km' ? 'មិនមានខ្សែ / ទូទៅ (No Line / General)' : 'No Line / General Staff'}</option>
            {report?.groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'km' ? 'ស្វែងរកតាម ID ឬ ឈ្មោះ...' : 'Search ID, name...'}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 w-44 focus:w-56 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            <span>{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Employees'}
              </p>
              <h4 className="text-lg font-black text-slate-900">{report.summary.total_staff}</h4>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'វត្តមានមធ្យម' : 'Avg Present Days'}
              </p>
              <h4 className="text-lg font-black text-emerald-600">
                {report.summary.avg_present_days} / {report.scheduled_working_days}
              </h4>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'អវត្តមានសរុប (AB)' : 'Total Absent Days'}
              </p>
              <h4 className="text-lg font-black text-rose-600">{report.summary.total_absent_days}</h4>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ (AL)' : 'Annual Leave Days'}
              </p>
              <h4 className="text-lg font-black text-indigo-600">{report.summary.total_al_days}</h4>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'បុព្វលាភមិនអវត្តមាន' : 'Non-Absent Eligible'}
              </p>
              <h4 className="text-lg font-black text-amber-600">
                {report.employees.filter((e) => e.is_non_absent_bonus_eligible).length} / {report.employees.length}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Monthly 01-31 Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] relative scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-bold text-slate-700 sticky left-0 z-30 bg-slate-50 min-w-[70px] border-r border-slate-200">
                  ID
                </th>
                {language === 'km' && (
                  <th className="p-2.5 font-bold text-slate-700 sticky left-[70px] z-30 bg-slate-50 min-w-[120px] border-r border-slate-200 font-khmer">
                    ឈ្មោះខ្មែរ
                  </th>
                )}
                <th className={`p-2.5 font-bold text-slate-700 min-w-[130px] border-r border-slate-200 ${language === 'km' ? '' : 'sticky left-[70px] z-30 bg-slate-50'}`}>
                  {language === 'km' ? 'Name (EN)' : 'Employee Name'}
                </th>
                <th className="p-2.5 font-bold text-slate-700 min-w-[90px] border-r border-slate-200">
                  Group
                </th>
                <th className="p-2.5 font-bold text-slate-700 min-w-[100px] border-r border-slate-200">
                  Labor Type
                </th>

                {/* Day 01..31 Columns */}
                {daysArray.map((d) => (
                  <th
                    key={d.dayNumber}
                    className={`p-1.5 text-center min-w-[34px] border-r border-slate-200 ${
                      d.isSunday ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] uppercase">{d.dayName}</div>
                    <div className="text-xs font-bold">{d.dayStr}</div>
                  </th>
                ))}

                {/* Computed Columns */}
                <th className="p-2.5 text-center font-bold text-slate-800 bg-slate-100 min-w-[65px] border-r border-slate-200">
                  Sched
                </th>
                <th className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50 min-w-[65px] border-r border-slate-200">
                  Actual
                </th>
                <th className="p-2.5 text-center font-bold text-rose-800 bg-rose-50 min-w-[55px] border-r border-slate-200">
                  AB
                </th>
                <th className="p-2.5 text-center font-bold text-blue-800 bg-blue-50 min-w-[55px] border-r border-slate-200">
                  AL
                </th>
                <th className="p-2.5 text-center font-bold text-amber-800 bg-amber-50 min-w-[110px]">
                  Bonus ($15)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth + (language === 'km' ? 11 : 10)} className="p-12 text-center text-slate-500">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    {language === 'km' ? 'កំពុងទាញយកទិន្នន័យតារាងវត្តមាន...' : 'Loading monthly attendance matrix...'}
                  </td>
                </tr>
              ) : !report || report.employees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + (language === 'km' ? 11 : 10)} className="p-8 text-center text-slate-400">
                    {language === 'km' ? 'រកមិនឃើញទិន្នន័យបុគ្គលិកឡើយ' : 'No employee attendance records found'}
                  </td>
                </tr>
              ) : (
                report.employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Fixed Columns */}
                    <td className="p-2 font-mono text-[11px] font-bold text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-100">
                      {emp.employee_id}
                    </td>
                    {language === 'km' && (
                      <td className="p-2 font-khmer text-slate-800 sticky left-[70px] z-10 bg-white border-r border-slate-100 truncate max-w-[130px]">
                        {emp.khmer_name || '--'}
                      </td>
                    )}
                    <td className={`p-2 font-medium text-slate-900 border-r border-slate-100 truncate max-w-[140px] ${language === 'km' ? '' : 'sticky left-[70px] z-10 bg-white'}`}>
                      {emp.employee_name}
                    </td>
                    <td className="p-2 text-slate-600 border-r border-slate-100 font-semibold">
                      {emp.group_name ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                          {emp.group_name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[11px] italic">
                          {language === 'km' ? 'មិនមានខ្សែ' : 'No Line'}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-slate-500 text-[11px] border-r border-slate-100">
                      {emp.labor_type}
                    </td>

                    {/* Matrix Cells */}
                    {daysArray.map((d) => {
                      const code = emp.days[d.dayStr] || 'OFF';
                      return (
                        <td
                          key={d.dayNumber}
                          onClick={() => handleCellClick(emp, d)}
                          className={`p-1 text-center border-r border-slate-100 cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-inset ${
                            d.isSunday ? 'bg-slate-50/40' : ''
                          }`}
                          title={`Click to edit Day ${d.dayNumber} (${code})`}
                        >
                          {getCodeBadge(code)}
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td className="p-2 text-center font-bold text-slate-700 bg-slate-50/50 border-r border-slate-100">
                      {emp.scheduled_working_days}
                    </td>
                    <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-slate-100">
                      {emp.actual_working_days}
                    </td>
                    <td
                      className={`p-2 text-center font-bold border-r border-slate-100 ${
                        emp.absent_days > 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400'
                      }`}
                    >
                      {emp.absent_days}
                    </td>
                    <td
                      className={`p-2 text-center font-bold border-r border-slate-100 ${
                        emp.annual_leave_days > 0 ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'
                      }`}
                    >
                      {emp.annual_leave_days}
                    </td>
                    <td className="p-2 text-center">
                      {emp.is_non_absent_bonus_eligible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> +$15.00
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle size={11} /> $0.00
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Edit Modal / Popover */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'កែសម្រួលស្ថានភាពវត្តមាន' : 'Edit Attendance Status'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeCell.employee_name} ({activeCell.employee_id}) — {activeCell.date}
                </p>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'km'
                ? 'ជ្រើសរើសកូដវត្តមានដើម្បីធ្វើបច្ចុប្បន្នភាពកត់ត្រា៖'
                : 'Select status code to update attendance record:'}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { code: '1', label: language === 'km' ? '1 - វត្តមានពេញ (8h)' : '1 - Present (8h)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                { code: '0.5', label: language === 'km' ? '0.5 - កន្លះថ្ងៃ (4h)' : '0.5 - Half Day (4h)', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                { code: 'AB', label: language === 'km' ? 'AB - អវត្តមាន (Unpaid)' : 'AB - Absent (Unpaid)', color: 'bg-rose-50 text-rose-800 border-rose-300' },
                { code: 'AL', label: language === 'km' ? 'AL - ច្បាប់ប្រចាំឆ្នាំ (8h)' : 'AL - Annual Leave (8h)', color: 'bg-blue-50 text-blue-800 border-blue-300' },
                { code: 'SL', label: language === 'km' ? 'SL - ច្បាប់ឈឺ (8h)' : 'SL - Sick Leave (8h)', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
                { code: 'ML', label: language === 'km' ? 'ML - លំហែមាតុភាព' : 'ML - Maternity Leave', color: 'bg-pink-50 text-pink-800 border-pink-300' },
                { code: 'HL', label: language === 'km' ? 'HL - បុណ្យជាតិ' : 'HL - Public Holiday', color: 'bg-purple-50 text-purple-800 border-purple-300' },
                { code: 'OL', label: language === 'km' ? 'OL - ច្បាប់ផ្សេងៗ' : 'OL - Other Leave', color: 'bg-orange-50 text-orange-800 border-orange-300' },
                { code: 'OFF', label: language === 'km' ? 'OFF - ថ្ងៃសម្រាក' : 'OFF - Rest Day', color: 'bg-slate-100 text-slate-700 border-slate-300' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleUpdateCode(item.code)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${item.color} ${
                    activeCell.currentCode === item.code ? 'ring-2 ring-slate-900 shadow-xs' : ''
                  }`}
                >
                  <span className="block text-base">{item.code}</span>
                  <span className="block text-[10px] font-medium mt-0.5 opacity-90">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveCell(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
