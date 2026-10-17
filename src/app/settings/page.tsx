'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Settings,
  Database,
  Building,
  Code,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Coins,
  MapPin,
  Save,
  Loader2,
  Shield,
  Edit2,
  Scale,
  Layers,
  RotateCcw,
  AlertTriangle,
  HardDriveDownload,
  HardDriveUpload,
} from 'lucide-react';
import OvertimeRateEditModal from '@/components/OvertimeRateEditModal';
import ShiftTemplateEditModal from '@/components/ShiftTemplateEditModal';
import DatabaseRestoreModal from '@/components/DatabaseRestoreModal';
import { OVERTIME_RATES, STANDARD_MONTHLY_HOURS } from '@/lib/overtime-calc';
import { getShiftList } from '@/lib/roster-shifts';
import { DatabaseStats } from '@/lib/types';

function maskDatabaseSource(source?: string): string {
  if (!source) return 'PostgreSQL (hrm_db)';
  try {
    const url = new URL(source);
    if (url.username || url.password) {
      url.username = '***';
      url.password = '***';
    }
    return url.toString();
  } catch {
    return source.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }
}

export default function SettingsPage() {
  const {
    showToast,
    language,
    openModal,
    currentPersona,
    companySettings,
    updateCompanySettingsContext,
    overtimeSettings,
    shiftSettings,
  } = useApp();
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const isManagerOrAdmin = currentPersona.role === 'Manager' || currentPersona.role === 'Admin';

  const [formData, setFormData] = useState({
    name: companySettings?.name || 'HESTRA-GLOVES HRM (Cambodia) Ltd',
    address: companySettings?.address || 'Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia',
    currency: companySettings?.currency || (language === 'km' ? 'USD ($) & KHR (៛)' : 'USD ($) & KHR'),
    workHours: companySettings?.workHours || '8.0',
    timezone: companySettings?.timezone || 'Asia/Phnom_Penh (GMT+7)',
    fiscalYearStart: companySettings?.fiscalYearStart || 'January 1st',
  });
  const [saving, setSaving] = useState(false);

  // Synchronize form when companySettings loads or updates from backend
  useEffect(() => {
    if (companySettings) {
      setFormData({
        name: companySettings.name || '',
        address: companySettings.address || '',
        currency: companySettings.currency || '',
        workHours: companySettings.workHours || '8.0',
        timezone: companySettings.timezone || 'Asia/Phnom_Penh (GMT+7)',
        fiscalYearStart: companySettings.fiscalYearStart || 'January 1st',
      });
    }
  }, [companySettings]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateCompanySettingsContext(formData);
    setSaving(false);
    if (success) {
      showToast(
        language === 'km'
          ? `បានរក្សាទុកព័ត៌មានក្រុមហ៊ុន "${formData.name}" ដោយជោគជ័យ! ✓`
          : `Corporate settings for "${formData.name}" saved successfully! ✓`,
        'success'
      );
    } else {
      showToast(
        language === 'km'
          ? 'មានបញ្ហាក្នុងការរក្សាទុកការកំណត់ សូមព្យាយាមម្តងទៀត'
          : 'Failed to save corporate settings. Please try again.',
        'error'
      );
    }
  };

  const fetchDbDiagnostics = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/settings/database/backups');
      const data = await res.json();
      if (res.ok && data.success && data.diagnostics) {
        setDbStats(data.diagnostics);
      }
    } catch (err) {
      console.warn('Failed to load database diagnostics:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDbDiagnostics();
  }, []);

  const handleBackupDatabase = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/settings/database/backup');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || (language === 'km' ? 'បរាជ័យក្នុងការទាញយកឯកសារបម្រុងទុក' : 'Failed to download SQLite backup')
        );
      }

      const contentDisposition = res.headers.get('content-disposition');
      let fileName = `hestrahrm_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      showToast(
        language === 'km'
          ? `បានទាញយកឯកសារបម្រុងទុក SQLite (${fileName}, ${sizeMb} MB) ដោយជោគជ័យ! ✓`
          : `SQLite database backup downloaded successfully! (${fileName}, ${sizeMb} MB) ✓`,
        'success'
      );
      fetchDbDiagnostics();
    } catch (err: any) {
      showToast(
        err.message || (language === 'km' ? 'កំហុសក្នុងការបង្កើតឯកសារបម្រុងទុក' : 'Error generating database backup'),
        'error'
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/settings/database/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          language === 'km'
            ? 'មូលដ្ឋានទិន្នន័យ SQLite ត្រូវបានកំណត់ឡើងវិញដោយជោគជ័យ!'
            : 'SQLite database reset to initial baseline state successfully! ✓',
          'success'
        );
        setIsResetModalOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 900);
      } else {
        showToast(
          data.error || (language === 'km' ? 'បរាជ័យក្នុងការកំណត់ទិន្នន័យឡើងវិញ' : 'Failed to reset database'),
          'error'
        );
      }
    } catch (err: any) {
      showToast(
        err.message || (language === 'km' ? 'កំហុសបណ្តាញក្នុងការកំណត់ទិន្នន័យ' : 'Network error resetting database'),
        'error'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="text-slate-700" size={26} />
          {language === 'km' ? 'ការកំណត់ប្រព័ន្ធ & រចនាសម្ព័ន្ធស្ថាប័ន' : 'System Settings & Platform Configuration'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'km'
            ? 'គ្រប់គ្រងព័ត៌មានក្រុមហ៊ុន ច្បាប់បៀវត្សរ៍ ស្ថានភាពទិន្នន័យ SQLite និងសុវត្ថិភាពគណនី'
            : 'Manage corporate parameters, payroll currency, database state, and platform diagnostics'}
        </p>
      </div>

      {/* Live Corporate Entity Preview Card */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-5 rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20 shrink-0">
            <Building size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                {language === 'km' ? 'ស្ថាប័នផ្លូវការសកម្ម' : 'Active Legal Entity'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 size={13} />
                <span>{language === 'km' ? 'បានផ្ទៀងផ្ទាត់' : 'Verified'}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {companySettings?.name || formData.name}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span>{companySettings?.address || formData.address}</span>
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs font-semibold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-indigo-100 self-stretch sm:self-auto justify-between sm:justify-center">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-amber-500" />
            <span>{companySettings?.currency || formData.currency}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock size={13} className="text-indigo-400" />
            <span>{companySettings?.workHours || formData.workHours}h / day</span>
          </div>
        </div>
      </div>

      {/* Database State & Diagnostics */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database size={18} className="text-emerald-600" />
              SQLite Embedded Database & Diagnostics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'km'
                ? 'មូលដ្ឋានទិន្នន័យ SQLite ក្នុងស្រុកល្បឿនលឿន ស្របតាមស្តង់ដារ ACID ផ្ទុកបុគ្គលិក វត្តមាន និងបៀវត្សរ៍'
                : 'Fast, ACID-compliant local database storing employees, timesheets, payroll, and jobs'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              {dbStats?.journalMode ? `${dbStats.journalMode} Mode` : 'WAL Mode'} • Healthy
            </span>
            {isManagerOrAdmin && (
              <>
                <button
                  type="button"
                  disabled={isBackingUp}
                  onClick={handleBackupDatabase}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-xl border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-600 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                  title={language === 'km' ? 'បម្រុងទុកទិន្នន័យ SQLite' : 'Backup Database SQLite'}
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{language === 'km' ? 'កំពុងទាញយក...' : 'Backing up...'}</span>
                    </>
                  ) : (
                    <>
                      <HardDriveDownload size={13} />
                      <span>{language === 'km' ? 'បម្រុងទុក SQLite' : 'Backup SQLite'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-xl border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title={language === 'km' ? 'ស្តារទិន្នន័យឡើងវិញ' : 'Restore Database'}
                >
                  <HardDriveUpload size={13} />
                  <span>{language === 'km' ? 'ស្តារទិន្នន័យ (Restore)' : 'Restore Database'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title={language === 'km' ? 'កំណត់មូលដ្ឋានទិន្នន័យឡើងវិញ' : 'Reset SQLite database to baseline'}
                >
                  <RotateCcw size={13} />
                  <span>{language === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Engine</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{dbStats?.engine || 'PostgreSQL'}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Database Source</span>
            <span
              className="font-semibold text-slate-800 dark:text-slate-200 truncate block font-mono text-[11px]"
              title={maskDatabaseSource(dbStats?.databasePath || 'PostgreSQL (hrm_db)')}
            >
              {maskDatabaseSource(dbStats?.databasePath || 'PostgreSQL (hrm_db)')} {dbStats ? `(${dbStats.fileSizeFormatted})` : ''}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">
              {language === 'km' ? 'តារាង & កំណត់ត្រាសរុប' : 'Tables & Records'}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {dbStats
                ? `${dbStats.totalTables} tables (${dbStats.totalRecords.toLocaleString()} rows)`
                : '23 tables'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Journal & Integrity</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">WAL • Foreign Keys ON</span>
          </div>
        </div>

        {isManagerOrAdmin && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {language === 'km' ? 'ប្រតិបត្តិការទិន្នន័យ & ថែទាំប្រព័ន្ធ' : 'Database Maintenance & Recovery Operations'}
              </span>
              {dbStats?.backups && dbStats.backups.length > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {dbStats.backups.length} {language === 'km' ? 'snapshots លើ server' : 'snapshots on server'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Backup Database SQLite */}
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <HardDriveDownload size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{language === 'km' ? 'បម្រុងទុកទិន្នន័យ SQLite' : 'Backup Database SQLite'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                    {language === 'km'
                      ? 'ទាញយកឯកសារ SQLite snapshot (.sqlite) ផ្ទុកគ្រប់តារាងទាំងអស់ភ្លាមៗ'
                      : 'Download a clean, ACID-compliant SQLite binary snapshot (.sqlite) containing all 23 tables and audit logs.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isBackingUp}
                  onClick={handleBackupDatabase}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{language === 'km' ? 'កំពុងទាញយក...' : 'Downloading...'}</span>
                    </>
                  ) : (
                    <>
                      <HardDriveDownload size={14} />
                      <span>{language === 'km' ? 'Backup Database SQLite' : 'Backup Database SQLite'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Restore Database */}
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                    <HardDriveUpload size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{language === 'km' ? 'ស្តារទិន្នន័យឡើងវិញ' : 'Restore Database'}</span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
                    {language === 'km'
                      ? 'ស្តារទិន្នន័យពីឯកសារ SQLite/SQL ឬពី server snapshots ដោយមាន safety backup ស្វ័យប្រវត្តិ'
                      : 'Restore database from an uploaded .sqlite/.db file or server snapshot with automatic rollback guard.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <HardDriveUpload size={14} />
                  <span>{language === 'km' ? 'Restore Database' : 'Restore Database'}</span>
                </button>
              </div>

              {/* Card 3: Reset Database */}
              <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    <RotateCcw size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{language === 'km' ? 'កំណត់ទិន្នន័យឡើងវិញ' : 'Reset Database'}</span>
                  </div>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                    {language === 'km'
                      ? 'កំណត់ SQLite ទៅកាន់ទម្រង់ដើមរោងចក្រ (ប្រព័ន្ធបង្កើត safety backup .bak ជាមុន)'
                      : 'Reset SQLite database to baseline. An automatic safety backup (.bak) is created prior to resetting.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-bold text-rose-600 hover:text-white bg-white dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>{language === 'km' ? 'Reset Database' : 'Reset Database'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Security & Password */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {language === 'km' ? 'សុវត្ថិភាពគណនី & ពាក្យសម្ងាត់' : 'Account Security & Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'គ្រប់គ្រងពាក្យសម្ងាត់ផ្ទាល់ខ្លួនរបស់អ្នក ដើម្បីការពារគណនីក្នុងប្រព័ន្ធ HESTRA HRM'
                  : 'Manage your credentials and change your password to keep your account secure'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700">{currentPersona.name}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-mono">{currentPersona.email || currentPersona.id}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentPersona.role}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal('change-password')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <KeyRound size={15} />
            <span>{language === 'km' ? 'ប្តូរពាក្យសម្ងាត់ (Change Password)' : 'Change Password'}</span>
          </button>
        </div>
      </div>

      {/* Corporate Parameters Form */}
      <form onSubmit={handleSaveCompany} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building size={18} className="text-indigo-600" />
              {language === 'km' ? 'ប៉ារ៉ាម៉ែត្រទូទៅរបស់ក្រុមហ៊ុន' : 'Corporate Parameters'}
            </h2>
            <p className="text-slate-500 mt-0.5">
              {language === 'km'
                ? 'ឈ្មោះនីតិបុគ្គលផ្លូវការ រូបិយប័ណ្ណបៀវត្សរ៍ ម៉ោងធ្វើការស្តង់ដារ និងទីស្នាក់ការកណ្តាល'
                : 'Global payroll currency, standard hours, headquarters address, and fiscal calendar'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'km' ? 'ឈ្មោះស្ថាប័ន / ក្រុមហ៊ុនផ្លូវការ' : 'Company Legal Entity'}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="e.g. HESTRA-GLOVES HRM (Cambodia) Ltd"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'km' ? 'និមិត្តសញ្ញារូបិយប័ណ្ណ & កូដ' : 'Currency Symbol & Code'}
            </label>
            <input
              type="text"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder={language === 'km' ? 'ឧ. USD ($) & KHR (៛)' : 'e.g. USD ($) & KHR'}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            {language === 'km' ? 'អាសយដ្ឋានទីស្នាក់ការកណ្តាល' : 'Headquarters Address'}
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            placeholder="e.g. Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'km' ? 'ម៉ោងការងារស្តង់ដារ/ថ្ងៃ' : 'Standard Daily Work Hours'}
            </label>
            <input
              type="text"
              required
              value={formData.workHours}
              onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="8.0"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'km' ? 'តំបន់ម៉ោងប្រព័ន្ធ' : 'System Timezone'}
            </label>
            <input
              type="text"
              required
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Asia/Phnom_Penh (GMT+7)"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'km' ? 'ដើមឆ្នាំសារពើពន្ធ' : 'Fiscal Year Start'}
            </label>
            <input
              type="text"
              required
              value={formData.fiscalYearStart}
              onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="January 1st"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {language === 'km'
              ? '* ការផ្លាស់ប្តូរនឹងត្រូវរក្សាទុកក្នុងមូលដ្ឋានទិន្នន័យ SQLite ជាអចិន្ត្រៃយ៍'
              : '* Changes are saved permanently to the SQLite database'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{language === 'km' ? 'រក្សាទុកការកំណត់' : 'Save Corporate Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Cambodian Labor Law Statutory Overtime Rates Configuration */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'km'
                    ? 'អត្រាប្រាក់ថែមម៉ោងស្របច្បាប់កម្ពុជា & ម៉ោងស្តង់ដារ'
                    : 'Cambodian Labor Law Statutory Overtime Rates'}
                </h2>
                {overtimeSettings?.isCustomized ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {language === 'km' ? 'អត្រាកែប្រែផ្ទាល់ខ្លួន' : 'Customized'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {language === 'km' ? 'អត្រាច្បាប់ស្តង់ដារ' : 'Statutory Standard'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'km'
                  ? 'កំណត់អត្រាគុណប្រាក់ឈ្នួលថែមម៉ោង (មាត្រា ១៣៩, ១៤៤, ១៤៧, ១៦២) និងចំនួនម៉ោងស្តង់ដារប្រចាំខែ (២០៨ ម៉ោង)'
                  : 'Statutory overtime multipliers (Articles 139, 144, 147, 162) and standard monthly divisor (208 hrs)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
              {overtimeSettings?.standardMonthlyHours || STANDARD_MONTHLY_HOURS}h / month
            </span>
            {isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => setIsOvertimeModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 size={13} />
                <span>{language === 'km' ? 'កែប្រែអត្រា (Edit Rates)' : 'Edit Overtime Rates'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Statutory Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(overtimeSettings?.rates || OVERTIME_RATES).map((rate) => (
            <div
              key={rate.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${rate.badgeBg} ${rate.badgeBorder}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${rate.badgeText}`}>
                    {Math.round(rate.multiplier * 100)}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono">
                    {rate.law_reference}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {language === 'km' ? rate.label_km : rate.label_en}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'km' ? rate.description_km : rate.description_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duty Roster Shift Templates & Legend Configuration */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'km'
                    ? 'គំរូវេនការងារ & កំណត់សម្គាល់ (Shift Templates & Legend)'
                    : 'Duty Roster Shift Templates & Legend'}
                </h2>
                {shiftSettings?.isCustomized ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {language === 'km' ? 'កែប្រែផ្ទាល់ខ្លួន' : 'Customized'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {language === 'km' ? 'គំរូស្តង់ដារ' : 'Standard Templates'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'km'
                  ? 'កំណត់កាលវិភាគវេន ម៉ោងការងារស្តង់ដារ កូដកាត់ និងពណ៌សម្គាល់សម្រាប់តារាងវេន'
                  : 'Configure shift timings, standard hours, short codes, and color legend for team roster'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
              {Object.keys(shiftSettings?.shifts || {}).length} {language === 'km' ? 'វេន' : 'Shifts'}
            </span>
            {isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 size={13} />
                <span>{language === 'km' ? 'កែប្រែវេន (Edit Shifts)' : 'Edit Shift Templates'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Shift Template Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {getShiftList(shiftSettings?.shifts).map((s) => (
            <div
              key={s.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${s.badgeBg} ${s.badgeBorder}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${s.badgeText}`}>
                  {s.short_code}
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {language === 'km' ? s.name_km : s.name_en}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {s.start_time ? `${s.start_time}-${s.end_time}` : '0.0h OFF'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Callout */}
      <div className="relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2">
          <Code className="text-cyan-400" size={18} />
          <h3 className="font-bold text-sm">System Architecture & Modern Stack</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Built natively with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, and PostgreSQL (hrm_db) with enterprise connection pooling. Features RESTful micro-endpoints, real-time punch clocks, itemized payslip generation with browser print support, and full-fidelity applicant tracking.
        </p>
      </div>

      <OvertimeRateEditModal
        isOpen={isOvertimeModalOpen}
        onClose={() => setIsOvertimeModalOpen(false)}
      />

      <ShiftTemplateEditModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      <DatabaseRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onSuccess={fetchDbDiagnostics}
      />

      {/* Reset Database Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-100 dark:border-rose-900 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'km' ? 'កំណត់ទិន្នន័យ SQLite ឡើងវិញ? (Reset Database)' : 'Reset SQLite Database?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'km'
                    ? 'តើអ្នកប្រាកដជាចង់កំណត់ទិន្នន័យ SQLite ទៅកាន់ទម្រង់ដើមវិញដែរឬទេ? ប្រព័ន្ធនឹងបង្កើតឯកសារបម្រុងទុក (Safety Backup) ដោយស្វ័យប្រវត្តិមុនពេលកំណត់ឡើងវិញ។'
                    : 'Are you sure you want to reset the SQLite database to its initial clean baseline state? A safety backup will be created automatically before proceeding.'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Database size={13} />
                <span>{language === 'km' ? 'សេចក្តីលម្អិតអំពីការកំណត់ឡើងវិញ៖' : 'Reset Details:'}</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-700 dark:text-amber-300 space-y-0.5">
                <li>{language === 'km' ? 'ទិន្នន័យចាស់នឹងត្រូវរក្សាទុកជា safety backup (data/hr.db.bak.*)' : 'Current DB backed up to data/hr.db.bak.*'}</li>
                <li>{language === 'km' ? 'ស្តារទិន្នន័យបុគ្គលិក នាយកដ្ឋាន និងប្រាក់បៀវត្សរ៍លំនាំដើម' : 'Restores initial departments, employees & payroll'}</li>
                <li>{language === 'km' ? 'គណនីគ្រប់គ្រងដើមដំណើរការធម្មតា (sitha / @9218njo0(TWp<3q"(3{)' : 'Default admin logins remain active (sitha / @9218njo0(TWp<3q"(3{)'}</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDatabase}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{language === 'km' ? 'កំពុងកំណត់ឡើងវិញ...' : 'Resetting...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>{language === 'km' ? 'យល់ព្រម កំណត់ឡើងវិញ' : 'Yes, Reset Database'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
