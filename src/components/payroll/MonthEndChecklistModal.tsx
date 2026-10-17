'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface MonthEndChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  periodName: string;
  onConfirmLock: () => Promise<void>;
}

export default function MonthEndChecklistModal({
  isOpen,
  onClose,
  periodId,
  periodName,
  onConfirmLock,
}: MonthEndChecklistModalProps) {
  const { language } = useApp();

  const [checks, setChecks] = useState({
    attendanceVerified: true,
    leavesDebited: true,
    overtimeApproved: true,
    sewingProductionTallied: true,
    nssfGdtRatesConfirmed: true,
    varianceReviewed: true,
  });

  const [locking, setLocking] = useState(false);

  if (!isOpen) return null;

  const allChecked = Object.values(checks).every(Boolean);

  const handleLock = async () => {
    setLocking(true);
    try {
      await onConfirmLock();
      onClose();
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Month-End Verification & Period Lock
              </h3>
              <p className="text-xs text-slate-500">
                Locking <span className="font-bold text-slate-800">{periodName}</span> ({periodId})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Locking this payroll period prevents further edits to daily attendance, overtime hours, and salary calculations. Re-opening requires explicit administrative authorization.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wide block text-[11px]">
            Required Audit Checklist:
          </span>

          {[
            {
              key: 'attendanceVerified',
              label: '1. Monthly Attendance Calendar & 01-31 matrix verified (133 active factory employees)',
            },
            {
              key: 'leavesDebited',
              label: '2. All Leave Requests (AL, SL, ML) approved and debited from staff balances',
            },
            {
              key: 'overtimeApproved',
              label: '3. Overtime requests completed two-stage approval (Line Manager & Admin)',
            },
            {
              key: 'sewingProductionTallied',
              label: '4. Weekly sewing production targets & tiers tallied and aggregated into monthly bonuses',
            },
            {
              key: 'nssfGdtRatesConfirmed',
              label: '5. NSSF (4,049 KHR) & General Department of Taxation Salary Tax (4,044 KHR) verified',
            },
            {
              key: 'varianceReviewed',
              label: '6. Net take-home variance reviewed against preceding month disbursement baseline',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={(checks as any)[item.key]}
                onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-slate-700 font-medium leading-relaxed">{item.label}</span>
            </label>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" /> Authorized HR Action
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLock}
              disabled={!allChecked || locking}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} />
              {locking ? 'Locking Period...' : 'Confirm & Lock Payroll'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
