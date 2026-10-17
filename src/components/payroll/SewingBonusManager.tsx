'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SewingBonusRule, SewingWeeklyProduction } from '@/lib/types';
import SewingImportModal from '@/components/payroll/SewingImportModal';
import {
  Scissors,
  Calendar,
  Award,
  Plus,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  UploadCloud,
  Edit3,
  Trash2,
  User,
  AlertCircle,
  FileSpreadsheet,
  Calculator,
  Sparkles,
  Search,
  Check,
  Layers,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  DollarSign,
  FileText,
  Building2,
  Target,
} from 'lucide-react';
import { computeSewingWeeklyBonus } from '@/lib/payrollRules';
import { formatDateDMY } from '@/lib/translations';
import confetti from 'canvas-confetti';
import SewingMatrixCalculatorModal, {
  STANDARD_SEWING_MATRIX_TIERS,
} from '@/components/payroll/SewingMatrixCalculatorModal';
import DailyTargetBonusManager from '@/components/payroll/DailyTargetBonusManager';

export const STANDARD_EVALUATION_BONUS_TIERS = [
  { amount: 20, grade: 'Tier A+', label_km: 'ពូកែពិសេស (Exceptional)', label_en: 'Exceptional (A+)' },
  { amount: 15, grade: 'Tier A', label_km: 'ល្អប្រសើរ (High Quality)', label_en: 'High Quality (A)' },
  { amount: 11, grade: 'Tier B', label_km: 'មធ្យមស្តង់ដារ (Standard)', label_en: 'Standard (B)' },
  { amount: 6, grade: 'Tier C', label_km: 'កម្រិតមូលដ្ឋាន (Baseline)', label_en: 'Baseline (C)' },
];

export default function SewingBonusManager() {
  const { showToast, language } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'weekly' | 'daily' | 'matrix' | 'evaluation' | 'severance'>('weekly');
  const [month, setMonth] = useState('2026-10');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<SewingWeeklyProduction[]>([]);
  const [rules, setRules] = useState<SewingBonusRule[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_quantity: 0,
    total_bonus_payout: 0,
    average_achievement_pct: 0,
  });

  // Weekly Output Logs Filter states
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [weeklySearch, setWeeklySearch] = useState<string>('');
  const [generatingLines, setGeneratingLines] = useState(false);

  // Filtered records for Weekly Output Logs
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Week filter
      if (selectedWeek !== 'all' && r.week_number !== Number(selectedWeek)) {
        return false;
      }
      // Tier filter (B3, B2, B1, Base, Below)
      if (selectedTier !== 'all') {
        const { tier } = computeSewingWeeklyBonus(r.total_qty, rules[0]);
        if (selectedTier === 'B3' && tier !== 'B3') return false;
        if (selectedTier === 'B2' && tier !== 'B2') return false;
        if (selectedTier === 'B1' && tier !== 'B1') return false;
        if (selectedTier === 'Base' && tier !== 'Base') return false;
        if (selectedTier === 'Below' && tier !== 'None') return false;
      }
      // Search query (ID, Name, Khmer name, Line)
      if (weeklySearch.trim()) {
        const q = weeklySearch.toLowerCase().trim();
        const empId = (r.employee_id || '').toLowerCase();
        const empName = (r.employee_name || '').toLowerCase();
        const khmerName = (r.khmer_name || '').toLowerCase();
        const grp = (r.group_name || '').toLowerCase();
        if (!empId.includes(q) && !empName.includes(q) && !khmerName.includes(q) && !grp.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedWeek, selectedTier, weeklySearch, rules]);

  // Dynamic B1-B3 Tier Breakdown for selected line & week
  const weeklyTierCounts = useMemo(() => {
    let b3Count = 0, b3Payout = 0;
    let b2Count = 0, b2Payout = 0;
    let b1Count = 0, b1Payout = 0;
    let baseCount = 0, basePayout = 0;
    let belowCount = 0;

    const baseList = selectedWeek !== 'all'
      ? records.filter((r) => r.week_number === Number(selectedWeek))
      : records;

    baseList.forEach((r) => {
      const { tier, bonusAmount } = computeSewingWeeklyBonus(r.total_qty, rules[0]);
      if (tier === 'B3') {
        b3Count++;
        b3Payout += bonusAmount;
      } else if (tier === 'B2') {
        b2Count++;
        b2Payout += bonusAmount;
      } else if (tier === 'B1') {
        b1Count++;
        b1Payout += bonusAmount;
      } else if (tier === 'Base') {
        baseCount++;
        basePayout += bonusAmount;
      } else {
        belowCount++;
      }
    });

    return {
      total: baseList.length,
      b3Count, b3Payout,
      b2Count, b2Payout,
      b1Count, b1Payout,
      baseCount, basePayout,
      belowCount,
    };
  }, [records, selectedWeek, rules]);

  // Filtered Summary stats
  const filteredSummary = useMemo(() => {
    const totalQty = filteredRecords.reduce((acc, r) => acc + r.total_qty, 0);
    const totalBonus = filteredRecords.reduce((acc, r) => acc + r.bonus_amount, 0);
    const avgAchievement = filteredRecords.length > 0
      ? Math.round(filteredRecords.reduce((acc, r) => acc + r.achievement_pct, 0) / filteredRecords.length * 10) / 10
      : 0;

    return {
      total_records: filteredRecords.length,
      total_quantity: totalQty,
      total_bonus_payout: totalBonus,
      average_achievement_pct: avgAchievement,
    };
  }, [filteredRecords]);

  // Matrix Grade Allowance states
  const [matrixWorkers, setMatrixWorkers] = useState<any[]>([]);
  const [matrixSummary, setMatrixSummary] = useState({
    total_workers: 0,
    active_matrix_count: 0,
    total_payout: 0,
    average_payout: 0,
    max_allowance: 0,
    tier_distribution: {} as Record<number, number>,
  });
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixLineFilter, setMatrixLineFilter] = useState('all');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixTierFilter, setMatrixTierFilter] = useState('all');

  // Matrix Calculator Modal state
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [selectedMatrixWorker, setSelectedMatrixWorker] = useState<any | null>(null);

  // Inline input state
  const [inlineValues, setInlineValues] = useState<Record<string, number>>({});
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);

  // Monthly Evaluation Bonus states
  const [evalWorkers, setEvalWorkers] = useState<any[]>([]);
  const [evalSummary, setEvalSummary] = useState({
    total_workers: 0,
    active_eval_count: 0,
    total_payout: 0,
    average_payout: 0,
    max_bonus: 0,
    tier_distribution: {} as Record<number, number>,
  });
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalLineFilter, setEvalLineFilter] = useState('all');
  const [evalDeptFilter, setEvalDeptFilter] = useState('all');
  const [evalSearch, setEvalSearch] = useState('');
  const [evalTierFilter, setEvalTierFilter] = useState('all');
  const [evalInlineValues, setEvalInlineValues] = useState<Record<string, number>>({});
  const [evalInlineSavingId, setEvalInlineSavingId] = useState<string | null>(null);

  // Auto-Evaluation Hybrid Modal states
  const [autoEvalModalOpen, setAutoEvalModalOpen] = useState(false);
  const [autoEvalLoading, setAutoEvalLoading] = useState(false);
  const [autoEvalApplying, setAutoEvalApplying] = useState(false);
  const [autoEvalData, setAutoEvalData] = useState<any | null>(null);
  const [autoEvalOverrides, setAutoEvalOverrides] = useState<Record<string, number>>({});
  const [autoEvalModalSearch, setAutoEvalModalSearch] = useState('');
  const [autoEvalModalTierFilter, setAutoEvalModalTierFilter] = useState('all');

  // How to Calculate Guide states
  const [howToCalculateModalOpen, setHowToCalculateModalOpen] = useState(false);
  const [showCalculationGuide, setShowCalculationGuide] = useState(true);

  // Severance Pay 5% (ប្រាក់បំណាច់កុងត្រា ៥% - Article 73 FDC) states
  const [severanceWorkers, setSeveranceWorkers] = useState<any[]>([]);
  const [severanceSummary, setSeveranceSummary] = useState({
    total_workers: 0,
    fdc_workers: 0,
    udc_workers: 0,
    active_severance_count: 0,
    total_severance_payout: 0,
    average_severance_payout: 0,
    fdc_5pct_budget_potential: 0,
  });
  const [severanceLoading, setSeveranceLoading] = useState(false);
  const [severanceContractFilter, setSeveranceContractFilter] = useState<'all' | 'fdc' | 'udc' | 'has_severance' | 'zero'>('all');
  const [severanceDeptFilter, setSeveranceDeptFilter] = useState('all');
  const [severanceSearch, setSeveranceSearch] = useState('');
  const [severanceInlineValues, setSeveranceInlineValues] = useState<Record<string, number>>({});
  const [severanceInlineSavingId, setSeveranceInlineSavingId] = useState<string | null>(null);

  // Auto-Calculate Severance Modal states
  const [autoSeveranceModalOpen, setAutoSeveranceModalOpen] = useState(false);
  const [autoSeveranceLoading, setAutoSeveranceLoading] = useState(false);
  const [autoSeveranceApplying, setAutoSeveranceApplying] = useState(false);
  const [autoSeveranceData, setAutoSeveranceData] = useState<any | null>(null);
  const [autoSeveranceOverrides, setAutoSeveranceOverrides] = useState<Record<string, number>>({});
  const [autoSeveranceModalSearch, setAutoSeveranceModalSearch] = useState('');
  const [autoSeveranceModalFilter, setAutoSeveranceModalFilter] = useState<'all' | 'fdc' | 'changed' | 'zero'>('all');

  // How to Calculate Severance Pay 5% Guide Modal & Collapsible states
  const [howToSeveranceModalOpen, setHowToSeveranceModalOpen] = useState(false);
  const [showSeveranceGuide, setShowSeveranceGuide] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({
    employee_id: '',
    week_number: 40,
    week_start: '2026-10-05',
    week_end: '2026-10-10',
    group_name: 'Sewing Line 1',
    mon_qty: 210,
    tue_qty: 215,
    wed_qty: 205,
    thu_qty: 220,
    fri_qty: 225,
    sat_qty: 200,
    target_qty: 1200,
    notes: '',
  });

  // Load employees for fast autocomplete
  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch((err) => console.error('Error fetching employees:', err));
  }, []);

  const fetchSewing = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month);
      if (selectedGroup !== 'all') params.append('group', selectedGroup);

      const res = await fetch(`/api/bonus/sewing?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sewing bonus data');

      setRecords(data.records || []);
      setRules(data.rules || []);
      if (data.summary) setSummary(data.summary);
    } catch (err: any) {
      console.error('Error fetching sewing production:', err);
      showToast(err.message || 'Error fetching sewing production', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSewing();
  }, [month, selectedGroup]);

  const fetchMatrix = async () => {
    setMatrixLoading(true);
    try {
      const params = new URLSearchParams();
      if (matrixLineFilter !== 'all') params.append('line', matrixLineFilter);
      if (matrixSearch.trim()) params.append('search', matrixSearch.trim());

      const res = await fetch(`/api/bonus/sewing/matrix?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load matrix data');

      setMatrixWorkers(data.workers || []);
      if (data.summary) setMatrixSummary(data.summary);

      // Prepopulate inline values
      const initialMap: Record<string, number> = {};
      (data.workers || []).forEach((w: any) => {
        initialMap[w.id] = Number(w.sewing_skill_matrix || 0);
      });
      setInlineValues(initialMap);
    } catch (err: any) {
      console.error('Error fetching sewing matrix:', err);
      showToast(err.message || 'Error loading sewing matrix', 'error');
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [matrixLineFilter, matrixSearch]);

  const handleSaveInlineAllowance = async (employeeId: string, amount: number) => {
    setInlineSavingId(employeeId);
    try {
      const res = await fetch('/api/bonus/sewing/matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          sewing_skill_matrix: amount,
          updateActivePayroll: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update allowance');

      showToast(
        language === 'km'
          ? `បានកែប្រែប្រាក់ម៉ាទ្រីស $${amount} សម្រាប់ ${employeeId} ជោគជ័យ! ✓`
          : `Matrix allowance updated to $${amount} for ${employeeId}! ✓`,
        'success'
      );
      fetchMatrix();
    } catch (err: any) {
      showToast(err.message || 'Error updating allowance', 'error');
    } finally {
      setInlineSavingId(null);
    }
  };

  const filteredMatrixWorkers = useMemo(() => {
    return matrixWorkers.filter((w) => {
      const val = Number(w.sewing_skill_matrix || 0);
      if (matrixTierFilter === 'has_allowance') return val > 0;
      if (matrixTierFilter === 'zero') return val === 0;
      if (matrixTierFilter !== 'all') return val === Number(matrixTierFilter);
      return true;
    });
  }, [matrixWorkers, matrixTierFilter]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: matrixWorkers.length,
      has_allowance: 0,
      zero: 0,
    };
    STANDARD_SEWING_MATRIX_TIERS.forEach((t) => {
      counts[String(t.amount)] = 0;
    });

    matrixWorkers.forEach((w) => {
      const val = Number(w.sewing_skill_matrix || 0);
      if (val > 0) {
        counts.has_allowance = (counts.has_allowance || 0) + 1;
        counts[String(val)] = (counts[String(val)] || 0) + 1;
      } else {
        counts.zero = (counts.zero || 0) + 1;
      }
    });

    return counts;
  }, [matrixWorkers]);

  const handleExportMatrixCSV = () => {
    if (filteredMatrixWorkers.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No records to export', 'error');
      return;
    }

    const headers = [
      'Employee ID',
      'Khmer Name',
      'English Name',
      'Line / Group',
      'Role / Position',
      'Base Salary ($)',
      'Matrix Allowance ($)',
      'Matched Grade Tier',
      'Status',
    ];

    const rows = filteredMatrixWorkers.map((w) => {
      const amount = Number(w.sewing_skill_matrix || 0);
      const tier = STANDARD_SEWING_MATRIX_TIERS.find((t) => t.amount === amount);
      const grade = tier ? `${tier.grade} (${tier.label})` : amount > 0 ? `Custom ($${amount})` : 'Unassigned ($0)';
      return [
        w.id,
        `"${w.khmer_name || ''}"`,
        `"${w.employee_name || ''}"`,
        w.group_name || 'Line',
        `"${w.role || ''}"`,
        w.base_salary || 0,
        amount,
        `"${grade}"`,
        w.status || 'Active',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sewing_skill_matrix_allowances_${matrixLineFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Evaluation Bonus API calls & filters
  const fetchEvaluation = async () => {
    setEvalLoading(true);
    try {
      const params = new URLSearchParams();
      if (evalLineFilter !== 'all') params.append('line', evalLineFilter);
      if (evalDeptFilter !== 'all') params.append('department', evalDeptFilter);
      if (evalSearch.trim()) params.append('search', evalSearch.trim());

      const res = await fetch(`/api/bonus/evaluation?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load evaluation bonus data');

      setEvalWorkers(data.workers || []);
      if (data.summary) setEvalSummary(data.summary);

      const initialMap: Record<string, number> = {};
      (data.workers || []).forEach((w: any) => {
        initialMap[w.id] = Number(w.monthly_eval_bonus || 0);
      });
      setEvalInlineValues(initialMap);
    } catch (err: any) {
      console.error('Error fetching evaluation bonus:', err);
      showToast(err.message || 'Error loading evaluation bonus', 'error');
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [evalLineFilter, evalDeptFilter, evalSearch]);

  const handleSaveEvalBonus = async (employeeId: string, amount: number) => {
    setEvalInlineSavingId(employeeId);
    try {
      const res = await fetch('/api/bonus/evaluation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          monthly_eval_bonus: amount,
          updateActivePayroll: true,
          month,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update evaluation bonus');

      showToast(
        language === 'km'
          ? `បានកែប្រែប្រាក់រង្វាន់វាយតម្លៃ $${amount} សម្រាប់ ${employeeId} ជោគជ័យ! ✓`
          : `Evaluation bonus updated to $${amount} for ${employeeId}! ✓`,
        'success'
      );
      setEvalInlineValues((prev) => ({ ...prev, [employeeId]: amount }));
      fetchEvaluation();
    } catch (err: any) {
      showToast(err.message || 'Error updating evaluation bonus', 'error');
    } finally {
      setEvalInlineSavingId(null);
    }
  };

  const filteredEvalWorkers = useMemo(() => {
    return evalWorkers.filter((w) => {
      // Only display employees that are assigned to a production line / group
      const hasGroup = !!(w.group_name && w.group_name.trim());
      if (!hasGroup) return false;

      const val = Number(w.monthly_eval_bonus || 0);
      if (evalTierFilter === 'has_bonus') return val > 0;
      if (evalTierFilter === 'zero') return val === 0;
      if (evalTierFilter !== 'all') return val === Number(evalTierFilter);
      return true;
    });
  }, [evalWorkers, evalTierFilter]);

  const evalTierCounts = useMemo(() => {
    const validWorkers = evalWorkers.filter((w) => !!(w.group_name && w.group_name.trim()));
    const counts: Record<string, number> = {
      all: validWorkers.length,
      has_bonus: 0,
      zero: 0,
      '20': 0,
      '15': 0,
      '11': 0,
      '6': 0,
    };
    validWorkers.forEach((w) => {
      const val = Number(w.monthly_eval_bonus || 0);
      if (val > 0) {
        counts.has_bonus = (counts.has_bonus || 0) + 1;
        counts[String(val)] = (counts[String(val)] || 0) + 1;
      } else {
        counts.zero = (counts.zero || 0) + 1;
      }
    });
    return counts;
  }, [evalWorkers]);

  const handleExportEvalCSV = () => {
    if (filteredEvalWorkers.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No records to export', 'error');
      return;
    }
    const headers = [
      'Employee ID',
      'Khmer Name',
      'English Name',
      'Line / Group',
      'Role / Position',
      'Base Salary ($)',
      'Monthly Eval Bonus ($)',
      'Evaluation Tier',
      'Status',
    ];
    const rows = filteredEvalWorkers.map((w) => {
      const val = Number(w.monthly_eval_bonus || 0);
      const tierObj = STANDARD_EVALUATION_BONUS_TIERS.find((t) => t.amount === val);
      const tierLabel = tierObj ? tierObj.grade : val > 0 ? `$${val}` : 'None';
      return [
        w.id,
        `"${w.khmer_name || ''}"`,
        `"${w.employee_name || ''}"`,
        w.group_name || 'N/A',
        `"${w.role || ''}"`,
        Number(w.base_salary || 0).toFixed(2),
        val.toFixed(2),
        `"${tierLabel}"`,
        w.status || 'Active',
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `monthly_evaluation_bonus_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openAutoEvalModal = async () => {
    setAutoEvalLoading(true);
    setAutoEvalModalOpen(true);
    try {
      const res = await fetch(`/api/bonus/evaluation/auto-evaluate?month=${month}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate auto-evaluation');
      setAutoEvalData(data);
      // Prepopulate overrides with suggested_bonus
      const map: Record<string, number> = {};
      (data.items || []).forEach((item: any) => {
        map[item.employee_id] = item.suggested_bonus;
      });
      setAutoEvalOverrides(map);
    } catch (err: any) {
      showToast(err.message || 'Error running auto-evaluation', 'error');
    } finally {
      setAutoEvalLoading(false);
    }
  };

  const handleApplyAutoEval = async () => {
    setAutoEvalApplying(true);
    try {
      const res = await fetch('/api/bonus/evaluation/auto-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          apply: true,
          overrides: autoEvalOverrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply auto-evaluation');

      showToast(
        language === 'km'
          ? `បានអនុវត្ត និងរក្សាទុកការវាយតម្លៃស្វ័យប្រវត្តិសម្រាប់បុគ្គលិក ${data.updated_count} នាក់ (សរុប $${data.total_applied_payout}) ជោគជ័យ! ✓`
          : `Auto-evaluation applied for ${data.updated_count} staff (Total Payout: $${data.total_applied_payout.toFixed(2)})! ✓`,
        'success'
      );
      setAutoEvalModalOpen(false);
      fetchEvaluation();
    } catch (err: any) {
      showToast(err.message || 'Error applying auto-evaluation', 'error');
    } finally {
      setAutoEvalApplying(false);
    }
  };

  // Severance Pay 5% (Article 73 FDC) API calls & filters
  const fetchSeverance = async () => {
    setSeveranceLoading(true);
    try {
      const params = new URLSearchParams();
      if (severanceContractFilter === 'fdc') params.append('contract_type', 'FDC');
      else if (severanceContractFilter === 'udc') params.append('contract_type', 'UDC');
      if (severanceDeptFilter !== 'all') params.append('department', severanceDeptFilter);
      if (severanceSearch.trim()) params.append('search', severanceSearch.trim());
      params.append('pay_period', 'October 2026');

      const res = await fetch(`/api/bonus/severance?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load severance pay data');

      setSeveranceWorkers(data.workers || []);
      if (data.summary) {
        setSeveranceSummary({
          total_workers: data.summary.total_workers || 0,
          fdc_workers: data.summary.fdc_count || 0,
          udc_workers: data.summary.udc_count || 0,
          active_severance_count: data.summary.active_severance_count || 0,
          total_severance_payout: data.summary.total_severance_payout || 0,
          average_severance_payout: data.summary.average_severance || 0,
          fdc_5pct_budget_potential: data.summary.fdc_potential_5pct || 0,
        });
      }

      const initialMap: Record<string, number> = {};
      (data.workers || []).forEach((w: any) => {
        initialMap[w.id] = Number(w.severance_pay || 0);
      });
      setSeveranceInlineValues(initialMap);
    } catch (err: any) {
      console.error('Error fetching severance pay:', err);
      showToast(err.message || 'Error loading severance pay', 'error');
    } finally {
      setSeveranceLoading(false);
    }
  };

  useEffect(() => {
    fetchSeverance();
  }, [severanceContractFilter, severanceDeptFilter, severanceSearch]);

  const handleSaveSeverance = async (employeeId: string, amount: number) => {
    setSeveranceInlineSavingId(employeeId);
    try {
      const res = await fetch('/api/bonus/severance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          severance_pay: amount,
          pay_period: 'October 2026',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update severance pay');

      showToast(
        language === 'km'
          ? `បានកែប្រែប្រាក់បំណាច់កុងត្រា ៥% $${amount.toFixed(2)} សម្រាប់ ${employeeId} ជោគជ័យ! ✓`
          : `Severance pay updated to $${amount.toFixed(2)} for ${employeeId}! ✓`,
        'success'
      );
      setSeveranceInlineValues((prev) => ({ ...prev, [employeeId]: amount }));
      fetchSeverance();
    } catch (err: any) {
      showToast(err.message || 'Error updating severance pay', 'error');
    } finally {
      setSeveranceInlineSavingId(null);
    }
  };

  const filteredSeveranceWorkers = useMemo(() => {
    return severanceWorkers.filter((w) => {
      const val = Number(w.severance_pay || 0);
      const isFdc = (w.contract_type || '').includes('FDC');
      if (severanceContractFilter === 'has_severance') return val > 0;
      if (severanceContractFilter === 'zero') return val === 0;
      if (severanceContractFilter === 'fdc') return isFdc;
      if (severanceContractFilter === 'udc') return !isFdc;
      return true;
    });
  }, [severanceWorkers, severanceContractFilter]);

  const severanceCounts = useMemo(() => {
    const counts = {
      all: severanceWorkers.length,
      fdc: 0,
      udc: 0,
      has_severance: 0,
      zero: 0,
    };
    severanceWorkers.forEach((w) => {
      const val = Number(w.severance_pay || 0);
      const isFdc = (w.contract_type || '').includes('FDC');
      if (isFdc) counts.fdc += 1;
      else counts.udc += 1;
      if (val > 0) counts.has_severance += 1;
      else counts.zero += 1;
    });
    return counts;
  }, [severanceWorkers]);

  const handleExportSeveranceCSV = () => {
    if (filteredSeveranceWorkers.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No records to export', 'error');
      return;
    }
    const headers = [
      'Employee ID',
      'Khmer Name',
      'English Name',
      'Contract Type',
      'Line / Department',
      'Role / Position',
      'Base Salary ($)',
      'Suggested 5% Base ($)',
      'Severance Pay Col 50 ($)',
      'Contract Start',
      'Contract End',
      'Status',
    ];
    const rows = filteredSeveranceWorkers.map((w) => {
      const val = Number(w.severance_pay || 0);
      const suggested = Number(w.suggested_5_pct || 0);
      return [
        w.id,
        `"${w.khmer_name || ''}"`,
        `"${w.employee_name || ''}"`,
        `"${w.contract_type || ''}"`,
        `"${w.group_name || w.department_name || ''}"`,
        `"${w.role || ''}"`,
        Number(w.base_salary || 0).toFixed(2),
        suggested.toFixed(2),
        val.toFixed(2),
        w.contract_start || '',
        w.contract_end || '',
        w.status || 'Active',
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `severance_pay_5pct_col50_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openAutoSeveranceModal = async () => {
    setAutoSeveranceLoading(true);
    setAutoSeveranceModalOpen(true);
    try {
      const res = await fetch(`/api/bonus/severance/auto-calculate?pay_period=October 2026&target=fdc`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate severance auto-calculation');
      setAutoSeveranceData(data);
      // Prepopulate overrides with suggested_severance
      const map: Record<string, number> = {};
      (data.items || []).forEach((item: any) => {
        map[item.employee_id] = item.suggested_severance;
      });
      setAutoSeveranceOverrides(map);
    } catch (err: any) {
      showToast(err.message || 'Error running auto-calculation', 'error');
    } finally {
      setAutoSeveranceLoading(false);
    }
  };

  const handleApplyAutoSeverance = async () => {
    setAutoSeveranceApplying(true);
    try {
      const res = await fetch('/api/bonus/severance/auto-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pay_period: 'October 2026',
          custom_rates: autoSeveranceOverrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply severance calculation');

      showToast(
        language === 'km'
          ? `បានអនុវត្ត និងរក្សាទុកប្រាក់បំណាច់កុងត្រា ៥% សម្រាប់បុគ្គលិក ${data.updated_count} នាក់ (សរុប $${data.total_applied_payout}) ជោគជ័យ! ✓`
          : `Severance pay applied for ${data.updated_count} staff (Total Payout: $${data.total_applied_payout.toFixed(2)})! ✓`,
        'success'
      );
      setAutoSeveranceModalOpen(false);
      fetchSeverance();
    } catch (err: any) {
      showToast(err.message || 'Error applying severance calculation', 'error');
    } finally {
      setAutoSeveranceApplying(false);
    }
  };

  // Selected employee in manual entry form
  const matchedEmployee = useMemo(() => {
    if (!form.employee_id.trim()) return null;
    return (
      employees.find(
        (e) => e.id?.toUpperCase() === form.employee_id.trim().toUpperCase()
      ) || null
    );
  }, [form.employee_id, employees]);

  // Real-time calculation in manual entry modal
  const liveTotal = useMemo(() => {
    return (
      (form.mon_qty || 0) +
      (form.tue_qty || 0) +
      (form.wed_qty || 0) +
      (form.thu_qty || 0) +
      (form.fri_qty || 0) +
      (form.sat_qty || 0)
    );
  }, [form.mon_qty, form.tue_qty, form.wed_qty, form.thu_qty, form.fri_qty, form.sat_qty]);

  const activeRule = rules.length > 0 ? rules[0] : undefined;

  const liveCalc = useMemo(() => {
    return computeSewingWeeklyBonus(liveTotal, {
      weekly_target_qty: form.target_qty || 1200,
      ...activeRule,
    });
  }, [liveTotal, form.target_qty, activeRule]);

  // Handle open manual entry for new row
  const handleOpenManualEntry = () => {
    setEditingId(null);
    setForm({
      employee_id: '',
      week_number: 40,
      week_start: '2026-10-05',
      week_end: '2026-10-10',
      group_name: selectedGroup === 'Sewing Line 2' || selectedGroup === 'Sew-L.2' ? 'Sewing Line 2' : 'Sewing Line 1',
      mon_qty: 210,
      tue_qty: 215,
      wed_qty: 205,
      thu_qty: 220,
      fri_qty: 225,
      sat_qty: 200,
      target_qty: 1200,
      notes: '',
    });
    setModalOpen(true);
  };

  // Handle edit existing record
  const handleEditRecord = (record: SewingWeeklyProduction) => {
    setEditingId(record.id);
    setForm({
      employee_id: record.employee_id,
      week_number: record.week_number,
      week_start: record.week_start,
      week_end: record.week_end,
      group_name: record.group_name || 'Sewing Line 1',
      mon_qty: record.mon_qty || 0,
      tue_qty: record.tue_qty || 0,
      wed_qty: record.wed_qty || 0,
      thu_qty: record.thu_qty || 0,
      fri_qty: record.fri_qty || 0,
      sat_qty: record.sat_qty || 0,
      target_qty: record.target_qty || 1200,
      notes: record.notes || '',
    });
    setModalOpen(true);
  };

  // Handle delete record
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/bonus/sewing?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');

      showToast(
        language === 'km'
          ? 'បានលុបកំណត់ត្រាទិន្នផលដេរដោយជោគជ័យ'
          : 'Sewing production record deleted successfully',
        'success'
      );
      setDeleteConfirmId(null);
      fetchSewing();
    } catch (err: any) {
      showToast(err.message || 'Error deleting record', 'error');
    }
  };

  // Handle save manual entry
  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bonus/sewing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          ...form,
          month,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log output');

      showToast(
        language === 'km'
          ? `បានកត់ត្រាទិន្នផលដេរ ${data.record.total_qty} កង់ (បុព្វលាភ៖ $${data.record.bonus_amount})! ✓`
          : `Sewing output saved: ${data.record.total_qty} pcs (Bonus: $${data.record.bonus_amount})! ✓`,
        'success'
      );
      setModalOpen(false);
      fetchSewing();
    } catch (err: any) {
      showToast(err.message || 'Error saving output', 'error');
    }
  };

  // Export current table to CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No records to export', 'error');
      return;
    }

    const headers = [
      'Week',
      'Period Dates',
      'Line',
      'Employee ID',
      'Khmer Name',
      'English Name',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Total Qty',
      'Target Qty',
      'Achieved %',
      'Tier',
      'Bonus ($)',
      'Status',
    ];

    const listToExport = filteredRecords.length > 0 ? filteredRecords : records;

    const rows = listToExport.map((r) => {
      const { tierLabel } = computeSewingWeeklyBonus(r.total_qty, rules[0]);
      return [
        `W${r.week_number}`,
        `"${formatDateDMY(r.week_start)} - ${formatDateDMY(r.week_end)}"`,
        r.group_name,
        r.employee_id,
        `"${r.khmer_name || ''}"`,
        `"${r.employee_name || ''}"`,
        r.mon_qty,
        r.tue_qty,
        r.wed_qty,
        r.thu_qty,
        r.fri_qty,
        r.sat_qty,
        r.total_qty,
        r.target_qty,
        `${r.achievement_pct}%`,
        `"${tierLabel}"`,
        r.bonus_amount,
        r.status,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sewing_production_weekly_${month}_${selectedGroup}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Presets for weeks
  const setWeekPreset = (weekNum: number) => {
    let start = '2026-10-05';
    let end = '2026-10-10';
    if (weekNum === 41) {
      start = '2026-10-12';
      end = '2026-10-17';
    } else if (weekNum === 42) {
      start = '2026-10-19';
      end = '2026-10-24';
    } else if (weekNum === 43) {
      start = '2026-10-26';
      end = '2026-10-31';
    }
    setForm((prev) => ({
      ...prev,
      week_number: weekNum,
      week_start: start,
      week_end: end,
    }));
  };

  // Batch line entry modal state (Sewing Line 1 / Sewing Line 2)
  const [lineBatchModalOpen, setLineBatchModalOpen] = useState(false);
  const [batchLineName, setBatchLineName] = useState<'Sewing Line 1' | 'Sewing Line 2'>('Sewing Line 1');
  const [batchWeek, setBatchWeek] = useState(40);
  const [batchWeekStart, setBatchWeekStart] = useState('2026-10-05');
  const [batchWeekEnd, setBatchWeekEnd] = useState('2026-10-10');
  const [batchWorkers, setBatchWorkers] = useState<any[]>([]);
  const [batchSaving, setBatchSaving] = useState(false);

  // Helper to build batch rows: preserves existing records from state/DB if they exist
  const buildBatchRows = (
    lineName: 'Sewing Line 1' | 'Sewing Line 2',
    weekNum: number,
    srcRecords = records,
    srcEmployees = employees
  ) => {
    const lineWorkers = srcEmployees.filter((e) =>
      lineName === 'Sewing Line 1'
        ? e.group_name === 'Sewing Line 1' || e.group_name === 'Sew-L.1'
        : e.group_name === 'Sewing Line 2' || e.group_name === 'Sew-L.2'
    );
    return lineWorkers.map((w) => {
      const existing = srcRecords.find(
        (r) => r.employee_id === w.id && r.week_number === weekNum
      );
      if (existing) {
        return {
          employee_id: w.id,
          employee_name: `${w.first_name} ${w.last_name}`,
          khmer_name: w.khmer_name || '',
          group_name: lineName,
          mon_qty: existing.mon_qty,
          tue_qty: existing.tue_qty,
          wed_qty: existing.wed_qty,
          thu_qty: existing.thu_qty,
          fri_qty: existing.fri_qty,
          sat_qty: existing.sat_qty,
          target_qty: existing.target_qty || 1200,
          notes: existing.notes || '',
        };
      }
      return {
        employee_id: w.id,
        employee_name: `${w.first_name} ${w.last_name}`,
        khmer_name: w.khmer_name || '',
        group_name: lineName,
        mon_qty: 210,
        tue_qty: 215,
        wed_qty: 205,
        thu_qty: 220,
        fri_qty: 225,
        sat_qty: 200,
        target_qty: 1200,
        notes: '',
      };
    });
  };

  const setBatchWeekPreset = (weekNum: number) => {
    let start = '2026-10-05';
    let end = '2026-10-10';
    if (weekNum === 41) {
      start = '2026-10-12';
      end = '2026-10-17';
    } else if (weekNum === 42) {
      start = '2026-10-19';
      end = '2026-10-24';
    } else if (weekNum === 43) {
      start = '2026-10-26';
      end = '2026-10-31';
    }
    setBatchWeek(weekNum);
    setBatchWeekStart(start);
    setBatchWeekEnd(end);
    setBatchWorkers(buildBatchRows(batchLineName, weekNum));
  };

  const handleOpenLineBatchModal = (
    lineName: 'Sewing Line 1' | 'Sewing Line 2',
    weekNum = batchWeek
  ) => {
    setBatchLineName(lineName);
    setBatchWeek(weekNum);
    let start = '2026-10-05';
    let end = '2026-10-10';
    if (weekNum === 41) {
      start = '2026-10-12';
      end = '2026-10-17';
    } else if (weekNum === 42) {
      start = '2026-10-19';
      end = '2026-10-24';
    } else if (weekNum === 43) {
      start = '2026-10-26';
      end = '2026-10-31';
    }
    setBatchWeekStart(start);
    setBatchWeekEnd(end);
    setBatchWorkers(buildBatchRows(lineName, weekNum));
    setLineBatchModalOpen(true);
  };

  const handleGenerateStandardLogs = async () => {
    if (
      !confirm(
        language === 'km'
          ? 'តើអ្នកចង់បង្កើតកំណត់ត្រាទិន្នផលដេរគំរូពេញលេញ (Weeks 40–43) សម្រាប់ Sewing Line 1 និង Sewing Line 2 មែនទេ?'
          : 'Generate full monthly output logs (Weeks 40–43) for Sewing Line 1 (35 workers) & Sewing Line 2 (36 workers)?'
      )
    ) {
      return;
    }

    setGeneratingLines(true);
    try {
      const res = await fetch('/api/bonus/sewing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'populate_lines', month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to populate sewing lines');

      showToast(
        language === 'km'
          ? `បានបង្កើតកំណត់ត្រាទិន្នផលដេរចំនួន ${data.count} ដោយជោគជ័យ!`
          : `Successfully generated ${data.count} weekly sewing output logs!`,
        'success'
      );
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      fetchSewing();
    } catch (err: any) {
      showToast(err.message || 'Error populating sewing lines', 'error');
    } finally {
      setGeneratingLines(false);
    }
  };

  const applyBatchPreset = (preset: 'tier1' | 'tier2' | 'tier3' | 'base' | 'zero') => {
    setBatchWorkers((prev) =>
      prev.map((w) => {
        if (preset === 'tier1') {
          return { ...w, mon_qty: 210, tue_qty: 215, wed_qty: 205, thu_qty: 220, fri_qty: 225, sat_qty: 200 };
        } else if (preset === 'tier2') {
          return { ...w, mon_qty: 225, tue_qty: 225, wed_qty: 220, thu_qty: 230, fri_qty: 225, sat_qty: 220 };
        } else if (preset === 'tier3') {
          return { ...w, mon_qty: 240, tue_qty: 245, wed_qty: 235, thu_qty: 240, fri_qty: 245, sat_qty: 235 };
        } else if (preset === 'base') {
          return { ...w, mon_qty: 185, tue_qty: 190, wed_qty: 185, thu_qty: 195, fri_qty: 195, sat_qty: 190 };
        } else {
          return { ...w, mon_qty: 0, tue_qty: 0, wed_qty: 0, thu_qty: 0, fri_qty: 0, sat_qty: 0 };
        }
      })
    );
  };

  const handleSaveBatchProduction = async () => {
    if (batchWorkers.length === 0) return;
    setBatchSaving(true);
    try {
      const recordsToSave = batchWorkers.map((w) => ({
        employee_id: w.employee_id,
        group_name: batchLineName,
        week_number: batchWeek,
        week_start: batchWeekStart,
        week_end: batchWeekEnd,
        month,
        mon_qty: w.mon_qty,
        tue_qty: w.tue_qty,
        wed_qty: w.wed_qty,
        thu_qty: w.thu_qty,
        fri_qty: w.fri_qty,
        sat_qty: w.sat_qty,
        target_qty: w.target_qty,
        notes: w.notes,
      }));

      const res = await fetch('/api/bonus/sewing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save batch weekly logs');

      showToast(
        language === 'km'
          ? `បានកត់ត្រាទិន្នផលដេរដោយជោគជ័យសម្រាប់ ${batchLineName} (${data.count} នាក់)! ✓`
          : `Weekly output logs saved for ${batchLineName} (${data.count} operators)! ✓`,
        'success'
      );
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      setLineBatchModalOpen(false);
      fetchSewing();
    } catch (err: any) {
      showToast(err.message || 'Error saving batch records', 'error');
    } finally {
      setBatchSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('weekly')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'weekly'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors size={15} className={activeSubTab === 'weekly' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>{language === 'km' ? 'ទិន្នផលដេរប្រចាំសប្តាហ៍ (B1–B3 Logs)' : 'Weekly Output Logs (B1–B3)'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold">
              {summary.total_records}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('daily')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'daily'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target size={15} className={activeSubTab === 'daily' ? 'text-amber-600' : 'text-slate-400'} />
            <span>{language === 'km' ? 'រង្វាន់គោលដៅប្រចាំថ្ងៃ (Daily Target)' : 'Daily Target Bonus'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono font-bold">
              B1–B3 / Col 49
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('matrix');
              if (matrixWorkers.length === 0) fetchMatrix();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'matrix'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator size={15} className={activeSubTab === 'matrix' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>{language === 'km' ? 'ម៉ាទ្រីសកម្រិតជំនាញដេរ (Matrix Allowance)' : 'Sewing Matrix Grade Allowance'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold">
              ${matrixSummary.total_payout.toFixed(0)}/mo ({matrixSummary.active_matrix_count} workers)
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('evaluation');
              if (evalWorkers.length === 0) fetchEvaluation();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'evaluation'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award size={15} className={activeSubTab === 'evaluation' ? 'text-purple-600' : 'text-slate-400'} />
            <span>{language === 'km' ? 'ប្រាក់រង្វាន់វាយតម្លៃ (Evaluation Bonus)' : 'Monthly Evaluation Bonus'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold">
              ${evalSummary.total_payout.toFixed(0)}/mo ({evalSummary.active_eval_count} workers)
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('severance');
              if (severanceWorkers.length === 0) fetchSeverance();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'severance'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={15} className={activeSubTab === 'severance' ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{language === 'km' ? 'ប្រាក់បំណាច់កុងត្រា ៥% (Severance Pay)' : 'Severance Pay 5% (Col 50)'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold">
              ${severanceSummary.total_severance_payout.toFixed(0)}/mo ({severanceSummary.active_severance_count} active / {severanceSummary.fdc_workers} FDC)
            </span>
          </button>
        </div>

        {activeSubTab === 'severance' ? (
          <button
            onClick={openAutoSeveranceModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>{language === 'km' ? '⚡ គណនា ៥% ស្វ័យប្រវត្តិ (FDC)' : '⚡ Auto-Calculate 5% (FDC)'}</span>
          </button>
        ) : activeSubTab === 'evaluation' ? (
          <button
            onClick={openAutoEvalModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>{language === 'km' ? '⚡ គណនាវាយតម្លៃស្វ័យប្រវត្តិ' : '⚡ Auto-Calculate Evaluation'}</span>
          </button>
        ) : activeSubTab === 'daily' ? null : (
          <button
            onClick={() => {
              setSelectedMatrixWorker(null);
              setMatrixModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>{language === 'km' ? 'ម៉ាស៊ីនគិតម៉ាទ្រីស (Matrix Calculator)' : 'Open Matrix Calculator'}</span>
          </button>
        )}
      </div>

      {activeSubTab === 'weekly' && (
        <div className="space-y-4">
          {/* Top Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-indigo-600" />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="2026-10">October 2026 (Weeks 40–43)</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">August 2026</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ខ្សែសង្វាក់ (All Lines)' : 'All Sewing Lines'}</option>
                  <option value="Sewing Line 1">{language === 'km' ? 'ខ្សែដេរទី ១ (Sewing Line 1)' : 'Sewing Line 1'}</option>
                  <option value="Sewing Line 2">{language === 'km' ? 'ខ្សែដេរទី ២ (Sewing Line 2)' : 'Sewing Line 2'}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={fetchSewing}
                title={language === 'km' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                title={language === 'km' ? 'ទាញយកទិន្នន័យ CSV' : 'Export CSV'}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={14} />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <UploadCloud size={15} />
                <span className="hidden sm:inline">{language === 'km' ? 'នាំចូល CSV' : 'Import CSV'}</span>
              </button>

              {/* Add Sewing Line 1 Button */}
              <button
                onClick={() => handleOpenLineBatchModal('Sewing Line 1')}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title={language === 'km' ? 'បញ្ចូលទិន្នផលសម្រាប់ខ្សែដេរទី ១' : 'Add weekly output for Sewing Line 1'}
              >
                <Plus size={14} className="text-indigo-600" />
                <span>{language === 'km' ? '+ បញ្ចូលខ្សែទី ១' : '+ Add Sewing Line 1'}</span>
              </button>

              {/* Add Sewing Line 2 Button */}
              <button
                onClick={() => handleOpenLineBatchModal('Sewing Line 2')}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title={language === 'km' ? 'បញ្ចូលទិន្នផលសម្រាប់ខ្សែដេរទី ២' : 'Add weekly output for Sewing Line 2'}
              >
                <Plus size={14} className="text-purple-600" />
                <span>{language === 'km' ? '+ បញ្ចូលខ្សែទី ២' : '+ Add Sewing Line 2'}</span>
              </button>

              {/* Entry Manually Button */}
              <button
                onClick={handleOpenManualEntry}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus size={15} />
                <span>{language === 'km' ? 'បញ្ចូលម្នាក់ៗ (Manual)' : 'Entry Manually'}</span>
              </button>
            </div>
          </div>

          {/* Week & B1-B3 Tier Breakdown Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Week Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedWeek('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeek === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'km' ? 'គ្រប់សប្តាហ៍' : 'All Weeks'} ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek('40')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeek === '40'
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  W40 <span className="text-[10px] opacity-80">(05/10 – 10/10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek('41')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeek === '41'
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  W41 <span className="text-[10px] opacity-80">(12/10 – 17/10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek('42')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeek === '42'
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  W42 <span className="text-[10px] opacity-80">(19/10 – 24/10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek('43')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeek === '43'
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  W43 <span className="text-[10px] opacity-80">(26/10 – 31/10)</span>
                </button>
              </div>

              {/* Operator Search */}
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'km' ? 'ស្វែងរក ID ឬ ឈ្មោះកម្មករ...' : 'Search worker ID or name...'}
                  value={weeklySearch}
                  onChange={(e) => setWeeklySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
                {weeklySearch && (
                  <button
                    onClick={() => setWeeklySearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* B1–B3 Tier Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Award size={13} className="text-amber-500" />
                {language === 'km' ? 'កម្រិតប្រាក់រង្វាន់ (B1–B3):' : 'Incentive Tiers (B1–B3):'}
              </span>

              {/* All Tiers */}
              <button
                type="button"
                onClick={() => setSelectedTier('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTier === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {language === 'km' ? 'គ្រប់កម្រិត' : 'All Tiers'} ({weeklyTierCounts.total})
              </button>

              {/* Tier 3 (B3) */}
              <button
                type="button"
                onClick={() => setSelectedTier(selectedTier === 'B3' ? 'all' : 'B3')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'B3'
                    ? 'bg-purple-700 text-white shadow-2xs ring-2 ring-purple-300'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span>B3 (≥120% | +$20)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedTier === 'B3' ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-800'
                }`}>
                  {weeklyTierCounts.b3Count} (${weeklyTierCounts.b3Payout})
                </span>
              </button>

              {/* Tier 2 (B2) */}
              <button
                type="button"
                onClick={() => setSelectedTier(selectedTier === 'B2' ? 'all' : 'B2')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'B2'
                    ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-300'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>B2 (≥110% | +$15)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedTier === 'B2' ? 'bg-emerald-900 text-white' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {weeklyTierCounts.b2Count} (${weeklyTierCounts.b2Payout})
                </span>
              </button>

              {/* Tier 1 (B1) */}
              <button
                type="button"
                onClick={() => setSelectedTier(selectedTier === 'B1' ? 'all' : 'B1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'B1'
                    ? 'bg-blue-700 text-white shadow-2xs ring-2 ring-blue-300'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>B1 (≥100% | +$10)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedTier === 'B1' ? 'bg-blue-900 text-white' : 'bg-blue-200 text-blue-800'
                }`}>
                  {weeklyTierCounts.b1Count} (${weeklyTierCounts.b1Payout})
                </span>
              </button>

              {/* Base Tier */}
              <button
                type="button"
                onClick={() => setSelectedTier(selectedTier === 'Base' ? 'all' : 'Base')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'Base'
                    ? 'bg-amber-700 text-white shadow-2xs ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Base (≥90% | +$5)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedTier === 'Base' ? 'bg-amber-900 text-white' : 'bg-amber-200 text-amber-800'
                }`}>
                  {weeklyTierCounts.baseCount} (${weeklyTierCounts.basePayout})
                </span>
              </button>

              {/* Below Target */}
              <button
                type="button"
                onClick={() => setSelectedTier(selectedTier === 'Below' ? 'all' : 'Below')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTier === 'Below'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>&lt;90% ($0)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedTier === 'Below' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {weeklyTierCounts.belowCount}
                </span>
              </button>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'km' ? 'ចំនួនកំណត់ត្រា' : 'Total Logs'}
                </span>
                {(selectedWeek !== 'all' || selectedTier !== 'all' || weeklySearch) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                    Filtered
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {filteredSummary.total_records}
                {filteredSummary.total_records !== summary.total_records && (
                  <span className="text-xs font-normal text-slate-400 ml-1.5">/ {summary.total_records}</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ទិន្នផលដេរសរុប' : 'Total Pieces Sewn'}
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {filteredSummary.total_quantity.toLocaleString()} pcs
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'អត្រាសម្រេចគោលដៅមធ្យម' : 'Avg Achievement'}
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {filteredSummary.average_achievement_pct}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'បុព្វលាភទិន្នផលសរុប' : 'Total Bonus Payout'}
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                ${filteredSummary.total_bonus_payout.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Production Rules Reference Banner */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-900">
            <div className="flex items-center gap-2.5">
              <Award size={18} className="text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">
                  {language === 'km' ? 'គោលដៅផលិតកម្មសប្តាហ៍ Hestra៖ ១,២០០ កង់' : 'Hestra Factory Weekly Target: 1,200 pcs'}
                </span>
                <span className="text-slate-600 ml-1.5">
                  — Base (≥90%): +$5.00 | Tier 1 (B1 ≥100%): +$10.00 | Tier 2 (B2 ≥110%): +$15.00 | Tier 3 (B3 ≥120%): +$20.00
                </span>
              </div>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
              Auto-flows to Monthly Payroll Register
            </span>
          </div>

          {/* Production Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-bold">Week</th>
                    <th className="p-2.5 font-bold">Line</th>
                    <th className="p-2.5 font-bold">ID</th>
                    {language === 'km' && <th className="p-2.5 font-bold font-khmer">ឈ្មោះខ្មែរ</th>}
                    <th className="p-2.5 font-bold">Name (EN)</th>
                    <th className="p-2 text-center font-bold">Mon</th>
                    <th className="p-2 text-center font-bold">Tue</th>
                    <th className="p-2 text-center font-bold">Wed</th>
                    <th className="p-2 text-center font-bold">Thu</th>
                    <th className="p-2 text-center font-bold">Fri</th>
                    <th className="p-2 text-center font-bold">Sat</th>
                    <th className="p-2.5 text-center font-bold text-indigo-800 bg-indigo-50/50">Total Qty</th>
                    <th className="p-2.5 text-center font-bold">Target</th>
                    <th className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50">Achieved %</th>
                    <th className="p-2.5 text-center font-bold text-amber-800 bg-amber-50">Bonus Payout</th>
                    <th className="p-2.5 text-center font-bold">Status</th>
                    <th className="p-2.5 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={language === 'km' ? 17 : 16} className="p-8 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading weekly records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={language === 'km' ? 17 : 16} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Scissors size={24} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {language === 'km' ? 'មិនទាន់មានកំណត់ត្រាទិន្នផលដេរប្រចាំសប្តាហ៍' : 'No weekly sewing records found for this period'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {language === 'km'
                              ? 'សូមជ្រើសរើសខ្សែដេរខាងក្រោមដើម្បីបញ្ចូលទិន្នផល ឬកត់ត្រាទិន្នផលផលិតកម្ម៖'
                              : 'Select a line below to add weekly production output logs:'}
                          </p>
                          <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                              onClick={() => handleOpenLineBatchModal('Sewing Line 1')}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>+ {language === 'km' ? 'បញ្ចូលខ្សែដេរទី ១' : 'Add Sewing Line 1'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenLineBatchModal('Sewing Line 2')}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>+ {language === 'km' ? 'បញ្ចូលខ្សែដេរទី ២' : 'Add Sewing Line 2'}</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={language === 'km' ? 17 : 16} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Filter size={24} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {language === 'km' ? 'រកមិនឃើញកំណត់ត្រាដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No records match current filter criteria'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {language === 'km'
                              ? 'សូមសាកល្បងសម្អាតពាក្យស្វែងរក ឬជ្រើសរើសគ្រប់កម្រិត/សប្តាហ៍'
                              : 'Try clearing the search query or selecting All Weeks / All Tiers.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWeek('all');
                              setSelectedTier('all');
                              setWeeklySearch('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            {language === 'km' ? 'កំណត់លក្ខខណ្ឌឡើងវិញ' : 'Reset Filters'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 group">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">W{r.week_number}</div>
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {formatDateDMY(r.week_start)} – {formatDateDMY(r.week_end)}
                          </div>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.group_name === 'Sewing Line 1' || r.group_name === 'Sew-L.1' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Sewing Line 1
                            </span>
                          ) : r.group_name === 'Sewing Line 2' || r.group_name === 'Sew-L.2' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                              Sewing Line 2
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                              {r.group_name}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{r.employee_id}</td>
                        {language === 'km' && (
                          <td className="p-2.5 font-khmer text-slate-800 truncate max-w-[110px]">{r.khmer_name || '--'}</td>
                        )}
                        <td className="p-2.5 font-medium text-slate-900 truncate max-w-[130px]">{r.employee_name}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.mon_qty}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.tue_qty}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.wed_qty}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.thu_qty}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.fri_qty}</td>
                        <td className="p-2 text-center font-mono text-slate-700">{r.sat_qty}</td>
                        <td className="p-2.5 text-center font-mono font-black text-indigo-700 bg-indigo-50/30">
                          {r.total_qty.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{r.target_qty}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              r.achievement_pct >= 120
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : r.achievement_pct >= 110
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : r.achievement_pct >= 100
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : r.achievement_pct >= 90
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {r.achievement_pct}% {r.achievement_pct >= 120 ? '(B3)' : r.achievement_pct >= 110 ? '(B2)' : r.achievement_pct >= 100 ? '(B1)' : r.achievement_pct >= 90 ? '(Base)' : ''}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-amber-700 bg-amber-50/50">
                          +${r.bonus_amount.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleEditRecord(r)}
                              title="Edit"
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(r.id)}
                              title="Delete"
                              className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
      )}

      {/* SUB-VIEW: DAILY TARGET BONUS (B1-B3) */}
      {activeSubTab === 'daily' && (
        <DailyTargetBonusManager initialMonth={month} />
      )}

      {/* SUB-VIEW 2: SEWING MATRIX GRADE ALLOWANCE */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Top Filter Bar for Matrix */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={matrixLineFilter}
                  onChange={(e) => setMatrixLineFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ខ្សែសង្វាក់ដេរទាំងអស់' : 'All Sewing Lines'}</option>
                  <option value="Sewing Line 1">{language === 'km' ? 'ខ្សែដេរទី ១ (Sewing Line 1)' : 'Sewing Line 1'}</option>
                  <option value="Sewing Line 2">{language === 'km' ? 'ខ្សែដេរទី ២ (Sewing Line 2)' : 'Sewing Line 2'}</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'km' ? 'ស្វែងរកតាម ID ឬ ឈ្មោះ...' : 'Search by ID or Name...'}
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-48 sm:w-64 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchMatrix}
                title={language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw size={15} className={matrixLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExportMatrixCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={14} />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMatrixWorker(null);
                  setMatrixModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Calculator size={15} />
                <span>{language === 'km' ? 'ម៉ាស៊ីនគិតលេខម៉ាទ្រីស' : 'Evaluate Worker'}</span>
              </button>
            </div>
          </div>

          {/* Matrix Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ចំនួនជាងដេរសរុប' : 'Total Sewing Operators'}
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{matrixSummary.total_workers}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'មានប្រាក់ម៉ាទ្រីស' : 'With Matrix Allowance'}
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {matrixSummary.active_matrix_count} workers
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ទឹកប្រាក់ម៉ាទ្រីសសរុប/ខែ' : 'Total Monthly Payout'}
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                ${matrixSummary.total_payout.toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ប្រាក់ឧបត្ថម្ភមធ្យម' : 'Average Allowance'}
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                ${matrixSummary.average_payout.toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'កម្រិតខ្ពស់បំផុត' : 'Highest Matrix Tier'}
              </span>
              <div className="text-2xl font-black text-purple-600 mt-1 font-mono">
                ${matrixSummary.max_allowance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 12 Standard Factory Tiers Filter Pill Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                {language === 'km' ? 'កម្រិតម៉ាទ្រីសស្តង់ដារ ១២ ថ្នាក់ (12 Standard Factory Tiers)' : '12 Standard Factory Tiers Filter'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredMatrixWorkers.length} {language === 'km' ? 'នាក់បង្ហាញ' : 'workers shown'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              <button
                onClick={() => setMatrixTierFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matrixTierFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({tierCounts.all || 0})
              </button>

              <button
                onClick={() => setMatrixTierFilter('has_allowance')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matrixTierFilter === 'has_allowance'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {language === 'km' ? 'មានប្រាក់ម៉ាទ្រីស' : 'Active'} ({tierCounts.has_allowance || 0})
              </button>

              {STANDARD_SEWING_MATRIX_TIERS.map((tier) => {
                const count = tierCounts[String(tier.amount)] || 0;
                const isSelected = matrixTierFilter === String(tier.amount);
                return (
                  <button
                    key={tier.amount}
                    onClick={() => setMatrixTierFilter(isSelected ? 'all' : String(tier.amount))}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : count > 0
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                    title={`${tier.grade}: ${tier.label} - ${tier.description}`}
                  >
                    <span className="font-bold">${tier.amount}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}

              <button
                onClick={() => setMatrixTierFilter('zero')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  matrixTierFilter === 'zero'
                    ? 'bg-rose-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                $0 ({tierCounts.zero || 0})
              </button>
            </div>
          </div>

          {/* Matrix Workers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3 font-bold">ID</th>
                    <th className="p-3 font-bold">{language === 'km' ? 'ឈ្មោះបុគ្គលិក (Employee Name)' : 'Employee Name'}</th>
                    <th className="p-3 font-bold">Line</th>
                    <th className="p-3 font-bold">Role / Position</th>
                    <th className="p-3 text-right font-bold">Base Salary</th>
                    <th className="p-3 text-center font-bold">Current Tier</th>
                    <th className="p-3 text-center font-bold text-indigo-900 bg-indigo-50/60">
                      Quick Input & Tier Select ($)
                    </th>
                    <th className="p-3 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixLoading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline-block mr-2" size={18} /> Loading sewing matrix workers...
                      </td>
                    </tr>
                  ) : filteredMatrixWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        No sewing operators found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrixWorkers.map((w) => {
                      const amount = Number(w.sewing_skill_matrix || 0);
                      const matchedTier = STANDARD_SEWING_MATRIX_TIERS.find((t) => t.amount === amount);
                      const currentVal = inlineValues[w.id] ?? amount;
                      const hasChanged = currentVal !== amount;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/70 group transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{w.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {w.first_name?.[0] || 'S'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {w.employee_name}
                                </div>
                                {language === 'km' && w.khmer_name && (
                                  <div className="font-khmer text-slate-500 text-[11px]">
                                    {w.khmer_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {w.group_name ? w.group_name : (language === 'km' ? 'មិនមានខ្សែ' : 'No Line')}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{w.role || 'Sewing Operator'}</td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-700">
                            ${Number(w.base_salary || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {matchedTier ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span className="font-mono font-black">${matchedTier.amount}</span>
                                <span className="opacity-75">&bull; {matchedTier.grade}</span>
                              </span>
                            ) : amount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="font-mono font-black">${amount}</span>
                                <span className="opacity-75">(Custom)</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                                $0 Unassigned
                              </span>
                            )}
                          </td>

                          {/* Quick Input & Standard Tier Dropdown */}
                          <td className="p-2.5 text-center bg-indigo-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Standard Tiers Preset Select */}
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setInlineValues((prev) => ({ ...prev, [w.id]: val }));
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[140px]"
                              >
                                <option value={0}>$0 (None)</option>
                                {STANDARD_SEWING_MATRIX_TIERS.map((t) => (
                                  <option key={t.amount} value={t.amount}>
                                    ${t.amount} — {t.grade} ({t.label})
                                  </option>
                                ))}
                                {!STANDARD_SEWING_MATRIX_TIERS.some((t) => t.amount === currentVal) && currentVal > 0 && (
                                  <option value={currentVal}>${currentVal} (Custom)</option>
                                )}
                              </select>

                              {/* Manual Dollar Amount Input */}
                              <div className="relative w-20">
                                <span className="absolute left-2 top-1 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setInlineValues((prev) => ({ ...prev, [w.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlineAllowance(w.id, currentVal);
                                    }
                                  }}
                                  className="w-full text-xs font-mono font-bold pl-5 pr-1 py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                                />
                              </div>

                              {/* Save Button (shows when value is modified) */}
                              {hasChanged && (
                                <button
                                  onClick={() => handleSaveInlineAllowance(w.id, currentVal)}
                                  disabled={inlineSavingId === w.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 transition-all animate-in fade-in"
                                  title="Save to database and active payroll"
                                >
                                  {inlineSavingId === w.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>{language === 'km' ? 'រក្សាទុក' : 'Save'}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Calculate Button */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedMatrixWorker({
                                  id: w.id,
                                  name: w.employee_name,
                                  khmer_name: w.khmer_name,
                                  role: w.role,
                                  group_name: w.group_name,
                                  currentMatrix: amount,
                                  base_salary: Number(w.base_salary || 0),
                                });
                                setMatrixModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                              title={language === 'km' ? 'វាយតម្លៃជំនាញ និងគណនាប្រាក់ឧបត្ថម្ភ' : 'Evaluate skills and calculate allowance'}
                            >
                              <Calculator size={13} />
                              <span>{language === 'km' ? 'គណនា' : 'Calculate'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MONTHLY EVALUATION BONUS (ប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ) */}
      {activeSubTab === 'evaluation' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Top Filter Bar for Evaluation Bonus */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={evalLineFilter}
                  onChange={(e) => setEvalLineFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ខ្សែសង្វាក់ / ក្រុមផលិតកម្ម' : 'All Production Lines & Groups'}</option>
                  <option value="Sewing Line 1">{language === 'km' ? 'ខ្សែដេរទី ១ (Sewing Line 1)' : 'Sewing Line 1'}</option>
                  <option value="Sewing Line 2">{language === 'km' ? 'ខ្សែដេរទី ២ (Sewing Line 2)' : 'Sewing Line 2'}</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'km' ? 'ស្វែងរកតាម ID ឬ ឈ្មោះ...' : 'Search by ID or Name...'}
                  value={evalSearch}
                  onChange={(e) => setEvalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-48 sm:w-64 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchEvaluation}
                title={language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw size={15} className={evalLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExportEvalCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={14} />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => setHowToCalculateModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="View step-by-step formula and rules for Monthly Evaluation Bonus"
              >
                <BookOpen size={14} />
                <span>{language === 'km' ? 'របៀបគណនា' : 'How to Calculate'}</span>
              </button>

              <button
                onClick={openAutoEvalModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 border border-purple-400/30"
                title={language === 'km' ? 'ដំណើរការម៉ាស៊ីនគណនាវាយតម្លៃស្វ័យប្រវត្តិតាមលក្ខខណ្ឌវត្តមាន និងទិន្នផល' : 'Auto-evaluate tiers based on attendance, output and role criteria'}
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>{language === 'km' ? '⚡ គណនាវាយតម្លៃស្វ័យប្រវត្តិ' : '⚡ Auto-Evaluate All'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'អ្នកទទួលប្រាក់រង្វាន់វាយតម្លៃ' : 'Active Evaluation Bonus'}
              </span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {evalSummary.active_eval_count} <span className="text-xs text-slate-400 font-normal">/ {evalSummary.total_workers} staff</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ទឹកប្រាក់រង្វាន់សរុប/ខែ' : 'Total Monthly Payout'}
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                ${evalSummary.total_payout.toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ប្រាក់រង្វាន់មធ្យម' : 'Average Bonus'}
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                ${evalSummary.average_payout.toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ប្រាក់រង្វាន់ខ្ពស់បំផុត' : 'Max Evaluation Tier'}
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                ${evalSummary.max_bonus.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Collapsible Evaluation Bonus Calculation Guide & Policies Banner */}
          <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? 'របៀបគណនាប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ' : 'How to Calculate Monthly Evaluation Bonus'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                      Column 29 &bull; Cambodia Factory Standard
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km'
                      ? 'រូបមន្តគណនា លក្ខខណ្ឌកាត់សិទ្ធិ និងកម្រិតវាយតម្លៃស្តង់ដារ ៤ ថ្នាក់ ($20, $15, $11, $6, $0)'
                      : 'Evaluation formulas, disqualification conditions, and 4 standard factory tiers ($20, $15, $11, $6, $0)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHowToCalculateModalOpen(true)}
                  className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Info size={13} />
                  <span>{language === 'km' ? 'មើលលម្អិត & ឧទាហរណ៍' : 'Full Guide & Examples'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalculationGuide((prev) => !prev)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                  title={showCalculationGuide ? 'Collapse' : 'Expand'}
                >
                  {showCalculationGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {showCalculationGuide && (
              <div className="pt-2 border-t border-purple-200/60 space-y-3 animate-in fade-in duration-150">
                {/* 4 Standard Tiers Visual Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-purple-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-700">Tier A+</span>
                      <span className="font-mono font-black text-sm text-purple-800">$20.00</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'ពូកែពិសេស / ដឹកនាំ' : 'Exceptional / Leadership'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'ប្រធានផ្នែក, ប្រធានក្រុម, ជាងជួសជុល ឬជាងដេរសម្រេចបានទិន្នផល >105% + វត្តមាន ១០០%'
                        : 'Chiefs, line leaders, mechanics, or sewing operators achieving >105% output + 100% attendance.'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-indigo-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700">Tier A</span>
                      <span className="font-mono font-black text-sm text-indigo-800">$15.00</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'ល្អប្រសើរ / គុណភាពខ្ពស់' : 'High Quality Performance'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'វត្តមានពេញ ១០០% (គ្មានអវត្តមានឥតច្បាប់) + បំពេញតាមកូតា និងគុណភាពស្តង់ដារ'
                        : '100% flawless attendance (0 unexcused absences) + met monthly production quota.'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700">Tier B</span>
                      <span className="font-mono font-black text-sm text-emerald-800">$11.00</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'មធ្យមស្តង់ដាររោងចក្រ' : 'Core Factory Standard'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'ការបំពេញការងារតាមស្តង់ដាររោងចក្រ + វត្តមានទៀងទាត់ ≥95% (អវត្តមាន ≤0.5 ថ្ងៃ)'
                        : 'Core factory standard output + good attendance ≥95% (unexcused absences ≤0.5 days).'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-700">Tier C / $0</span>
                      <span className="font-mono font-black text-sm text-amber-800">$6.00 / $0</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'កម្រិតមូលដ្ឋាន / កាត់សិទ្ធិ' : 'Baseline / Disqualified'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'Tier C ($6): វត្តមាន 90-95%។ $0: អវត្តមាន ≥2 ថ្ងៃ, វត្តមាន <90%, ឬបុគ្គលិករដ្ឋបាល'
                        : 'Tier C ($6): Attendance 90-95%. $0: >1 absence, attendance <90%, or office staff.'}
                    </p>
                  </div>
                </div>

                {/* 3 Step Calculation Rule Formula */}
                <div className="bg-white p-3 rounded-xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">
                      {language === 'km' ? '📌 រូបមន្តគណនាអត្រាវត្តមាន (Attendance Rate Formula):' : '📌 Attendance Scoring Formula:'}
                    </span>
                    <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-purple-700 font-bold block">
                      Attendance Rate % = (Present Days + 0.5 × Half Days) / Scheduled Working Days × 100%
                    </code>
                  </div>
                  <div className="text-slate-500 text-[10px] space-y-0.5">
                    <div>&bull; <strong className="text-slate-700">Disqualification Rule:</strong> Absences &ge; 2 or Rate &lt; 90% drops bonus to $0.</div>
                    <div>&bull; <strong className="text-slate-700">Supervisory Review:</strong> Line Chiefs can override any tier with 1 click before payroll lock.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4 Standard Evaluation Tiers Filter Pill Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Award size={14} className="text-purple-600" />
                {language === 'km' ? 'កម្រិតវាយតម្លៃស្តង់ដារ ៤ ថ្នាក់ (4 Standard Evaluation Tiers)' : '4 Standard Factory Evaluation Tiers Filter'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredEvalWorkers.length} {language === 'km' ? 'នាក់បង្ហាញ' : 'workers shown'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              <button
                onClick={() => setEvalTierFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  evalTierFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({evalTierCounts.all || 0})
              </button>

              <button
                onClick={() => setEvalTierFilter('has_bonus')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  evalTierFilter === 'has_bonus'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {language === 'km' ? 'មានប្រាក់រង្វាន់' : 'Active'} ({evalTierCounts.has_bonus || 0})
              </button>

              {STANDARD_EVALUATION_BONUS_TIERS.map((tier) => {
                const count = evalTierCounts[String(tier.amount)] || 0;
                const isSelected = evalTierFilter === String(tier.amount);
                return (
                  <button
                    key={tier.amount}
                    onClick={() => setEvalTierFilter(isSelected ? 'all' : String(tier.amount))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="font-bold">${tier.amount}</span>
                    <span className="text-[11px] opacity-80">({tier.grade})</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 font-bold'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setEvalTierFilter(evalTierFilter === 'zero' ? 'all' : 'zero')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  evalTierFilter === 'zero'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                $0 Unassigned ({evalTierCounts.zero || 0})
              </button>
            </div>
          </div>

          {/* Workers Evaluation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3 min-w-[70px]">ID</th>
                    <th className="p-3 min-w-[180px]">{language === 'km' ? 'Employee / ឈ្មោះខ្មែរ' : 'Employee Name'}</th>
                    <th className="p-3 min-w-[100px]">Line / Group</th>
                    <th className="p-3 min-w-[140px]">Position</th>
                    <th className="p-3 text-right min-w-[90px]">Base Salary</th>
                    <th className="p-3 text-center min-w-[130px]">Current Bonus</th>
                    <th className="p-3 text-center min-w-[280px] bg-purple-50/40 text-purple-900">
                      Quick Tier Assignment ($20, $15, $11, $6, $0)
                    </th>
                    <th className="p-3 text-center min-w-[160px]">Custom Input</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evalLoading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                        {language === 'km' ? 'កំពុងផ្ទុកទិន្នន័យប្រាក់រង្វាន់...' : 'Loading evaluation records...'}
                      </td>
                    </tr>
                  ) : filteredEvalWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {language === 'km' ? 'មិនមានបុគ្គលិកក្នុងខ្សែសង្វាក់/ក្រុមផលិតកម្មណាមួយឡើយ' : 'No employees found in any production line or group.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEvalWorkers.map((w) => {
                      const amount = Number(w.monthly_eval_bonus || 0);
                      const matchedTier = STANDARD_EVALUATION_BONUS_TIERS.find((t) => t.amount === amount);
                      const currentVal = evalInlineValues[w.id] ?? amount;
                      const hasChanged = currentVal !== amount;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/70 group transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{w.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {w.first_name?.[0] || 'E'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {w.employee_name}
                                </div>
                                {language === 'km' && w.khmer_name && (
                                  <div className="font-khmer text-slate-500 text-[11px]">
                                    {w.khmer_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {w.group_name ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40">
                                {w.group_name}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
                                {language === 'km' ? 'មិនមានខ្សែ / ក្រុម' : 'No Line / Unassigned'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{w.role || 'Operator'}</td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-700">
                            ${Number(w.base_salary || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {matchedTier ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <span className="font-mono font-black">${matchedTier.amount}</span>
                                <span className="opacity-75">&bull; {matchedTier.grade}</span>
                              </span>
                            ) : amount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="font-mono font-black">${amount}</span>
                                <span className="opacity-75">(Custom)</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                                $0 Unassigned
                              </span>
                            )}
                          </td>

                          {/* Quick One-Click Tier Buttons */}
                          <td className="p-2.5 text-center bg-purple-50/20">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {STANDARD_EVALUATION_BONUS_TIERS.map((tier) => {
                                const isCurrent = amount === tier.amount;
                                const isSaving = evalInlineSavingId === w.id;
                                return (
                                  <button
                                    key={tier.amount}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSaveEvalBonus(w.id, tier.amount)}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      isCurrent
                                        ? 'bg-purple-600 text-white shadow-xs scale-105 ring-2 ring-purple-300'
                                        : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300'
                                    }`}
                                    title={`Set ${tier.grade} ($${tier.amount})`}
                                  >
                                    <span>${tier.amount}</span>
                                    <span className="text-[10px] opacity-75 font-normal">({tier.grade.replace('Tier ', '')})</span>
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                disabled={evalInlineSavingId === w.id}
                                onClick={() => handleSaveEvalBonus(w.id, 0)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  amount === 0
                                    ? 'bg-slate-300 text-slate-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                                title="Reset bonus to $0"
                              >
                                $0
                              </button>
                            </div>
                          </td>

                          {/* Custom Inline Input */}
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="relative w-20">
                                <span className="absolute left-2 top-1 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setEvalInlineValues((prev) => ({ ...prev, [w.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveEvalBonus(w.id, currentVal);
                                    }
                                  }}
                                  className="w-full text-xs font-mono font-bold pl-5 pr-1 py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                                />
                              </div>

                              {hasChanged && (
                                <button
                                  onClick={() => handleSaveEvalBonus(w.id, currentVal)}
                                  disabled={evalInlineSavingId === w.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 transition-all animate-in fade-in"
                                  title="Save to database and active payroll"
                                >
                                  {evalInlineSavingId === w.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>{language === 'km' ? 'រក្សាទុក' : 'Save'}</span>
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
        </div>
      )}

      {activeSubTab === 'severance' && (
        <div className="space-y-4">
          {/* Top Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  {language === 'km' ? 'ខែបៀវត្សរ៍៖' : 'Pay Period:'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800">
                  October 2026
                </span>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={severanceDeptFilter}
                  onChange={(e) => setSeveranceDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                >
                  <option value="all">All Departments & Lines</option>
                  <option value="Sewing Line 1">Sewing Line 1</option>
                  <option value="Sewing Line 2">Sewing Line 2</option>
                  <option value="Cutting">Cutting</option>
                  <option value="Packing">Packing</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, name, role..."
                  value={severanceSearch}
                  onChange={(e) => setSeveranceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-52"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Refresh */}
              <button
                onClick={fetchSeverance}
                title={language === 'km' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw size={15} className={severanceLoading ? 'animate-spin' : ''} />
              </button>

              {/* Guide Button */}
              <button
                onClick={() => setHowToSeveranceModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <BookOpen size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">
                  {language === 'km' ? 'របៀបគណនា ៥%' : 'How to Calculate 5%'}
                </span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportSeveranceCSV}
                title={language === 'km' ? 'ទាញយកទិន្នន័យ CSV' : 'Export CSV'}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={14} />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
              </button>

              {/* ⚡ Auto-Calculate 5% (FDC) */}
              <button
                onClick={openAutoSeveranceModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>{language === 'km' ? '⚡ គណនា ៥% ស្វ័យប្រវត្តិ (FDC)' : '⚡ Auto-Calculate 5% (FDC)'}</span>
              </button>
            </div>
          </div>

          {/* Severance Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'km' ? 'កម្មករកិច្ចសន្យា FDC (ក.ក.ថ)' : 'FDC Contract Workers'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Art. 73
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {severanceSummary.fdc_workers}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {severanceSummary.total_workers} staff ({((severanceSummary.fdc_workers / (severanceSummary.total_workers || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {language === 'km' ? 'កិច្ចសន្យាមានកំណត់ថិរវេលាទទួល ៥%' : 'Fixed Duration Contracts eligible for 5%'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'km' ? 'ទឹកប្រាក់បំណាច់សរុប (Col 50)' : 'Current Severance (Col 50)'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Active
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                ${severanceSummary.total_severance_payout.toFixed(2)}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                {severanceSummary.active_severance_count} {language === 'km' ? 'នាក់កំពុងទទួល' : 'staff receiving'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'km' ? 'ថវិកា ៥% សក្តានុពល FDC' : '5% Potential FDC Budget'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  100% Base
                </span>
              </div>
              <div className="text-2xl font-black text-teal-600 mt-1 font-mono">
                ${severanceSummary.fdc_5pct_budget_potential.toFixed(2)}
              </div>
              <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
                {language === 'km' ? '៥% នៃប្រាក់ខែមូលដ្ឋានសម្រាប់ ៦៧ នាក់' : '5% Base Salary for all 67 FDC staff'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'km' ? 'ប្រាក់បំណាច់មធ្យម' : 'Average Severance'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  FDC Avg
                </span>
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                ${severanceSummary.average_severance_payout.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {language === 'km' ? 'បើកជាមួយប្រាក់ខែលើកទី ២ (2nd Paid)' : 'Disbursed in Col 53 (2nd Paid)'}
              </div>
            </div>
          </div>

          {/* Collapsible Severance Pay 5% Calculation Guide Banner */}
          <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? 'របៀបគណនាប្រាក់បំណាច់កុងត្រា ៥% (Labor Law Article 73)' : 'How to Calculate Severance Pay 5% (Labor Law Article 73)'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Column 50 &bull; Cambodia Factory Standard
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km'
                      ? 'មូលដ្ឋានច្បាប់មាត្រា ៧៣, លក្ខខណ្ឌកិច្ចសន្យា FDC ទល់នឹង UDC, រូបមន្តគណនា ៥% និងការបញ្ចូលក្នុងតារាងបៀវត្សរ៍ ៥៥ ជួរ'
                      : 'Article 73 legal mandate, FDC vs UDC contrast, 5% calculation formula, and Col 50 disbursement mechanics'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHowToSeveranceModalOpen(true)}
                  className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Info size={13} />
                  <span>{language === 'km' ? 'មើលលម្អិត & ករណីសិក្សា' : 'Full Guide & Legal Basis'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSeveranceGuide((prev) => !prev)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                  title={showSeveranceGuide ? 'Collapse' : 'Expand'}
                >
                  {showSeveranceGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {showSeveranceGuide && (
              <div className="pt-2 border-t border-emerald-200/60 space-y-3 animate-in fade-in duration-150">
                {/* 3 Pillars Visual Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700">Pillar 1: Legal Mandate</span>
                      <span className="font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        Article 73
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'កិច្ចសន្យាមានកំណត់ថិរវេលា (FDC)' : 'Fixed Duration Contracts (FDC)'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'កម្មករនិយោជិតដែលមានកិច្ចសន្យា FDC ត្រូវទទួលបានប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥% នៃប្រាក់ឈ្នួលសរុប (មាត្រា ៧៣ នៃច្បាប់ស្តីពីការងារ)។'
                        : 'Workers on Fixed Duration Contracts (FDC) are legally entitled to severance pay of at least 5% of total wages upon contract completion or regular monthly settlement.'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700">Pillar 2: FDC vs UDC Contrast</span>
                      <span className="font-mono font-bold text-[11px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                        Prakas 443
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'កិច្ចសន្យាមិនកំណត់ (UDC) = អតីតភាព' : 'UDC Workers = Seniority Payback'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'កិច្ចសន្យា UDC (ក.ម.ថ) ទទួលបានប្រាក់រំលឹកអតីតភាពការងារ ១៥ ថ្ងៃ/ឆ្នាំ (ជួរទី ៥១) ដូច្នេះមិនត្រូវទទួលបានប្រាក់បំណាច់ ៥% FDC ឡើយ ($0)។'
                        : 'Workers on UDC receive semi-annual Seniority Indemnity (15 days/yr under Prakas 443, Col 51). They are legally exempt from the 5% FDC severance ($0).'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-700">Pillar 3: Ledger Flow</span>
                      <span className="font-mono font-bold text-[11px] bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                        Column 50
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {language === 'km' ? 'បញ្ចូលក្នុងប្រាក់ខែបើកលើកទី ២' : 'Disbursed in 2nd Paid Salary'}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {language === 'km'
                        ? 'ប្រាក់បំណាច់ ៥% ត្រូវបានបូកបញ្ចូលក្នុងជួរទី ៥៣ (Second Paid) ដោយមិនរាប់បញ្ចូលក្នុង Gross ដើម្បីកុំឱ្យខុសកម្រិតពន្ធលើប្រាក់បៀវត្ស (TOS)។'
                        : 'Severance pay is paid via Col 53 (2nd Paid). It is disbursed as an indemnity rather than gross taxable wage, keeping monthly TOS tax brackets accurate.'}
                    </p>
                  </div>
                </div>

                {/* Calculation Formula Banner */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">
                      {language === 'km' ? '📌 រូបមន្តគណនាប្រាក់បំណាច់កុងត្រា ៥% (Calculation Formula):' : '📌 Severance Pay 5% Formula:'}
                    </span>
                    <code className="bg-slate-100 px-2.5 py-1 rounded font-mono text-emerald-800 font-bold block">
                      Severance Pay 5% = {language === 'km' ? 'Base Wage (ប្រាក់ខែមូលដ្ឋាន)' : 'Base Wage'} &times; 5% = Base Salary &times; 0.05
                    </code>
                  </div>
                  <div className="text-slate-500 text-[10px] space-y-0.5">
                    <div>&bull; <strong className="text-slate-700">Example:</strong> Base $210.00 &rarr; 5% = <strong className="text-emerald-700 font-mono">$10.50</strong> | Base $240.00 &rarr; 5% = <strong className="text-emerald-700 font-mono">$12.00</strong></div>
                    <div>&bull; <strong className="text-slate-700">Audit Proof:</strong> {language === 'km' ? 'អនុលោមតាមមាត្រា ៧៣ នៃច្បាប់ស្តីពីការងារកម្ពុជា។' : 'Fully complies with Article 73 of the Cambodian Labor Law.'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Type & Status Filter Pills */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-600" />
                {language === 'km' ? 'តម្រងប្រភេទកិច្ចសន្យាការងារ (Contract Type Filters)' : 'Contract Type & Eligibility Filters'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredSeveranceWorkers.length} {language === 'km' ? 'នាក់បង្ហាញ' : 'workers shown'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              <button
                onClick={() => setSeveranceContractFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  severanceContractFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Workers ({severanceCounts.all})
              </button>

              <button
                onClick={() => setSeveranceContractFilter('fdc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  severanceContractFilter === 'fdc'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <ShieldCheck size={13} />
                <span>FDC Workers ({severanceCounts.fdc})</span>
                <span className="text-[10px] px-1 rounded-full bg-emerald-200 text-emerald-900 font-mono">
                  Art. 73
                </span>
              </button>

              <button
                onClick={() => setSeveranceContractFilter('udc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  severanceContractFilter === 'udc'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>UDC Workers ({severanceCounts.udc})</span>
                <span className="text-[10px] px-1 rounded-full bg-blue-200 text-blue-900 font-mono">
                  Seniority
                </span>
              </button>

              <button
                onClick={() => setSeveranceContractFilter('has_severance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  severanceContractFilter === 'has_severance'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                {language === 'km' ? 'មានប្រាក់បំណាច់ (> $0)' : 'Active Severance (> $0)'} ({severanceCounts.has_severance})
              </button>

              <button
                onClick={() => setSeveranceContractFilter('zero')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  severanceContractFilter === 'zero'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                $0 Zero / Exempt ({severanceCounts.zero})
              </button>
            </div>
          </div>

          {/* Workers Severance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3 min-w-[70px]">ID</th>
                    <th className="p-3 min-w-[180px]">{language === 'km' ? 'Employee / ឈ្មោះខ្មែរ' : 'Employee Name'}</th>
                    <th className="p-3 min-w-[150px]">Contract Type</th>
                    <th className="p-3 min-w-[100px]">Department</th>
                    <th className="p-3 min-w-[130px]">Role / Position</th>
                    <th className="p-3 text-right min-w-[90px]">Base Salary</th>
                    <th className="p-3 text-right min-w-[90px] bg-emerald-50/30 text-emerald-900">
                      5% Base Rate
                    </th>
                    <th className="p-3 text-center min-w-[120px]">Col 50 Severance</th>
                    <th className="p-3 text-center min-w-[240px] bg-emerald-50/50 text-emerald-900">
                      Quick 1-Click Action
                    </th>
                    <th className="p-3 text-center min-w-[150px]">Custom Input</th>
                    <th className="p-3 text-center min-w-[110px]">Ledger Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {severanceLoading ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                        {language === 'km' ? 'កំពុងផ្ទុកទិន្នន័យប្រាក់បំណាច់...' : 'Loading severance records...'}
                      </td>
                    </tr>
                  ) : filteredSeveranceWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        {language === 'km' ? 'រកមិនឃើញទិន្នន័យស្របតាមលក្ខខណ្ឌស្វែងរកទេ' : 'No workers match the selected filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSeveranceWorkers.map((w) => {
                      const amount = Number(w.severance_pay || 0);
                      const suggested = Number(w.suggested_5_pct || 0);
                      const isFdc = (w.contract_type || '').includes('FDC');
                      const currentVal = severanceInlineValues[w.id] ?? amount;
                      const hasChanged = currentVal !== amount;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/70 group transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{w.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center text-[11px] shrink-0 ${
                                  isFdc
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {w.first_name?.[0] || 'E'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {w.employee_name}
                                </div>
                                {language === 'km' && w.khmer_name && (
                                  <div className="font-khmer text-slate-500 text-[11px]">
                                    {w.khmer_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contract Type Badge */}
                          <td className="p-3">
                            {isFdc ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck size={11} />
                                  <span>{language === 'km' ? 'FDC (ក.ក.ថ)' : 'FDC (Fixed)'}</span>
                                </span>
                                <span className="block text-[9px] text-emerald-700 font-medium">
                                  Article 73 Mandated (5%)
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {language === 'km' ? 'UDC (ក.ម.ថ)' : 'UDC (Undetermined)'}
                                </span>
                                <span className="block text-[9px] text-slate-400">
                                  Seniority Payback (Art. 89)
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            {w.group_name ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40">
                                {w.group_name}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
                                {w.department_name ? w.department_name.split('(')[0].trim() : (language === 'km' ? 'មិនមានខ្សែ' : 'No Line')}
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-slate-600 font-medium">{w.role || 'Operator'}</td>

                          <td className="p-3 text-right font-mono font-semibold text-slate-700">
                            ${Number(w.base_salary || 0).toFixed(2)}
                          </td>

                          <td className="p-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/20">
                            ${suggested.toFixed(2)}
                          </td>

                          {/* Current Severance (Col 50) */}
                          <td className="p-3 text-center">
                            {amount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="font-mono font-black">${amount.toFixed(2)}</span>
                                <span className="text-[10px] opacity-75">
                                  {amount === suggested ? '✓ 5%' : 'Custom'}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                                $0.00
                              </span>
                            )}
                          </td>

                          {/* Quick 1-Click Action Buttons */}
                          <td className="p-2.5 text-center bg-emerald-50/20">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                disabled={severanceInlineSavingId === w.id}
                                onClick={() => handleSaveSeverance(w.id, suggested)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  amount === suggested && amount > 0
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-300'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-400'
                                }`}
                                title={`Set to 5% Base ($${suggested.toFixed(2)})`}
                              >
                                <Sparkles size={11} className={amount === suggested ? 'text-amber-300' : 'text-emerald-600'} />
                                <span>5% Base (${suggested.toFixed(2)})</span>
                              </button>

                              <button
                                type="button"
                                disabled={severanceInlineSavingId === w.id}
                                onClick={() => handleSaveSeverance(w.id, 0)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  amount === 0
                                    ? 'bg-slate-300 text-slate-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                                title="Reset severance to $0"
                              >
                                $0
                              </button>
                            </div>
                          </td>

                          {/* Custom Inline Input */}
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="relative w-20">
                                <span className="absolute left-2 top-1 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setSeveranceInlineValues((prev) => ({ ...prev, [w.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveSeverance(w.id, currentVal);
                                    }
                                  }}
                                  className="w-full text-xs font-mono font-bold pl-5 pr-1 py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                                />
                              </div>

                              {hasChanged && (
                                <button
                                  onClick={() => handleSaveSeverance(w.id, currentVal)}
                                  disabled={severanceInlineSavingId === w.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 transition-all animate-in fade-in"
                                  title="Save to database and active payroll"
                                >
                                  {severanceInlineSavingId === w.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>{language === 'km' ? 'រក្សាទុក' : 'Save'}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Ledger Sync Status */}
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Col 50 &rarr; 2nd Paid</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduction}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Scissors size={16} className="text-indigo-600" />
                  {editingId
                    ? language === 'km'
                      ? 'កែប្រែទិន្នផលដេរ (Edit Weekly Production)'
                      : 'Edit Weekly Sewing Production'
                    : language === 'km'
                    ? 'បញ្ចូលទិន្នផលដេរដោយផ្ទាល់ (Entry Manually)'
                    : 'Manual Weekly Production Entry'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'km'
                    ? 'កត់ត្រាទិន្នផលដេរប្រចាំសប្តាហ៍ និងគណនាបុព្វលាភស្វ័យប្រវត្តិ'
                    : 'Log sewing output per day and auto-calculate weekly bonus tier'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Employee ID with Auto-complete */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  {language === 'km' ? 'អត្តលេខ ឬឈ្មោះកម្មករ (Employee ID)' : 'Employee ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="sewing-employees-list"
                    value={form.employee_id}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const matched = employees.find((emp) => emp.id?.toUpperCase() === val);
                      setForm((prev) => ({
                        ...prev,
                        employee_id: val,
                        group_name: matched?.group_name && (matched.group_name.startsWith('Sew') || matched.group_name.toLowerCase().includes('line'))
                          ? matched.group_name
                          : prev.group_name,
                      }));
                    }}
                    placeholder="e.g. HC004"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="sewing-employees-list">
                    {employees
                      .filter((e) => (e.group_name && e.group_name.startsWith('Sew')) || (e.id && e.id.startsWith('HC')))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.first_name} {e.last_name} {e.khmer_name ? `(${e.khmer_name})` : ''} {e.group_name ? `- ${e.group_name}` : ''}
                        </option>
                      ))}
                  </datalist>
                </div>

                {/* Matched Employee Banner */}
                {matchedEmployee && (
                  <div className="mt-1.5 p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between text-[11px] text-indigo-900">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-indigo-600" />
                      <span className="font-bold">{matchedEmployee.first_name} {matchedEmployee.last_name}</span>
                      {language === 'km' && matchedEmployee.khmer_name && (
                        <span className="font-khmer text-slate-700">({matchedEmployee.khmer_name})</span>
                      )}
                    </div>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded font-semibold text-indigo-700 border border-indigo-200">
                      {matchedEmployee.group_name || 'Sewing Line'}
                    </span>
                  </div>
                )}
              </div>

              {/* Sewing Line & Week Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'km' ? 'ខ្សែសង្វាក់ផលិតកម្ម (Line)' : 'Sewing Line / Group'}
                  </label>
                  <select
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="Sewing Line 1">{language === 'km' ? 'ខ្សែដេរទី ១ (Sewing Line 1)' : 'Sewing Line 1'}</option>
                    <option value="Sewing Line 2">{language === 'km' ? 'ខ្សែដេរទី ២ (Sewing Line 2)' : 'Sewing Line 2'}</option>
                  </select>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, group_name: 'Sewing Line 1' })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        form.group_name === 'Sewing Line 1' || form.group_name === 'Sew-L.1'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sewing Line 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, group_name: 'Sewing Line 2' })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        form.group_name === 'Sewing Line 2' || form.group_name === 'Sew-L.2'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sewing Line 2
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'km' ? 'សប្តាហ៍ទី (Week #)' : 'Week Number'}
                  </label>
                  <select
                    value={form.week_number}
                    onChange={(e) => setWeekPreset(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value={40}>Week 40 (05/10/2026 – 10/10/2026)</option>
                    <option value={41}>Week 41 (12/10/2026 – 17/10/2026)</option>
                    <option value={42}>Week 42 (19/10/2026 – 24/10/2026)</option>
                    <option value={43}>Week 43 (26/10/2026 – 31/10/2026)</option>
                  </select>
                </div>
              </div>

              {/* Target Quantity */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  {language === 'km' ? 'គោលដៅផលិតកម្មសប្តាហ៍ (Weekly Target pcs)' : 'Weekly Target (pcs)'}
                </label>
                <input
                  type="number"
                  required
                  value={form.target_qty}
                  onChange={(e) => setForm({ ...form, target_qty: parseInt(e.target.value, 10) || 1200 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              {/* Daily Inputs (Mon - Sat) */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  {language === 'km' ? 'ទិន្នផលប្រចាំថ្ងៃ (Mon – Sat Pieces)' : 'Daily Sewing Output (Mon – Sat)'}
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => (
                    <div key={day} className="text-center">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">{day}</span>
                      <input
                        type="number"
                        min="0"
                        value={(form as any)[`${day}_qty`]}
                        onChange={(e) =>
                          setForm({ ...form, [`${day}_qty`]: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 font-mono text-center text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Real-time Calculation Card */}
              <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200/90 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {language === 'km' ? 'ទិន្នផលសរុបគណនា' : 'Calculated Total'}
                  </span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {liveTotal.toLocaleString()} pcs
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {language === 'km' ? 'អត្រាសម្រេច' : 'Achieved'}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs mt-0.5 ${
                      liveCalc.achievementPct >= 120
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : liveCalc.achievementPct >= 110
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : liveCalc.achievementPct >= 100
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : liveCalc.achievementPct >= 90
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {liveCalc.achievementPct}% {liveCalc.achievementPct >= 120 ? '(B3)' : liveCalc.achievementPct >= 110 ? '(B2)' : liveCalc.achievementPct >= 100 ? '(B1)' : liveCalc.achievementPct >= 90 ? '(Base)' : ''}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {language === 'km' ? 'បុព្វលាភប៉ាន់ស្មាន' : 'Weekly Bonus'}
                  </span>
                  <div className="text-base font-black text-amber-700 mt-0.5">
                    +${liveCalc.bonusAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  {language === 'km' ? 'កំណត់ចំណាំ (Notes)' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Achieved 108.2% production tier"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {editingId
                  ? language === 'km'
                    ? 'កែប្រែទិន្នផល'
                    : 'Update Weekly Output'
                  : language === 'km'
                  ? 'រក្សាទុកទិន្នផល'
                  : 'Save Weekly Output'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={22} />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'បញ្ជាក់ការលុបកំណត់ត្រា' : 'Confirm Record Deletion'}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              {language === 'km'
                ? 'តើអ្នកប្រាកដជាចង់លុបកំណត់ត្រាទិន្នផលដេរនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។'
                : 'Are you sure you want to delete this weekly production record? This will also remove the corresponding weekly bonus calculation.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {language === 'km' ? 'លុបចេញ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <SewingImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchSewing}
        defaultMonth={month}
      />

      {/* Batch Line Entry Modal (Sewing Line 1 / Sewing Line 2) */}
      {lineBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl p-5 sm:p-6 space-y-4 my-8 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    batchLineName === 'Sewing Line 1'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  <Scissors size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>
                      {language === 'km'
                        ? `បញ្ចូលទិន្នផលដេរប្រចាំសប្តាហ៍ — ${batchLineName === 'Sewing Line 1' ? 'ខ្សែដេរទី ១' : 'ខ្សែដេរទី ២'}`
                        : `Add Weekly Output Logs — ${batchLineName}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                      {batchWorkers.length} {language === 'km' ? 'កម្មករ' : 'operators'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'km'
                      ? 'បញ្ចូលទិន្នផល ឬកំណត់ចំនួនរហ័សសម្រាប់ខ្សែសង្វាក់ទាំងមូលក្នុងពេលតែមួយ'
                      : 'Batch enter or quick-fill weekly production pieces for the entire sewing line.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleOpenLineBatchModal('Sewing Line 1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      batchLineName === 'Sewing Line 1'
                        ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'km' ? 'ខ្សែដេរទី ១' : 'Sewing Line 1'} ({employees.filter((e) => e.group_name === 'Sewing Line 1' || e.group_name === 'Sew-L.1').length || 35})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenLineBatchModal('Sewing Line 2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      batchLineName === 'Sewing Line 2'
                        ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'km' ? 'ខ្សែដេរទី ២' : 'Sewing Line 2'} ({employees.filter((e) => e.group_name === 'Sewing Line 2' || e.group_name === 'Sew-L.2').length || 36})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setLineBatchModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Week selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {language === 'km' ? 'សប្តាហ៍ (Week)' : 'Week Period'}
                  </label>
                  <select
                    value={batchWeek}
                    onChange={(e) => setBatchWeekPreset(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  >
                    <option value={40}>Week 40 (05/10/2026 – 10/10/2026)</option>
                    <option value={41}>Week 41 (12/10/2026 – 17/10/2026)</option>
                    <option value={42}>Week 42 (19/10/2026 – 24/10/2026)</option>
                    <option value={43}>Week 43 (26/10/2026 – 31/10/2026)</option>
                  </select>
                </div>

                {/* Target Qty */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {language === 'km' ? 'គោលដៅ/នាក់ (Target)' : 'Target / Worker'}
                  </label>
                  <input
                    type="number"
                    value={batchWorkers[0]?.target_qty || 1200}
                    onChange={(e) => {
                      const t = parseInt(e.target.value, 10) || 1200;
                      setBatchWorkers((prev) => prev.map((w) => ({ ...w, target_qty: t })));
                    }}
                    className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Quick Fill Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'km' ? '⚡ បំពេញតម្លៃរហ័សគ្រប់កម្មករ (Quick Fill Presets)' : '⚡ Quick Fill Presets (All Operators)'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => applyBatchPreset('tier1')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition-colors"
                    title="210-225/day = 1,275 pcs (106.3%) -> Tier 1 (+$10)"
                  >
                    Tier 1 (+$10)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBatchPreset('tier2')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 cursor-pointer transition-colors"
                    title="220-230/day = 1,345 pcs (112.1%) -> Tier 2 (+$15)"
                  >
                    Tier 2 (+$15)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBatchPreset('tier3')}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 cursor-pointer transition-colors"
                    title="235-245/day = 1,440 pcs (120.0%) -> Tier 3 (+$20)"
                  >
                    Tier 3 (+$20)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBatchPreset('base')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 cursor-pointer transition-colors"
                    title="185-195/day = 1,140 pcs (95.0%) -> Base (+$5)"
                  >
                    Base (+$5)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBatchPreset('zero')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer transition-colors"
                  >
                    Reset (0)
                  </button>
                </div>
              </div>
            </div>

            {/* Workers Table (Scrollable) */}
            <div className="flex-1 overflow-hidden border border-slate-200 rounded-2xl flex flex-col">
              <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-2 text-center font-bold w-10">#</th>
                      <th className="p-2 font-bold w-24">ID</th>
                      <th className="p-2 font-bold">Operator Name</th>
                      <th className="p-1.5 text-center font-bold w-14">Mon</th>
                      <th className="p-1.5 text-center font-bold w-14">Tue</th>
                      <th className="p-1.5 text-center font-bold w-14">Wed</th>
                      <th className="p-1.5 text-center font-bold w-14">Thu</th>
                      <th className="p-1.5 text-center font-bold w-14">Fri</th>
                      <th className="p-1.5 text-center font-bold w-14">Sat</th>
                      <th className="p-2 text-center font-bold bg-indigo-50/50 w-20">Total</th>
                      <th className="p-2 text-center font-bold w-20">Achieved</th>
                      <th className="p-2 text-center font-bold bg-amber-50/50 w-20">Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchWorkers.map((w, idx) => {
                      const total =
                        (Number(w.mon_qty) || 0) +
                        (Number(w.tue_qty) || 0) +
                        (Number(w.wed_qty) || 0) +
                        (Number(w.thu_qty) || 0) +
                        (Number(w.fri_qty) || 0) +
                        (Number(w.sat_qty) || 0);
                      const rule = rules[0];
                      const { achievementPct, bonusAmount } = computeSewingWeeklyBonus(total, rule);
                      return (
                        <tr key={w.employee_id} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-900">{w.employee_id}</td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{w.employee_name}</div>
                            {w.khmer_name && <div className="text-[11px] font-khmer text-slate-500">{w.khmer_name}</div>}
                          </td>
                          {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => (
                            <td key={day} className="p-1 text-center">
                              <input
                                type="number"
                                min="0"
                                value={w[`${day}_qty`]}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setBatchWorkers((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, [`${day}_qty`]: val } : item
                                    )
                                  );
                                }}
                                className="w-13 px-1 py-1 text-center font-mono font-bold rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 text-xs"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center font-mono font-black text-indigo-700 bg-indigo-50/30">
                            {total}
                          </td>
                          <td className="p-2 text-center font-mono font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                achievementPct >= 120
                                  ? 'bg-purple-100 text-purple-800'
                                  : achievementPct >= 110
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : achievementPct >= 100
                                  ? 'bg-blue-100 text-blue-800'
                                  : achievementPct >= 90
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {achievementPct}% {achievementPct >= 120 ? '(B3)' : achievementPct >= 110 ? '(B2)' : achievementPct >= 100 ? '(B1)' : achievementPct >= 90 ? '(Base)' : ''}
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                            +${bonusAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 shrink-0">
              <div className="text-xs text-slate-600 flex items-center gap-4">
                <span>
                  <strong>{batchWorkers.length}</strong> {language === 'km' ? 'កម្មករ' : 'operators'}
                </span>
                <span>
                  {language === 'km' ? 'ទិន្នផលសរុប៖' : 'Total output:'}{' '}
                  <strong className="text-indigo-600 font-mono">
                    {batchWorkers
                      .reduce(
                        (sum, w) =>
                          sum +
                          (Number(w.mon_qty) || 0) +
                          (Number(w.tue_qty) || 0) +
                          (Number(w.wed_qty) || 0) +
                          (Number(w.thu_qty) || 0) +
                          (Number(w.fri_qty) || 0) +
                          (Number(w.sat_qty) || 0),
                        0
                      )
                      .toLocaleString()}{' '}
                    pcs
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLineBatchModalOpen(false)}
                  disabled={batchSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchProduction}
                  disabled={batchSaving || batchWorkers.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {batchSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving logs...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>
                        {language === 'km'
                          ? `រក្សាទុកកំណត់ត្រាទាំងអស់សម្រាប់ ${batchLineName} (${batchWorkers.length})`
                          : `Save All ${batchWorkers.length} Logs for ${batchLineName}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Evaluation Hybrid Review Modal */}
      {autoEvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                  <Sparkles size={20} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? '⚡ គណនាវាយតម្លៃស្វ័យប្រវត្តិ & ត្រួតពិនិត្យ' : '⚡ Hybrid Auto-Evaluation & Supervisory Review'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
                      {month}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'km'
                      ? 'គណនាស្វ័យប្រវត្តិតាមវត្តមាន ទិន្នផលផលិតកម្ម និងតួនាទីទទួលខុសត្រូវ។ ប្រធានផ្នែកអាចកែសម្រួលមុនពេលរក្សាទុក។'
                      : 'Auto-calculates tiers based on attendance, quota output, and role leadership with 1-click supervisory adjustments.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAutoEvalModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {autoEvalLoading ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <RefreshCw className="animate-spin inline-block text-purple-600" size={24} />
                  <p className="font-semibold text-slate-600">
                    {language === 'km' ? 'កំពុងវិភាគទិន្នន័យវត្តមាន និងទិន្នផលបុគ្គលិក...' : 'Analyzing monthly attendance and sewing output metrics across all staff...'}
                  </p>
                </div>
              ) : autoEvalData ? (
                <>
                  {/* KPI Comparison Summary */}
                  {(() => {
                    const proposedTotal = (autoEvalData.items || []).reduce((sum: number, it: any) => {
                      const finalVal = autoEvalOverrides[it.employee_id] !== undefined
                        ? autoEvalOverrides[it.employee_id]
                        : it.suggested_bonus;
                      return sum + finalVal;
                    }, 0);
                    const proposedActiveCount = (autoEvalData.items || []).filter((it: any) => {
                      const finalVal = autoEvalOverrides[it.employee_id] !== undefined
                        ? autoEvalOverrides[it.employee_id]
                        : it.suggested_bonus;
                      return finalVal > 0;
                    }).length;
                    const variance = proposedTotal - evalSummary.total_payout;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <span className="text-[11px] font-medium text-slate-500">Current Payout</span>
                          <div className="text-xl font-black text-slate-700 font-mono mt-0.5">
                            ${evalSummary.total_payout.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-400">({evalSummary.active_eval_count} staff active)</span>
                        </div>

                        <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200">
                          <span className="text-[11px] font-bold text-purple-700">Proposed Payout</span>
                          <div className="text-xl font-black text-purple-700 font-mono mt-0.5">
                            ${proposedTotal.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-purple-600 font-semibold">({proposedActiveCount} staff active)</span>
                        </div>

                        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                          <span className="text-[11px] font-bold text-emerald-700">Net Variance</span>
                          <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                            {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {variance >= 0 ? 'Tier upgrades' : 'Adjustments'}
                          </span>
                        </div>

                        <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                          <span className="text-[11px] font-bold text-indigo-700">Factory Tiers Evaluated</span>
                          <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">
                            {autoEvalData.total_evaluated || 133} staff
                          </div>
                          <span className="text-[10px] text-indigo-600 font-semibold">100% Coverage</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Rules Criteria Banner */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Award size={14} className="text-purple-600" />
                      <span>{language === 'km' ? 'លក្ខខណ្ឌវាយតម្លៃស្តង់ដាររោងចក្រ' : 'Factory Evaluation Rules Legend'}:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                      <div className="bg-white p-2 rounded-xl border border-purple-200">
                        <span className="font-bold text-purple-700 block">Tier A+ ($20):</span>
                        <span className="text-[10px] text-slate-500">Chiefs, Group Leaders, Mechanics, or Output &gt;105%</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-indigo-200">
                        <span className="font-bold text-indigo-700 block">Tier A ($15):</span>
                        <span className="text-[10px] text-slate-500">100% Attendance (0 absences) + Met Standard Quota</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-200">
                        <span className="font-bold text-emerald-700 block">Tier B ($11):</span>
                        <span className="text-[10px] text-slate-500">Core standard performance (Attendance &ge;95%)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-amber-200">
                        <span className="font-bold text-amber-700 block">Tier C ($6) / $0:</span>
                        <span className="text-[10px] text-slate-500">Baseline passing (90-95%) or Disqualified if absences &gt;1</span>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter within Modal */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="relative w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search employee, ID, role..."
                        value={autoEvalModalSearch}
                        onChange={(e) => setAutoEvalModalSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['all', '20', '15', '11', '6', '0'].map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setAutoEvalModalTierFilter(tier)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            autoEvalModalTierFilter === tier
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tier === 'all' ? 'All' : tier === '0' ? '$0' : `$${tier}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Items Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="p-2.5 min-w-[70px]">ID</th>
                          <th className="p-2.5 min-w-[150px]">{language === 'km' ? 'Employee / ឈ្មោះខ្មែរ' : 'Employee Name'}</th>
                          <th className="p-2.5 min-w-[90px]">Line</th>
                          <th className="p-2.5 text-center min-w-[80px]">Attendance</th>
                          <th className="p-2.5 text-center min-w-[70px]">Current</th>
                          <th className="p-2.5 text-center min-w-[240px] bg-purple-50/50 text-purple-900 font-black">
                            Proposed Tier (Click to Override)
                          </th>
                          <th className="p-2.5 min-w-[200px]">Evaluation Reason / Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(autoEvalData.items || [])
                          .filter((it: any) => {
                            if (!it.group_name || !it.group_name.trim()) return false;
                            const q = autoEvalModalSearch.trim().toLowerCase();
                            const matchSearch =
                              !q ||
                              it.employee_id.toLowerCase().includes(q) ||
                              it.employee_name.toLowerCase().includes(q) ||
                              (it.khmer_name && it.khmer_name.toLowerCase().includes(q)) ||
                              (it.role && it.role.toLowerCase().includes(q));

                            const currentOverride =
                              autoEvalOverrides[it.employee_id] !== undefined
                                ? autoEvalOverrides[it.employee_id]
                                : it.suggested_bonus;

                            const matchTier =
                              autoEvalModalTierFilter === 'all' ||
                              String(currentOverride) === autoEvalModalTierFilter;

                            return matchSearch && matchTier;
                          })
                          .map((it: any) => {
                            const finalBonus =
                              autoEvalOverrides[it.employee_id] !== undefined
                                ? autoEvalOverrides[it.employee_id]
                                : it.suggested_bonus;
                            const isModified = autoEvalOverrides[it.employee_id] !== undefined && autoEvalOverrides[it.employee_id] !== it.suggested_bonus;

                            return (
                              <tr key={it.employee_id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-slate-900">{it.employee_id}</td>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-800">{it.employee_name}</div>
                                  {language === 'km' && it.khmer_name && (
                                    <div className="font-khmer text-slate-500 text-[11px]">{it.khmer_name}</div>
                                  )}
                                  <div className="text-[10px] text-slate-400">{it.role}</div>
                                </td>
                                <td className="p-2.5">
                                  {it.group_name ? (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/60">
                                      {it.group_name}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-[10px] text-slate-400 border border-slate-200/50">
                                      {language === 'km' ? 'មិនមានខ្សែ' : 'No Line'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      it.attendance_rate >= 98
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : it.attendance_rate >= 95
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    {it.attendance_rate}%
                                  </span>
                                  {it.absent_days > 0 && (
                                    <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">
                                      {it.absent_days} abs
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-mono font-semibold text-slate-500">
                                  ${it.current_bonus}
                                </td>

                                {/* Quick Override Buttons Inside Modal */}
                                <td className="p-2 text-center bg-purple-50/20">
                                  <div className="flex items-center justify-center gap-1">
                                    {[20, 15, 11, 6, 0].map((amount) => {
                                      const isSelected = finalBonus === amount;
                                      return (
                                        <button
                                          key={amount}
                                          type="button"
                                          onClick={() =>
                                            setAutoEvalOverrides((prev) => ({
                                              ...prev,
                                              [it.employee_id]: amount,
                                            }))
                                          }
                                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            isSelected
                                              ? 'bg-purple-600 text-white shadow-xs scale-105 ring-2 ring-purple-300'
                                              : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200'
                                          }`}
                                        >
                                          ${amount}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {isModified && (
                                    <span className="block text-[9px] text-amber-600 font-bold mt-0.5">
                                      ★ Manually Overridden
                                    </span>
                                  )}
                                </td>

                                <td className="p-2.5 text-slate-600 font-medium text-[11px]">
                                  {it.reason}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="text-xs text-slate-600">
                <span>{language === 'km' ? 'វាយតម្លៃសម្រាប់៖ ' : 'Ready to apply for: '}</span>
                <span className="font-bold text-slate-900">{month}</span> &bull;{' '}
                <span className="font-bold text-purple-700">
                  {autoEvalData?.total_evaluated || 133} {language === 'km' ? 'នាក់' : 'employees'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoEvalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>

                <button
                  type="button"
                  disabled={autoEvalApplying || autoEvalLoading}
                  onClick={handleApplyAutoEval}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {autoEvalApplying ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} className="text-amber-300" />
                  )}
                  <span>
                    {autoEvalApplying
                      ? language === 'km'
                        ? 'កំពុងអនុវត្ត...'
                        : 'Applying to Payroll...'
                      : language === 'km'
                      ? '⚡ អនុវត្ត & រក្សាទុកក្នុងបៀវត្សរ៍'
                      : '⚡ Apply Auto-Evaluation to Payroll'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sewing Matrix Grade Allowance Calculator Modal */}
      {matrixModalOpen && (
        <SewingMatrixCalculatorModal
          isOpen={matrixModalOpen}
          onClose={() => {
            setMatrixModalOpen(false);
            setSelectedMatrixWorker(null);
          }}
          employee={selectedMatrixWorker}
          onSuccess={() => {
            fetchMatrix();
            fetchSewing();
          }}
        />
      )}

      {/* How to Calculate Monthly Evaluation Bonus Guide Modal */}
      {howToCalculateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/80 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? '📖 របៀបគណនាប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ' : '📖 How to Calculate Monthly Evaluation Bonus'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
                      Column 29
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'km'
                      ? 'ការណែនាំលម្អិតអំពីគោលការណ៍ រូបមន្តគណនា និងកម្រិតវាយតម្លៃស្តង់ដាររោងចក្រ ៥៥ ជួរ'
                      : 'Comprehensive guide on factory policies, evaluation formulas, and 4 standard Cambodian factory tiers.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHowToCalculateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Section 1: Overview & Factory Context */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>{language === 'km' ? 'និយមន័យ & តួនាទីក្នុងតារាងបៀវត្សរ៍រោងចក្រ' : 'Overview & Factory Payroll Architecture'}</span>
                </h4>
                <p className="text-slate-600">
                  {language === 'km'
                    ? 'ប្រាក់រង្វាន់វាយតម្លៃប្រចាំខែ (Monthly Evaluation Bonus - ជួរទី ២៩ នៃតារាងបើកប្រាក់បៀវត្សរ៍ ៥៥ ជួរ) គឺជាប្រាក់ឧបត្ថម្ភលើកទឹកចិត្តផ្អែកលើការវាយតម្លៃគុណភាពការងារ វត្តមានទៀងទាត់ និងការគោរពវិន័យ។ ប្រាក់នេះខុសពីប្រាក់រង្វាន់វត្តមានទៀងទាត់ ($10-$14) ដែលគិតតែលើអវត្តមាន និងខុសពីប្រាក់ថែមម៉ោង (OT 1.5x/2.0x) ដោយវាឆ្លុះបញ្ចាំងពីជំនាញ ការដឹកនាំ និងទិន្នផលជាក់ស្តែង។'
                    : 'The Monthly Evaluation Bonus (Column 29 of the authoritative 55-column Cambodian factory ledger) is a merit-based quality and performance incentive. Unlike the Non-Absent Bonus ($10–$14) which is purely attendance-based, or Overtime which is statutory hourly pay, the Evaluation Bonus directly reflects workmanship quality, zero defect compliance, supervisory leadership, and monthly quota achievements.'}
                </p>
              </div>

              {/* Section 2: The 4 Standard Factory Tiers */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>{language === 'km' ? 'កម្រិតវាយតម្លៃស្តង់ដារ ៤ ថ្នាក់ (The 4 Standard Factory Tiers)' : 'The 4 Standard Factory Tiers & Criteria'}</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Tier</th>
                        <th className="p-3 text-right">Amount / mo</th>
                        <th className="p-3">Required Attendance</th>
                        <th className="p-3">Performance & Workmanship Criteria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-purple-50/30">
                        <td className="p-3 font-bold text-purple-700">Tier A+</td>
                        <td className="p-3 text-right font-mono font-black text-purple-800 text-sm">$20.00</td>
                        <td className="p-3 font-semibold text-emerald-700">100% (0 Absences)</td>
                        <td className="p-3 text-slate-600">
                          Chiefs, Line Leaders, Mechanics, Sample Makers, or Sewing Operators achieving &gt;105% monthly target output with zero quality defects.
                        </td>
                      </tr>
                      <tr className="hover:bg-indigo-50/30">
                        <td className="p-3 font-bold text-indigo-700">Tier A</td>
                        <td className="p-3 text-right font-mono font-black text-indigo-800 text-sm">$15.00</td>
                        <td className="p-3 font-semibold text-emerald-700">100% (0 Absences)</td>
                        <td className="p-3 text-slate-600">
                          Flawless attendance, met standard production target (100%–104.9%), high QC pass rate, and excellent team cooperation.
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="p-3 font-bold text-emerald-700">Tier B</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">$11.00</td>
                        <td className="p-3 font-semibold text-blue-700">&ge; 95% (Absences &le; 0.5)</td>
                        <td className="p-3 text-slate-600">
                          Core factory standard performance, standard daily output achieved, good discipline, no written warnings.
                        </td>
                      </tr>
                      <tr className="hover:bg-amber-50/30">
                        <td className="p-3 font-bold text-amber-700">Tier C</td>
                        <td className="p-3 text-right font-mono font-black text-amber-800 text-sm">$6.00</td>
                        <td className="p-3 font-semibold text-amber-700">90% – 94.9%</td>
                        <td className="p-3 text-slate-600">
                          Baseline passing evaluation, minor non-disruptive attendance variance, or newly regularized employees completing probation.
                        </td>
                      </tr>
                      <tr className="hover:bg-rose-50/30">
                        <td className="p-3 font-bold text-rose-700">Disqualified</td>
                        <td className="p-3 text-right font-mono font-black text-slate-400 text-sm">$0.00</td>
                        <td className="p-3 font-semibold text-rose-700">&lt; 90% or &ge; 2 Absences</td>
                        <td className="p-3 text-slate-600">
                          More than 1 unexcused absence, disciplinary sanctions, or administrative office roles not part of factory floor operations.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Step-by-Step Scoring Formula */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>{language === 'km' ? 'រូបមន្តគណនាពិន្ទុ & លក្ខខណ្ឌកាត់សិទ្ធិ (Formulas & Rules)' : 'Step-by-Step Scoring Formula'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block text-xs">Step 1: Attendance Scoring Formula</span>
                    <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-purple-800 font-bold">
                      Attendance Rate % = (Present Days + 0.5 × Half Days) / Scheduled Days × 100%
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sundays and statutory public holidays (OFF/HL) are rest days and excluded from the scheduled denominator.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                    <span className="font-bold text-rose-900 block text-xs">Step 2: Disqualification Filter</span>
                    <div className="p-2 bg-white rounded-xl border border-rose-200 font-mono text-[11px] text-rose-700 font-bold">
                      If (Unexcused Absences &ge; 2 OR Rate &lt; 90%) &rarr; Bonus = $0.00
                    </div>
                    <p className="text-[11px] text-rose-600">
                      Disciplinary sanctions or severe attendance breaches immediately disqualify the worker for that payroll cycle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Real Case Studies */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>{language === 'km' ? 'ករណីសិក្សាជាក់ស្តែង ៤ ឧទាហរណ៍ (Real Factory Case Studies)' : 'Real Factory Examples'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">Example 1: Top Sewing Star</span>
                      <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                        Tier A+ ($20.00)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>Worker:</strong> Ven Puthy (HC004), Sewing Line 1.<br />
                      <strong>Attendance:</strong> 26 days present, 0 absences (100% rate).<br />
                      <strong>Output:</strong> Sewn 1,301 pcs vs 1,200 quota (108.4% target).<br />
                      <strong>Result:</strong> Qualified for <strong>Tier A+ ($20.00)</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">Example 2: Maintenance Chief</span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        Tier A+ ($20.00)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>Worker:</strong> Phearom Soun (HC005), Repairman.<br />
                      <strong>Role:</strong> Technical leadership & machinery maintenance.<br />
                      <strong>Attendance:</strong> 27 days present, 0 absences (100% rate).<br />
                      <strong>Result:</strong> Leadership role + 100% attendance &rarr; <strong>Tier A+ ($20.00)</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">Example 3: Cutting Operator</span>
                      <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        Tier B ($11.00)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>Worker:</strong> Reahul Ham (HC142), Cutting Dept.<br />
                      <strong>Attendance:</strong> 27 days present, 0 absences (100% rate).<br />
                      <strong>Performance:</strong> Standard cutting yield and met requirements.<br />
                      <strong>Result:</strong> Core factory median benchmark &rarr; <strong>Tier B ($11.00)</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900">Example 4: Absenteeism Disqualification</span>
                      <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                        Disqualified ($0.00)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>Worker:</strong> Operator with 2 unexcused absences (AB).<br />
                      <strong>Attendance:</strong> 24 days present, 2 unexcused absences.<br />
                      <strong>Rate:</strong> 92.3%, but violates zero-unexcused absence policy.<br />
                      <strong>Result:</strong> Disqualified &rarr; <strong>$0.00</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: The Hybrid Operational Workflow */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-100/50 to-indigo-100/50 border border-purple-200 space-y-2">
                <span className="font-bold text-purple-900 block text-xs">
                  5. The Hybrid System: Smart Auto-Calculation + 1-Click Supervisory Override
                </span>
                <p className="text-slate-600 text-[11px]">
                  {language === 'km'
                    ? 'ប្រព័ន្ធ HESTRA HRM ប្រើប្រាស់រូបមន្ត Hybrid ដើម្បីសន្សំសំចៃពេលវេលា ៩០% សម្រាប់ផ្នែកធនធានមនុស្ស៖ ប្រព័ន្ធគណនាស្វ័យប្រវត្តិនូវកម្រិតដែលសមស្របតាមទិន្នន័យជាក់ស្តែង ប៉ុន្តែទុកសិទ្ធិពេញលេញឱ្យប្រធានផ្នែកចុចផ្លាស់ប្តូរ ($20, $15, $11, $6, $0) ដោយផ្ទាល់ដោយគ្រាន់តែចុច ១ ដងប៉ុណ្ណោះ។'
                    : 'HESTRA HRM implements the Hybrid Model to save 90% of HR administrative time: The system auto-evaluates objective metrics (attendance and production quota), while giving Line Chiefs and HR Managers one-click override capability ($20, $15, $11, $6, $0) on any worker before monthly payroll is locked.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              <span className="text-xs text-slate-500 font-medium">
                Authoritative Standard &bull; Ministry of Labor & Factory Collective Agreement
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHowToCalculateModalOpen(false);
                    openAutoEvalModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>{language === 'km' ? '⚡ ដំណើរការគណនាស្វ័យប្រវត្តិ' : '⚡ Run Auto-Evaluate Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHowToCalculateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Calculate Severance Pay 5% Review Modal */}
      {autoSeveranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? '⚡ គណនាប្រាក់បំណាច់កុងត្រា ៥% ស្វ័យប្រវត្តិ' : '⚡ Auto-Calculate 5% Severance Pay'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                      FDC Article 73 &bull; October 2026
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'km'
                      ? 'គណនាស្វ័យប្រវត្តិ ៥% នៃប្រាក់ខែមូលដ្ឋានសម្រាប់កម្មករ FDC ទាំងអស់។ ប្រធានផ្នែកអាចកែសម្រួលមុនពេលរក្សាទុក។'
                      : 'Auto-calculates 5% of base wage for all Fixed Duration Contract (FDC) workers with 1-click supervisory adjustments.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAutoSeveranceModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {autoSeveranceLoading ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="animate-spin inline-block text-emerald-600" size={32} />
                  <p className="text-xs font-semibold text-slate-600">
                    {language === 'km'
                      ? 'កំពុងគណនាប្រាក់បំណាច់ ៥% សម្រាប់បុគ្គលិក FDC ទាំងអស់...'
                      : 'Simulating 5% severance calculations for FDC workers...'}
                  </p>
                </div>
              ) : autoSeveranceData ? (
                <>
                  {/* Summary Metric Comparison Cards */}
                  {(() => {
                    const items = autoSeveranceData.items || [];
                    const proposedTotal = items.reduce((sum: number, it: any) => {
                      const val = autoSeveranceOverrides[it.employee_id] !== undefined
                        ? autoSeveranceOverrides[it.employee_id]
                        : it.suggested_severance;
                      return sum + val;
                    }, 0);

                    const proposedActiveCount = items.filter((it: any) => {
                      const finalVal = autoSeveranceOverrides[it.employee_id] !== undefined
                        ? autoSeveranceOverrides[it.employee_id]
                        : it.suggested_severance;
                      return finalVal > 0;
                    }).length;
                    const variance = proposedTotal - autoSeveranceData.current_total_payout;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <span className="text-[11px] font-medium text-slate-500">Current Payout (Col 50)</span>
                          <div className="text-xl font-black text-slate-700 font-mono mt-0.5">
                            ${autoSeveranceData.current_total_payout.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-400">({severanceSummary.active_severance_count} staff active)</span>
                        </div>

                        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                          <span className="text-[11px] font-bold text-emerald-700">Proposed 5% Payout</span>
                          <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                            ${proposedTotal.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold">({proposedActiveCount} FDC staff active)</span>
                        </div>

                        <div className="bg-teal-50 p-3.5 rounded-2xl border border-teal-200">
                          <span className="text-[11px] font-bold text-teal-700">Net Variance</span>
                          <div className="text-xl font-black text-teal-700 font-mono mt-0.5">
                            {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                          </div>
                          <span className="text-[10px] text-teal-600 font-semibold">
                            {variance >= 0 ? 'FDC Compliant Addition' : 'Adjustments'}
                          </span>
                        </div>

                        <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                          <span className="text-[11px] font-bold text-indigo-700">Eligible FDC Workers</span>
                          <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">
                            {autoSeveranceData.fdc_count || 67} staff
                          </div>
                          <span className="text-[10px] text-indigo-600 font-semibold">100% Article 73 Mandate</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Rules Criteria Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-[11px] text-slate-600">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-700" />
                      <span>{language === 'km' ? 'គោលការណ៍គណនាច្បាប់ស្តីពីការងារ មាត្រា ៧៣' : 'Article 73 Labor Law Calculation Policy'}:</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {language === 'km'
                        ? 'កម្មករកិច្ចសន្យា FDC ទទួលបាន ៥% នៃប្រាក់ខែមូលដ្ឋានជារៀងរាល់ខែ ឬពេលចប់កុងត្រា។ កម្មករកិច្ចសន្យា UDC (មិនកំណត់) ទទួលបានប្រាក់រំលឹកអតីតភាព (Prakas 443) ដូច្នេះមិនត្រូវគណនាប្រាក់បំណាច់ ៥% ឡើយ ($0)។'
                        : 'All 67 Fixed Duration Contract (FDC) workers receive exactly 5% of their base wage ($10.50 for $210, $12.00 for $240). Undetermined Duration Contract (UDC) workers are designated $0.00 as they receive Seniority Indemnity under Prakas 443.'}
                    </p>
                  </div>

                  {/* Search and Filter within Modal */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="relative w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search employee, ID, role..."
                        value={autoSeveranceModalSearch}
                        onChange={(e) => setAutoSeveranceModalSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setAutoSeveranceModalFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          autoSeveranceModalFilter === 'all'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({autoSeveranceData.items?.length || 0})
                      </button>

                      <button
                        onClick={() => setAutoSeveranceModalFilter('fdc')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          autoSeveranceModalFilter === 'fdc'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        FDC Only ({autoSeveranceData.fdc_count || 0})
                      </button>

                      <button
                        onClick={() => setAutoSeveranceModalFilter('changed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          autoSeveranceModalFilter === 'changed'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Needs Update
                      </button>

                      <button
                        onClick={() => setAutoSeveranceModalFilter('zero')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          autoSeveranceModalFilter === 'zero'
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        UDC / $0 ({autoSeveranceData.udc_count || 0})
                      </button>
                    </div>
                  </div>

                  {/* Preview Items Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="p-2.5 min-w-[70px]">ID</th>
                          <th className="p-2.5 min-w-[150px]">{language === 'km' ? 'Employee / ឈ្មោះខ្មែរ' : 'Employee Name'}</th>
                          <th className="p-2.5 min-w-[120px]">Contract Type</th>
                          <th className="p-2.5 text-right min-w-[80px]">Base Salary</th>
                          <th className="p-2.5 text-center min-w-[80px]">Current</th>
                          <th className="p-2.5 text-center min-w-[220px] bg-emerald-50/50 text-emerald-900 font-black">
                            Proposed 5% (Click to Override)
                          </th>
                          <th className="p-2.5 min-w-[200px]">Legal Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(autoSeveranceData.items || [])
                          .filter((it: any) => {
                            const q = autoSeveranceModalSearch.trim().toLowerCase();
                            const matchSearch =
                              !q ||
                              it.employee_id.toLowerCase().includes(q) ||
                              it.employee_name.toLowerCase().includes(q) ||
                              (it.khmer_name && it.khmer_name.toLowerCase().includes(q)) ||
                              (it.role && it.role.toLowerCase().includes(q));

                            const currentOverride =
                              autoSeveranceOverrides[it.employee_id] !== undefined
                                ? autoSeveranceOverrides[it.employee_id]
                                : it.suggested_severance;

                            let matchFilter = true;
                            if (autoSeveranceModalFilter === 'fdc') matchFilter = it.is_fdc;
                            else if (autoSeveranceModalFilter === 'changed') matchFilter = currentOverride !== it.current_severance;
                            else if (autoSeveranceModalFilter === 'zero') matchFilter = currentOverride === 0;

                            return matchSearch && matchFilter;
                          })
                          .map((it: any) => {
                            const finalVal =
                              autoSeveranceOverrides[it.employee_id] !== undefined
                                ? autoSeveranceOverrides[it.employee_id]
                                : it.suggested_severance;
                            const isModified =
                              autoSeveranceOverrides[it.employee_id] !== undefined &&
                              autoSeveranceOverrides[it.employee_id] !== it.suggested_severance;

                            return (
                              <tr key={it.employee_id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-slate-900">{it.employee_id}</td>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-800">{it.employee_name}</div>
                                  {language === 'km' && it.khmer_name && (
                                    <div className="font-khmer text-slate-500 text-[11px]">{it.khmer_name}</div>
                                  )}
                                </td>

                                <td className="p-2.5">
                                  {it.is_fdc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <ShieldCheck size={10} />
                                      {language === 'km' ? 'FDC (ក.ក.ថ)' : 'FDC (Fixed)'}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                                      {language === 'km' ? 'UDC (ក.ម.ថ)' : 'UDC (Undetermined)'}
                                    </span>
                                  )}
                                </td>

                                <td className="p-2.5 text-right font-mono text-slate-700">
                                  ${Number(it.base_salary || 0).toFixed(2)}
                                </td>

                                <td className="p-2.5 text-center font-mono text-slate-600 font-semibold">
                                  ${Number(it.current_severance || 0).toFixed(2)}
                                </td>

                                {/* Proposed 5% with Override Buttons */}
                                <td className="p-2.5 text-center bg-emerald-50/20">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAutoSeveranceOverrides((prev) => ({
                                          ...prev,
                                          [it.employee_id]: it.suggested_severance,
                                        }))
                                      }
                                      className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                        finalVal === it.suggested_severance && finalVal > 0
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                                      }`}
                                    >
                                      5% (${it.suggested_severance.toFixed(2)})
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAutoSeveranceOverrides((prev) => ({
                                          ...prev,
                                          [it.employee_id]: 0,
                                        }))
                                      }
                                      className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                        finalVal === 0
                                          ? 'bg-slate-300 text-slate-800 font-bold'
                                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      $0
                                    </button>

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={finalVal}
                                      onChange={(e) => {
                                        const v = Math.max(0, Number(e.target.value) || 0);
                                        setAutoSeveranceOverrides((prev) => ({
                                          ...prev,
                                          [it.employee_id]: v,
                                        }));
                                      }}
                                      className="w-16 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-xs font-bold text-center bg-white"
                                    />
                                  </div>
                                  {isModified && (
                                    <span className="block text-[9px] text-amber-600 font-bold mt-0.5">
                                      ★ Manually Overridden
                                    </span>
                                  )}
                                </td>

                                <td className="p-2.5 text-slate-600 font-medium text-[11px]">
                                  {it.rationale}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="text-xs text-slate-600">
                <span>{language === 'km' ? 'អនុវត្តសម្រាប់ខែ៖ ' : 'Ready to apply for: '}</span>
                <span className="font-bold text-slate-900">October 2026</span> &bull;{' '}
                <span className="font-bold text-emerald-700">
                  {autoSeveranceData?.fdc_count || 67} {language === 'km' ? 'នាក់ (FDC)' : 'FDC staff'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoSeveranceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>

                <button
                  type="button"
                  disabled={autoSeveranceApplying || autoSeveranceLoading}
                  onClick={handleApplyAutoSeverance}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {autoSeveranceApplying ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} className="text-amber-300" />
                  )}
                  <span>
                    {autoSeveranceApplying
                      ? language === 'km'
                        ? 'កំពុងអនុវត្ត...'
                        : 'Applying to Payroll...'
                      : language === 'km'
                      ? '⚡ អនុវត្ត & រក្សាទុកក្នុងបៀវត្សរ៍ (Col 50)'
                      : '⚡ Apply 5% Severance to Payroll (Col 50)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to Calculate Severance Pay 5% Guide Modal */}
      {howToSeveranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{language === 'km' ? '📖 របៀបគណនាប្រាក់បំណាច់កុងត្រា ៥%' : '📖 How to Calculate Severance Pay 5%'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                      Column 50 &bull; Labor Law Article 73
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'km'
                      ? 'ការណែនាំលម្អិតអំពីច្បាប់ការងារមាត្រា ៧៣, កិច្ចសន្យា FDC vs UDC, រូបមន្តគណនា និងការទូទាត់ជាក់ស្តែង'
                      : 'Comprehensive legal and mathematical guide on Cambodian Labor Law Article 73, FDC contracts, and 5% severance'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHowToSeveranceModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Section 1: Overview & Legal Mandate */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>{language === 'km' ? 'មូលដ្ឋានច្បាប់៖ មាត្រា ៧៣ នៃច្បាប់ស្តីពីការងារ' : 'Legal Foundation: Article 73 of Cambodian Labor Law'}</span>
                </h4>
                <p className="text-slate-600">
                  {language === 'km'
                    ? 'មាត្រា ៧៣ កថាខណ្ឌទី ៤ នៃច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា ចែងយ៉ាងច្បាស់ថា៖ «នៅពេលចប់កិច្ចសន្យាការងារមានកំណត់ថិរវេលា (FDC / ក.ក.ថ) និយោជកត្រូវផ្តល់ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាការងារឱ្យកម្មករនិយោជិតយ៉ាងតិចស្មើនឹង ៥% នៃប្រាក់ឈ្នួលដែលបានបើកក្នុងអំឡុងពេលកិច្ចសន្យា»។ ក្នុងរោងចក្រកាត់ដេរសំលៀកបំពាក់ និងផលិតផលស្បែក និយោជកជាច្រើនជ្រើសរើសទូទាត់ប្រាក់បំណាច់ ៥% នេះជារៀងរាល់ខែ ឬតាមវដ្តកិច្ចសន្យា ដើម្បីធានាបាននូវការអនុលោមភាពតាមច្បាប់ និងសម្រាលបន្ទុកទូទាត់នៅចុងកិច្ចសន្យា។'
                    : 'Article 73, Paragraph 4 of the Cambodian Labor Law explicitly mandates: "At the expiration of a Fixed Duration Contract (FDC), the employer must provide the worker with severance pay at least equal to 5% of the total wages paid during the duration of the contract." In garment and manufacturing factories, management frequently settles this 5% severance on a regular monthly basis alongside monthly payroll to maintain continuous compliance with Ministry of Labor and Vocational Training (MLVT) inspections.'}
                </p>
              </div>

              {/* Section 2: FDC vs UDC Contract Contrast */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>{language === 'km' ? 'ការប្រៀបធៀបកិច្ចសន្យា FDC និង UDC ក្នុងតារាងបៀវត្សរ៍ ៥៥ ជួរ' : 'FDC vs UDC in the 55-Column Factory Ledger'}</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Contract Type</th>
                        <th className="p-3">Legal Basis</th>
                        <th className="p-3">Entitlement Benefit</th>
                        <th className="p-3">Ledger Column</th>
                        <th className="p-3 text-right">Factory Workers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-emerald-50/40">
                        <td className="p-3 font-bold text-emerald-800">
                          {language === 'km' ? 'FDC (កិច្ចសន្យាមានកំណត់ថិរវេលា)' : 'FDC (Fixed Duration Contract)'}
                        </td>
                        <td className="p-3 text-slate-600">Article 73 Labor Law</td>
                        <td className="p-3 font-semibold text-emerald-700">
                          Severance Pay &ge; 5% of Wages
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          Column 50 (Severant Pay5%)
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          67 workers (50.4%)
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50/40">
                        <td className="p-3 font-bold text-blue-800">
                          {language === 'km' ? 'UDC (កិច្ចសន្យាមិនកំណត់ថិរវេលា)' : 'UDC (Undetermined Duration Contract)'}
                        </td>
                        <td className="p-3 text-slate-600">Article 89 &amp; Prakas 443</td>
                        <td className="p-3 font-semibold text-blue-700">
                          Seniority Indemnity (15 days/yr)
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-800">
                          Column 51 (Seniority Payback)
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          66 workers (49.6%)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Step-by-Step Calculation Formula & Examples */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>{language === 'km' ? 'រូបមន្តគណនា និងឧទាហរណ៍ជាក់ស្តែង' : 'Mathematical Formula & Factory Benchmarks'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <span className="font-bold text-emerald-950 block text-xs">Standard FDC 5% Formula</span>
                    <div className="p-2 bg-white rounded-xl border border-emerald-200 font-mono text-[11px] text-emerald-800 font-bold">
                      Severance Pay 5% = Base Wage &times; 5% = Base Wage &times; 0.05
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Calculated on statutory base wage (Column 8 / $210+ standard minimum wage).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <span className="font-bold text-blue-950 block text-xs">UDC Exemption Rule</span>
                    <div className="p-2 bg-white rounded-xl border border-blue-200 font-mono text-[11px] text-blue-800 font-bold">
                      If Contract Type is UDC &rarr; Severance Pay = $0.00
                    </div>
                    <p className="text-[11px] text-slate-600">
                      UDC workers receive Seniority Indemnity (Col 51) and cannot double-dip into 5% FDC severance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Baseline Operator ($210 Base)</span>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">$10.50 / mo</div>
                    <span className="text-[10px] text-slate-500">$210.00 &times; 5% = $10.50</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Experienced Operator ($240 Base)</span>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">$12.00 / mo</div>
                    <span className="text-[10px] text-slate-500">$240.00 &times; 5% = $12.00</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Technician / Leader ($275 Base)</span>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">$13.75 / mo</div>
                    <span className="text-[10px] text-slate-500">$275.00 &times; 5% = $13.75</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Payroll Ledger Flow */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>{language === 'km' ? 'ចរន្តទូទាត់ក្នុងតារាងបៀវត្សរ៍ ៥៥ ជួរ (Disbursement Mechanics)' : '55-Column Factory Ledger Disbursement Flow'}</span>
                </h4>
                <p className="text-slate-600">
                  {language === 'km'
                    ? 'ក្នុងតារាងបៀវត្សរ៍រោងចក្រ ៥៥ ជួរ ប្រាក់បំណាច់ ៥% ស្ថិតនៅជួរទី ៥០ (បន្ទាប់ពីប្រាក់ខែសុទ្ធក្រោយកាត់ពន្ធ ជួរទី ៤៥)។ វាមិនត្រូវបានរាប់បញ្ចូលក្នុងប្រាក់ខែសរុប (Gross) ដើម្បីកុំឱ្យប៉ះពាល់ដល់ការកាត់ពន្ធលើប្រាក់បៀវត្ស (TOS)។ ផ្ទុយទៅវិញ វាត្រូវបានបូកបញ្ចូលក្នុងជួរទី ៥៣ (Second Paid) និងជួរទី ៥៤ (Total Paid) ដែលធានាថាបុគ្គលិកទទួលបានទឹកប្រាក់ពេញលេញ។'
                    : 'In the 55-column factory payroll ledger, Severance Pay 5% resides at Column 50 (after Column 45 After Tax Net). It is not added to gross salary to avoid incorrectly inflating monthly Tax on Salary (TOS) withholding brackets. Instead, it is disbursed through Column 53 (Second Paid) and Column 54 (Total Paid), ensuring exact legal compliance and fair worker compensation.'}
                </p>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 font-bold border border-slate-200">
                  Second Paid (Col 53) = After-Tax Net (Col 45) + Severance Pay 5% (Col 50) + Seniority Payback (Col 51) - 1st Paid Advance (Col 46) - Pre-disbursed Weekly Bonus
                </div>
              </div>

              {/* Section 5: MLVT Inspection & Audit Compliance */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-100/50 to-teal-100/50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 block text-xs">
                  5. Ministry of Labor (MLVT) Audit & Inspection Compliance Checklist
                </span>
                <p className="text-slate-600 text-[11px]">
                  {language === 'km'
                    ? 'ប្រព័ន្ធ HESTRA HRM រក្សាទុកកំណត់ត្រា Audit Log រាល់ពេលដែលមានការកែប្រែ ឬគណនាស្វ័យប្រវត្តិនូវប្រាក់បំណាច់ ៥%។ ស្លឹកបើកប្រាក់បៀវត្សរ៍ (Payslip) របស់បុគ្គលិក FDC នឹងបង្ហាញដាច់ដោយឡែកនូវប្រាក់បំណាច់ ៥% ដើម្បីជាភស្តុតាងស្របច្បាប់ពេលអធិការកិច្ចការងារចុះត្រួតពិនិត្យ។'
                    : 'HESTRA HRM logs every severance modification and auto-calculation in the system audit trail. Individual staff payslips explicitly itemize the 5% Severance Pay under Column 50, providing full documentary proof during official MLVT labor inspections and collective bargaining reviews.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              <span className="text-xs text-slate-500 font-medium">
                Authoritative Standard &bull; Ministry of Labor & Factory Collective Agreement
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHowToSeveranceModalOpen(false);
                    openAutoSeveranceModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>{language === 'km' ? '⚡ ដំណើរការគណនា ៥% ស្វ័យប្រវត្តិ' : '⚡ Run Auto-Calculate 5% Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHowToSeveranceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
