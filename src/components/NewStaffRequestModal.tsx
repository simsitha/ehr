'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Laptop,
  Monitor,
  DollarSign,
  Package,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Printer,
  Smartphone,
  Headphones,
  Tag,
  ChevronDown,
  Check,
  Layers,
} from 'lucide-react';

interface NewStaffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmployeeId?: string;
  defaultEmployeeName?: string;
  defaultDepartment?: string;
  currentSalary?: number;
}

export type MaterialCategoryGroup = 'all' | 'office_material' | 'it_device';

export interface MaterialPresetItem {
  id: string;
  name: string;
  name_km: string;
  group: 'office_material' | 'it_device';
  groupLabel: string;
  groupLabel_km: string;
  category: 'standard_material' | 'high_value_asset';
  requiresTopManagement: boolean;
  estimatedCost: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  description_km: string;
}

export const MATERIAL_PRESETS: MaterialPresetItem[] = [
  // ==================== OFFICE MATERIAL ====================
  {
    id: 'office-ergonomic-chair',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Ergonomic Office Chair & Lumbar Support',
    name_km: 'កៅអីការិយាល័យ Ergonomic & ទម្រចង្កេះ',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 180,
    icon: Briefcase,
    description: 'High-back breathable mesh ergonomic chair with adjustable 3D armrests & lumbar support',
    description_km: 'កៅអីការិយាល័យទ្រទ្រង់ឆ្អឹងខ្នង និងចង្កេះ បន្ថយភាពនឿយហត់ពេលអង្គុយធ្វើការ',
  },
  {
    id: 'office-standing-desk',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Standing Desk / Executive Workstation Desk',
    name_km: 'តុធ្វើការ Ergonomic / តុការិយាល័យ',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 280,
    icon: Briefcase,
    description: 'Electric adjustable height sit-stand desk with cable management tray',
    description_km: 'តុធ្វើការអាចកែសម្រួលកម្ពស់អង្គុយ-ឈរដោយអគ្គិសនី ឬតុប្រធាន',
  },
  {
    id: 'office-whiteboard',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Mobile Whiteboard & Presentation Board',
    name_km: 'ក្តារខៀនចល័ត & ផ្ទាំងបង្ហាញ Magnetic',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 120,
    icon: Package,
    description: 'Double-sided magnetic dry-erase whiteboard on heavy-duty lockable rolling wheels',
    description_km: 'ក្តារខៀនសរសេរម៉ាញ៉េទិកមុខពីរ មានកង់រុញចល័តងាយស្រួលប្រជុំពិភាក្សា',
  },
  {
    id: 'office-stationery-pack',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Office Stationery & Printing Paper Bundle',
    name_km: 'សម្ភារៈការិយាល័យ & ក្រដាសបោះពុម្ព A4',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 45,
    icon: Package,
    description: 'Box of A4 paper reams, executive notebooks, ballpoint pens, document folders, and clips',
    description_km: 'ក្រដាស A4 សៀវភៅកត់ត្រា ប៊ិក ថតឯកសារ និងសម្ភារៈប្រើប្រាស់លើតុ',
  },
  {
    id: 'office-filing-cabinet',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Steel Filing Cabinet / Storage Locker',
    name_km: 'ទូដែកផ្ទុកឯកសារ / ទូឯកសារសុវត្ថិភាព',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 160,
    icon: Package,
    description: 'Multi-drawer fire-resistant lockable steel cabinet for confidential company records',
    description_km: 'ទូដែកមានសោសុវត្ថិភាព សម្រាប់រក្សាទុកឯកសារក្រុមហ៊ុនសំខាន់ៗ',
  },
  {
    id: 'office-uniform-id',
    group: 'office_material',
    groupLabel: 'Office Material',
    groupLabel_km: 'សម្ភារៈការិយាល័យ',
    name: 'Company Uniform & Staff ID Access Card',
    name_km: 'ឯកសណ្ឋានក្រុមហ៊ុន & កាតបុគ្គលិក RFID',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 35,
    icon: Tag,
    description: 'Official company polo uniform, branded lanyard, and RFID magnetic entrance keycard',
    description_km: 'អាវឯកសណ្ឋានក្រុមហ៊ុន ខ្សែកាត និងកាតស្មាតកាត RFID សម្រាប់ស្កេនចូលធ្វើការ',
  },

  // ==================== IT DEVICES ====================
  {
    id: 'it-laptop-pro',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'Laptop (Workstation / Pro)',
    name_km: 'កុំព្យូទ័រយួរដៃ Laptop (ការងារបច្ចេកទេស)',
    category: 'high_value_asset',
    requiresTopManagement: true,
    estimatedCost: 1200,
    icon: Laptop,
    description: 'High-performance laptop (Core i7 / Apple Silicon / 32GB RAM) for development & executive tasks',
    description_km: 'កុំព្យូទ័រយួរដៃសមត្ថភាពខ្ពស់ សម្រាប់ផ្នែកបច្ចេកវិទ្យា ការរចនា និងការងារប្រតិបត្តិ',
  },
  {
    id: 'it-desktop-pc',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'Computer (Desktop / Mac / PC Workstation)',
    name_km: 'កុំព្យូទ័រលើតុ Computer (Desktop / PC)',
    category: 'high_value_asset',
    requiresTopManagement: true,
    estimatedCost: 950,
    icon: Monitor,
    description: 'Office desktop computer workstation with dedicated monitor, keyboard, and mouse',
    description_km: 'កុំព្យូទ័រលើតុ Workstation ជាមួយក្តារចុច និងម៉ៅសម្រាប់បំពេញការងារការិយាល័យ',
  },
  {
    id: 'it-4k-monitor',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'External Display (27" 4K Monitor)',
    name_km: 'អេក្រង់បន្ថែម Monitor (27" 4K)',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 220,
    icon: Monitor,
    description: 'Secondary 27-inch IPS 4K display for high-productivity dual-screen multitasking',
    description_km: 'អេក្រង់កម្រិតច្បាស់ 4K ទំហំ 27 អ៊ីញ ជំនួយដល់ការងារពហុអេក្រង់',
  },
  {
    id: 'it-laser-printer',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'Heavy-Duty Network Laser Printer / Scanner',
    name_km: 'ម៉ាស៊ីនព្រីន Network Laser Printer / Scanner',
    category: 'high_value_asset',
    requiresTopManagement: true,
    estimatedCost: 650,
    icon: Printer,
    description: 'High-speed departmental duplex laser printer, auto document feeder scanner, and network copier',
    description_km: 'ម៉ាស៊ីនព្រីនកាត់ពណ៌ និងស្កេនឯកសារល្បឿនលឿនតាមប្រព័ន្ធបណ្តាញរួម',
  },
  {
    id: 'it-tablet-ipad',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'Tablet / iPad with Stylus Pen',
    name_km: 'ថេបប្លេត iPad / Tablet (ជាមួយប៊ិក Stylus)',
    category: 'high_value_asset',
    requiresTopManagement: true,
    estimatedCost: 750,
    icon: Smartphone,
    description: 'Portable touchscreen tablet for field mobility, inspections, and digital approvals',
    description_km: 'ថេបប្លេតអេក្រង់ប៉ះ សម្រាប់ចុះពិនិត្យការងារ និងចុះហត្ថលេខាឌីជីថល',
  },
  {
    id: 'it-headset-peripherals',
    group: 'it_device',
    groupLabel: 'IT devices',
    groupLabel_km: 'ឧបករណ៍បច្ចេកវិទ្យា IT',
    name: 'Noise-Cancelling Headset & Web Conference Kit',
    name_km: 'កាសប្រជុំ Noise-Cancelling & Web Camera',
    category: 'standard_material',
    requiresTopManagement: false,
    estimatedCost: 85,
    icon: Headphones,
    description: 'Wireless noise-cancelling headset with boom mic and 1080p wide-angle conference webcam',
    description_km: 'កាសស្តាប់ឥតខ្សែបំបាត់សំឡេងរំខាន និងកាមេរ៉ា HD សម្រាប់ការប្រជុំតាមអនឡាញ',
  },
];

export default function NewStaffRequestModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmployeeId,
  defaultEmployeeName,
  defaultDepartment,
  currentSalary = 1200,
}: NewStaffRequestModalProps) {
  const { currentPersona, language, showToast } = useApp();

  const [requestCategory, setRequestCategory] = useState<'material' | 'salary'>('material');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<MaterialCategoryGroup>('all');
  const [selectedPreset, setSelectedPreset] = useState<string>(MATERIAL_PRESETS[0].name);
  const [customItemName, setCustomItemName] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(MATERIAL_PRESETS[0].estimatedCost);
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [reason, setReason] = useState('');

  // Salary Increase Form
  const [empSalary, setEmpSalary] = useState(currentSalary);
  const [proposedSalary, setProposedSalary] = useState(currentSalary + 300);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);

  // Sync preset selection
  const handlePresetSelect = (preset: MaterialPresetItem) => {
    setSelectedPreset(preset.name);
    setUnitCost(preset.estimatedCost);
    if (!customItemName || MATERIAL_PRESETS.some((p) => p.name === customItemName || p.name_km === customItemName)) {
      setCustomItemName(language === 'km' ? preset.name_km : preset.name);
    }
    if (!specifications || MATERIAL_PRESETS.some((p) => p.description === specifications || p.description_km === specifications)) {
      setSpecifications(language === 'km' ? preset.description_km : preset.description);
    }
  };

  // Find active preset metadata
  const currentPresetItem = MATERIAL_PRESETS.find((p) => p.name === selectedPreset);

  // Total cost
  const totalCost = unitCost * quantity;

  // Determine if current selection requires Top Management
  const requiresTopManagement =
    requestCategory === 'salary' ||
    (currentPresetItem ? currentPresetItem.requiresTopManagement : false) ||
    selectedPreset.toLowerCase().includes('laptop') ||
    selectedPreset.toLowerCase().includes('computer') ||
    selectedPreset.toLowerCase().includes('printer') ||
    selectedPreset.toLowerCase().includes('tablet') ||
    selectedPreset.toLowerCase().includes('macbook') ||
    customItemName.toLowerCase().includes('laptop') ||
    customItemName.toLowerCase().includes('computer') ||
    customItemName.toLowerCase().includes('salary') ||
    customItemName.toLowerCase().includes('macbook') ||
    totalCost >= 500;

  const salaryDiff = Math.max(0, proposedSalary - empSalary);
  const salaryDiffPercent = empSalary > 0 ? Math.round((salaryDiff / empSalary) * 1000) / 10 : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast(language === 'km' ? 'សូមបញ្ចូលមូលហេតុ និងភាពចាំបាច់' : 'Please provide a justification reason', 'error');
      return;
    }

    setLoading(true);
    try {
      const empId = defaultEmployeeId || currentPersona.id;
      const finalItemName = requestCategory === 'salary'
        ? `Increase Salary (+$${salaryDiff.toLocaleString()}/mo)`
        : customItemName.trim() || selectedPreset;

      const groupTag = currentPresetItem ? `[${currentPresetItem.groupLabel}] ` : '';
      const fullSpecs = specifications ? `${groupTag}${specifications}` : (groupTag ? `${groupTag}Standard office requisition` : '');

      const payload = {
        employee_id: empId,
        request_type: requestCategory === 'salary' ? 'Salary Increase' : 'Material / Equipment',
        item_name: finalItemName,
        item_category: requestCategory === 'salary'
          ? 'salary_increase'
          : requiresTopManagement
          ? 'high_value_asset'
          : 'standard_material',
        current_salary: requestCategory === 'salary' ? empSalary : 0,
        proposed_salary: requestCategory === 'salary' ? proposedSalary : 0,
        estimated_cost: requestCategory === 'material' ? totalCost : 0,
        quantity: requestCategory === 'material' ? quantity : 1,
        urgency,
        reason: requestCategory === 'salary'
          ? `[Effective: ${effectiveDate}] ${reason}`
          : reason,
        specifications: fullSpecs,
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          language === 'km'
            ? `សំណើ ${data.request_number} ត្រូវបានបញ្ជូនជោគជ័យទៅកាន់ប្រធានផ្នែក!`
            : `Request ${data.request_number} submitted to Line Manager for approval!`,
          'success'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Failed to submit request', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
              {language === 'km' ? 'ស្វ័យសេវាបុគ្គលិក (Staff Portal)' : 'Staff Requisition'}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {language === 'km' ? 'បង្កើតសំណើសម្ភារៈ ឬដំឡើងបៀវត្សរ៍' : 'New Approval Request'}
          </h2>
          <p className={`text-xs text-indigo-100 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km'
              ? 'ដំណើរការអនុម័តពហុថ្នាក់៖ ប្រធានផ្នែក (Line Manager) ➔ ធនធានមនុស្ស (HR) ➔ គណៈគ្រប់គ្រងកំពូល (Top Management)'
              : 'Multi-tier workflow: Line Manager ➔ HR Department ➔ Top Management (CEO)'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* CATEGORY SWITCHER */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setRequestCategory('material')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                requestCategory === 'material'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Package size={16} />
              <span>{language === 'km' ? 'សម្ភារៈ & ឧបករណ៍ (Materials & Equipment)' : 'Material & Equipment'}</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestCategory('salary')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                requestCategory === 'salary'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <DollarSign size={16} />
              <span>{language === 'km' ? 'ដំឡើងប្រាក់បៀវត្សរ៍ (Salary Increase)' : 'Increase Salary'}</span>
            </button>
          </div>

          {/* MATERIAL SECTION */}
          {requestCategory === 'material' ? (
            <div className="space-y-4">
              {/* Category Filter & Dropdown Label */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label htmlFor="material-preset-dropdown" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'ជ្រើសរើសសម្ភារៈ / ឧបករណ៍ (Select Item / Material) *' : 'Select Item / Material *'}
                  </label>

                  {/* Category Filter Pills: Office Material vs IT devices */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {language === 'km' ? 'ទាំងអស់' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter('office_material');
                        const firstOffice = MATERIAL_PRESETS.find((p) => p.group === 'office_material');
                        if (firstOffice && (!currentPresetItem || currentPresetItem.group !== 'office_material')) {
                          handlePresetSelect(firstOffice);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedCategoryFilter === 'office_material'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Briefcase size={12} />
                      <span>{language === 'km' ? 'សម្ភារៈការិយាល័យ' : 'Office Material'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter('it_device');
                        const firstIT = MATERIAL_PRESETS.find((p) => p.group === 'it_device');
                        if (firstIT && (!currentPresetItem || currentPresetItem.group !== 'it_device')) {
                          handlePresetSelect(firstIT);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedCategoryFilter === 'it_device'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Laptop size={12} />
                      <span>{language === 'km' ? 'ឧបករណ៍ IT' : 'IT devices'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Dropdown for Item/Material with Office Material & IT devices Optgroups */}
                <div className="relative mb-3">
                  <select
                    id="material-preset-dropdown"
                    value={selectedPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CUSTOM') {
                        setSelectedPreset('CUSTOM');
                        setCustomItemName('');
                        return;
                      }
                      const found = MATERIAL_PRESETS.find((p) => p.name === val);
                      if (found) {
                        handlePresetSelect(found);
                        if (selectedCategoryFilter !== 'all' && selectedCategoryFilter !== found.group) {
                          setSelectedCategoryFilter(found.group);
                        }
                      }
                    }}
                    className="w-full text-xs font-bold py-2.5 pl-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      {language === 'km' ? '-- ជ្រើសរើសសម្ភារៈ ឬឧបករណ៍ពីបញ្ជី --' : '-- Choose Item from Office Material or IT devices --'}
                    </option>

                    {(selectedCategoryFilter === 'all' || selectedCategoryFilter === 'office_material') && (
                      <optgroup label={language === 'km' ? '🏢 សម្ភារៈការិយាល័យ (Office Material)' : '🏢 Office Material'}>
                        {MATERIAL_PRESETS.filter((p) => p.group === 'office_material').map((p) => (
                          <option key={p.id} value={p.name}>
                            {language === 'km'
                              ? `${p.name_km} [HR Final] (~$${p.estimatedCost})`
                              : `${p.name} [HR Final] (~$${p.estimatedCost})`}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {(selectedCategoryFilter === 'all' || selectedCategoryFilter === 'it_device') && (
                      <optgroup label={language === 'km' ? '💻 ឧបករណ៍បច្ចេកវិទ្យា IT (IT Devices)' : '💻 IT devices'}>
                        {MATERIAL_PRESETS.filter((p) => p.group === 'it_device').map((p) => (
                          <option key={p.id} value={p.name}>
                            {language === 'km'
                              ? `${p.name_km} [${p.requiresTopManagement ? 'CEO Review' : 'HR Final'}] (~$${p.estimatedCost})`
                              : `${p.name} [${p.requiresTopManagement ? 'Needs CEO' : 'HR Final'}] (~$${p.estimatedCost})`}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label={language === 'km' ? '✍️ បញ្ចូលផ្សេងៗ' : '✍️ Custom Specification'}>
                      <option value="CUSTOM">
                        {language === 'km' ? '+ បញ្ចូលសម្ភារៈផ្សេងទៀត (Specify Custom Item...)' : '+ Specify Custom Item / Model...'}
                      </option>
                    </optgroup>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>

                {/* Quick Selection Cards Grid (Filtered by Active Category) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {(selectedCategoryFilter === 'all'
                    ? MATERIAL_PRESETS
                    : MATERIAL_PRESETS.filter((p) => p.group === selectedCategoryFilter)
                  ).map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPreset === p.name;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePresetSelect(p)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : p.group === 'it_device'
                                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              {language === 'km' ? p.name_km : p.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            ~${p.estimatedCost}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.group === 'it_device'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {language === 'km' ? p.groupLabel_km : p.groupLabel}
                          </span>

                          {p.requiresTopManagement ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              {language === 'km' ? 'ត្រូវការអនុម័តពី CEO' : 'Needs Top Mgmt'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                              {language === 'km' ? 'អនុម័តចុងក្រោយដោយ HR' : 'HR Final Approval'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Item Name & Specifications */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'km'
                    ? 'ឈ្មោះម៉ូឌែល ឬព័ត៌មានលម្អិតសម្ភារៈ (Specific Item / Model Name) *'
                    : 'Specific Item / Model Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    selectedCategoryFilter === 'office_material'
                      ? 'e.g. Ergonomic High-Back Mesh Chair (Model H-800 Black)'
                      : 'e.g. MacBook Pro 16-inch M3 Max (36GB RAM / 1TB SSD)'
                  }
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Technical Specifications / Description */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km'
                    ? 'លក្ខណៈបច្ចេកទេស និងតម្រូវការបន្ថែម (Technical Specifications)'
                    : 'Specifications & Configuration Details'}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'km'
                      ? 'ឧទាហរណ៍៖ ទំហំ ពណ៌ ម៉ាកយីហោ ឬលក្ខណៈពិសេស...'
                      : 'e.g. Color, dimensions, brand, memory configuration, warranty...'
                  }
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full text-xs font-normal px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Quantity, Unit Price & Total Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ចំនួន (Quantity)' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'តម្លៃក្នុងមួយឯកតា ($)' : 'Unit Cost ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    {language === 'km' ? 'តម្លៃប៉ាន់ស្មានសរុប ($)' : 'Total Cost ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-indigo-500 font-bold">$</span>
                    <input
                      type="text"
                      disabled
                      value={totalCost.toLocaleString()}
                      className="w-full text-xs font-black pl-7 pr-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SALARY INCREASE SECTION */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">
                    {language === 'km' ? 'គោលការណ៍ស្នើសុំដំឡើងបៀវត្សរ៍ (Salary Increase Protocol)' : 'Executive Salary Increase Protocol'}
                  </p>
                  <p className={`mt-0.5 text-amber-800 dark:text-amber-300 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km'
                      ? 'សំណើដំឡើងប្រាក់ខែតម្រូវឱ្យមានការអនុម័ត ៣ ដំណាក់កាលជាប់ជានិច្ច៖ ប្រធានផ្នែកផ្ទាល់ ➔ នាយកដ្ឋានធនធានមនុស្ស (HR) ➔ អគ្គនាយក/គណៈគ្រប់គ្រងកំពូល (CEO/Top Management)។'
                      : 'Salary adjustments strictly require 3-tier authorization: Line Manager ➔ HR Department ➔ Top Management (CEO). Upon CEO approval, salary will automatically update in payroll.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ប្រាក់បៀវត្សរ៍បច្ចុប្បន្ន (Current Salary)' : 'Current Base Salary'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      disabled
                      value={empSalary}
                      className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    {language === 'km' ? 'ប្រាក់បៀវត្សរ៍ស្នើសុំថ្មី (Proposed Salary) *' : 'Proposed Salary *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-indigo-600 font-bold">$</span>
                    <input
                      type="number"
                      required
                      min={empSalary}
                      step="any"
                      value={proposedSalary}
                      onChange={(e) => setProposedSalary(Math.max(empSalary, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs font-black pl-7 pr-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE DELTA SUMMARY */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {language === 'km' ? 'ចំនួនទឹកប្រាក់កើនឡើង៖' : 'Increase Amount:'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 font-mono">
                    +${salaryDiff.toLocaleString()} / mo
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                    +{salaryDiffPercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km' ? 'កាលបរិច្ឆេទចាប់ផ្តើមអនុវត្ត (Effective Date)' : 'Effective Date'}
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* URGENCY & BUSINESS REASON */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'km' ? 'កម្រិតបន្ទាន់ (Urgency Priority)' : 'Urgency Priority'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Urgent'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      urgency === lvl
                        ? lvl === 'Urgent'
                          ? 'bg-rose-600 text-white'
                          : lvl === 'High'
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'km' ? 'មូលហេតុ និងភាពចាំបាច់ក្នុងការងារ (Business Justification & Reason) *' : 'Business Reason & Justification *'}
              </label>
              <textarea
                required
                rows={3}
                placeholder={
                  requestCategory === 'salary'
                    ? language === 'km'
                      ? 'រៀបរាប់ពីស្នាដៃការងារ សមិទ្ធផលសម្រេចបាន និងការទទួលខុសត្រូវបន្ថែម...'
                      : 'Detail recent performance achievements, added responsibilities, and value delivered...'
                    : language === 'km'
                    ? 'បញ្ជាក់ពីមូលហេតុត្រូវការសម្ភារៈនេះសម្រាប់បំពេញការងារប្រចាំថ្ងៃ...'
                    : 'Explain project needs or operational requirements for this equipment...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 3-TIER APPROVAL FLOW VISUALIZER BANNER */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>{language === 'km' ? 'ខ្សែសង្វាក់នៃការអនុម័ត (Approval Route):' : 'Routing & Verification Stages:'}</span>
              {requiresTopManagement ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                  <ShieldCheck size={13} />
                  <span>{language === 'km' ? '៣ ដំណាក់កាល (រហូតដល់ CEO)' : '3-Tier (Up to Top Mgmt)'}</span>
                </span>
              ) : (
                <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={13} />
                  <span>{language === 'km' ? '២ ដំណាក់កាល (បញ្ចប់ត្រឹម HR)' : '2-Tier (Finalizes at HR)'}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              {/* Stage 1 */}
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="font-bold text-blue-800 dark:text-blue-300 block">Stage 1</span>
                <span className={`text-slate-600 dark:text-slate-400 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'ប្រធានផ្នែក (Manager)' : 'Line Manager'}
                </span>
              </div>

              {/* Stage 2 */}
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="font-bold text-purple-800 dark:text-purple-300 block">Stage 2</span>
                <span className={`text-slate-600 dark:text-slate-400 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'ធនធានមនុស្ស (HR)' : 'HR Department'}
                </span>
                {!requiresTopManagement && (
                  <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ✓ Final
                  </span>
                )}
              </div>

              {/* Stage 3 */}
              <div
                className={`p-2 rounded-xl border ${
                  requiresTopManagement
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50'
                }`}
              >
                <span
                  className={`font-bold block ${
                    requiresTopManagement ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'
                  }`}
                >
                  Stage 3
                </span>
                <span className={`text-slate-600 dark:text-slate-400 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'គណៈគ្រប់គ្រង (CEO)' : 'Top Management'}
                </span>
                {requiresTopManagement ? (
                  <span className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    ✓ Final
                  </span>
                ) : (
                  <span className="block text-[9px] text-slate-400 mt-0.5">Not Required</span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              {loading ? (
                <span>{language === 'km' ? 'កំពុងបញ្ជូន...' : 'Submitting...'}</span>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{language === 'km' ? 'បញ្ជូនសំណើទៅកាន់ប្រធានផ្នែក' : 'Submit for Approval'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
