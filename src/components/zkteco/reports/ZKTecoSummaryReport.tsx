'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  Camera,
  Timer,
  TrendingUp,
  Building2,
  ScanFace,
  Fingerprint,
  CreditCard,
  Edit2,
  Award,
  Shield,
  Layers,
} from 'lucide-react';
import { ZKTecoSummaryReport as SummaryReportType } from '@/lib/zkteco/report-service';

interface Props {
  data: SummaryReportType | null;
  loading: boolean;
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  language: string;
}

export default function ZKTecoSummaryReport({
  data,
  loading,
  startDate,
  endDate,
  onRangeChange,
  language,
}: Props) {
  const kpis = data?.kpis;
  const depts = data?.department_breakdown || [];
  const modalities = data?.modality_breakdown;
  const exceptions = data?.exceptions;

  const setPreset = (preset: 'today' | 'week' | 'month' | 'last_month') => {
    if (preset === 'today') {
      const today = '2026-10-16';
      onRangeChange(today, today);
    } else if (preset === 'week') {
      onRangeChange('2026-10-12', '2026-10-18');
    } else if (preset === 'month') {
      onRangeChange('2026-10-01', '2026-10-16');
    } else if (preset === 'last_month') {
      onRangeChange('2026-09-01', '2026-09-30');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Range Toolbar & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 no-print">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            {language === 'km' ? 'ចន្លោះពេល:' : 'Period:'}
          </span>
          <button
            onClick={() => setPreset('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              startDate === '2026-10-16' && endDate === '2026-10-16'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Today (Oct 16)
          </button>
          <button
            onClick={() => setPreset('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              startDate === '2026-10-12' && endDate === '2026-10-18'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPreset('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              startDate === '2026-10-01' && endDate === '2026-10-16'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Month-to-Date (Oct)
          </button>
          <button
            onClick={() => setPreset('last_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              startDate === '2026-09-01' && endDate === '2026-09-30'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Last Month (Sep)
          </button>
        </div>

        {/* Custom Range */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
          <Calendar size={14} className="text-indigo-600" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onRangeChange(e.target.value, endDate)}
            className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-hidden cursor-pointer"
          />
          <span className="text-slate-400 font-bold text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onRangeChange(startDate, e.target.value)}
            className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-hidden cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Attendance Rate */}
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
                {language === 'km' ? 'អត្រាវត្តមានសរុប' : 'Attendance Rate'}
              </span>
              <span className="text-3xl font-black font-mono mt-1 block">
                {kpis.attendance_rate}%
              </span>
              <span className="text-xs text-emerald-100 font-medium mt-1 block">
                {kpis.total_present_days} / {kpis.total_man_days} Man-Days
              </span>
            </div>
            <UserCheck size={64} className="absolute -bottom-2 -right-2 text-emerald-600/30" />
          </div>

          {/* Punctuality Rate */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'អត្រាចូលទាន់ពេល' : 'Punctuality Rate'}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
              {kpis.punctuality_rate}%
            </span>
            <span className="text-xs text-amber-600 font-bold font-mono mt-1 block">
              {kpis.total_late_instances} Late Incidents
            </span>
          </div>

          {/* Work Hours */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងការងារធម្មតា' : 'Normal Work Hours'}
            </span>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">
              {kpis.total_work_hours.toLocaleString()}h
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">
              Across {kpis.total_headcount} Staff
            </span>
          </div>

          {/* Overtime Hours */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'ម៉ោងបន្ថែម (OT)' : 'Overtime Hours'}
            </span>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">
              +{kpis.total_ot_hours.toLocaleString()}h
            </span>
            <span className="text-xs text-indigo-600/80 dark:text-indigo-400 font-medium mt-1 block">
              1.5x / 2.0x Factory OT
            </span>
          </div>

          {/* Late Minutes Cumulative */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'នាទីយឺតសរុប' : 'Total Late Mins'}
            </span>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">
              {kpis.total_late_minutes.toLocaleString()}m
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">
              Avg {Math.round(kpis.total_late_minutes / Math.max(1, kpis.total_late_instances))}m per incident
            </span>
          </div>

          {/* Biometric Punches Volume */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'កត់ត្រាជីវមាត្រសរុប' : 'Biometric Punches'}
            </span>
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1 block">
              {kpis.total_biometric_punches.toLocaleString()}
            </span>
            <span className="text-xs text-teal-600/80 dark:text-teal-400 font-medium mt-1 block">
              Live Terminal In/Out
            </span>
          </div>
        </div>
      )}

      {/* 3. Departmental Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'km' ? 'ការវិភាគវត្តមានតាមផ្នែក (Departmental Attendance Analysis)' : 'Departmental Attendance Breakdown'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono font-medium">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Staff</th>
                <th className="py-2.5 px-3 text-center">Expected Days</th>
                <th className="py-2.5 px-3 text-center">Present Days</th>
                <th className="py-2.5 px-4 min-w-[140px]">Attendance Rate</th>
                <th className="py-2.5 px-3 text-center">Late (Count/Mins)</th>
                <th className="py-2.5 px-3 text-center">Early Leave</th>
                <th className="py-2.5 px-3 text-center">Absent Days</th>
                <th className="py-2.5 px-3 text-center">Leave Days</th>
                <th className="py-2.5 px-3 text-center">Work Hours</th>
                <th className="py-2.5 px-3 text-center">OT Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">Aggregating departmental metrics...</span>
                    </div>
                  </td>
                </tr>
              ) : depts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No departmental data available for selected period.
                  </td>
                </tr>
              ) : (
                depts.map((d) => {
                  return (
                    <tr
                      key={d.department_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Department Name */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                          {d.department_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {d.department_id}
                        </span>
                      </td>

                      {/* Headcount */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {d.headcount}
                      </td>

                      {/* Expected Days */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {d.expected_days}
                      </td>

                      {/* Present Days */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {d.present_days}
                      </td>

                      {/* Rate with Progress Bar */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, d.attendance_rate)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 min-w-[42px] text-right">
                            {d.attendance_rate}%
                          </span>
                        </div>
                      </td>

                      {/* Late Count & Mins */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {d.late_count > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {d.late_count} ({d.late_minutes}m)
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Early Leave */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        {d.early_count > 0 ? (
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {d.early_count}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Absent Days */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        {d.absent_days > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {d.absent_days} ({d.absent_rate}%)
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Leave Days */}
                      <td className="py-2.5 px-3 text-center font-mono text-purple-600 dark:text-purple-400">
                        {d.leave_days > 0 ? d.leave_days : '0'}
                      </td>

                      {/* Work Hours */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-300">
                        {d.work_hours.toLocaleString()}h
                      </td>

                      {/* OT Hours */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {d.ot_hours > 0 ? `+${d.ot_hours}h` : '0'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Biometric Modality Distribution & Top Exceptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biometric Verification Modality Breakdown */}
        {modalities && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'km' ? 'ការផ្ទៀងផ្ទាត់ជីវមាត្រ ZKTeco' : 'Biometric Modality Distribution'}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Face */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <ScanFace size={14} className="text-teal-600" />
                    Visible Light Face Recognition (SpeedFace-V5L)
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {modalities.face.count.toLocaleString()} punches ({modalities.face.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${modalities.face.percent}%` }}></div>
                </div>
              </div>

              {/* Fingerprint */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Fingerprint size={14} className="text-blue-600" />
                    SilkID Optical Fingerprint Sensor
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {modalities.fingerprint.count.toLocaleString()} punches ({modalities.fingerprint.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${modalities.fingerprint.percent}%` }}></div>
                </div>
              </div>

              {/* RFID Card */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <CreditCard size={14} className="text-amber-600" />
                    RFID Card Contactless Punches
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {modalities.card.count.toLocaleString()} punches ({modalities.card.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${modalities.card.percent}%` }}></div>
                </div>
              </div>

              {/* Manual HR */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Edit2 size={14} className="text-purple-600" />
                    Manual HR Corrections & Web Punches
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {modalities.manual.count.toLocaleString()} punches ({modalities.manual.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${modalities.manual.percent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Exceptions / Anomalies */}
        {exceptions && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'km' ? 'ករណីលើកលែង និងយឺតពេលច្រើនជាងគេ' : 'Top Attendance Anomalies (Late & Absences)'}
              </h3>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Top 5 Late Arrivals
              </span>
              {exceptions.top_late.map((item, idx) => (
                <div
                  key={item.employee_id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{item.pin} • {item.department}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400 block">
                      +{item.total_minutes} mins
                    </span>
                    <span className="text-[10px] text-slate-400">{item.count} instances</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
