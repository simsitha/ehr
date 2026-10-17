'use client';

import React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  User,
  Server,
} from 'lucide-react';
import { ZKTecoSyncLog } from '@/lib/types';

interface Props {
  logs: ZKTecoSyncLog[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ZKTecoSyncHistoryTable({ logs, loading, onRefresh }: Props) {
  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Device Synchronization & Audit Logs ({logs.length} Operations)
          </h3>
        </div>
        <button
          onClick={onRefresh}
          className="btn-press px-3 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCw size={13} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RotateCw size={22} className="animate-spin mx-auto mb-2 text-indigo-500" />
          Loading synchronization audit history...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs px-4">
          No synchronization logs recorded yet.
          <p className="mt-1 text-slate-500">
            Click &quot;Sync Attendance&quot; or &quot;Test Connection&quot; to initiate a device communication run.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Device</th>
                <th className="px-4 py-3.5">Operation</th>
                <th className="px-4 py-3.5">Result</th>
                <th className="px-4 py-3.5 font-mono">Retrieved</th>
                <th className="px-4 py-3.5 font-mono">New</th>
                <th className="px-4 py-3.5 font-mono">Duplicates</th>
                <th className="px-4 py-3.5 font-mono">Errors</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Initiated By</th>
                <th className="px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('en-GB');

                return (
                  <tr key={log.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                    {/* Time */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {timeStr}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {dateStr}
                      </div>
                    </td>

                    {/* Device */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {log.device_name || log.device_id || 'All Devices'}
                    </td>

                    {/* Operation */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {log.operation}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : log.result === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {log.result === 'SUCCESS' ? (
                          <CheckCircle2 size={11} className="text-emerald-600" />
                        ) : log.result === 'WARNING' ? (
                          <AlertTriangle size={11} className="text-amber-600" />
                        ) : (
                          <XCircle size={11} className="text-rose-600" />
                        )}
                        <span>{log.result}</span>
                      </span>
                    </td>

                    {/* Counts */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-medium">
                      {log.records_retrieved}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {log.records_created}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-400">
                      {log.duplicates}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-rose-600">
                      {log.errors}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500">
                      {log.duration_sec ? `${log.duration_sec.toFixed(1)}s` : '--'}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <User size={12} className="text-slate-400" />
                        {log.user_name || 'System Auto'}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate" title={log.details || ''}>
                      {log.details || '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
