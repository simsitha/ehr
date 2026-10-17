'use client';

import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Search,
  Timer,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';
import { MonthlyReportRow } from '@/lib/zkteco/report-service';

interface Props {
  data: {
    year: number;
    month: number;
    month_label: string;
    days_in_month: number;
    days_header: Array<{ day: number; date: string; day_name: string; is_sunday: boolean }>;
    summary: {
      total_staff: number;
      scheduled_working_days: number;
      average_attendance_rate: number;
      total_work_hours: number;
      total_ot_hours: number;
      total_late_count: number;
      total_absent_count: number;
    };
    records: MonthlyReportRow[];
  } | null;
  loading: boolean;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: string;
}

export default function ZKTecoMonthlyReport({
  data,
  loading,
  year,
  month,
  onMonthChange,
  searchQuery,
  onSearchChange,
  language,
}: Props) {
  const summary = data?.summary;
  const daysHeader = data?.days_header || [];
  const records = data?.records || [];

  const handlePrevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="space-y-4">
      {/* 1. Summary KPI Chips in ZKTeco Console Style */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Total Staff */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Headcount'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {summary.total_staff}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">All Enrolled Staff</span>
          </div>

          {/* Average Attendance Rate */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {language === 'km' ? 'អត្រាវត្តមានប្រចាំខែ' : 'Monthly Rate'}
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
              {summary.average_attendance_rate}%
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">
              {summary.scheduled_working_days} Workdays Sched.
            </span>
          </div>

          {/* Total Normal Hours */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងការងារសរុប' : 'Total Normal Hours'}
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
              {summary.total_work_hours.toLocaleString()}h
            </span>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400 font-medium">Full Month Worked</span>
          </div>

          {/* Overtime Hours */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងថែមសរុប (OT)' : 'Total Overtime'}
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5 block">
              +{summary.total_ot_hours.toLocaleString()}h
            </span>
            <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-medium">Factory OT Bank</span>
          </div>

          {/* Total Late Incidents */}
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              {language === 'km' ? 'ករណីយឺតសរុប' : 'Total Lates'}
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">
              {summary.total_late_count}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400 font-medium">Late Incidents</span>
          </div>

          {/* Total Absent Days */}
          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              {language === 'km' ? 'អវត្តមានសរុប' : 'Total Absences'}
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5 block">
              {summary.total_absent_count}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400 font-medium">Days Unscheduled</span>
          </div>
        </div>
      )}

      {/* 2. Controls Toolbar & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 no-print">
        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
              {data?.month_label || `${year}-${String(month).padStart(2, '0')}`}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ✓ Present (8h)
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> L Late
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> E Early
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A Absent
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> AL Leave
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> OFF Sunday
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'km' ? 'ស្វែងរកឈ្មោះ ឬ PIN...' : 'Search by Name, PIN or ID...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Detailed Monthly Time Card 31-Day Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2 px-2 text-center whitespace-nowrap sticky left-0 z-20 bg-slate-100 dark:bg-slate-800">
                  PIN
                </th>
                <th className="py-2 px-2.5 whitespace-nowrap min-w-[140px] sticky left-[45px] z-20 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                  Employee
                </th>

                {/* Days 1 to 31 */}
                {daysHeader.map((d) => (
                  <th
                    key={d.day}
                    className={`py-1 px-1 text-center min-w-[26px] max-w-[28px] border-r border-slate-200/60 dark:border-slate-700/60 ${
                      d.is_sunday
                        ? 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        : ''
                    }`}
                  >
                    <div>{d.day}</div>
                    <div className="text-[8px] font-normal opacity-70">{d.day_name}</div>
                  </th>
                ))}

                {/* Monthly Totals Headers */}
                <th className="py-2 px-1.5 text-center whitespace-nowrap border-l border-slate-200 dark:border-slate-700">Work</th>
                <th className="py-2 px-1.5 text-center whitespace-nowrap">Hours</th>
                <th className="py-2 px-1.5 text-center whitespace-nowrap">OT</th>
                <th className="py-2 px-1.5 text-center whitespace-nowrap">Late</th>
                <th className="py-2 px-1.5 text-center whitespace-nowrap">Abs</th>
                <th className="py-2 px-1.5 text-center whitespace-nowrap">Leave</th>
                <th className="py-2 px-2 text-center whitespace-nowrap">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={42} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">Loading ZKTeco Monthly Time Card Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={42} className="py-10 text-center text-slate-400">
                    No employee records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  return (
                    <tr
                      key={`${r.employee_id}_${r.pin}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* PIN */}
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-[10px] text-slate-600 dark:text-slate-300 sticky left-0 z-10 bg-white dark:bg-slate-900">
                        #{r.pin}
                      </td>

                      {/* Name */}
                      <td className="py-1.5 px-2.5 sticky left-[45px] z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 truncate max-w-[150px]">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] truncate">
                          {r.employee_name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block truncate">
                          {r.employee_id} • {r.department_name}
                        </span>
                      </td>

                      {/* Day Columns 1 to 31 */}
                      {daysHeader.map((d) => {
                        const cell = r.days[String(d.day)];
                        if (d.is_sunday) {
                          return (
                            <td
                              key={d.day}
                              className="py-1 px-0.5 text-center bg-slate-100/40 dark:bg-slate-800/40 border-r border-slate-200/50 dark:border-slate-700/50 text-slate-400 font-mono text-[9px]"
                            >
                              -
                            </td>
                          );
                        }

                        if (!cell) {
                          return (
                            <td
                              key={d.day}
                              className="py-1 px-0.5 text-center border-r border-slate-200/50 dark:border-slate-700/50 text-slate-300"
                            >
                              -
                            </td>
                          );
                        }

                        let badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40';
                        if (cell.code === 'L') badgeColor = 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 font-bold';
                        else if (cell.code === 'E') badgeColor = 'text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/60 font-bold';
                        else if (cell.code === 'A') badgeColor = 'text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 font-bold';
                        else if (cell.code === 'AL') badgeColor = 'text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 font-bold';

                        return (
                          <td
                            key={d.day}
                            className={`py-1 px-0.5 text-center border-r border-slate-200/50 dark:border-slate-700/50 font-mono text-[10px] ${
                              cell.code === 'A' ? 'bg-rose-50/50 dark:bg-rose-950/30' : ''
                            }`}
                            title={`${d.date}: ${cell.status} (${cell.work_hours}h${cell.ot_hours > 0 ? ` +${cell.ot_hours}h OT` : ''})`}
                          >
                            <span className={`inline-block w-full py-0.5 rounded text-center leading-none ${badgeColor}`}>
                              {cell.code === '✓' ? (cell.ot_hours > 0 ? `+${cell.ot_hours}` : '✓') : cell.code}
                            </span>
                          </td>
                        );
                      })}

                      {/* Scheduled / Actual Days */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">
                        {r.actual_days}/{r.scheduled_days}
                      </td>

                      {/* Normal Hours */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-blue-700 dark:text-blue-300">
                        {r.total_work_hours}h
                      </td>

                      {/* OT Hours */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.total_ot_hours > 0 ? `+${r.total_ot_hours}h` : '0'}
                      </td>

                      {/* Late Count */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold">
                        {r.late_count > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {r.late_count} ({r.late_minutes}m)
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Absent Days */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold">
                        {r.absent_days > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {r.absent_days}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Leave Days */}
                      <td className="py-1.5 px-1.5 text-center font-mono text-purple-600 dark:text-purple-400">
                        {r.leave_days > 0 ? r.leave_days : '0'}
                      </td>

                      {/* Attendance Rate */}
                      <td className="py-1.5 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            r.attendance_rate >= 90
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{records.length}</strong> monthly time card records ({year}-{String(month).padStart(2, '0')})
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            ZKTeco 31-Day TimeCard Matrix Standard
          </span>
        </div>
      </div>
    </div>
  );
}
