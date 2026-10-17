'use client';

import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  MapPin,
  Fingerprint,
  Smile,
  CreditCard,
  Key,
  RotateCw,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { ZKTecoRawTransaction } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';
import { useApp } from '@/context/AppContext';

interface Props {
  transactions: ZKTecoRawTransaction[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ZKTecoLiveAttendanceTable({ transactions, loading, onRefresh }: Props) {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedRawJson, setSelectedRawJson] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (t.employee_name || '').toLowerCase().includes(q) ||
      (t.employee_id || '').toLowerCase().includes(q) ||
      (t.device_user_id || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q);

    const matchDevice = deviceFilter === 'all' || t.device_id === deviceFilter;
    const matchMethod = methodFilter === 'all' || t.verification_method === methodFilter;

    return matchSearch && matchDevice && matchMethod;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by Employee, PIN, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Devices</option>
            <option value="zk-01">ZKTeco-01 (Main Entrance)</option>
            <option value="zk-02">ZKTeco-02 (Secondary Entrance)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Biometric Methods</option>
            <option value="Face">Face Biometrics</option>
            <option value="Fingerprint">Fingerprint</option>
            <option value="Card">RFID Card</option>
            <option value="PIN">PIN / Password</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          className="btn-press px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
          <span>Refresh Punches</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Biometric Attendance Stream ({filtered.length} Punches)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Auditable Raw Log Layer • Section 14
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RotateCw size={22} className="animate-spin mx-auto mb-2 text-indigo-500" />
            Loading live punch stream...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs px-4">
            No punch transactions recorded for the selected filter.
            <p className="mt-1 text-slate-500">
              When employees authenticate on ZKTeco-01 or ZKTeco-02, logs will stream here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Punch Timestamp</th>
                  <th className="px-4 py-3.5">Employee / PIN</th>
                  <th className="px-4 py-3.5">Direction</th>
                  <th className="px-4 py-3.5">Biometric Method</th>
                  <th className="px-4 py-3.5">Terminal & Location</th>
                  <th className="px-4 py-3.5">HRM Engine Status</th>
                  <th className="px-4 py-3.5 text-right">Raw Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    {/* Time */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {t.punch_time}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {t.punch_date}
                      </div>
                    </td>

                    {/* Employee */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.employee_id ? (
                        <div className="flex items-center gap-2.5">
                          {t.employee_avatar && !t.employee_avatar.includes('khmer_') ? (
                            <img
                              src={t.employee_avatar}
                              alt={t.employee_name || 'Staff'}
                              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0">
                              {(t.employee_name || 'E').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <span>{t.employee_name}</span>
                              {t.khmer_name && (
                                <span className="text-slate-400 font-normal">({t.khmer_name})</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {t.employee_id} • PIN #{t.device_user_id}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            PIN #{t.device_user_id}
                          </span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                            (Unmapped Employee)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Punch Type / Direction */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.attendance_type === 'Check-In'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : t.attendance_type === 'Check-Out'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                        }`}
                      >
                        {t.attendance_type === 'Check-In' ? (
                          <ArrowDownLeft size={12} className="text-emerald-600" />
                        ) : (
                          <ArrowUpRight size={12} className="text-rose-600" />
                        )}
                        <span>{t.attendance_type}</span>
                      </span>
                    </td>

                    {/* Verification Method */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t.verification_method === 'Face' ? (
                          <Smile size={11} className="text-indigo-600" />
                        ) : t.verification_method === 'Fingerprint' ? (
                          <Fingerprint size={11} className="text-teal-600" />
                        ) : t.verification_method === 'Card' ? (
                          <CreditCard size={11} className="text-blue-600" />
                        ) : (
                          <Key size={11} className="text-amber-600" />
                        )}
                        <span>{t.verification_method}</span>
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        <span>{t.location || 'Entrance'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.device_name || t.device_id}
                      </div>
                    </td>

                    {/* Processing */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.is_processed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} /> Processed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle size={13} /> Pending Engine
                        </span>
                      )}
                    </td>

                    {/* Raw JSON modal */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedRawJson(t.raw_payload || JSON.stringify(t, null, 2))}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors cursor-pointer"
                        title="View Raw Device Payload"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Payload Modal */}
      {selectedRawJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                Original Raw ZKTeco Device Transaction
              </h3>
              <button
                onClick={() => setSelectedRawJson(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(selectedRawJson), null, 2);
                } catch {
                  return selectedRawJson;
                }
              })()}
            </pre>
            <div className="text-[11px] text-slate-500">
              * Section 14 Compliance: Raw transactions remain immutable for compliance and audit integrity.
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedRawJson(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
