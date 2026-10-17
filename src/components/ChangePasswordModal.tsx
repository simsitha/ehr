'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Info,
} from 'lucide-react';
import { formatLocalizedText } from '@/lib/translations';

export default function ChangePasswordModal() {
  const { activeModal, closeModal, currentPersona, language, showToast } = useApp();

  const isOpen = activeModal === 'change-password';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[0-9]/.test(newPassword) && /[a-zA-Z]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return Math.min(score, 3);
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return null;
    if (strength <= 1) {
      return {
        text: language === 'km' ? 'ខ្សោយ (Weak)' : 'Weak',
        color: 'text-rose-500',
        bg: 'bg-rose-500',
      };
    }
    if (strength === 2) {
      return {
        text: language === 'km' ? 'មធ្យម (Medium)' : 'Medium',
        color: 'text-amber-500',
        bg: 'bg-amber-500',
      };
    }
    return {
      text: language === 'km' ? 'ខ្លាំង (Strong)' : 'Strong',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500',
    };
  }, [newPassword, strength, language]);

  const isMatch = Boolean(confirmPassword && newPassword === confirmPassword);
  const isMismatch = Boolean(confirmPassword && newPassword !== confirmPassword);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage(
        language === 'km'
          ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន'
          : 'Please enter your current password'
      );
      return;
    }

    if (!newPassword) {
      setErrorMessage(
        language === 'km'
          ? 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី'
          : 'Please enter your new password'
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        language === 'km'
          ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ'
          : 'New password must be at least 6 characters long'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        language === 'km'
          ? 'ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ'
          : 'New password and confirmation do not match'
      );
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(
        language === 'km'
          ? 'ពាក្យសម្ងាត់ថ្មីមិនអាចដូចពាក្យសម្ងាត់បច្ចុប្បន្នបានទេ'
          : 'New password cannot be identical to your current password'
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentPersona.id,
          email: currentPersona.email,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || (language === 'km' ? 'មានបញ្ហាក្នុងការប្តូរពាក្យសម្ងាត់' : 'Failed to update password'));
        setSubmitting(false);
        return;
      }

      showToast(
        language === 'km'
          ? 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ ✓'
          : 'Your password has been changed successfully ✓',
        'success'
      );

      closeModal();
    } catch (err) {
      console.error('Change password failed:', err);
      setErrorMessage(
        language === 'km'
          ? 'មានបញ្ហាក្នុងការតភ្ជាប់ម៉ាស៊ីនមេ'
          : 'Network error communicating with the authentication server'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                {language === 'km' ? 'ប្តូរពាក្យសម្ងាត់គណនី' : 'Change Password'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់គណនីរបស់អ្នក'
                  : 'Set a new secure password for your account'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Account Strip */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <img
            src={currentPersona.avatar}
            alt={currentPersona.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {formatLocalizedText(currentPersona.name, language)}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  currentPersona.role === 'Admin'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : currentPersona.role === 'Manager'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {currentPersona.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-mono">
              {currentPersona.email || currentPersona.id}
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 font-bold ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. Current Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {language === 'km' ? '(ដើម៖ @9218njo0(TWp<3q"(3{)' : '(Default: @9218njo0(TWp<3q"(3{)'}
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Enter current password'}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 2. New Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound size={15} />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'km' ? 'យ៉ាងហោចណាស់ ៦ តួអក្សរ' : 'Minimum 6 characters'}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password strength visualizer */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    {language === 'km' ? 'កម្រិតសុវត្ថិភាព៖' : 'Strength:'}
                  </span>
                  {strengthLabel && (
                    <span className={`font-bold ${strengthLabel.color}`}>
                      {strengthLabel.text}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-1.5">
                  <div
                    className={`rounded-full transition-all ${
                      strength >= 1 ? (strengthLabel?.bg || 'bg-rose-500') : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all ${
                      strength >= 2 ? (strengthLabel?.bg || 'bg-amber-500') : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all ${
                      strength >= 3 ? (strengthLabel?.bg || 'bg-emerald-500') : 'bg-slate-200'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Confirm New Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <CheckCircle2 size={15} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'km' ? 'វាយបញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត' : 'Re-enter your new password'}
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all text-xs ${
                  isMismatch
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : isMatch
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/20'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Match feedback text */}
            {confirmPassword.length > 0 && (
              <div className="mt-1.5 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-100">
                {isMatch ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    {language === 'km' ? 'ពាក្យសម្ងាត់ទាំងពីរត្រូវគ្នា ✓' : 'Passwords match ✓'}
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {language === 'km' ? 'ពាក្យសម្ងាត់មិនទាន់ត្រូវគ្នាទេ' : 'Passwords do not match'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Security Tip Box */}
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/80 text-[11px] text-slate-600 flex items-start gap-2">
            <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
            <p>
              {language === 'km'
                ? 'បន្ទាប់ពីប្តូរពាក្យសម្ងាត់ អ្នកអាចប្រើប្រាស់ពាក្យសម្ងាត់ថ្មីនេះ ដើម្បីចូលប្រព័ន្ធ (Login) នាពេលក្រោយ។'
                : 'After changing your password, remember to use your new credentials when signing in next time.'}
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !currentPassword || !newPassword || !confirmPassword || isMismatch || newPassword.length < 6}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                submitting || !currentPassword || !newPassword || !confirmPassword || isMismatch || newPassword.length < 6
                  ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Updating...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{language === 'km' ? 'រក្សាទុកពាក្យសម្ងាត់ថ្មី' : 'Update Password'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
