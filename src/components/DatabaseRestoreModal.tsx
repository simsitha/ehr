'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  UploadCloud,
  Database,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Server,
  Loader2,
  HardDriveUpload,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DatabaseBackupItem, RestoreResult } from '@/lib/types';

interface DatabaseRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DatabaseRestoreModal({
  isOpen,
  onClose,
  onSuccess,
}: DatabaseRestoreModalProps) {
  const { showToast, language } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'server'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverBackups, setServerBackups] = useState<DatabaseBackupItem[]>([]);
  const [selectedServerBackup, setSelectedServerBackup] = useState<string | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchServerBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/settings/database/backups');
      const data = await res.json();
      if (res.ok && data.success && data.diagnostics?.backups) {
        setServerBackups(data.diagnostics.backups);
      }
    } catch (err: any) {
      console.warn('Could not fetch server backups list:', err);
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  // Fetch available backups from server when modal is opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setRestoreResult(null);
      setSelectedFile(null);
      setSelectedServerBackup(null);
      fetchServerBackups();
    }
  }, [isOpen, fetchServerBackups]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.match(/\.(sqlite|db|sqlite3|sql)$/i)) {
      setErrorMsg(
        language === 'km'
          ? 'សូមជ្រើសរើសឯកសារ SQLite (.sqlite, .db, .sqlite3) ឬ SQL script (.sql)'
          : 'Please select a valid SQLite (.sqlite, .db, .sqlite3) or SQL script (.sql) file.'
      );
      setSelectedFile(null);
      return;
    }
    if (file.size === 0) {
      setErrorMsg(language === 'km' ? 'ឯកសារទទេ (0 bytes)' : 'Selected file is empty (0 bytes).');
      setSelectedFile(null);
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg(
        language === 'km'
          ? 'ទំហំឯកសារធំពេក (អតិបរមា 150 MB)'
          : 'File size too large. Maximum supported backup upload is 150 MB.'
      );
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteRestore = async () => {
    setErrorMsg(null);
    setIsRestoring(true);

    try {
      let res: Response;

      if (activeTab === 'upload') {
        if (!selectedFile) {
          setErrorMsg(
            language === 'km' ? 'សូមជ្រើសរើសឯកសារបម្រុងទុកជាមុនសិន' : 'Please select a backup file to restore.'
          );
          setIsRestoring(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        res = await fetch('/api/settings/database/restore', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!selectedServerBackup) {
          setErrorMsg(
            language === 'km'
              ? 'សូមជ្រើសរើស snapshot ពីម៉ាស៊ីនបម្រើជាមុនសិន'
              : 'Please select a server snapshot to restore.'
          );
          setIsRestoring(false);
          return;
        }

        res = await fetch('/api/settings/database/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileName: selectedServerBackup }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (language === 'km' ? 'បរាជ័យក្នុងការស្តារទិន្នន័យ' : 'Failed to restore database'));
      }

      // Success
      setRestoreResult(data);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(
        language === 'km'
          ? `បានស្តារមូលដ្ឋានទិន្នន័យឡើងវិញដោយជោគជ័យ! (${data.totalTables} តារាង, ${data.totalRecords} កំណត់ត្រា)`
          : `Database successfully restored! (${data.totalTables} tables, ${data.totalRecords} records) ✓`,
        'success'
      );

      if (onSuccess) onSuccess();

      // Trigger automatic reload after 1.8 seconds so all pages reflect restored state
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while restoring the database');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
              <HardDriveUpload size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'km' ? 'ស្តារមូលដ្ឋានទិន្នន័យ SQLite' : 'Restore SQLite Database'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  SQLite & SQL
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'km'
                  ? 'ស្តារទិន្នន័យពីឯកសារ SQLite (.sqlite, .db) ឬពី Safety Snapshot'
                  : 'Restore database state from an uploaded file or existing server snapshot'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isRestoring}
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {restoreResult ? (
            /* Success State */
            <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'km' ? 'ការស្តារទិន្នន័យទទួលបានជោគជ័យ!' : 'Database Restored Successfully!'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {language === 'km'
                    ? `មូលដ្ឋានទិន្នន័យ SQLite ត្រូវបានជំនួសដោយជោគជ័យពី "${restoreResult.sourceFile}"។`
                    : `Active SQLite database was safely restored from "${restoreResult.sourceFile}".`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'km' ? 'ចំនួនតារាង' : 'Total Tables'}
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {restoreResult.totalTables} {language === 'km' ? 'តារាង' : 'Tables'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'km' ? 'ចំនួនកំណត់ត្រាសរុប' : 'Total Records'}
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {restoreResult.totalRecords.toLocaleString()} {language === 'km' ? 'ជួរ' : 'Rows'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold pt-2">
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {language === 'km'
                    ? 'កំពុងផ្ទុកទំព័រឡើងវិញដោយស្វ័យប្រវត្តិ...'
                    : 'Reloading application automatically to reflect restored state...'}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <UploadCloud size={15} />
                  <span>{language === 'km' ? 'ផ្ទុកឡើងឯកសារបម្រុងទុក (Upload File)' : 'Upload Backup File'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('server')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'server'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Server size={15} />
                  <span>
                    {language === 'km' ? 'Snapshot លើម៉ាស៊ីនបម្រើ' : 'Server Snapshots'}
                    {serverBackups.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-mono">
                        {serverBackups.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Tab 1: Upload File */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sqlite,.db,.sqlite3,.sql"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <FileCheck size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatFileSize(selectedFile.size)} • {selectedFile.name.endsWith('.sql') ? 'SQL Script' : 'SQLite Database'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {language === 'km' ? 'ប្តូរ' : 'Change'}
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                        dragActive
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                        {language === 'km'
                          ? 'ចុចទីនេះ ឬអូសទម្លាក់ឯកសារ SQLite Backup ដើម្បីស្តារ'
                          : 'Click to browse or drag & drop SQLite backup file'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {language === 'km'
                          ? 'គាំទ្រឯកសារ .sqlite, .db, .sqlite3 ឬ .sql (អតិបរមា 150 MB)'
                          : 'Supports .sqlite, .db, .sqlite3, or .sql script (up to 150 MB)'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Server Snapshots */}
              {activeTab === 'server' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      {language === 'km' ? 'ជ្រើសរើស snapshot ដើម្បីស្តារ៖' : 'Select a server snapshot to restore:'}
                    </span>
                    <button
                      type="button"
                      onClick={fetchServerBackups}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      {language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh list'}
                    </button>
                  </div>

                  {loadingBackups ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                      <span>{language === 'km' ? 'កំពុងស្វែងរក snapshot...' : 'Loading snapshots...'}</span>
                    </div>
                  ) : serverBackups.length === 0 ? (
                    <div className="p-6 text-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                      <Database size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">
                        {language === 'km' ? 'មិនមាន snapshot លើម៉ាស៊ីនបម្រើទេ' : 'No server snapshots found'}
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {language === 'km'
                          ? 'អ្នកអាចប្រើផ្ទាំង Upload File ដើម្បីផ្ទុកឯកសារផ្ទាល់ខ្លួន'
                          : 'Use the Upload File tab to restore from your computer'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {serverBackups.map((item) => {
                        const isSelected = selectedServerBackup === item.fileName;
                        return (
                          <div
                            key={item.fileName}
                            onClick={() => setSelectedServerBackup(item.fileName)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-2xs'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <input
                                type="radio"
                                name="serverBackup"
                                checked={isSelected}
                                onChange={() => setSelectedServerBackup(item.fileName)}
                                className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                              />
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {item.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : '-'}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{item.sizeFormatted}</span>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                item.type === 'manual'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : item.type === 'safety'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300'
                              }`}
                            >
                              {item.type === 'manual'
                                ? 'Manual Backup'
                                : item.type === 'safety'
                                ? 'Safety Snapshot'
                                : 'Baseline Seed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Safety Safeguard Notice */}
              <div className="bg-amber-50/90 dark:bg-amber-950/30 rounded-xl p-3.5 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{language === 'km' ? 'ព័ត៌មានសុវត្ថិភាពសំខាន់៖' : 'Automatic Safety Backup Guard:'}</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                  <li>
                    {language === 'km'
                      ? 'ប្រព័ន្ធនឹងបង្កើតឯកសារបម្រុងទុក (data/hr.db.bak.*) ដោយស្វ័យប្រវត្តិនូវទិន្នន័យបច្ចុប្បន្ន មុនពេលដំណើរការស្តារ'
                      : 'An automatic safety backup (data/hr.db.bak.*) of the current database is created before any changes are applied.'}
                  </li>
                  <li>
                    {language === 'km'
                      ? 'WAL mode និង Foreign Keys នឹងត្រូវកំណត់ឡើងវិញដោយរលូន ធានានូវភាពពេញលេញនៃទិន្នន័យ'
                      : 'ACID transactions, WAL journaling, and foreign key integrity checks are automatically verified.'}
                  </li>
                  <li>
                    {language === 'km'
                      ? 'ទំព័រកម្មវិធីនឹងត្រូវផ្ទុកឡើងវិញបន្ទាប់ពីការស្តារចប់សព្វគ្រប់'
                      : 'The browser session will automatically refresh immediately after restoration is finalized.'}
                  </li>
                </ul>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!restoreResult && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isRestoring}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={
                isRestoring ||
                (activeTab === 'upload' && !selectedFile) ||
                (activeTab === 'server' && !selectedServerBackup)
              }
              onClick={handleExecuteRestore}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isRestoring ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{language === 'km' ? 'កំពុងស្តារទិន្នន័យ...' : 'Restoring SQLite Database...'}</span>
                </>
              ) : (
                <>
                  <HardDriveUpload size={14} />
                  <span>{language === 'km' ? 'យល់ព្រម ស្តារទិន្នន័យ' : 'Restore Database Now'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
