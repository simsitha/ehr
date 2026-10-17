'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText } from '@/lib/translations';
import {
  UserCheck,
  Clock,
  ScanFace,
  Timer,
  CalendarCheck,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Printer,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  KeyRound,
  Package,
  FileCheck2,
  Laptop,
  ShieldCheck,
  HeartPulse,
  Pill,
} from 'lucide-react';
import NewStaffRequestModal from '@/components/NewStaffRequestModal';

interface StaffPayslip {
  id: string;
  period: string;
  payment_date: string;
  base_salary: number;
  allowances: number;
  monthly_eval_bonus?: number;
  severance_pay?: number;
  nssf_deduction: number;
  tax_deduction: number;
  net_salary: number;
}

export default function StaffPortalPage() {
  const { currentPersona, language, t, isClockedIn, clockInTime, toggleClock, openFaceInModal, openModal, showToast } = useApp();

  const [activePayslipModal, setActivePayslipModal] = useState<StaffPayslip | null>(null);
  const [isRestrictedAccess, setIsRestrictedAccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('restricted') === '1') {
        setIsRestrictedAccess(true);
      }
    }
  }, []);

  const [staffData, setStaffData] = useState({
    name: currentPersona.name,
    role: currentPersona.title || (currentPersona.role === 'Admin' ? 'System Administrator' : 'Staff Member'),
    empId: currentPersona.id.toUpperCase(),
    email: currentPersona.email || '',
    department: 'General Department',
    location: 'Phnom Penh Office',
    joinDate: '-',
    phone: '-',
    managerName: '-',
    managerRole: '-',
    managerEmail: '-',
  });

  const [leaveBalances, setLeaveBalances] = useState({
    annual: { total: 0, used: 0, remaining: 0 },
    sick: { total: 0, used: 0, remaining: 0 },
    casual: { total: 0, used: 0, remaining: 0 },
  });

  const [myLeaveHistory, setMyLeaveHistory] = useState<any[]>([]);

  const [myPayslips, setMyPayslips] = useState<StaffPayslip[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myMedicalRecords, setMyMedicalRecords] = useState<any[]>([]);
  const [myMedicines, setMyMedicines] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    async function loadEmployeeProfile() {
      try {
        let empId = currentPersona.id;
        // If currentPersona id starts with usr-, look up corresponding employee by email
        if (empId.startsWith('usr-')) {
          const empRes = await fetch('/api/employees');
          const allEmps = await empRes.json();
          if (Array.isArray(allEmps)) {
            const match = allEmps.find(
              (e: any) => e.email.toLowerCase() === currentPersona.email.toLowerCase()
            );
            if (match) empId = match.id;
          }
        }

        const res = await fetch(`/api/employees/${empId}`);
        if (res.ok) {
          const data = await res.json();
          const emp = data.employee;
          if (emp) {
            setStaffData({
              name: `${emp.first_name} ${emp.last_name}`,
              role: emp.role || currentPersona.title,
              empId: emp.id.toUpperCase(),
              email: emp.email,
              department: emp.department_name || (language === 'km' ? 'ផ្នែកទូទៅ' : 'General Department'),
              location: emp.location || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh Office'),
              joinDate: emp.join_date || '-',
              phone: emp.phone || '-',
              managerName: emp.manager_name || (language === 'km' ? 'គ្មានប្រធានផ្ទាល់' : 'None / Executive'),
              managerRole: emp.manager_name
                ? (language === 'km' ? 'ប្រធានផ្នែក (Department Head)' : 'Department Head')
                : (language === 'km' ? 'ថ្នាក់ដឹកនាំ' : 'Executive'),
              managerEmail: emp.manager_email || '-',
            });
          }

          if (data.leaveBalance) {
            setLeaveBalances({
              annual: {
                total: data.leaveBalance.annual_total,
                used: data.leaveBalance.annual_used,
                remaining: Math.max(0, data.leaveBalance.annual_total - data.leaveBalance.annual_used),
              },
              sick: {
                total: data.leaveBalance.sick_total,
                used: data.leaveBalance.sick_used,
                remaining: Math.max(0, data.leaveBalance.sick_total - data.leaveBalance.sick_used),
              },
              casual: {
                total: data.leaveBalance.casual_total,
                used: data.leaveBalance.casual_used,
                remaining: Math.max(0, data.leaveBalance.casual_total - data.leaveBalance.casual_used),
              },
            });
          }

          setMyLeaveHistory(
            Array.isArray(data.leaves)
              ? data.leaves.map((l: any) => ({
                  id: l.id,
                  type: language === 'km' ? `${l.leave_type} Leave (ច្បាប់${l.leave_type === 'Annual' ? 'ប្រចាំឆ្នាំ' : l.leave_type === 'Sick' ? 'ឈឺ' : 'ធុរៈ'})` : `${l.leave_type} Leave`,
                  startDate: l.start_date,
                  endDate: l.end_date,
                  days: l.days_count,
                  reason: l.reason,
                  status: l.status,
                  reviewer: l.reviewer_name || (language === 'km' ? 'ប្រធានផ្នែក' : 'Line Manager'),
                }))
              : []
          );

          setMyPayslips(
            Array.isArray(data.payrolls)
              ? data.payrolls.map((p: any) => ({
                  id: p.id,
                  period: p.pay_period,
                  payment_date: p.payment_date,
                  base_salary: p.base_salary,
                  allowances: p.allowances,
                  monthly_eval_bonus: p.monthly_eval_bonus || 0,
                  severance_pay: p.severance_pay || 0,
                  nssf_deduction: p.insurance_deduction || 5.85,
                  tax_deduction: p.tax_deduction,
                  net_salary: p.net_salary,
                }))
              : []
          );

          if (Array.isArray(data.medicalRecords)) setMyMedicalRecords(data.medicalRecords);
          if (Array.isArray(data.medicineIssuances)) setMyMedicines(data.medicineIssuances);
        }

        // Also load staff member's approval requests
        try {
          const reqRes = await fetch(`/api/requests?employee_id=${empId}`);
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            if (Array.isArray(reqData)) setMyRequests(reqData);
          }
        } catch {}
      } catch (err) {
        console.error('Error loading employee profile in portal:', err);
      }
    }

    loadEmployeeProfile();
  }, [currentPersona]);

  return (
    <div className="space-y-6">
      {/* RESTRICTED ACCESS NOTICE BANNER */}
      {isRestrictedAccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-in fade-in duration-200 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wide text-amber-900 flex items-center gap-1.5">
                <span>{language === 'km' ? 'សិទ្ធិប្រើប្រាស់មានកម្រិត (Limited Employee Access)' : 'Limited Employee Access Notice'}</span>
              </h4>
              <button
                onClick={() => setIsRestrictedAccess(false)}
                className="text-amber-500 hover:text-amber-800 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className={`text-xs mt-1 leading-relaxed text-amber-800 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? 'គណនីរបស់អ្នកជាបុគ្គលិកទូទៅ (Employee Role) ដែលត្រូវបានកំណត់ឱ្យប្រើប្រាស់ត្រឹមតែ មុខងារស្វ័យសេវាបុគ្គលិក (Employee Self-Service) ប៉ុណ្ណោះ។ ផ្នែករដ្ឋបាល បៀវត្សរ៍ក្រុមហ៊ុន និងការគ្រប់គ្រងត្រូវបានការពារ។'
                : 'Your account is assigned the standard Employee role with limited self-service permissions. Company-wide administrative and management modules are restricted.'}
            </p>
          </div>
        </div>
      )}

      {/* 1. HEADER & BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck size={16} />
            <span>{language === 'km' ? 'ផតថលបុគ្គលិកស្វ័យសេវា (Employee Self-Service)' : 'Employee Self-Service (ESS)'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {language === 'km' ? 'កន្លែងធ្វើការផ្ទាល់ខ្លួន (My Workspace)' : 'My Staff Workspace'}
          </h1>
          <p className={`text-xs text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km'
              ? 'គ្រប់គ្រងវត្តមានផ្ទាល់ខ្លួន ស្នើសុំច្បាប់ឈប់សម្រាក ពិនិត្យប័ណ្ណបើកប្រាក់បៀវត្សរ៍ និងទាក់ទងប្រធានផ្នែក។'
              : 'Punch attendance, request leaves, download official payslips, and check company announcements.'}
          </p>
        </div>

        {/* Quick actions dock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Package size={15} />
            <span>{language === 'km' ? 'ស្នើសុំសម្ភារៈ/បៀវត្សរ៍' : 'Request Material/Salary'}</span>
          </button>

          <button
            onClick={() => openModal('request-leave')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <CalendarCheck size={15} />
            <span>{language === 'km' ? 'ស្នើសុំច្បាប់សម្រាក' : 'Request Time Off'}</span>
          </button>

          <Link
            href="/attendance"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Clock size={15} className="text-emerald-600" />
            <span>{language === 'km' ? 'របាយការណ៍វត្តមាន' : 'Attendance Report'}</span>
          </Link>

          <Link
            href="/overtime"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Timer size={15} className="text-indigo-600" />
            <span>{language === 'km' ? 'ម៉ោងបន្ថែម (Overtime)' : 'My Overtime'}</span>
          </Link>

          <button
            onClick={() => showToast(language === 'km' ? 'សំណើសុំលិខិតបញ្ជាក់ការងារត្រូវបានផ្ញើទៅកាន់ផ្នែកធនធានមនុស្សរួចរាល់' : 'Employment verification request sent to HR Department', 'info')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <FileText size={15} className="text-indigo-600" />
            <span>{language === 'km' ? 'ស្នើសុំលិខិតបញ្ជាក់' : 'Request HR Letter'}</span>
          </button>
        </div>
      </div>

      {/* 2. TOP HERO BENTO: DIGITAL ID & CLOCKING STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Digital Employee ID Badge (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <img
              src={currentPersona.avatar}
              alt={currentPersona.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-indigo-100 shadow-sm shrink-0"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-base sm:text-lg font-black text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {formatLocalizedText(staffData.name, language)}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {staffData.empId}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentPersona.role}
                </span>
                <button
                  type="button"
                  onClick={() => openModal('change-password')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                  title={language === 'km' ? 'ប្តូរពាក្យសម្ងាត់' : 'Change Password'}
                >
                  <KeyRound size={11} className="text-indigo-600" />
                  <span>{language === 'km' ? 'ប្តូរពាក្យសម្ងាត់' : 'Change Password'}</span>
                </button>
              </div>
              <p className={`text-xs font-semibold text-slate-600 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(staffData.role, language)}</p>
              <p className={`text-[11px] text-slate-400 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(staffData.department, language)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate text-[11px] font-mono">{staffData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="text-[11px] font-mono">{staffData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="text-[11px] truncate">{formatLocalizedText(staffData.location, language)}</span>
            </div>
          </div>
        </div>

        {/* Live Attendance Punch Card (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                {language === 'km' ? 'កត់ត្រាវត្តមានផ្ទាល់ខ្លួន' : 'Personal Attendance Punch'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isClockedIn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
                {isClockedIn ? (language === 'km' ? 'កំពុងធ្វើការ (Clocked In)' : 'Active On Duty') : (language === 'km' ? 'មិនទាន់កត់ត្រាចូល (Not Clocked In)' : 'Not Clocked In')}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                {isClockedIn ? (clockInTime || '08:30:00 AM') : '--:--:--'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isClockedIn
                  ? (language === 'km' ? 'ម៉ោងកត់ត្រាចូលថ្ងៃនេះ (Timesheet Logged)' : 'Clocked in today at office')
                  : (language === 'km' ? 'មិនទាន់កត់ត្រាវត្តមានចូលនៅឡើយ (សូមចុចកត់ត្រាចូលដោយដៃ)' : 'Not clocked in yet today (Click button to clock in manually)')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={openFaceInModal}
              className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                isClockedIn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <ScanFace size={16} />
              <span>{isClockedIn ? (language === 'km' ? 'ស្កេនមុខចេញ (Face Out)' : 'Face Out Now') : (language === 'km' ? 'ស្កេនមុខចូល (Face In)' : 'Face In Now')}</span>
            </button>

            <Link
              href="/attendance"
              className="text-[11px] font-semibold text-indigo-300 hover:text-white underline-offset-4 hover:underline flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <span>{language === 'km' ? 'របាយការណ៍វត្តមាន' : 'Attendance Report'}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. LEAVE BALANCES RADAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Annual Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)' : 'Annual Leave'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {leaveBalances.annual.remaining} {language === 'km' ? 'ថ្ងៃនៅសល់' : 'days left'}
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {leaveBalances.annual.remaining} <span className="text-xs text-slate-400 font-sans">/ {leaveBalances.annual.total} {language === 'km' ? 'ថ្ងៃ' : 'days'}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${(leaveBalances.annual.remaining / leaveBalances.annual.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>{language === 'km' ? `បានប្រើ៖ ${leaveBalances.annual.used} ថ្ងៃ` : `Used: ${leaveBalances.annual.used} days`}</span>
            <span className="text-indigo-600 font-bold cursor-pointer" onClick={() => openModal('request-leave')}>
              {language === 'km' ? '+ ស្នើសុំ' : '+ Request'}
            </span>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ច្បាប់ឈឺ (Sick Leave)' : 'Sick Leave'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              {leaveBalances.sick.remaining} {language === 'km' ? 'ថ្ងៃនៅសល់' : 'days left'}
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {leaveBalances.sick.remaining} <span className="text-xs text-slate-400 font-sans">/ {leaveBalances.sick.total} {language === 'km' ? 'ថ្ងៃ' : 'days'}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(leaveBalances.sick.remaining / leaveBalances.sick.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>{language === 'km' ? `បានប្រើ៖ ${leaveBalances.sick.used} ថ្ងៃ` : `Used: ${leaveBalances.sick.used} days`}</span>
            <span>{language === 'km' ? 'មានវិញ្ញាបនបត្រពេទ្យ' : 'Medical cert'}</span>
          </div>
        </div>

        {/* Casual Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ច្បាប់ធុរៈ (Casual Leave)' : 'Casual Leave'}
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {leaveBalances.casual.remaining} {language === 'km' ? 'ថ្ងៃនៅសល់' : 'days left'}
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {leaveBalances.casual.remaining} <span className="text-xs text-slate-400 font-sans">/ {leaveBalances.casual.total} {language === 'km' ? 'ថ្ងៃ' : 'days'}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(leaveBalances.casual.remaining / leaveBalances.casual.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>{language === 'km' ? `បានប្រើ៖ ${leaveBalances.casual.used} ថ្ងៃ` : `Used: ${leaveBalances.casual.used} days`}</span>
            <span>{language === 'km' ? 'ធុរៈបន្ទាន់ផ្ទាល់ខ្លួន' : 'Personal matters'}</span>
          </div>
        </div>
      </div>

      {/* 4. MY LEAVE REQUESTS & RECENT PAYSLIPS DUAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: My Leave Requests History (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck size={17} className="text-indigo-600" />
                <span>{language === 'km' ? 'ប្រវត្តិនៃការសុំច្បាប់ឈប់សម្រាក' : 'My Leave Requests History'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'km' ? 'តាមដានស្ថានភាពការអនុម័តពីប្រធានផ្នែក' : 'Review status and manager comments'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/leaves"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                {language === 'km' ? 'ទំព័រច្បាប់' : 'Leaves Page'} &rarr;
              </Link>
              <button
                onClick={() => openModal('request-leave')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'km' ? '+ ស្នើសុំថ្មី' : '+ New Request'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{language === 'km' ? 'ប្រភេទច្បាប់ (Type)' : 'Leave Type'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'កាលបរិច្ឆេទ (Dates)' : 'Dates'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'ចំនួន' : 'Days'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'ស្ថានភាព (Status)' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {myLeaveHistory.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{formatLocalizedText(req.type, language)}</span>
                      <span className="text-[11px] text-slate-400">{formatLocalizedText(req.reason, language)}</span>
                    </td>
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      {req.startDate} {language === 'km' ? 'ដល់' : 'to'} {req.endDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {req.days} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'Pending Admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status === 'Approved'
                          ? (language === 'km' ? '✓ បានអនុម័តពេញលេញ' : '✓ Approved')
                          : req.status === 'Pending Admin'
                          ? (language === 'km' ? '⏳ ជំហាន ២/២: រង់ចាំរដ្ឋបាល (Admin)' : '⏳ Step 2/2: Awaiting Admin')
                          : req.status === 'Rejected'
                          ? (language === 'km' ? '✕ បានបដិសេធ' : '✕ Rejected')
                          : (language === 'km' ? '⏳ ជំហាន ១/២: រង់ចាំប្រធានផ្នែក' : '⏳ Step 1/2: Awaiting Manager')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: My Official Payslips (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={17} className="text-emerald-600" />
                  <span>{language === 'km' ? 'ប័ណ្ណបើកប្រាក់បៀវត្សរ៍ (Payslips)' : 'My Digital Payslips'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'km' ? 'មើល និងទាញយកប័ណ្ណបើកប្រាក់ផ្លូវការ' : 'View, verify, and print official slips'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {myPayslips.map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className={`font-bold text-xs text-slate-900 block ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(pay.period, language)}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {language === 'km' ? `បើកថ្ងៃ៖ ${pay.payment_date}` : `Paid: ${pay.payment_date}`}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600 font-mono block">
                      ${pay.net_salary.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setActivePayslipModal(pay)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer mt-0.5"
                    >
                      <span>{language === 'km' ? 'មើលប័ណ្ណ' : 'View Slip'}</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'km' ? 'គណនីធនាគារ៖ ABA Bank (002 918 288)' : 'Bank Account: ABA Bank (002 918 288)'}</span>
            <span className="font-bold text-emerald-600">{language === 'km' ? '✓ ផ្ទៀងផ្ទាត់រួច' : '✓ Verified'}</span>
          </div>
        </div>
      </div>

      {/* 5. MY REQUISITIONS & MULTI-TIER APPROVALS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-0.5">
              <FileCheck2 size={15} />
              <span>{language === 'km' ? 'សំណើសម្ភារៈ & បៀវត្សរ៍ (Requisitions)' : 'Equipment & Salary Requisitions'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              {language === 'km' ? 'សំណើ & ការអនុម័តពហុថ្នាក់របស់ខ្ញុំ' : 'My Requisitions & Approval Pipeline'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Package size={14} />
              <span>{language === 'km' ? '+ ស្នើសុំថ្មី' : '+ New Request'}</span>
            </button>

            <Link
              href="/requests"
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span>{language === 'km' ? 'មើលទាំងអស់' : 'View All'}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {language === 'km' ? 'មិនទាន់មានសំណើសម្ភារៈ ឬបៀវត្សរ៍ទេ' : 'No material or salary requests submitted yet'}
            </p>
            <p className={`text-[11px] text-slate-500 max-w-sm mx-auto ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? 'អ្នកអាចស្នើសុំកុំព្យូទ័រ Laptop បរិក្ខារការិយាល័យ ឬស្នើសុំដំឡើងបៀវត្សរ៍ដោយផ្ទាល់ពីទីនេះ។'
                : 'You can submit requests for laptops, desktop workstations, office supplies, or salary adjustment directly.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req: any) => {
              const isHighValue = req.requires_top_management === 1;
              const isSalary = req.request_type === 'Salary Increase' || req.item_category === 'salary_increase';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50/50 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                        {isSalary ? (
                          <DollarSign size={16} />
                        ) : req.item_name.toLowerCase().includes('laptop') ? (
                          <Laptop size={16} />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {req.request_number}
                          </span>
                          <h4 className="text-xs font-black text-slate-900">{req.item_name}</h4>
                          {isHighValue ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Top Mgmt Required
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                              HR Final
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] text-slate-500 mt-0.5 line-clamp-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                          {req.reason}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : req.status === 'Pending Top Management'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : req.status === 'Pending HR'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Multi-Tier Timeline Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[10px]">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        req.line_manager_status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                          : req.line_manager_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                          : 'bg-blue-50 text-blue-800 border-blue-200 font-bold'
                      }`}
                    >
                      <span>1. Manager: {req.line_manager_status}</span>
                    </div>

                    <div
                      className={`p-1.5 rounded-lg border ${
                        req.hr_status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                          : req.hr_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                          : 'bg-purple-50 text-purple-800 border-purple-200 font-bold'
                      }`}
                    >
                      <span>2. HR: {req.hr_status} {!isHighValue && '(Final)'}</span>
                    </div>

                    <div
                      className={`p-1.5 rounded-lg border ${
                        !isHighValue
                          ? 'bg-slate-100 text-slate-400 border-slate-200'
                          : req.top_management_status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                          : req.top_management_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                          : 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                      }`}
                    >
                      <span>
                        {!isHighValue ? '3. CEO: N/A' : `3. CEO: ${req.top_management_status}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5.5 HEALTH & MEDICAL: MY CLINIC VISITS & PRESCRIPTIONS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartPulse size={18} />
            </div>
            <div>
              <h3 className={`text-sm font-bold text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {language === 'km' ? 'សុខភាព & វេជ្ជសាស្ត្ររបស់ខ្ញុំ' : 'My Health & Clinic Records'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'km' ? 'ប្រវត្តិនៃការពិនិត្យព្យាបាល ថ្នាំពេទ្យ និងច្បាប់ឈឺ' : 'Your on-site occupational clinic consultations and prescriptions'}
              </p>
            </div>
          </div>

          <Link
            href="/medical"
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <span>{language === 'km' ? 'ចូលទៅមជ្ឈមណ្ឌលសុខភាព' : 'Open Medical Portal'}</span>
            <ExternalLink size={13} />
          </Link>
        </div>

        {myMedicalRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <HeartPulse size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">
              {language === 'km' ? 'មិនមានកំណត់ត្រាពិនិត្យជំងឺទេ' : 'No personal clinic consultation records logged.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'km' ? 'ទស្សនាគ្លីនិកការងាររបស់ Hestra ប្រសិនបើអ្នកមានអារម្មណ៍មិនស្រួលខ្លួន' : 'Visit the on-site clinic if you feel unwell during your work shift.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myMedicalRecords.map((r: any) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.diagnosis}</span>
                    {r.medical_leave_granted > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {r.medical_leave_days}d Med Leave Granted
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{r.visit_date} {r.visit_time || ''}</span>
                </div>

                <p className="text-slate-600">
                  <strong className="text-slate-700">Symptoms:</strong> {r.symptoms}
                </p>

                {r.medicine_prescribed && (
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-2 text-rose-950">
                    <Pill size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Prescription: {r.medicine_prescribed}</span>
                      <span className="text-[11px] text-rose-800">{r.dosage} • {r.frequency} • {r.duration}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Attending Doctor: <strong>{r.doctor_name}</strong></span>
                  <span className="font-bold text-emerald-600">{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. LINE MANAGER & TEAM POD */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            VS
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-500 block">
              {language === 'km' ? 'ប្រធានផ្នែកផ្ទាល់ (Direct Line Manager)' : 'Direct Line Manager'}
            </span>
            <h4 className={`text-xs sm:text-sm font-bold text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {formatLocalizedText(staffData.managerName, language)}
            </h4>
            <p className="text-[11px] text-slate-500">{formatLocalizedText(staffData.managerRole, language)} &bull; {staffData.managerEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`mailto:${staffData.managerEmail}`}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {language === 'km' ? 'ផ្ញើអ៊ីមែល (Email)' : 'Send Email'}
          </a>
        </div>
      </div>

      {/* MODAL: OFFICIAL PAYSLIP VIEW */}
      {activePayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 p-1">
                  <img src="/hestra-logo.svg" alt="HESTRA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>HESTRA HRM CAMBODIA</h3>
                  {language === 'km' ? (
                    <span className="text-xs text-slate-500 font-khmer-moul text-indigo-700 block mt-0.5">
                      ប័ណ្ណបើកប្រាក់បៀវត្សរ៍
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider text-indigo-700 block mt-0.5">
                      Official Salary Payslip
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActivePayslipModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">{language === 'km' ? 'ឈ្មោះបុគ្គលិក' : 'Employee Name'}</span>
                <span className="font-bold text-slate-900">{formatLocalizedText(staffData.name, language)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">{language === 'km' ? 'អត្តលេខ' : 'Staff ID'}</span>
                <span className="font-mono font-bold text-slate-900">{staffData.empId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">{language === 'km' ? 'ការិយាល័យ' : 'Period'}</span>
                <span className="font-bold text-slate-900">{formatLocalizedText(activePayslipModal.period, language)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Payment Date'}</span>
                <span className="font-mono font-bold text-slate-900">{activePayslipModal.payment_date}</span>
              </div>
            </div>

            {/* Financial itemization */}
            <div className="space-y-2 text-xs border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{language === 'km' ? 'ប្រាក់ខែគោល (Basic Salary):' : 'Basic Salary:'}</span>
                <span className="font-mono font-bold">${activePayslipModal.base_salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{language === 'km' ? 'ប្រាក់ឧបត្ថម្ភការងារ (Allowances):' : 'Allowances:'}</span>
                <span className="font-mono font-bold text-emerald-600">+${activePayslipModal.allowances.toLocaleString()}</span>
              </div>
              {Number(activePayslipModal.monthly_eval_bonus || 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{language === 'km' ? 'ប្រាក់រង្វាន់វាយតម្លៃ (Evaluation Bonus):' : 'Monthly Eval Bonus:'}</span>
                  <span className="font-mono font-bold text-purple-600">+${(activePayslipModal.monthly_eval_bonus || 0).toFixed(2)}</span>
                </div>
              )}
              {Number(activePayslipModal.severance_pay || 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 bg-amber-50/50 px-1 rounded">
                  <span className="text-amber-800 font-semibold">{language === 'km' ? 'ប្រាក់បំណាច់កុងត្រា ៥% (Severance Pay):' : 'Severance Pay 5% (Col 50):'}</span>
                  <span className="font-mono font-bold text-amber-700">+${(activePayslipModal.severance_pay || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{language === 'km' ? 'កាត់វិភាគទាន ប.ស.ស (NSSF Pension 2%):' : 'NSSF Pension Deduction:'}</span>
                <span className="font-mono font-bold text-rose-600">-${activePayslipModal.nssf_deduction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{language === 'km' ? 'កាត់ពន្ធលើប្រាក់បៀវត្សរ៍ (TOS GDT):' : 'Tax On Salary (TOS):'}</span>
                <span className="font-mono font-bold text-rose-600">-${activePayslipModal.tax_deduction.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between pt-2 text-sm font-black text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                <span>{language === 'km' ? 'ប្រាក់បៀវត្សរ៍សុទ្ធទទួលបាន (Net Take-home):' : 'Net Take-Home Pay:'}</span>
                <span className="font-mono text-indigo-700">${activePayslipModal.net_salary.toLocaleString()} USD</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={15} />
                <span>{language === 'km' ? 'បោះពុម្ពប័ណ្ណ (Print)' : 'Print'}</span>
              </button>

              <button
                onClick={() => setActivePayslipModal(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {language === 'km' ? 'បិទ (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW REQUISITION */}
      <NewStaffRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          const empId = currentPersona.id;
          fetch(`/api/requests?employee_id=${empId}`)
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setMyRequests(data);
            })
            .catch(() => {});
        }}
        defaultEmployeeId={currentPersona.id}
        defaultEmployeeName={staffData.name}
        defaultDepartment={staffData.department}
      />
    </div>
  );
}
