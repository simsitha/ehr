'use client';

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Employee } from '@/lib/types';
import { formatLocalizedText, formatDateDMY } from '@/lib/translations';
import {
  Scale,
  FileText,
  Calculator,
  CalendarDays,
  Clock,
  Printer,
  Copy,
  Check,
  Building2,
  Users,
  Award,
  DollarSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type ToolTab = 'letters' | 'calculator' | 'holidays' | 'contracts';
type LetterType = 'employment_cert' | 'salary_cert' | 'probation_pass' | 'promotion_letter';

interface PublicHoliday {
  id: string;
  name_km: string;
  name_en: string;
  date: string;
  days: number;
  category: 'National' | 'Royal' | 'Religious' | 'Memorial';
  description_km: string;
  description_en: string;
}

const CAMBODIA_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  {
    id: 'hol-1',
    name_km: 'ទិវាចូលឆ្នាំសកល',
    name_en: 'International New Year Day',
    date: '2026-01-01',
    days: 1,
    category: 'National',
    description_km: 'ការឈប់សម្រាកអន្តរជាតិចូលឆ្នាំថ្មី',
    description_en: 'Global New Year celebration',
  },
  {
    id: 'hol-2',
    name_km: 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
    name_en: 'Victory over Genocide Day',
    date: '2026-01-07',
    days: 1,
    category: 'Memorial',
    description_km: 'រំលឹកខួបនៃការរំដោះប្រទេសកម្ពុជា',
    description_en: 'Commemoration of the fall of the Khmer Rouge regime',
  },
  {
    id: 'hol-3',
    name_km: 'ទិវានារីអន្តរជាតិ',
    name_en: 'International Women\'s Day',
    date: '2026-03-08',
    days: 1,
    category: 'National',
    description_km: 'អបអរសាទរសិទ្ធិ និងសមភាពស្ត្រីលើសកលលោក',
    description_en: 'Celebration of women\'s achievements and rights',
  },
  {
    id: 'hol-4',
    name_km: 'ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ (មហាសង្ក្រាន្ត)',
    name_en: 'Khmer New Year Holiday',
    date: '2026-04-14',
    days: 3,
    category: 'National',
    description_km: 'ពិធីបុណ្យប្រពៃណីជាតិខ្មែរធំបំផុតប្រចាំឆ្នាំ (៣ ថ្ងៃ)',
    description_en: 'The biggest traditional holiday celebrating the lunar solar new year (3 days)',
  },
  {
    id: 'hol-5',
    name_km: 'ទិវាពលកម្មអន្តរជាតិ',
    name_en: 'International Labour Day',
    date: '2026-05-01',
    days: 1,
    category: 'National',
    description_km: 'ទិវាសិទ្ធិកម្មករនិយោជិតអន្តរជាតិ',
    description_en: 'Celebration of workers and labor rights globally',
  },
  {
    id: 'hol-6',
    name_km: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
    name_en: 'Royal Ploughing Ceremony',
    date: '2026-05-05',
    days: 1,
    category: 'Royal',
    description_km: 'ព្រះរាជពិធីប្រពៃណីប្រកាសរដូវធ្វើស្រែចម្ការ',
    description_en: 'Ancient royal ceremony marking the start of the rice-planting season',
  },
  {
    id: 'hol-7',
    name_km: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ',
    name_en: 'King Sihamoni\'s Birthday',
    date: '2026-05-14',
    days: 1,
    category: 'Royal',
    description_km: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្តេច ព្រះបរមនាថ នរោត្តម សីហមុនី',
    description_en: 'Official Birthday of His Majesty King Norodom Sihamoni',
  },
  {
    id: 'hol-8',
    name_km: 'ពិធីបុណ្យវិសាខបូជា',
    name_en: 'Visak Bochea Day',
    date: '2026-05-20',
    days: 1,
    category: 'Religious',
    description_km: 'រំលឹកដល់ការប្រសូត ការត្រាស់ដឹង និងការបរិនិព្វានរបស់ព្រះសម្មាសម្ពុទ្ធ',
    description_en: 'Birth, Enlightenment, and Passing of the Buddha',
  },
  {
    id: 'hol-9',
    name_km: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី ព្រះវររាជមាតាជាតិ',
    name_en: 'Queen Mother\'s Birthday',
    date: '2026-06-18',
    days: 1,
    category: 'Royal',
    description_km: 'ព្រះរាជពិធីចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ',
    description_en: 'Official Birthday of Her Majesty Queen Mother Norodom Monineath Sihanouk',
  },
  {
    id: 'hol-10',
    name_km: 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
    name_en: 'Constitutional Day',
    date: '2026-09-24',
    days: 1,
    category: 'National',
    description_km: 'រំលឹកខួបនៃការប្រកាសឱ្យប្រើប្រាស់រដ្ឋធម្មនុញ្ញឆ្នាំ ១៩៩៣',
    description_en: 'Commemoration of the adoption of the Constitution in 1993',
  },
  {
    id: 'hol-11',
    name_km: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ',
    name_en: 'Pchum Ben Festival (Ancestors\' Day)',
    date: '2026-10-09',
    days: 3,
    category: 'Religious',
    description_km: 'ពិធីបុណ្យសាសនាប្រពៃណីរំលឹកគុណបុព្វការីជន (៣ ថ្ងៃ)',
    description_en: 'Traditional festival paying respect to deceased ancestors and Buddhist monks (3 days)',
  },
  {
    id: 'hol-12',
    name_km: 'ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបរមរតនកោដ្ឋ',
    name_en: 'Commemoration of Late King-Father Norodom Sihanouk',
    date: '2026-10-15',
    days: 1,
    category: 'Memorial',
    description_km: 'ទិវារំលឹកព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណា ព្រះបាទសម្តេចព្រះ នរោត្តម សីហនុ',
    description_en: 'National day of mourning and tribute for the late King-Father',
  },
  {
    id: 'hol-13',
    name_km: 'ពិធីបុណ្យឯករាជ្យជាតិ',
    name_en: 'National Independence Day',
    date: '2026-11-09',
    days: 1,
    category: 'National',
    description_km: 'រំលឹកខួបនៃការទទួលបានឯករាជ្យពេញលេញពីសាធារណរដ្ឋបារាំង (១៩៥៣)',
    description_en: 'Celebration of Cambodia\'s independence gained from France in 1953',
  },
  {
    id: 'hol-14',
    name_km: 'ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ អកអំបុក',
    name_en: 'Water Festival (Bon Om Touk)',
    date: '2026-11-23',
    days: 3,
    category: 'National',
    description_km: 'ព្រះរាជពិធីប្រណាំងទូកងថ្នាក់ជាតិ និងអបអរសាទរបាតុភូតទន្លេសាប (៣ ថ្ងៃ)',
    description_en: 'Grand annual boat racing festival celebrating the flow reversal of the Tonle Sap river (3 days)',
  },
];

function ToolsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as ToolTab) || 'letters';

  const { language, t, showToast, companySettings } = useApp();
  const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ToolTab | null;
    if (tabParam && ['letters', 'calculator', 'holidays', 'contracts'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch((err) => console.error('Error loading employees for tools:', err));
  }, []);

  // ----------------------------------------------------
  // 1. HR LETTERS GENERATOR STATE
  // ----------------------------------------------------
  const [letterType, setLetterType] = useState<LetterType>('employment_cert');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [letterFields, setLetterFields] = useState({
    refNumber: 'HESTRA/HR/2026/0118',
    issueDate: '2026-10-24',
    empName: language === 'km' ? 'សារ៉ាត់ (Sarath)' : 'Sarath',
    empId: 'EMP-001',
    role: language === 'km' ? 'ប្រធាននាយកដ្ឋានធនធានមនុស្ស (Head of HR)' : 'Head of HR',
    department: language === 'km' ? 'ផ្នែកធនធានមនុស្ស (People & Culture)' : 'People & Culture',
    salary: 2500,
    joinDate: '2022-04-01',
    purpose: language === 'km' ? 'សម្រាប់ដាក់ពាក្យស្នើសុំទិដ្ឋាការ / Visa Application' : 'Visa Application',
    signatoryName: language === 'km' ? 'សារ៉ាត់ (Sarath)' : 'Sarath',
    signatoryTitle: language === 'km' ? 'ប្រធាននាយកដ្ឋានធនធានមនុស្ស (Head of HR)' : 'Head of HR',
  });

  // Synchronize initial letter fields if language changes
  useEffect(() => {
    setLetterFields((prev) => ({
      ...prev,
      empName: formatLocalizedText(prev.empName, language),
      role: formatLocalizedText(prev.role, language),
      department: formatLocalizedText(prev.department, language),
      purpose: language === 'km' ? 'សម្រាប់ដាក់ពាក្យស្នើសុំទិដ្ឋាការ / Visa Application' : 'Visa Application',
      signatoryName: formatLocalizedText(prev.signatoryName, language),
      signatoryTitle: formatLocalizedText(prev.signatoryTitle, language),
    }));
  }, [language]);

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const formattedName = `${emp.last_name} ${emp.first_name}`.trim();
      setLetterFields((prev) => ({
        ...prev,
        empName: language === 'km' ? formattedName : formatLocalizedText(formattedName, 'en'),
        empId: emp.id.toUpperCase(),
        role: language === 'km' ? emp.role : formatLocalizedText(emp.role, 'en'),
        department: language === 'km' ? (emp.department_name || prev.department) : formatLocalizedText(emp.department_name || prev.department, 'en'),
        salary: emp.salary,
        joinDate: formatDateDMY(emp.join_date),
      }));
      showToast(
        language === 'km'
          ? `បានបញ្ចូលព័ត៌មានបុគ្គលិក៖ ${emp.last_name} ${emp.first_name}`
          : `Loaded employee profile: ${formatLocalizedText(formattedName, 'en')}`,
        'info'
      );
    }
  };

  const printableLetterRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    const originalTitle = document.title;
    const certTypeSlug =
      letterType === 'employment_cert'
        ? 'Employment_Certificate'
        : letterType === 'salary_cert'
        ? 'Salary_Certificate'
        : letterType === 'probation_pass'
        ? 'Probation_Confirmation'
        : 'Promotion_Letter';
    const docName = `HESTRA_${certTypeSlug}_${letterFields.empId || 'Staff'}`;
    document.title = docName;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleCopyText = () => {
    if (typeof navigator !== 'undefined') {
      const text = language === 'km' ? `
លិខិតបញ្ជាក់ / OFFICIAL CERTIFICATE
លេខយោង / Ref: ${letterFields.refNumber}
កាលបរិច្ឆេទ / Date: ${letterFields.issueDate}

ក្រុមហ៊ុន HESTRA HRM CAMBODIA CO., LTD. សូមបញ្ជាក់ថា៖
ឈ្មោះបុគ្គលិក៖ ${letterFields.empName} (អត្តលេខ៖ ${letterFields.empId})
មុខតំណែង៖ ${letterFields.role}
ផ្នែក៖ ${letterFields.department}
កាលបរិច្ឆេទចូលបម្រើការងារ៖ ${letterFields.joinDate}
បៀវត្សរ៍មូលដ្ឋាន៖ $${letterFields.salary.toLocaleString()}
គោលបំណង៖ ${letterFields.purpose}

ចុះហត្ថលេខាដោយ៖
${letterFields.signatoryName}
${letterFields.signatoryTitle}
HESTRA HRM Cambodia Co., Ltd.
      `.trim() : `
OFFICIAL CERTIFICATE
Ref: ${letterFields.refNumber}
Date: ${letterFields.issueDate}

HESTRA HRM CAMBODIA CO., LTD. hereby certifies that:
Employee Name: ${formatLocalizedText(letterFields.empName, 'en')} (ID: ${letterFields.empId})
Role: ${formatLocalizedText(letterFields.role, 'en')}
Department: ${formatLocalizedText(letterFields.department, 'en')}
Join Date: ${letterFields.joinDate}
Base Salary: $${letterFields.salary.toLocaleString()}
Purpose: ${formatLocalizedText(letterFields.purpose, 'en')}

Signed by:
${formatLocalizedText(letterFields.signatoryName, 'en')}
${formatLocalizedText(letterFields.signatoryTitle, 'en')}
HESTRA HRM Cambodia Co., Ltd.
      `.trim();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast(
        language === 'km' ? 'បានចម្លងអត្ថបទលិខិតដោយជោគជ័យ!' : 'Certificate copied to clipboard!',
        'success'
      );
    }
  };

  // ----------------------------------------------------
  // 2. LABOR LAW & TAX CALCULATOR STATE
  // ----------------------------------------------------
  const [calcBaseSalary, setCalcBaseSalary] = useState<number>(1200);
  const [calcWorkingDays, setCalcWorkingDays] = useState<number>(26);
  const [calcMonthsInSemester, setCalcMonthsInSemester] = useState<number>(6);
  const [calcSpouseDeduction, setCalcSpouseDeduction] = useState<boolean>(false);
  const [calcChildrenCount, setCalcChildrenCount] = useState<number>(1);
  const [calcExchangeRate, setCalcExchangeRate] = useState<number>(4100);

  // A. Seniority Indemnity Calculation (ច្បាប់ស្តីពីការងារ - ប្រាក់បំណាច់អតីតភាព)
  const seniorityResults = useMemo(() => {
    const dailyWage = calcBaseSalary / calcWorkingDays;
    const semesterSeniorityPay = (7.5 / 6) * calcMonthsInSemester * dailyWage;
    const annualSeniorityPay = 15 * dailyWage;
    return {
      dailyWage,
      semesterSeniorityPay,
      annualSeniorityPay,
    };
  }, [calcBaseSalary, calcWorkingDays, calcMonthsInSemester]);

  // B. NSSF (ប.ស.ស) Calculation
  const nssfResults = useMemo(() => {
    const grossKHR = calcBaseSalary * calcExchangeRate;
    const cappedSalaryKHR = Math.min(grossKHR, 1200000);

    const occRiskKHR = cappedSalaryKHR * 0.008;
    const healthCareKHR = cappedSalaryKHR * 0.026;
    const pensionEmployerKHR = cappedSalaryKHR * 0.02;
    const pensionEmployeeKHR = cappedSalaryKHR * 0.02;

    const totalEmployerKHR = occRiskKHR + healthCareKHR + pensionEmployerKHR;
    const totalEmployeeKHR = pensionEmployeeKHR;

    return {
      cappedSalaryKHR,
      occRiskKHR,
      healthCareKHR,
      pensionEmployerKHR,
      pensionEmployeeKHR,
      totalEmployerKHR,
      totalEmployeeKHR,
      totalEmployerUSD: totalEmployerKHR / calcExchangeRate,
      totalEmployeeUSD: totalEmployeeKHR / calcExchangeRate,
    };
  }, [calcBaseSalary, calcExchangeRate]);

  // C. Cambodian Tax on Salary (GDT Progressive Tax Brackets)
  const taxResults = useMemo(() => {
    const grossKHR = calcBaseSalary * calcExchangeRate;
    let totalDeductionsKHR = 0;
    if (calcSpouseDeduction) totalDeductionsKHR += 150000;
    totalDeductionsKHR += calcChildrenCount * 150000;
    totalDeductionsKHR += nssfResults.totalEmployeeKHR;

    const taxableBaseKHR = Math.max(0, grossKHR - totalDeductionsKHR);

    let taxKHR = 0;
    let effectiveRate = 0;

    if (taxableBaseKHR <= 1500000) {
      taxKHR = 0;
      effectiveRate = 0;
    } else if (taxableBaseKHR <= 2000000) {
      taxKHR = taxableBaseKHR * 0.05 - 75000;
      effectiveRate = 5;
    } else if (taxableBaseKHR <= 8500000) {
      taxKHR = taxableBaseKHR * 0.10 - 175000;
      effectiveRate = 10;
    } else if (taxableBaseKHR <= 12500000) {
      taxKHR = taxableBaseKHR * 0.15 - 600000;
      effectiveRate = 15;
    } else {
      taxKHR = taxableBaseKHR * 0.20 - 1225000;
      effectiveRate = 20;
    }

    taxKHR = Math.max(0, taxKHR);
    const taxUSD = taxKHR / calcExchangeRate;
    const netTakeHomeUSD = calcBaseSalary - taxUSD - nssfResults.totalEmployeeUSD;

    return {
      grossKHR,
      totalDeductionsKHR,
      taxableBaseKHR,
      taxKHR,
      taxUSD,
      effectiveRate,
      netTakeHomeUSD,
    };
  }, [calcBaseSalary, calcExchangeRate, calcSpouseDeduction, calcChildrenCount, nssfResults]);

  // ----------------------------------------------------
  // 3. UPCOMING HOLIDAY FINDER
  // ----------------------------------------------------
  const holidayStats = useMemo(() => {
    const today = new Date('2026-10-24');
    const sorted = [...CAMBODIA_PUBLIC_HOLIDAYS].map((h) => {
      const hDate = new Date(h.date);
      const diffTime = hDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...h, diffDays };
    });

    const upcoming = sorted.filter((h) => h.diffDays >= 0).sort((a, b) => a.diffDays - b.diffDays);
    const past = sorted.filter((h) => h.diffDays < 0);
    return {
      next: upcoming[0] || sorted[0],
      upcoming,
      past,
      totalDays: sorted.reduce((acc, h) => acc + h.days, 0),
    };
  }, []);

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      {/* 1. PAGE HEADER & TITLE */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Scale size={16} />
            <span>{language === 'km' ? 'មជ្ឈមណ្ឌលជំនួយការងារធនធានមនុស្ស & ច្បាប់ការងារ' : 'HR Legal & Operational Toolkit'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {language === 'km' ? 'ឧបករណ៍ & ច្បាប់ការងារកម្ពុជា' : 'Cambodia HR Toolkit & Compliance'}
          </h1>
          <p className={`text-xs text-slate-500 mt-1 max-w-2xl ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km'
              ? 'បង្កើតលិខិតផ្លូវការ គណនាប្រាក់បំណាច់អតីតភាពការងារ ប.ស.ស ពន្ធលើប្រាក់បៀវត្សរ៍ ពិនិត្យប្រតិទិនបុណ្យជាតិ និងតាមដានសុពលភាពកិច្ចសន្យា។'
              : 'Official certificate generator, Cambodia Labor Law & NSSF calculators, national public holidays, and employment contract tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[10px] font-bold block leading-none text-indigo-500 uppercase">
                {language === 'km' ? 'អនុលោមភាពច្បាប់' : 'Legal Compliance'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {language === 'km' ? '១០០% ស្តង់ដារកម្ពុជា' : '100% MLVT & GDT Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="no-print flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('letters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'letters'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText size={15} />
          <span>{language === 'km' ? '១. បង្កើតលិខិតផ្លូវការ (HR Letters)' : '1. HR Official Letters'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calculator size={15} />
          <span>{language === 'km' ? '២. គណនាច្បាប់ការងារ & ពន្ធ (Calculator)' : '2. Labor Law & Tax Calc'}</span>
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'holidays'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarDays size={15} />
          <span>{language === 'km' ? '៣. ប្រតិទិនបុណ្យជាតិ (National Holidays)' : '3. National Holidays'}</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={15} />
          <span>{language === 'km' ? '៤. តាមដានកិច្ចសន្យា & សាកល្បង' : '4. Contract & Probation'}</span>
        </button>
      </div>

      {/* TAB 1: HR LETTERS */}
      {activeTab === 'letters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
          <div className="no-print lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'km' ? 'កំណត់ទម្រង់លិខិតផ្លូវការ' : 'Document Configuration'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' ? 'បំពេញព័ត៌មាន ឬជ្រើសបុគ្គលិកដោយស្វ័យប្រវត្តិ' : 'Select employee or customize parameters'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'km' ? 'ប្រភេទលិខិតផ្លូវការ' : 'Official Document Template'}
              </label>
              <select
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
              >
                <option value="employment_cert">
                  {language === 'km' ? 'លិខិតបញ្ជាក់ការងារ (Certificate of Employment)' : 'Certificate of Employment'}
                </option>
                <option value="salary_cert">
                  {language === 'km' ? 'លិខិតបញ្ជាក់ប្រាក់បៀវត្សរ៍ (Salary & Tax Confirmation)' : 'Salary & Tax Confirmation'}
                </option>
                <option value="probation_pass">
                  {language === 'km' ? 'លិខិតបញ្ជាក់ការបញ្ចប់សាកល្បងការងារ (Probation Passing)' : 'Confirmation of Probation Completion'}
                </option>
                <option value="promotion_letter">
                  {language === 'km' ? 'លិខិតសរសើរ ឬតម្លើងតួនាទី (Commendation & Promotion)' : 'Promotion & Excellence Commendation'}
                </option>
              </select>
            </div>

            {employees.length > 0 && (
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70">
                <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600" />
                  <span>{language === 'km' ? 'ទាញទិន្នន័យពីបញ្ជីបុគ្គលិក' : 'Autofill From Active Directory'}</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="">{language === 'km' ? '-- ជ្រើសរើសបុគ្គលិកដើម្បីបញ្ចូលព័ត៌មាន --' : '-- Select employee to autofill --'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {formatLocalizedText(`${emp.last_name} ${emp.first_name}`, language)} - {formatLocalizedText(emp.role, language)} ({formatLocalizedText(emp.department_name || '', language)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'លេខយោងលិខិត (Ref No.)' : 'Reference No.'}
                </label>
                <input
                  type="text"
                  value={letterFields.refNumber}
                  onChange={(e) => setLetterFields({ ...letterFields, refNumber: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'កាលបរិច្ឆេទចេញលិខិត' : 'Issue Date'}
                </label>
                <input
                  type="date"
                  value={letterFields.issueDate}
                  onChange={(e) => setLetterFields({ ...letterFields, issueDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ឈ្មោះបុគ្គលិក' : 'Employee Name'}
                </label>
                <input
                  type="text"
                  value={letterFields.empName}
                  onChange={(e) => setLetterFields({ ...letterFields, empName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'អត្តលេខ (Emp ID)' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  value={letterFields.empId}
                  onChange={(e) => setLetterFields({ ...letterFields, empId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'មុខតំណែង (Role)' : 'Designation / Role'}
                </label>
                <input
                  type="text"
                  value={letterFields.role}
                  onChange={(e) => setLetterFields({ ...letterFields, role: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ផ្នែក (Department)' : 'Department'}
                </label>
                <input
                  type="text"
                  value={letterFields.department}
                  onChange={(e) => setLetterFields({ ...letterFields, department: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ប្រាក់បៀវត្សរ៍មូលដ្ឋាន ($)' : 'Base Salary ($)'}
                </label>
                <input
                  type="number"
                  value={letterFields.salary}
                  onChange={(e) => setLetterFields({ ...letterFields, salary: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ថ្ងៃចូលបម្រើការងារ' : 'Join Date'}
                </label>
                <input
                  type="date"
                  value={letterFields.joinDate}
                  onChange={(e) => setLetterFields({ ...letterFields, joinDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {language === 'km' ? 'គោលបំណងចេញលិខិត (Purpose)' : 'Purpose of Issuance'}
              </label>
              <input
                type="text"
                value={letterFields.purpose}
                onChange={(e) => setLetterFields({ ...letterFields, purpose: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                placeholder={language === 'km' ? "ឧ. សម្រាប់ដាក់ពាក្យស្នើសុំទិដ្ឋាការ / For Visa Application" : "e.g., For Visa Application / Official Verification"}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>{language === 'km' ? 'បោះពុម្ពលិខិត (Print A4)' : 'Print Document (A4)'}</span>
              </button>

              <button
                onClick={handleCopyText}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? (language === 'km' ? 'បានចម្លង' : 'Copied!') : (language === 'km' ? 'ចម្លងអត្ថបទ' : 'Copy Text')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3 print:w-full print:block print:space-y-0 print:m-0 print:p-0">
            <div className="no-print flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold flex items-center gap-1 text-slate-700">
                <Sparkles size={14} className="text-indigo-600" />
                {language === 'km' ? 'ទិដ្ឋភាពជាក់ស្តែងទំហំ A4 (Live Official Preview)' : 'Live Document Preview (A4 Standard)'}
              </span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                {letterFields.refNumber}
              </span>
            </div>

            <div
              ref={printableLetterRef}
              className="printable-letter-document bg-white border border-slate-300 rounded-2xl shadow-md p-8 sm:p-12 text-slate-800 text-xs font-sans relative overflow-hidden min-h-[620px] print:min-h-0 print:border-none print:shadow-none print:p-0 print:rounded-none print:m-0 print:w-full print:max-w-none print:text-black print:overflow-visible print:bg-white"
            >
              <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 print:break-inside-avoid">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xl overflow-hidden p-1 shrink-0">
                    <img src="/hestra-logo.svg" alt="HESTRA HRM" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {companySettings?.name || 'HESTRA-GLOVES HRM (Cambodia) Ltd'}
                    </h2>
                    <p className={`text-[11px] text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {companySettings?.address || (language === 'km' 
                        ? 'តំបន់សេដ្ឋកិច្ចពិសេស រ៉ូយ៉ាល់ គ្រុប ភ្នំពេញ (RGPPSEZ), ខណ្ឌកំបូល, រាជធានីភ្នំពេញ' 
                        : 'Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia')}
                    </p>
                    <p className={`text-[10px] text-slate-400 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>TIN: K009-90218928 &bull; NSSF: 1029482 &bull; Email: hr@outlook.com</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block">
                    Ref: {letterFields.refNumber}
                  </span>
                  <span className={`text-[11px] text-slate-600 block mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? 'កាលបរិច្ឆេទ៖' : 'Date:'} {letterFields.issueDate}
                  </span>
                </div>
              </div>

              <div className="text-center my-8 print:break-inside-avoid">
                {letterType === 'employment_cert' && (
                  <>
                    {language === 'km' && (
                      <h1 className="text-base sm:text-lg font-khmer-moul text-slate-900 block leading-relaxed">
                        លិខិតបញ្ជាក់ការងារ
                      </h1>
                    )}
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 block mt-0.5">
                      CERTIFICATE OF EMPLOYMENT
                    </span>
                  </>
                )}
                {letterType === 'salary_cert' && (
                  <>
                    {language === 'km' && (
                      <h1 className="text-base sm:text-lg font-khmer-moul text-slate-900 block leading-relaxed">
                        លិខិតបញ្ជាក់ប្រាក់បៀវត្សរ៍ និងតួនាទី
                      </h1>
                    )}
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 block mt-0.5">
                      SALARY & EMPLOYMENT VERIFICATION LETTER
                    </span>
                  </>
                )}
                {letterType === 'probation_pass' && (
                  <>
                    {language === 'km' && (
                      <h1 className="text-base sm:text-lg font-khmer-moul text-slate-900 block leading-relaxed">
                        លិខិតបញ្ជាក់ការបញ្ចប់សាកល្បងការងារ
                      </h1>
                    )}
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 block mt-0.5">
                      CONFIRMATION OF PROBATION COMPLETION
                    </span>
                  </>
                )}
                {letterType === 'promotion_letter' && (
                  <>
                    {language === 'km' && (
                      <h1 className="text-base sm:text-lg font-khmer-moul text-slate-900 block leading-relaxed">
                        លិខិតសរសើរ និងតម្លើងតួនាទី
                      </h1>
                    )}
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 block mt-0.5">
                      PROMOTION & EXCELLENCE COMMENDATION
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                {language === 'km' ? (
                  <p>
                    នាយកដ្ឋានធនធានមនុស្ស នៃក្រុមហ៊ុន <strong>HESTRA HRM CAMBODIA CO., LTD.</strong> សូមបញ្ជាក់ជូនថា សាមីខ្លួនឈ្មោះ <strong>{formatLocalizedText(letterFields.empName, language)}</strong> (អត្តលេខបុគ្គលិក៖ <strong>{letterFields.empId}</strong>) ពិតជាបុគ្គលិកបម្រើការងារពេញម៉ោងក្នុងក្រុមហ៊ុនរបស់យើងខ្ញុំប្រាកដមែន ដោយមានព័ត៌មានលម្អិតដូចខាងក្រោម៖
                  </p>
                ) : (
                  <p>
                    The Human Resources Department of <strong>HESTRA HRM CAMBODIA CO., LTD.</strong> hereby certifies that <strong>{formatLocalizedText(letterFields.empName, language)}</strong> (Employee ID: <strong>{letterFields.empId}</strong>) is currently a full-time regular employee of the company with details as follows:
                  </p>
                )}

                <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 print:break-inside-avoid">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {language === 'km' ? 'មុខតំណែងបច្ចុប្បន្ន (Job Title):' : 'Current Job Title:'}
                      </span>
                      <span className="font-bold text-slate-900">{formatLocalizedText(letterFields.role, language)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {language === 'km' ? 'នាយកដ្ឋាន / ផ្នែក (Department):' : 'Department:'}
                      </span>
                      <span className="font-bold text-slate-900">{formatLocalizedText(letterFields.department, language)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {language === 'km' ? 'កាលបរិច្ឆេទចូលបម្រើការ (Join Date):' : 'Date of Joining:'}
                      </span>
                      <span className="font-bold text-slate-900">{letterFields.joinDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {language === 'km' ? 'ប្រាក់បៀវត្សរ៍មូលដ្ឋាន (Base Salary):' : 'Base Monthly Salary:'}
                      </span>
                      <span className="font-bold text-indigo-700 font-mono">
                        ${letterFields.salary.toLocaleString()} USD {language === 'km' ? '/ ខែ' : '/ month'}
                      </span>
                    </div>
                  </div>
                </div>

                {letterType === 'employment_cert' && (
                  <p>
                    {language === 'km'
                      ? `លិខិតនេះត្រូវបានចេញជូនតាមការស្នើសុំរបស់សាមីខ្លួន សម្រាប់ប្រើប្រាស់ជាផ្លូវការក្នុងគោលបំណង៖ ${formatLocalizedText(letterFields.purpose, language)}។ សាមីខ្លួនជាបុគ្គលិកដែលមានការទទួលខុសត្រូវខ្ពស់ និងគោរពបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុនយ៉ាងខ្ជាប់ខ្ជួន។`
                      : `This certificate is issued upon the employee's request for the official purpose of: ${formatLocalizedText(letterFields.purpose, language)}. The employee has consistently performed their duties with high responsibility and adhered strictly to company internal policies.`}
                  </p>
                )}

                {letterType === 'salary_cert' && (
                  <p>
                    {language === 'km'
                      ? 'ក្រុមហ៊ុនសូមបញ្ជាក់ថា ប្រាក់បៀវត្សរ៍ខាងលើត្រូវបានទូទាត់ត្រឹមត្រូវតាមប្រព័ន្ធធនាគារ និងបានកាត់កងបង់វិភាគទានរបបសន្តិសុខសង្គម (ប.ស.ស) និងពន្ធលើប្រាក់បៀវត្សរ៍ស្របតាមច្បាប់ការងារ និងបទប្បញ្ញត្តិពន្ធដារនៃព្រះរាជាណាចក្រកម្ពុជា។'
                      : 'The company hereby certifies that the aforementioned compensation is disbursed through direct bank transfer, and all statutory National Social Security Fund (NSSF) contributions as well as Tax on Salary have been duly remitted in full compliance with the laws of the Kingdom of Cambodia.'}
                  </p>
                )}

                {letterType === 'probation_pass' && (
                  <p>
                    {language === 'km' ? (
                      <>
                        ផ្អែកលើលទ្ធផលវាយតម្លៃសមិទ្ធកម្មការងារក្នុងអំឡុងពេលសាកល្បង គណៈគ្រប់គ្រងក្រុមហ៊ុនសូមប្រកាសទទួលស្គាល់សាមីខ្លួនជា <strong>បុគ្គលិកពេញសិទ្ធិ (Regular Full-Time Employee)</strong> ចាប់ពីកាលបរិច្ឆេទនេះតទៅ ជាមួយនឹងអត្ថប្រយោជន៍ពេញលេញស្របតាមគោលនយោបាយក្រុមហ៊ុន។
                      </>
                    ) : (
                      <>
                        Based on commendable performance evaluation during the probationary evaluation period, the executive management officially confirms the employee as a <strong>Regular Full-Time Employee</strong> effective immediately, entitled to full benefits and statutory rights.
                      </>
                    )}
                  </p>
                )}

                {letterType === 'promotion_letter' && (
                  <p>
                    {language === 'km'
                      ? 'ដើម្បីឆ្លើយតបនឹងការខិតខំប្រឹងប្រែង និងលទ្ធផលការងារឆ្នើម ក្រុមហ៊ុនសូមសម្តែងការអបអរសាទរយ៉ាងកក់ក្តៅ និងផ្តល់សេចក្តីទុកចិត្តក្នុងការប្រគល់ភារកិច្ចជាន់ខ្ពស់នេះជូន។'
                      : 'In sincere recognition of your hard work, dedication, and exemplary performance achievements, the company warmly congratulates you on this promotion and places full trust in your ongoing leadership.'}
                  </p>
                )}

                <p className="pt-2 italic text-slate-500">
                  {language === 'km'
                    ? 'អាស្រ័យហេតុនេះ សូមស្ថាប័នពាក់ព័ន្ធមេត្តាជ្រាប និងទទួលស្គាល់លិខិតបញ្ជាក់នេះជាផ្លូវការ។'
                    : 'This certificate is issued to serve as official verification for any relevant embassies, institutions, or authorities.'}
                </p>
              </div>

              <div className="mt-12 pt-6 flex items-end justify-between print:break-inside-avoid">
                <div>
                  <div className="w-20 h-20 rounded-full border-2 border-indigo-600/30 flex items-center justify-center p-1 text-[9px] font-bold text-indigo-800 text-center uppercase tracking-tighter opacity-80 rotate-[-12deg] select-none pointer-events-none">
                    HESTRA HRM<br/>CAMBODIA<br/>★ SEAL ★
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'km' ? 'តំណាងគណៈគ្រប់គ្រងក្រុមហ៊ុន (Authorized Signatory)' : 'Authorized Signatory'}
                  </span>
                  <div className="h-10 flex items-center justify-end">
                    <span className="font-serif italic text-lg text-indigo-900 opacity-90">Sarath</span>
                  </div>
                  <span className={`font-bold text-slate-900 block ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(letterFields.signatoryName, language)}</span>
                  <span className={`text-[11px] text-slate-500 block ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(letterFields.signatoryTitle, language)}</span>
                  <span className="text-[10px] text-slate-400 block">HESTRA HRM Cambodia Co., Ltd.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALCULATORS */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-600" />
                  <span>{language === 'km' ? 'ប៉ារ៉ាម៉ែត្រគណនាប្រាក់បៀវត្សរ៍មូលដ្ឋាន' : 'Base Compensation Parameters'}</span>
                </h3>
                <p className={`text-[11px] text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'បញ្ចូលប្រាក់ខែដើម្បីគណនាប្រាក់បំណាច់អតីតភាព ប.ស.ស និងពន្ធលើប្រាក់បៀវត្សរ៍' : 'Values dynamically update all 3 legal Cambodia calculators'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-bold">
                  {language === 'km' ? 'អត្រាប្តូរប្រាក់ (KHR/$):' : 'Rate (KHR/$):'}
                </span>
                <input
                  type="number"
                  value={calcExchangeRate}
                  onChange={(e) => setCalcExchangeRate(Number(e.target.value) || 4100)}
                  className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ប្រាក់ខែគោល ($/ខែ)' : 'Monthly Base Salary ($)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={calcBaseSalary}
                    onChange={(e) => setCalcBaseSalary(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  ~ {(calcBaseSalary * calcExchangeRate).toLocaleString()} KHR
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ថ្ងៃការងារក្នុង ១ ខែ' : 'Working Days / Month'}
                </label>
                <select
                  value={calcWorkingDays}
                  onChange={(e) => setCalcWorkingDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value={26}>{language === 'km' ? '២៦ ថ្ងៃ (ស្តង់ដារច្បាប់ការងារទូទៅ - 26 days)' : '26 days (General labor standard)'}</option>
                  <option value={22}>{language === 'km' ? '២២ ថ្ងៃ (ចន្ទ-សុក្រ ៥ ថ្ងៃ/សប្តាហ៍ - 22 days)' : '22 days (Mon-Fri 5 days/week)'}</option>
                  <option value={24}>{language === 'km' ? '២៤ ថ្ងៃ (ការិយាល័យពាក់កណ្តាល - 24 days)' : '24 days (Alternate Saturdays)'}</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {language === 'km' ? 'មូលដ្ឋានគណនាប្រាក់ឈ្នួលប្រចាំថ្ងៃ' : 'Basis for daily average wage'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'បន្ទុកគ្រួសារ (កូនក្នុងបន្ទុក)' : 'Dependent Children'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={calcChildrenCount}
                  onChange={(e) => setCalcChildrenCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {language === 'km' ? '-150,000 KHR / កូនម្នាក់' : '-150,000 KHR / child'}
                </span>
              </div>

              <div className="flex flex-col justify-between">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'បន្ទុកសហព័ទ្ធ (ស្វាមី/ភរិយា)' : 'Dependent Spouse'}
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={calcSpouseDeduction}
                    onChange={(e) => setCalcSpouseDeduction(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>{language === 'km' ? 'សហព័ទ្ធគ្មានចំណូល' : 'Non-working spouse'}</span>
                </label>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {language === 'km' ? '-150,000 KHR កាត់បន្ថយពន្ធ' : '-150,000 KHR tax deduction'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {language === 'km' ? 'ប្រាក់បំណាច់អតីតភាពការងារ' : 'Seniority Indemnity'}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {language === 'km' ? 'ច្បាប់ការងារ មាត្រា ៨៩ & ប្រកាស ៤៤៣' : 'Labor Law Art. 89 & Prakas 443'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {language === 'km' ? 'លើកលែងពន្ធ 100%' : '100% Tax-Exempt'}
                  </span>
                </div>

                <p className={`text-[11px] text-slate-500 mt-2 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km'
                    ? 'និយោជិតកិច្ចសន្យា UDC ទទួលបាន ១៥ ថ្ងៃ/ឆ្នាំ (៧.៥ ថ្ងៃបើកក្នុងខែមិថុនា និង ៧.៥ ថ្ងៃបើកក្នុងខែធ្នូ)។'
                    : '15 days of salary per year paid in two equal tranches of 7.5 days in June and December.'}
                </p>

                <div className="my-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">
                      {language === 'km' ? 'ប្រាក់ឈ្នួលមធ្យម ១ ថ្ងៃ៖' : 'Average Daily Wage:'}
                    </span>
                    <span className="font-mono font-bold">${seniorityResults.dailyWage.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200/70">
                    <span className="font-bold text-amber-900">
                      {language === 'km' ? 'ប្រាក់បំណាច់ ១ ឆមាស (៧.៥ ថ្ងៃ)៖' : '1 Semester (7.5 days):'}
                    </span>
                    <span className="font-mono font-black text-amber-700 text-sm">
                      ${seniorityResults.semesterSeniorityPay.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">
                      {language === 'km' ? 'សរុប ១ ឆ្នាំពេញ (១៥ ថ្ងៃ)៖' : 'Full Year Total (15 days):'}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ${seniorityResults.annualSeniorityPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                💡 {language === 'km' ? 'មិនត្រូវបានគិតបញ្ចូលក្នុងមូលដ្ឋានគិតពន្ធលើប្រាក់បៀវត្សរ៍ឡើយ (Tax-free benefit)' : 'Exempt from Tax on Salary (Statutory tax-free benefit)'}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {language === 'km' ? 'វិភាគទាន ប.ស.ស (NSSF)' : 'NSSF Contributions'}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {language === 'km' ? 'ពិដានគិតត្រឹម ១,២០០,០០០ រៀល' : 'Capped at 1,200,000 KHR'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {language === 'km' ? 'ក្រុមហ៊ុនបង់ជូន (Employer - 5.4%)' : 'Employer Share (5.4%)'}
                    </span>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{language === 'km' ? '• ថែទាំសុខភាព (Health 2.6%):' : '• Health Care (2.6%):'}</span>
                      <span className="font-mono font-bold">{(nssfResults.healthCareKHR).toLocaleString()} KHR</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{language === 'km' ? '• ហានិភ័យការងារ (Risk 0.8%):' : '• Occupational Risk (0.8%):'}</span>
                      <span className="font-mono font-bold">{(nssfResults.occRiskKHR).toLocaleString()} KHR</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{language === 'km' ? '• សោធន (Pension 2.0%):' : '• Pension (2.0%):'}</span>
                      <span className="font-mono font-bold">{(nssfResults.pensionEmployerKHR).toLocaleString()} KHR</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-indigo-700">
                      <span>{language === 'km' ? 'សរុបក្រុមហ៊ុន៖' : 'Total Employer:'}</span>
                      <span className="font-mono">${nssfResults.totalEmployerUSD.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-indigo-900 block">
                          {language === 'km' ? 'និយោជិតត្រូវកាត់ (Employee - 2%)' : 'Employee Deduction (2.0%)'}
                        </span>
                        <span className="text-[10px] text-indigo-600">
                          {language === 'km' ? 'បេឡាសោធននិវត្តន៍ (Pension)' : 'Pension Scheme'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        ${nssfResults.totalEmployeeUSD.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                💡 {language === 'km' ? 'ភាគទានបៀវត្សរ៍ ប.ស.ស ត្រូវបង់យ៉ាងយឺតត្រឹមថ្ងៃទី ១៥ នៃខែបន្ទាប់' : 'NSSF contributions must be declared and settled by the 15th of each month.'}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {language === 'km' ? 'ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Tax)' : 'Tax on Salary (TOS)'}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {language === 'km' ? 'អត្រាកើនតាមថ្នាក់ (Progressive Bands)' : 'Progressive Tax Bands'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {taxResults.effectiveRate}% Band
                  </span>
                </div>

                <div className="my-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">{language === 'km' ? 'ចំណូលសរុប (Gross):' : 'Gross Salary:'}</span>
                    <span className="font-mono font-bold">${calcBaseSalary.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">{language === 'km' ? 'កាត់បន្ថយបន្ទុក (Relief):' : 'Deductions (Relief):'}</span>
                    <span className="font-mono font-bold text-emerald-600">
                      -{(taxResults.totalDeductionsKHR).toLocaleString()} KHR
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">{language === 'km' ? 'មូលដ្ឋានគិតពន្ធ (Taxable):' : 'Taxable Base:'}</span>
                    <span className="font-mono font-bold">
                      {(taxResults.taxableBaseKHR).toLocaleString()} KHR
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <div>
                      <span className="font-bold text-emerald-900 block">{language === 'km' ? 'ពន្ធត្រូវបង់ (Tax Payable):' : 'Tax Payable:'}</span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {(taxResults.taxKHR).toLocaleString()} KHR
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-800 text-base">
                      ${taxResults.taxUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/60 font-bold text-indigo-900">
                    <span>{language === 'km' ? 'ប្រាក់ខែជាក់ស្តែងទទួលបាន (Net):' : 'Net Take-Home Pay:'}</span>
                    <span className="font-mono text-sm font-black text-indigo-700">
                      ${taxResults.netTakeHomeUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                💡 {language === 'km' ? 'ផុតកំណត់ប្រកាស និងបង់ពន្ធត្រឹមថ្ងៃទី ២៥ នៃខែបន្ទាប់' : 'Tax on Salary declaration due by the 25th of the following month.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          {holidayStats.next && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                      ★ {language === 'km' ? 'បុណ្យជាតិបន្ទាប់ (Upcoming)' : 'Next Official Holiday'}
                    </span>
                    <span className="text-xs font-mono text-indigo-300">
                      {holidayStats.next.date} ({holidayStats.next.days} {language === 'km' ? 'ថ្ងៃ' : 'days'})
                    </span>
                  </div>

                  <h2 className={`text-xl sm:text-2xl font-black text-white ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? holidayStats.next.name_km : holidayStats.next.name_en}
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-200">
                    {language === 'km' 
                      ? `${holidayStats.next.name_en} • ${holidayStats.next.description_km}`
                      : holidayStats.next.description_en}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                  <div className="text-center px-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 block leading-tight">
                      {holidayStats.next.diffDays}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                      {language === 'km' ? 'ថ្ងៃនៅសល់ (Days Left)' : 'Days Remaining'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CalendarDays size={18} className="text-indigo-600" />
                  <span>{language === 'km' ? 'ប្រតិទិនថ្ងៃឈប់សម្រាកបុណ្យជាតិកម្ពុជាផ្លូវការ (២០២៦)' : 'Official Cambodia Public Holidays Calendar (2026)'}</span>
                </h3>
                <p className={`text-xs text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'យោងតាមអនុក្រឹត្យរាជរដ្ឋាភិបាលកម្ពុជា សរុបចំនួន ២២ ថ្ងៃឈប់សម្រាកក្នុងឆ្នាំ' : 'Issued pursuant to Royal Sub-Decree of the Royal Government of Cambodia'}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                {language === 'km' ? `សរុប ${holidayStats.totalDays} ថ្ងៃឈប់សម្រាក` : `Total ${holidayStats.totalDays} Public Holidays`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{language === 'km' ? 'កាលបរិច្ឆេទ (Date)' : 'Date'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'ឈ្មោះពិធីបុណ្យជាតិ (Holiday Name)' : 'Holiday Name'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'ចំនួនថ្ងៃ (Days)' : 'Duration'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'ប្រភេទ (Category)' : 'Category'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាព (Status)' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {CAMBODIA_PUBLIC_HOLIDAYS.map((h) => {
                    const today = new Date('2026-10-24');
                    const hDate = new Date(h.date);
                    const diffDays = Math.ceil((hDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isUpcoming = diffDays >= 0;

                    return (
                      <tr key={h.id} className={`hover:bg-slate-50/80 transition-colors ${diffDays >= 0 && diffDays <= 30 ? 'bg-indigo-50/30' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-slate-900">
                          {h.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{language === 'km' ? h.name_km : h.name_en}</span>
                          <span className="text-[11px] text-slate-400 font-sans">{language === 'km' ? h.name_en : h.description_en}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {h.days} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.category === 'National' ? 'bg-blue-50 text-blue-700' :
                            h.category === 'Royal' ? 'bg-purple-50 text-purple-700' :
                            h.category === 'Religious' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {h.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isUpcoming ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {language === 'km' ? `នៅសល់ ${diffDays} ថ្ងៃ` : `In ${diffDays} days`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {language === 'km' ? 'បានឆ្លងផុត' : 'Passed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTRACTS & PROBATION */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'km' ? 'សាកល្បងការងារ (Probation)' : 'Probationary Staff'}
                </span>
                <span className="text-xl font-black text-slate-900">
                  {employees.filter((e) => {
                    const join = new Date(e.join_date).getTime();
                    const now = new Date('2026-10-24').getTime();
                    const diffDays = (now - join) / (1000 * 60 * 60 * 24);
                    return diffDays >= 0 && diffDays <= 90;
                  }).length} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
                <p className="text-[10px] text-slate-500">
                  {language === 'km' ? 'ស្តង់ដារ ៣ ខែតាមច្បាប់ការងារ' : 'Standard 3 months MLVT duration'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Building2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'km' ? 'កិច្ចសន្យាកំណត់ (FDC)' : 'Fixed Duration (FDC)'}
                </span>
                <span className="text-xl font-black text-slate-900">
                  {employees.filter((e) => e.employment_type === 'Contract').length} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
                <p className="text-[10px] text-slate-500">
                  {language === 'km' ? 'ប្រាក់បំណាច់ ៥% ពេលចប់' : '5% severance upon completion'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'km' ? 'កិច្ចសន្យាមិនកំណត់ (UDC)' : 'Undetermined (UDC)'}
                </span>
                <span className="text-xl font-black text-slate-900">
                  {employees.filter((e) => e.employment_type === 'Full-Time').length} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
                <p className="text-[10px] text-slate-500">
                  {language === 'km' ? 'ទទួលបានប្រាក់អតីតភាព ១៥ ថ្ងៃ/ឆ្នាំ' : 'Seniority indemnity 15 days/yr'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'km' ? 'បញ្ជីតាមដានកិច្ចសន្យា & ការសាកល្បងការងារ' : 'Active Contract & Probation Roster'}
                </h3>
                <p className={`text-xs text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'ពិនិត្យកាលបរិច្ឆេទផុតកំណត់ និងបង្កើតលិខិតផ្លូវការដោយ ១ ចុច' : 'Monitor upcoming expiries and generate verification letters'}
                </p>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users size={24} />
                </div>
                <h4 className="text-xs font-bold text-slate-700">
                  {language === 'km' ? 'ពុំទាន់មានបុគ្គលិកក្នុងបញ្ជីនៅឡើយ' : 'No staff members recorded'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'km' ? 'សូមបញ្ចូលបុគ្គលិកថ្មីដើម្បីតាមដានកិច្ចសន្យាការងារ។' : 'Please register staff to track employment contracts.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">{language === 'km' ? 'បុគ្គលិក (Employee)' : 'Employee'}</th>
                      <th className="py-2.5 px-3">{language === 'km' ? 'មុខតំណែង (Role)' : 'Role'}</th>
                      <th className="py-2.5 px-3">{language === 'km' ? 'ប្រភេទកិច្ចសន្យា' : 'Contract Type'}</th>
                      <th className="py-2.5 px-3">{language === 'km' ? 'កាលបរិច្ឆេទចូល' : 'Join Date'}</th>
                      <th className="py-2.5 px-3">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'km' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {employees.map((emp) => {
                      const join = new Date(emp.join_date).getTime();
                      const now = new Date('2026-10-24').getTime();
                      const diffDays = (now - join) / (1000 * 60 * 60 * 24);
                      const isProbation = diffDays >= 0 && diffDays <= 90;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{formatLocalizedText(`${emp.last_name} ${emp.first_name}`, language)}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{formatLocalizedText(emp.role, language)}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                              {formatLocalizedText(emp.employment_type, language)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">{formatDateDMY(emp.join_date)}</td>
                          <td className="py-3 px-3">
                            {isProbation ? (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                {language === 'km' ? `សាកល្បង (${Math.max(0, 90 - Math.round(diffDays))} ថ្ងៃទៀត)` : `Probation (${Math.max(0, 90 - Math.round(diffDays))} days left)`}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {language === 'km' ? 'ពេញសិទ្ធិ (Regular)' : 'Regular (Confirmed)'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                handleSelectEmployee(emp.id);
                                setActiveTab('letters');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              {language === 'km' ? 'ចេញលិខិត' : 'Draft Letter'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HRToolsPage() {
  const { language } = useApp();
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">{language === 'km' ? 'កំពុងដំណើរការឧបករណ៍ធនធានមនុស្ស...' : 'Loading HR Toolkit...'}</div>}>
      <ToolsContent />
    </Suspense>
  );
}
