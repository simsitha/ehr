'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PositionPayment, PositionPaymentSummary, PositionPaymentType, PositionPaymentStatus, PositionPaymentCurrency } from '@/lib/types';

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  khmer_name?: string | null;
  role?: string;
  department_id?: string;
  department_name?: string;
  avatar?: string;
  status: string;
}

interface PeriodOption {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function PositionPaymentManager({
  initialPeriod,
  onPayrollUpdated,
}: {
  initialPeriod?: string;
  onPayrollUpdated?: () => void;
}) {
  const { language, showToast } = useApp();

  // State
  const [payments, setPayments] = useState<PositionPayment[]>([]);
  const [summary, setSummary] = useState<PositionPaymentSummary>({
    totalPayments: 0,
    totalUsdAmount: 0,
    totalKhrAmount: 0,
    distinctEmployeesCount: 0,
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod || 'October 2026');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof PositionPayment>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PositionPayment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<PositionPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PositionPayment | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formPaymentName, setFormPaymentName] = useState('Position Allowance');
  const [formPaymentType, setFormPaymentType] = useState<PositionPaymentType>('Allowance');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<PositionPaymentCurrency>('USD');
  const [formPayrollPeriod, setFormPayrollPeriod] = useState(selectedPeriod);
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formTaxable, setFormTaxable] = useState(true);
  const [formIncludeNssf, setFormIncludeNssf] = useState(true);
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState<PositionPaymentStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Employee Dropdown Search
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const empDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target as Node)) {
        setEmpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Employee Details
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === formEmployeeId) || null;
  }, [employees, formEmployeeId]);

  // Is current selected period locked?
  const currentPeriodObj = useMemo(() => {
    return periods.find((p) => p.name === selectedPeriod || p.id === selectedPeriod);
  }, [periods, selectedPeriod]);

  const isCurrentPeriodLocked = useMemo(() => {
    if (!currentPeriodObj) return false;
    const s = (currentPeriodObj.status || '').toLowerCase();
    return s === 'locked' || s === 'paid' || s === 'finalized';
  }, [currentPeriodObj]);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch periods
      const periodsRes = await fetch('/api/payroll/periods');
      if (periodsRes.ok) {
        const periodData = await periodsRes.json();
        if (Array.isArray(periodData)) {
          setPeriods(periodData);
          if (!selectedPeriod && periodData.length > 0) {
            setSelectedPeriod(periodData[0].name);
          }
        }
      }

      // 2. Fetch employees
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        if (Array.isArray(empData)) {
          setEmployees(empData);
        }
      }

      // 3. Fetch position payments
      await fetchPayments();
      await fetchSummary();
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const url = new URL('/api/payroll/position-payments', window.location.origin);
      if (selectedPeriod && selectedPeriod !== 'all') {
        url.searchParams.set('payroll_period', selectedPeriod);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPayments(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const url = new URL('/api/payroll/position-payments/summary', window.location.origin);
      if (selectedPeriod && selectedPeriod !== 'all') {
        url.searchParams.set('period', selectedPeriod);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSummary(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    await fetchSummary();
    setRefreshing(false);
    showToast(language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យ' : 'Position payments refreshed', 'info');
  };

  // Filtered employees for dropdown
  const filteredEmployeesForDropdown = useMemo(() => {
    const q = empSearchQuery.trim().toLowerCase();
    // Default to active employees
    return employees
      .filter((e) => e.status === 'Active')
      .filter((e) => {
        if (!q) return true;
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
        const khmer = (e.khmer_name || '').toLowerCase();
        const id = e.id.toLowerCase();
        const dept = (e.department_name || '').toLowerCase();
        const role = (e.role || '').toLowerCase();
        return fullName.includes(q) || khmer.includes(q) || id.includes(q) || dept.includes(q) || role.includes(q);
      });
  }, [employees, empSearchQuery]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department_id && e.department_name) {
        map.set(e.department_id, e.department_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Department
      if (departmentFilter !== 'all' && p.department_id !== departmentFilter) {
        return false;
      }
      // Type
      if (typeFilter !== 'all' && p.payment_type !== typeFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const empName = (p.employee_name || '').toLowerCase();
        const khmer = (p.khmer_name || '').toLowerCase();
        const empId = p.employee_id.toLowerCase();
        const payName = p.payment_name.toLowerCase();
        const pos = (p.current_position || '').toLowerCase();
        const dept = (p.department_name || '').toLowerCase();
        if (
          !empName.includes(q) &&
          !khmer.includes(q) &&
          !empId.includes(q) &&
          !payName.includes(q) &&
          !pos.includes(q) &&
          !dept.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [payments, departmentFilter, typeFilter, statusFilter, searchTerm]);

  // Sorted payments
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredPayments, sortField, sortOrder]);

  // Paginated payments
  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPayments.slice(start, start + pageSize);
  }, [sortedPayments, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, typeFilter, statusFilter, pageSize]);

  const handleSort = (field: keyof PositionPayment) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Open Form for Create
  const handleOpenCreateModal = () => {
    setEditingPayment(null);
    setFormEmployeeId('');
    setFormPaymentName('Position Allowance');
    setFormPaymentType('Allowance');
    setFormAmount('');
    setFormCurrency('USD');
    setFormPayrollPeriod(selectedPeriod || 'October 2026');
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormTaxable(true);
    setFormIncludeNssf(true);
    setFormRemarks('');
    setFormStatus('Active');
    setFormError(null);
    setEmpSearchQuery('');
    setEmpDropdownOpen(false);
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (payment: PositionPayment) => {
    setEditingPayment(payment);
    setFormEmployeeId(payment.employee_id);
    setFormPaymentName(payment.payment_name);
    setFormPaymentType(payment.payment_type);
    setFormAmount(String(payment.amount));
    setFormCurrency(payment.currency);
    setFormPayrollPeriod(payment.payroll_period);
    setFormEffectiveDate(payment.effective_date);
    setFormEndDate(payment.end_date || '');
    setFormTaxable(payment.taxable ?? true);
    setFormIncludeNssf(payment.include_in_nssf ?? true);
    setFormRemarks(payment.remarks || '');
    setFormStatus(payment.status);
    setFormError(null);
    setEmpSearchQuery('');
    setEmpDropdownOpen(false);
    setIsFormModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmployeeId) {
      setFormError(language === 'km' ? 'សូមជ្រើសរើសបុគ្គលិក' : 'Please select an employee.');
      return;
    }
    if (!formPaymentName.trim()) {
      setFormError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះប្រាក់ឧបត្ថម្ភ' : 'Payment Name is required.');
      return;
    }
    const numAmt = parseFloat(formAmount);
    if (isNaN(numAmt) || numAmt < 0) {
      setFormError(language === 'km' ? 'ចំនួនទឹកប្រាក់ត្រូវតែធំជាង ឬស្មើ ០' : 'Payment Amount must be a valid number ≥ 0.');
      return;
    }
    if (!formEffectiveDate) {
      setFormError(language === 'km' ? 'សូមជ្រើសរើសកាលបរិច្ឆេទអនុវត្ត' : 'Effective Date is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        employee_id: formEmployeeId,
        payment_name: formPaymentName.trim(),
        payment_type: formPaymentType,
        amount: numAmt,
        currency: formCurrency,
        payroll_period: formPayrollPeriod,
        effective_date: formEffectiveDate,
        end_date: formEndDate.trim() ? formEndDate : null,
        taxable: formTaxable,
        include_in_nssf: formIncludeNssf,
        remarks: formRemarks.trim() || null,
        status: formStatus,
      };

      let res: Response;
      if (editingPayment) {
        res = await fetch(`/api/payroll/position-payments/${editingPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/payroll/position-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save position payment.');
      }

      showToast(
        editingPayment
          ? language === 'km'
            ? 'បានកែប្រែប្រាក់ឧបត្ថម្ភមុខតំណែងដោយជោគជ័យ'
            : 'Position payment updated successfully.'
          : language === 'km'
          ? 'បានបន្ថែមប្រាក់ឧបត្ថម្ភមុខតំណែងដោយជោគជ័យ'
          : 'Position payment added and synced with payroll ledger.',
        'success'
      );

      setIsFormModalOpen(false);
      await fetchPayments();
      await fetchSummary();
      if (onPayrollUpdated) onPayrollUpdated();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (payment: PositionPayment) => {
    const nextStatus = payment.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/payroll/position-payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to change status.');
      }
      showToast(
        language === 'km'
          ? `បានប្តូរស្ថានភាពទៅជា ${nextStatus === 'Active' ? 'សកម្ម' : 'អសកម្ម'}`
          : `Position payment marked as ${nextStatus}.`,
        'success'
      );
      await fetchPayments();
      await fetchSummary();
      if (onPayrollUpdated) onPayrollUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;
    try {
      const res = await fetch(`/api/payroll/position-payments/${deletingPayment.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete payment.');
      }
      showToast(
        language === 'km'
          ? 'បានលុបប្រាក់ឧបត្ថម្ភមុខតំណែង និងដកចេញពីបញ្ជីបើកប្រាក់បៀវត្សរ៍'
          : 'Position payment deleted and removed from payroll ledger.',
        'success'
      );
      setDeletingPayment(null);
      await fetchPayments();
      await fetchSummary();
      if (onPayrollUpdated) onPayrollUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (sortedPayments.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No position payment records to export.', 'info');
      return;
    }

    const headers = [
      'No',
      'Employee ID',
      'Employee Name',
      'Khmer Name',
      'Department',
      'Position',
      'Payment Name',
      'Payment Type',
      'Amount',
      'Currency',
      'Payroll Period',
      'Effective Date',
      'End Date',
      'Status',
      'Created By',
      'Created At',
      'Remarks',
    ];

    const rows = sortedPayments.map((p, idx) => [
      idx + 1,
      `"${p.employee_id}"`,
      `"${p.employee_name || ''}"`,
      `"${p.khmer_name || ''}"`,
      `"${p.department_name || ''}"`,
      `"${p.current_position || ''}"`,
      `"${p.payment_name}"`,
      `"${p.payment_type}"`,
      p.amount,
      `"${p.currency}"`,
      `"${p.payroll_period}"`,
      `"${p.effective_date}"`,
      `"${p.end_date || ''}"`,
      `"${p.status}"`,
      `"${p.created_by || ''}"`,
      `"${p.created_at}"`,
      `"${(p.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Position_Payments_${selectedPeriod.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(language === 'km' ? 'បានទាញយកឯកសារ CSV' : 'Exported to CSV successfully.', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-200/50 dark:border-amber-700/50">
            <Briefcase size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'km' ? 'ការគ្រប់គ្រងប្រាក់ឧបត្ថម្ភមុខតំណែង' : 'Position Payment Management'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                Auto-Synced to Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {language === 'km'
                ? 'កំណត់ប្រាក់ឧបត្ថម្ភមុខតំណែង និងប្រាក់ទទួលខុសត្រូវបន្ថែម រួមបញ្ចូលស្វ័យប្រវត្តក្នុងបញ្ជីបើកប្រាក់បៀវត្សរ៍'
                : 'Assign supervisory allowances & acting manager payments integrated automatically into Factory Payroll'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {language === 'km' ? 'វដ្តបើក' : 'Period'}:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.name} className="dark:bg-slate-900">
                  {p.name} {p.status === 'Locked' || p.status === 'Paid' ? `(${p.status})` : ''}
                </option>
              ))}
            </select>
            {isCurrentPeriodLocked ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <Lock size={10} /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Unlock size={10} /> Open
              </span>
            )}
          </div>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Export to CSV"
          >
            <Download size={14} className="text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          {/* Add Position Payment Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>{language === 'km' ? 'បន្ថែមប្រាក់ឧបត្ថម្ភមុខតំណែង' : 'Add Position Payment'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Position Payments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ចំនួនប្រាក់ឧបត្ថម្ភសរុប' : 'Total Payments'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {summary.totalPayments}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">active entries</span>
          </div>
        </div>

        {/* Card 2: Total USD Amount */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ទឹកប្រាក់ដុល្លារសរុប (USD)' : 'Total USD Amount'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ${summary.totalUsdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">USD</span>
          </div>
        </div>

        {/* Card 3: Total KHR Amount */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'ទឹកប្រាក់រៀលសរុប (KHR)' : 'Total KHR Amount'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <span className="font-bold font-mono text-sm">៛</span>
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              ៛ {summary.totalKhrAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">KHR</span>
          </div>
        </div>

        {/* Card 4: Employees Receiving Payments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'km' ? 'បុគ្គលិកទទួលប្រាក់ឧបត្ថម្ភ' : 'Employees Receiving'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {summary.distinctEmployeesCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">staff members</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ អត្តលេខ ឬមុខតំណែង...' : 'Search by name, ID, position, or payment name...'}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់ (All Depts)' : 'All Departments'}</option>
              {departmentsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទ (All Types)' : 'All Payment Types'}</option>
              <option value="Allowance">Allowance</option>
              <option value="Bonus">Bonus</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព (All Status)' : 'All Status'}</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filter Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            {language === 'km' ? 'បង្ហាញ' : 'Showing'}{' '}
            <strong className="text-slate-900 dark:text-white">{sortedPayments.length}</strong>{' '}
            {language === 'km' ? 'ប្រាក់ឧបត្ថម្ភ' : 'position payment records'}
          </span>
          {(searchTerm || departmentFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              {language === 'km' ? 'សម្អាត Filter' : 'Clear Filters'}
            </button>
          )}
        </div>
      </div>

      {/* Position Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('employee_id')}>
                  <div className="flex items-center gap-1">
                    <span>{language === 'km' ? 'អត្តលេខ' : 'Staff ID'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('employee_name')}>
                  <div className="flex items-center gap-1">
                    <span>{language === 'km' ? 'ឈ្មោះបុគ្គលិក' : 'Employee Name'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3">{language === 'km' ? 'ផ្នែក' : 'Department'}</th>
                <th className="p-3">{language === 'km' ? 'មុខតំណែងបច្ចុប្បន្ន' : 'Current Position'}</th>
                <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('payment_name')}>
                  <div className="flex items-center gap-1">
                    <span>{language === 'km' ? 'ឈ្មោះប្រាក់ឧបត្ថម្ភ' : 'Payment Name'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>{language === 'km' ? 'ទឹកប្រាក់' : 'Amount'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3 text-center">{language === 'km' ? 'រូបិយប័ណ្ណ' : 'Currency'}</th>
                <th className="p-3">{language === 'km' ? 'វដ្តបើក' : 'Period'}</th>
                <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('effective_date')}>
                  <div className="flex items-center gap-1">
                    <span>{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Effective Date'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>{language === 'km' ? 'ស្ថានភាព' : 'Status'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3">{language === 'km' ? 'អ្នកបង្កើត' : 'Created By'}</th>
                <th className="p-3 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-indigo-600" />
                      <span>Loading position payments...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Briefcase size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {language === 'km' ? 'គ្មានទិន្នន័យប្រាក់ឧបត្ថម្ភមុខតំណែង' : 'No position payments found'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {language === 'km'
                          ? 'សូមចុច "បន្ថែមប្រាក់ឧបត្ថម្ភមុខតំណែង" ដើម្បីបង្កើតថ្មី'
                          : 'Click "Add Position Payment" to assign supervisory allowances to employees.'}
                      </p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-colors"
                      >
                        + {language === 'km' ? 'បន្ថែមថ្មី' : 'Add New Payment'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => {
                  const isInactive = p.status === 'Inactive';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isInactive ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {p.employee_id}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {p.employee_name}
                        </div>
                        {p.khmer_name && (
                          <div className="text-[10px] text-slate-400 font-khmer">{p.khmer_name}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {p.department_name || 'General'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {p.current_position || 'Staff'}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{p.payment_name}</span>
                          {p.payment_type !== 'Allowance' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              {p.payment_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm">
                        {p.currency === 'KHR' ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            ៛ {p.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ${p.amount.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.currency === 'KHR'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {p.currency}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                        {p.payroll_period}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {p.effective_date}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {p.status === 'Active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {p.created_by || 'Admin'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            onClick={() => setViewingPayment(p)}
                            title="View Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Payment"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Activate/Deactivate */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === 'Active' ? 'Deactivate Payment' : 'Activate Payment'}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              p.status === 'Active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            {p.status === 'Active' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingPayment(p)}
                            title="Delete Payment"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedPayments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{language === 'km' ? 'ជួរដេកក្នុងមួយទំព័រ' : 'Rows per page'}:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-700 dark:text-slate-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, sortedPayments.length)} of {sortedPayments.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Position Payment Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingPayment
                      ? language === 'km'
                        ? 'កែប្រែប្រាក់ឧបត្ថម្ភមុខតំណែង'
                        : 'Edit Position Payment'
                      : language === 'km'
                      ? 'បន្ថែមប្រាក់ឧបត្ថម្ភមុខតំណែង'
                      : 'Add Position Payment'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'km'
                      ? 'កំណត់ប្រាក់ឧបត្ថម្ភ និងរួមបញ្ចូលក្នុងបញ្ជីបើកប្រាក់បៀវត្សរ៍'
                      : 'Assign position allowance to automatically integrate into payroll calculation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-4 flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Locked Period Warning */}
              {isCurrentPeriodLocked && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Lock size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>{language === 'km' ? 'វដ្តបើកប្រាក់ខែត្រូវបានចាក់សោរ' : 'Payroll Period is Locked'}:</strong>{' '}
                    {currentPeriodObj?.status}. {language === 'km' ? 'មិនអាចកែប្រែ ឬបន្ថែមប្រាក់ឧបត្ថម្ភបានទេ' : 'Modifications are restricted unless the period is unlocked.'}
                  </div>
                </div>
              )}

              {/* 1. Employee Selection Section */}
              <div className="space-y-1.5" ref={empDropdownRef}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'km' ? 'ជ្រើសរើសបុគ្គលិក (Employee)' : 'Select Employee'}{' '}
                  <span className="text-rose-500">*</span>
                </label>

                {editingPayment ? (
                  // Locked employee on edit
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {editingPayment.employee_id}
                      </span>
                      <span className="mx-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {editingPayment.employee_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({editingPayment.department_name || 'General'} &bull; {editingPayment.current_position || 'Staff'})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Fixed</span>
                  </div>
                ) : (
                  // Searchable Dropdown for Create
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {selectedEmployee ? (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {selectedEmployee.id}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedEmployee.first_name} {selectedEmployee.last_name}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {selectedEmployee.department_name || 'General'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {selectedEmployee.role || 'Staff'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          {language === 'km' ? '-- ស្វែងរក និងជ្រើសរើសបុគ្គលិក --' : '-- Search and select an employee --'}
                        </span>
                      )}
                      <Filter size={13} className="text-slate-400 shrink-0 ml-2" />
                    </button>

                    {empDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              value={empSearchQuery}
                              onChange={(e) => setEmpSearchQuery(e.target.value)}
                              placeholder={language === 'km' ? 'វាយឈ្មោះ ឬអត្តលេខ...' : 'Type employee name or ID...'}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredEmployeesForDropdown.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              {language === 'km' ? 'រកមិនឃើញបុគ្គលិក' : 'No active employees match query'}
                            </div>
                          ) : (
                            filteredEmployeesForDropdown.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setFormEmployeeId(emp.id);
                                  setEmpDropdownOpen(false);
                                  setEmpSearchQuery('');
                                }}
                                className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                                  formEmployeeId === emp.id ? 'bg-indigo-50/40 dark:bg-slate-800 font-bold' : ''
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                      {emp.id}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      {emp.first_name} {emp.last_name}
                                    </span>
                                    {emp.khmer_name && (
                                      <span className="text-[10px] text-slate-400 font-khmer">
                                        ({emp.khmer_name})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {emp.department_name || 'General'} &bull; {emp.role || 'Staff'}
                                  </div>
                                </div>
                                {formEmployeeId === emp.id && (
                                  <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Auto-populated details card */}
                {selectedEmployee && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Staff ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedEmployee.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Name</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Department</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                        {selectedEmployee.department_name || 'General'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Current Position</span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate block">
                        {selectedEmployee.role || 'Staff'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Payment Name & Suggestions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'km' ? 'ឈ្មោះប្រាក់ឧបត្ថម្ភ (Payment Name)' : 'Payment Name'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formPaymentName}
                  onChange={(e) => setFormPaymentName(e.target.value)}
                  placeholder="e.g. Acting Manager Allowance, Position Allowance"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                {/* Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Position Allowance',
                    'Acting Manager Allowance',
                    'Lead Supervisor Allowance',
                    'Special Position Payment',
                    'Shift In-charge Allowance',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setFormPaymentName(sug)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                        formPaymentName === sug
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Amount, Currency, Payment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'ចំនួនទឹកប្រាក់ (Amount)' : 'Payment Amount'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'រូបិយប័ណ្ណ (Currency)' : 'Currency'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as PositionPaymentCurrency)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>

                {/* Payment Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'ប្រភេទ (Type)' : 'Payment Type'}
                  </label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => setFormPaymentType(e.target.value as PositionPaymentType)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Allowance">Allowance</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* 4. Payroll Period & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payroll Period */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'វដ្តបើក (Payroll Period)' : 'Payroll Period'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPayrollPeriod}
                    onChange={(e) => setFormPayrollPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Effective Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'កាលបរិច្ឆេទអនុវត្ត (Effective)' : 'Effective Date'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formEffectiveDate}
                    onChange={(e) => setFormEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'km' ? 'កាលបរិច្ឆេទបញ្ចប់ (End Date)' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* 5. Statutory Treatment & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Taxable */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formTaxable}
                    onChange={(e) => setFormTaxable(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {language === 'km' ? 'ជាប់ពន្ធបៀវត្ស' : 'Taxable (GDT)'}
                    </span>
                    <span className="text-[10px] text-slate-400">Subject to progressive tax</span>
                  </div>
                </label>

                {/* Include in NSSF */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIncludeNssf}
                    onChange={(e) => setFormIncludeNssf(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {language === 'km' ? 'ជាប់ ប.ស.ស' : 'Include in NSSF'}
                    </span>
                    <span className="text-[10px] text-slate-400">Pension contributory base</span>
                  </div>
                </label>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PositionPaymentStatus)}
                    className="w-full px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* 6. Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'km' ? 'កំណត់ចំណាំ (Remarks)' : 'Remarks / Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Justification, supervisory role approval, internal ref..."
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || (isCurrentPeriodLocked && !editingPayment)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[2.5]" />
                      <span>{language === 'km' ? 'រក្សាទុក' : 'Save Position Payment'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {viewingPayment.payment_name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{viewingPayment.id}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Employee Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {viewingPayment.employee_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingPayment.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {viewingPayment.status}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {viewingPayment.employee_name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {viewingPayment.department_name || 'General'} &bull; {viewingPayment.current_position || 'Staff'}
                </div>
              </div>

              {/* Payment Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Amount</span>
                  <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                    {viewingPayment.currency === 'KHR'
                      ? `៛ ${viewingPayment.amount.toLocaleString()}`
                      : `$${viewingPayment.amount.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{viewingPayment.currency}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payroll Period</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                    {viewingPayment.payroll_period}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Type: {viewingPayment.payment_type}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Effective Date</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                    {viewingPayment.effective_date}
                  </span>
                  {viewingPayment.end_date && (
                    <span className="text-[10px] text-slate-400 block">End: {viewingPayment.end_date}</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Statutory Rules</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold block">
                    {viewingPayment.taxable ? 'Taxable (GDT)' : 'Non-Taxable'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {viewingPayment.include_in_nssf ? 'Included in NSSF Pension' : 'Excluded from NSSF'}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              {viewingPayment.remarks && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Remarks</span>
                  <p className="text-slate-700 dark:text-slate-300">{viewingPayment.remarks}</p>
                </div>
              )}

              {/* Audit trail */}
              <div className="text-[10px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>Created By: <strong>{viewingPayment.created_by || 'Admin'}</strong> on {viewingPayment.created_at}</div>
                {viewingPayment.updated_at && (
                  <div>Last Updated: {viewingPayment.updated_at} ({viewingPayment.updated_by || 'Admin'})</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'km' ? 'បញ្ជាក់ការលុប' : 'Confirm Delete Position Payment'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបប្រាក់ឧបត្ថម្ភនេះទេ?' : 'Are you sure you want to delete this position payment?'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900 text-xs space-y-1">
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Employee:</strong>{' '}
                {deletingPayment.employee_name} ({deletingPayment.employee_id})
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Payment:</strong>{' '}
                {deletingPayment.payment_name}
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Amount:</strong>{' '}
                {deletingPayment.currency === 'KHR'
                  ? `៛ ${deletingPayment.amount.toLocaleString()}`
                  : `$${deletingPayment.amount.toFixed(2)}`}
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Period:</strong>{' '}
                {deletingPayment.payroll_period}
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                {language === 'km'
                  ? '⚠️ ការលុបនេះនឹងកាត់បន្ថយប្រាក់បៀវត្សរ៍សរុប (Gross Pay) របស់បុគ្គលិកដោយស្វ័យប្រវត្ត។'
                  : '⚠️ This will automatically recalculate and reduce the employee\'s Factory Payroll Ledger gross pay.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {language === 'km' ? 'លុបចេញ' : 'Delete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
