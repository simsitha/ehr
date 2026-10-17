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
  Scissors,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SewingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMonth?: string;
}

export default function SewingImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMonth = '2026-10',
}: SewingImportModalProps) {
  const { showToast, language } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [targetWeek, setTargetWeek] = useState(40);
  const [targetWeekStart, setTargetWeekStart] = useState('2026-10-05');
  const [targetWeekEnd, setTargetWeekEnd] = useState('2026-10-10');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'employee_id,group_name,week_number,week_start,week_end,mon_qty,tue_qty,wed_qty,thu_qty,fri_qty,sat_qty,target_qty,notes\n' +
      'EMP-0020,Sewing Line 1,40,2026-10-05,2026-10-10,210,232,210,227,220,202,1200,Tier 1 achieved\n' +
      'EMP-0004,Sewing Line 2,40,2026-10-05,2026-10-10,225,235,220,230,225,210,1200,Tier 2 achieved\n' +
      'EMP-0007,Sewing Line 2,40,2026-10-05,2026-10-10,240,245,235,240,235,250,1200,Tier 3 achieved\n' +
      'EMP-0008,Sewing Line 1,40,2026-10-05,2026-10-10,200,210,205,200,210,200,1200,Regular output\n' +
      'EMP-0013,Sewing Line 1,40,2026-10-05,2026-10-10,215,220,225,230,220,210,1200,Tier 1 achieved\n';

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sewing_production_template_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Analyze & Preview
  const handleAnalyze = async (rawContent?: string) => {
    const textToParse = (rawContent !== undefined ? rawContent : pasteText).trim();
    if (!textToParse) {
      setErrorMessage(
        language === 'km'
          ? 'សូមបញ្ចូល ឬបិទភ្ជាប់ទិន្នន័យផលិតកម្មដេរ CSV / TSV'
          : 'Please select a file or paste weekly sewing production data.'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/bonus/sewing/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: textToParse,
          defaultMonth: targetMonth,
          defaultWeekNumber: targetWeek,
          defaultWeekStart: targetWeekStart,
          defaultWeekEnd: targetWeekEnd,
          commit: false, // preview mode
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse weekly production data');
      }

      setPreviewData(data);
      showToast(
        language === 'km'
          ? `បានវិភាគជោគជ័យ ${data.count} កំណត់ត្រា (បុព្វលាភសរុប៖ $${data.total_bonus.toFixed(2)})`
          : `Audited ${data.count} production rows (Calculated Bonus: $${data.total_bonus.toFixed(2)})`,
        'success'
      );
    } catch (err: any) {
      console.error('Error analyzing sewing production:', err);
      setErrorMessage(err.message || 'Error parsing sewing data');
      setPreviewData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (!previewData || !previewData.rows || previewData.rows.length === 0) {
      if (!pasteText.trim()) return;
      await handleAnalyze();
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/bonus/sewing/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: previewData?.rows,
          csvText: previewData ? undefined : pasteText,
          defaultMonth: targetMonth,
          defaultWeekNumber: targetWeek,
          defaultWeekStart: targetWeekStart,
          defaultWeekEnd: targetWeekEnd,
          commit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to commit import');
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      showToast(
        language === 'km'
          ? `បាននាំចូលជោគជ័យ ${data.count} កំណត់ត្រា (ថ្មី៖ ${data.inserted}, កែប្រែ៖ ${data.updated}, បុព្វលាភ៖ $${data.total_bonus.toFixed(2)})! ✓`
          : `Successfully imported ${data.count} weekly logs (${data.inserted} added, ${data.updated} updated, Total Bonus: $${data.total_bonus.toFixed(2)})! ✓`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error committing sewing import:', err);
      setErrorMessage(err.message || 'Error committing import');
    } finally {
      setIsImporting(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setPasteText(content);
      handleAnalyze(content);
    };
    reader.readAsText(file);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {language === 'km'
                  ? 'នាំចូលទិន្នផលដេរប្រចាំសប្តាហ៍ (Import Sewing Production)'
                  : 'Import Weekly Sewing Production & Bonus'}
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  B1–B3 Batch
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'គាំទ្រទម្រង់ CSV / Excel និងគណនាបុព្វលាភទិន្នផល 100%, 110%, 120% ដោយស្វ័យប្រវត្តិ'
                  : 'Import weekly output per line with automatic bonus tiers ($10, $15, $20) and upsert'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'km' ? 'ខែគោលដៅ (Target Month)' : 'Target Month'}
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-11">November 2026</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'km' ? 'សប្តាហ៍លំនាំដើម (Default Week #)' : 'Default Week #'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="53"
                  value={targetWeek}
                  onChange={(e) => {
                    const w = parseInt(e.target.value, 10) || 40;
                    setTargetWeek(w);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'km' ? 'គំរូឯកសារ (Sample Template)' : 'CSV Template'}
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>{language === 'km' ? 'ទាញយកគំរូ CSV Template' : 'Download Sample CSV'}</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-1 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'km' ? 'ផ្ទុកឡើងឯកសារ CSV/Excel' : 'Upload CSV File'}
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`pb-1 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'km' ? 'បិទភ្ជាប់ទិន្នន័យ (Paste Table)' : 'Paste Table Data'}
              </button>
            </div>

            {previewData && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} />
                {previewData.count} {language === 'km' ? 'ជួរបានត្រួតពិនិត្យ' : 'Rows Audited'}
              </span>
            )}
          </div>

          {/* Tab 1: Upload */}
          {activeTab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                <UploadCloud size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {selectedFileName
                  ? selectedFileName
                  : language === 'km'
                  ? 'ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ទីនេះ'
                  : 'Click to select or drag and drop weekly CSV file'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'km'
                  ? 'គាំទ្រទម្រង់ .csv, .tsv (ក្បាលជួរ៖ employee_id, group_name, mon_qty, tue_qty, ...)'
                  : 'Supports .csv, .tsv (headers: employee_id, group_name, mon_qty, tue_qty, ...)'}
              </p>
            </div>
          )}

          {/* Tab 2: Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  "employee_id\tgroup_name\tweek_number\tmon_qty\ttue_qty\twed_qty\tthu_qty\tfri_qty\tsat_qty\ttarget_qty\nEMP-0020\tSewing Line 1\t40\t210\t232\t210\t227\t220\t202\t1200\nEMP-0004\tSewing Line 2\t40\t225\t235\t220\t230\t225\t210\t1200"
                }
                rows={7}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !pasteText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
                  <span>{language === 'km' ? 'វិភាគទិន្នន័យ (Analyze)' : 'Parse & Audit Table'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Audit / Preview Section */}
          {previewData && previewData.rows && (
            <div className="space-y-4 pt-2">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500">
                    {language === 'km' ? 'ចំនួនកម្មករ (Employees)' : 'Total Records'}
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {previewData.count} workers
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <span className="text-[11px] font-medium text-indigo-700">
                    {language === 'km' ? 'ទិន្នផលសរុប (Pieces)' : 'Total Pieces'}
                  </span>
                  <div className="text-lg font-black text-indigo-700 mt-0.5">
                    {previewData.total_quantity?.toLocaleString()} pcs
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-medium text-emerald-700">
                    {language === 'km' ? 'បុព្វលាភសរុប (Total Bonus)' : 'Total Bonus Payout'}
                  </span>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    ${previewData.total_bonus?.toFixed(2)}
                  </div>
                </div>

                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-medium text-amber-700">
                    {language === 'km' ? 'អត្រាសម្រេចគោលដៅមធ្យម' : 'Avg Achievement'}
                  </span>
                  <div className="text-lg font-black text-amber-700 mt-0.5">
                    {previewData.rows.length > 0
                      ? Math.round(
                          (previewData.rows.reduce(
                            (acc: number, r: any) => acc + r.achievement_pct,
                            0
                          ) /
                            previewData.rows.length) *
                            10
                        ) / 10
                      : 0}
                    %
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-3 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>
                    {language === 'km' ? 'ទិដ្ឋភាពទិន្នន័យត្រួតពិនិត្យ' : 'Production Audit Preview'} (
                    {previewData.rows.length} rows)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Standard Target: 1,200 pcs
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-2 font-bold">#</th>
                        <th className="p-2 font-bold">Emp ID</th>
                        {language === 'km' && <th className="p-2 font-bold font-khmer">ឈ្មោះខ្មែរ</th>}
                        <th className="p-2 font-bold">Name</th>
                        <th className="p-2 font-bold">Line</th>
                        <th className="p-2 font-bold">W#</th>
                        <th className="p-1.5 text-center font-bold">Mon</th>
                        <th className="p-1.5 text-center font-bold">Tue</th>
                        <th className="p-1.5 text-center font-bold">Wed</th>
                        <th className="p-1.5 text-center font-bold">Thu</th>
                        <th className="p-1.5 text-center font-bold">Fri</th>
                        <th className="p-1.5 text-center font-bold">Sat</th>
                        <th className="p-2 text-center font-bold bg-indigo-50/50 text-indigo-900">
                          Total
                        </th>
                        <th className="p-2 text-center font-bold">Target</th>
                        <th className="p-2 text-center font-bold bg-emerald-50 text-emerald-900">
                          Achieved %
                        </th>
                        <th className="p-2 text-center font-bold bg-amber-50 text-amber-900">
                          Bonus ($)
                        </th>
                        <th className="p-2 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {previewData.rows.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2 font-bold text-slate-400 font-sans">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{r.employee_id}</td>
                          {language === 'km' && (
                            <td className="p-2 font-khmer text-slate-800 truncate max-w-[90px] font-sans">
                              {r.khmer_name || '--'}
                            </td>
                          )}
                          <td className="p-2 font-medium text-slate-900 truncate max-w-[100px] font-sans">
                            {r.employee_name}
                          </td>
                          <td className="p-2 font-semibold text-slate-700 font-sans">{r.group_name}</td>
                          <td className="p-2 text-slate-600">W{r.week_number}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.mon_qty}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.tue_qty}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.wed_qty}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.thu_qty}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.fri_qty}</td>
                          <td className="p-1.5 text-center text-slate-700">{r.sat_qty}</td>
                          <td className="p-2 text-center font-black text-indigo-700 bg-indigo-50/30">
                            {r.total_qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-center text-slate-500">{r.target_qty}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                                r.achievement_pct >= 120
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : r.achievement_pct >= 110
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : r.achievement_pct >= 100
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : r.achievement_pct >= 90
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {r.achievement_pct}% {r.achievement_pct >= 120 ? '(B3)' : r.achievement_pct >= 110 ? '(B2)' : r.achievement_pct >= 100 ? '(B1)' : r.achievement_pct >= 90 ? '(Base)' : ''}
                            </span>
                          </td>
                          <td className="p-2 text-center font-black text-amber-700 bg-amber-50/40">
                            +${r.bonus_amount.toFixed(2)}
                          </td>
                          <td className="p-2 text-center font-sans">
                            {r.isExistingEmployee ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 size={11} /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                <AlertTriangle size={11} /> Unlinked
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {previewData && (
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  setSelectedFileName(null);
                  setPasteText('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {language === 'km' ? 'សម្អាតឡើងវិញ (Clear)' : 'Reset'}
              </button>
            )}

            <button
              type="button"
              disabled={isImporting || !previewData || previewData.rows.length === 0}
              onClick={handleCommitImport}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{language === 'km' ? 'កំពុងនាំចូល...' : 'Importing Records...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>
                    {language === 'km'
                      ? `អនុម័ត និងនាំចូល (${previewData ? previewData.rows.length : 0} ជួរ)`
                      : `Commit & Upsert (${previewData ? previewData.rows.length : 0} Rows)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
