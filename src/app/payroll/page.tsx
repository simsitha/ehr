'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText } from '@/lib/translations';
import { PayrollRecord, PayrollPeriod } from '@/lib/types';
import {
  CreditCard,
  Calendar,
  Search,
  Download,
  Printer,
  FileText,
  X,
  Plus,
  Calculator,
  FileSpreadsheet,
  Lock,
  Unlock,
  Settings,
  Scissors,
  Layers,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  Briefcase,
} from 'lucide-react';
import PayrollImportModal from '@/components/PayrollImportModal';
import SewingBonusManager from '@/components/payroll/SewingBonusManager';
import AttendanceBonusManager from '@/components/attendance/AttendanceBonusManager';
import PositionPaymentManager from '@/components/payroll/PositionPaymentManager';
import PayrollReconciliationModal from '@/components/payroll/PayrollReconciliationModal';
import PayrollRulesModal from '@/components/payroll/PayrollRulesModal';
import MonthEndChecklistModal from '@/components/payroll/MonthEndChecklistModal';
import PayrollTraceDrawer from '@/components/payroll/PayrollTraceDrawer';
import PayrollColumnVisibilityMenu, {
  PAYROLL_COLUMNS,
  PayrollColumnKey,
} from '@/components/payroll/PayrollColumnVisibilityMenu';
import { calculateSeniorityAllowanceFromDate } from '@/lib/payrollRules';

export default function PayrollPage() {
  const { openModal, showToast, triggerRefresh, refreshKey, language, companySettings } = useApp();

  const [activeTab, setActiveTab] = useState<'payroll' | 'sewing' | 'attendance-bonus' | 'position' | 'reconciliation' | 'rules'>('payroll');

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('October 2026');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawer state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);
  const [activeTracePayroll, setActiveTracePayroll] = useState<PayrollRecord | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Column Visibility State with LocalStorage Persistence
  const [visibleColumns, setVisibleColumns] = useState<Set<PayrollColumnKey>>(() => {
    return new Set(PAYROLL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
  });
  const [hasMounted, setHasMounted] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  // Load saved column visibility on client mount
  useEffect(() => {
    setHasMounted(true);
    try {
      const saved = localStorage.getItem('hestra_payroll_visible_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(new Set(parsed as PayrollColumnKey[]));
        }
      }
    } catch (e) {
      console.error('Error reading saved payroll columns:', e);
    }
  }, []);

  // Persist column visibility after mount
  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem(
        'hestra_payroll_visible_columns',
        JSON.stringify(Array.from(visibleColumns))
      );
    } catch (e) {
      console.error('Error saving payroll columns:', e);
    }
  }, [visibleColumns, hasMounted]);

  // Collapsible Payroll Header State with LocalStorage Persistence
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  // Load saved collapse state on client mount
  useEffect(() => {
    try {
      const savedCollapse = localStorage.getItem('hestra_payroll_header_collapsed');
      if (savedCollapse !== null) {
        setIsHeaderCollapsed(savedCollapse === 'true');
      }
    } catch (e) {
      console.error('Error reading saved header collapse state:', e);
    }

    // Check URL tab parameter if present
    try {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'attendance-bonus' || tabParam === 'position' || tabParam === 'sewing' || tabParam === 'payroll') {
        setActiveTab(tabParam as any);
      }
    } catch {}
  }, []);

  const handleToggleHeaderCollapse = () => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev;
      if (next && activeTab !== 'payroll') {
        setActiveTab('payroll');
      }
      try {
        localStorage.setItem('hestra_payroll_header_collapsed', String(next));
      } catch (e) {
        console.error('Error saving header collapse state:', e);
      }
      return next;
    });
  };

  const defaultColumns = useMemo(
    () => PAYROLL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
    []
  );

  const hiddenDefaultColumns = useMemo(() => {
    return defaultColumns.filter((k) => !visibleColumns.has(k));
  }, [defaultColumns, visibleColumns]);

  const handleToggleColumn = (colKey: PayrollColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        if (next.size <= 1) {
          showToast(
            language === 'km'
              ? 'មិនអាចលាក់ជួរឈរទាំងអស់បានទេ ត្រូវរក្សាទុកយ៉ាងហោច ១'
              : 'Cannot hide all columns. Keep at least 1 visible.',
            'error'
          );
          return prev;
        }
        next.delete(colKey);
        const colDef = PAYROLL_COLUMNS.find((c) => c.key === colKey);
        showToast(
          language === 'km'
            ? `បានលាក់ជួរឈរ "${colDef?.labelKm || colKey}"`
            : `Hidden column "${colDef?.labelEn || colKey}"`,
          'info'
        );
      } else {
        next.add(colKey);
        const colDef = PAYROLL_COLUMNS.find((c) => c.key === colKey);
        showToast(
          language === 'km'
            ? `បានបង្ហាញជួរឈរ "${colDef?.labelKm || colKey}"`
            : `Showing column "${colDef?.labelEn || colKey}"`,
          'success'
        );
      }
      return next;
    });
  };

  // Column Filters State (per-column filter)
  const [columnFilters, setColumnFilters] = useState<Record<string, { op: string; value?: number; text?: string }>>({});
  const [showFilterRow, setShowFilterRow] = useState(false);

  const handleSetTextFilter = (colKey: string, text: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!text || text === 'all') {
        delete next[colKey];
      } else {
        next[colKey] = { op: 'text', text };
      }
      return next;
    });
  };

  const handleSetNumericFilter = (colKey: string, op: string, val?: number) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (op === 'any') {
        delete next[colKey];
      } else {
        next[colKey] = { op, value: val };
      }
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    showToast(language === 'km' ? 'បានសម្អាត Filter ជួរឈរទាំងអស់' : 'Cleared all column filters', 'info');
  };

  const isFilterActive = (colKey: string) => {
    const f = columnFilters[colKey];
    if (!f) return false;
    if (f.op === 'text' && f.text) return true;
    if (f.op && f.op !== 'any') {
      if (f.op === '>0' || f.value !== undefined) return true;
    }
    return false;
  };

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    payrolls.forEach((p) => {
      if (p.department_name) set.add(p.department_name.trim());
    });
    return Array.from(set).sort();
  }, [payrolls]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (columnFilters.group?.text) count++;
    if (columnFilters.type?.text) count++;
    if (columnFilters.bankAccount?.text) count++;
    if (columnFilters.status?.text) count++;
    const numericKeys = [
      'baseSalary',
      'workingDays',
      'unpaidDays',
      'workingSal',
      'seniority',
      'transport',
      'positionPayment',
      'nonAbsent',
      'otPay',
      'targetBonus',
      'evalBonus',
      'foodAllowance',
      'gross',
      'nssf',
      'tax',
      'firstPaid',
      'severance',
      'secondPaid',
      'net',
    ];
    numericKeys.forEach((k) => {
      const f = columnFilters[k];
      if (f && f.op && f.op !== 'any') {
        if (f.op === '>0' || f.value !== undefined) count++;
      }
    });
    return count;
  }, [columnFilters]);

  const handleHideColumn = (colKey: PayrollColumnKey) => {
    setVisibleColumns((prev) => {
      if (!prev.has(colKey)) return prev;
      if (prev.size <= 1) {
        showToast(
          language === 'km'
            ? 'មិនអាចលាក់ជួរឈរទាំងអស់បានទេ ត្រូវរក្សាទុកយ៉ាងហោច ១'
            : 'Cannot hide all columns. Keep at least 1 visible.',
          'error'
        );
        return prev;
      }
      const next = new Set(prev);
      next.delete(colKey);
      const colDef = PAYROLL_COLUMNS.find((c) => c.key === colKey);
      showToast(
        language === 'km'
          ? `បានលាក់ជួរឈរ "${colDef?.labelKm || colKey}"`
          : `Hidden column "${colDef?.labelEn || colKey}"`,
        'info'
      );
      return next;
    });
    setColumnFilters((prev) => {
      if (prev[colKey]) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return prev;
    });
  };

  const handleSetColumns = (keys: PayrollColumnKey[]) => {
    if (keys.length === 0) return;
    setVisibleColumns(new Set(keys));
    showToast(
      language === 'km'
        ? `បានផ្លាស់ប្តូរការបង្ហាញជួរឈរ (${keys.length} ជួរឈរ)`
        : `Updated column visibility (${keys.length} columns)`,
      'success'
    );
  };

  const handleResetDefaultColumns = () => {
    const defaults = PAYROLL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setVisibleColumns(new Set(defaults));
    showToast(
      language === 'km'
        ? 'បានកំណត់ជួរឈរលំនាំដើម (២០ ជួរឈរ) ឡើងវិញ!'
        : 'Reset to default factory ledger columns (20 columns)!',
      'success'
    );
  };

  // Fetch Periods
  useEffect(() => {
    fetch('/api/payroll/periods')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPeriods(data);
          // If selectedPeriod is default and exists in periods
          if (!data.some((p) => p.name === selectedPeriod) && data.length > 0) {
            setSelectedPeriod(data[0].name);
          }
        }
      })
      .catch((err) => console.error('Error fetching periods:', err));
  }, [refreshKey]);

  // Current active period metadata
  const currentPeriodMeta = useMemo(() => {
    return periods.find((p) => p.name === selectedPeriod) || null;
  }, [periods, selectedPeriod]);

  const availablePeriods = useMemo(() => {
    const list: string[] = [];
    periods.forEach((p) => {
      if (!list.includes(p.name)) list.push(p.name);
    });
    payrolls.forEach((p) => {
      if (p.pay_period && !list.includes(p.pay_period)) {
        list.push(p.pay_period);
      }
    });
    if (!list.includes('October 2026')) list.unshift('October 2026');
    if (!list.includes('August 2026')) list.push('August 2026');
    return list;
  }, [periods, payrolls]);

  // Fetch Payroll records
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
    if (statusFilter !== 'all') params.append('status', statusFilter);

    fetch(`/api/payroll?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPayrolls(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching payroll:', err);
        setLoading(false);
      });
  }, [selectedPeriod, statusFilter, refreshKey]);

  // Aggregate totals
  const totalNet = payrolls.reduce((acc, p) => acc + (p.net_salary || p.total_paid || 0), 0);
  const totalBase = payrolls.reduce((acc, p) => acc + (p.base_salary || 0), 0);
  const totalGross = payrolls.reduce((acc, p) => acc + (p.gross_salary || p.base_salary + p.allowances + p.bonuses), 0);
  const totalTax = payrolls.reduce((acc, p) => acc + (p.tax_usd || p.tax_deduction || 0), 0);
  const totalPension = payrolls.reduce((acc, p) => acc + (p.pension_usd || p.insurance_deduction || 0), 0);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName =
          (p.employee_name || '').toLowerCase().includes(q) ||
          (p.khmer_name || '').toLowerCase().includes(q) ||
          (p.employee_id || '').toLowerCase().includes(q) ||
          (p.employee_role || '').toLowerCase().includes(q) ||
          (p.department_name || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // Column filters
      if (columnFilters.group?.text) {
        const dept = (p.department_name || '').toLowerCase();
        if (!dept.includes(columnFilters.group.text.toLowerCase())) return false;
      }

      if (columnFilters.type?.text) {
        const laborType = (p.labor_type || 'Direct').toLowerCase();
        if (laborType !== columnFilters.type.text.toLowerCase()) return false;
      }

      if (columnFilters.bankAccount?.text) {
        const bank = `${p.bank_name || ''} ${p.bank_account_number || ''}`.toLowerCase();
        if (!bank.includes(columnFilters.bankAccount.text.toLowerCase())) return false;
      }

      if (columnFilters.status?.text) {
        if ((p.status || '').toLowerCase() !== columnFilters.status.text.toLowerCase()) return false;
      }

      const matchNum = (val: number, f?: { op: string; value?: number }) => {
        if (!f || !f.op || f.op === 'any') return true;
        if (f.op === '>0') return val > 0.001;
        if (f.value === undefined) return true;
        if (f.op === '>') return val > f.value;
        if (f.op === '<') return val < f.value;
        if (f.op === '=') return Math.abs(val - f.value) < 0.01;
        return true;
      };

      if (!matchNum(p.base_salary || 0, columnFilters.baseSalary)) return false;
      if (!matchNum(p.working_days || 26, columnFilters.workingDays)) return false;
      if (!matchNum(p.unpaid_days || 0, columnFilters.unpaidDays)) return false;

      const workingSal = p.basic_working_salary || p.base_salary || 0;
      if (!matchNum(workingSal, columnFilters.workingSal)) return false;

      if (!matchNum(p.seniority_bonus || 0, columnFilters.seniority)) return false;
      if (!matchNum(p.transport_housing || 16, columnFilters.transport)) return false;
      if (!matchNum(p.position_allowance || 0, columnFilters.positionPayment)) return false;
      if (!matchNum(p.attendance_allowance || 0, columnFilters.nonAbsent)) return false;
      if (!matchNum(p.overtime_pay || 0, columnFilters.otPay)) return false;

      const targetBonus = p.target_bonus || p.achievement_bonus || 0;
      if (!matchNum(targetBonus, columnFilters.targetBonus)) return false;

      if (!matchNum(p.monthly_eval_bonus || 0, columnFilters.evalBonus)) return false;
      if (!matchNum(p.food_allowance ?? 65, columnFilters.foodAllowance)) return false;

      const gross = p.gross_salary || (p.base_salary + (p.allowances || 0) + (p.bonuses || 0));
      if (!matchNum(gross, columnFilters.gross)) return false;

      const pension = p.pension_usd || p.insurance_deduction || 5.93;
      if (!matchNum(pension, columnFilters.nssf)) return false;

      const tax = p.tax_usd || p.tax_deduction || 0;
      if (!matchNum(tax, columnFilters.tax)) return false;

      if (!matchNum(p.first_paid || 0, columnFilters.firstPaid)) return false;
      if (!matchNum(p.severance_pay || 0, columnFilters.severance)) return false;

      const net = p.net_salary || p.total_paid || 0;
      const secondPaid = p.second_paid || (net - (p.first_paid || 0));
      if (!matchNum(secondPaid, columnFilters.secondPaid)) return false;

      if (!matchNum(net, columnFilters.net)) return false;

      return true;
    });
  }, [payrolls, searchQuery, columnFilters]);

  const renderNumericFilterCell = (colKey: string) => {
    const current = columnFilters[colKey];
    const op = current?.op || 'any';
    const val = current?.value;

    return (
      <div className="flex items-center justify-end gap-1 px-1 py-0.5">
        <select
          value={op}
          onChange={(e) => handleSetNumericFilter(colKey, e.target.value, val)}
          className={`px-1 py-0.5 text-[9px] font-bold rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer ${
            op !== 'any'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-black'
              : ''
          }`}
        >
          <option value="any">All</option>
          <option value=">0">&gt;0</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
        {['>', '<', '='].includes(op) && (
          <input
            type="number"
            placeholder="$"
            value={val ?? ''}
            onChange={(e) =>
              handleSetNumericFilter(
                colKey,
                op,
                e.target.value === '' ? undefined : Number(e.target.value)
              )
            }
            className="w-11 px-1 py-0.5 text-[9px] font-mono text-right rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        )}
      </div>
    );
  };

  // Calculate period payroll via authoritative engine
  const handleCalculatePayroll = async () => {
    setIsCalculating(true);
    try {
      const periodId = currentPeriodMeta?.id || `period-${selectedPeriod.toLowerCase().replace(/ /g, '-')}`;
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId,
          payPeriodName: selectedPeriod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate payroll');

      showToast(
        language === 'km'
          ? `បានគណនាប្រាក់បៀវត្សរ៍ដោយជោគជ័យសម្រាប់ ${data.count} នាក់ (សរុប Net: $${data.total_net.toFixed(2)})! ✓`
          : `Calculated payroll for ${data.count} employees (Net total: $${data.total_net.toFixed(2)})! ✓`,
        'success'
      );
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error calculating payroll', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Lock period
  const handleConfirmLock = async () => {
    try {
      const periodId = currentPeriodMeta?.id || `period-${selectedPeriod.toLowerCase().replace(/ /g, '-')}`;
      const res = await fetch('/api/payroll/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: periodId,
          action: 'lock',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock period');
      showToast(
        language === 'km' ? 'បានបិទចាក់សោរបញ្ជីប្រាក់បៀវត្សរ៍ជោគជ័យ! ✓' : 'Payroll period locked successfully! ✓',
        'success'
      );
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error locking period', 'error');
    }
  };

  // Unlock period
  const handleUnlockPeriod = async () => {
    try {
      const periodId = currentPeriodMeta?.id || `period-${selectedPeriod.toLowerCase().replace(/ /g, '-')}`;
      const res = await fetch('/api/payroll/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: periodId,
          action: 'unlock',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlock period');
      showToast(
        language === 'km' ? 'បានបើកសោរបញ្ជីប្រាក់បៀវត្សរ៍វិញ! ✓' : 'Payroll period unlocked! ✓',
        'success'
      );
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error unlocking period', 'error');
    }
  };

  // Mark status as Paid
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' }),
      });
      if (res.ok) {
        showToast('Payslip status updated to Paid!', 'success');
        triggerRefresh();
        if (activePayslip && activePayslip.id === id) {
          setActivePayslip({ ...activePayslip, status: 'Paid' });
        }
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    // Dynamic export respecting column visibility
    const exportDefs: Array<{
      header: string;
      getValue: (p: PayrollRecord) => any;
    }> = [];

    if (visibleColumns.has('id')) {
      exportDefs.push({ header: 'Emp ID', getValue: (p) => p.employee_id });
    }
    if (visibleColumns.has('name')) {
      exportDefs.push({ header: 'Khmer Name', getValue: (p) => `"${p.khmer_name || ''}"` });
      exportDefs.push({ header: 'English Name', getValue: (p) => `"${p.employee_name || ''}"` });
    }
    if (visibleColumns.has('group')) {
      exportDefs.push({ header: 'Department', getValue: (p) => `"${p.department_name || ''}"` });
    }
    if (visibleColumns.has('type')) {
      exportDefs.push({ header: 'Classification', getValue: (p) => `"${p.labor_type || 'Direct Labour'}"` });
    }
    if (visibleColumns.has('bankAccount')) {
      exportDefs.push({ header: 'Bank Account', getValue: (p) => `"${p.bank_name || 'ABA Bank'}: ${p.bank_account_number || ''}"` });
    }
    if (visibleColumns.has('baseSalary')) {
      exportDefs.push({ header: 'Base Salary', getValue: (p) => p.base_salary });
    }
    if (visibleColumns.has('workingDays')) {
      exportDefs.push({ header: 'Working Days', getValue: (p) => p.working_days || 26 });
    }
    if (visibleColumns.has('unpaidDays')) {
      exportDefs.push({ header: 'Unpaid Days', getValue: (p) => p.unpaid_days || 0 });
    }
    if (visibleColumns.has('workingSal')) {
      exportDefs.push({ header: 'Basic Working Salary', getValue: (p) => p.basic_working_salary || p.base_salary });
    }
    if (visibleColumns.has('seniority')) {
      exportDefs.push({ header: 'Seniority Allowance', getValue: (p) => p.seniority_bonus || 0 });
    }
    if (visibleColumns.has('transport')) {
      exportDefs.push({ header: 'Transport/Housing', getValue: (p) => p.transport_housing || 16 });
    }
    if (visibleColumns.has('positionPayment')) {
      exportDefs.push({ header: 'Position Payment', getValue: (p) => p.position_allowance || 0 });
    }
    if (visibleColumns.has('nonAbsent')) {
      exportDefs.push({ header: 'Attendance Bonus', getValue: (p) => p.attendance_allowance || 0 });
    }
    if (visibleColumns.has('otPay')) {
      exportDefs.push({ header: 'Overtime Pay', getValue: (p) => p.overtime_pay || 0 });
    }
    if (visibleColumns.has('targetBonus')) {
      exportDefs.push({ header: 'Target Bonus', getValue: (p) => p.target_bonus || p.achievement_bonus || 0 });
    }
    if (visibleColumns.has('evalBonus')) {
      exportDefs.push({ header: 'Monthly Eval Bonus', getValue: (p) => p.monthly_eval_bonus || 0 });
    }
    if (visibleColumns.has('foodAllowance')) {
      exportDefs.push({ header: 'Food Allowance', getValue: (p) => p.food_allowance ?? 65 });
    }
    if (visibleColumns.has('gross')) {
      exportDefs.push({
        header: 'Gross Salary',
        getValue: (p) => p.gross_salary || (p.base_salary + p.allowances + p.bonuses),
      });
    }
    if (visibleColumns.has('nssf')) {
      exportDefs.push({
        header: 'NSSF Pension',
        getValue: (p) => p.pension_usd || p.insurance_deduction || 5.93,
      });
    }
    if (visibleColumns.has('tax')) {
      exportDefs.push({
        header: 'Tax on Salary',
        getValue: (p) => p.tax_usd || p.tax_deduction || 0,
      });
    }
    if (visibleColumns.has('firstPaid')) {
      exportDefs.push({ header: '1st Paid', getValue: (p) => p.first_paid || 0 });
    }
    if (visibleColumns.has('severance')) {
      exportDefs.push({ header: 'Severant Pay 5%', getValue: (p) => p.severance_pay || 0 });
    }
    if (visibleColumns.has('secondPaid')) {
      exportDefs.push({
        header: '2nd Paid',
        getValue: (p) => p.second_paid || ((p.net_salary || p.total_paid || 0) - (p.first_paid || 0)),
      });
    }
    if (visibleColumns.has('net')) {
      exportDefs.push({ header: 'Net Pay', getValue: (p) => p.net_salary || p.total_paid || 0 });
    }
    if (visibleColumns.has('status')) {
      exportDefs.push({ header: 'Status', getValue: (p) => p.status });
    }

    const headers = exportDefs.map((d) => d.header);
    const rows = filteredPayrolls.map((p) => exportDefs.map((d) => d.getValue(p)));

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `HESTRA-Factory-Payroll-${selectedPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      language === 'km'
        ? `បានទាញយកតារាងប្រាក់បៀវត្សជា CSV (${headers.length} ជួរឈរ)! ✓`
        : `Factory Payroll exported as CSV (${headers.length} columns)! ✓`,
      'success'
    );
  };

  return (
    <div className={`animate-in fade-in duration-300 ${isHeaderCollapsed ? 'space-y-3' : 'space-y-6'}`}>
      {/* COMPACT COLLAPSED TOOLBAR (shown when isHeaderCollapsed is true) */}
      {isHeaderCollapsed && (
        <div className="glass-card min-h-[48px] max-h-[60px] h-[52px] px-3.5 sm:px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 sticky top-16 z-25 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          {/* Left: Expand Button, Period, Total Staff, Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Toggle Button: Show Payroll Controls */}
            <button
              type="button"
              onClick={handleToggleHeaderCollapse}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer shrink-0 border border-indigo-400/30 transition-all"
              title={language === 'km' ? 'បង្ហាញផ្ទាំងបញ្ជា (Show Controls)' : 'Show Payroll Controls'}
            >
              <ChevronDown size={14} />
              <span>{language === 'km' ? 'បង្ហាញផ្ទាំងបញ្ជា' : 'Show Payroll Controls'}</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block shrink-0" />

            {/* Current Payroll Period */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs shrink-0">
              <Calendar size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold hidden md:inline">
                {language === 'km' ? 'វដ្ត:' : 'Period:'}
              </span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none text-xs"
                title="Change active payroll period"
              >
                {availablePeriods.map((period: string) => (
                  <option key={period} value={period} className="dark:bg-slate-900">
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block shrink-0" />

            {/* Total Employee Count */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {filteredPayrolls.length}
              </span>
              <span>{language === 'km' ? 'បុគ្គលិក' : 'employees'}</span>
              {filteredPayrolls.length !== payrolls.length && (
                <span className="text-slate-400 text-[11px] font-mono">
                  ({payrolls.length} {language === 'km' ? 'សរុប' : 'total'})
                </span>
              )}
            </div>

            {/* Compact Status Indicator */}
            <div className="shrink-0 hidden md:block">
              {currentPeriodMeta?.status === 'Locked' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                  <Lock size={11} /> LOCKED
                </span>
              ) : currentPeriodMeta?.status === 'Paid' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <CheckCircle2 size={11} /> PAID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                  <RefreshCw size={11} className="animate-spin" /> PROCESSING
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Search, Columns, Print, CSV Export */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Search */}
            <div className="relative w-32 sm:w-44 md:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search staff, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-6 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Columns Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnMenuOpen((prev) => !prev)}
                className={`btn-press px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                  hiddenDefaultColumns.length > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                }`}
                title={language === 'km' ? 'គ្រប់គ្រងជួរឈរ' : 'Manage columns'}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden lg:inline">{language === 'km' ? 'ជួរឈរ' : 'Columns'}</span>
                <span className="text-[10px] text-slate-400">({visibleColumns.size})</span>
              </button>

              {isColumnMenuOpen && isHeaderCollapsed && (
                <PayrollColumnVisibilityMenu
                  isOpen={isColumnMenuOpen}
                  onClose={() => setIsColumnMenuOpen(false)}
                  visibleColumns={visibleColumns}
                  onToggleColumn={handleToggleColumn}
                  onSetColumns={handleSetColumns}
                  onResetDefault={handleResetDefaultColumns}
                  language={language}
                />
              )}
            </div>

            {/* Quick Print & Export */}
            <button
              onClick={handlePrint}
              className="btn-press p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 cursor-pointer shadow-2xs"
              title="Print"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={handleExportCsv}
              className="btn-press px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Export CSV"
            >
              <Download size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE HEADER & CONTROLS SECTION */}
      <div
        className={`collapsible-header-container ${isHeaderCollapsed ? 'is-collapsed' : ''}`}
        aria-hidden={isHeaderCollapsed}
      >
        <div className="collapsible-header-content">
          <div className="space-y-6 pb-1">
            {/* Top Header & Global Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {language === 'km'
                        ? 'គ្រប់គ្រងប្រាក់បៀវត្សរ៍ & ប.ស.ស (Payroll & NSSF Management)'
                        : 'Factory Payroll, Overtime & Statutory Benefits'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {language === 'km'
                        ? 'បញ្ជីបៀវត្សរ៍ ៥៥ ជួរឈរតាមស្តង់ដាររោងចក្រ, ប្រាក់រង្វាន់ផលិតកម្មដេរ, ការកាត់កងពន្ធ ប.ស.ស និងប័ណ្ណបើកប្រាក់'
                        : 'Authoritative 55-column factory payroll ledger, weekly sewing bonus, GDT progressive tax, and payslips'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Reconcile Button */}
                <button
                  onClick={() => setIsReconciliationOpen(true)}
                  className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'km' ? 'ផ្ទៀងផ្ទាត់ជាមួយ Excel' : 'Excel Reconciliation'}</span>
                </button>

                {/* Rules Configuration */}
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings size={15} className="text-slate-500 dark:text-slate-400" />
                  <span>{language === 'km' ? 'គោលការណ៍គណនា' : 'Payroll Rules'}</span>
                </button>

                {/* 55-Col Import */}
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn-press px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer border border-indigo-400/30"
                >
                  <FileSpreadsheet size={15} />
                  <span>{language === 'km' ? 'បញ្ចូល Excel (55-Col)' : 'Import TSV / Excel'}</span>
                </button>

                {/* Hide Payroll Controls Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleHeaderCollapse}
                  className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title={language === 'km' ? 'លាក់ផ្ទាំងបញ្ជា (Hide Controls)' : 'Hide Payroll Controls'}
                >
                  <ChevronUp size={15} className="text-slate-500 dark:text-slate-400" />
                  <span>{language === 'km' ? 'លាក់ផ្ទាំងបញ្ជា' : 'Hide Payroll Controls'}</span>
                </button>
              </div>
            </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200/60 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard size={15} className={activeTab === 'payroll' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
          <span>{language === 'km' ? 'បញ្ជីប្រាក់បៀវត្សរ៍ (Payroll Ledger)' : 'Factory Payroll Ledger'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sewing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sewing'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Scissors size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'km' ? 'រង្វាន់ផលិតកម្មដេរ (Sewing Bonus)' : 'Sewing Production Bonus (B1-B3)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance-bonus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance-bonus'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs ring-1 ring-emerald-200/60 dark:ring-emerald-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Automated Attendance Bonus Module"
        >
          <Award size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'km' ? 'ប្រាក់រង្វាន់វត្តមាន (Bonus)' : 'Attendance Bonus Module'}</span>
        </button>

        <button
          onClick={() => setActiveTab('position')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'position'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs ring-1 ring-amber-200/60 dark:ring-amber-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase size={15} className="text-amber-600 dark:text-amber-400" />
          <span>{language === 'km' ? 'មុខតំណែង (Position)' : 'Position'}</span>
        </button>

        <button
          onClick={() => setIsReconciliationOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'km' ? 'ផ្ទៀងផ្ទាត់ (Audit)' : 'Audit Comparison'}</span>
        </button>

        <button
          onClick={() => setIsRulesModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Settings size={15} className="text-amber-600 dark:text-amber-400" />
          <span>{language === 'km' ? 'ការកំណត់ (Rules)' : 'Rules Config'}</span>
        </button>
      </div>

      {/* Tab: Attendance Bonus Module */}
      {activeTab === 'attendance-bonus' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <AttendanceBonusManager />
        </div>
      )}

      {/* Tab: Position Payment Management */}
      {activeTab === 'position' && (
        <PositionPaymentManager
          initialPeriod={selectedPeriod}
          onPayrollUpdated={triggerRefresh}
        />
      )}

      {/* Tab 2: Sewing Production Bonus */}
      {activeTab === 'sewing' && <SewingBonusManager />}

      {/* Tab 1: Factory Payroll Ledger Header Components */}
      {activeTab === 'payroll' && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'km' ? 'ប្រាក់បៀវត្សរ៍សុទ្ធសរុប (Net Pay)' : 'Total Net Pay'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1 font-mono tracking-tight">
                ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ~ {((totalNet * 4044) / 1000000).toFixed(1)}M KHR
              </span>
            </div>

            <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'km' ? 'ប្រាក់បៀវត្សរ៍សរុប (Gross)' : 'Total Gross'}
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 my-1 font-mono tracking-tight">
                ${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {payrolls.length} active employees
              </span>
            </div>

            <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-rose-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-rose-500 before:to-rose-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'km' ? 'ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Tax)' : 'Salary Tax (GDT)'}
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 my-1 font-mono tracking-tight">
                ${totalTax.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Progressive brackets</span>
            </div>

            <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-blue-500 before:to-blue-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'km' ? 'ប.ស.ស សោធននិវត្តន៍' : 'NSSF Pension'}
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 my-1 font-mono tracking-tight">
                ${totalPension.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">2% statutory cap</span>
            </div>

            <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-400/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-slate-400 before:to-slate-300">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'km' ? 'ស្ថានភាពវដ្ត (Period Status)' : 'Period Status'}
              </span>
              <div className="my-1">
                {currentPeriodMeta?.status === 'Locked' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                    <Lock size={13} /> LOCKED
                  </span>
                ) : currentPeriodMeta?.status === 'Paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                    <CheckCircle2 size={13} /> PAID
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                    <RefreshCw size={13} className="animate-spin" /> PROCESSING
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {selectedPeriod}
              </span>
            </div>
          </div>

          {/* Period Selector & Action Toolbar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Period Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-slate-500 dark:text-slate-400 font-bold">Payroll Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-hidden cursor-pointer"
                >
                  {availablePeriods.map((period: string) => (
                    <option key={period} value={period} className="dark:bg-slate-900">
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-900">All Statuses</option>
                <option value="Processing" className="dark:bg-slate-900">Processing</option>
                <option value="Paid" className="dark:bg-slate-900">Paid</option>
                <option value="Pending" className="dark:bg-slate-900">Pending</option>
              </select>

              {/* Search */}
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search staff, ID, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Show / Hide Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setShowFilterRow((prev) => !prev)}
                className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                  showFilterRow
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : activeFilterCount > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/80 hover:bg-indigo-100'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
                }`}
                title={language === 'km' ? (showFilterRow ? 'លាក់ Filter ជួរឈរ (Hide Filters)' : 'បង្ហាញ Filter ជួរឈរ (Show Filters)') : (showFilterRow ? 'Hide Column Filters' : 'Show Column Filters')}
              >
                {showFilterRow ? <EyeOff size={13} /> : <Filter size={13} />}
                <span>
                  {showFilterRow
                    ? (language === 'km' ? 'លាក់ Filter (Hide Filter)' : 'Hide Filters')
                    : (language === 'km' ? 'បង្ហាញ Filter' : 'Show Filters')}
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-black leading-tight">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Action Buttons: Calculate, Lock/Unlock, Print, Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Calculate Period Payroll */}
              <button
                onClick={handleCalculatePayroll}
                disabled={isCalculating || currentPeriodMeta?.status === 'Locked'}
                className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-400/30"
                title="Run Authoritative Calculation Engine across all staff"
              >
                <Calculator size={15} className={isCalculating ? 'animate-spin' : ''} />
                <span>{isCalculating ? 'Calculating...' : 'Calculate Period'}</span>
              </button>

              {/* Lock / Unlock Toggle */}
              {currentPeriodMeta?.status === 'Locked' ? (
                <button
                  onClick={handleUnlockPeriod}
                  className="btn-press px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Unlock size={14} />
                  <span>Unlock Period</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsChecklistOpen(true)}
                  className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Lock size={14} />
                  <span>Lock Period</span>
                </button>
              )}

              {/* Columns Visibility Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnMenuOpen((prev) => !prev)}
                  className={`btn-press px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                    hiddenDefaultColumns.length > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                  }`}
                  title={language === 'km' ? 'គ្រប់គ្រងជួរឈរ (បង្ហាញ / លាក់)' : 'Manage columns (Show / Hide)'}
                >
                  <SlidersHorizontal
                    size={14}
                    className={
                      hiddenDefaultColumns.length > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  />
                  <span>{language === 'km' ? 'ជួរឈរ' : 'Columns'}</span>
                  {hiddenDefaultColumns.length > 0 ? (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black leading-tight">
                      {hiddenDefaultColumns.length} {language === 'km' ? 'បានលាក់' : 'hidden'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">({visibleColumns.size})</span>
                  )}
                </button>

                <PayrollColumnVisibilityMenu
                  isOpen={isColumnMenuOpen}
                  onClose={() => setIsColumnMenuOpen(false)}
                  visibleColumns={visibleColumns}
                  onToggleColumn={handleToggleColumn}
                  onSetColumns={handleSetColumns}
                  onResetDefault={handleResetDefaultColumns}
                  language={language}
                />
              </div>

              {/* Print & Export */}
              <button
                onClick={handlePrint}
                className="btn-press p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 cursor-pointer shadow-2xs"
                title="Print"
              >
                <Printer size={15} />
              </button>
              <button
                onClick={handleExportCsv}
                className="btn-press px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </button>

              {/* Hide Controls Button in Action Toolbar */}
              <button
                type="button"
                onClick={handleToggleHeaderCollapse}
                className="btn-press px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                title={language === 'km' ? 'លាក់ផ្ទាំងបញ្ជា (Hide Controls)' : 'Hide Payroll Controls'}
              >
                <ChevronUp size={14} className="text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">{language === 'km' ? 'លាក់ផ្ទាំងបញ្ជា' : 'Hide Controls'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
</div>

      {/* Active Filters Summary Banner */}
      {(activeTab === 'payroll' || isHeaderCollapsed) && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {language === 'km' ? (
                <>
                  កំពុង Filter លើ <span className="font-bold">{activeFilterCount}</span> ជួរឈរ &bull; បង្ហាញ{' '}
                  <span className="font-black text-indigo-700 dark:text-indigo-300">
                    {filteredPayrolls.length}
                  </span>{' '}
                  នាក់ (ពីចំណោម {payrolls.length} នាក់)
                </>
              ) : (
                <>
                  <span className="font-bold">{activeFilterCount}</span> column filter{activeFilterCount > 1 ? 's' : ''} active &bull; Showing{' '}
                  <span className="font-black text-indigo-700 dark:text-indigo-300">
                    {filteredPayrolls.length}
                  </span>{' '}
                  of {payrolls.length} employees
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800/60 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <X size={11} />
              <span>{language === 'km' ? 'សម្អាត Filter ទាំងអស់' : 'Clear All Filters'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden Columns Alert Banner */}
      {(activeTab === 'payroll' || isHeaderCollapsed) && hiddenDefaultColumns.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <EyeOff size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {language === 'km' ? (
                <>
                  បានលាក់ចំនួន <span className="font-bold">{hiddenDefaultColumns.length}</span> ជួរឈរ៖{' '}
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    {hiddenDefaultColumns
                      .map((k) => PAYROLL_COLUMNS.find((c) => c.key === k)?.labelKm || k)
                      .join(', ')}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold">{hiddenDefaultColumns.length}</span> column
                  {hiddenDefaultColumns.length > 1 ? 's' : ''} hidden:{' '}
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    {hiddenDefaultColumns
                      .map((k) => PAYROLL_COLUMNS.find((c) => c.key === k)?.labelEn || k)
                      .join(', ')}
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultColumns}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg text-amber-900 dark:text-amber-200 font-bold text-[11px] border border-amber-300 dark:border-amber-700/80 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <RotateCcw size={11} />
              <span>{language === 'km' ? 'បង្ហាញទាំងអស់វិញ' : 'Restore All'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
            >
              <span>{language === 'km' ? 'កែសម្រួល' : 'Customize'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 55-Column Factory Ledger Table */}
      {(activeTab === 'payroll' || isHeaderCollapsed) && (
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className={`overflow-x-auto overflow-y-auto ${
            isHeaderCollapsed
              ? 'max-h-[calc(100vh-190px)] min-h-[560px]'
              : 'max-h-[620px]'
          }`}>
            <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    {visibleColumns.has('id') && (
                      <th className="p-2.5 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-[70px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>ID</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideColumn('id');
                            }}
                            title={language === 'km' ? 'លាក់ជួរឈរ ID' : 'Hide Staff ID column'}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <EyeOff size={11} />
                          </button>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('name') && (
                      <th
                        className={`p-2.5 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-[130px] ${language === 'km' ? 'font-khmer' : ''} ${
                          visibleColumns.has('id') ? 'sticky left-[70px]' : 'sticky left-0'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>{language === 'km' ? 'ឈ្មោះខ្មែរ / Name' : 'Employee Name'}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideColumn('name');
                            }}
                            title={language === 'km' ? 'លាក់ជួរឈរឈ្មោះ' : 'Hide Name column'}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <EyeOff size={11} />
                          </button>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('group') && (
                      <th className="p-2.5 min-w-[95px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <span>Group</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter តាម Group' : 'Filter by Group'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('group')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('group') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('group');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Group' : 'Hide Group column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('type') && (
                      <th className="p-2.5 min-w-[95px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <span>Type</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter តាម Type' : 'Filter by Type'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('type')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('type') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('type');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Type' : 'Hide Type column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('bankAccount') && (
                      <th className="p-2.5 min-w-[110px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <span>Bank Account</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter តាម Bank Account' : 'Filter by Bank Account'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('bankAccount')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('bankAccount') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('bankAccount');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Bank Account' : 'Hide Bank Account column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('baseSalary') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Base Salary' : 'Filter Base Salary'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('baseSalary')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('baseSalary') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('baseSalary');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Base Salary' : 'Hide Base Salary column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Base Salary</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('workingDays') && (
                      <th className="p-2.5 text-right min-w-[80px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Work Days' : 'Filter Work Days'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('workingDays')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('workingDays') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('workingDays');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Working Days' : 'Hide Working Days column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Work Days</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('unpaidDays') && (
                      <th className="p-2.5 text-right min-w-[80px] border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Unpaid Days' : 'Filter Unpaid Days'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('unpaidDays')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('unpaidDays') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('unpaidDays');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Unpaid Days' : 'Hide Unpaid Days column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Unpaid Days</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('workingSal') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Working Sal' : 'Filter Working Sal'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('workingSal')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('workingSal') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('workingSal');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Working Sal' : 'Hide Working Sal column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Working Sal</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('seniority') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Seniority' : 'Filter Seniority'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('seniority')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('seniority') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('seniority');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Seniority' : 'Hide Seniority column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Seniority</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('transport') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Transport' : 'Filter Transport'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('transport')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('transport') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('transport');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Transport' : 'Hide Transport column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Transport</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('positionPayment') && (
                      <th className="p-2.5 text-right min-w-[90px] border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Position Payment' : 'Filter Position Payment'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('positionPayment')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('positionPayment') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('positionPayment');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Position Payment' : 'Hide Position Payment column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Position Pay</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('nonAbsent') && (
                      <th className="p-2.5 text-right min-w-[90px] border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Non-Absent' : 'Filter Non-Absent'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('nonAbsent')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('nonAbsent') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('nonAbsent');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Non-Absent' : 'Hide Non-Absent column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Non-Absent</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('otPay') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter OT Pay' : 'Filter OT Pay'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('otPay')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('otPay') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('otPay');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ OT Pay' : 'Hide OT Pay column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>OT Pay</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('targetBonus') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Target Bonus' : 'Filter Target Bonus'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('targetBonus')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('targetBonus') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('targetBonus');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Target Bonus' : 'Hide Target Bonus column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Target Bonus</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('evalBonus') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-400 bg-purple-50/20 dark:bg-purple-950/20">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Monthly Eval' : 'Filter Monthly Eval'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('evalBonus')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('evalBonus') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('evalBonus');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Monthly Eval' : 'Hide Monthly Eval column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Monthly Eval</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('foodAllowance') && (
                      <th className="p-2.5 text-right min-w-[80px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Food Allowance' : 'Filter Food Allowance'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('foodAllowance')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('foodAllowance') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('foodAllowance');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Food Allowance' : 'Hide Food Allowance column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Food</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('gross') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:white bg-slate-100/70 dark:bg-slate-800">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Gross Salary' : 'Filter Gross Salary'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('gross')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('gross') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('gross');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Gross Salary' : 'Hide Gross Salary column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Gross Salary</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('nssf') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter NSSF' : 'Filter NSSF'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('nssf')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('nssf') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('nssf');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ NSSF' : 'Hide NSSF column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>NSSF</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('tax') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter GDT Tax' : 'Filter GDT Tax'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('tax')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('tax') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('tax');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ GDT Tax' : 'Hide GDT Tax column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>GDT Tax</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('firstPaid') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter 1st Paid' : 'Filter 1st Paid'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('firstPaid')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('firstPaid') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('firstPaid');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ 1st Paid' : 'Hide 1st Paid column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>1st Paid</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('severance') && (
                      <th
                        className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20"
                        title={language === 'km' ? 'Column 50: Severant Pay 5% (ប្រាក់បំណាច់កុងត្រា ៥%)' : 'Column 50: Severant Pay 5%'}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Severant 5%' : 'Filter Severant 5%'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('severance')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('severance') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('severance');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Severant 5%' : 'Hide Severant 5% column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Severant 5%</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('secondPaid') && (
                      <th className="p-2.5 text-right min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter 2nd Paid' : 'Filter 2nd Paid'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('secondPaid')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('secondPaid') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('secondPaid');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ 2nd Paid' : 'Hide 2nd Paid column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>2nd Paid</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('net') && (
                      <th className="p-2.5 text-right min-w-[95px] border-r border-slate-200 dark:border-slate-700 font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Net Take-Home' : 'Filter Net Take-Home'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('net')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('net') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('net');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Net Take-Home' : 'Hide Net Take-Home column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span className="truncate">Net Take-Home</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('status') && (
                      <th className="p-2.5 text-center min-w-[85px] border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilterRow(true);
                              }}
                              title={language === 'km' ? 'Filter Status' : 'Filter Status'}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isFilterActive('status')
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-400/50'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Filter size={11} className={isFilterActive('status') ? 'fill-indigo-600 dark:fill-indigo-400' : ''} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideColumn('status');
                              }}
                              title={language === 'km' ? 'លាក់ជួរឈរ Status' : 'Hide Status column'}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <EyeOff size={11} />
                            </button>
                          </div>
                          <span>Status</span>
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('actions') && (
                      <th className="p-2.5 text-center min-w-[90px]">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Actions</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideColumn('actions');
                            }}
                            title={language === 'km' ? 'លាក់ជួរឈរ Actions' : 'Hide Actions column'}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <EyeOff size={11} />
                          </button>
                        </div>
                      </th>
                    )}
                  </tr>

                  {/* Column Filter Row */}
                  {showFilterRow && (
                    <tr className="bg-slate-100/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 text-[10px] backdrop-blur-xs font-normal normal-case">
                      {visibleColumns.has('id') && (
                        <th className="p-1 sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-slate-400 text-center font-normal">
                          -
                        </th>
                      )}
                      {visibleColumns.has('name') && (
                        <th
                          className={`p-1 z-20 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 font-normal ${
                            visibleColumns.has('id') ? 'sticky left-[70px]' : 'sticky left-0'
                          }`}
                        >
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] text-slate-500 font-medium">
                              {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Filters:'}
                            </span>
                            {activeFilterCount > 0 && (
                              <button
                                type="button"
                                onClick={handleClearAllFilters}
                                className="text-[9px] text-rose-600 hover:underline font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('group') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          <select
                            value={columnFilters.group?.text || 'all'}
                            onChange={(e) => handleSetTextFilter('group', e.target.value)}
                            className={`w-full px-1 py-0.5 text-[9px] font-medium rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer ${
                              columnFilters.group?.text
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold'
                                : ''
                            }`}
                          >
                            <option value="all">All Groups</option>
                            {availableGroups.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </th>
                      )}
                      {visibleColumns.has('type') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          <select
                            value={columnFilters.type?.text || 'all'}
                            onChange={(e) => handleSetTextFilter('type', e.target.value)}
                            className={`w-full px-1 py-0.5 text-[9px] font-medium rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer ${
                              columnFilters.type?.text
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold'
                                : ''
                            }`}
                          >
                            <option value="all">All Types</option>
                            <option value="Direct">Direct</option>
                            <option value="Indirect">Indirect</option>
                          </select>
                        </th>
                      )}
                      {visibleColumns.has('bankAccount') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          <input
                            type="text"
                            placeholder="Filter bank..."
                            value={columnFilters.bankAccount?.text || ''}
                            onChange={(e) => handleSetTextFilter('bankAccount', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-[9px] rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </th>
                      )}
                      {visibleColumns.has('baseSalary') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('baseSalary')}
                        </th>
                      )}
                      {visibleColumns.has('workingDays') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('workingDays')}
                        </th>
                      )}
                      {visibleColumns.has('unpaidDays') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('unpaidDays')}
                        </th>
                      )}
                      {visibleColumns.has('workingSal') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('workingSal')}
                        </th>
                      )}
                      {visibleColumns.has('seniority') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('seniority')}
                        </th>
                      )}
                      {visibleColumns.has('transport') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('transport')}
                        </th>
                      )}
                      {visibleColumns.has('positionPayment') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('positionPayment')}
                        </th>
                      )}
                      {visibleColumns.has('nonAbsent') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('nonAbsent')}
                        </th>
                      )}
                      {visibleColumns.has('otPay') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('otPay')}
                        </th>
                      )}
                      {visibleColumns.has('targetBonus') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('targetBonus')}
                        </th>
                      )}
                      {visibleColumns.has('evalBonus') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('evalBonus')}
                        </th>
                      )}
                      {visibleColumns.has('foodAllowance') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('foodAllowance')}
                        </th>
                      )}
                      {visibleColumns.has('gross') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('gross')}
                        </th>
                      )}
                      {visibleColumns.has('nssf') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('nssf')}
                        </th>
                      )}
                      {visibleColumns.has('tax') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('tax')}
                        </th>
                      )}
                      {visibleColumns.has('firstPaid') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('firstPaid')}
                        </th>
                      )}
                      {visibleColumns.has('severance') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('severance')}
                        </th>
                      )}
                      {visibleColumns.has('secondPaid') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('secondPaid')}
                        </th>
                      )}
                      {visibleColumns.has('net') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          {renderNumericFilterCell('net')}
                        </th>
                      )}
                      {visibleColumns.has('status') && (
                        <th className="p-1 border-r border-slate-200 dark:border-slate-700 font-normal">
                          <select
                            value={columnFilters.status?.text || 'all'}
                            onChange={(e) => handleSetTextFilter('status', e.target.value)}
                            className="w-full px-1 py-0.5 text-[9px] font-medium rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="all">All</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </th>
                      )}
                      {visibleColumns.has('actions') && (
                        <th className="p-1 text-center font-normal">
                          {activeFilterCount > 0 ? (
                            <button
                              type="button"
                              onClick={handleClearAllFilters}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 cursor-pointer"
                              title="Reset all filters"
                            >
                              Reset
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-normal">-</span>
                          )}
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={Math.max(1, visibleColumns.size)} className="p-12 text-center text-slate-400 font-sans">
                        <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading payroll records...
                      </td>
                    </tr>
                  ) : filteredPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(1, visibleColumns.size)} className="p-8 text-center text-slate-400 font-sans">
                        No payroll records found for {selectedPeriod}. Click &quot;Calculate Period&quot; to generate.
                      </td>
                    </tr>
                  ) : (
                    filteredPayrolls.map((p) => {
                      const net = p.net_salary || p.total_paid || 0;
                      const gross = p.gross_salary || (p.base_salary + p.allowances + p.bonuses);
                      const workingSal = p.basic_working_salary || p.base_salary;
                      const seniority = p.seniority_bonus || 0;
                      const transport = p.transport_housing || 16;
                      const attendance = p.attendance_allowance || 0;
                      const otPay = p.overtime_pay || 0;
                      const targetBonus = p.target_bonus || p.achievement_bonus || 0;
                      const evalBonus = p.monthly_eval_bonus || 0;
                      const pension = p.pension_usd || p.insurance_deduction || 5.93;
                      const tax = p.tax_usd || p.tax_deduction || 0;
                      const firstPaid = p.first_paid || 0;
                      const secondPaid = p.second_paid || (net - firstPaid);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {visibleColumns.has('id') && (
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                              {p.employee_id}
                            </td>
                          )}
                          {visibleColumns.has('name') && (
                            <td
                              className={`p-2.5 font-sans z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 truncate max-w-[140px] ${
                                visibleColumns.has('id') ? 'sticky left-[70px]' : 'sticky left-0'
                              }`}
                            >
                              <span className={`font-bold text-slate-800 dark:text-slate-200 block truncate ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                                {language === 'km' ? (p.khmer_name || p.employee_name) : p.employee_name}
                              </span>
                              <span className={`text-[10px] text-slate-400 block truncate ${language === 'km' ? 'font-sans' : 'font-khmer'}`}>
                                {language === 'km' ? p.employee_name : (p.khmer_name || '')}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('group') && (
                            <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 font-sans font-semibold text-slate-700 dark:text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                                {p.department_name?.includes('Sewing') ? 'Sew-L.1' : p.department_name ? p.department_name.substring(0, 7) : (language === 'km' ? 'ទូទៅ' : 'General')}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('type') && (
                            <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 font-sans text-[10px] text-slate-500 dark:text-slate-400">
                              {p.labor_type || 'Direct'}
                            </td>
                          )}
                          {visibleColumns.has('bankAccount') && (
                            <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              <span className="block truncate font-bold text-slate-700 dark:text-slate-300">{p.bank_name || 'ABA Bank'}</span>
                              <span className="block text-[9px] text-slate-400">{p.bank_account_number || '•••• ••••'}</span>
                            </td>
                          )}
                          {visibleColumns.has('baseSalary') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              ${p.base_salary.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('workingDays') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              {p.working_days || 26}d
                            </td>
                          )}
                          {visibleColumns.has('unpaidDays') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                              {p.unpaid_days || 0}d
                            </td>
                          )}
                          {visibleColumns.has('workingSal') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20">
                              ${workingSal.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('seniority') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 bg-indigo-50/15 dark:bg-indigo-950/15">
                              <div className="font-bold text-indigo-700 dark:text-indigo-400">
                                ${seniority.toFixed(2)}
                              </div>
                              {p.join_date ? (
                                <div
                                  className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate cursor-help"
                                  title={`Join Date: ${p.join_date} (${calculateSeniorityAllowanceFromDate(p.join_date).tenureLabel}) → $${seniority.toFixed(2)}/mo`}
                                >
                                  {calculateSeniorityAllowanceFromDate(p.join_date).tenureLabel}
                                </div>
                              ) : null}
                            </td>
                          )}
                          {visibleColumns.has('transport') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              ${transport.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('positionPayment') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-amber-700 dark:text-amber-400 bg-amber-50/10 dark:bg-amber-950/20">
                              ${(p.position_allowance || 0).toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('nonAbsent') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                              ${attendance.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('otPay') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              ${otPay.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('targetBonus') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-400">
                              ${targetBonus.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('evalBonus') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-purple-600 dark:text-purple-400 bg-purple-50/10 dark:bg-purple-950/20">
                              ${evalBonus.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('foodAllowance') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              ${(p.food_allowance ?? 65).toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('gross') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50">
                              ${gross.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('nssf') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-blue-700 dark:text-blue-400">
                              -${pension.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('tax') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400">
                              -${tax.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('firstPaid') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              ${firstPaid.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('severance') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-amber-700 dark:text-amber-400 bg-amber-50/10 dark:bg-amber-950/20">
                              ${(p.severance_pay || 0).toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('secondPaid') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                              ${secondPaid.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('net') && (
                            <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                              ${net.toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.has('status') && (
                            <td className="p-2.5 text-center border-r border-slate-100 dark:border-slate-800 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('actions') && (
                            <td className="p-2 text-center font-sans">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setActiveTracePayroll(p)}
                                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-md font-bold text-[10px] cursor-pointer"
                                  title="View exact calculation formulas and step trace"
                                >
                                  Trace
                                </button>
                                <button
                                  onClick={() => setActivePayslip(p)}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-semibold text-[10px] cursor-pointer"
                                  title="View official printable payslip"
                                >
                                  Slip
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* MODAL 1: Calculation Audit Trace Drawer */}
      {activeTracePayroll && (
        <PayrollTraceDrawer
          payroll={activeTracePayroll}
          onClose={() => setActiveTracePayroll(null)}
        />
      )}

      {/* MODAL 2: Excel Baseline Reconciliation Modal */}
      <PayrollReconciliationModal
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        period={selectedPeriod === 'all' ? 'August 2026' : selectedPeriod}
      />

      {/* MODAL 3: Configurable Rules Modal */}
      <PayrollRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onUpdated={triggerRefresh}
      />

      {/* MODAL 4: Month-End Verification & Period Lock Modal */}
      <MonthEndChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        periodId={currentPeriodMeta?.id || `period-${selectedPeriod}`}
        periodName={selectedPeriod}
        onConfirmLock={handleConfirmLock}
      />

      {/* MODAL 5: Existing TSV Import Modal */}
      <PayrollImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={triggerRefresh}
      />

      {/* MODAL 6: Digital Payslip Modal */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Controls Bar */}
            <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <span className="font-bold text-sm text-slate-900">
                  Official Payslip &bull; {activePayslip.pay_period}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer size={14} /> Print / PDF
                </button>
                {activePayslip.status !== 'Paid' && (
                  <button
                    onClick={() => handleMarkPaid(activePayslip.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setActivePayslip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800 text-xs font-sans">
              <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xl overflow-hidden p-1">
                    <img src="/hestra-logo.svg" alt="HESTRA HRM" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold text-slate-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {companySettings?.name || 'HESTRA-GLOVES HRM (Cambodia) Ltd'}
                    </h2>
                    <p className={`text-[11px] text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {companySettings?.address || (language === 'km' ? 'តំបន់សេដ្ឋកិច្ចពិសេស រ៉ូយ៉ាល់ គ្រុប ភ្នំពេញ (RGPPSEZ), ខណ្ឌកំបូល, រាជធានីភ្នំពេញ' : 'Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia')}
                    </p>
                    <p className={`text-[11px] text-slate-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      {language === 'km' ? 'លេខសារពើពន្ធ TIN: K009-90218928 • លេខបញ្ជិកា ប.ស.ស (NSSF): 1029482' : 'Tax TIN: K009-90218928 • NSSF Reg: 1029482'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full font-bold text-[11px] uppercase tracking-wide text-slate-700">
                    {activePayslip.status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Date: {activePayslip.payment_date}
                  </p>
                </div>
              </div>

              {/* Staff Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">{language === 'km' ? 'ឈ្មោះបុគ្គលិក / Name:' : 'Employee Name:'}</span>
                  <span className={`font-bold text-slate-900 block ${language === 'km' ? 'font-khmer' : ''}`}>
                    {language === 'km' ? (activePayslip.khmer_name || activePayslip.employee_name) : activePayslip.employee_name}
                  </span>
                  {language === 'km' && activePayslip.khmer_name && (
                    <span className="text-[10px] text-slate-500 block">{activePayslip.employee_name}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Staff ID:</span>
                  <span className="font-mono font-bold text-slate-900 block">{activePayslip.employee_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{language === 'km' ? 'ផ្នែក / Dept:' : 'Department:'}</span>
                  <span className="font-medium text-slate-800 block">
                    {formatLocalizedText(activePayslip.department_name, language)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Labor Classification:</span>
                  <span className="font-medium text-slate-800 block">
                    {activePayslip.labor_type || 'Direct Labour'}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-200 uppercase text-[11px]">
                    Earnings & Allowances
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Working Salary:</span>
                      <span className="font-mono font-semibold">${(activePayslip.basic_working_salary || activePayslip.base_salary).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-600">Seniority Allowance:</span>
                        {activePayslip.join_date && (
                          <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                            ({activePayslip.join_date} • {calculateSeniorityAllowanceFromDate(activePayslip.join_date).tenureLabel})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold">${(activePayslip.seniority_bonus || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transport / Housing:</span>
                      <span className="font-mono font-semibold">${(activePayslip.transport_housing || 16).toFixed(2)}</span>
                    </div>
                    {(activePayslip.position_allowance || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Position Payment:</span>
                        <span className="font-mono font-semibold text-amber-700">${(activePayslip.position_allowance || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Non-Absent Bonus:</span>
                      <span className="font-mono font-semibold text-emerald-600">${(activePayslip.attendance_allowance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Overtime Pay:</span>
                      <span className="font-mono font-semibold">${(activePayslip.overtime_pay || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sewing Target Bonus:</span>
                      <span className="font-mono font-semibold text-indigo-600">${(activePayslip.target_bonus || activePayslip.achievement_bonus || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{language === 'km' ? 'Monthly Eval Bonus (វាយតម្លៃ):' : 'Monthly Eval Bonus:'}</span>
                      <span className="font-mono font-semibold text-purple-600">+${(activePayslip.monthly_eval_bonus || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                      <span>Gross Earnings:</span>
                      <span className="font-mono">${(activePayslip.gross_salary || (activePayslip.base_salary + activePayslip.allowances + activePayslip.bonuses)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions & Distribution */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-200 uppercase text-[11px]">
                    Deductions & Advances
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">NSSF Pension (2%):</span>
                      <span className="font-mono font-semibold text-blue-600">-${(activePayslip.pension_usd || activePayslip.insurance_deduction || 5.93).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">GDT Salary Tax:</span>
                      <span className="font-mono font-semibold text-rose-600">-${(activePayslip.tax_usd || activePayslip.tax_deduction || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">1st Paid (Advance):</span>
                      <span className="font-mono font-semibold">-${(activePayslip.first_paid || 0).toFixed(2)}</span>
                    </div>
                    {Boolean(activePayslip.severance_pay && activePayslip.severance_pay > 0) && (
                      <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                        <span>{language === 'km' ? 'ប្រាក់បំណាច់ ៥% (Severance Pay):' : 'Severance Pay (5%):'}</span>
                        <span className="font-mono">+${(activePayslip.severance_pay || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                      <span>Total Deductions:</span>
                      <span className="font-mono">
                        -${((activePayslip.pension_usd || activePayslip.insurance_deduction || 5.93) + (activePayslip.tax_usd || activePayslip.tax_deduction || 0) + (activePayslip.first_paid || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take-Home Pay Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className={`text-xs text-emerald-800 font-bold block uppercase ${language === 'km' ? 'font-khmer' : ''}`}>
                    {language === 'km' ? 'ប្រាក់បៀវត្សរ៍សុទ្ធទូទាត់ (Final Net Take-Home):' : 'Final Net Take-Home Pay:'}
                  </span>
                  <span className="text-[10px] text-emerald-600">Disbursed via ABA Bank</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  ${(activePayslip.net_salary || activePayslip.total_paid || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
