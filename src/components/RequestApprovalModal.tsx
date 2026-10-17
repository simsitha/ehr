'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ApprovalRequest } from '@/lib/types';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Building2,
  DollarSign,
  Package,
  Laptop,
  Monitor,
  User,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestItem: ApprovalRequest | null;
  onSuccess?: () => void;
}

export default function RequestApprovalModal({
  isOpen,
  onClose,
  requestItem,
  onSuccess,
}: RequestApprovalModalProps) {
  const { currentPersona, language, showToast } = useApp();
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false);

  if (!isOpen || !requestItem) return null;

  const userRole = currentPersona?.role || 'Employee';
  const isCeoOrTopMgmt =
    currentPersona?.name?.toLowerCase().includes('ceo') ||
    currentPersona?.email?.toLowerCase().includes('ceo') ||
    (currentPersona as any)?.username === 'ceo' ||
    userRole === 'Admin';

  const isHrAdmin = userRole === 'Admin';
  const isLineManager = userRole === 'Manager' || userRole === 'Admin';

  // Determine which action button the current user can execute
  const canApproveLineManager =
    requestItem.status === 'Pending Line Manager' && isLineManager;

  const canApproveHr =
    requestItem.status === 'Pending HR' && isHrAdmin;

  const canApproveTopMgmt =
    requestItem.status === 'Pending Top Management' && isCeoOrTopMgmt;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comments.trim()) {
      showToast(
        language === 'km' ? 'សូមបញ្ចូលមូលហេតុនៃការបដិសេធ' : 'Please provide a reason for rejection',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // Determine stage
      let stage: 'line_manager' | 'hr' | 'top_management' = 'line_manager';
      if (requestItem.status === 'Pending HR') stage = 'hr';
      else if (requestItem.status === 'Pending Top Management') stage = 'top_management';

      const res = await fetch(`/api/requests/${requestItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          stage,
          reviewer_id: currentPersona.id,
          reviewer_name: currentPersona.name,
          comments,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          action === 'approve'
            ? language === 'km'
              ? 'បានអនុម័តសំណើជោគជ័យ!'
              : 'Request approved successfully!'
            : language === 'km'
            ? 'បានបដិសេធសំណើ'
            : 'Request rejected',
          action === 'approve' ? 'success' : 'info'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Failed to update request', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating approval', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isSalary =
    requestItem.request_type === 'Salary Increase' ||
    requestItem.item_category === 'salary_increase';

  const isHighValue = requestItem.requires_top_management === 1;

  const canDelete =
    userRole === 'Admin' ||
    userRole === 'Manager' ||
    requestItem.employee_id === currentPersona.id;

  const handleDeleteRequest = async () => {
    if (!requestItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${requestItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (language === 'km' ? 'បរាជ័យក្នុងការលុបសំណើ' : 'Failed to delete request'));
      }
      showToast(
        language === 'km'
          ? `បានលុបសំណើ #${requestItem.request_number} ដោយជោគជ័យ!`
          : `Request #${requestItem.request_number} deleted successfully!`,
        'success'
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error deleting request', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white relative">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirmDeleteMode(!confirmDeleteMode)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
                title={language === 'km' ? 'លុបសំណើនេះ' : 'Delete Request'}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
              {requestItem.request_number}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                requestItem.status === 'Approved'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  : requestItem.status === 'Rejected'
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  : requestItem.status === 'Pending Top Management'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                  : requestItem.status === 'Pending HR'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                  : 'bg-blue-900/60 text-blue-300 border border-blue-700'
              }`}
            >
              {requestItem.status}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">{requestItem.item_name}</h2>
          <p className={`text-xs text-slate-400 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'ពិនិត្យ និងអនុម័តសំណើបុគ្គលិកតាមឋានានុក្រម' : 'Multi-tier verification & executive sign-off'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* CONFIRM DELETE CARD */}
          {confirmDeleteMode && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                    {language === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបសំណើនេះ?' : 'Permanently Delete this Request?'}
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    {language === 'km'
                      ? `សំណើលេខ #${requestItem.request_number} សម្រាប់ "${requestItem.item_name}" នឹងត្រូវលុបជាអចិន្ត្រៃយ៍ចេញពីប្រព័ន្ធ។`
                      : `Request #${requestItem.request_number} for "${requestItem.item_name}" will be permanently removed from the system.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteMode(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteRequest}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{language === 'km' ? 'កំពុងលុប...' : 'Deleting...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>{language === 'km' ? 'យល់ព្រម លុបសំណើ' : 'Yes, Delete Request'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* REQUESTER INFO CARD */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {requestItem.employee_avatar ? (
                <img
                  src={requestItem.employee_avatar}
                  alt={requestItem.employee_name || 'Staff'}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-200 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center ring-2 ring-indigo-200 shrink-0">
                  {requestItem.employee_name ? requestItem.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {requestItem.employee_name || 'Staff Member'}
                </h4>
                <p className={`text-[11px] text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {requestItem.employee_role} • {requestItem.department_name}
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{requestItem.created_at ? requestItem.created_at.split('T')[0] : 'Today'}</span>
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 block mt-0.5">
                Priority: {requestItem.urgency}
              </span>
            </div>
          </div>

          {/* ITEM / SALARY DETAILS */}
          {isSalary ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'km' ? 'ប្រាក់បៀវត្សរ៍បច្ចុប្បន្ន' : 'Current Base Salary'}
                </span>
                <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                  ${Number(requestItem.current_salary).toLocaleString()} / mo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {language === 'km' ? 'ប្រាក់បៀវត្សរ៍ស្នើសុំថ្មី' : 'Proposed New Salary'}
                </span>
                <span className="text-sm font-black font-mono text-indigo-700 dark:text-indigo-300">
                  ${Number(requestItem.proposed_salary).toLocaleString()} / mo
                </span>
              </div>
              <div className="pt-2 border-t border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {language === 'km' ? 'ចំនួនបន្ថែមសុទ្ធ (Net Delta):' : 'Requested Net Increase:'}
                </span>
                <span className="font-black font-mono text-emerald-600">
                  +${(Number(requestItem.proposed_salary) - Number(requestItem.current_salary)).toLocaleString()} / mo
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Quantity:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {requestItem.quantity} unit(s)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Estimated Budget:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  ${Number(requestItem.estimated_cost).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* REASON & SPECIFICATIONS */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              {language === 'km' ? 'មូលហេតុ និងហេតុផលការងារ៖' : 'Business Justification:'}
            </h4>
            <div className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {requestItem.reason}
            </div>
            {requestItem.specifications && (
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold">Specs:</span> {requestItem.specifications}
              </p>
            )}
          </div>

          {/* MULTI-TIER APPROVAL PROGRESS STEPPER */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'km' ? 'ខ្សែសង្វាក់នៃការអនុម័ត ៣ ដំណាក់កាល៖' : 'Multi-Tier Approval Timeline:'}
            </h4>

            <div className="space-y-2.5">
              {/* Stage 1: Line Manager */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    requestItem.line_manager_status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : requestItem.line_manager_status === 'Rejected'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {requestItem.line_manager_status === 'Approved' ? (
                    <CheckCircle2 size={16} />
                  ) : requestItem.line_manager_status === 'Rejected' ? (
                    <XCircle size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Tier 1: Line Manager Approval
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        requestItem.line_manager_status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : requestItem.line_manager_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {requestItem.line_manager_status}
                    </span>
                  </div>
                  {requestItem.line_manager_comments && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                      &ldquo;{requestItem.line_manager_comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Stage 2: HR Department */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    requestItem.hr_status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : requestItem.hr_status === 'Rejected'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  }`}
                >
                  {requestItem.hr_status === 'Approved' ? (
                    <CheckCircle2 size={16} />
                  ) : requestItem.hr_status === 'Rejected' ? (
                    <XCircle size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Tier 2: HR Department Approval
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        requestItem.hr_status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : requestItem.hr_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {requestItem.hr_status}
                    </span>
                  </div>
                  {!isHighValue && (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      ✓ Material Final Sign-Off (Does not require Top Management)
                    </span>
                  )}
                  {requestItem.hr_comments && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                      &ldquo;{requestItem.hr_comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Stage 3: Top Management */}
              <div
                className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 ${
                  !isHighValue ? 'opacity-50' : ''
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    requestItem.top_management_status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : requestItem.top_management_status === 'Rejected'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : isHighValue
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {requestItem.top_management_status === 'Approved' ? (
                    <CheckCircle2 size={16} />
                  ) : requestItem.top_management_status === 'Rejected' ? (
                    <XCircle size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Tier 3: Top Management (CEO) Approval
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        requestItem.top_management_status === 'Approved'
                           ? 'bg-emerald-50 text-emerald-700'
                          : requestItem.top_management_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : isHighValue
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {requestItem.top_management_status}
                    </span>
                  </div>
                  {isHighValue ? (
                    <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                      ⚠️ Required for: {requestItem.item_name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Not required for standard materials
                    </span>
                  )}
                  {requestItem.top_management_comments && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                      &ldquo;{requestItem.top_management_comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* APPROVAL ACTION CONTROLS */}
          {(canApproveLineManager || canApproveHr || canApproveTopMgmt) && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {rejectionMode
                    ? language === 'km'
                      ? 'មូលហេតុបដិសេធ (Rejection Reason) *'
                      : 'Rejection Reason *'
                    : language === 'km'
                    ? 'មតិយោបល់អនុម័ត (Approval Comments - Optional)'
                    : 'Reviewer Comments (Optional)'}
                </label>
                <textarea
                  rows={2}
                  required={rejectionMode}
                  placeholder={
                    rejectionMode
                      ? 'Provide detailed reason for turning down this request...'
                      : 'e.g. Approved. Proceed with procurement / payroll schedule.'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectionMode(!rejectionMode)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    {rejectionMode
                      ? language === 'km'
                        ? 'ត្រឡប់ទៅការអនុម័តវិញ'
                        : 'Back to Approval'
                      : language === 'km'
                      ? 'បដិសេធសំណើនេះ'
                      : 'Reject this Request'}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setConfirmDeleteMode(!confirmDeleteMode)}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>{language === 'km' ? 'លុបសំណើ' : 'Delete Request'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {language === 'km' ? 'បិទ' : 'Close'}
                  </button>

                  {rejectionMode ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleAction('reject')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle size={14} />
                      <span>{language === 'km' ? 'បញ្ជាក់ការបដិសេធ' : 'Confirm Rejection'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleAction('approve')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>
                        {canApproveTopMgmt
                          ? language === 'km'
                            ? 'អនុម័តចុងក្រោយ (CEO Approval)'
                            : 'Top Management Sign-Off'
                          : canApproveHr
                          ? !isHighValue
                            ? language === 'km'
                              ? 'អនុម័តចុងក្រោយ (HR Final)'
                              : 'Grant Final HR Approval'
                            : language === 'km'
                            ? 'អនុម័ត & បញ្ជូនទៅកាន់ CEO'
                            : 'Approve & Forward to CEO'
                          : language === 'km'
                          ? 'អនុម័ត & បញ្ជូនទៅកាន់ HR'
                          : 'Approve as Line Manager'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!(canApproveLineManager || canApproveHr || canApproveTopMgmt) && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {canDelete ? (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteMode(!confirmDeleteMode)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white rounded-xl border border-rose-200 dark:border-rose-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>{language === 'km' ? 'លុបសំណើនេះ' : 'Delete Request'}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
