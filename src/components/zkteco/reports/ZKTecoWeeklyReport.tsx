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
} from 'lucide-react';
import { WeeklyReportRow } from '@/lib/zkteco/report-service';

interface Props {
  data: {
    week_start: string;
    week_end: string;
    days_header: Array<{ date: string; day_name: string; day_short: string; is_sunday: boolean }>;
    summary: {
      total_staff: number;
      attendance_rate: number;
      total_work_hours: number;
      total_ot_hours: number;
      total_late_minutes: number;
      total_absences: number;
    };
    records: WeeklyReportRow[];
  } | null;
  loading: boolean;
  weekStart: string;
  weekEnd: string;
  onWeekChange: (start: string, end: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: string;
}

export default function ZKTecoWeeklyReport({
  data,
  loading,
  weekStart,
  weekEnd,
  onWeekChange,
  searchQuery,
  onSearchChange,
  language,
}: Props) {
  const summary = data?.summary;
  const daysHeader = data?.days_header || [];
  const records = data?.records || [];

  const handlePrevWeek = () => {
    const s = new Date(weekStart);
    s.setDate(s.getDate() - 7);
    const e = new Date(weekEnd);
    e.setDate(e.getDate() - 7);
    onWeekChange(s.toISOString().slice(0, 10), e.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const s = new Date(weekStart);
    s.setDate(s.getDate() + 7);
    const e = new Date(weekEnd);
    e.setDate(e.getDate() + 7);
    onWeekChange(s.toISOString().slice(0, 10), e.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-4">
      {/* 1. Summary KPI Chips in ZKTeco Console Style */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Total Staff */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Staff'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {summary.total_staff}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Enrolled on Terminal</span>
          </div>

          {/* Attendance Rate */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {language === 'km' ? 'អត្រាវត្តមានប្រចាំសប្តាហ៍' : 'Weekly Rate'}
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
              {summary.attendance_rate}%
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">
              Scheduled 6 Workdays
            </span>
          </div>

          {/* Total Normal Hours */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងការងារធម្មតា' : 'Normal Work Hours'}
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
              {summary.total_work_hours}h
            </span>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400 font-medium">Standard 48.0h/wk</span>
          </div>

          {/* Overtime Hours */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងថែមសរុប (OT)' : 'Total OT Hours'}
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5 block">
              +{summary.total_ot_hours}h
            </span>
            <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-medium">
              Week Overtime
            </span>
          </div>

          {/* Late Minutes */}
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              {language === 'km' ? 'នាទីយឺតសរុប' : 'Total Late Mins'}
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">
              {summary.total_late_minutes}m
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400 font-medium">
              Cumulative Late
            </span>
          </div>

          {/* Absences */}
          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              {language === 'km' ? 'អវត្តមានសរុប' : 'Total Absences'}
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5 block">
              {summary.total_absences}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400 font-medium">Man-Days Missed</span>
          </div>
        </div>
      )}

      {/* 2. Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 no-print">
        {/* Week Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
              {weekStart} &nbsp;—&nbsp; {weekEnd}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Next Week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
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

      {/* 3. Detailed Weekly Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap">AC-No</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">Employee</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">Department</th>

                {/* 7 Days Headers */}
                {daysHeader.map((d) => (
                  <th
                    key={d.date}
                    className={`py-2.5 px-2 text-center whitespace-nowrap min-w-[85px] border-l border-slate-200/60 dark:border-slate-700/60 ${
                      d.is_sunday
                        ? 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        : ''
                    }`}
                  >
                    <div>{d.day_name}</div>
                    <div className="text-[10px] font-mono font-normal opacity-80">
                      {d.date.slice(5)}
                    </div>
                  </th>
                ))}

                {/* Weekly Summary Totals Headers */}
                <th className="py-2.5 px-2 text-center whitespace-nowrap border-l border-slate-200 dark:border-slate-700">Days</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Hours</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">OT</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Late(m)</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">Loading ZKTeco Weekly Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-10 text-center text-slate-400">
                    No records found for the week of {weekStart} to {weekEnd}.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  return (
                    <tr
                      key={`${r.employee_id}_${r.pin}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* AC-No */}
                      <td className="py-2 px-2.5 text-center">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                          #{r.pin}
                        </span>
                      </td>

                      {/* Employee Info */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
                            {r.avatar ? (
                              <img
                                src={r.avatar}
                                alt={r.employee_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">
                                {r.employee_name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs truncate">
                              {r.employee_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {r.employee_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-2 px-3">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block truncate max-w-[120px]">
                          {r.department_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                          {r.role}
                        </span>
                      </td>

                      {/* 7 Days Cells */}
                      {daysHeader.map((d) => {
                        const dayData = r.days[d.date];
                        if (d.is_sunday) {
                          return (
                            <td
                              key={d.date}
                              className="py-1.5 px-1.5 text-center bg-slate-100/50 dark:bg-slate-800/40 border-l border-slate-200/60 dark:border-slate-700/60"
                            >
                              <span className="text-[10px] text-slate-400 font-bold block">OFF</span>
                              <span className="text-[9px] text-slate-400/80 block">Sun</span>
                            </td>
                          );
                        }

                        if (!dayData || dayData.status === 'Absent') {
                          return (
                            <td
                              key={d.date}
                              className="py-1.5 px-1.5 text-center border-l border-slate-200/60 dark:border-slate-700/60 bg-rose-50/40 dark:bg-rose-950/20"
                            >
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block">
                                ABS
                              </span>
                              <span className="text-[9px] text-rose-500/80 block">0.0h</span>
                            </td>
                          );
                        }

                        const isLate = dayData.late_minutes > 0;
                        const hasOt = dayData.overtime_hours > 0;

                        return (
                          <td
                            key={d.date}
                            className={`py-1.5 px-1.5 text-center border-l border-slate-200/60 dark:border-slate-700/60 ${
                              isLate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                            }`}
                          >
                            <span
                              className={`text-[10px] font-mono font-bold block ${
                                isLate ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {dayData.clock_in ? dayData.clock_in.slice(0, 5) : '--'} - {dayData.clock_out ? dayData.clock_out.slice(0, 5) : '--'}
                            </span>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-500">
                                {dayData.work_hours}h
                              </span>
                              {hasOt && (
                                <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  +{dayData.overtime_hours}h
                                </span>
                              )}
                              {isLate && (
                                <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                  L
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Days */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">
                        {r.total_work_days}/6
                      </td>

                      {/* Work Hours */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-700 dark:text-blue-300">
                        {r.total_work_hours}h
                      </td>

                      {/* OT Hours */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.total_ot_hours > 0 ? `+${r.total_ot_hours}h` : '0h'}
                      </td>

                      {/* Late Minutes */}
                      <td className="py-2 px-2 text-center font-mono font-bold">
                        {r.total_late_minutes > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {r.total_late_minutes}m
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Attendance Rate */}
                      <td className="py-2 px-2 text-center">
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
            Showing <strong className="text-slate-800 dark:text-slate-200">{records.length}</strong> staff weekly records
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            ZKTime.Net / BioTime Weekly Matrix Standard
          </span>
        </div>
      </div>
    </div>
  );
}
