'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText } from '@/lib/translations';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Building2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Mail,
  Filter,
  FileCheck2,
  Laptop,
  DollarSign,
  Package,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ApprovalRequest } from '@/lib/types';
import RequestApprovalModal from '@/components/RequestApprovalModal';

interface PendingLeaveItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_avatar: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  created_at: string;
}

export default function ManagementPortalPage() {
  const { currentPersona, language, t, showToast } = useApp();

  const [pendingLeaves, setPendingLeaves] = useState<PendingLeaveItem[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Team Material & Salary requests (3-tier approval system)
  const [teamRequests, setTeamRequests] = useState<ApprovalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvingReqId, setApprovingReqId] = useState<string | null>(null);
  const [requestTab, setRequestTab] = useState<'pending' | 'all'>('pending');

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [departmentName, setDepartmentName] = useState('Engineering');

  // Load pending leaves
  const fetchLeaves = () => {
    fetch('/api/leaves')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const pending = data.filter((l: any) => l.status === 'Pending' || l.status === 'Pending Manager');
          setPendingLeaves(pending);
        }
        setLoadingLeaves(false);
      })
      .catch((err) => {
        console.error('Error loading leaves for manager:', err);
        setLoadingLeaves(false);
      });
  };

  // Load dynamic team members
  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
      ]);
      const employees = await empRes.json();
      const attendance = await attRes.json();

      if (Array.isArray(employees)) {
        // Find current manager's record
        const managerEmp = employees.find(
          (e: any) => e.id === currentPersona.id || e.email.toLowerCase() === currentPersona.email.toLowerCase()
        );

        const targetDeptId = managerEmp?.department_id || 'dept-1';
        if (managerEmp?.department_name) {
          setDepartmentName(managerEmp.department_name);
        }

        // Filter direct reports or department members (excluding manager themselves)
        let filtered = employees.filter(
          (e: any) =>
            e.id !== currentPersona.id &&
            (e.manager_id === currentPersona.id || e.department_id === targetDeptId)
        );

        if (filtered.length === 0) {
          // fallback to engineering team if none found
          filtered = employees.filter((e: any) => e.department_id === 'dept-1' && e.id !== currentPersona.id);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const mapped = filtered.map((emp: any) => {
          const att = Array.isArray(attendance)
            ? attendance.find((a: any) => a.employee_id === emp.id && a.date === todayStr)
            : null;

          let status = 'In Office';
          let statusColor = 'bg-emerald-500';
          let clockIn = att?.clock_in ? att.clock_in.slice(0, 5) : '08:30 AM';

          if (emp.status === 'Remote' || att?.status === 'Remote') {
            status = 'Remote (WFH)';
            statusColor = 'bg-blue-500';
          } else if (emp.status === 'On Leave' || att?.status === 'Absent') {
            status = 'On Leave';
            statusColor = 'bg-amber-500';
            clockIn = '--:--';
          } else if (att?.status === 'Late') {
            status = 'Late';
            statusColor = 'bg-amber-500';
          }

          return {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            role: emp.role,
            avatar: emp.avatar,
            status,
            statusColor,
            clockIn,
            leaveBalance: `${Math.floor(12 + (emp.id.charCodeAt(emp.id.length - 1) % 6))} ${language === 'km' ? 'ថ្ងៃ' : 'days'}`,
          };
        });

        setTeamMembers(mapped);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleDecision = async (leaveId: string, decision: 'Approved' | 'Rejected') => {
    setApprovingId(leaveId);
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision === 'Approved' ? 'Pending Admin' : 'Rejected',
          stage: 'manager',
          reviewer_id: currentPersona.id,
          reviewer_role: 'Manager',
          reviewer_comments:
            decision === 'Approved'
              ? (language === 'km'
                  ? `អនុម័តជំហានទី១ ដោយប្រធានផ្នែក ${currentPersona.name}។ បានបញ្ជូនទៅរដ្ឋបាល (Step 1 Approved by Line Manager. Forwarded to Admin).`
                  : `Step 1 Approved by Line Manager ${formatLocalizedText(currentPersona.name, language)}. Forwarded to Admin.`)
              : (language === 'km'
                  ? 'ពុំអាចអនុញ្ញាតបានដោយសារតម្រូវការការងារបន្ទាន់ (Declined due to work schedule)'
                  : 'Declined due to operational coverage requirements.'),
        }),
      });

      if (res.ok) {
        showToast(
          decision === 'Approved'
            ? (language === 'km' ? 'បានអនុម័តជំហានទី១ និងបញ្ជូនទៅរដ្ឋបាល Admin ដោយជោគជ័យ! ✓' : 'Step 1 approved and forwarded to HR Admin! ✓')
            : (language === 'km' ? 'បានបដិសេធសំណើសុំច្បាប់' : 'Leave request rejected.'),
          decision === 'Approved' ? 'success' : 'info'
        );
        fetchLeaves();
      } else {
        showToast(language === 'km' ? 'បរាជ័យក្នុងការអនុម័តសំណើ' : 'Failed to process request', 'error');
      }
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសប្រព័ន្ធ' : 'System error', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      // First try fetching direct reports for this manager
      const res = await fetch(`/api/requests?line_manager_id=${encodeURIComponent(currentPersona.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTeamRequests(data);
          setLoadingRequests(false);
          return;
        }
      }
      // If no direct records with that exact manager ID, fetch all requests so manager has visibility
      const allRes = await fetch('/api/requests');
      if (allRes.ok) {
        const allData = await allRes.json();
        if (Array.isArray(allData)) {
          setTeamRequests(allData);
        }
      }
    } catch (err) {
      console.error('Failed to load team requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleQuickApproveRequest = async (req: ApprovalRequest) => {
    setApprovingReqId(req.id);
    try {
      const res = await fetch(`/api/requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          stage: 'line_manager',
          reviewer_id: currentPersona.id,
          reviewer_name: currentPersona.name,
          comments:
            language === 'km'
              ? `អនុម័តជំហានទី១ ដោយប្រធានផ្នែក ${currentPersona.name}។ បញ្ជូនបន្តទៅ HR (Approved Step 1 by Line Manager. Forwarded to HR).`
              : `Approved Step 1 by Line Manager ${formatLocalizedText(currentPersona.name, language)}. Forwarded to HR.`,
        }),
      });

      if (res.ok) {
        showToast(
          language === 'km'
            ? 'បានអនុម័តជំហានទី១ និងបញ្ជូនសំណើទៅ HR រួចរាល់! ✓'
            : 'Step 1 approved and forwarded to HR Admin! ✓',
          'success'
        );
        fetchRequests();
      } else {
        const errData = await res.json();
        showToast(errData.error || (language === 'km' ? 'បរាជ័យក្នុងការអនុម័ត' : 'Approval failed'), 'error');
      }
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសប្រព័ន្ធ' : 'System error', 'error');
    } finally {
      setApprovingReqId(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchTeam();
    fetchRequests();
  }, [currentPersona]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER & TOP BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield size={16} />
            <span>{language === 'km' ? 'ផតថលគណៈគ្រប់គ្រង & ប្រធានផ្នែក (Manager Self-Service)' : 'Manager Self-Service (MSS)'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {language === 'km' ? 'ផ្ទាំងគ្រប់គ្រងក្រុមការងារ (Team Management Hub)' : 'Team Management Portal'}
          </h1>
          <p className={`text-xs text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km'
              ? 'អនុម័តសំណើសុំច្បាប់ តាមដានវត្តមានផ្ទាល់របស់ក្រុម វាយតម្លៃសមិទ្ធកម្ម និងពិនិត្យកាលវិភាគការងារ។'
              : 'Approve direct report leave requests, monitor live team attendance, and ensure operational coverage.'}
          </p>
        </div>

        {/* Action badge */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold flex items-center gap-2">
            <Users size={15} />
            <span>{language === 'km' ? 'ទិដ្ឋភាពប្រធានផ្នែក (Manager View)' : 'Manager Persona Active'}</span>
          </span>
        </div>
      </div>

      {/* 2. TEAM OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'សមាជិកក្រុមសរុប' : 'Direct Reports'}
          </span>
          <div className="text-2xl font-black text-slate-900 my-1 font-mono">
            {teamMembers.length} <span className="text-xs font-sans text-slate-500 font-semibold">{language === 'km' ? 'នាក់' : 'members'}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {formatLocalizedText(departmentName, language)}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'វត្តមានថ្ងៃនេះ' : 'Attendance Rate'}
          </span>
          <div className="text-2xl font-black text-emerald-600 my-1 font-mono">
            75%
          </div>
          <span className="text-[11px] text-slate-500">
            {language === 'km' ? '២ នាក់នៅការិយាល័យ • ១ WFH' : '2 In-Office • 1 WFH'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'សំណើសុំច្បាប់រង់ចាំ' : 'Pending Approvals'}
          </span>
          <div className="text-2xl font-black text-amber-600 my-1 font-mono">
            {pendingLeaves.length} <span className="text-xs font-sans text-slate-500 font-semibold">{language === 'km' ? 'សំណើ' : 'pending'}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {pendingLeaves.length > 0 ? (language === 'km' ? 'ត្រូវការការអនុម័តជាបន្ទាន់' : 'Requires review') : (language === 'km' ? 'ពុំមានសំណើរង់ចាំឡើយ' : 'No pending requests')}
          </span>
        </div>

        {/* Metric 4: Material & Salary Requisitions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'សំណើសម្ភារៈ & បៀវត្សរ៍រង់ចាំ' : 'Pending Requisitions'}
          </span>
          <div className="text-2xl font-black text-indigo-700 my-1 font-mono">
            {teamRequests.filter((r) => r.status === 'Pending Line Manager').length}{' '}
            <span className="text-xs font-sans text-slate-500 font-semibold">{language === 'km' ? 'សំណើ' : 'pending'}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {teamRequests.filter((r) => r.status === 'Pending Line Manager').length > 0
              ? (language === 'km' ? 'ត្រូវការអនុម័តជំហានទី១' : 'Requires Step 1 Review')
              : (language === 'km' ? 'ពុំមានសំណើរង់ចាំឡើយ' : 'No pending requests')}
          </span>
        </div>
      </div>

      {/* 3. PENDING APPROVALS HUB (CRUCIAL MANAGER FUNCTION) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck size={18} className="text-indigo-600" />
              <span>{language === 'km' ? 'ប្រអប់សំណើសុំច្បាប់កំពុងរង់ចាំការអនុម័ត (Approvals Queue)' : 'Direct Report Leave Requests (Pending Queue)'}</span>
            </h3>
            <p className={`text-xs text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'ចុច ១ ដងដើម្បីអនុម័ត ឬបដិសេធពាក្យសុំច្បាប់របស់សមាជិកក្រុម' : 'One-click Approve or Reject to maintain team workflow'}
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {pendingLeaves.length} {language === 'km' ? 'សំណើរង់ចាំ' : 'Pending Requests'}
          </span>
        </div>

        {loadingLeaves ? (
          <div className="py-12 text-center text-xs text-slate-400">{language === 'km' ? 'កំពុងដំណើរការទិន្នន័យ...' : 'Loading pending requests...'}</div>
        ) : pendingLeaves.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">{language === 'km' ? 'ពុំមានសំណើសុំច្បាប់ដែលនៅសេសសល់ឡើយ!' : 'No pending leave requests!'}</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'km' ? 'សំណើសុំច្បាប់ទាំងអស់របស់ក្រុមការងារត្រូវបានពិនិត្យ និងអនុម័តរួចរាល់។' : 'All leave requests from your team have been reviewed and approved.'}
            </p>
          </div>
        ) : (
          <div className={`space-y-3 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  {leave.employee_avatar ? (
                    <img
                      src={leave.employee_avatar}
                      alt={leave.employee_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-100 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center ring-2 ring-indigo-100 shrink-0">
                      {leave.employee_name ? leave.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{formatLocalizedText(leave.employee_name, language)}</h4>
                      <span className="text-[10px] font-mono text-slate-400">({leave.employee_id})</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{formatLocalizedText(leave.employee_role, language)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                        {leave.leave_type} ({leave.days_count} {language === 'km' ? 'ថ្ងៃ' : 'days'})
                      </span>
                      <span className="text-slate-500 font-mono">
                        {leave.start_date} {language === 'km' ? 'ដល់' : 'to'} {leave.end_date}
                      </span>
                    </div>
                    {leave.reason && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        &ldquo;{formatLocalizedText(leave.reason, language)}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    disabled={approvingId === leave.id}
                    onClick={() => handleDecision(leave.id, 'Approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{approvingId === leave.id ? (language === 'km' ? 'កំពុងបញ្ជូន...' : 'Forwarding...') : (language === 'km' ? 'អនុម័តជំហាន១ ➔ បញ្ជូនទៅរដ្ឋបាល' : 'Approve Step 1 ➔ Forward')}</span>
                  </button>

                  <button
                    disabled={approvingId === leave.id}
                    onClick={() => handleDecision(leave.id, 'Rejected')}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>{language === 'km' ? 'បដិសេធ' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3.5 PENDING MATERIAL & SALARY REQUISITIONS (STAGE 1 APPROVAL QUEUE) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 size={18} className="text-indigo-600" />
              <span>
                {language === 'km'
                  ? 'ការអនុម័តសំណើសម្ភារៈ & ដំឡើងបៀវត្សរ៍ក្រុមការងារ (Team Requisitions & Approvals)'
                  : 'Direct Report Material & Salary Requisitions (Stage 1)'}
              </span>
            </h3>
            <p className={`text-xs text-slate-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? 'ជំហានទី១៖ ពិនិត្យ និងអនុម័តសំណើរបស់បុគ្គលិក មុននឹងបញ្ជូនទៅ HR (សម្ភារៈទូទៅ) ឬបញ្ជូនបន្តរហូតដល់ CEO (កុំព្យូទ័រ Laptop & ដំឡើងប្រាក់ខែ)'
                : 'Stage 1 Line Manager Review: Forward approved requests to HR (Standard Material) or Top Management CEO (Laptop, Computer, Salary Increase)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRequestTab('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  requestTab === 'pending'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'រង់ចាំអនុម័ត' : 'Pending Review'} (
                {teamRequests.filter((r) => r.status === 'Pending Line Manager').length})
              </button>
              <button
                type="button"
                onClick={() => setRequestTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  requestTab === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'ទាំងអស់' : 'All'} ({teamRequests.length})
              </button>
            </div>

            <Link
              href="/requests"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors"
            >
              <span>{language === 'km' ? 'ផ្ទាំងធំ' : 'Full Hub'}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {loadingRequests ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {language === 'km' ? 'កំពុងដំណើរការទិន្នន័យសំណើ...' : 'Loading requisitions...'}
          </div>
        ) : (requestTab === 'pending'
            ? teamRequests.filter((r) => r.status === 'Pending Line Manager')
            : teamRequests
          ).length === 0 ? (
          <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 size={22} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">
              {language === 'km'
                ? 'ពុំមានសំណើសម្ភារៈ ឬបៀវត្សរ៍ដែលរង់ចាំការអនុម័តឡើយ!'
                : 'No pending team requisitions!'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'km'
                ? 'សំណើទាំងអស់របស់សមាជិកក្រុមត្រូវបានដំណើរការរួចរាល់។'
                : 'All material and salary requests from your team have been reviewed.'}
            </p>
          </div>
        ) : (
          <div className={`space-y-3 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {(requestTab === 'pending'
              ? teamRequests.filter((r) => r.status === 'Pending Line Manager')
              : teamRequests
            ).map((req) => {
              const isSalary = req.request_type === 'Salary Increase';
              const isLaptopOrPc =
                req.item_name.toLowerCase().includes('laptop') ||
                req.item_name.toLowerCase().includes('computer') ||
                req.item_name.toLowerCase().includes('desktop');

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {req.employee_avatar ? (
                      <img
                        src={req.employee_avatar}
                        alt={req.employee_name || 'Staff'}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center ring-2 ring-indigo-100 shrink-0">
                        {req.employee_name ? req.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">
                          {formatLocalizedText(req.employee_name || 'Staff', language)}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          ({req.request_number})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.created_at ? req.created_at.slice(0, 10) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatLocalizedText(req.employee_role || '', language)} • {formatLocalizedText(req.department_name || '', language)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {isSalary ? (
                            <DollarSign size={13} className="text-emerald-600" />
                          ) : isLaptopOrPc ? (
                            <Laptop size={13} className="text-indigo-600" />
                          ) : (
                            <Package size={13} className="text-sky-600" />
                          )}
                          <span>{req.item_name}</span>
                          {!isSalary && req.quantity > 1 && (
                            <span className="text-[10px] text-slate-400 font-mono">x{req.quantity}</span>
                          )}
                        </span>

                        {isSalary ? (
                          <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ${req.current_salary?.toLocaleString()} ➔ ${req.proposed_salary?.toLocaleString()} (+${((req.proposed_salary || 0) - (req.current_salary || 0)).toLocaleString()})
                          </span>
                        ) : (
                          req.estimated_cost ? (
                            <span className="text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                              Est. ${req.estimated_cost.toLocaleString()}
                            </span>
                          ) : null
                        )}

                        {req.requires_top_management === 1 ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <Sparkles size={11} />
                            <span>{language === 'km' ? '៣ ដំណាក់កាល (អ្នក ➔ HR ➔ CEO)' : '3 Stages (You ➔ HR ➔ CEO)'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>{language === 'km' ? '២ ដំណាក់កាល (អ្នក ➔ HR ចុងក្រោយ)' : '2 Stages (You ➔ HR Final)'}</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : req.status === 'Pending Line Manager'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : req.status === 'Pending HR'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.reason && (
                        <p className="text-[11px] text-slate-600 mt-1 italic">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {req.status === 'Pending Line Manager' ? (
                      <>
                        <button
                          type="button"
                          disabled={approvingReqId === req.id}
                          onClick={() => handleQuickApproveRequest(req)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>
                            {approvingReqId === req.id
                              ? (language === 'km' ? 'កំពុងបញ្ជូន...' : 'Forwarding...')
                              : (language === 'km' ? 'អនុម័តជំហាន១ ➔ បញ្ជូនទៅ HR' : 'Approve Step 1 ➔ Forward HR')}
                          </span>
                          <ArrowRight size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsApprovalModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                          <span>{language === 'km' ? 'ពិនិត្យ / បដិសេធ' : 'Review / Reject'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsApprovalModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'km' ? 'មើលលម្អិត & ដំណាក់កាល' : 'View Pipeline Details'}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. TEAM ATTENDANCE RADAR & DIRECT REPORTS ROSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Team Members Roster (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={17} className="text-indigo-600" />
                <span>{language === 'km' ? 'បញ្ជីសមាជិកក្រុមការងារផ្ទាល់' : 'Direct Reports Roster'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'km' ? 'ព័ត៌មានលម្អិត និងស្ថានភាពវត្តមានបច្ចុប្បន្ន' : 'Current attendance and leave capacity'}
              </p>
            </div>
            <Link
              href="/employees"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              {language === 'km' ? 'មើលទាំងអស់ →' : 'View All →'}
            </Link>
          </div>

          <div className={`space-y-3 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{formatLocalizedText(member.name, language)}</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${member.statusColor}`}></span>
                        {member.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{formatLocalizedText(member.role, language)}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-mono text-slate-500 block">
                    {language === 'km' ? `កត់ត្រា៖ ${member.clockIn}` : `Clock In: ${member.clockIn}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'km' ? `ច្បាប់នៅសល់៖ ${member.leaveBalance}` : `Balance: ${member.leaveBalance}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Team Coverage & Manager Tools (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={17} className="text-indigo-600" />
                  <span>{language === 'km' ? 'កាលវិភាគអវត្តមានក្នុងសប្តាហ៍នេះ' : 'Team Leave Coverage'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'km' ? 'ធានាថាផ្នែកការងារមានកម្លាំងគ្រប់គ្រាន់' : 'Avoid team understaffing'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">{language === 'km' ? 'ចន្ទ - សុក្រ (សប្តាហ៍នេះ)' : 'Mon - Fri (This Week)'}</span>
                <span className="text-emerald-600 font-bold">
                  {pendingLeaves.length === 0
                    ? (language === 'km' ? '✓ កម្លាំងការងារពេញលេញ' : '✓ Full Coverage')
                    : (language === 'km' ? `⚠️ សំណើសុំច្បាប់ ${pendingLeaves.length}` : `⚠️ ${pendingLeaves.length} Pending Leaves`)}
                </span>
              </div>
              <p className={`text-[11px] text-slate-500 leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {pendingLeaves.length === 0
                  ? (language === 'km'
                      ? `សមាជិកក្រុមទាំងអស់កំពុងបំពេញការងារយ៉ាងពេញលេញក្នុងផ្នែក ${departmentName}។ គ្មានការស្នើសុំច្បាប់ដែលត្រូវអនុម័តឡើយ។`
                      : `All active team members in ${departmentName} are present. No pending leave requests or schedule gaps this week.`)
                  : (language === 'km'
                      ? `មានសំណើសុំច្បាប់ចំនួន ${pendingLeaves.length} កំពុងរង់ចាំការពិនិត្យ និងអនុម័តពីលោកអ្នកដើម្បីធានាកម្លាំងការងារ។`
                      : `There are ${pendingLeaves.length} pending leave request(s) awaiting your review to maintain operational coverage.`)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {language === 'km' ? 'សកម្មភាពរហ័សសម្រាប់ប្រធានផ្នែក' : 'Manager Quick Launchpad'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/tools?tab=letters"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <FileText size={14} className="text-indigo-600" />
                <span>{language === 'km' ? 'ចេញលិខិតសរសើរ' : 'Recognition Letter'}</span>
              </Link>

              <Link
                href="/performance"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp size={14} className="text-emerald-600" />
                <span>{language === 'km' ? 'វាយតម្លៃសមិទ្ធកម្ម' : 'Performance Review'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST APPROVAL MODAL */}
      <RequestApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedRequest(null);
        }}
        requestItem={selectedRequest}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </div>
  );
}
