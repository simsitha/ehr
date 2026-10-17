'use client';

import React from 'react';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  Camera,
  Timer,
  Server,
  Sparkles,
  Search,
} from 'lucide-react';
import { DailyReportRow, DailyReportSummary } from '@/lib/zkteco/report-service';
import { formatLocalizedText } from '@/lib/translations';

interface Props {
  data: {
    summary: DailyReportSummary;
    records: DailyReportRow[];
  } | null;
  loading: boolean;
  date: string;
  onDateChange: (date: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: string;
}

export default function ZKTecoDailyReport({
  data,
  loading,
  date,
  onDateChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  language,
}: Props) {
  const summary = data?.summary;
  const records = data?.records || [];

  return (
    <div className="space-y-4">
      {/* 1. Summary KPI Chips in ZKTeco Console Style */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Total Scheduled */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Staff'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {summary.total_scheduled}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {language === 'km' ? 'វេន ០៧:៣០ - ១៦:៣០' : '07:30 - 16:30'}
            </span>
          </div>

          {/* Present */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {language === 'km' ? 'មានវត្តមាន' : 'Present'}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md font-mono">
                {summary.present_rate}%
              </span>
            </div>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
              {summary.present_count}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">
              {summary.on_time_count} {language === 'km' ? 'ទាន់ពេល' : 'On-Time'}
            </span>
          </div>

          {/* Late */}
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              {language === 'km' ? 'យឺតពេល (Late)' : 'Late Arrival'}
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">
              {summary.late_count}
            </span>
            <span className="text-[10px] text-amber-600/90 dark:text-amber-400 font-bold font-mono">
              {summary.late_minutes_total} mins total
            </span>
          </div>

          {/* Early Leave */}
          <div className="bg-orange-50/60 dark:bg-orange-950/30 p-3 rounded-2xl border border-orange-200/80 dark:border-orange-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider block">
              {language === 'km' ? 'ចេញមុន (Early)' : 'Early Leave'}
            </span>
            <span className="text-xl font-black text-orange-700 dark:text-orange-300 font-mono mt-0.5 block">
              {summary.early_leave_count}
            </span>
            <span className="text-[10px] text-orange-600/90 dark:text-orange-400 font-bold font-mono">
              {summary.early_minutes_total} mins early
            </span>
          </div>

          {/* Absent */}
          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              {language === 'km' ? 'អវត្តមាន (Absent)' : 'Absent'}
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5 block">
              {summary.absent_count}
            </span>
            <span className="text-[10px] text-rose-600/90 dark:text-rose-400 font-medium">
              {summary.absent_rate}% {language === 'km' ? 'អត្រាអវត្តមាន' : 'Rate'}
            </span>
          </div>

          {/* Work Hours */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងធម្មតា' : 'Normal Hours'}
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
              {summary.total_work_hours}h
            </span>
            <span className="text-[10px] text-blue-600/90 dark:text-blue-400 font-medium">
              {language === 'km' ? 'ម៉ោងការងារផ្លូវការ' : 'Standard 8.0h'}
            </span>
          </div>

          {/* Overtime Hours */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងថែម (OT)' : 'Overtime'}
            </span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5 block">
              +{summary.total_ot_hours}h
            </span>
            <span className="text-[10px] text-indigo-600/90 dark:text-indigo-400 font-medium">
              {language === 'km' ? 'អត្រា ១.៥ដង / ២.០ដង' : '1.5x / 2.0x Rate'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Official Attendance Timetable Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50/80 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'km' ? 'កាលវិភាគម៉ោងធ្វើការ (Attendance Timetable)' : 'Attendance Timetable'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  Standard Factory Shift (8.0h)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'អនុគ្រោះ ១០នាទី (យឺតក្រោយ ០៧:៤០ ព្រឹក) • ថែមម៉ោងគិតចាប់ពីម៉ោង ១៦:៣០ ល្ងាច'
                  : 'Grace period: 10 mins (Late after 07:40 AM) • Overtime starts after 16:30 PM'}
              </p>
            </div>
          </div>

          {/* Sessions Breakdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Morning Session */}
            <div className="bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  {language === 'km' ? 'ពេលព្រឹក (Morning AM)' : 'Morning (AM)'}
                </span>
                <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                  07:30 AM → 11:30 AM
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                4.0h
              </span>
            </div>

            {/* Lunch Break */}
            <div className="bg-white dark:bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center gap-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  {language === 'km' ? 'បាយថ្ងៃត្រង់ (Lunch)' : 'Lunch Break'}
                </span>
                <span className="text-xs font-semibold font-mono text-slate-600 dark:text-slate-300">
                  11:30 → 12:30
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">1h break</span>
            </div>

            {/* Afternoon Session */}
            <div className="bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  {language === 'km' ? 'ពេលរសៀល (Afternoon PM)' : 'Afternoon (PM)'}
                </span>
                <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                  12:30 PM → 16:30 PM
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                4.0h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-indigo-600" />
            <span className="text-xs text-slate-500 font-semibold">{language === 'km' ? 'កាលបរិច្ឆេទ:' : 'Date:'}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium cursor-pointer shadow-2xs"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព (All)' : 'All Statuses'}</option>
            <option value="Present">{language === 'km' ? 'មានវត្តមាន (Present)' : 'Present Only'}</option>
            <option value="Late">{language === 'km' ? 'យឺតពេល (Late)' : 'Late Arrivals'}</option>
            <option value="Early Leave">{language === 'km' ? 'ចេញមុន (Early)' : 'Early Departures'}</option>
            <option value="Absent">{language === 'km' ? 'អវត្តមាន (Absent)' : 'Absences'}</option>
            <option value="On Leave">{language === 'km' ? 'ច្បាប់ឈប់ (On Leave)' : 'On Leave'}</option>
          </select>
        </div>

        {/* Search Input */}
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

      {/* 3. Detailed ZKTeco Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 whitespace-nowrap text-center">AC-No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Employee</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Department & Role</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Shift</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Check-In</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Check-Out</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-center">Late (m)</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-center">Early (m)</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-center">Work (h)</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-center">OT (h)</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Terminal & Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">Loading ZKTeco Daily Attendance...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    No attendance records match the selected filters for {date}.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isLate = r.late_minutes > 0;
                  const isEarly = r.early_minutes > 0;
                  const hasOt = r.overtime_hours > 0;

                  return (
                    <tr
                      key={`${r.employee_id}_${r.pin}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* AC-No / PIN */}
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-700">
                          #{r.pin}
                        </span>
                      </td>

                      {/* Employee Avatar & Name */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
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
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                              {r.employee_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {r.employee_id} {r.khmer_name ? `• ${r.khmer_name}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-2 px-3">
                        <span className="text-slate-700 dark:text-slate-300 font-medium block">
                          {r.department_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{r.role}</span>
                      </td>

                      {/* Shift / Timetable */}
                      <td className="py-2 px-3">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                          07:30 - 16:30
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                          AM 07:30-11:30 | PM 12:30-16:30
                        </span>
                      </td>

                      {/* Check-In */}
                      <td className="py-2 px-3 text-center">
                        {r.clock_in ? (
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                              isLate
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            <Clock size={11} />
                            {r.clock_in}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">--:--:--</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="py-2 px-3 text-center">
                        {r.clock_out ? (
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                              isEarly
                                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                                : hasOt
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <Clock size={11} />
                            {r.clock_out}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">--:--:--</span>
                        )}
                      </td>

                      {/* Late (m) */}
                      <td className="py-2 px-2.5 text-center font-mono">
                        {isLate ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            +{r.late_minutes}m
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Early (m) */}
                      <td className="py-2 px-2.5 text-center font-mono">
                        {isEarly ? (
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            -{r.early_minutes}m
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Work Hours */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.work_hours > 0 ? `${r.work_hours}h` : '0h'}
                      </td>

                      {/* Overtime (OT) */}
                      <td className="py-2 px-2.5 text-center font-mono">
                        {hasOt ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200/80 dark:border-indigo-800">
                            +{r.overtime_hours}h
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : r.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : r.status === 'Early Leave'
                              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                              : r.status === 'Absent'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : r.status === 'On Leave'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Terminal & Verification */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Camera size={12} className="text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[150px] text-[11px]">
                            {r.verification_method}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {r.terminal_name}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with counts */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{records.length}</strong> enrolled employee records
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Source: Live ZKTeco SpeedFace-V5L Terminal (192.168.88.201:8081)
          </span>
        </div>
      </div>
    </div>
  );
}
