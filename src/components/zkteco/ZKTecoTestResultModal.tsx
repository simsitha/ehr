'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  X,
  Clock,
  Users,
  FileText,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { TestConnectionResult } from '@/lib/zkteco/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: TestConnectionResult | null;
  deviceName?: string;
}

export default function ZKTecoTestResultModal({ isOpen, onClose, result, deviceName }: Props) {
  if (!isOpen || !result) return null;

  const isSuccess = result.success && result.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <XCircle size={20} className="text-rose-500" />
            )}
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isSuccess ? 'Connection Successful' : 'Connection Test Failed'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {result.info?.firmwareVersion?.includes('ADMS')
                  ? 'ADMS Real-Time Push Communication Active & Verified (ON)!'
                  : 'Physical Socket & ZKTeco Standalone Handshake Verified (ON)!'}
              </span>
              <span className="font-mono font-bold text-[10px] bg-emerald-200/50 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                {result.latencyMs}ms
              </span>
            </div>

            {/* Spec List (Section 8 & 9) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Device Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{result.info?.deviceName || deviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Model:</span>
                <span className="font-bold text-slate-900 dark:text-white">{result.info?.model}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Platform:</span>
                <span className="font-bold text-slate-900 dark:text-white">{result.info?.platform}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Firmware:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{result.info?.firmwareVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Serial Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{result.info?.serialNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Registered Users:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{result.info?.userCount} users</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Attendance Records:</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{result.info?.logCount} records</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Biometric Algorithms:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {result.info?.faceAlg} / {result.info?.fingerprintAlg}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Device Hardware Time:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {result.info?.deviceTime ? new Date(result.info.deviceTime).toLocaleString() : '--'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                <span>Error Code: {result.errorCode || 'DEVICE_OFFLINE'}</span>
              </div>
              <p className="font-mono text-[11px] text-rose-800 dark:text-rose-300">
                {result.error}
              </p>
            </div>

            {/* Troubleshooting Checklist (Section 31) */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-600" />
                  Recommended Resolution Steps (Section 31):
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  {result.suggestions.map((s, idx) => (
                    <li key={idx} className="leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
