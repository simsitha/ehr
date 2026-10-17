'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Check,
  Building2,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatLocalizedText } from '@/lib/translations';

interface PayrollImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PayrollImportModal({ isOpen, onClose, onSuccess }: PayrollImportModalProps) {
  const { showToast, triggerRefresh, language } = useApp();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [payPeriod, setPayPeriod] = useState('August 2026');
  const [paymentDate, setPaymentDate] = useState('2026-08-31');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!pasteText.trim()) {
      setErrorMessage(language === 'km' ? 'សូមបញ្ចូល ឬបិទភ្ជាប់ទិន្នន័យតារាង TSV / Excel' : 'Please paste TSV / Excel payroll sheet content.');
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payroll/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tsvText: pasteText,
          period: payPeriod,
          paymentDate,
          commit: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse payroll data');
      }

      setPreviewData(data);
      showToast(
        language === 'km'
          ? `បានវិភាគជោគជ័យ ${data.count} នាក់ (${data.errorsHealed} កំហុស #REF! ត្រូវបានកែសម្រួល)`
          : `Audited ${data.count} employees (${data.errorsHealed} #REF! formulas auto-healed)`,
        'success'
      );
    } catch (err: any) {
      console.error('Error analyzing payroll:', err);
      setErrorMessage(err.message || 'Error parsing payroll text');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!pasteText.trim()) return;
    setIsImporting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payroll/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tsvText: pasteText,
          period: payPeriod,
          paymentDate,
          commit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to commit payroll import');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(
        language === 'km'
          ? `បានបញ្ចូលទិន្នន័យប្រាក់បៀវត្ស ${data.count} នាក់សម្រាប់ ${payPeriod} ដោយជោគជ័យ!`
          : `Successfully imported ${data.count} employee payroll records for ${payPeriod}!`,
        'success'
      );

      triggerRefresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error committing payroll:', err);
      setErrorMessage(err.message || 'Error importing payroll records');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteText(content);
      setActiveTab('paste');
      setErrorMessage(null);
      setPreviewData(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {language === 'km' ? 'បញ្ជូលបញ្ជីប្រកាសពន្ធ និងប្រាក់បៀវត្សប្រចាំខែ' : 'Import Monthly Tax on Salary & Payroll'}
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  55 Columns
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'គាំទ្រទម្រង់ Excel / TSV រោងចក្រ Hestra និងជួសជុលរូបមន្ត #REF! ដោយស្វ័យប្រវត្តិ'
                  : 'Supports Hestra standard 55-column factory payroll format with auto #REF! healing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Period & Payment Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'km' ? 'ខែ និងឆ្នាំបើកប្រាក់ (Pay Period)' : 'Pay Period (Month & Year)'}
              </label>
              <input
                type="text"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
                placeholder="e.g. August 2026"
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'km' ? 'កាលបរិច្ឆេទបើកប្រាក់ (Payment Date)' : 'Payment Date'}
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'paste'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {language === 'km' ? 'បិទភ្ជាប់ទិន្នន័យ (Paste Spreadsheet Text)' : 'Paste Spreadsheet Text (TSV)'}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {language === 'km' ? 'ផ្ទុកឯកសារឡើង (Upload File)' : 'Upload File (CSV / TXT)'}
            </button>
          </div>

          {/* Tab 1: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {language === 'km'
                    ? 'ចម្លង (Copy) ពីកម្មវិធី Excel រួចចុចបិទភ្ជាប់ (Paste) នៅទីនេះ៖'
                    : 'Copy from Excel and paste here (Tab-separated values):'}
                </span>
                {pasteText && (
                  <button
                    onClick={() => {
                      setPasteText('');
                      setPreviewData(null);
                    }}
                    className="text-rose-500 hover:underline text-[11px] font-semibold"
                  >
                    {language === 'km' ? 'សម្អាត' : 'Clear text'}
                  </button>
                )}
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setPreviewData(null);
                  setErrorMessage(null);
                }}
                rows={8}
                placeholder={
                  language === 'km'
                    ? "ID\tKhmer Name\tEnglish Name\tJoin Date\tWorking Period\tContract Type...\nHC003\tសយ សំអាត\tSAY SAMATH\t01-02-2023\t3\tUDC\tABA Bank..."
                    : "ID\tStaff Name\tEnglish Name\tJoin Date\tWorking Period\tContract Type...\nHC003\tSAY SAMATH\tSAY SAMATH\t01-02-2023\t3\tUDC\tABA Bank..."
                }
                className="w-full p-3 font-mono text-[11px] leading-relaxed rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setSelectedFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setPasteText(ev.target?.result as string);
                    setActiveTab('paste');
                  };
                  reader.readAsText(file);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/40 scale-[0.99]'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFileName || (language === 'km' ? 'ចុច ឬទម្លាក់ឯកសារ Excel / CSV នៅទីនេះ' : 'Click or drag & drop payroll file')}
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports TSV, CSV and TXT UTF-8 exports</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview & Audit Dashboard */}
          {previewData && previewData.success && (
            <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    {language === 'km'
                      ? `លទ្ធផលវិភាគ៖ រកឃើញបុគ្គលិកចំនួន ${previewData.count} នាក់`
                      : `Audit Passed: Recognized ${previewData.count} employees`}
                  </span>
                </div>
                {previewData.errorsHealed > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Sparkles size={12} />
                    {previewData.errorsHealed} #REF! formulas auto-healed
                  </span>
                )}
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Basic Salary</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    ${previewData.totals?.totalBasic?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Gross Salary</span>
                  <span className="text-sm font-extrabold text-indigo-600">
                    ${previewData.totals?.totalGross?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">NSSF Pension (2%)</span>
                  <span className="text-sm font-extrabold text-amber-600">
                    ${previewData.totals?.totalPension?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Net Disbursed</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    ${previewData.totals?.totalNetDisbursed?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Sample Table Preview */}
              {previewData.sample && previewData.sample.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100/70 text-slate-600 sticky top-0 font-bold">
                        <tr>
                          <th className="py-1.5 px-2.5">ID</th>
                          <th className="py-1.5 px-2.5">Khmer Name</th>
                          <th className="py-1.5 px-2.5">English Name</th>
                          <th className="py-1.5 px-2.5">Position</th>
                          <th className="py-1.5 px-2.5 text-right">Basic</th>
                          <th className="py-1.5 px-2.5 text-right">Gross</th>
                          <th className="py-1.5 px-2.5 text-right">1st Paid</th>
                          <th className="py-1.5 px-2.5 text-right">2nd Paid</th>
                          <th className="py-1.5 px-2.5 text-right">Total Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.sample.map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 font-bold text-indigo-600">{row.id}</td>
                            <td className="py-1.5 px-2.5">{row.khmer_name}</td>
                            <td className="py-1.5 px-2.5 font-medium">{row.english_name}</td>
                            <td className="py-1.5 px-2.5 text-slate-500">{row.position}</td>
                            <td className="py-1.5 px-2.5 text-right">${row.basic_salary?.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-slate-700">${row.total_salary?.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right text-slate-500">${row.first_paid?.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-indigo-600">${row.second_paid?.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right font-extrabold text-emerald-600">${row.total_paid?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {!previewData ? (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !pasteText.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing & Auditing...</span>
                  </>
                ) : (
                  <>
                    <Calculator size={14} />
                    <span>{language === 'km' ? 'វិភាគ & ត្រួតពិនិត្យរូបមន្ត' : 'Audit & Preview Sheet'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={isImporting}
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>
                      {language === 'km'
                        ? `បញ្ជាក់ និងបញ្ចូលទៅក្នុងប្រព័ន្ធ (${previewData.count} នាក់)`
                        : `Confirm & Import (${previewData.count} Employees)`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
