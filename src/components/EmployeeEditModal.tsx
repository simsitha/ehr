'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Employee, Department, EmployeeGroup, isBoardMember } from '@/lib/types';
import { formatLocalizedText, cleanEnglishOnly, sanitizeEnglishInput, parseDateToISO } from '@/lib/translations';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';
import { CAMBODIA_PROVINCES, CAMBODIA_BANKS } from '@/components/GlobalModals';
import {
  X,
  User,
  Phone,
  Briefcase,
  CreditCard,
  ShieldCheck,
  HeartHandshake,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Trash2,
  IdCard,
  Calculator,
  Layers,
  Crown,
} from 'lucide-react';
import SewingMatrixCalculatorModal from '@/components/payroll/SewingMatrixCalculatorModal';

type EditStaffTab = 'personal' | 'contact' | 'employment' | 'payroll' | 'nssf' | 'emergency' | 'documents';

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  onSuccess: (updatedEmployee: Employee) => void;
}

export default function EmployeeEditModal({
  isOpen,
  onClose,
  employee,
  departments,
  onSuccess,
}: EmployeeEditModalProps) {
  const { language, showToast, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<EditStaffTab>('personal');
  const [managers, setManagers] = useState<Employee[]>([]);
  const [availableGroups, setAvailableGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // 1. Personal Information
    last_name: '',
    first_name: '',
    gender: 'ប្រុស (Male)',
    dob: '',
    nationality: 'Cambodian',
    marital_status: 'នៅលីវ (Single)',
    national_id: '',
    status: 'Active',
    avatar: '',

    // 2. Contact Information
    phone: '',
    email: '',
    current_address: '',
    province_city: 'រាជធានីភ្នំពេញ (Phnom Penh)',
    district: '',
    commune_sangkat: '',
    village: '',

    // 3. Employment Information
    department_id: '',
    role: '',
    group_id: '',
    group_name: '',
    employment_type: 'ពេញម៉ោង (Full-Time)',
    employee_type: 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
    join_date: '',
    contract_type: 'UDC (មិនកំណត់ថិរវេលា)',
    contract_start: '',
    contract_end: '',
    manager_id: '',
    work_location: 'Head Office',

    // 4. Salary & Payroll
    salary: '1200',
    salary_currency: 'USD ($)',
    salary_frequency: 'កន្លះខែ (Semi-monthly)',
    pay_grade: 'Level 3 - Officer',
    housing_transport_allowance: '0',
    transport_allowance: '0',
    meal_allowance: '0',
    housing_allowance: '0',
    attendance_allowance: '0',
    skill_allowance: '0',
    seniority_bonus: '0',
    sewing_skill_matrix: '0',
    monthly_eval_bonus: '0',
    severance_pay: '0',
    bank_name: 'ABA Bank (ធនាគារ អេ ប៊ី អេ)',
    bank_account_name: '',
    bank_account_number: '',

    // 5. NSSF Information
    nssf_member: 'មាន (Yes)',
    nssf_number: '',
    nssf_reg_date: '',

    // 6. Emergency Contact
    emergency_contact_name: '',
    emergency_contact_relationship: 'ប្តី/ប្រពន្ធ (Spouse)',
    emergency_contact_phone: '',
    emergency_contact_address: '',

    // 7. Documents & Bio
    bio: '',
    doc_national_id: '',
    doc_passport: '',
    doc_contract: '',
    doc_others: '',
  });

  // Populate form when employee changes
  useEffect(() => {
    if (employee && isOpen) {
      const matchedDept = departments.find(
        (d) => d.id === employee.department_id || d.name === employee.department_id || d.name === employee.department_name
      );
      const resolvedDeptId = matchedDept ? matchedDept.id : (employee.department_id || departments[0]?.id || '');

      setFormData({
        last_name: employee.last_name || '',
        first_name: employee.first_name || '',
        gender: employee.gender || 'ប្រុស (Male)',
        dob: parseDateToISO(employee.dob) || '',
        nationality: cleanEnglishOnly(employee.nationality || 'Cambodian'),
        marital_status: employee.marital_status || 'នៅលីវ (Single)',
        national_id: employee.national_id || '',
        status: employee.status || 'Active',
        avatar: employee.avatar || '',

        phone: employee.phone || '',
        email: employee.email || '',
        current_address: employee.current_address || '',
        province_city: employee.province_city || 'រាជធានីភ្នំពេញ (Phnom Penh)',
        district: employee.district || '',
        commune_sangkat: employee.commune_sangkat || '',
        village: employee.village || '',

        department_id: resolvedDeptId,
        role: employee.role || '',
        group_id: (employee as any).group_id || '',
        group_name: employee.group_name || '',
        employment_type: employee.employment_type || 'ពេញម៉ោង (Full-Time)',
        employee_type: employee.employee_type || 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
        join_date: parseDateToISO(employee.join_date) || '',
        contract_type: employee.contract_type || 'UDC (មិនកំណត់ថិរវេលា)',
        contract_start: parseDateToISO(employee.contract_start || employee.join_date) || '',
        contract_end: parseDateToISO(employee.contract_end) || '',
        manager_id: employee.manager_id || '',
        work_location: cleanEnglishOnly(employee.work_location || 'Head Office'),

        salary: employee.salary !== undefined ? String(employee.salary) : '1200',
        salary_currency: employee.salary_currency || 'USD ($)',
        salary_frequency: employee.salary_frequency || 'កន្លះខែ (Semi-monthly)',
        pay_grade: (employee as any).pay_grade || 'Level 3 - Officer',
        housing_transport_allowance: String((Number((employee as any).housing_allowance ?? 0) + Number((employee as any).transport_allowance ?? 0))),
        transport_allowance: '0',
        meal_allowance: String((employee as any).meal_allowance ?? 0),
        housing_allowance: String((Number((employee as any).housing_allowance ?? 0) + Number((employee as any).transport_allowance ?? 0))),
        attendance_allowance: String((employee as any).attendance_allowance ?? 0),
        skill_allowance: String((employee as any).skill_allowance ?? 0),
        seniority_bonus: String((employee as any).seniority_bonus ?? 0),
        sewing_skill_matrix: String((employee as any).sewing_skill_matrix ?? 0),
        monthly_eval_bonus: String((employee as any).monthly_eval_bonus ?? 0),
        severance_pay: String((employee as any).severance_pay ?? 0),
        bank_name: employee.bank_name || 'ABA Bank (ធនាគារ អេ ប៊ី អេ)',
        bank_account_name: employee.bank_account_name || `${employee.first_name} ${employee.last_name}`.trim(),
        bank_account_number: employee.bank_account_number || '',

        nssf_member: employee.nssf_member || 'មាន (Yes)',
        nssf_number: employee.nssf_number || '',
        nssf_reg_date: parseDateToISO(employee.nssf_reg_date || employee.join_date) || '',

        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || 'ប្តី/ប្រពន្ធ (Spouse)',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_address: employee.emergency_contact_address || '',

        bio: employee.bio || '',
        doc_national_id: employee.doc_national_id || '',
        doc_passport: employee.doc_passport || '',
        doc_contract: employee.doc_contract || '',
        doc_others: employee.doc_others || '',
      });
      setActiveTab('personal');
    }
  }, [employee, isOpen, departments]);

  // Fetch managers
  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out current employee from potential managers
          setManagers(data.filter((e: Employee) => e.id !== employee?.id));
        }
      })
      .catch((err) => console.error('Error fetching managers:', err));
  }, [employee?.id]);

  // Fetch groups for selected department
  useEffect(() => {
    if (!formData.department_id) {
      setAvailableGroups([]);
      return;
    }
    const matchedDept = departments.find(
      (d) => d.id === formData.department_id || d.name === formData.department_id
    );
    if (matchedDept?.groups && matchedDept.groups.length > 0) {
      setAvailableGroups(matchedDept.groups);
    }
    const deptKey = matchedDept ? matchedDept.id : formData.department_id;
    fetch(`/api/groups?department_id=${encodeURIComponent(deptKey)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableGroups(data);
        }
      })
      .catch((err) => console.error('Error fetching department groups:', err));
  }, [formData.department_id, departments]);

  if (!isOpen || !employee) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast(
        language === 'km' ? 'សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WEBP)' : 'Please select an image file (JPG, PNG, WEBP)',
        'error'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(
        language === 'km' ? 'ទំហំរូបភាពត្រូវតែតូចជាង 10MB' : 'Image file must be smaller than 10MB',
        'error'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and resize image to max 400x400
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          handleInputChange('avatar', compressedDataUrl);
          showToast(
            language === 'km' ? 'បានផ្ទុករូបថតបុគ្គលិកជោគជ័យ!' : 'Employee photo uploaded successfully!',
            'success'
          );
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      showToast(language === 'km' ? 'សូមបញ្ចូលនាមត្រកូល និងនាមខ្លួន' : 'First and Last name are required', 'error');
      setActiveTab('personal');
      return;
    }

    setLoading(true);
    try {
      const isBoard = isBoardMember(formData);
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nationality: cleanEnglishOnly(formData.nationality) || 'Cambodian',
          work_location: cleanEnglishOnly(formData.work_location) || 'Head Office',
          salary: isBoard ? 0 : (Number(String(formData.salary || 0).replace(/[^0-9.-]/g, '')) || 0),
          housing_transport_allowance: isBoard ? 0 : (Number(String(formData.housing_transport_allowance || formData.housing_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
          transport_allowance: 0,
          meal_allowance: isBoard ? 0 : (Number(String(formData.meal_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
          housing_allowance: isBoard ? 0 : (Number(String(formData.housing_transport_allowance || formData.housing_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
          attendance_allowance: 0,
          skill_allowance: isBoard ? 0 : (Number(String(formData.skill_allowance || 0).replace(/[^0-9.-]/g, '')) || 0),
          seniority_bonus: isBoard ? 0 : (Number(String(formData.seniority_bonus || 0).replace(/[^0-9.-]/g, '')) || 0),
          sewing_skill_matrix: isBoard ? 0 : (Number(String(formData.sewing_skill_matrix || 0).replace(/[^0-9.-]/g, '')) || 0),
          monthly_eval_bonus: isBoard ? 0 : (Number(String(formData.monthly_eval_bonus || 0).replace(/[^0-9.-]/g, '')) || 0),
          severance_pay: isBoard ? 0 : (Number(String(formData.severance_pay || 0).replace(/[^0-9.-]/g, '')) || 0),
        }),
      });

      const data = await res.json();
      const updatedEmployee = data.employee || (data.id ? data : null);
      if (res.ok && updatedEmployee) {
        showToast(
          language === 'km'
            ? `បានកែប្រែព័ត៌មានបុគ្គលិក ${formData.first_name} ${formData.last_name} ជោគជ័យ!`
            : `Employee ${formData.first_name} ${formData.last_name} updated successfully!`,
          'success'
        );
        onSuccess(updatedEmployee);
        triggerRefresh();
        onClose();
      } else {
        showToast(data.error || (language === 'km' ? 'បរាជ័យក្នុងការកែប្រែព័ត៌មានបុគ្គលិក' : 'Failed to update employee'), 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: EditStaffTab; label_km: string; label_en: string; icon: any }[] = [
    { id: 'personal', label_km: 'ព័ត៌មានផ្ទាល់ខ្លួន', label_en: 'Personal Info', icon: User },
    { id: 'contact', label_km: 'ទំនាក់ទំនង & អាសយដ្ឋាន', label_en: 'Contact & Address', icon: Phone },
    { id: 'employment', label_km: 'ការងារ & កិច្ចសន្យា', label_en: 'Job & Contract', icon: Briefcase },
    { id: 'payroll', label_km: 'បៀវត្សរ៍ & ធនាគារ', label_en: 'Salary & Banking', icon: CreditCard },
    { id: 'nssf', label_km: 'ប.ស.ស (NSSF)', label_en: 'NSSF Social Security', icon: ShieldCheck },
    { id: 'emergency', label_km: 'ទំនាក់ទំនងបន្ទាន់', label_en: 'Emergency Contact', icon: HeartHandshake },
    { id: 'documents', label_km: 'ឯកសារ & ប្រវត្តិសង្ខេប', label_en: 'Docs & Biography', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.first_name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm ring-2 ring-indigo-500/20 shadow-xs">
                  {(formData.first_name?.[0] || 'E') + (formData.last_name?.[0] || '')}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  formData.status === 'Active'
                    ? 'bg-emerald-500'
                    : formData.status === 'Remote'
                    ? 'bg-blue-500'
                    : formData.status === 'On Leave'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>{language === 'km' ? 'កែសម្រួលព័ត៌មានបុគ្គលិក' : 'Edit Employee Profile'}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {employee.id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.first_name} {employee.last_name} &bull; {employee.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-xs font-semibold shrink-0 gap-1 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/30 dark:bg-indigo-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                <span>{language === 'km' ? tab.label_km : tab.label_en}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Employee Photo Upload Section - ONLY UPLOAD, NO AVATAR */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{language === 'km' ? 'រូបថតបុគ្គលិក (Employee Photo)' : 'Employee Photo'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'km'
                        ? 'ផ្ទុករូបថតផ្ទាល់ខ្លួនពីឧបករណ៍/កុំព្យូទ័ររបស់អ្នក (JPG, PNG, WEBP) • អតិបរមា 10MB'
                        : 'Upload photo directly from your device (JPG, PNG, WEBP) • Max 10MB'}
                    </p>
                  </div>
                  {formData.avatar ? (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/60 dark:border-emerald-800">
                      <CheckCircle2 size={12} /> {language === 'km' ? 'បានផ្ទុករួចរាល់' : 'Uploaded'}
                    </span>
                  ) : null}
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file);
                  }}
                />

                {formData.avatar ? (
                  /* Photo Preview Card */
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                    <div className="relative group shrink-0">
                      <img
                        src={formData.avatar}
                        alt="Employee Photo Preview"
                        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-xs font-semibold"
                        title={language === 'km' ? 'ប្តូររូបថត' : 'Change Photo'}
                      >
                        <Camera size={20} />
                        <span className="text-[10px] mt-0.5">{language === 'km' ? 'ប្តូរ' : 'Change'}</span>
                      </button>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {formData.first_name || formData.last_name
                          ? `${formData.first_name} ${formData.last_name}`
                          : (language === 'km' ? 'រូបថតបុគ្គលិក' : 'Employee Photo')}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'km' ? 'រូបថតត្រូវបានផ្ទុកឡើង និងរួចរាល់សម្រាប់ការរក្សាទុក ✓' : 'Photo uploaded and ready to save ✓'}
                      </p>
                      <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
                        >
                          <Upload size={13} />
                          <span>{language === 'km' ? 'ប្តូររូបថត' : 'Change Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('avatar', '');
                            if (avatarInputRef.current) avatarInputRef.current.value = '';
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                        >
                          <Trash2 size={13} />
                          <span>{language === 'km' ? 'លុបរូបថត' : 'Remove Photo'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Area */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processImageFile(file);
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                      isDraggingAvatar
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-2xs">
                      <Camera size={26} />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {language === 'km'
                        ? 'ចុចទីនេះ ឬទម្លាក់រូបថតមកដើម្បីផ្ទុកឡើង'
                        : 'Click here or drag & drop photo to upload'}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                      {language === 'km' ? 'JPG, PNG, WEBP (អតិបរមា 10MB) • Upload only' : 'JPG, PNG, WEBP (Max 10MB) • Upload only'}
                    </p>
                    <span className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <Upload size={14} />
                      <span>{language === 'km' ? 'ជ្រើសរើសរូបថតពីកុំព្យូទ័រ' : 'Choose Photo from Device'}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Names & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'នាមត្រកូល (Last Name / Surname) *' : 'Last Name / Surname *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'នាមខ្លួន (First Name / Given Name) *' : 'First Name / Given Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'ស្ថានភាពការងារ (Status)' : 'Employment Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Active">{language === 'km' ? 'សកម្ម (Active)' : 'Active'}</option>
                    <option value="Remote">{language === 'km' ? 'ធ្វើការពីចម្ងាយ (Remote / WFH)' : 'Remote (WFH)'}</option>
                    <option value="On Leave">{language === 'km' ? 'កំពុងឈប់សម្រាក (On Leave)' : 'On Leave'}</option>
                    <option value="Terminated">{language === 'km' ? 'បញ្ចប់ការងារ (Terminated)' : 'Terminated'}</option>
                  </select>
                </div>
              </div>

              {/* Gender, DOB, Nationality, Marital Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ភេទ (Gender)' : 'Gender'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ប្រុស (Male)">{language === 'km' ? 'ប្រុស (Male)' : 'Male'}</option>
                    <option value="ស្រី (Female)">{language === 'km' ? 'ស្រី (Female)' : 'Female'}</option>
                    <option value="ផ្សេងទៀត (Other)">{language === 'km' ? 'ផ្សេងទៀត (Other)' : 'Other'}</option>
                    {formData.gender === 'Male' && <option value="Male">Male</option>}
                    {formData.gender === 'Female' && <option value="Female">Female</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត (DOB)' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    list="edit-emp-nationality-options"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', sanitizeEnglishInput(e.target.value))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    placeholder="Cambodian"
                  />
                  <datalist id="edit-emp-nationality-options">
                    <option value="Cambodian" />
                    <option value="Chinese" />
                    <option value="Japanese" />
                    <option value="Vietnamese" />
                    <option value="Thai" />
                    <option value="American" />
                    <option value="British" />
                    <option value="French" />
                    <option value="Australian" />
                    <option value="Korean" />
                    <option value="Other" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ស្ថានភាពអាពាហ៍ពិពាហ៍' : 'Marital Status'}
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => handleInputChange('marital_status', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="នៅលីវ (Single)">{language === 'km' ? 'នៅលីវ (Single)' : 'Single'}</option>
                    <option value="មានគ្រួសារ (Married)">{language === 'km' ? 'មានគ្រួសារ (Married)' : 'Married'}</option>
                    <option value="មេម៉ាយ/ពោះម៉ាយ (Divorced/Widowed)">{language === 'km' ? 'មេម៉ាយ/ពោះម៉ាយ (Divorced/Widowed)' : 'Divorced / Widowed'}</option>
                    {formData.marital_status === 'Single' && <option value="Single">Single</option>}
                    {formData.marital_status === 'Married' && <option value="Married">Married</option>}
                    {formData.marital_status === 'Divorced' && <option value="Divorced">Divorced</option>}
                  </select>
                </div>
              </div>

              {/* National ID Card */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km' ? 'លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (National ID)' : 'Cambodian National ID / Passport'}
                </label>
                <div className="relative">
                  <IdCard size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="010XXXXXX"
                    value={formData.national_id}
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & ADDRESS */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="+855 12 345 678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'អ៊ីមែលការងារ (Company Email)' : 'Company Email'}
                  </label>
                  <input
                    type="email"
                    placeholder="name@outlook.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Province / City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'រាជធានី / ខេត្ត (Province / City)' : 'Province / City'}
                  </label>
                  <select
                    value={formData.province_city}
                    onChange={(e) => handleInputChange('province_city', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {CAMBODIA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {formatLocalizedText(prov, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ខណ្ឌ / ស្រុក (District / Khan / Srok)' : 'District / Khan / Srok'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'ខណ្ឌដូនពេញ / Daun Penh...' : 'Daun Penh, Phnom Penh...'}
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Commune / Sangkat & Village */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'សង្កាត់ / ឃុំ (Commune / Sangkat)' : 'Commune / Sangkat'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'សង្កាត់ផ្សារថ្មីទី១...' : 'Phsar Thmey 1...'}
                    value={formData.commune_sangkat}
                    onChange={(e) => handleInputChange('commune_sangkat', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ភូមិ (Village / Phum)' : 'Village / Phum'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'ភូមិ ៤...' : 'Village 4...'}
                    value={formData.village}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km' ? 'អាសយដ្ឋានលំនៅឋានបច្ចុប្បន្នពេញលេញ (Full Current Address)' : 'Full Current Address'}
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'ផ្ទះលេខ ១២, ផ្លូវ ២០០, រាជធានីភ្នំពេញ...' : 'No. 12, St. 200, Phnom Penh...'}
                    value={formData.current_address}
                    onChange={(e) => handleInputChange('current_address', e.target.value)}
                    className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYMENT & CONTRACT */}
          {activeTab === 'employment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'តួនាទី / មុខតំណែង (Position / Role) *' : 'Position / Role *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>{language === 'km' ? 'ផ្នែក / នាយកដ្ឋាន' : 'Department'} *</span>
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => {
                      handleInputChange('department_id', e.target.value);
                      handleInputChange('group_id', '');
                      handleInputChange('group_name', '');
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{language === 'km' ? '-- ជ្រើសរើសនាយកដ្ឋាន --' : '-- Select Department --'}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {formatLocalizedText(dept.name, language)}
                      </option>
                    ))}
                    {formData.department_id && !departments.some((d) => d.id === formData.department_id || d.name === formData.department_id) && (
                      <option value={formData.department_id}>
                        {formatLocalizedText(formData.department_id, language)}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>{language === 'km' ? 'ក្រុម / ខ្សែសង្វាក់ (Group / Line)' : 'Group / Line'}</span>
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  </label>
                  <select
                    value={formData.group_id || ''}
                    onChange={(e) => {
                      const selectedGrp = availableGroups.find((g) => g.id === e.target.value);
                      handleInputChange('group_id', e.target.value);
                      handleInputChange('group_name', selectedGrp ? selectedGrp.name : '');
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{language === 'km' ? '-- គ្មាន / មិនទាន់ចាត់តាំង --' : '-- None / Unassigned --'}</option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.description ? `(${g.description})` : ''}
                      </option>
                    ))}
                    {formData.group_name && !availableGroups.some((g) => g.id === formData.group_id || g.name === formData.group_name) && (
                      <option value={formData.group_id || formData.group_name}>
                        {formData.group_name}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Manager & Employment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ប្រធានផ្ទាល់ (Line Manager)' : 'Line Manager'}
                  </label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => handleInputChange('manager_id', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">{language === 'km' ? 'គ្មានប្រធានផ្ទាល់ (None / Executive)' : 'None / Executive'}</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ប្រភេទការងារ (Employment Type)' : 'Employment Type'}
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => handleInputChange('employment_type', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ពេញម៉ោង (Full-Time)">{language === 'km' ? 'ពេញម៉ោង (Full-Time)' : 'Full-Time'}</option>
                    <option value="ក្រៅម៉ោង (Part-Time)">{language === 'km' ? 'ក្រៅម៉ោង (Part-Time)' : 'Part-Time'}</option>
                    <option value="កិច្ចសន្យា (Contract)">{language === 'km' ? 'កិច្ចសន្យា (Contract)' : 'Contract'}</option>
                    <option value="កម្មសិក្សា (Intern)">{language === 'km' ? 'កម្មសិក្សា (Intern)' : 'Intern'}</option>
                    <option value="ក្រុមប្រឹក្សាភិបាល (Board of Directors)">{language === 'km' ? 'ក្រុមប្រឹក្សាភិបាល (Board of Directors)' : 'Board of Directors'}</option>
                    {formData.employment_type === 'Full-Time' && <option value="Full-Time">Full-Time</option>}
                    {formData.employment_type === 'Part-Time' && <option value="Part-Time">Part-Time</option>}
                    {formData.employment_type === 'Contract' && <option value="Contract">Contract</option>}
                    {formData.employment_type === 'Intern' && <option value="Intern">Intern</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'លក្ខខណ្ឌបុគ្គលិក (Employee Type)' : 'Employee Type'}
                  </label>
                  <select
                    value={formData.employee_type}
                    onChange={(e) => handleInputChange('employee_type', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)">{language === 'km' ? 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)' : 'Regular / Permanent'}</option>
                    <option value="បុគ្គលិកសាកល្បង (Probation)">{language === 'km' ? 'បុគ្គលិកសាកល្បង (Probation)' : 'Probation'}</option>
                    <option value="បុគ្គលិកបណ្តោះអាសន្ន (Casual / Temporary)">{language === 'km' ? 'បុគ្គលិកបណ្តោះអាសន្ន (Casual / Temporary)' : 'Casual / Temporary'}</option>
                    <option value="សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)">{language === 'km' ? 'សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)' : 'Board of Directors'}</option>
                    {formData.employee_type === 'Regular / Permanent' && <option value="Regular / Permanent">Regular / Permanent</option>}
                    {formData.employee_type === 'Probation' && <option value="Probation">Probation</option>}
                    {formData.employee_type === 'Casual / Temporary' && <option value="Casual / Temporary">Casual / Temporary</option>}
                  </select>
                </div>
              </div>

              {/* Join Date, Contract Type, Start/End */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      {language === 'km' ? 'កាលបរិច្ឆេទចូលបម្រើការងារ' : 'Join Date'}
                    </label>
                    {(() => {
                      const res = calculateSeniorityAllowanceFromDate(formData.join_date);
                      return (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                          {res.tenureLabel} (${res.allowance.toFixed(2)})
                        </span>
                      );
                    })()}
                  </div>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => {
                      const newJoin = e.target.value;
                      const { allowance } = calculateSeniorityAllowanceFromDate(newJoin);
                      setFormData((prev: any) => ({
                        ...prev,
                        join_date: newJoin,
                        seniority_bonus: String(allowance),
                      }));
                    }}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ប្រភេទកិច្ចសន្យា' : 'Contract Type'}
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => handleInputChange('contract_type', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="UDC (មិនកំណត់ថិរវេលា)">{language === 'km' ? 'UDC (មិនកំណត់ថិរវេលា)' : 'UDC (Undetermined Duration)'}</option>
                    <option value="FDC (កំណត់ថិរវេលា)">{language === 'km' ? 'FDC (កំណត់ថិរវេលា)' : 'FDC (Fixed Duration)'}</option>
                    <option value="Probation (សាកល្បងការងារ)">{language === 'km' ? 'Probation (សាកល្បងការងារ)' : 'Probation'}</option>
                    {formData.contract_type === 'UDC' && <option value="UDC">UDC (Undetermined Duration)</option>}
                    {formData.contract_type === 'FDC' && <option value="FDC">FDC (Fixed Duration)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទកិច្ចសន្យា' : 'Contract Start'}
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start}
                    onChange={(e) => handleInputChange('contract_start', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ផុតកំណត់កិច្ចសន្យា' : 'Contract End'}
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end}
                    onChange={(e) => handleInputChange('contract_end', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Work Location */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  list="edit-emp-work-location-options"
                  value={formData.work_location}
                  onChange={(e) => handleInputChange('work_location', sanitizeEnglishInput(e.target.value))}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  placeholder="Head Office"
                />
                <datalist id="edit-emp-work-location-options">
                  <option value="Head Office" />
                  <option value="Factory 1" />
                  <option value="Factory 2" />
                  <option value="Branch Office" />
                  <option value="Warehouse" />
                  <option value="Site Office" />
                  <option value="Canadia Tower" />
                  <option value="Vattanac Tower" />
                  <option value="Exchange Square" />
                  <option value="Remote" />
                </datalist>
              </div>
            </div>
          )}

          {/* TAB 4: PAYROLL & BANKING */}
          {activeTab === 'payroll' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {isBoardMember(formData) && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <span>{language === 'km' ? 'លើកលែងប្រាក់បៀវត្សរ៍ (សមាជិកក្រុមប្រឹក្សាភិបាល)' : 'Salary Exempt (Board of Directors)'}</span>
                      <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono font-bold">$0.00</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                      {language === 'km'
                        ? 'សមាជិកក្រុមប្រឹក្សាភិបាលមិនតម្រូវឱ្យទទួលប្រាក់បៀវត្សរ៍ប្រចាំខែ ($0 / លើកលែង) ហើយត្រូវបានលើកលែងពីការគណនាបញ្ជីប្រាក់បៀវត្សរ៍ វត្តមានប្រចាំថ្ងៃ និងភារកិច្ចប្រតិបត្តិការនានារបស់បុគ្គលិក។'
                        : 'Members of the Board of Directors do not require a monthly salary ($0 / Exempt) and are excluded from payroll runs, daily attendance tracking, and operational tasks.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>{language === 'km' ? 'ប្រាក់បៀវត្សរ៍គោល (Base Salary) *' : 'Base Salary *'}</span>
                    {isBoardMember(formData) && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Crown size={11} /> {language === 'km' ? 'លើកលែង ($0)' : 'Exempt ($0)'}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      required={!isBoardMember(formData)}
                      min="0"
                      step="any"
                      value={isBoardMember(formData) ? '0' : formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      disabled={isBoardMember(formData)}
                      className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'រូបិយប័ណ្ណ (Currency)' : 'Currency'}
                  </label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="KHR (៛)">{language === 'km' ? 'KHR (៛)' : 'KHR'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'វដ្តបើកប្រាក់ (Payment Frequency)' : 'Payment Frequency'}
                  </label>
                  <select
                    value={formData.salary_frequency}
                    onChange={(e) => handleInputChange('salary_frequency', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="កន្លះខែ (Semi-monthly)">{language === 'km' ? 'កន្លះខែ (Semi-monthly)' : 'Semi-monthly'}</option>
                    <option value="ប្រចាំខែ (Monthly)">{language === 'km' ? 'ប្រចាំខែ (Monthly)' : 'Monthly'}</option>
                    <option value="ពីរសប្តាហ៍ម្តង (Bi-weekly)">{language === 'km' ? 'ពីរសប្តាហ៍ម្តង (Bi-weekly)' : 'Bi-weekly'}</option>
                    {formData.salary_frequency === 'Monthly' && <option value="Monthly">Monthly</option>}
                    {formData.salary_frequency === 'Bi-weekly' && <option value="Bi-weekly">Bi-weekly</option>}
                  </select>
                </div>
              </div>

              {/* Pay Grade & Allowances */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'km' ? 'កម្រិតបៀវត្សរ៍ & ប្រាក់ឧបត្ថម្ភ (Pay Grade & Allowances)' : 'Pay Grade & Allowances'}
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    {language === 'km' ? 'កញ្ចប់សរុប៖ ' : 'Total Package: '}
                    {isBoardMember(formData)
                      ? (language === 'km' ? '$0 (លើកលែង)' : '$0 (Exempt)')
                      : `$${(
                          Number(formData.salary || 0) +
                          Number(formData.housing_transport_allowance ?? (Number(formData.housing_allowance || 0) + Number(formData.transport_allowance || 0))) +
                          Number(formData.meal_allowance || 0) +
                          Number(formData.skill_allowance || 0) +
                          Number(formData.seniority_bonus || 0) +
                          Number(formData.sewing_skill_matrix || 0) +
                          Number(formData.monthly_eval_bonus || 0) +
                          Number(formData.severance_pay || 0)
                        ).toLocaleString()}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'km' ? 'កម្រិតតួនាទី (Pay Grade)' : 'Pay Grade'}
                    </label>
                    <select
                      value={formData.pay_grade}
                      onChange={(e) => handleInputChange('pay_grade', e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="Level 1 - Intern">Level 1 - Intern</option>
                      <option value="Level 2 - Junior">Level 2 - Junior</option>
                      <option value="Level 3 - Officer">Level 3 - Officer</option>
                      <option value="Level 4 - Senior">Level 4 - Senior</option>
                      <option value="Level 5 - Lead / Supervisor">Level 5 - Lead / Supervisor</option>
                      <option value="Level 6 - Manager">Level 6 - Manager</option>
                      <option value="Level 7 - Director">Level 7 - Director</option>
                      <option value="Level 8 - Executive / C-Suite">Level 8 - Executive / C-Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'km' ? 'ថ្លៃអាហារ ($2.5/ថ្ងៃ = $65/ខែ)' : 'Meal Allowance ($2.5/day = $65/mo)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.meal_allowance}
                      onChange={(e) => handleInputChange('meal_allowance', e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="65"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'km' ? 'ថ្លៃស្នាក់នៅ & ធ្វើដំណើរ (Housing - Transport Allowance $)' : 'Housing - Transport Allowance ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.housing_transport_allowance ?? formData.housing_allowance}
                      onChange={(e) => {
                        handleInputChange('housing_transport_allowance', e.target.value);
                        handleInputChange('housing_allowance', e.target.value);
                        handleInputChange('transport_allowance', '0');
                      }}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'km' ? 'ប្រាក់ជំនាញ (Skill Allowance $)' : 'Skill Allowance ($)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.skill_allowance}
                      onChange={(e) => handleInputChange('skill_allowance', e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {language === 'km' ? 'ប្រាក់អតីតភាព (Seniority Allowance $)' : 'Seniority Allowance ($)'}
                      </label>
                      {(() => {
                        const res = calculateSeniorityAllowanceFromDate(formData.join_date);
                        return (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                            {res.tenureLabel} (${res.allowance.toFixed(2)})
                          </span>
                        );
                      })()}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.seniority_bonus !== undefined && formData.seniority_bonus !== '' ? formData.seniority_bonus : String(calculateSeniorityAllowanceFromDate(formData.join_date).allowance)}
                        onChange={(e) => handleInputChange('seniority_bonus', e.target.value)}
                        className="w-full text-xs font-semibold pl-2.5 pr-14 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = calculateSeniorityAllowanceFromDate(formData.join_date);
                          handleInputChange('seniority_bonus', String(res.allowance));
                        }}
                        className="absolute right-1 top-1 bottom-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[10px] font-semibold rounded-lg flex items-center gap-0.5 cursor-pointer transition-colors"
                        title={language === 'km' ? 'គណនាប្រាក់អតីតភាពស្វ័យប្រវត្តិពីថ្ងៃចូលធ្វើការ' : 'Auto-calculate Seniority Allowance based on Join Date'}
                      >
                        ⚡ Auto
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {language === 'km' ? 'គណនាដោយស្វ័យប្រវត្តិតាមកាលបរិច្ឆេទចូលបម្រើការ (Join Date)' : 'Auto-calculated from employment Join Date'}
                    </div>
                  </div>

                  {/* Sewing Skill Matrix Allowance */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                        {language === 'km' ? 'ម៉ាទ្រីសកម្រិតដេរ (Sewing Matrix $)' : 'Sewing Matrix ($)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setMatrixModalOpen(true)}
                        className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs transition-colors"
                        title={language === 'km' ? 'បើកម៉ាស៊ីនគិតលេខម៉ាទ្រីសដេរ' : 'Calculate Sewing Matrix Grade Allowance'}
                      >
                        <Calculator size={11} />
                        <span>{language === 'km' ? 'គណនា' : 'Calculate'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.sewing_skill_matrix}
                        onChange={(e) => handleInputChange('sewing_skill_matrix', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-bold pl-6 pr-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200"
                      />
                    </div>
                  </div>

                  {/* Monthly Evaluation Bonus */}
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-300">
                        {language === 'km' ? 'ប្រាក់រង្វាន់វាយតម្លៃ (Monthly Eval $)' : 'Monthly Eval Bonus ($)'}
                      </label>
                      <div className="flex items-center gap-1">
                        {[6, 11, 15, 20].map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => handleInputChange('monthly_eval_bonus', String(tier))}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              Number(formData.monthly_eval_bonus) === tier
                                ? 'bg-purple-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50'
                            }`}
                          >
                            ${tier}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.monthly_eval_bonus}
                        onChange={(e) => handleInputChange('monthly_eval_bonus', e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-bold pl-6 pr-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-200"
                      />
                    </div>
                  </div>

                  {/* Severant Pay 5% (Column 50 - Article 73 FDC Contract Indemnity) */}
                  <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        {language === 'km' ? 'ប្រាក់បំណាច់កុងត្រា ៥% (Severant Pay 5% - Column 50)' : 'Severant Pay 5% (Col 50 - FDC Article 73)'}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const fivePct = Math.round(Number(formData.salary || 210) * 0.05 * 100) / 100;
                            handleInputChange('severance_pay', String(fivePct));
                          }}
                          className="text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                        >
                          ⚡ 5% Base (${(Number(formData.salary || 210) * 0.05).toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('severance_pay', '0')}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded cursor-pointer text-slate-500 hover:bg-slate-200"
                        >
                          $0
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.severance_pay}
                        onChange={(e) => handleInputChange('severance_pay', e.target.value)}
                        placeholder="0.00"
                        className="w-full text-xs font-bold pl-6 pr-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-200"
                      />
                    </div>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">
                      {language === 'km' ? 'កាតព្វកិច្ចច្បាប់ការងារមាត្រា ៧៣៖ យ៉ាងតិច ៥% លើប្រាក់ឈ្នួលកិច្ចសន្យាមានកំណត់ (FDC)' : 'Cambodia Labor Law Art. 73: Mandated at least 5% on FDC contract wages upon contract completion/renewal.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                  </label>
                  <select
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {CAMBODIA_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {formatLocalizedText(b, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Account Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => handleInputChange('bank_account_name', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'លេខគណនី (Account Number)' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="000 123 456"
                    value={formData.bank_account_number}
                    onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NSSF */}
          {activeTab === 'nssf' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'សមាជិក ប.ស.ស (NSSF Member)' : 'NSSF Member'}
                  </label>
                  <select
                    value={formData.nssf_member}
                    onChange={(e) => handleInputChange('nssf_member', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="មាន (Yes)">{language === 'km' ? 'មាន (Yes)' : 'Yes'}</option>
                    <option value="មិនទាន់មាន (No)">{language === 'km' ? 'មិនទាន់មាន (No)' : 'No'}</option>
                    {formData.nssf_member === 'Yes' && <option value="Yes">Yes</option>}
                    {formData.nssf_member === 'No' && <option value="No">No</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'លេខប័ណ្ណ ប.ស.ស (NSSF Card No.)' : 'NSSF Card Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="123456789"
                    value={formData.nssf_number}
                    onChange={(e) => handleInputChange('nssf_number', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទចុះឈ្មោះ ប.ស.ស' : 'NSSF Registration Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.nssf_reg_date}
                    onChange={(e) => handleInputChange('nssf_reg_date', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EMERGENCY CONTACT */}
          {activeTab === 'emergency' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ឈ្មោះអ្នកទំនាក់ទំនង (Contact Name)' : 'Contact Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ទំនាក់ទំនង / ត្រូវជា (Relationship)' : 'Relationship'}
                  </label>
                  <select
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ប្តី/ប្រពន្ធ (Spouse)">{language === 'km' ? 'ប្តី/ប្រពន្ធ (Spouse)' : 'Spouse'}</option>
                    <option value="ឪពុក/ម្តាយ (Parents)">{language === 'km' ? 'ឪពុក/ម្តាយ (Parents)' : 'Parents'}</option>
                    <option value="បងប្អូន (Sibling)">{language === 'km' ? 'បងប្អូន (Sibling)' : 'Sibling'}</option>
                    <option value="មិត្តភក្តិ (Friend)">{language === 'km' ? 'មិត្តភក្តិ (Friend)' : 'Friend'}</option>
                    <option value="ផ្សេងទៀត (Other)">{language === 'km' ? 'ផ្សេងទៀត (Other)' : 'Other'}</option>
                    {formData.emergency_contact_relationship === 'Spouse' && <option value="Spouse">Spouse</option>}
                    {formData.emergency_contact_relationship === 'Parents' && <option value="Parents">Parents</option>}
                    {formData.emergency_contact_relationship === 'Sibling' && <option value="Sibling">Sibling</option>}
                    {formData.emergency_contact_relationship === 'Friend' && <option value="Friend">Friend</option>}
                    {formData.emergency_contact_relationship === 'Other' && <option value="Other">Other</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km' ? 'អាសយដ្ឋានអ្នកទំនាក់ទំនង (Address)' : 'Emergency Contact Address'}
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_address}
                  onChange={(e) => handleInputChange('emergency_contact_address', e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS & BIO */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'km' ? 'ប្រវត្តិសង្ខេប & ចំណាំ (Bio / Notes)' : 'Biography / Professional Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Professional summary, competencies, education..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'តំណឯកសារអត្តសញ្ញាណប័ណ្ណ (National ID Scan)' : 'National ID Document Scan Link'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /docs/nid.pdf"
                    value={formData.doc_national_id}
                    onChange={(e) => handleInputChange('doc_national_id', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'តំណឯកសារលិខិតឆ្លងដែន (Passport Scan)' : 'Passport Document Scan Link'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /docs/passport.pdf"
                    value={formData.doc_passport}
                    onChange={(e) => handleInputChange('doc_passport', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'តំណកិច្ចសន្យាការងារ (Signed Contract)' : 'Signed Contract Link'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /docs/contract.pdf"
                    value={formData.doc_contract}
                    onChange={(e) => handleInputChange('doc_contract', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ឯកសារផ្សេងៗ (Other Attachments)' : 'Other Attachments Link'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /docs/cert.pdf"
                    value={formData.doc_others}
                    onChange={(e) => handleInputChange('doc_others', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="text-[11px] text-slate-400">
              {language === 'km' ? 'ចុច "រក្សាទុក" ដើម្បីធ្វើបច្ចុប្បន្នភាព' : 'Click save to apply changes'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>{loading ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving Changes...') : (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sewing Matrix Calculator Modal */}
      {matrixModalOpen && (
        <SewingMatrixCalculatorModal
          isOpen={matrixModalOpen}
          onClose={() => setMatrixModalOpen(false)}
          employee={{
            id: employee.id,
            name: `${formData.first_name} ${formData.last_name}`.trim(),
            khmer_name: employee.khmer_name,
            role: formData.role,
            group_name: (employee as any).group_name,
            currentMatrix: Number(formData.sewing_skill_matrix || 0),
            base_salary: Number(formData.salary || 0),
          }}
          onSuccess={(newVal) => {
            if (newVal !== undefined) {
              setFormData((prev) => ({ ...prev, sewing_skill_matrix: String(newVal) }));
            }
          }}
        />
      )}
    </div>
  );
}
