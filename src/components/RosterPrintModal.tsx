'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DutyRosterEntry, ShiftType } from '@/lib/types';
import { getShiftConfig, getShiftList, SHIFTS, DayColumn } from '@/lib/roster-shifts';
import { formatLocalizedText } from '@/lib/translations';
import { Printer, X, Shield, CheckCircle2, Download } from 'lucide-react';

interface EmployeeScheduleRow {
  employee: {
    id: string;
    name: string;
    role: string;
    department_name: string;
  };
  shifts: Record<string, DutyRosterEntry | undefined>; // key: dateStr
  totalHours: number;
  offDaysCount: number;
  isCompliant: boolean;
}

interface RosterPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: DayColumn[];
  rows: EmployeeScheduleRow[];
  weekStart: string;
  departmentName: string;
}

export default function RosterPrintModal({
  isOpen,
  onClose,
  weekDays,
  rows,
  weekStart,
  departmentName,
}: RosterPrintModalProps) {
  const { language, shiftSettings } = useApp();

  if (!isOpen) return null;

  const totalStaff = rows.length;
  const grandTotalHours = rows.reduce((acc, r) => acc + r.totalHours, 0);
  const avgHours = totalStaff > 0 ? (grandTotalHours / totalStaff).toFixed(1) : '0';
  const compliantCount = rows.filter((r) => r.isCompliant).length;
  const complianceRate = totalStaff > 0 ? Math.round((compliantCount / totalStaff) * 100) : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              {language === 'km' ? 'ទិដ្ឋភាពបោះពុម្ពកាលវិភាគការងារផ្លូវការ (A4 Landscape)' : 'Official Duty Roster Print Preview (A4 Landscape)'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>{language === 'km' ? 'បោះពុម្ពឯកសារ (Print)' : 'Print Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 print:p-0 print:overflow-visible print:bg-white print:text-black">
          {/* Official Cambodian Header */}
          <div className="text-center mb-6">
            {language === 'km' ? (
              <>
                <p className="font-bold text-base tracking-wide text-slate-800 font-serif">
                  ព្រះរាជាណាចក្រកម្ពុជា
                </p>
                <p className="font-semibold text-sm tracking-widest text-slate-700 font-serif mt-0.5">
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-base tracking-wide text-slate-800 font-serif">
                  KINGDOM OF CAMBODIA
                </p>
                <p className="font-semibold text-xs tracking-widest text-slate-700 font-serif mt-0.5">
                  NATION &bull; RELIGION &bull; KING
                </p>
              </>
            )}
            <div className="w-24 h-0.5 bg-amber-600 mx-auto my-1.5 opacity-60" />
            {language === 'km' && (
              <p className="text-[11px] text-slate-500 italic">
                KINGDOM OF CAMBODIA • NATION RELIGION KING
              </p>
            )}
          </div>

          {/* Document Title & Sub-header */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
            <div>
              <div className="font-bold text-slate-900 text-lg uppercase tracking-wide">
                HESTRA HRM ENTERPRISE CAMBODIA
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {language === 'km'
                  ? 'ការិយាល័យកណ្តាល៖ មហាវិថីព្រះមុនីវង្ស រាជធានីភ្នំពេញ • ទូរស័ព្ទ៖ +855 23 999 888'
                  : 'Head Office: Preah Monivong Blvd, Phnom Penh • Tel: +855 23 999 888'}
              </div>
              <div className="text-xs font-medium text-slate-700 mt-1">
                {language === 'km' ? 'នាយកដ្ឋាន / Division:' : 'Division / Department:'} <span className="font-bold text-slate-900">{departmentName}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-wider text-slate-800">
                {language === 'km' ? 'កាលវិភាគវេនការងារ & វេនប្រចាំការ' : 'DUTY ROSTER & SHIFT SCHEDULE'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {language === 'km' ? (
                  <>
                    សប្ដាហ៍ចាប់ពី / Week Period: <span className="font-bold text-slate-900">{weekStart}</span> ដល់{' '}
                    <span className="font-bold text-slate-900">{weekDays[6]?.dateStr || ''}</span>
                  </>
                ) : (
                  <>
                    Week Period: <span className="font-bold text-slate-900">{weekStart}</span> to{' '}
                    <span className="font-bold text-slate-900">{weekDays[6]?.dateStr || ''}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'km'
                  ? `កាលបរិច្ឆេទបោះពុម្ព: ${new Date().toLocaleDateString('km-KH')}`
                  : `Printed Date: ${new Date().toLocaleDateString('en-GB')}`}
              </div>
            </div>
          </div>

          {/* Duty Roster Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 text-left w-36">
                    {language === 'km' ? (
                      <>
                        ឈ្មោះបុគ្គលិក<br />
                        <span className="text-[10px] font-normal text-slate-600">Employee Name</span>
                      </>
                    ) : (
                      'Employee Name'
                    )}
                  </th>
                  <th className="border border-slate-300 p-2 text-left w-32">
                    {language === 'km' ? (
                      <>
                        តួនាទី<br />
                        <span className="text-[10px] font-normal text-slate-600">Position</span>
                      </>
                    ) : (
                      'Position / Role'
                    )}
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.dateStr} className={`border border-slate-300 p-1.5 text-center min-w-[76px] ${day.isWeekend ? 'bg-amber-50/70' : ''}`}>
                      <div className="font-bold">{language === 'km' ? day.nameKm : day.nameEn}</div>
                      <div className="text-[10px] text-slate-600">{day.shortEn} {day.dateStr.slice(8)}</div>
                    </th>
                  ))}
                  <th className="border border-slate-300 p-1.5 text-center w-14 font-bold">
                    {language === 'km' ? (
                      <>
                        ម៉ោង<br />
                        <span className="text-[10px] font-normal text-slate-600">Hours</span>
                      </>
                    ) : (
                      'Hours'
                    )}
                  </th>
                  <th className="border border-slate-300 p-1.5 text-center w-12 font-bold">
                    {language === 'km' ? (
                      <>
                        សម្រាក<br />
                        <span className="text-[10px] font-normal text-slate-600">OFF</span>
                      </>
                    ) : (
                      'OFF'
                    )}
                  </th>
                  <th className="border border-slate-300 p-1.5 text-center w-20 font-bold">
                    {language === 'km' ? (
                      <>
                        អនុលោម<br />
                        <span className="text-[10px] font-normal text-slate-600">Status</span>
                      </>
                    ) : (
                      'Status'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  return (
                    <tr key={row.employee.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="border border-slate-300 p-2 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                        {row.employee.name}
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-600 text-[11px]">
                        {row.employee.role}
                      </td>

                      {/* 7 Days */}
                      {weekDays.map((day) => {
                        const shift = row.shifts[day.dateStr];
                        const shiftType = shift?.shift_type || 'off';
                        const def = getShiftConfig(shiftType, shiftSettings?.shifts);
                        const isOff = shiftType === 'off';

                        return (
                          <td
                            key={day.dateStr}
                            className={`border border-slate-300 p-1 text-center text-[10px] ${
                              day.isWeekend ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <div className="font-bold">
                              {isOff ? (
                                <span className="text-slate-400 font-semibold">OFF</span>
                              ) : (
                                <span style={{ color: def.color }}>{def.short_code}</span>
                              )}
                            </div>
                            {!isOff && (
                              <div className="text-[9px] text-slate-500">
                                {shift?.start_time || def.start_time}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Weekly Summary Metrics */}
                      <td className="border border-slate-300 p-1.5 text-center font-bold font-mono text-slate-800">
                        {row.totalHours}h
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-semibold font-mono text-slate-600">
                        {row.offDaysCount}d
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {row.isCompliant ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {language === 'km' ? 'ស្របច្បាប់' : 'Compliant'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {language === 'km' ? 'លើសម៉ោង' : 'Over Limit'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compliance & Summary Telemetry Banner */}
          <div className="mt-4 grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-slate-500">{language === 'km' ? 'ចំនួនបុគ្គលិកសរុប (Staff):' : 'Total Staff:'}</span>
              <div className="font-bold text-slate-800 text-sm">{totalStaff} {language === 'km' ? 'នាក់' : 'staff'}</div>
            </div>
            <div>
              <span className="text-slate-500">{language === 'km' ? 'ម៉ោងការងារសរុប (Total Hours):' : 'Total Hours:'}</span>
              <div className="font-bold text-slate-800 text-sm">{grandTotalHours} {language === 'km' ? 'ម៉ោង' : 'hrs'}</div>
            </div>
            <div>
              <span className="text-slate-500">{language === 'km' ? 'ម៉ោងមធ្យម/នាក់ (Avg Hours):' : 'Avg Hours / Staff:'}</span>
              <div className="font-bold text-slate-800 text-sm">{avgHours} {language === 'km' ? 'ម៉ោង/សប្ដាហ៍' : 'hrs/wk'}</div>
            </div>
            <div>
              <span className="text-slate-500">{language === 'km' ? 'អនុលោមភាពច្បាប់ការងារ:' : 'Labor Compliance:'}</span>
              <div className="font-bold text-emerald-700 text-sm">
                {complianceRate}% {language === 'km' ? '(មាត្រា ១៤៧ & ១៣៧)' : '(Art. 147 & 137)'}
              </div>
            </div>
          </div>

          {/* Cambodian Shift Legend */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 px-1">
            <span>
              <strong>{language === 'km' ? 'កំណត់សម្គាល់វេន៖' : 'Shift Legend:'}</strong>{' '}
              {getShiftList(shiftSettings?.shifts)
                .map((s) => {
                  if (!s.start_time) return `${s.short_code}: ${language === 'km' ? 'សម្រាក (0h)' : 'OFF (0h)'}`;
                  const sub = s.sub_shifts && s.sub_shifts.length > 0 ? ` (${s.default_hours}h - AM/PM)` : ` (${s.default_hours}h)`;
                  return `${s.short_code}: ${s.start_time}-${s.end_time}${sub}`;
                })
                .join(' | ')}
            </span>
          </div>

          {/* Official 3-Column Cambodian Signature Blocks */}
          <div className="mt-10 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800 mb-1">{language === 'km' ? 'រៀបចំដោយ / Prepared By' : 'Prepared By'}</p>
              <p className="text-[11px] text-slate-500 italic">{language === 'km' ? 'មន្ត្រីទទួលបន្ទុកវេនការងារ' : 'Roster Scheduling Officer'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-600 mt-1 font-medium">{language === 'km' ? 'កាលបរិច្ឆេទ៖ ..... / ..... / 2026' : 'Date: ..... / ..... / 2026'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1">{language === 'km' ? 'ពិនិត្យដោយ / Reviewed By' : 'Reviewed By'}</p>
              <p className="text-[11px] text-slate-500 italic">{language === 'km' ? 'ប្រធានផ្នែក / នាយកដ្ឋាន' : 'Department Manager'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-600 mt-1 font-medium">{language === 'km' ? 'កាលបរិច្ឆេទ៖ ..... / ..... / 2026' : 'Date: ..... / ..... / 2026'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1">{language === 'km' ? 'អនុម័តដោយ / Approved By' : 'Approved By'}</p>
              <p className="text-[11px] text-slate-500 italic">{language === 'km' ? 'នាយកប្រតិបត្តិ / HR Director' : 'Executive / HR Director'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-600 mt-1 font-medium">{language === 'km' ? 'កាលបរិច្ឆេទ៖ ..... / ..... / 2026' : 'Date: ..... / ..... / 2026'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
