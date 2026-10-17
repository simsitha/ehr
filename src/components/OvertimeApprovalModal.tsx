'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { OvertimeRequest } from '@/lib/types';
import { getOvertimeRateConfig } from '@/lib/overtime-calc';
import { formatLocalizedText } from '@/lib/translations';
import { X, CheckCircle2, XCircle, Clock, Calendar, DollarSign, Shield, FileText, UserCheck } from 'lucide-react';

interface OvertimeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: OvertimeRequest | null;
  onActionComplete: () => void;
}

export default function OvertimeApprovalModal({
  isOpen,
  onClose,
  request,
  onActionComplete,
}: OvertimeApprovalModalProps) {
  const { currentPersona, language, showToast, overtimeSettings } = useApp();
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !request) return null;

  const isAdmin = currentPersona.role === 'Admin';
  const isManager = currentPersona.role === 'Manager';
  const rateConfig = getOvertimeRateConfig(request.ot_rate_type, overtimeSettings?.rates);

  const handleAction = async (action: 'manager_approve' | 'manager_reject' | 'admin_approve' | 'admin_reject') => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/overtime/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewer_id: currentPersona.id,
          comments: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          action.includes('approve')
            ? language === 'km' ? 'បានអនុម័តសំណើថែមម៉ោងជោគជ័យ!' : 'Overtime request approved!'
            : language === 'km' ? 'បានបដិសេធសំណើថែមម៉ោង' : 'Overtime request rejected',
          action.includes('approve') ? 'success' : 'info'
        );
        onActionComplete();
        onClose();
      } else {
        showToast(data.error || 'Failed to update request', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Action error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            {request.employee_avatar ? (
              <img
                src={request.employee_avatar}
                alt={request.employee_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center border-2 border-indigo-500/20 shrink-0">
                {request.employee_name ? request.employee_name.trim().charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {formatLocalizedText(request.employee_name || '', language)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatLocalizedText(request.employee_role || '', language)} • {formatLocalizedText(request.department_name || '', language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Overtime Details Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>{request.date}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rateConfig.badgeBg} ${rateConfig.badgeBorder} ${rateConfig.badgeText}`}>
                {Math.round(rateConfig.multiplier * 100)}% - {language === 'km' ? rateConfig.label_km : rateConfig.label_en}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-500">{language === 'km' ? 'ម៉ោងថែម៖' : 'Time:'}</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {request.start_time} - {request.end_time} ({request.hours}h)
                </div>
              </div>
              <div>
                <span className="text-slate-500">{language === 'km' ? 'ប្រាក់ថែមម៉ោងប៉ាន់ស្មាន៖' : 'Estimated Pay:'}</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +${request.estimated_pay.toFixed(2)} USD
                </div>
              </div>
            </div>

            {request.project_name && (
              <div className="text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">{language === 'km' ? 'គម្រោងការងារ៖' : 'Project:'} </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{request.project_name}</span>
              </div>
            )}

            <div className="text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block mb-0.5">{language === 'km' ? 'មូលហេតុចាំបាច់៖' : 'Reason:'}</span>
              <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                &ldquo;{request.reason}&rdquo;
              </p>
            </div>
          </div>

          {/* Current Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">
              {language === 'km' ? 'ស្ថានភាពបច្ចុប្បន្ន៖' : 'Current Status:'}
            </span>
            <span className="font-bold text-indigo-900 dark:text-indigo-200 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700">
              {request.status}
            </span>
          </div>

          {/* Reviewer Comment Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'km' ? 'មតិយោបល់ពិនិត្យ / អនុម័ត' : 'Reviewer Comments (Optional)'}
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === 'km' ? 'ឧ. បានផ្ទៀងផ្ទាត់ការងាររួចរាល់...' : 'e.g. Verified project deployment...'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បិទ' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {/* Reject Button */}
            <button
              type="button"
              disabled={processing}
              onClick={() => handleAction(isAdmin ? 'admin_reject' : 'manager_reject')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <XCircle size={14} />
              <span>{language === 'km' ? 'បដិសេធ (Reject)' : 'Reject'}</span>
            </button>

            {/* Approve Button */}
            {isAdmin ? (
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('admin_approve')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-600/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{processing ? '...' : (language === 'km' ? 'អនុម័តចុងក្រោយ (Final Approve)' : 'Final Approve')}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAction('manager_approve')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{processing ? '...' : (language === 'km' ? 'អនុម័ត (បញ្ជូនទៅ Admin)' : 'Approve to Admin')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
