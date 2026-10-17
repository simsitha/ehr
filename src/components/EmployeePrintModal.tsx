'use client';

import React from 'react';
import { X, Printer, Download, Eye, FileText, Users } from 'lucide-react';
import EmployeePrintDossier from './EmployeePrintDossier';
import EmployeePrintRoster from './EmployeePrintRoster';
import { Employee } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';

interface EmployeePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'dossier' | 'roster';
  employee?: any;
  employees?: Employee[];
  language?: 'en' | 'km';
  filterSummary?: string;
}

export default function EmployeePrintModal({
  isOpen,
  onClose,
  mode,
  employee,
  employees = [],
  language = 'en',
  filterSummary,
}: EmployeePrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const title =
    mode === 'dossier'
      ? (language === 'km' ? 'បោះពុម្ពប្រវត្តិរូបសង្ខេបបុគ្គលិកផ្លូវការ (A4)' : 'Official Employee Profile Dossier (A4)')
      : (language === 'km' ? 'បោះពុម្ពបញ្ជីរាយនាមបុគ្គលិកសរុប (A4)' : 'Workforce Directory Roster Report (A4)');

  const subtitle =
    mode === 'dossier'
      ? (language === 'km'
          ? `ឯកសារស្តង់ដារការងារកម្ពុជាសម្រាប់បុគ្គលិក៖ ${employee?.first_name} ${employee?.last_name || ''} (${employee?.id || ''})`
          : `Cambodian labor standard dossier for: ${employee?.first_name} ${employee?.last_name || ''} (${employee?.id || ''})`)
      : (language === 'km'
          ? `របាយការណ៍បញ្ជីបុគ្គលិកសរុបចំនួន ${employees.length} នាក់`
          : `Executive workforce roster report containing ${employees.length} employees`);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Top Floating Action Bar (Hidden on print) */}
      <div className="no-print w-full max-w-4xl bg-slate-900 text-white rounded-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            {mode === 'dossier' ? <FileText size={20} /> : <Users size={20} />}
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-bold text-white flex items-center gap-2 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
                A4 Document
              </span>
            </h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>{language === 'km' ? 'បោះពុម្ពឥឡូវនេះ / PDF' : 'Print Now / PDF'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* A4 Paper Container Preview */}
      <div className="w-full max-w-4xl max-h-[82vh] overflow-y-auto p-1 sm:p-4 flex justify-center">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full overflow-hidden print:border-none print:shadow-none print:rounded-none">
          {mode === 'dossier' && employee && (
            <EmployeePrintDossier employee={employee} language={language} />
          )}

          {mode === 'roster' && (
            <EmployeePrintRoster
              employees={employees}
              language={language}
              filterSummary={filterSummary}
            />
          )}
        </div>
      </div>

      {/* Bottom Hint (Hidden on print) */}
      <div className="no-print text-center text-xs text-slate-400 mt-2">
        <span>
          {language === 'km'
            ? 'គន្លឹះ៖ លោកអ្នកអាចជ្រើសរើស "Save as PDF" ក្នុងផ្ទាំងបោះពុម្ពរបស់ Browser ដើម្បីទាញយកឯកសារជា PDF'
            : 'Tip: You can select "Save as PDF" in the browser print dialog to export a digital PDF.'}
        </span>
      </div>
    </div>
  );
}
