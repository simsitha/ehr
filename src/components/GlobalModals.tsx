'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  UserPlus,
  Calendar,
  Briefcase,
  Megaphone,
  DollarSign,
  Check,
  User,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  FileText,
  Upload,
  Camera,
  ChevronRight,
  ChevronLeft,
  IdCard,
  FileCheck,
  FolderOpen,
  Sparkles,
  Layers,
  HeartHandshake,
  Mail,
  Lock,
  Trash2,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { Department, EmployeeGroup, isBoardMember } from '@/lib/types';
import { formatLocalizedText, cleanEnglishOnly, sanitizeEnglishInput } from '@/lib/translations';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';

export const CAMBODIA_PROVINCES = [
  'រាជធានីភ្នំពេញ (Phnom Penh)',
  'ខេត្តកណ្តាល (Kandal)',
  'ខេត្តសៀមរាប (Siem Reap)',
  'ខេត្តបាត់ដំបង (Battambang)',
  'ខេត្តព្រះសីហនុ (Preah Sihanouk)',
  'ខេត្តកំពង់ចាម (Kampong Cham)',
  'ខេត្តកំពង់ស្ពឺ (Kampong Speu)',
  'ខេត្តកំពង់ឆ្នាំង (Kampong Chhnang)',
  'ខេត្តកំពង់ធំ (Kampong Thom)',
  'ខេត្តកំពត (Kampot)',
  'ខេត្តកែប (Kep)',
  'ខេត្តកោះកុង (Koh Kong)',
  'ខេត្តក្រចេះ (Kratie)',
  'ខេត្តមណ្ឌលគិរី (Mondulkiri)',
  'ខេត្តឧត្តរមានជ័យ (Oddar Meanchey)',
  'ខេត្តប៉ៃលិន (Pailin)',
  'ខេត្តព្រះវិហារ (Preah Vihear)',
  'ខេត្តព្រៃវែង (Prey Veng)',
  'ខេត្តពោធិ៍សាត់ (Pursat)',
  'ខេត្តរតនគិរី (Ratanakiri)',
  'ខេត្តស្ទឹងត្រែង (Stung Treng)',
  'ខេត្តស្វាយរៀង (Svay Rieng)',
  'ខេត្តតាកែវ (Takeo)',
  'ខេត្តត្បូងឃ្មុំ (Tboung Khmum)',
  'ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)',
];

export const CAMBODIA_BANKS = [
  'ABA Bank (ធនាគារ អេ ប៊ី អេ)',
  'ACLEDA Bank Plc. (ធនាគារ អេស៊ីលីដា)',
  'Canadia Bank (ធនាគារ កាណាឌីយ៉ា)',
  'Wing Bank (ធនាគារ វីង)',
  'Sathapana Bank (ធនាគារ សហគ្រាសធុនតូច & មធ្យម)',
  'Vattanac Bank (ធនាគារ វឌ្ឍនៈ)',
  'Prince Bank (ធនាគារ ព្រីនស៍)',
  'J Trust Royal Bank',
  'BRED Bank Cambodia',
  'Chip Mong Commercial Bank',
  'Cash / សាច់ប្រាក់សុទ្ធ (Hand-to-Hand)',
];

export type AddStaffTab = 'personal' | 'contact' | 'employment' | 'payroll' | 'nssf' | 'emergency' | 'documents';

export const generateFreshEmpId = () => `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

export const createDefaultEmpForm = (defaultDeptId = '', defaultManagerId = '') => ({
  // 1. Personal Information
  last_name: '',
  first_name: '',
  gender: 'ប្រុស (Male)',
  dob: '1998-05-15',
  nationality: 'Cambodian',
  marital_status: 'នៅលីវ (Single)',
  national_id: '',
  status: 'Active',
  employment_type: 'ពេញម៉ោង (Full-Time)',
  salary: '1200',
  location: 'Phnom Penh',

  // 2. Contact Information
  phone: '',
  email: '',
  current_address: '',
  province_city: 'រាជធានីភ្នំពេញ (Phnom Penh)',
  district: '',
  commune_sangkat: '',
  village: '',

  // 3. Employee Information
  employee_id: generateFreshEmpId(),
  department_id: defaultDeptId,
  role: '',
  group_id: '',
  group_name: '',
  employee_type: 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
  join_date: new Date().toISOString().split('T')[0],
  contract_type: 'UDC (មិនកំណត់ថិរវេលា)',
  contract_start: new Date().toISOString().split('T')[0],
  contract_end: '',
  manager_id: defaultManagerId,
  work_location: 'Head Office',

  // 4. Salary & Payroll
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
  bank_name: 'ABA Bank (ធនាគារ អេ ប៊ី អេ)',
  bank_account_name: '',
  bank_account_number: '',

  // 5. NSSF Information
  nssf_member: 'មាន (Yes)',
  nssf_number: '',
  nssf_reg_date: new Date().toISOString().split('T')[0],

  // 6. Emergency Contact
  emergency_contact_name: '',
  emergency_contact_relationship: 'ប្តី/ប្រពន្ធ (Spouse)',
  emergency_contact_phone: '',
  emergency_contact_address: '',

  // 7. Documents & Photo
  avatar: '',
  doc_national_id: '',
  doc_passport: '',
  doc_contract: '',
  doc_others: '',
});

export default function GlobalModals() {
  const { activeModal, closeModal, showToast, triggerRefresh, currentPersona, language, t } = useApp();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [newEmpGroups, setNewEmpGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStaffTab, setActiveStaffTab] = useState<AddStaffTab>('personal');

  // Form states
  const [empForm, setEmpForm] = useState(createDefaultEmpForm());

  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docIdInputRef = useRef<HTMLInputElement>(null);
  const docPassportInputRef = useRef<HTMLInputElement>(null);
  const docContractInputRef = useRef<HTMLInputElement>(null);
  const docOthersInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast(
        language === 'km'
          ? 'សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WEBP)'
          : 'Please select an image file (JPG, PNG, WEBP)',
        'error'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(
        language === 'km'
          ? 'ទំហំរូបភាពត្រូវតែតូចជាង 10MB'
          : 'Image file must be smaller than 10MB',
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
          setEmpForm((prev) => ({ ...prev, avatar: compressedDataUrl }));
          showToast(
            language === 'km' ? 'បានផ្ទុករូបថតបុគ្គលិកជោគជ័យ!' : 'Staff photo uploaded successfully!',
            'success'
          );
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDocUpload = (
    field: 'doc_national_id' | 'doc_passport' | 'doc_contract' | 'doc_others',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setEmpForm((prev) => ({ ...prev, [field]: file.name }));
      showToast(
        language === 'km' ? `បានភ្ជាប់ឯកសារ ${file.name}` : `Document attached: ${file.name}`,
        'success'
      );
    }
  };

  const [leaveForm, setLeaveForm] = useState({
    employee_id: currentPersona.id,
    leave_type: 'Annual',
    start_date: '2026-10-01',
    end_date: '2026-10-05',
    reason: '',
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: '',
    location: language === 'km' ? 'រាជធានីភ្នំពេញ / Hybrid' : 'Phnom Penh / Hybrid',
    type: 'Full-Time',
    experience_level: language === 'km' ? 'កម្រិតមធ្យម-ជាន់ខ្ពស់ (3+ ឆ្នាំ)' : 'Mid-Senior (3+ Years)',
    salary_range: language === 'km' ? '$800 - $1,600 / ខែ' : '$800 - $1,600 / mo',
    description: '',
    requirements: '',
  });

  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    category: 'General',
    pinned: false,
  });

  const [payrollForm, setPayrollForm] = useState(() => {
    const now = new Date();
    const period = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return {
      period,
      payment_date: lastDay,
    };
  });

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0) {
            setEmpForm((f) => ({ ...f, department_id: f.department_id || data[0].id }));
            setJobForm((f) => ({ ...f, department_id: data[0].id }));
          }
        }
      })
      .catch((err) => console.error(err));

    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagers(data);
          if (data.length > 0) {
            setEmpForm((f) => ({ ...f, manager_id: f.manager_id || data[0].id }));
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLeaveForm((prev) => ({ ...prev, employee_id: currentPersona.id }));
  }, [currentPersona.id]);

  useEffect(() => {
    if (!empForm.department_id) {
      setNewEmpGroups([]);
      return;
    }
    const matchedDept = departments.find(
      (d) => d.id === empForm.department_id || d.name === empForm.department_id
    );
    if (matchedDept?.groups && matchedDept.groups.length > 0) {
      setNewEmpGroups(matchedDept.groups);
    }
    const deptKey = matchedDept ? matchedDept.id : empForm.department_id;
    fetch(`/api/groups?department_id=${encodeURIComponent(deptKey)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNewEmpGroups(data);
        }
      })
      .catch((err) => console.error('Error fetching groups for new employee:', err));
  }, [empForm.department_id, departments]);

  // Reset form with fresh ID and clean state whenever Add Staff modal opens
  useEffect(() => {
    if (activeModal === 'add-employee') {
      const defaultDept = departments[0]?.id || '';
      const defaultMgr = managers[0]?.id || '';
      setEmpForm(createDefaultEmpForm(defaultDept, defaultMgr));
      setActiveStaffTab('personal');
    }
  }, [activeModal, departments, managers]);

  const SUPPORTED_MODALS = ['add-employee', 'request-leave', 'post-job', 'post-announcement', 'run-payroll'];
  if (!activeModal || !SUPPORTED_MODALS.includes(activeModal)) return null;

  // Handlers
  const handleAddEmployee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate Required Personal Info
    if (!empForm.first_name.trim() || !empForm.last_name.trim()) {
      showToast(
        language === 'km'
          ? 'សូមបំពេញនាមត្រកូល និងនាមខ្លួនជាមុនសិន'
          : 'Please enter Last name and First name',
        'error'
      );
      setActiveStaffTab('personal');
      return;
    }

    // Validate Required Employment Info
    const finalEmpId = empForm.employee_id?.trim() || generateFreshEmpId();
    if (!empForm.role.trim()) {
      showToast(
        language === 'km'
          ? 'សូមបំពេញមុខតំណែង (Position / Role)'
          : 'Please enter position/role title',
        'error'
      );
      setActiveStaffTab('employment');
      return;
    }

    if (!empForm.department_id) {
      showToast(
        language === 'km'
          ? 'សូមជ្រើសរើសនាយកដ្ឋាន / ផ្នែក'
          : 'Please select a department',
        'error'
      );
      setActiveStaffTab('employment');
      return;
    }

    // Validate Email format if entered
    if (empForm.email && empForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empForm.email.trim())) {
      showToast(
        language === 'km'
          ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ'
          : 'Please enter a valid email address',
        'error'
      );
      setActiveStaffTab('contact');
      return;
    }

    const finalAccountName = empForm.bank_account_name.trim() || `${empForm.first_name} ${empForm.last_name}`.trim().toUpperCase();

    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...empForm,
          nationality: cleanEnglishOnly(empForm.nationality) || 'Cambodian',
          location: cleanEnglishOnly(empForm.location) || 'Phnom Penh',
          work_location: cleanEnglishOnly(empForm.work_location) || 'Head Office',
          id: finalEmpId,
          bank_account_name: finalAccountName,
          salary: Number(String(empForm.salary || 0).replace(/[^0-9.-]/g, '')) || 0,
          housing_transport_allowance: Number(String(empForm.housing_transport_allowance || empForm.housing_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
          transport_allowance: 0,
          meal_allowance: Number(String(empForm.meal_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
          housing_allowance: Number(String(empForm.housing_transport_allowance || empForm.housing_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
          attendance_allowance: 0,
          skill_allowance: Number(String(empForm.skill_allowance || 0).replace(/[^0-9.-]/g, '')) || 0,
          seniority_bonus: Number(String(empForm.seniority_bonus || 0).replace(/[^0-9.-]/g, '')) || 0,
        }),
      });

      if (res.ok) {
        showToast(
          language === 'km'
            ? `បានបញ្ចូលបុគ្គលិក ${empForm.first_name} ${empForm.last_name} ជោគជ័យ! ✓`
            : `Employee ${empForm.first_name} ${empForm.last_name} onboarded! ✓`,
          'success'
        );
        triggerRefresh();
        closeModal();
        // Reset form for next entry
        setEmpForm(createDefaultEmpForm(departments[0]?.id || '', managers[0]?.id || ''));
      } else {
        const err = await res.json();
        showToast(err.error || (language === 'km' ? 'បរាជ័យក្នុងការបញ្ចូលបុគ្គលិក' : 'Failed to register employee'), 'error');
      }
    } catch {
      showToast('Network error adding employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });
      if (res.ok) {
        showToast('Time off request submitted successfully!', 'success');
        triggerRefresh();
        closeModal();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to request leave', 'error');
      }
    } catch {
      showToast('Network error requesting leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });
      if (res.ok) {
        showToast(`Job posting "${jobForm.title}" published!`, 'success');
        triggerRefresh();
        closeModal();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to post job', 'error');
      }
    } catch {
      showToast('Network error posting job', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...annForm,
          author_id: currentPersona.id,
          pinned: annForm.pinned ? 1 : 0,
        }),
      });
      if (res.ok) {
        showToast('Announcement posted to company bulletin!', 'success');
        triggerRefresh();
        closeModal();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to post announcement', 'error');
      }
    } catch {
      showToast('Network error posting announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_batch',
          period: payrollForm.period,
          payment_date: payrollForm.payment_date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payroll processed successfully!', 'success');
        triggerRefresh();
        closeModal();
      } else {
        showToast(data.error || 'Failed to process payroll', 'error');
      }
    } catch {
      showToast('Network error executing payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
        activeModal === 'add-employee' ? 'max-w-4xl' : 'max-w-xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            {activeModal === 'add-employee' && (
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <UserPlus size={18} />
              </div>
            )}
            {activeModal === 'request-leave' && (
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <Calendar size={18} />
              </div>
            )}
            {activeModal === 'post-job' && (
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                <Briefcase size={18} />
              </div>
            )}
            {activeModal === 'post-announcement' && (
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                <Megaphone size={18} />
              </div>
            )}
            {activeModal === 'run-payroll' && (
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <DollarSign size={18} />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'km' ? (
                  <>
                    {activeModal === 'add-employee' && 'បញ្ចូលបុគ្គលិកថ្មី (Add Staff)'}
                    {activeModal === 'request-leave' && 'ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក'}
                    {activeModal === 'post-job' && 'ប្រកាសជ្រើសរើសបុគ្គលិក'}
                    {activeModal === 'post-announcement' && 'ផ្សាយដំណឹងក្នុងក្រុមហ៊ុន'}
                    {activeModal === 'run-payroll' && 'រៀបចំបើកប្រាក់បៀវត្សរ៍'}
                  </>
                ) : (
                  <>
                    {activeModal === 'add-employee' && 'Onboard New Staff Member'}
                    {activeModal === 'request-leave' && 'Request Time Off'}
                    {activeModal === 'post-job' && 'Post Job Opening'}
                    {activeModal === 'post-announcement' && 'Broadcast Announcement'}
                    {activeModal === 'run-payroll' && 'Process Monthly Payroll'}
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km' ? (
                  <>
                    {activeModal === 'add-employee' && 'បំពេញព័ត៌មានលម្អិតទាំង ៧ ផ្នែក៖ ផ្ទាល់ខ្លួន ទំនាក់ទំនង ការងារ បៀវត្សរ៍ ប.ស.ស អាសន្ន និងឯកសារ'}
                    {activeModal === 'request-leave' && 'ជ្រើសរើសប្រភេទច្បាប់ និងកាលបរិច្ឆេទសុំឈប់សម្រាក'}
                    {activeModal === 'post-job' && 'បន្ថែមតម្រូវការការងារថ្មីក្នុងប្រព័ន្ធ ATS ក្រុមហ៊ុន'}
                    {activeModal === 'post-announcement' && 'ផ្សព្វផ្សាយដំណឹងទូទៅដល់បុគ្គលិកទាំងអស់'}
                    {activeModal === 'run-payroll' && 'ដំណើរការគណនាបៀវត្សរ៍ & កាត់វិភាគទាន ប.ស.ស (NSSF)'}
                  </>
                ) : (
                  <>
                    {activeModal === 'add-employee' && 'Comprehensive 7-step employee onboarding and contract registration'}
                    {activeModal === 'request-leave' && 'Select leave type, duration and justification'}
                    {activeModal === 'post-job' && 'Publish a new opening to the recruitment ATS pipeline'}
                    {activeModal === 'post-announcement' && 'Broadcast message to the company notice board'}
                    {activeModal === 'run-payroll' && 'Calculate batch payslips and deduct NSSF contributions'}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 7 Section Stepper Tabs for Add Staff */}
        {activeModal === 'add-employee' && (
          <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 text-xs font-semibold overflow-x-auto gap-1 py-1.5 scrollbar-thin">
            {[
              { id: 'personal', labelKm: '១. ផ្ទាល់ខ្លួន', labelEn: '1. Personal', icon: User },
              { id: 'contact', labelKm: '២. ទំនាក់ទំនង', labelEn: '2. Contact', icon: Phone },
              { id: 'employment', labelKm: '៣. ព័ត៌មានការងារ', labelEn: '3. Employment', icon: Briefcase },
              { id: 'payroll', labelKm: '៤. បៀវត្សរ៍ & ធនាគារ', labelEn: '4. Payroll & Bank', icon: DollarSign },
              { id: 'nssf', labelKm: '៥. ប.ស.ស (NSSF)', labelEn: '5. NSSF', icon: ShieldCheck },
              { id: 'emergency', labelKm: '៦. អាសន្ន', labelEn: '6. Emergency', icon: AlertCircle },
              { id: 'documents', labelKm: '៧. ឯកសារ', labelEn: '7. Documents', icon: FolderOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStaffTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStaffTab(tab.id as AddStaffTab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                  <span>{language === 'km' ? tab.labelKm : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {/* 1. ADD EMPLOYEE FORM */}
          {activeModal === 'add-employee' && (
            <div className="space-y-4">
              {/* Hidden Global Avatar Input accessible across all tabs */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              {/* TAB 1: PERSONAL INFORMATION */}
              {activeStaffTab === 'personal' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
                      <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ១៖ ព័ត៌មានផ្ទាល់ខ្លួន (Personal Information)' : 'Section 1: Personal Information'}</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      {language === 'km' ? 'ជំហាន ១ នៃ ៧' : 'Step 1 of 7'}
                    </span>
                  </div>

                  {/* Photo Upload & Identity Card */}
                  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group shrink-0">
                      {empForm.avatar ? (
                        <img
                          src={empForm.avatar}
                          alt="Employee Avatar"
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md"
                        />
                      ) : (
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 dark:text-indigo-400 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors shadow-2xs"
                        >
                          <Camera size={20} />
                          <span className="text-[9px] font-bold mt-1 text-center px-1 leading-tight">
                            {language === 'km' ? 'ផ្ទុករូប' : 'Upload'}
                          </span>
                        </div>
                      )}
                      {empForm.avatar && (
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          title={language === 'km' ? 'ផ្លាស់ប្តូររូបថត' : 'Change Photo'}
                        >
                          <Camera size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {language === 'km' ? 'រូបថតបុគ្គលិក (Staff Photo)' : 'Staff Photo'}
                        </span>
                        {empForm.avatar ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/60 dark:border-emerald-800/60">
                            <Check size={11} /> {language === 'km' ? 'បានភ្ជាប់រូប' : 'Photo Attached'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                            ({language === 'km' ? 'មិនទាមទារជាកាតព្វកិច្ច' : 'Optional'})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'km'
                          ? 'ផ្ទុករូបថតបុគ្គលិកផ្ទាល់ពីកុំព្យូទ័រ/ទូរស័ព្ទ (JPG, PNG, WEBP) - ប្រើប្រាស់សម្រាប់កាត & ប្រព័ន្ធ'
                          : 'Upload staff photo directly from your device (JPG, PNG, WEBP) - used on badges & directory.'}
                      </p>
                      <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
                        >
                          <Upload size={12} />
                          <span>{empForm.avatar ? (language === 'km' ? 'ប្តូររូបថត' : 'Change Photo') : (language === 'km' ? 'ជ្រើសរើសរូបថត' : 'Choose Photo')}</span>
                        </button>
                        {empForm.avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmpForm((prev) => ({ ...prev, avatar: '' }));
                              if (avatarInputRef.current) avatarInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                          >
                            <Trash2 size={12} />
                            <span>{language === 'km' ? 'លុប' : 'Remove'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'នាមត្រកូល (Last name) *' : 'Last name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={empForm.last_name}
                        onChange={(e) => setEmpForm({ ...empForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'ចាន់ / Chan' : 'Chan'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'នាមខ្លួន (First name) *' : 'First name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={empForm.first_name}
                        onChange={(e) => setEmpForm({ ...empForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'ធីតា / Thida' : 'Thida'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ភេទ (Gender)' : 'Gender'}
                      </label>
                      <select
                        value={empForm.gender}
                        onChange={(e) => setEmpForm({ ...empForm, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="ប្រុស (Male)">{language === 'km' ? 'ប្រុស (Male)' : 'Male'}</option>
                        <option value="ស្រី (Female)">{language === 'km' ? 'ស្រី (Female)' : 'Female'}</option>
                        <option value="ផ្សេងៗ (Other)">{language === 'km' ? 'ផ្សេងៗ (Other)' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)' : 'Date of Birth'}
                      </label>
                      <input
                        type="date"
                        value={empForm.dob}
                        onChange={(e) => setEmpForm({ ...empForm, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nationality
                      </label>
                      <input
                        type="text"
                        list="emp-nationality-options"
                        value={empForm.nationality}
                        onChange={(e) => setEmpForm({ ...empForm, nationality: sanitizeEnglishInput(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder="Cambodian"
                      />
                      <datalist id="emp-nationality-options">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ស្ថានភាពអាពាហ៍ពិពាហ៍ (Marital Status)' : 'Marital Status'}
                      </label>
                      <select
                        value={empForm.marital_status}
                        onChange={(e) => setEmpForm({ ...empForm, marital_status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="នៅលីវ (Single)">{language === 'km' ? 'នៅលីវ (Single)' : 'Single'}</option>
                        <option value="រៀបការរួច (Married)">{language === 'km' ? 'រៀបការរួច (Married)' : 'Married'}</option>
                        <option value="លែងលះ (Divorced)">{language === 'km' ? 'លែងលះ (Divorced)' : 'Divorced'}</option>
                        <option value="ពោះម៉ាយ/មេម៉ាយ (Widowed)">{language === 'km' ? 'ពោះម៉ាយ/មេម៉ាយ (Widowed)' : 'Widowed'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'អត្តសញ្ញាណប័ណ្ណ (National ID)' : 'National ID'}
                      </label>
                      <input
                        type="text"
                        value={empForm.national_id}
                        onChange={(e) => setEmpForm({ ...empForm, national_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="010928374"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ស្ថានភាព (Status)' : 'Status'}
                      </label>
                      <select
                        value={empForm.status}
                        onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="Active">{language === 'km' ? 'សកម្ម (Active)' : 'Active'}</option>
                        <option value="Probation">{language === 'km' ? 'សាកល្បង (Probation)' : 'Probation'}</option>
                        <option value="Remote">{language === 'km' ? 'ធ្វើការពីផ្ទះ (Remote)' : 'Remote'}</option>
                        <option value="On Leave">{language === 'km' ? 'ឈប់សម្រាក (On Leave)' : 'On Leave'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ប្រភេទការងារ (Full time)' : 'Employment Type'}
                      </label>
                      <select
                        value={empForm.employment_type}
                        onChange={(e) => setEmpForm({ ...empForm, employment_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="ពេញម៉ោង (Full-Time)">{language === 'km' ? 'ពេញម៉ោង (Full-Time)' : 'Full-Time'}</option>
                        <option value="ក្រៅម៉ោង (Part-Time)">{language === 'km' ? 'ក្រៅម៉ោង (Part-Time)' : 'Part-Time'}</option>
                        <option value="កិច្ចសន្យា (Contract)">{language === 'km' ? 'កិច្ចសន្យា (Contract)' : 'Contract'}</option>
                        <option value="កម្មសិក្សា (Intern)">{language === 'km' ? 'កម្មសិក្សា (Intern)' : 'Intern'}</option>
                        <option value="ក្រុមប្រឹក្សាភិបាល (Board of Directors)">{language === 'km' ? 'ក្រុមប្រឹក្សាភិបាល (Board of Directors)' : 'Board of Directors'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>{language === 'km' ? 'ប្រាក់បៀវត្សរ៍ (Salary $/ខែ)' : 'Salary ($/month)'}</span>
                        {isBoardMember({ role: empForm.role, department_id: empForm.department_id, employee_type: empForm.employee_type, employment_type: empForm.employment_type }) && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Crown size={11} /> {language === 'km' ? 'លើកលែង' : 'Exempt'}
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={isBoardMember({ role: empForm.role, department_id: empForm.department_id, employee_type: empForm.employee_type, employment_type: empForm.employment_type }) ? 0 : empForm.salary}
                        onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                        disabled={isBoardMember({ role: empForm.role, department_id: empForm.department_id, employee_type: empForm.employee_type, employment_type: empForm.employment_type })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono disabled:opacity-60"
                        placeholder="1200"
                      />
                    </div>
                  </div>

                  {isBoardMember({ role: empForm.role, department_id: empForm.department_id, employee_type: empForm.employee_type, employment_type: empForm.employment_type }) && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
                      <Crown size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        {language === 'km'
                          ? 'សមាជិកក្រុមប្រឹក្សាភិបាលត្រូវបានលើកលែងពីប្រាក់បៀវត្សរ៍ វត្តមានប្រចាំថ្ងៃ និងភារកិច្ចប្រតិបត្តិការនានារបស់បុគ្គលិក។'
                          : 'Board of Directors members are exempt from salary, daily attendance tracking, and operational staff tasks.'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      list="emp-location-options"
                      value={empForm.location}
                      onChange={(e) => setEmpForm({ ...empForm, location: sanitizeEnglishInput(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      placeholder="Phnom Penh"
                    />
                    <datalist id="emp-location-options">
                      <option value="Phnom Penh" />
                      <option value="Siem Reap" />
                      <option value="Sihanoukville" />
                      <option value="Battambang" />
                      <option value="Kandal" />
                      <option value="Kampong Cham" />
                      <option value="Bavet" />
                      <option value="Poipet" />
                      <option value="Koh Kong" />
                      <option value="Kampot" />
                      <option value="Remote" />
                    </datalist>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT INFORMATION */}
              {activeStaffTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                      <Phone size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ២៖ ព័ត៌មានទំនាក់ទំនង (Contact Information)' : 'Section 2: Contact Information'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {language === 'km' ? 'ជំហាន ២ នៃ ៧' : 'Step 2 of 7'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'លេខទូរស័ព្ទ (Phone number) *' : 'Phone number *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={empForm.phone}
                        onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="+855 12 345 678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'អ៊ីមែលការងារ (Work Email)' : 'Work Email (Optional)'}
                      </label>
                      <input
                        type="email"
                        value={empForm.email}
                        onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder="thida@outlook.com (Optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'km' ? 'អាសយដ្ឋានបច្ចុប្បន្ន (Current address)' : 'Current address'}
                    </label>
                    <input
                      type="text"
                      value={empForm.current_address}
                      onChange={(e) => setEmpForm({ ...empForm, current_address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      placeholder={language === 'km' ? 'ផ្ទះលេខ 128E, ផ្លូវ 2004, សង្កាត់ទឹកថ្លា' : 'House 128E, St 2004, Teuk Thla'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ខេត្ត/រាជធានី (Province/City)' : 'Province/City'}
                      </label>
                      <select
                        value={empForm.province_city}
                        onChange={(e) => setEmpForm({ ...empForm, province_city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        {CAMBODIA_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {formatLocalizedText(prov, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ស្រុក/ខណ្ឌ (District)' : 'District'}
                      </label>
                      <input
                        type="text"
                        value={empForm.district}
                        onChange={(e) => setEmpForm({ ...empForm, district: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'ខណ្ឌសែនសុខ / Khan Sen Sok' : 'Khan Sen Sok'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ឃុំ/សង្កាត់ (Commune/Sangkat)' : 'Commune/Sangkat'}
                      </label>
                      <input
                        type="text"
                        value={empForm.commune_sangkat}
                        onChange={(e) => setEmpForm({ ...empForm, commune_sangkat: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'សង្កាត់ទឹកថ្លា / Sangkat Teuk Thla' : 'Sangkat Teuk Thla'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ភូមិ (Village)' : 'Village'}
                      </label>
                      <input
                        type="text"
                        value={empForm.village}
                        onChange={(e) => setEmpForm({ ...empForm, village: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'ភូមិស្លែងរលើង / Phum Slaeng Roleung' : 'Phum Slaeng Roleung'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EMPLOYEE INFORMATION */}
              {activeStaffTab === 'employment' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-xs font-bold">
                      <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ៣៖ ព័ត៌មានការងារ (Employee Information)' : 'Section 3: Employee Information'}</span>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      {language === 'km' ? 'ជំហាន ៣ នៃ ៧' : 'Step 3 of 7'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {language === 'km' ? 'អត្តលេខបុគ្គលិក (Employee ID)' : 'Employee ID'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setEmpForm((prev) => ({ ...prev, employee_id: generateFreshEmpId() }))}
                          title={language === 'km' ? 'បង្កើតលេខកូដថ្មីដោយស្វ័យប្រវត្តិ' : 'Auto-generate fresh Employee ID'}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <RefreshCw size={10} className="stroke-[2.5]" />
                          <span>{language === 'km' ? 'ស្វ័យប្រវត្តិ' : 'Auto ID'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={empForm.employee_id}
                        onChange={(e) => setEmpForm({ ...empForm, employee_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="EMP-2026-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>{language === 'km' ? 'ផ្នែក / នាយកដ្ឋាន' : 'Department'} *</span>
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      </label>
                      <select
                        value={empForm.department_id}
                        onChange={(e) => setEmpForm({ ...empForm, department_id: e.target.value, group_id: '', group_name: '' })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">{language === 'km' ? '-- ជ្រើសរើសនាយកដ្ឋាន --' : '-- Select Department --'}</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {formatLocalizedText(d.name, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>{language === 'km' ? 'ក្រុម / ខ្សែសង្វាក់' : 'Group / Line'}</span>
                        <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      </label>
                      <select
                        value={empForm.group_id}
                        onChange={(e) => {
                          const selectedGrp = newEmpGroups.find((g) => g.id === e.target.value);
                          setEmpForm({
                            ...empForm,
                            group_id: e.target.value,
                            group_name: selectedGrp ? selectedGrp.name : '',
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">{language === 'km' ? '-- គ្មាន / មិនទាន់ចាត់តាំង --' : '-- None / Unassigned --'}</option>
                        {newEmpGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} {g.description ? `(${g.description})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'មុខតំណែង (Position) *' : 'Position *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={empForm.role}
                        onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder="Senior Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ប្រភេទបុគ្គលិក (Employee type)' : 'Employee type'}
                      </label>
                      <select
                        value={empForm.employee_type}
                        onChange={(e) => setEmpForm({ ...empForm, employee_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)">{language === 'km' ? 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)' : 'Regular / Permanent'}</option>
                        <option value="បុគ្គលិកកិច្ចសន្យា (Contractual)">{language === 'km' ? 'បុគ្គលិកកិច្ចសន្យា (Contractual)' : 'Contractual'}</option>
                        <option value="បុគ្គលិកសាកល្បង (Probationary)">{language === 'km' ? 'បុគ្គលិកសាកល្បង (Probationary)' : 'Probationary'}</option>
                        <option value="កម្មសិក្សាការី (Internship)">{language === 'km' ? 'កម្មសិក្សាការី (Internship)' : 'Internship'}</option>
                        <option value="សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)">{language === 'km' ? 'សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)' : 'Board of Directors'}</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {language === 'km' ? 'ចូលបម្រើការ (Join Date)' : 'Join Date'}
                        </label>
                        {(() => {
                          const res = calculateSeniorityAllowanceFromDate(empForm.join_date);
                          return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono font-medium border border-indigo-200/60 dark:border-indigo-800/60">
                              {res.tenureLabel} → Seniority: ${res.allowance.toFixed(2)}/mo
                            </span>
                          );
                        })()}
                      </div>
                      <input
                        type="date"
                        value={empForm.join_date}
                        onChange={(e) => {
                          const newJoin = e.target.value;
                          const { allowance } = calculateSeniorityAllowanceFromDate(newJoin);
                          setEmpForm({
                            ...empForm,
                            join_date: newJoin,
                            seniority_bonus: String(allowance),
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ប្រភេទកិច្ចសន្យា (Contract Type)' : 'Contract Type'}
                      </label>
                      <select
                        value={empForm.contract_type}
                        onChange={(e) => setEmpForm({ ...empForm, contract_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="UDC (មិនកំណត់ថិរវេលា)">{language === 'km' ? 'UDC (មិនកំណត់ថិរវេលា)' : 'UDC (Undetermined Duration)'}</option>
                        <option value="FDC (កំណត់ថិរវេលា)">{language === 'km' ? 'FDC (កំណត់ថិរវេលា)' : 'FDC (Fixed Duration)'}</option>
                        <option value="Probation (សាកល្បង)">{language === 'km' ? 'Probation (សាកល្បង)' : 'Probation'}</option>
                        <option value="Internship (កម្មសិក្សា)">{language === 'km' ? 'Internship (កម្មសិក្សា)' : 'Internship'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'កាលបរិច្ឆេទចាប់ផ្តើមកិច្ចសន្យា (Contract start)' : 'Contract start'}
                      </label>
                      <input
                        type="date"
                        value={empForm.contract_start}
                        onChange={(e) => setEmpForm({ ...empForm, contract_start: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'កាលបរិច្ឆេទបញ្ចប់កិច្ចសន្យា (Contract end)' : 'Contract end'}
                      </label>
                      <input
                        type="date"
                        value={empForm.contract_end}
                        onChange={(e) => setEmpForm({ ...empForm, contract_end: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'អ្នកគ្រប់គ្រងផ្ទាល់ (Manager)' : 'Direct Manager'}
                      </label>
                      <select
                        value={empForm.manager_id}
                        onChange={(e) => setEmpForm({ ...empForm, manager_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">-- {language === 'km' ? 'គ្មានអ្នកគ្រប់គ្រងផ្ទាល់ / ថ្នាក់ដឹកនាំ' : 'None / Executive'} --</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {formatLocalizedText(m.first_name, language)} {formatLocalizedText(m.last_name, language)} ({formatLocalizedText(m.role || 'Colleague', language)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Work location
                      </label>
                      <input
                        type="text"
                        list="emp-work-location-options"
                        value={empForm.work_location}
                        onChange={(e) => setEmpForm({ ...empForm, work_location: sanitizeEnglishInput(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder="Head Office"
                      />
                      <datalist id="emp-work-location-options">
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
                </div>
              )}

              {/* TAB 4: SALARY & PAYROLL */}
              {activeStaffTab === 'payroll' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-bold">
                      <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ៤៖ ប្រាក់បៀវត្សរ៍ & ធនាគារ (Salary & Payroll)' : 'Section 4: Salary & Payroll'}</span>
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      {language === 'km' ? 'ជំហាន ៤ នៃ ៧' : 'Step 4 of 7'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ប្រាក់បៀវត្សរ៍គោល (Basic salary) *' : 'Basic salary *'}
                      </label>
                      <input
                        type="number"
                        required
                        value={empForm.salary}
                        onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="1200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'រូបិយប័ណ្ណ (Salary Currency)' : 'Salary Currency'}
                      </label>
                      <select
                        value={empForm.salary_currency}
                        onChange={(e) => setEmpForm({ ...empForm, salary_currency: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono cursor-pointer"
                      >
                        <option value="USD ($)">USD ($)</option>
                        <option value="KHR (៛)">{language === 'km' ? 'KHR (៛)' : 'KHR'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ភាពញឹកញាប់បើកប្រាក់ (Salary Frequency)' : 'Salary Frequency'}
                      </label>
                      <select
                        value={empForm.salary_frequency}
                        onChange={(e) => setEmpForm({ ...empForm, salary_frequency: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="កន្លះខែ (Semi-monthly)">{language === 'km' ? 'កន្លះខែ (Semi-monthly)' : 'Semi-monthly'}</option>
                        <option value="ប្រចាំខែ (Monthly)">{language === 'km' ? 'ប្រចាំខែ (Monthly)' : 'Monthly'}</option>
                        <option value="ប្រចាំសប្តាហ៍ (Weekly)">{language === 'km' ? 'ប្រចាំសប្តាហ៍ (Weekly)' : 'Weekly'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Pay Grade & Allowances */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {language === 'km' ? 'កម្រិតបៀវត្សរ៍ & ប្រាក់ឧបត្ថម្ភ (Pay Grade & Allowances)' : 'Pay Grade & Allowances'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {language === 'km' ? 'កញ្ចប់សរុប៖ ' : 'Total: '}
                        ${(
                          Number(empForm.salary || 0) +
                          Number(empForm.housing_transport_allowance ?? (Number(empForm.housing_allowance || 0) + Number(empForm.transport_allowance || 0))) +
                          Number(empForm.meal_allowance || 0) +
                          Number(empForm.skill_allowance || 0) +
                          Number(empForm.seniority_bonus || 0)
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {language === 'km' ? 'កម្រិតតួនាទី (Pay Grade)' : 'Pay Grade'}
                        </label>
                        <select
                          value={empForm.pay_grade}
                          onChange={(e) => setEmpForm({ ...empForm, pay_grade: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
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
                          value={empForm.meal_allowance}
                          onChange={(e) => setEmpForm({ ...empForm, meal_allowance: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
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
                          value={empForm.housing_transport_allowance ?? empForm.housing_allowance}
                          onChange={(e) => setEmpForm({ ...empForm, housing_transport_allowance: e.target.value, housing_allowance: e.target.value, transport_allowance: '0' })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
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
                          value={empForm.skill_allowance}
                          onChange={(e) => setEmpForm({ ...empForm, skill_allowance: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {language === 'km' ? 'ប្រាក់អតីតភាព (Seniority Allowance $)' : 'Seniority Allowance ($)'}
                          </label>
                          {(() => {
                            const res = calculateSeniorityAllowanceFromDate(empForm.join_date);
                            return (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                                ពីថ្ងៃចូលធ្វើការ: {res.tenureLabel} (${res.allowance.toFixed(2)})
                              </span>
                            );
                          })()}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={empForm.seniority_bonus !== undefined && empForm.seniority_bonus !== '' ? empForm.seniority_bonus : String(calculateSeniorityAllowanceFromDate(empForm.join_date).allowance)}
                            onChange={(e) => setEmpForm({ ...empForm, seniority_bonus: e.target.value })}
                            className="w-full pl-2.5 pr-14 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const res = calculateSeniorityAllowanceFromDate(empForm.join_date);
                              setEmpForm({ ...empForm, seniority_bonus: String(res.allowance) });
                            }}
                            className="absolute right-1 top-1 bottom-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[10px] font-semibold rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                            title={language === 'km' ? 'គណនាប្រាក់អតីតភាពស្វ័យប្រវត្តិពីថ្ងៃចូលធ្វើការ' : 'Auto-calculate Seniority Allowance based on Join Date'}
                          >
                            ⚡ Auto
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {language === 'km' ? 'គណនាដោយស្វ័យប្រវត្តិតាមកាលបរិច្ឆេទចូលបម្រើការ (Join Date)' : 'Auto-calculated from employment Join Date'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'km' ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                    </label>
                    <select
                      value={empForm.bank_name}
                      onChange={(e) => setEmpForm({ ...empForm, bank_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      {CAMBODIA_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {formatLocalizedText(b, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Account Name'}
                      </label>
                      <input
                        type="text"
                        value={empForm.bank_account_name}
                        onChange={(e) => setEmpForm({ ...empForm, bank_account_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase font-mono"
                        placeholder="CHAN THIDA"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'លេខគណនីធនាគារ (Account Number)' : 'Account Number'}
                      </label>
                      <input
                        type="text"
                        value={empForm.bank_account_number}
                        onChange={(e) => setEmpForm({ ...empForm, bank_account_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="001 234 567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NSSF INFORMATION */}
              {activeStaffTab === 'nssf' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 text-xs font-bold">
                      <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ៥៖ ព័ត៌មាន ប.ស.ស (NSSF Information)' : 'Section 5: NSSF Information'}</span>
                    </div>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      {language === 'km' ? 'ជំហាន ៥ នៃ ៧' : 'Step 5 of 7'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {language === 'km' ? 'សមាជិក ប.ស.ស (NSSF member)' : 'NSSF Member Status'}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'km'
                            ? 'កំណត់ការចូលរួមរបបសន្តិសុខសង្គម ហានិភ័យការងារ & ថែទាំសុខភាព'
                            : 'Enrollment in Cambodian Social Security scheme (Occupational risk & Healthcare)'}
                        </p>
                      </div>
                      <select
                        value={empForm.nssf_member}
                        onChange={(e) => setEmpForm({ ...empForm, nssf_member: e.target.value })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300"
                      >
                        <option value="មាន (Yes)">{language === 'km' ? 'មាន (Yes)' : 'Yes'}</option>
                        <option value="គ្មាន (No)">{language === 'km' ? 'គ្មាន (No)' : 'No'}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'km' ? 'លេខកាត ប.ស.ស (NSSF number)' : 'NSSF Number'}
                        </label>
                        <input
                          type="text"
                          value={empForm.nssf_number}
                          onChange={(e) => setEmpForm({ ...empForm, nssf_number: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                          placeholder="102938475"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'km' ? 'កាលបរិច្ឆេទចុះបញ្ជី (Registration Date)' : 'Registration Date'}
                        </label>
                        <input
                          type="date"
                          value={empForm.nssf_reg_date}
                          onChange={(e) => setEmpForm({ ...empForm, nssf_reg_date: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: EMERGENCY CONTACT */}
              {activeStaffTab === 'emergency' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 text-xs font-bold">
                      <HeartHandshake size={16} className="text-rose-600 dark:text-rose-400" />
                      <span>{language === 'km' ? 'ផ្នែកទី ៦៖ ទំនាក់ទំនងពេលមានអាសន្ន (Emergency Contact)' : 'Section 6: Emergency Contact'}</span>
                    </div>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                      {language === 'km' ? 'ជំហាន ៦ នៃ ៧' : 'Step 6 of 7'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ឈ្មោះអ្នកទំនាក់ទំនង (Contact name)' : 'Contact name'}
                      </label>
                      <input
                        type="text"
                        value={empForm.emergency_contact_name}
                        onChange={(e) => setEmpForm({ ...empForm, emergency_contact_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'សុខ វណ្ណា / Sok Vanna' : 'Sok Vanna'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'ត្រូវជា (Relationship)' : 'Relationship'}
                      </label>
                      <select
                        value={empForm.emergency_contact_relationship}
                        onChange={(e) => setEmpForm({ ...empForm, emergency_contact_relationship: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="ប្តី/ប្រពន្ធ (Spouse)">{language === 'km' ? 'ប្តី/ប្រពន្ធ (Spouse)' : 'Spouse'}</option>
                        <option value="ឪពុក/ម្តាយ (Parent)">{language === 'km' ? 'ឪពុក/ម្តាយ (Parent)' : 'Parent'}</option>
                        <option value="បងប្អូន (Sibling)">{language === 'km' ? 'បងប្អូន (Sibling)' : 'Sibling'}</option>
                        <option value="សាច់ញាតិ (Relative)">{language === 'km' ? 'សាច់ញាតិ (Relative)' : 'Relative'}</option>
                        <option value="មិត្តភក្តិ (Friend)">{language === 'km' ? 'មិត្តភក្តិ (Friend)' : 'Friend'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'លេខទូរស័ព្ទអាសន្ន (Phone)' : 'Emergency Phone'}
                      </label>
                      <input
                        type="text"
                        value={empForm.emergency_contact_phone}
                        onChange={(e) => setEmpForm({ ...empForm, emergency_contact_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        placeholder="+855 92 888 777"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'km' ? 'អាសយដ្ឋាន (address)' : 'Address'}
                      </label>
                      <input
                        type="text"
                        value={empForm.emergency_contact_address}
                        onChange={(e) => setEmpForm({ ...empForm, emergency_contact_address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder={language === 'km' ? 'រាជធានីភ្នំពេញ / Phnom Penh' : 'Phnom Penh'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: DOCUMENTS */}
              {activeStaffTab === 'documents' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                      <FolderOpen size={16} className="text-indigo-600" />
                      <span>{language === 'km' ? 'ផ្នែកទី ៧៖ ឯកសារ & រូបថតបុគ្គលិក (Documents & Staff Photo)' : 'Section 7: Documents & Staff Photo'}</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      {language === 'km' ? 'ជំហាន ៧ នៃ ៧' : 'Step 7 of 7'}
                    </span>
                  </div>

                  {/* Profile Photo Upload Section - NO URL/LINKS */}
                  <div className="p-5 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Camera size={15} className="text-indigo-600 dark:text-indigo-400" />
                          <span>{language === 'km' ? 'រូបថតបុគ្គលិក (Employee Photo)' : 'Employee Photo'}</span>
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'km'
                            ? 'ផ្ទុករូបថតបុគ្គលិកពីឧបករណ៍/កុំព្យូទ័ររបស់អ្នក (JPG, PNG, WEBP)'
                            : 'Upload photo directly from your device (JPG, PNG, WEBP)'}
                        </p>
                      </div>
                      {empForm.avatar ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/60 dark:border-emerald-800">
                          <Check size={12} /> {language === 'km' ? 'បានផ្ទុករួចរាល់' : 'Uploaded'}
                        </span>
                      ) : null}
                    </div>

                    {empForm.avatar ? (
                      /* Uploaded Photo Preview Card */
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                        <div className="relative group shrink-0">
                          <img
                            src={empForm.avatar}
                            alt="Employee Photo Preview"
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title={language === 'km' ? 'ផ្លាស់ប្តូររូបថត' : 'Change Photo'}
                          >
                            <Camera size={22} />
                          </button>
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                            {empForm.first_name || empForm.last_name
                              ? `${empForm.first_name} ${empForm.last_name}`
                              : (language === 'km' ? 'រូបថតបុគ្គលិកដែលបានជ្រើសរើស' : 'Selected Staff Photo')}
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
                                setEmpForm((prev) => ({ ...prev, avatar: '' }));
                                if (avatarInputRef.current) avatarInputRef.current.value = '';
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                            >
                              <Trash2 size={13} />
                              <span>{language === 'km' ? 'លុបរូបថត' : 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Photo Upload Box */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAvatar(true);
                        }}
                        onDragLeave={() => setIsDraggingAvatar(false)}
                        onDrop={handleAvatarDrop}
                        onClick={() => avatarInputRef.current?.click()}
                        className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                          isDraggingAvatar
                            ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-4 ring-indigo-500/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-2xs">
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

                  {/* Document Attachments */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                      {language === 'km' ? 'ឯកសារផ្លូវការភ្ជាប់មកជាមួយ (Attached Documents)' : 'Attached Official Documents'}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Doc 1: National ID */}
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <IdCard size={14} className="text-indigo-600 dark:text-indigo-400" />
                            {language === 'km' ? 'ច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណ' : 'National ID'}
                          </span>
                          {empForm.doc_national_id && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Attached
                            </span>
                          )}
                        </div>
                        <input
                          ref={docIdInputRef}
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleDocUpload('doc_national_id', e)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={empForm.doc_national_id}
                            onChange={(e) => setEmpForm({ ...empForm, doc_national_id: e.target.value })}
                            placeholder="National_ID_Card.pdf"
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => docIdInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Upload document"
                          >
                            <Upload size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Doc 2: Passport */}
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                            {language === 'km' ? 'លិខិតឆ្លងដែន' : 'Passport'}
                          </span>
                          {empForm.doc_passport && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Attached
                            </span>
                          )}
                        </div>
                        <input
                          ref={docPassportInputRef}
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleDocUpload('doc_passport', e)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={empForm.doc_passport}
                            onChange={(e) => setEmpForm({ ...empForm, doc_passport: e.target.value })}
                            placeholder="Passport_Scan.pdf"
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => docPassportInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Upload passport"
                          >
                            <Upload size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Doc 3: Employee Contract */}
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <FileCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                            {language === 'km' ? 'កិច្ចសន្យាការងារ' : 'Employee Contract'}
                          </span>
                          {empForm.doc_contract && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Attached
                            </span>
                          )}
                        </div>
                        <input
                          ref={docContractInputRef}
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleDocUpload('doc_contract', e)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={empForm.doc_contract}
                            onChange={(e) => setEmpForm({ ...empForm, doc_contract: e.target.value })}
                            placeholder="Employment_Contract_Signed.pdf"
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => docContractInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Upload contract"
                          >
                            <Upload size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Doc 4: Other Documents */}
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <FolderOpen size={14} className="text-amber-600 dark:text-amber-400" />
                            {language === 'km' ? 'ឯកសារផ្សេងៗ' : 'Other Documents'}
                          </span>
                          {empForm.doc_others && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Attached
                            </span>
                          )}
                        </div>
                        <input
                          ref={docOthersInputRef}
                          type="file"
                          accept=".pdf,image/*,.doc,.docx,.zip"
                          className="hidden"
                          onChange={(e) => handleDocUpload('doc_others', e)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={empForm.doc_others}
                            onChange={(e) => setEmpForm({ ...empForm, doc_others: e.target.value })}
                            placeholder="Degrees_Certificates.zip"
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => docOthersInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Upload other documents"
                          >
                            <Upload size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stepper Footer Controls */}
              <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  {activeStaffTab !== 'personal' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: AddStaffTab[] = ['personal', 'contact', 'employment', 'payroll', 'nssf', 'emergency', 'documents'];
                        const idx = tabs.indexOf(activeStaffTab);
                        if (idx > 0) setActiveStaffTab(tabs[idx - 1]);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} /> <span>{language === 'km' ? 'ថយក្រោយ' : 'Previous'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
                  </button>

                  {activeStaffTab !== 'documents' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: AddStaffTab[] = ['personal', 'contact', 'employment', 'payroll', 'nssf', 'emergency', 'documents'];
                        const idx = tabs.indexOf(activeStaffTab);
                        if (idx < tabs.length - 1) setActiveStaffTab(tabs[idx + 1]);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{language === 'km' ? 'បន្ទាប់' : 'Next Step'}</span> <ChevronRight size={14} />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleAddEmployee()}
                    disabled={loading}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check size={15} />
                    <span>{loading ? (language === 'km' ? 'កំពុងបញ្ចូល...' : 'Saving...') : (language === 'km' ? 'រក្សាទុក & បញ្ចូលបុគ្គលិក' : 'Complete Registration')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. REQUEST LEAVE FORM */}
          {activeModal === 'request-leave' && (
            <form onSubmit={handleRequestLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ប្រភេទច្បាប់ (Leave Type)' : 'Leave Type'}
                </label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Annual">{language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ (Annual Leave - 18 ថ្ងៃ/ឆ្នាំ)' : 'Annual Leave (18 days/year)'}</option>
                  <option value="Sick">{language === 'km' ? 'ច្បាប់ឈឺ (Sick Leave - មានវេជ្ជបញ្ជា)' : 'Sick Leave (Medical Certificate)'}</option>
                  <option value="Casual">{language === 'km' ? 'ច្បាប់ធុរៈផ្ទាល់ខ្លួន (Casual / Family Leave)' : 'Casual / Family Leave'}</option>
                  <option value="Maternity/Paternity">{language === 'km' ? 'ច្បាប់លំហែមាតុភាព/បិតុភាព (Maternity / Paternity)' : 'Maternity / Paternity'}</option>
                  <option value="Unpaid">{language === 'km' ? 'ឈប់សម្រាកគ្មានប្រាក់ឈ្នួល (Unpaid Leave)' : 'Unpaid Leave'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ថ្ងៃចាប់ផ្តើម (Start Date)' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ថ្ងៃបញ្ចប់ (End Date)' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'មូលហេតុ / សេចក្តីលម្អិត (Reason)' : 'Reason / Details'}
                </label>
                <textarea
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder={language === 'km' ? 'ធុរៈគ្រួសារ, ទៅស្រុកកំណើត, ពិនិត្យសុខភាព...' : 'Personal matters, family travel, health checkup...'}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>{language === 'km' ? 'ស្នើសុំដោយ៖ ' : 'Requested by: '}<strong>{formatLocalizedText(currentPersona.name, language)}</strong></span>
                <span className="font-semibold text-amber-900">
                  {language === 'km' ? 'ការអនុម័តស្តង់ដារ៖ ក្នុងរង្វង់ ២៤ ម៉ោង' : 'Standard SLA: within 24 hours'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30"
                >
                  {loading ? (language === 'km' ? 'កំពុងផ្ញើ...' : 'Submitting...') : (language === 'km' ? 'ដាក់ពាក្យស្នើសុំច្បាប់' : 'Submit Leave Request')}
                </button>
              </div>
            </form>
          )}

          {/* 3. POST JOB FORM */}
          {activeModal === 'post-job' && (
            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'មុខតំណែងជ្រើសរើស (Job Title) *' : 'Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Senior Mobile Developer (Flutter / React Native)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'នាយកដ្ឋាន (Department)' : 'Department'}
                  </label>
                  <select
                    value={jobForm.department_id}
                    onChange={(e) => setJobForm({ ...jobForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {formatLocalizedText(d.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ទីតាំង (Location)' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={language === 'km' ? 'រាជធានីភ្នំពេញ / RGPPSEZ' : 'Phnom Penh / RGPPSEZ'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'បទពិសោធន៍ (Experience)' : 'Experience'}
                  </label>
                  <input
                    type="text"
                    value={jobForm.experience_level}
                    onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={language === 'km' ? 'កម្រិតមធ្យម / ៣+ ឆ្នាំ' : 'Mid-Level / 3+ Years'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'កម្រិតប្រាក់បៀវត្សរ៍ (Salary Range)' : 'Salary Range'}
                  </label>
                  <input
                    type="text"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={language === 'km' ? '$1,200 - $2,000 / ខែ' : '$1,200 - $2,000 / month'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ការពិពណ៌នាការងារ (Job Description)' : 'Job Description'}
                </label>
                <textarea
                  rows={2}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder={language === 'km' ? 'ការទទួលខុសត្រូវ និងគោលដៅចម្បងនៃតួនាទី...' : 'Key responsibilities and goals for this role...'}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30"
                >
                  {loading ? (language === 'km' ? 'កំពុងផ្សាយ...' : 'Publishing...') : (language === 'km' ? 'ប្រកាសដំណឹងការងារ' : 'Post Job Opening')}
                </button>
              </div>
            </form>
          )}

          {/* 4. POST ANNOUNCEMENT FORM */}
          {activeModal === 'post-announcement' && (
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ចំណងជើងសេចក្តីជូនដំណឹង (Title) *' : 'Announcement Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder={language === 'km' ? 'សេចក្តីជូនដំណឹងស្តីពី ឈប់សម្រាកបុណ្យអុំទូក ឬគោលការណ៍ថ្មី...' : 'Holiday schedule, company memo, or policy update...'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ប្រភេទទូទៅ (Category)' : 'Category'}
                </label>
                <select
                  value={annForm.category}
                  onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="General">{language === 'km' ? 'សេចក្តីជូនដំណឹងទូទៅ (General)' : 'General Notice'}</option>
                  <option value="Policy">{language === 'km' ? 'គោលការណ៍ & ច្បាប់ការងារ (Policy)' : 'Policy & Labor Law'}</option>
                  <option value="Celebration">{language === 'km' ? 'កម្មវិធីអបអរ & អត្ថប្រយោជន៍ (Celebration)' : 'Celebration & Perks'}</option>
                  <option value="Urgent">{language === 'km' ? 'ដំណឹងបន្ទាន់ / សំខាន់ (Urgent)' : 'Urgent Notice'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ខ្លឹមសារលម្អិត (Content) *' : 'Detailed Content *'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder={language === 'km' ? 'ចែករំលែកព័ត៌មានលម្អិតជូនបុគ្គលិកទាំងអស់...' : 'Share comprehensive update with all staff members...'}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={annForm.pinned}
                  onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  {language === 'km' ? 'ខ្ទាស់សេចក្តីជូនដំណឹងនេះនៅខាងលើគេ (Pin Announcement)' : 'Pin this announcement to top of notice board'}
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30"
                >
                  {loading ? (language === 'km' ? 'កំពុងផ្សាយ...' : 'Publishing...') : (language === 'km' ? 'ផ្សាយសេចក្តីជូនដំណឹង' : 'Broadcast Announcement')}
                </button>
              </div>
            </form>
          )}

          {/* 5. RUN PAYROLL FORM */}
          {activeModal === 'run-payroll' && (
            <form onSubmit={handleRunPayroll} className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <Check size={16} /> {language === 'km' ? 'គណនាប្រាក់បៀវត្សរ៍ & បង់វិភាគទាន ប.ស.ស (NSSF Automated Payroll)' : 'Automated Payroll & Statutory Deductions (NSSF)'}
                </div>
                <p>
                  {language === 'km'
                    ? 'ប្រព័ន្ធនឹងគណនាប្រាក់ខែមូលដ្ឋាន, ប្រាក់ឧបត្ថម្ភការងារ, ប្រាក់រង្វាន់, កាត់កងវិភាគទាន ប.ស.ស (បេឡាជាតិសន្តិសុខសង្គម) តាមច្បាប់ការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងពន្ធលើប្រាក់បៀវត្សរ៍ជូនបុគ្គលិកទាំងអស់។'
                    : 'The system will calculate gross earnings, seniority allowances, attendance bonuses, statutory Cambodian NSSF contributions, and salary withholding tax for all active staff.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ខែបើកបៀវត្សរ៍ (Pay Period)' : 'Pay Period'}
                  </label>
                  <input
                    type="text"
                    required
                    value={payrollForm.period}
                    onChange={(e) => setPayrollForm({ ...payrollForm, period: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទបើកប្រាក់ (Disbursement Date)' : 'Disbursement Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={payrollForm.payment_date}
                    onChange={(e) => setPayrollForm({ ...payrollForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30"
                >
                  {loading ? (language === 'km' ? 'កំពុងដំណើរការ...' : 'Processing...') : (language === 'km' ? 'យល់ព្រមដំណើរការបើកប្រាក់ខែ' : 'Approve & Execute Payroll')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
