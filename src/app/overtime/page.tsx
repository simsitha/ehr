'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { OvertimeRequest, Employee, Department, OvertimeRateType, OvertimeStatus } from '@/lib/types';
import { OVERTIME_RATES, OVERTIME_RATE_LIST, STANDARD_MONTHLY_HOURS } from '@/lib/overtime-calc';
import { formatLocalizedText } from '@/lib/translations';
import OvertimeRequestModal from '@/components/OvertimeRequestModal';
import OvertimeCalculatorModal from '@/components/OvertimeCalculatorModal';
import OvertimeApprovalModal from '@/components/OvertimeApprovalModal';
import OvertimePrintModal from '@/components/OvertimePrintModal';
import OvertimeRateEditModal from '@/components/OvertimeRateEditModal';
import {
  Timer,
  Plus,
  Calculator,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Building2,
  Users,
  DollarSign,
  ChevronRight,
  Sparkles,
  Calendar,
  FileText,
  Trash2,
  Eye,
  Check,
  XCircle,
  Edit2,
} from 'lucide-react';
import { getOvertimeRateConfig } from '@/lib/overtime-calc';

export default function OvertimePage() {
  const { currentPersona, language, showToast, refreshKey, triggerRefresh, overtimeSettings } = useApp();
  const isManagerOrAdmin = currentPersona.role === 'Manager' || currentPersona.role === 'Admin';

  // State & Filters
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'my'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedRateType, setSelectedRateType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [rateEditModalOpen, setRateEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);

  // If user is employee, default to 'my' tab
  useEffect(() => {
    if (currentPersona.role === 'Employee') {
      setActiveTab('my');
    }
  }, [currentPersona.role]);

  // Fetch initial meta: employees and departments
  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
    ])
      .then(([deptData, empData]) => {
        if (Array.isArray(deptData)) setDepartments(deptData);
        if (Array.isArray(empData)) setEmployees(empData);
      })
      .catch((err) => console.error('Error fetching meta:', err));
  }, []);

  // Compute unique groups from employees
  const groupList = useMemo(() => {
    return Array.from(new Set(employees.map((e: any) => e.group_name).filter(Boolean))).sort();
  }, [employees]);

  // Fetch Overtime Requests
  const fetchOvertime = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedMonth !== 'all') params.append('month', selectedMonth);
    if (selectedDepartment !== 'all') params.append('department_id', selectedDepartment);
    if (selectedGroup !== 'all') params.append('group', selectedGroup);
    if (activeTab === 'my' && currentPersona.id) {
      params.append('employee_id', currentPersona.id);
    }

    fetch(`/api/overtime?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching overtime:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOvertime();
  }, [selectedMonth, selectedDepartment, selectedGroup, activeTab, currentPersona.id, refreshKey]);

  // Filtered requests based on tab and client search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Tab filter
      if (activeTab === 'pending') {
        if (
          req.status !== 'Pending' &&
          req.status !== 'Pending Manager' &&
          req.status !== 'Pending Admin' &&
          req.status !== 'Submitted'
        ) {
          return false;
        }
      } else if (activeTab === 'approved') {
        if (req.status !== 'Approved') return false;
      } else if (activeTab === 'my') {
        if (req.employee_id !== currentPersona.id) return false;
      }

      // Group filter
      if (selectedGroup !== 'all' && (req as any).group_name !== selectedGroup) {
        return false;
      }

      // Rate type filter
      if (selectedRateType !== 'all' && req.ot_rate_type !== selectedRateType) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName =
          (req.employee_name || '').toLowerCase().includes(q) ||
          ((req as any).khmer_name || '').toLowerCase().includes(q) ||
          (req.employee_id || '').toLowerCase().includes(q) ||
          ((req as any).group_name || '').toLowerCase().includes(q) ||
          (req.employee_role || '').toLowerCase().includes(q) ||
          (req.project_name || '').toLowerCase().includes(q) ||
          (req.reason || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }

      return true;
    });
  }, [requests, activeTab, currentPersona.id, selectedGroup, selectedRateType, searchQuery]);

  // Quick 1-Click Approve handler
  const handleQuickApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isManagerOrAdmin ? 'admin_approve' : 'manager_approve',
          reviewer_id: currentPersona.id,
          reviewer_name: currentPersona.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(language === 'km' ? 'បានអនុម័តសំណើថែមម៉ោងជោគជ័យ!' : 'Overtime request approved successfully!', 'success');
        fetchOvertime();
        triggerRefresh();
      } else {
        showToast(data.error || 'Failed to approve', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Batch Approve All Pending
  const handleBatchApprove = async () => {
    const pending = filteredRequests.filter(
      (r) =>
        r.status === 'Pending' ||
        r.status === 'Pending Manager' ||
        r.status === 'Pending Admin' ||
        r.status === 'Submitted'
    );
    if (pending.length === 0) {
      showToast(language === 'km' ? 'គ្មានសំណើរង់ចាំអនុម័តទេ' : 'No pending requests to approve', 'info');
      return;
    }

    if (!confirm(language === 'km' ? `តើអ្នកចង់អនុម័តសំណើថែមម៉ោងទាំង ${pending.length} នេះមែនទេ?` : `Approve all ${pending.length} pending overtime requests?`)) {
      return;
    }

    try {
      for (const req of pending) {
        await fetch(`/api/overtime/${req.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_approve',
            reviewer_id: currentPersona.id,
            reviewer_name: currentPersona.name,
          }),
        });
      }
      showToast(language === 'km' ? `បានអនុម័តសំណើទាំង ${pending.length} រួចរាល់` : `Approved ${pending.length} overtime requests`, 'success');
      fetchOvertime();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // KPI Telemetry Computations
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalPay = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    requests.forEach((r) => {
      if (r.status === 'Approved') {
        totalHours += Number(r.hours) || 0;
        totalPay += Number(r.estimated_pay) || 0;
        approvedCount++;
      } else if (r.status === 'Pending' || r.status === 'Pending Manager' || r.status === 'Pending Admin') {
        pendingCount++;
      }
    });

    return {
      totalHours,
      totalPay,
      pendingCount,
      approvedCount,
      totalRequests: requests.length,
      khrPay: Math.round(totalPay * 4100),
    };
  }, [requests]);

  // Actions
  const handleOpenReview = (req: OvertimeRequest) => {
    setSelectedRequest(req);
    setApprovalModalOpen(true);
  };

  const handleOpenPrint = (req: OvertimeRequest) => {
    setSelectedRequest(req);
    setPrintModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'km' ? 'តើអ្នកពិតជាចង់លុបសំណើថែមម៉ោងនេះមែនទេ?' : 'Are you sure you want to delete this overtime request?')) {
      const res = await fetch(`/api/overtime/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(language === 'km' ? 'បានលុបសំណើជោគជ័យ' : 'Overtime request deleted', 'success');
        fetchOvertime();
        triggerRefresh();
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No data to export', 'error');
      return;
    }

    const headers = [
      'Request ID',
      'Employee ID',
      'Employee Name',
      'Department',
      'Position',
      'Date',
      'Start Time',
      'End Time',
      'Hours',
      'Rate Type',
      'Multiplier',
      'Base Hourly Rate',
      'Estimated Pay USD',
      'Estimated Pay KHR',
      'Project',
      'Reason',
      'Status',
    ];

    const rows = filteredRequests.map((r) => {
      return [
        `"${r.id}"`,
        `"${r.employee_id}"`,
        `"${r.employee_name || ''}"`,
        `"${r.department_name || ''}"`,
        `"${r.employee_role || ''}"`,
        `"${r.date}"`,
        `"${r.start_time}"`,
        `"${r.end_time}"`,
        r.hours,
        `"${r.ot_rate_type}"`,
        r.multiplier,
        r.hourly_rate,
        r.estimated_pay,
        Math.round(r.estimated_pay * 4100),
        `"${(r.project_name || '').replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Overtime_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(language === 'km' ? 'បានទាញយកឯកសារ CSV ជោគជ័យ!' : 'Exported CSV successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Timer size={22} />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                {language === 'km' ? 'គ្រប់គ្រងការងារថែមម៉ោង (Overtime)' : 'Overtime Management (OT)'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'ការស្នើសុំ ការអនុម័ត និងគណនាប្រាក់ថែមម៉ោងស្របតាមច្បាប់ការងារកម្ពុជា'
                  : 'Cambodian labor law overtime requests, dual approvals, and compensation tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Batch Approve Pending (For Managers/Admins when pending requests exist) */}
          {isManagerOrAdmin && stats.pendingCount > 0 && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'km' ? `អនុម័តទាំងអស់ (${stats.pendingCount})` : `Approve All (${stats.pendingCount})`}</span>
            </button>
          )}

          {/* Overtime Calculator Button */}
          <button
            onClick={() => setCalcModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Calculator size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'km' ? 'គណនាប្រាក់ OT' : 'OT Calculator'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>CSV</span>
          </button>

          {/* New Overtime Request Button */}
          <button
            onClick={() => setRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>{language === 'km' ? 'ស្នើសុំថែមម៉ោង' : 'Request Overtime'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Approved Overtime Hours */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'ម៉ោងថែមអនុម័តរួច' : 'Approved OT Hours'}</span>
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.totalHours.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'ម៉ោង (hrs)' : 'Hours (hrs)'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? `ក្នុងខែ ${selectedMonth}` : `In period ${selectedMonth}`}
          </p>
        </div>

        {/* Estimated Overtime Compensation */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'ប្រាក់ឧបត្ថម្ភថែមម៉ោង' : 'Estimated OT Pay'}</span>
            <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              ${stats.totalPay.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">USD</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            ≈ {language === 'km' ? '៛' : ''}{stats.khrPay.toLocaleString()} KHR
          </p>
        </div>

        {/* Pending Approval Queue */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'រង់ចាំការអនុម័ត' : 'Pending Approvals'}</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.pendingCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'សំណើ (requests)' : 'requests'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? 'ត្រូវការពិនិត្យដោយ Supervisor/HR' : 'Requires review'}
          </p>
        </div>

        {/* Approved Requests Count */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'សំណើបានអនុម័ត' : 'Approved Count'}</span>
            <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 font-mono">
              {stats.approvedCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">/{stats.totalRequests} {language === 'km' ? 'សំណើ' : 'requests'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? 'បញ្ចូលក្នុងបញ្ជីបើកប្រាក់បៀវត្សរ៍' : 'Included in payroll'}
          </p>
        </div>

        {/* Cambodian Labor Law Compliance Card */}
        <div className="col-span-2 lg:col-span-1 p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300">
            <span className="text-xs font-bold">{language === 'km' ? 'ច្បាប់ការងារ (មាត្រា ១៣៩)' : 'Labor Code Art. 139'}</span>
            <Shield size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
              {language === 'km' ? '១៥០% ថ្ងៃធម្មតា • ២០០% យប់/បុណ្យ' : '150% Regular • 200% Night/Holiday'}
            </span>
            <p className="text-[10px] text-blue-700 dark:text-blue-300/80 mt-1 leading-tight">
              {language === 'km'
                ? 'មិនលើស ២ ម៉ោង/ថ្ងៃ លើកលែងករណីបន្ទាន់ និងគិតផ្អែកលើ ២០៨ ម៉ោង/ខែ'
                : 'Max 2h/day overtime rule & 208h standard monthly divisor'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="space-y-3">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'សំណើទាំងអស់' : 'All Requests'} ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'រង់ចាំអនុម័ត' : 'Pending'} ({stats.pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'បានអនុម័ត' : 'Approved'} ({stats.approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'my'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'សំណើរបស់ខ្ញុំ' : 'My Requests'}
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'ខែ៖' : 'Month:'}</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          {/* Search Query */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ ក្រុម គម្រោង ឬមូលហេតុ...' : 'Search name, group, project, or reason...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Group / Factory Line Filter */}
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ខ្សែសង្វាក់/ក្រុម' : 'All Lines / Groups'}</option>
                {groupList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="all">{language === 'km' ? 'គ្រប់នាយកដ្ឋាន' : 'All Departments'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatLocalizedText(d.name, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Type */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedRateType}
                onChange={(e) => setSelectedRateType(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="all">{language === 'km' ? 'គ្រប់អត្រាថែមម៉ោង' : 'All OT Rates'}</option>
                {OVERTIME_RATE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {language === 'km' ? r.short_label : (r.short_label_en || r.label_en)} ({r.multiplier * 100}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overtime Requests Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                <th className="p-3.5">{language === 'km' ? 'បុគ្គលិកស្នើសុំ' : 'Colleague'}</th>
                <th className="p-3.5">{language === 'km' ? 'ក្រុម & នាយកដ្ឋាន' : 'Group & Dept'}</th>
                <th className="p-3.5">{language === 'km' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Shift'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'ម៉ោង OT' : 'OT Hours'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'អត្រាថែមម៉ោង' : 'Rate & Multiplier'}</th>
                <th className="p-3.5 text-right">{language === 'km' ? 'ប្រាក់ថែមម៉ោង' : 'Est. Pay'}</th>
                <th className="p-3.5">{language === 'km' ? 'គម្រោង & មូលហេតុ' : 'Project & Reason'}</th>
                <th className="p-3.5 text-center">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="p-3.5 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
                    <p>{language === 'km' ? 'កំពុងផ្ទុកទិន្នន័យថែមម៉ោង...' : 'Loading overtime requests...'}</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Timer size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      {language === 'km' ? 'រកមិនឃើញសំណើថែមម៉ោងទេ' : 'No overtime requests found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'km' ? 'ចុចលើ "ស្នើសុំថែមម៉ោង" ដើម្បីបង្កើតថ្មី' : 'Click "Request Overtime" to submit a new entry'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const rateConfig = getOvertimeRateConfig(req.ot_rate_type, overtimeSettings?.rates);
                  const isPending =
                    req.status === 'Pending' ||
                    req.status === 'Pending Manager' ||
                    req.status === 'Pending Admin' ||
                    req.status === 'Submitted';
                  const isApproved = req.status === 'Approved';
                  const isOvernight = req.end_time < req.start_time;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Employee Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {req.employee_avatar ? (
                            <img
                              src={req.employee_avatar}
                              alt={req.employee_name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                              {req.employee_name ? req.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{formatLocalizedText(req.employee_name || '', language)}</span>
                              {(req as any).khmer_name && (
                                <span className="text-[11px] font-semibold text-slate-500 font-sans">
                                  ({(req as any).khmer_name})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {req.employee_id}
                              </span>
                              <span>•</span>
                              <span>{formatLocalizedText(req.employee_role || '', language)}</span>
                              {(req as any).gender && (
                                <>
                                  <span>•</span>
                                  <span className="text-[10px] text-slate-400">{(req as any).gender}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group & Department */}
                      <td className="p-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                            {(req as any).group_name || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatLocalizedText(req.department_name || '', language)}
                          </span>
                        </div>
                      </td>

                      {/* Date & Shift */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.date}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>{req.start_time} - {req.end_time}</span>
                          {isOvernight && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800" title="Overnight shift crossover">
                              🌙 Overnight
                            </span>
                          )}
                        </div>
                      </td>

                      {/* OT Hours */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block font-extrabold font-mono px-2 py-0.5 rounded-lg text-xs ${
                          req.hours > 2.0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {req.hours.toFixed(1)}h
                        </span>
                      </td>

                      {/* Rate Type & Multiplier */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${rateConfig.badgeBg} ${rateConfig.badgeBorder} ${rateConfig.badgeText}`}>
                          {rateConfig.multiplier * 100}% {language === 'km' ? rateConfig.short_label : (rateConfig.short_label_en || rateConfig.label_en)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ${req.hourly_rate?.toFixed(2) || '0.00'}/h base
                        </div>
                      </td>

                      {/* Estimated Pay */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          +${req.estimated_pay.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ≈ {language === 'km' ? '៛' : ''}{Math.round(req.estimated_pay * 4100).toLocaleString()} KHR
                        </div>
                      </td>

                      {/* Project & Reason */}
                      <td className="p-3.5 max-w-xs">
                        {req.project_name && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mb-1">
                            {req.project_name}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={10} />
                            <span>Approved</span>
                          </span>
                        ) : req.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <XCircle size={10} />
                            <span>Rejected</span>
                          </span>
                        ) : req.status === 'Draft' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <Clock size={10} />
                            <span>Draft</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock size={10} />
                            <span>{req.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick 1-Click Approve button for Managers/Admins */}
                          {isManagerOrAdmin && isPending && (
                            <button
                              onClick={() => handleQuickApprove(req.id)}
                              title={language === 'km' ? 'អនុម័តភ្លាមៗ (Quick Approve)' : 'Quick Approve'}
                              className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              <Check size={13} />
                            </button>
                          )}

                          {/* Review button for Managers/Admins */}
                          {isManagerOrAdmin && isPending && (
                            <button
                              onClick={() => handleOpenReview(req)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              {language === 'km' ? 'ពិនិត្យ' : 'Review'}
                            </button>
                          )}

                          {/* Print Official Letter */}
                          <button
                            onClick={() => handleOpenPrint(req)}
                            title={language === 'km' ? 'បោះពុម្ពលិខិតផ្លូវការ' : 'Print Official Form'}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Printer size={13} />
                          </button>

                          {/* Delete if pending or admin */}
                          {(isPending || currentPersona.role === 'Admin') && (
                            <button
                              onClick={() => handleDelete(req.id)}
                              title={language === 'km' ? 'លុប' : 'Delete'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Cambodian Overtime Rates Legal Reference Cards */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {language === 'km' ? 'កម្រងអត្រាប្រាក់ថែមម៉ោងស្របច្បាប់កម្ពុជា' : 'Cambodian Labor Law Statutory Overtime Rates'}
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 font-mono">
              {overtimeSettings?.standardMonthlyHours || STANDARD_MONTHLY_HOURS}h / month standard divisor
            </span>
            {isManagerOrAdmin && (
              <button
                onClick={() => setRateEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Edit2 size={13} />
                <span>{language === 'km' ? 'កែប្រែអត្រា (Edit Rates)' : 'Edit Rates'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(overtimeSettings?.rates || OVERTIME_RATES).map((rate) => (
            <div
              key={rate.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${rate.badgeBg} ${rate.badgeBorder}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${rate.badgeText}`}>
                    {Math.round(rate.multiplier * 100)}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {rate.law_reference}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {language === 'km' ? rate.label_km : rate.label_en}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'km' ? rate.description_km : rate.description_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <OvertimeRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        employees={employees}
        onSuccess={fetchOvertime}
      />

      <OvertimeCalculatorModal
        isOpen={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
      />

      <OvertimeApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onActionComplete={fetchOvertime}
      />

      <OvertimePrintModal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      <OvertimeRateEditModal
        isOpen={rateEditModalOpen}
        onClose={() => setRateEditModalOpen(false)}
        onSuccess={fetchOvertime}
      />
    </div>
  );
}
