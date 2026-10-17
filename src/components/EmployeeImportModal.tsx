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
  Check,
  Building2,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatLocalizedText, cleanEnglishOnly, formatDateDMY, parseDateToISO } from '@/lib/translations';

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ParsedPreviewRow {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  group_name: string;
  department: string;
  employee_type: string;
  status: string;
  meal_allowance: number;
  housing_transport_allowance: number;
  housing_allowance: number;
  transport_allowance: number;
  skill_allowance: number;
  nationality: string;
  dob: string;
  salary: number;
  location: string;
  join_date: string;
  employment_type: string;
  isValid: boolean;
  validationError?: string;
}

const EXPECTED_COLUMNS = [
  'ID',
  'First Name',
  'Last Name',
  'Phone Number',
  'Role',
  'Group / Line',
  'Department',
  'Type',
  'Status',
  'Meal Allowance ($)',
  'Housing - Transport Allowance ($)',
  'Skill Allowance ($)',
  'Nationality',
  'Date of Birth',
  'Salary',
  'Location',
  'Join Date',
  'Employment Type',
];

export default function EmployeeImportModal({ isOpen, onClose, onSuccess }: EmployeeImportModalProps) {
  const { showToast, triggerRefresh, language, t } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [parsedRows, setParsedRows] = useState<ParsedPreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Delimiter auto-detecting and RFC 4180 CSV / TSV parser
  const parseCSVToRows = (csvContent: string): ParsedPreviewRow[] => {
    const cleanText = csvContent.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return [];

    // Auto-detect delimiter: tab or comma
    const firstLine = cleanText.split(/\r\n|\r|\n/)[0] || '';
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount > commaCount ? '\t' : ',';

    const rawRows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rawRows.push(currentRow);
      }
    }

    if (rawRows.length < 2) return [];

    const headers = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[\s_\-\(\)\$\/]+/g, ''));
    const rows: ParsedPreviewRow[] = [];

    const getField = (row: string[], ...aliases: string[]): string => {
      for (const alias of aliases) {
        const normAlias = alias.toLowerCase().replace(/[\s_\-\(\)\$\/]+/g, '');
        const idx = headers.indexOf(normAlias);
        if (idx !== -1 && row[idx] !== undefined) {
          return row[idx].trim();
        }
      }
      return '';
    };

    const parseNum = (val: string, fallback: number = 0): number => {
      if (!val) return fallback;
      const cleaned = val.replace(/[^0-9.-]/g, '');
      if (!cleaned || isNaN(Number(cleaned))) return fallback;
      return Number(cleaned);
    };

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (row.length === 0 || row.every((c) => !c)) continue;

      // 1. ID
      const id = getField(row, 'id', 'employee_id', 'empid', 'code', 'អត្តលេខ');

      // 2 & 3. First Name & Last Name
      let firstName = getField(row, 'first_name', 'firstname', 'fname', 'ឈ្មោះ', 'នាម');
      let lastName = getField(row, 'last_name', 'lastname', 'lname', 'ត្រកូល', 'គោត្តនាម');
      const fullName = getField(row, 'name', 'fullname', 'employeename', 'ឈ្មោះពេញ');

      if (!firstName && fullName) {
        const parts = fullName.split(/\s+/);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = '';
        } else {
          lastName = parts[0];
          firstName = parts.slice(1).join(' ');
        }
      }

      // 4. Phone Number
      const phone = getField(row, 'phone_number', 'phonenumber', 'phone', 'mobile', 'tel', 'លេខទូរស័ព្ទ');

      // 5. Role
      const role = getField(row, 'role', 'position', 'job_title', 'title', 'មុខតំណែង', 'តួនាទី');

      // 6. Group / Line
      const groupName = getField(row, 'group_line', 'groupline', 'group', 'line', 'group_name', 'ក្រុម', 'ខ្សែសង្វាក់');

      // 7. Department
      const department = getField(row, 'department', 'dept', 'division', 'នាយកដ្ឋាន', 'ផ្នែក') || 'Production';

      // 8. Type (Employee Type)
      const employeeType = getField(row, 'type', 'employee_type', 'employeetype', 'staff_type', 'ប្រភេទបុគ្គលិក') || 'Regular / Permanent';

      // 9. Status
      const status = getField(row, 'status', 'state', 'ស្ថានភាព') || 'Active';

      // 10. Meal Allowance ($)
      const mealAllowance = parseNum(getField(row, 'meal_allowance_$', 'meal_allowance', 'mealallowance', 'meal', 'ប្រាក់ថ្លៃបាយ'), 0);

      // 11. Housing - Transport Allowance ($)
      const rawHT = getField(
        row,
        'housing_-_transport_allowance_$',
        'housing_transport_allowance_$',
        'housing_transport_allowance',
        'housingtransportallowance',
        'housing_-_transport_allowance',
        'housing_transport',
        'transport_-_housing_allowance_$',
        'transport_housing_allowance_$',
        'transport_housing_allowance',
        'transporthousingallowance',
        'transport_housing',
        'ថ្លៃស្នាក់នៅ_និង_ធ្វើដំណើរ',
        'ថ្លៃស្នាក់នៅ_ធ្វើដំណើរ'
      );
      let housingTransportAllowance = 0;
      if (rawHT) {
        housingTransportAllowance = parseNum(rawHT, 0);
      } else {
        const legH = parseNum(getField(row, 'housing_allowance_$', 'housing_allowance', 'housingallowance', 'housing', 'ប្រាក់ថ្លៃស្នាក់នៅ'), 0);
        const legT = parseNum(getField(row, 'transport_allowance_$', 'transport_allowance', 'transportallowance', 'transport', 'ប្រាក់ធ្វើដំណើរ'), 0);
        housingTransportAllowance = legH + legT;
      }

      // 12. Skill Allowance ($)
      const skillAllowance = parseNum(getField(row, 'skill_allowance_$', 'skill_allowance', 'skillallowance', 'skill', 'ប្រាក់ជំនាញ'), 0);

      // 13. Nationality (Strictly English)
      const nationality = cleanEnglishOnly(getField(row, 'nationality', 'សញ្ជាតិ')) || 'Cambodian';

      // 14. Date of Birth
      const rawDob = getField(row, 'date_of_birth', 'dateofbirth', 'dob', 'birthdate', 'ថ្ងៃខែឆ្នាំកំណើត');
      const dob = parseDateToISO(rawDob);

      // 15. Salary
      const salary = parseNum(getField(row, 'salary', 'base_salary', 'ប្រាក់បៀវត្សរ៍', 'ប្រាក់ខែ'), 1200);

      // 16. Location (Strictly English)
      const location = cleanEnglishOnly(getField(row, 'location', 'branch', 'city', 'ទីតាំង')) || 'Phnom Penh';

      // 17. Join Date
      const rawJoinDate = getField(row, 'join_date', 'joindate', 'start_date', 'hire_date', 'ថ្ងៃចូលបម្រើការងារ');
      const joinDate = parseDateToISO(rawJoinDate) || new Date().toISOString().split('T')[0];

      // 18. Employment Type
      const employmentType = getField(row, 'employment_type', 'employmenttype', 'emp_type', 'ប្រភេទការងារ') || 'Full-Time';

      let isValid = true;
      let validationError = '';

      if (!firstName) {
        isValid = false;
        validationError = language === 'km' ? 'ខ្វះឈ្មោះ (Missing First Name)' : 'Missing First Name';
      } else if (!role) {
        isValid = false;
        validationError = language === 'km' ? 'ខ្វះមុខតំណែង (Missing Role)' : 'Missing Role / Job Title';
      }

      rows.push({
        id,
        first_name: firstName,
        last_name: lastName || '-',
        phone,
        role,
        group_name: groupName,
        department,
        employee_type: employeeType,
        status,
        meal_allowance: mealAllowance,
        housing_transport_allowance: housingTransportAllowance,
        housing_allowance: housingTransportAllowance,
        transport_allowance: 0,
        skill_allowance: skillAllowance,
        nationality,
        dob,
        salary,
        location,
        join_date: joinDate,
        employment_type: employmentType,
        isValid,
        validationError,
      });
    }

    return rows;
  };

  const handleFile = async (file: File) => {
    setSelectedFileName(file.name);
    setIsProcessing(true);
    setParseError(null);

    try {
      const text = await file.text();
      const rows = parseCSVToRows(text);
      if (rows.length === 0) {
        setParseError(
          language === 'km'
            ? 'ឯកសារ CSV មិនមានទិន្នន័យត្រឹមត្រូវ ឬខ្វះក្បាលតារាង (Headers)'
            : 'No valid rows found in CSV. Please ensure headers are present.'
        );
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setParseError(err.message || 'Error reading CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      showToast(language === 'km' ? 'សូមបិទភ្ជាប់ទិន្នន័យ CSV/Excel ជាមុនសិន' : 'Please paste CSV/Excel text first', 'error');
      return;
    }
    setIsProcessing(true);
    setParseError(null);
    try {
      const rows = parseCSVToRows(pasteText);
      if (rows.length === 0) {
        setParseError(
          language === 'km'
            ? 'មិនអាចញែកទិន្នន័យបានទេ។ សូមពិនិត្យមើលក្បាលតារាង (Headers) នៃ CSV/Excel'
            : 'Could not parse text. Ensure your data has the 18 headers with tab or comma separation.'
        );
      } else {
        setParsedRows(rows);
        setSelectedFileName('pasted_workforce_data.csv');
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse pasted CSV text');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    window.open('/api/employees/import?template=1', '_blank');
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast(language === 'km' ? 'មិនមានទិន្នន័យត្រឹមត្រូវសម្រាប់នាំចូលទេ' : 'No valid employee rows to import', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: validRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.importedCount === 0 && data.updatedCount === 0 && data.errors && data.errors.length > 0) {
          const errMsg = data.errors.map((e: any) => `Row ${e.row}: ${e.reason}`).join('; ');
          showToast(errMsg, 'error');
          setParseError(errMsg);
          return;
        }
        if (typeof window !== 'undefined') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        showToast(
          language === 'km'
            ? `បាននាំចូលបុគ្គលិកចំនួន ${data.importedCount || validRows.length} នាក់ដោយជោគជ័យ! 🎉`
            : `Successfully imported ${data.importedCount || validRows.length} employees! 🎉`,
          'success'
        );
        triggerRefresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Import failed', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(language === 'km' ? 'កំហុសបណ្តាញពេលនាំចូលទិន្នន័យ' : 'Network error during import', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                {t('emp_import_modal_title')}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider">
                  19 Columns Support
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'នាំចូលបុគ្គលិកជាកញ្ចប់តាមរយៈទម្រង់ ១៩ ជួរឈរ (ID, First Name, Last Name, Phone, Role, Allowances, etc.)'
                  : 'Batch onboard staff with the standard 19 columns layout (allowances, group/line, status, salary, etc.)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
              title="Download 19-Column CSV Template"
            >
              <Download size={14} />
              <span>{t('emp_import_template_btn')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* 19-Column Reference Pill Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                {language === 'km' ? 'លំដាប់ជួរឈរទាំង ១៩ (Expected 19 Columns)' : 'Supported 19 Columns (in order):'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-detects Tab (Excel Copy-Paste) & Comma CSV</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EXPECTED_COLUMNS.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shadow-2xs"
                >
                  <span className="text-slate-400 mr-1">{idx + 1}.</span>
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud size={15} />
                <span>{t('emp_import_upload_tab')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('paste');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'paste' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={15} />
                <span>{t('emp_import_paste_tab')}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Upload Dropzone */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 sm:p-9 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/tab-separated-values,.tsv,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shadow-xs">
                <FileSpreadsheet size={26} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {selectedFileName || t('emp_import_dropzone')}
                </p>
                <p className="text-xs text-slate-400">
                  {language === 'km'
                    ? 'គាំទ្រឯកសារ .CSV / .TSV (UTF-8 គាំទ្រអក្សរខ្មែរ & អង់គ្លេស)'
                    : 'Supports standard .CSV / .TSV with UTF-8 encoding'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs mt-1">
                <span>{language === 'km' ? 'រុករកឯកសារ (Browse File)' : 'Browse Computer'}</span>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Raw CSV Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {language === 'km'
                    ? 'បិទភ្ជាប់ជួរដេកពី Microsoft Excel ឬ Google Sheets (គាំទ្រទាំង Tab និង Comma)'
                    : 'Paste cells directly from Excel or Google Sheets (supports tab-delimited or comma-separated)'}
                </span>
                <span className="font-mono text-[11px] text-slate-400">18 Columns</span>
              </div>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'ID\tFirst Name\tLast Name\tPhone Number\tRole\tGroup / Line\tDepartment\tType\tStatus\tMeal Allowance ($)\tHousing - Transport Allowance ($)\tSkill Allowance ($)\tNationality\tDate of Birth\tSalary\tLocation\tJoin Date\tEmployment Type\nEMP-2026-001\tSokha\tMeas\t012 345 678\tSenior Accountant\t\tFinance & Accounting\tRegular / Permanent\tActive\t20\t25\t0\tCambodian\t12/05/1995\t1400\tPhnom Penh\t15/01/2026\tFull-Time\nEMP-2026-002\tSopheap\tRath\t087 112 233\tSewing Operator\tSewing Line 1\tProduction\tRegular / Permanent\tActive\t15\t20\t20\tCambodian\t04/11/1998\t320\tPhnom Penh\t15/02/2026\tFull-Time'}
                className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 whitespace-pre"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParsePastedText}
                  disabled={!pasteText.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {language === 'km' ? 'ផ្ទៀងផ្ទាត់ទិន្នន័យ (Parse & Validate)' : 'Parse & Validate Data'}
                </button>
              </div>
            </div>
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="shrink-0 text-rose-600" size={18} />
              <p className="font-medium">{parseError}</p>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600" />
                    {t('emp_import_preview_title')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
                    {parsedRows.length} {language === 'km' ? 'នាក់' : 'rows'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    <Check size={12} /> {validCount} {language === 'km' ? 'ត្រឹមត្រូវ' : 'Valid'}
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      <AlertTriangle size={12} /> {invalidCount} {language === 'km' ? 'ខ្វះព័ត៌មាន' : 'Warning'}
                    </span>
                  )}
                </div>
              </div>

              {/* Horizontally scrollable preview table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto overflow-x-auto">
                <table className="min-w-[1500px] w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-20">#</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 font-mono">ID</th>
                      <th className="py-2.5 px-3">First Name</th>
                      <th className="py-2.5 px-3">Last Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Group / Line</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Emp Status</th>
                      <th className="py-2.5 px-3">Meal Allw ($)</th>
                      <th className="py-2.5 px-3">Housing - Transport Allw ($)</th>
                      <th className="py-2.5 px-3">Skill Allw ($)</th>
                      <th className="py-2.5 px-3">Nationality</th>
                      <th className="py-2.5 px-3">Date of Birth</th>
                      <th className="py-2.5 px-3">Salary</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Join Date</th>
                      <th className="py-2.5 px-3">Employment Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-amber-50/40 hover:bg-amber-50/70'}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] sticky left-0 bg-inherit z-10">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check size={11} /> Ready
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"
                              title={row.validationError}
                            >
                              <AlertCircle size={11} /> {row.validationError}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{row.id || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{row.first_name}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{row.last_name !== '-' ? row.last_name : ''}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{row.phone || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{row.role}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {row.group_name ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              {row.group_name}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            <Building2 size={11} className="text-indigo-500" />
                            {formatLocalizedText(row.department, language)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">{formatLocalizedText(row.employee_type, language)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${row.meal_allowance}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${row.housing_transport_allowance}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">${row.skill_allowance}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{row.nationality}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{formatDateDMY(row.dob) || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">${row.salary}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{row.location}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{formatDateDMY(row.join_date)}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">{formatLocalizedText(row.employment_type, language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {parsedRows.length > 0 ? (
              <span>
                {language === 'km'
                  ? `ត្រៀមរួចរាល់សម្រាប់នាំចូលបុគ្គលិកចំនួន ${validCount} នាក់ (គាំទ្រ ១៨ ជួរឈរពេញលេញ)`
                  : `Ready to onboard ${validCount} employees (all 18 columns mapped & validated)`}
              </span>
            ) : (
              <span>
                {language === 'km'
                  ? 'ជ្រើសរើសឯកសារ CSV ឬទាញយកគំរូ CSV ដើម្បីចាប់ផ្តើម'
                  : 'Select a CSV file or download the 18-column template to begin'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isImporting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  <span>{language === 'km' ? 'កំពុងនាំចូល...' : 'Importing Workforce...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>
                    {t('emp_import_btn')} ({validCount})
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
