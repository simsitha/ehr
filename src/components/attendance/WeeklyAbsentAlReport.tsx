'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  Users,
  Download,
  Filter,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { WeeklyAbsentAlReportData } from '@/lib/types';

export default function WeeklyAbsentAlReport() {
  const { showToast, language } = useApp();

  const [weekStart, setWeekStart] = useState('2026-10-05');
  const [weekEnd, setWeekEnd] = useState('2026-10-11');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklyAbsentAlReportData | null>(null);

  const availableWeeks = [
    { label: 'Week 31: Aug 03 – Aug 09, 2026', start: '2026-08-03', end: '2026-08-09' },
    { label: 'Week 32: Aug 10 – Aug 16, 2026', start: '2026-08-10', end: '2026-08-16' },
    { label: 'Week 33: Aug 17 – Aug 23, 2026', start: '2026-08-17', end: '2026-08-23' },
    { label: 'Week 34: Aug 24 – Aug 30, 2026', start: '2026-08-24', end: '2026-08-30' },
    { label: 'Week 35: Aug 31 – Sep 06, 2026', start: '2026-08-31', end: '2026-09-06' },
    { label: 'Week 40: Oct 05 – Oct 11, 2026', start: '2026-10-05', end: '2026-10-11' },
    { label: 'Week 41: Oct 12 – Oct 18, 2026', start: '2026-10-12', end: '2026-10-18' },
    { label: 'Week 42: Oct 19 – Oct 25, 2026', start: '2026-10-19', end: '2026-10-25' },
    { label: 'Week 43: Oct 26 – Nov 01, 2026', start: '2026-10-26', end: '2026-11-01' },
  ];

  const fetchWeekly = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('weekStart', weekStart);
      params.append('weekEnd', weekEnd);
      if (selectedGroup !== 'all') params.append('group', selectedGroup);

      const res = await fetch(`/api/attendance/weekly?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load weekly report');
      setData(json);
    } catch (err: any) {
      console.error('Error fetching weekly report:', err);
      showToast(err.message || 'Error fetching weekly report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekly();
  }, [weekStart, weekEnd, selectedGroup]);

  const handleWeekChange = (val: string) => {
    const selected = availableWeeks.find((w) => w.start === val);
    if (selected) {
      setWeekStart(selected.start);
      setWeekEnd(selected.end);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headerCols = [
      'Group',
      'Emp ID',
      'Khmer Name',
      'Name',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
      'Present',
      'Absent',
      'AL',
      'Half',
      'Total Hours',
    ];

    const rows = data.employees.map((e) => {
      const dates = Object.keys(e.days).sort();
      return [
        `"${e.group_name}"`,
        e.employee_id,
        `"${e.khmer_name}"`,
        `"${e.employee_name}"`,
        ...dates.map((d) => e.days[d]?.code || 'OFF'),
        e.total_present,
        e.total_absent,
        e.total_al,
        e.total_half,
        e.total_hours,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headerCols.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `HESTRA-Weekly-Absent-AL-Report-${weekStart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      language === 'km' ? 'បានទាញយករបាយការណ៍ប្រចាំសប្តាហ៍ជា CSV រួចរាល់! ✓' : 'Weekly Absent/AL CSV exported! ✓',
      'success'
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            <select
              value={weekStart}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
            >
              {availableWeeks.map((w) => (
                <option key={w.start} value={w.start}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ក្រុមទាំងអស់ (All Groups)' : 'All Production Groups'}</option>
              <option value="none">{language === 'km' ? 'មិនមានខ្សែ / ទូទៅ (No Line / General)' : 'No Line / General Staff'}</option>
              {data?.group_summaries
                .filter((g) => g.group_name !== 'No Line / General')
                .map((g) => (
                  <option key={g.group_name} value={g.group_name}>
                    {g.group_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWeekly}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            <span>{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Grand Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Headcount'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{data.total_headcount}</span>
              <span className="text-xs text-slate-400">staff</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'km' ? 'អត្រាវត្តមានសរុប' : 'Overall Attendance Rate'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">{data.overall_attendance_rate}%</span>
              <span className="text-xs text-emerald-600 font-semibold">Factory Target: 98%</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'km' ? 'អវត្តមានសរុប (AB)' : 'Total Absent Days'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-600">{data.grand_total_absent}</span>
              <span className="text-xs text-slate-400">unexcused days</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ (AL)' : 'Total Annual Leave'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-600">{data.grand_total_al}</span>
              <span className="text-xs text-slate-400">approved days</span>
            </div>
          </div>
        </div>
      )}

      {/* Group Summaries Table (10.Absent + AL reporting weekly.xlsx header procedure) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            {language === 'km'
              ? 'ស្ថិតិសង្ខេបវត្តមានតាមក្រុមផលិតកម្ម (Factory Group Summaries)'
              : 'Factory Production Groups Summary Breakdown'}
          </h3>
          <span className="text-[11px] text-slate-500">
            {language === 'km' ? 'យោងតាមឯកសារ 10.Absent + AL reporting weekly' : 'Procedure from 10.Absent + AL reporting weekly.xlsx'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-2.5 font-bold">Group / Line</th>
                <th className="p-2.5 text-center font-bold">Headcount</th>
                <th className="p-2.5 text-center font-bold text-emerald-700">Present Days</th>
                <th className="p-2.5 text-center font-bold text-rose-700">Absent (AB)</th>
                <th className="p-2.5 text-center font-bold text-blue-700">Annual Leave (AL)</th>
                <th className="p-2.5 text-center font-bold text-amber-700">Half Days</th>
                <th className="p-2.5 text-center font-bold text-indigo-700">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading group summaries...
                  </td>
                </tr>
              ) : (
                data?.group_summaries.map((g) => (
                  <tr key={g.group_name} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${g.group_name === 'No Line / General' ? 'bg-slate-400' : 'bg-indigo-500'}`} />
                      {g.group_name === 'No Line / General' ? (
                        <span className="font-medium text-slate-600">
                          {language === 'km' ? 'មិនមានខ្សែ / ទូទៅ (No Line / General)' : 'No Line / General Staff'}
                        </span>
                      ) : (
                        g.group_name
                      )}
                    </td>
                    <td className="p-2.5 text-center font-semibold text-slate-700">{g.headcount}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">{g.total_present}</td>
                    <td
                      className={`p-2.5 text-center font-bold ${
                        g.total_absent > 0 ? 'text-rose-600 bg-rose-50/40' : 'text-slate-400'
                      }`}
                    >
                      {g.total_absent}
                    </td>
                    <td
                      className={`p-2.5 text-center font-bold ${
                        g.total_al > 0 ? 'text-blue-600 bg-blue-50/40' : 'text-slate-400'
                      }`}
                    >
                      {g.total_al}
                    </td>
                    <td className="p-2.5 text-center text-amber-700 font-semibold">{g.total_half}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          g.attendance_rate >= 98
                            ? 'bg-emerald-100 text-emerald-800'
                            : g.attendance_rate >= 95
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {g.attendance_rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detailed Matrix (Mon-Sun) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">
            {language === 'km' ? 'បញ្ជីវត្តមានលម្អិតប្រចាំសប្តាហ៍បុគ្គលិកម្នាក់ៗ' : 'Individual Employee Weekly Roster & Output'}
          </h3>
          <span className="text-[11px] text-slate-500">
            {data?.employees.length || 0} employees listed
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-2.5 font-bold">Group</th>
                <th className="p-2.5 font-bold">Emp ID</th>
                {language === 'km' && <th className="p-2.5 font-bold font-khmer">ឈ្មោះខ្មែរ</th>}
                <th className="p-2.5 font-bold">{language === 'km' ? 'Name (EN)' : 'Employee Name'}</th>
                <th className="p-2 text-center font-bold">Mon</th>
                <th className="p-2 text-center font-bold">Tue</th>
                <th className="p-2 text-center font-bold">Wed</th>
                <th className="p-2 text-center font-bold">Thu</th>
                <th className="p-2 text-center font-bold">Fri</th>
                <th className="p-2 text-center font-bold">Sat</th>
                <th className="p-2 text-center font-bold text-rose-700 bg-rose-50/70">Sun</th>
                <th className="p-2 text-center font-bold text-emerald-800 bg-emerald-50">Present</th>
                <th className="p-2 text-center font-bold text-rose-800 bg-rose-50">Absent</th>
                <th className="p-2 text-center font-bold text-blue-800 bg-blue-50">AL</th>
                <th className="p-2 text-center font-bold text-slate-700">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.employees.map((emp) => {
                const dates = Object.keys(emp.days).sort();
                return (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/70">
                    <td className="p-2 font-semibold text-slate-700">
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
                    <td className="p-2 font-mono text-[11px] font-bold text-slate-900">{emp.employee_id}</td>
                    {language === 'km' && (
                      <td className="p-2 font-khmer text-slate-800 truncate max-w-[120px]">
                        {emp.khmer_name || '--'}
                      </td>
                    )}
                    <td className="p-2 font-medium text-slate-900 truncate max-w-[130px]">
                      {emp.employee_name}
                    </td>

                    {dates.map((dStr, idx) => {
                      const day = emp.days[dStr];
                      const isSun = idx === 6;
                      const code = day?.code || (isSun ? 'OFF' : '1');
                      const isAbsent = code === 'AB';
                      const isAl = code === 'AL';
                      const isHalf = code === '0.5';

                      return (
                        <td
                          key={dStr}
                          className={`p-1.5 text-center border-l border-slate-100 ${
                            isSun ? 'bg-slate-50/50' : ''
                          }`}
                        >
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              code === '1'
                                ? 'bg-emerald-50 text-emerald-700'
                                : isAbsent
                                ? 'bg-rose-100 text-rose-800 font-black'
                                : isAl
                                ? 'bg-blue-100 text-blue-800'
                                : isHalf
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {code}
                          </span>
                        </td>
                      );
                    })}

                    <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {emp.total_present}
                    </td>
                    <td
                      className={`p-2 text-center font-bold ${
                        emp.total_absent > 0 ? 'text-rose-600 bg-rose-50/40' : 'text-slate-400'
                      }`}
                    >
                      {emp.total_absent}
                    </td>
                    <td
                      className={`p-2 text-center font-bold ${
                        emp.total_al > 0 ? 'text-blue-600 bg-blue-50/40' : 'text-slate-400'
                      }`}
                    >
                      {emp.total_al}
                    </td>
                    <td className="p-2 text-center font-semibold text-slate-700">{emp.total_hours}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
