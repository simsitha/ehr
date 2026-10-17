'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AttendanceBonusCalculation,
  AttendanceBonusSummary,
  AttendanceBonusRule,
  AttendanceBonusPolicyConfig,
  AttendanceBonusAuditLog,
  PayrollPeriod,
} from '@/lib/types';
import {
  Award,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Check,
  FileSpreadsheet,
  Settings,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Lock,
  ShieldCheck,
  ArrowUpDown,
  History,
  Building2,
  ChevronRight,
  ChevronLeft,
  Download,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
  HelpCircle,
  X,
  FileText,
  Save,
  Trash2,
  Plus,
} from 'lucide-react';

export default function AttendanceBonusManager() {
  const { currentPersona, language, showToast } = useApp();
  const isKm = language === 'km';
  const userRole = currentPersona?.role || 'Admin';
  const canManage = userRole === 'Admin' || userRole === 'Manager';
  const isHRManager = userRole === 'Manager' || userRole === 'Admin';
  const isPayrollOfficer = userRole === 'Admin'; // Admin can post to payroll

  // State: Periods
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('period-2026-10');

  // State: Calculations & Summary
  const [summary, setSummary] = useState<AttendanceBonusSummary | null>(null);
  const [calculations, setCalculations] = useState<AttendanceBonusCalculation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<keyof AttendanceBonusCalculation>('attendance_days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Modals
  const [selectedEmployeeCalc, setSelectedEmployeeCalc] = useState<AttendanceBonusCalculation | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [postConfirmOpen, setPostConfirmOpen] = useState<boolean>(false);
  const [recalcConfirmOpen, setRecalcConfirmOpen] = useState<boolean>(false);

  // Rejection Form
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  // Rules & Policy
  const [rules, setRules] = useState<AttendanceBonusRule[]>([]);
  const [policyConfig, setPolicyConfig] = useState<AttendanceBonusPolicyConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AttendanceBonusAuditLog[]>([]);

  // Editing Rule
  const [editingRule, setEditingRule] = useState<Partial<AttendanceBonusRule> | null>(null);

  // 1. Fetch available periods
  useEffect(() => {
    fetch('/api/payroll/periods')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPeriods(data);
          const active = data.find((p) => p.status === 'Processing') || data[0];
          if (active) setSelectedPeriodId(active.id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch calculations and summary
  const loadData = useCallback(async () => {
    if (!selectedPeriodId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance-bonus/results?periodId=${encodeURIComponent(selectedPeriodId)}&limit=500`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setCalculations(data.calculations || []);
      } else {
        showToast(data.error || 'Failed to load bonus calculations', 'error');
      }
    } catch {
      showToast('Error loading bonus data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, showToast]);

  useEffect(() => {
    loadData();
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [loadData]);

  // 3. Fetch rules and policy configuration
  const loadRulesAndPolicy = useCallback(async () => {
    try {
      const [rulesRes, configRes] = await Promise.all([
        fetch('/api/attendance-bonus/rules?all=true').then((r) => r.json()),
        fetch('/api/attendance-bonus/config').then((r) => r.json()),
      ]);
      if (rulesRes.success) setRules(rulesRes.rules || []);
      if (configRes.success) setPolicyConfig(configRes.config);
    } catch {}
  }, []);

  // 4. Fetch audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance-bonus/audit-logs?periodId=${encodeURIComponent(selectedPeriodId)}&limit=100`);
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs || []);
    } catch {}
  }, [selectedPeriodId]);

  // Handle Calculate / Recalculate
  const handleCalculate = async (force: boolean = false) => {
    setCalculating(true);
    try {
      const res = await fetch('/api/attendance-bonus/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodId: selectedPeriodId, forceRecalculate: force }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Calculations completed successfully', 'success');
        await loadData();
      } else {
        showToast(data.error || 'Calculation failed', 'error');
      }
    } catch {
      showToast('Calculation error', 'error');
    } finally {
      setCalculating(false);
      setRecalcConfirmOpen(false);
    }
  };

  // Handle Submit for Review
  const handleSubmitReview = async () => {
    try {
      const res = await fetch('/api/attendance-bonus/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodId: selectedPeriodId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await loadData();
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Error submitting review', 'error');
    }
  };

  // Handle Approve
  const handleApprove = async (targetIds?: string[]) => {
    try {
      const res = await fetch('/api/attendance-bonus/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          calculationIds: targetIds && targetIds.length > 0 ? targetIds : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setSelectedIds(new Set());
        await loadData();
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Error approving bonus', 'error');
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    try {
      const targetIds = rejectTargetId ? [rejectTargetId] : Array.from(selectedIds);
      const res = await fetch('/api/attendance-bonus/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          reason: rejectionReason.trim(),
          calculationIds: targetIds.length > 0 ? targetIds : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setRejectModalOpen(false);
        setRejectionReason('');
        setRejectTargetId(null);
        setSelectedIds(new Set());
        await loadData();
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Error rejecting calculations', 'error');
    }
  };

  // Handle Post to Payroll
  const handlePostToPayroll = async () => {
    try {
      const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      const res = await fetch('/api/attendance-bonus/post-to-payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          calculationIds: targetIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setPostConfirmOpen(false);
        setSelectedIds(new Set());
        await loadData();
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Error transferring to payroll', 'error');
    }
  };

  // Filter and Sort Calculations
  const filteredCalculations = useMemo(() => {
    let result = [...calculations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.employee_id.toLowerCase().includes(q) ||
          (c.employee_name && c.employee_name.toLowerCase().includes(q)) ||
          (c.khmer_name && c.khmer_name.toLowerCase().includes(q)) ||
          (c.department_name && c.department_name.toLowerCase().includes(q))
      );
    }

    if (departmentFilter !== 'all') {
      result = result.filter((c) => c.department_id === departmentFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.calculation_status === statusFilter);
    }

    if (tierFilter !== 'all') {
      result = result.filter((c) => c.tier_name === tierFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [calculations, searchQuery, departmentFilter, statusFilter, tierFilter, sortField, sortOrder]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredCalculations.length / pageSize));
  const paginatedCalculations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCalculations.slice(start, start + pageSize);
  }, [filteredCalculations, currentPage, pageSize]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of calculations) {
      if (c.department_id && c.department_name) {
        map.set(c.department_id, c.department_name);
      }
    }
    return Array.from(map.entries());
  }, [calculations]);

  // Unique tiers for filter
  const tiers = useMemo(() => {
    const set = new Set<string>();
    for (const c of calculations) {
      if (c.tier_name) set.add(c.tier_name);
    }
    return Array.from(set);
  }, [calculations]);

  // Selection helpers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredCalculations.map((c) => c.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected =
    filteredCalculations.length > 0 && selectedIds.size === filteredCalculations.length;

  // View details modal
  const handleViewDetails = async (calc: AttendanceBonusCalculation) => {
    setSelectedEmployeeCalc(calc);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/attendance-bonus/results/${calc.id}`);
      const data = await res.json();
      if (data.success && data.calculation) {
        setSelectedEmployeeCalc(data.calculation);
      }
    } catch {}
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock size={12} />
            {isKm ? 'រង់ចាំត្រួតពិនិត្យ' : 'Pending Review'}
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Eye size={12} />
            {isKm ? 'បានពិនិត្យ' : 'Reviewed'}
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            {isKm ? 'អនុម័តរួច' : 'Approved'}
          </span>
        );
      case 'Posted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Lock size={12} />
            {isKm ? 'បានបញ្ចូលប្រាក់ខែ' : 'Posted to Payroll'}
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle size={12} />
            {isKm ? 'បដិសេធ' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-600 bg-slate-100">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isKm ? 'ប្រព័ន្ធគណនាប្រាក់រង្វាន់វត្តមានទៀងទាត់' : 'Attendance Bonus Calculation Module'}
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-md">
                  Automated Tiers
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isKm
                  ? 'គណនាស្វ័យប្រវត្តិតាមកំណត់ត្រាវត្តមានជាក់ស្ដែង ពិនិត្យអនុម័ត និងបញ្ចូលក្នុងបញ្ជីបើកប្រាក់បៀវត្សរ៍'
                  : 'Automated attendance tier matching, validated record calculation, HR review workflow & payroll posting.'}
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900">
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button
              onClick={() => {
                loadRulesAndPolicy();
                setRulesModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              title={isKm ? 'កំណត់រចនាសម្ព័ន្ធប្រាក់រង្វាន់' : 'Configure Bonus Tiers & Policy'}
            >
              <Settings size={14} />
              <span>{isKm ? 'កំណត់លក្ខខណ្ឌ' : 'Rules & Policy'}</span>
            </button>
          )}

          <button
            onClick={() => {
              loadAuditLogs();
              setAuditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            title={isKm ? 'កំណត់ត្រាសវនកម្ម' : 'View Audit History'}
          >
            <History size={14} />
            <span>{isKm ? 'សវនកម្ម' : 'Audit Logs'}</span>
          </button>

          <a
            href={`/api/attendance-bonus/export?periodId=${encodeURIComponent(selectedPeriodId)}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
          >
            <Download size={14} />
            <span>{isKm ? 'ទាញយក Excel/CSV' : 'Export Excel/CSV'}</span>
          </a>

          {canManage && (
            <button
              onClick={() => {
                if (calculations.length > 0) {
                  setRecalcConfirmOpen(true);
                } else {
                  handleCalculate(false);
                }
              }}
              disabled={calculating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
              <span>
                {calculating
                  ? isKm ? 'កំពុងគណនា...' : 'Calculating...'
                  : calculations.length > 0
                  ? isKm ? 'គណនាឡើងវិញ' : 'Recalculate'
                  : isKm ? 'គណនាប្រាក់រង្វាន់' : 'Calculate Bonuses'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Card 1: Total Employees */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{isKm ? 'បុគ្គលិកសរុប' : 'Total Employees'}</span>
              <Users size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_employees}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{summary.period_name}</div>
            </div>
          </div>

          {/* Card 2: Eligible Employees */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col justify-between bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-medium">{isKm ? 'មានសិទ្ធិទទួល' : 'Eligible'}</span>
              <CheckCircle2 size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary.eligible_employees}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">
                {summary.total_employees > 0
                  ? `${Math.round((summary.eligible_employees / summary.total_employees) * 100)}% of workforce`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* Card 3: Ineligible Employees */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{isKm ? 'គ្មានប្រាក់រង្វាន់' : 'No Bonus (<23d)'}</span>
              <AlertCircle size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {summary.ineligible_employees}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{isKm ? 'វត្តមានមិនគ្រប់' : 'Insufficient days'}</div>
            </div>
          </div>

          {/* Card 4: Total Attendance Bonus */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs flex flex-col justify-between bg-indigo-50/20">
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
              <span className="text-xs font-medium">{isKm ? 'ទឹកប្រាក់សរុប' : 'Total Bonus'}</span>
              <DollarSign size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                ${summary.total_bonus_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-indigo-600/80 mt-0.5">
                {summary.total_bonus_khr.toLocaleString()} KHR
              </div>
            </div>
          </div>

          {/* Card 5: Pending HR Review */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col justify-between bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-medium">{isKm ? 'រង់ចាំពិនិត្យ' : 'Pending Review'}</span>
              <Clock size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.pending_hr_review}
              </div>
              <div className="text-[10px] text-amber-600/80 mt-0.5">
                {summary.reviewed_count > 0 ? `${summary.reviewed_count} reviewed` : isKm ? 'ទាមទារ HR Review' : 'Needs HR action'}
              </div>
            </div>
          </div>

          {/* Card 6: Approved Bonus Amount */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col justify-between bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-medium">{isKm ? 'ទឹកប្រាក់អនុម័ត' : 'Approved Amount'}</span>
              <ShieldCheck size={16} />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                ${summary.approved_bonus_amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">
                {summary.approved_count + summary.posted_count} {isKm ? 'នាក់' : 'approved'}
              </div>
            </div>
          </div>

          {/* Card 7: Period Status */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{isKm ? 'ស្ថានភាពវដ្ត' : 'Cycle Status'}</span>
              <Lock size={16} />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {summary.period_status}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {summary.posted_count > 0 ? `${summary.posted_count} posted` : 'Unposted'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workflow Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isKm ? 'ស្វែងរកឈ្មោះ ឬអត្តលេខ...' : 'Search ID, name, department...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">{isKm ? 'គ្រប់ផ្នែកទាំងអស់' : 'All Departments'}</option>
            {departments.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">{isKm ? 'គ្រប់ស្ថានភាពទាំងអស់' : 'All Statuses'}</option>
            <option value="Pending">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Approved">Approved</option>
            <option value="Posted">Posted to Payroll</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">{isKm ? 'គ្រប់កម្រិត Tier ទាំងអស់' : 'All Tiers'}</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              onClick={handleSubmitReview}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition"
              title="Submit pending calculations for manager review"
            >
              <Send size={13} />
              <span>{isKm ? 'ដាក់ជូនពិនិត្យ' : 'Submit for Review'}</span>
            </button>
          )}

          {isHRManager && (
            <>
              <button
                onClick={() => handleApprove(selectedIds.size > 0 ? Array.from(selectedIds) : undefined)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                title="Approve selected or all reviewed calculations"
              >
                <Check size={13} />
                <span>
                  {selectedIds.size > 0
                    ? isKm
                      ? `អនុម័ត (${selectedIds.size})`
                      : `Approve Selected (${selectedIds.size})`
                    : isKm
                    ? 'អនុម័តទាំងអស់'
                    : 'Approve All'}
                </span>
              </button>

              <button
                onClick={() => {
                  setRejectTargetId(null);
                  setRejectModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition"
                title="Reject with mandatory reason"
              >
                <XCircle size={13} />
                <span>{isKm ? 'បដិសេធ' : 'Reject'}</span>
              </button>
            </>
          )}

          {isPayrollOfficer && (
            <button
              onClick={() => setPostConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition"
              title="Transfer approved attendance bonus amounts into employee payroll records"
            >
              <Lock size={13} />
              <span>{isKm ? 'បញ្ចូលក្នុងប្រាក់ខែ' : 'Post to Payroll'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-indigo-500" />
            <p className="text-sm font-medium">{isKm ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading attendance calculations...'}</p>
          </div>
        ) : filteredCalculations.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              {isKm ? 'មិនមានទិន្នន័យគណនាសម្រាប់វដ្តនេះឡើយ' : 'No calculations found for this period'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isKm
                ? 'សូមចុចប៊ូតុង «គណនាប្រាក់រង្វាន់» ខាងលើ ដើម្បីដំណើរការម៉ាស៊ីនគណនាស្វ័យប្រវត្តិតាមកំណត់ត្រាវត្តមាន។'
                : 'Click "Calculate Bonuses" above to process attendance records and generate monthly bonus eligibility.'}
            </p>
            {canManage && (
              <button
                onClick={() => handleCalculate(false)}
                disabled={calculating}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
              >
                <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
                <span>{isKm ? 'គណនាប្រាក់រង្វាន់ឥឡូវនេះ' : 'Calculate Bonuses Now'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    onClick={() => {
                      if (sortField === 'employee_id') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortField('employee_id');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isKm ? 'អត្តលេខ' : 'Employee ID'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    onClick={() => {
                      if (sortField === 'employee_name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortField('employee_name');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isKm ? 'ឈ្មោះបុគ្គលិក' : 'Employee Name'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="p-3.5">{isKm ? 'ផ្នែក' : 'Department'}</th>
                  <th className="p-3.5 text-center">{isKm ? 'ថ្ងៃកំណត់' : 'Scheduled'}</th>
                  <th
                    className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    onClick={() => {
                      if (sortField === 'attendance_days') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortField('attendance_days');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{isKm ? 'វត្តមានជាក់ស្ដែង' : 'Qualifying Days'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">{isKm ? 'កន្លះថ្ងៃ' : 'Half Days'}</th>
                  <th className="p-3.5 text-center">{isKm ? 'ច្បាប់' : 'Leave'}</th>
                  <th className="p-3.5 text-center text-rose-600">{isKm ? 'អវត្តមាន' : 'Absent'}</th>
                  <th className="p-3.5">{isKm ? 'កម្រិត Tier' : 'Attendance Tier'}</th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white font-bold"
                    onClick={() => {
                      if (sortField === 'bonus_amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortField('bonus_amount');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{isKm ? 'ប្រាក់រង្វាន់' : 'Bonus ($)'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="p-3.5 text-center">{isKm ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedCalculations.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {c.employee_id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {c.employee_name}
                        </div>
                        {c.khmer_name && (
                          <div className="text-[11px] text-slate-400 font-normal">{c.khmer_name}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <div>{c.department_name || '-'}</div>
                        {c.group_name && (
                          <div className="text-[10px] text-slate-400">{c.group_name}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-medium text-slate-600 dark:text-slate-300">
                        {c.scheduled_days}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {c.attendance_days.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-300">
                        {c.half_days > 0 ? (
                          <span className="text-amber-600 font-semibold">{c.half_days}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-300">
                        {c.approved_leave_days > 0 ? (
                          <span className="text-blue-600 font-semibold">{c.approved_leave_days}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {c.absent_days > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40">
                            {c.absent_days}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            c.bonus_amount >= 20
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : c.bonus_amount >= 15
                              ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300'
                              : c.bonus_amount >= 10
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                              : c.bonus_amount >= 5
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.tier_name || 'Ineligible'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <div
                          className={`font-bold ${
                            c.bonus_amount > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          ${c.bonus_amount.toFixed(2)}
                        </div>
                        {c.bonus_amount > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {c.bonus_amount_khr.toLocaleString()} KHR
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">{renderStatusBadge(c.calculation_status)}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(c)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                            title={isKm ? 'ពិនិត្យលម្អិត' : 'View Attendance Details & Calendar'}
                          >
                            <Eye size={14} />
                          </button>

                          {isHRManager && c.calculation_status !== 'Approved' && c.calculation_status !== 'Posted' && (
                            <button
                              onClick={() => handleApprove([c.id])}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                              title={isKm ? 'អនុម័តបុគ្គលិកនេះ' : 'Approve for this employee'}
                            >
                              <Check size={14} />
                            </button>
                          )}

                          {isHRManager && c.calculation_status !== 'Posted' && (
                            <button
                              onClick={() => {
                                setRejectTargetId(c.id);
                                setRejectModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              title={isKm ? 'បដិសេធ' : 'Reject with reason'}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                {isKm
                  ? `បង្ហាញ ${Math.min(filteredCalculations.length, (currentPage - 1) * pageSize + 1)} ដល់ ${Math.min(
                      filteredCalculations.length,
                      currentPage * pageSize
                    )} នៃ ${filteredCalculations.length} នាក់`
                  : `Showing ${Math.min(filteredCalculations.length, (currentPage - 1) * pageSize + 1)} to ${Math.min(
                      filteredCalculations.length,
                      currentPage * pageSize
                    )} of ${filteredCalculations.length} employees`}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 font-semibold text-slate-700 dark:text-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* EMPLOYEE DETAIL MODAL: MONTHLY CALENDAR & BREAKDOWN       */}
      {/* ========================================================= */}
      {detailModalOpen && selectedEmployeeCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                  {selectedEmployeeCalc.employee_name?.substring(0, 2) || 'EM'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedEmployeeCalc.employee_name}
                    {selectedEmployeeCalc.khmer_name && (
                      <span className="text-sm font-normal text-slate-500">
                        ({selectedEmployeeCalc.khmer_name})
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-medium">{selectedEmployeeCalc.employee_id}</span>
                    <span>•</span>
                    <span>{selectedEmployeeCalc.department_name}</span>
                    <span>•</span>
                    <span>{selectedEmployeeCalc.position || 'Staff'}</span>
                    <span>•</span>
                    <span>{selectedEmployeeCalc.period_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedEmployeeCalc.calculation_status)}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Calculated Award Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedEmployeeCalc.bonus_amount > 0
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    {isKm ? 'លទ្ធផលប្រាក់រង្វាន់វត្តមាន' : 'Attendance Bonus Award'}
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
                    <span>${selectedEmployeeCalc.bonus_amount.toFixed(2)} USD</span>
                    {selectedEmployeeCalc.bonus_amount > 0 && (
                      <span className="text-sm font-semibold text-slate-500">
                        ({selectedEmployeeCalc.bonus_amount_khr.toLocaleString()} KHR)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                    {selectedEmployeeCalc.tier_name || 'Ineligible'}
                  </div>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">Qualifying</div>
                    <div className="font-bold text-indigo-600 text-sm">
                      {selectedEmployeeCalc.attendance_days.toFixed(1)}d
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">Scheduled</div>
                    <div className="font-bold text-slate-700 text-sm">
                      {selectedEmployeeCalc.scheduled_days}d
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">Half Days</div>
                    <div className="font-bold text-amber-600 text-sm">
                      {selectedEmployeeCalc.half_days}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">Absences</div>
                    <div className="font-bold text-rose-600 text-sm">
                      {selectedEmployeeCalc.absent_days}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanations Card */}
              {selectedEmployeeCalc.details_json && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <div className="font-semibold flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-300">
                    <HelpCircle size={14} />
                    <span>{isKm ? 'ការពន្យល់អំពីការគណនា' : 'Calculation Audit Breakdown'}</span>
                  </div>
                  <p className="mb-1">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedEmployeeCalc.details_json);
                        return isKm
                          ? parsed.explanations?.explanationKm
                          : parsed.explanations?.explanationEn;
                      } catch {
                        return '';
                      }
                    })()}
                  </p>
                </div>
              )}

              {/* Monthly Attendance Calendar */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar size={15} />
                  <span>{isKm ? 'ប្រតិទិនវត្តមានប្រចាំខែ' : 'Monthly Attendance Days Calendar'}</span>
                </h4>

                {(() => {
                  try {
                    const parsed = selectedEmployeeCalc.details_json
                      ? JSON.parse(selectedEmployeeCalc.details_json)
                      : null;
                    const dailyDetails = parsed?.dailyDetails || [];

                    if (dailyDetails.length === 0) {
                      return <div className="text-xs text-slate-400">No daily records stored.</div>;
                    }

                    return (
                      <div className="grid grid-cols-7 gap-2">
                        {dailyDetails.map((day: any) => {
                          const isOff = day.is_rest_day || day.code === 'OFF';
                          const isPresent = day.code === '1';
                          const isHalf = day.is_half_day;
                          const isAbsent = day.code === 'AB';
                          const isLeave = day.code === 'AL' || day.code === 'SL' || day.code === 'HL';

                          return (
                            <div
                              key={day.date}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col justify-between ${
                                isAbsent
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800'
                                  : isHalf
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800'
                                  : isPresent
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800'
                                  : isLeave
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-700'
                              }`}
                            >
                              <div className="text-[10px] font-semibold text-slate-400">
                                {day.day_of_month} {day.day_of_week.substring(0, 3)}
                              </div>
                              <div className="text-xs font-bold my-1">
                                {isOff ? 'OFF' : day.code}
                              </div>
                              <div className="text-[9px] truncate">
                                {day.clock_in ? `${day.clock_in.substring(0, 5)}` : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>

              {/* Audit Trail Timeline */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {isKm ? 'ប្រវត្តិសវនកម្ម' : 'Approval & Calculation History'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">
                      Calculated on {new Date(selectedEmployeeCalc.calculated_at).toLocaleString()}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      by {selectedEmployeeCalc.calculated_by || 'System'}
                    </span>
                  </div>
                  {selectedEmployeeCalc.approved_by && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                      <span className="text-emerald-700 dark:text-emerald-300">
                        Approved on {new Date(selectedEmployeeCalc.approved_at || '').toLocaleString()}
                      </span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                        by {selectedEmployeeCalc.approved_by}
                      </span>
                    </div>
                  )}
                  {selectedEmployeeCalc.posted_to_payroll_at && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                      <span className="text-purple-700 dark:text-purple-300">
                        Posted to Payroll on {new Date(selectedEmployeeCalc.posted_to_payroll_at).toLocaleString()}
                      </span>
                      <span className="font-semibold text-purple-800 dark:text-purple-200">
                        by {selectedEmployeeCalc.posted_by || 'Payroll Officer'}
                      </span>
                    </div>
                  )}
                  {selectedEmployeeCalc.rejection_reason && (
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="font-bold">Rejection reason: </span>
                      <span>{selectedEmployeeCalc.rejection_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-white border border-slate-200 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                {isKm ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RULES & POLICY CONFIGURATION MODAL                        */}
      {/* ========================================================= */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings size={18} className="text-indigo-600" />
                  <span>{isKm ? 'កំណត់លក្ខខណ្ឌប្រាក់រង្វាន់វត្តមាន' : 'Attendance Bonus Rules & Policy'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKm
                    ? 'កែប្រែកម្រិត Tier ប្រាក់រង្វាន់ និងគោលការណ៍រាប់ច្បាប់ឈប់សម្រាក'
                    : 'Configure tier thresholds, bonus amounts, and qualifying leave policies.'}
                </p>
              </div>
              <button
                onClick={() => setRulesModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tiers Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isKm ? 'កម្រិត Tier ប្រាក់រង្វាន់' : 'Configured Bonus Tiers'}
                  </h4>
                  <button
                    onClick={() => {
                      setEditingRule({
                        rule_name: 'New Tier',
                        minimum_attendance_days: 22,
                        maximum_attendance_days: 23,
                        bonus_amount: 3.0,
                        currency: 'USD',
                        is_active: 1,
                        priority: rules.length + 1,
                      });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 transition"
                  >
                    <Plus size={13} />
                    <span>{isKm ? 'បន្ថែម Tier ថ្មី' : 'Add New Tier'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">{isKm ? 'ឈ្មោះ Tier' : 'Tier Name'}</th>
                        <th className="p-3 text-center">{isKm ? 'អប្បបរមា' : 'Min Days'}</th>
                        <th className="p-3 text-center">{isKm ? 'អតិបរមា' : 'Max Days'}</th>
                        <th className="p-3 text-right">{isKm ? 'ប្រាក់រង្វាន់' : 'Bonus ($)'}</th>
                        <th className="p-3 text-center">{isKm ? 'ស្ថានភាព' : 'Active'}</th>
                        <th className="p-3 text-center">{isKm ? 'សកម្មភាព' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rules.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {r.rule_name}
                          </td>
                          <td className="p-3 text-center font-mono">{r.minimum_attendance_days}</td>
                          <td className="p-3 text-center font-mono">
                            {r.maximum_attendance_days !== null ? r.maximum_attendance_days : 'No limit (≥)'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            ${r.bonus_amount.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {r.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setEditingRule(r)}
                                className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Rule Form (if active) */}
              {editingRule && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                  <div className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                    {editingRule.id ? 'Edit Tier Rule' : 'Create New Tier Rule'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Tier Name</label>
                      <input
                        type="text"
                        value={editingRule.rule_name || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Minimum Days</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingRule.minimum_attendance_days ?? ''}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            minimum_attendance_days: parseFloat(e.target.value),
                          })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Maximum Days</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Leave blank for top tier"
                        value={editingRule.maximum_attendance_days ?? ''}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            maximum_attendance_days: e.target.value === '' ? null : parseFloat(e.target.value),
                          })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Bonus Amount ($)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingRule.bonus_amount ?? ''}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            bonus_amount: parseFloat(e.target.value),
                          })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingRule(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!editingRule.rule_name || editingRule.minimum_attendance_days === undefined || editingRule.bonus_amount === undefined) {
                          showToast('Please fill all required fields', 'error');
                          return;
                        }
                        try {
                          const url = editingRule.id
                            ? `/api/attendance-bonus/rules/${editingRule.id}`
                            : '/api/attendance-bonus/rules';
                          const method = editingRule.id ? 'PUT' : 'POST';
                          const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(editingRule),
                          });
                          const data = await res.json();
                          if (data.success) {
                            showToast('Rule saved successfully', 'success');
                            setEditingRule(null);
                            loadRulesAndPolicy();
                          } else {
                            showToast(data.error, 'error');
                          }
                        } catch {
                          showToast('Failed to save rule', 'error');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Save Rule
                    </button>
                  </div>
                </div>
              )}

              {/* Leave Policy Settings */}
              {policyConfig && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isKm ? 'គោលការណ៍រាប់ច្បាប់ឈប់សម្រាក (Qualifying Leave Policy)' : 'Qualifying Leave Policy Settings'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isKm
                      ? 'កំណត់ប្រភេទច្បាប់ឈប់សម្រាកដែលត្រូវរាប់បញ្ចូលជាថ្ងៃវត្តមានសម្រាប់គណនាប្រាក់រង្វាន់'
                      : 'Define which approved leave categories qualify as attendance days for bonus calculation.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={policyConfig.count_annual_leave}
                        onChange={(e) =>
                          setPolicyConfig({ ...policyConfig, count_annual_leave: e.target.checked })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Count Approved Annual Leave (AL)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={policyConfig.count_sick_leave}
                        onChange={(e) =>
                          setPolicyConfig({ ...policyConfig, count_sick_leave: e.target.checked })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Count Approved Sick Leave (SL)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={policyConfig.count_public_holidays}
                        onChange={(e) =>
                          setPolicyConfig({ ...policyConfig, count_public_holidays: e.target.checked })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Count Public Holidays (HL)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={policyConfig.count_maternity_leave}
                        onChange={(e) =>
                          setPolicyConfig({ ...policyConfig, count_maternity_leave: e.target.checked })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Count Maternity Leave (ML)</span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/attendance-bonus/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(policyConfig),
                          });
                          const data = await res.json();
                          if (data.success) {
                            showToast('Policy configuration saved successfully', 'success');
                          } else {
                            showToast(data.error, 'error');
                          }
                        } catch {
                          showToast('Error saving policy', 'error');
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
                    >
                      {isKm ? 'រក្សាទុកគោលការណ៍' : 'Save Policy Settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AUDIT LOGS MODAL                                          */}
      {/* ========================================================= */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-indigo-600" />
                  <span>{isKm ? 'កំណត់ត្រាសវនកម្មប្រាក់រង្វាន់វត្តមាន' : 'Attendance Bonus Audit Trail'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete immutable ledger of calculations, reviews, approvals, and payroll transfers.
                </p>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                        {log.action}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {log.reason || 'Action recorded'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>User: {log.performed_by}</span>
                      {log.previous_status && log.new_status && (
                        <span>
                          Status: {log.previous_status} → {log.new_status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REJECTION REASON MODAL                                    */}
      {/* ========================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isKm ? 'បញ្ជាក់ការបដិសេធ' : 'Reject Bonus Calculation'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {isKm
                ? 'សូមបញ្ចូលមូលហេតុច្បាស់លាស់នៃការបដិសេធ។ មូលហេតុនេះនឹងត្រូវកត់ត្រាក្នុងសវនកម្ម។'
                : 'Please specify the exact reason for rejection. This audit reason will be permanently recorded.'}
            </p>
            <textarea
              rows={3}
              placeholder={isKm ? 'បញ្ចូលមូលហេតុ...' : 'e.g. Unverified half-day records on 2026-10-15...'}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason('');
                  setRejectTargetId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                {isKm ? 'បញ្ជាក់បដិសេធ' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POST TO PAYROLL CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {postConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-purple-600">
              <Lock size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isKm ? 'ផ្ទេរប្រាក់រង្វាន់ចូលបញ្ជីប្រាក់ខែ' : 'Post to Payroll Ledger'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'តើលោកអ្នកពិតជាចង់ផ្ទេរប្រាក់រង្វាន់វត្តមានដែលបានអនុម័តទាំងអស់ចូលទៅក្នុងបញ្ជីបើកប្រាក់បៀវត្សរ៍ប្រចាំខែមែនទេ? បន្ទាប់ពីផ្ទេររួច វានឹងត្រូវបានចាក់សោ (Locked)។'
                : 'Are you sure you want to transfer all approved attendance bonus calculations into the monthly payroll ledger? Once transferred, records are locked as Posted.'}
            </p>
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs text-purple-900 dark:text-purple-200">
              <div className="font-bold mb-1">Transfer Summary:</div>
              <div>Period: {summary?.period_name}</div>
              <div>Approved Employees: {summary?.approved_count}</div>
              <div>Total Bonus Amount: ${summary?.approved_bonus_amount_usd.toFixed(2)} USD</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPostConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handlePostToPayroll}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition"
              >
                {isKm ? 'បញ្ជាក់ការផ្ទេរ' : 'Confirm & Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECALCULATE CONFIRMATION MODAL                            */}
      {/* ========================================================= */}
      {recalcConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <RefreshCw size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isKm ? 'បញ្ជាក់ការគណនាឡើងវិញ' : 'Confirm Recalculation'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'ការគណនាឡើងវិញនឹងធ្វើបច្ចុប្បន្នភាពទិន្នន័យវត្តមាន និងច្បាប់ឈប់សម្រាកចុងក្រោយបំផុត។ កំណត់ត្រាដែលបានបញ្ជូនទៅប្រាក់ខែ (Posted) នឹងត្រូវបានរក្សាទុកដោយសុវត្ថិភាព។'
                : 'Recalculating will synchronize recent attendance logs, corrections, and leave changes. Previously posted records will remain securely protected.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRecalcConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={() => handleCalculate(true)}
                disabled={calculating}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                {calculating ? 'Processing...' : isKm ? 'ចាប់ផ្តើមគណនា' : 'Proceed with Recalculation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
