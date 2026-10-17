'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Sparkles,
  Calendar,
  Award,
  Plus,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Search,
  Check,
  Settings,
  DollarSign,
  Building2,
  ChevronRight,
  X,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyTargetRule, DEFAULT_DAILY_TARGET_RULE, computeDailyTargetBonus } from '@/lib/payrollRules';

interface DailyTargetBonusManagerProps {
  initialMonth?: string;
  onPayrollUpdated?: () => void;
}

export default function DailyTargetBonusManager({
  initialMonth = '2026-10',
  onPayrollUpdated,
}: DailyTargetBonusManagerProps) {
  const { showToast, language } = useApp();

  const [month, setMonth] = useState(initialMonth);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedLine, setSelectedLine] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<any[]>([]);
  const [rule, setRule] = useState<DailyTargetRule>(DEFAULT_DAILY_TARGET_RULE);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_workers: 0,
    total_daily_bonus_payout: 0,
    average_bonus_per_worker: 0,
    total_days_tracked: 0,
    total_target_days_met: 0,
    hit_rate_pct: 0,
    tier_distribution: { B3: 0, B2: 0, B1: 0, Base: 0, Below: 0 },
  });

  // Modal states
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [isPostingPayroll, setIsPostingPayroll] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Form state for Add/Edit Daily Output Log
  const [logForm, setLogForm] = useState({
    id: '',
    employee_id: '',
    week_number: 40,
    week_start: `${initialMonth}-05`,
    week_end: `${initialMonth}-10`,
    month: initialMonth,
    group_name: 'Sewing Line 1',
    mon_qty: 210,
    tue_qty: 215,
    wed_qty: 220,
    thu_qty: 215,
    fri_qty: 225,
    sat_qty: 210,
    notes: '',
  });

  // Form state for Daily Rules Config
  const [rulesForm, setRulesForm] = useState<DailyTargetRule>(DEFAULT_DAILY_TARGET_RULE);

  // Available employees for logging
  const [sewingEmployees, setSewingEmployees] = useState<any[]>([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (selectedLine !== 'all') params.append('group', selectedLine);
      if (selectedWeek !== 'all') params.append('weekStart', selectedWeek);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/bonus/sewing/daily?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch daily target data');

      setRecords(data.records || []);
      if (data.rule) {
        setRule(data.rule);
        setRulesForm(data.rule);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading daily target production data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, selectedWeek, selectedLine]);

  // Fetch sewing employees for dropdown
  useEffect(() => {
    fetch('/api/employees?role=sewing')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSewingEmployees(data);
          if (data.length > 0 && !logForm.employee_id) {
            setLogForm((prev) => ({ ...prev, employee_id: data[0].id }));
          }
        }
      })
      .catch((err) => console.error('Error fetching sewing employees:', err));
  }, []);

  // Filter records in client for immediate response
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Week filter
      if (selectedWeek !== 'all' && r.week_start !== selectedWeek && String(r.week_number) !== selectedWeek) {
        return false;
      }
      // Line filter
      if (selectedLine !== 'all' && r.group_name !== selectedLine) {
        return false;
      }
      // Tier filter (check if worker had any day in that tier)
      if (selectedTier !== 'all') {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const hasTier = days.some((d) => r.daily_breakdown?.[d]?.tier === selectedTier);
        if (!hasTier) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = (r.employee_id || '').toLowerCase();
        const name = (r.employee_name || '').toLowerCase();
        const khName = (r.khmer_name || '').toLowerCase();
        const line = (r.group_name || '').toLowerCase();
        if (!id.includes(q) && !name.includes(q) && !khName.includes(q) && !line.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedWeek, selectedLine, selectedTier, searchQuery]);

  // Summary computed from filtered records
  const dynamicSummary = useMemo(() => {
    let totalPayout = 0;
    let targetDaysMet = 0;
    let daysTracked = 0;
    const tiers = { B3: 0, B2: 0, B1: 0, Base: 0, Below: 0 };
    const empSet = new Set<string>();

    filteredRecords.forEach((r) => {
      empSet.add(r.employee_id);
      totalPayout += r.weekly_daily_bonus || 0;
      targetDaysMet += r.weekly_days_met || 0;

      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      days.forEach((d) => {
        daysTracked++;
        const t = r.daily_breakdown?.[d]?.tier;
        if (t === 'B3') tiers.B3++;
        else if (t === 'B2') tiers.B2++;
        else if (t === 'B1') tiers.B1++;
        else if (t === 'Base') tiers.Base++;
        else tiers.Below++;
      });
    });

    const hitRate = daysTracked > 0 ? Math.round((targetDaysMet / daysTracked) * 1000) / 10 : 0;
    const avgBonus = empSet.size > 0 ? Math.round((totalPayout / empSet.size) * 100) / 100 : 0;

    return {
      workersCount: empSet.size,
      totalPayout: Math.round(totalPayout * 100) / 100,
      hitRate,
      avgBonus,
      tiers,
      daysTracked,
      targetDaysMet,
    };
  }, [filteredRecords]);

  // Handle Save Log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bonus/sewing/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save daily production log');

      showToast(
        language === 'km' ? 'បានកត់ត្រាទិន្នផលប្រចាំថ្ងៃជោគជ័យ! ✓' : 'Daily production log saved successfully! ✓',
        'success'
      );
      setLogModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error saving production log', 'error');
    }
  };

  // Open Edit modal for existing record
  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    setLogForm({
      id: record.id,
      employee_id: record.employee_id,
      week_number: record.week_number,
      week_start: record.week_start,
      week_end: record.week_end,
      month: record.month,
      group_name: record.group_name,
      mon_qty: record.mon_qty || 0,
      tue_qty: record.tue_qty || 0,
      wed_qty: record.wed_qty || 0,
      thu_qty: record.thu_qty || 0,
      fri_qty: record.fri_qty || 0,
      sat_qty: record.sat_qty || 0,
      notes: record.notes || '',
    });
    setLogModalOpen(true);
  };

  // Handle Save Rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bonus/sewing/daily/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rulesForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save daily target rules');

      showToast(
        language === 'km' ? 'បានរក្សាទុកគោលការណ៍រង្វាន់គោលដៅប្រចាំថ្ងៃជោគជ័យ! ✓' : 'Daily target bonus rules saved! ✓',
        'success'
      );
      setRule(data.rule);
      setRulesModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error saving daily rules', 'error');
    }
  };

  // Handle Post to Payroll (Column 49 - Paid Daily Target Bonus)
  const handlePostToPayroll = async () => {
    if (!confirm(
      language === 'km'
        ? `តើអ្នកពិតជាចង់ផ្ទេរប្រាក់រង្វាន់គោលដៅប្រចាំថ្ងៃសរុប ($${dynamicSummary.totalPayout.toFixed(2)}) ទៅក្នុងតារាងប្រាក់ខែ (ជួរឈរទី ៤៩ - Paid Daily Target Bonus) មែនទេ?`
        : `Transfer total approved Daily Target Bonus ($${dynamicSummary.totalPayout.toFixed(2)}) directly into Payroll Ledger (Column 49 - Paid Daily Target Bonus)?`
    )) {
      return;
    }

    setIsPostingPayroll(true);
    try {
      const periodName = `October 2026`; // Matches month e.g. 2026-10
      const res = await fetch('/api/bonus/sewing/daily/post-to-payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          period_name: periodName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post daily target bonus to payroll');

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}

      showToast(data.message || 'Daily target bonus posted to payroll successfully! ✓', 'success');
      if (onPayrollUpdated) onPayrollUpdated();
    } catch (err: any) {
      showToast(err.message || 'Error posting daily bonus to payroll', 'error');
    } finally {
      setIsPostingPayroll(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No records to export', 'error');
      return;
    }

    const headers = [
      'Employee ID',
      'Khmer Name',
      'English Name',
      'Sewing Line',
      'Week',
      'Week Start',
      'Mon Qty',
      'Mon Tier',
      'Mon Bonus ($)',
      'Tue Qty',
      'Tue Tier',
      'Tue Bonus ($)',
      'Wed Qty',
      'Wed Tier',
      'Wed Bonus ($)',
      'Thu Qty',
      'Thu Tier',
      'Thu Bonus ($)',
      'Fri Qty',
      'Fri Tier',
      'Fri Bonus ($)',
      'Sat Qty',
      'Sat Tier',
      'Sat Bonus ($)',
      'Weekly Total Pcs',
      'Target Days Met',
      'Weekly Daily Bonus ($)',
      'Monthly Daily Bonus ($)',
    ];

    const rows = filteredRecords.map((r) => {
      const bd = r.daily_breakdown || {};
      return [
        r.employee_id,
        `"${r.khmer_name || ''}"`,
        `"${r.employee_name || ''}"`,
        r.group_name,
        r.week_number,
        r.week_start,
        bd.mon?.qty || 0,
        bd.mon?.tier || 'None',
        (bd.mon?.bonus || 0).toFixed(2),
        bd.tue?.qty || 0,
        bd.tue?.tier || 'None',
        (bd.tue?.bonus || 0).toFixed(2),
        bd.wed?.qty || 0,
        bd.wed?.tier || 'None',
        (bd.wed?.bonus || 0).toFixed(2),
        bd.thu?.qty || 0,
        bd.thu?.tier || 'None',
        (bd.thu?.bonus || 0).toFixed(2),
        bd.fri?.qty || 0,
        bd.fri?.tier || 'None',
        (bd.fri?.bonus || 0).toFixed(2),
        bd.sat?.qty || 0,
        bd.sat?.tier || 'None',
        (bd.sat?.bonus || 0).toFixed(2),
        r.total_qty || 0,
        `"${r.target_days_ratio || '0/6'}"`,
        (r.weekly_daily_bonus || 0).toFixed(2),
        (r.monthly_daily_bonus || 0).toFixed(2),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_target_bonus_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper function to render a single day's cell
  const renderDayCell = (dayData: any) => {
    if (!dayData) return <span className="text-slate-400 text-xs">-</span>;

    let tierBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
    if (dayData.tier === 'B3') {
      tierBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    } else if (dayData.tier === 'B2') {
      tierBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    } else if (dayData.tier === 'B1') {
      tierBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    } else if (dayData.tier === 'Base') {
      tierBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }

    return (
      <div className="flex flex-col items-end gap-0.5 text-right">
        <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {dayData.qty} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[9px] font-bold px-1 py-0.2 rounded border ${tierBadgeClass}`}
            title={`${dayData.tierLabel} (${dayData.pct}% of target)`}
          >
            {dayData.tier}
          </span>
          {dayData.bonus > 0 ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              +${dayData.bonus.toFixed(2)}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">$0</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {language === 'km' ? 'ខែ:' : 'Month:'}
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Week Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់សប្តាហ៍ទាំងអស់ (All Weeks)' : 'All Weeks'}</option>
              <option value="40">Week 40 (Oct 05 – Oct 10)</option>
              <option value="41">Week 41 (Oct 12 – Oct 17)</option>
              <option value="42">Week 42 (Oct 19 – Oct 24)</option>
              <option value="43">Week 43 (Oct 26 – Oct 31)</option>
            </select>
          </div>

          {/* Sewing Line Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Building2 size={14} className="text-slate-400" />
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ខ្សែសង្វាក់ (All Lines)' : 'All Sewing Lines'}</option>
              <option value="Sewing Line 1">Sewing Line 1</option>
              <option value="Sewing Line 2">Sewing Line 2</option>
              <option value="Sewing Line 3">Sewing Line 3</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Award size={14} className="text-slate-400" />
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់កម្រិត Tier' : 'All Tiers'}</option>
              <option value="B3">Tier B3 (≥120% Target)</option>
              <option value="B2">Tier B2 (≥110% Target)</option>
              <option value="B1">Tier B1 (≥100% Target)</option>
              <option value="Base">Base Target (≥90%)</option>
              <option value="Below">Below Target (&lt;90%)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកតាម ID, ឈ្មោះ, ខ្សែដេរ...' : 'Search worker, ID, line...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden w-52 focus:w-64 transition-all"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Daily Log Button */}
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setLogForm({
                id: '',
                employee_id: sewingEmployees[0]?.id || '',
                week_number: 40,
                week_start: `${month}-05`,
                week_end: `${month}-10`,
                month,
                group_name: 'Sewing Line 1',
                mon_qty: 210,
                tue_qty: 215,
                wed_qty: 220,
                thu_qty: 215,
                fri_qty: 225,
                sat_qty: 210,
                notes: '',
              });
              setLogModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>{language === 'km' ? 'កត់ត្រាទិន្នផលប្រចាំថ្ងៃ' : 'Record Daily Output'}</span>
          </button>

          {/* Rules Config Button */}
          <button
            type="button"
            onClick={() => {
              setRulesForm(rule);
              setRulesModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Configure Daily Target Tiers & Bonuses"
          >
            <Settings size={14} className="text-slate-500" />
            <span>{language === 'km' ? 'ការកំណត់គោលដៅ' : 'Daily Rules'}</span>
          </button>

          {/* Post to Payroll (Column 49) */}
          <button
            type="button"
            onClick={handlePostToPayroll}
            disabled={isPostingPayroll || dynamicSummary.totalPayout === 0}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Post approved Daily Target Bonus directly into Payroll Column 49"
          >
            <ShieldCheck size={14} />
            <span>
              {isPostingPayroll
                ? (language === 'km' ? 'កំពុងបញ្ចូល...' : 'Posting...')
                : (language === 'km' ? 'បញ្ចូលទៅក្នុង Payroll (Col 49)' : 'Post to Payroll (Col 49)')}
            </span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            title="Export Daily Production & Bonus CSV"
          >
            <Download size={15} />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
            title="Refresh Daily Production Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Daily Target Bonus Disbursed */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់រង្វាន់គោលដៅប្រចាំថ្ងៃសរុប' : 'Total Daily Target Bonus'}
            </span>
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            ${dynamicSummary.totalPayout.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>
              {language === 'km' ? 'សម្រាប់បុគ្គលិក ' : 'Across '}
              <strong className="text-slate-700 dark:text-slate-300">{dynamicSummary.workersCount}</strong>
              {language === 'km' ? ' នាក់ក្នុងខែនេះ' : ' operators this month'}
            </span>
          </div>
        </div>

        {/* Card 2: Daily Target Quota Hit Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'km' ? 'អត្រាសម្រេចគោលដៅប្រចាំថ្ងៃ' : 'Daily Quota Hit Rate'}
            </span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
            <span>{dynamicSummary.hitRate}%</span>
            <span className="text-xs font-normal text-slate-500">
              ({dynamicSummary.targetDaysMet}/{dynamicSummary.daysTracked} {language === 'km' ? 'ថ្ងៃ' : 'days'})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, dynamicSummary.hitRate)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Average Daily Bonus per Operator */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'km' ? 'មធ្យមភាគរង្វាន់ / ម្នាក់' : 'Average Bonus / Operator'}
            </span>
            <Award size={16} />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            ${dynamicSummary.avgBonus.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>{language === 'km' ? 'គោលដៅស្តង់ដារ: ' : 'Standard Daily Target: '}</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{rule.daily_target_qty} pcs/day</strong>
          </div>
        </div>

        {/* Card 4: Daily Tier Distribution */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'km' ? 'ការបែងចែកកម្រិត B1–B3' : 'B1–B3 Tier Distribution'}
            </span>
            <Sparkles size={16} />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
              B3: {dynamicSummary.tiers.B3}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
              B2: {dynamicSummary.tiers.B2}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              B1: {dynamicSummary.tiers.B1}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
              Base: {dynamicSummary.tiers.Base}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 truncate">
            {language === 'km'
              ? `B3: +$${rule.tier_3_bonus} • B2: +$${rule.tier_2_bonus} • B1: +$${rule.tier_1_bonus} • Base: +$${rule.base_bonus}`
              : `B3: +$${rule.tier_3_bonus} • B2: +$${rule.tier_2_bonus} • B1: +$${rule.tier_1_bonus} • Base: +$${rule.base_bonus}`}
          </div>
        </div>
      </div>

      {/* 3. Main Daily Output & Target Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {language === 'km' ? 'តារាងទិន្នផល និងប្រាក់រង្វាន់គោលដៅប្រចាំថ្ងៃ (Daily Target Matrix)' : 'Daily Production Output & Target Bonus Matrix'}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
              {filteredRecords.length} {language === 'km' ? 'កំណត់ត្រា' : 'records'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'km' ? 'គោលដៅប្រចាំថ្ងៃ: ' : 'Daily Target: '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{rule.daily_target_qty} pcs/day</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                <th className="p-3 min-w-[200px] border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'កម្មករដេរ (Operator)' : 'Operator'}
                </th>
                <th className="p-2.5 min-w-[110px] border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'សង្វាក់ (Line)' : 'Line / Group'}
                </th>
                <th className="p-2.5 min-w-[90px] text-center border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'សប្តាហ៍ (Week)' : 'Week'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'ច័ន្ទ (Mon)' : 'Monday'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'អង្គារ (Tue)' : 'Tuesday'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'ពុធ (Wed)' : 'Wednesday'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'ព្រហស្បតិ៍ (Thu)' : 'Thursday'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'សុក្រ (Fri)' : 'Friday'}
                </th>
                <th className="p-2.5 min-w-[105px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'សៅរ៍ (Sat)' : 'Saturday'}
                </th>
                <th className="p-2.5 min-w-[90px] text-center border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'ជាប់គោលដៅ' : 'Target Met'}
                </th>
                <th className="p-2.5 min-w-[90px] text-right border-r border-slate-200 dark:border-slate-700">
                  {language === 'km' ? 'សរុបសប្តាហ៍' : 'Week Qty'}
                </th>
                <th className="p-2.5 min-w-[110px] text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                  {language === 'km' ? 'រង្វាន់សប្តាហ៍ ($)' : 'Week Daily Bonus'}
                </th>
                <th className="p-2.5 min-w-[110px] text-right border-r border-slate-200 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                  {language === 'km' ? 'សរុបប្រចាំខែ ($)' : 'Month Total (Col 49)'}
                </th>
                <th className="p-2.5 min-w-[60px] text-center">
                  {language === 'km' ? 'សកម្មភាព' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>{language === 'km' ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading daily target bonus logs...'}</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-slate-400">
                    <Sparkles size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold">{language === 'km' ? 'រកមិនឃើញទិន្នន័យទិន្នផលដេរទេ' : 'No daily production records found'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'km' ? 'សូមចុចប៊ូតុង "កត់ត្រាទិន្នផលប្រចាំថ្ងៃ" ដើម្បីបញ្ចូលទិន្នន័យថ្មី' : 'Click "Record Daily Output" above to log production records.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const bd = r.daily_breakdown || {};
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Operator Info */}
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {r.avatar ? (
                              <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (r.employee_name || 'U').charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {r.employee_name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <span>{r.employee_id}</span>
                              {r.khmer_name && <span>• {r.khmer_name}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Line */}
                      <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {r.group_name}
                      </td>

                      {/* Week */}
                      <td className="p-2.5 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold">
                          W{r.week_number}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono truncate">
                          {r.week_start?.slice(5)}
                        </div>
                      </td>

                      {/* Monday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.mon)}
                      </td>

                      {/* Tuesday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.tue)}
                      </td>

                      {/* Wednesday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.wed)}
                      </td>

                      {/* Thursday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.thu)}
                      </td>

                      {/* Friday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.fri)}
                      </td>

                      {/* Saturday */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800">
                        {renderDayCell(bd.sat)}
                      </td>

                      {/* Target Days Met */}
                      <td className="p-2.5 text-center border-r border-slate-100 dark:border-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            r.weekly_days_met >= 5
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : r.weekly_days_met >= 3
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {r.target_days_ratio}
                        </span>
                      </td>

                      {/* Week Total Pcs */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.total_qty?.toLocaleString()}
                      </td>

                      {/* Weekly Daily Bonus */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-mono font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20">
                        ${(r.weekly_daily_bonus || 0).toFixed(2)}
                      </td>

                      {/* Month Total Bonus (Column 49) */}
                      <td className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20">
                        ${(r.monthly_daily_bonus || r.weekly_daily_bonus || 0).toFixed(2)}
                      </td>

                      {/* Action */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                          title="Edit Daily Outputs"
                        >
                          <Edit3 size={13} />
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

      {/* 4. MODAL: Record Daily Output Log */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingRecord
                    ? (language === 'km' ? 'កែប្រែទិន្នផលដេរប្រចាំថ្ងៃ' : 'Edit Daily Sewing Output Log')
                    : (language === 'km' ? 'កត់ត្រាទិន្នផលដេរប្រចាំថ្ងៃថ្មី' : 'Record New Daily Production Output')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'ជ្រើសរើសកម្មករដេរ (Operator) *' : 'Select Operator *'}
                  </label>
                  <select
                    required
                    value={logForm.employee_id}
                    onChange={(e) => setLogForm({ ...logForm, employee_id: e.target.value })}
                    disabled={!!editingRecord}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  >
                    {sewingEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.id} - {emp.first_name} {emp.last_name} ({emp.group_name || 'Sewing'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'ខ្សែសង្វាក់ដេរ (Sewing Line)' : 'Sewing Line'}
                  </label>
                  <select
                    value={logForm.group_name}
                    onChange={(e) => setLogForm({ ...logForm, group_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="Sewing Line 1">Sewing Line 1</option>
                    <option value="Sewing Line 2">Sewing Line 2</option>
                    <option value="Sewing Line 3">Sewing Line 3</option>
                  </select>
                </div>

                {/* Week Number & Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'សប្តាហ៍ទី (Week Number)' : 'Week Number'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={logForm.week_number}
                    onChange={(e) => setLogForm({ ...logForm, week_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'km' ? 'កាលបរិច្ឆេទចាប់ផ្តើមសប្តាហ៍' : 'Week Start Date'}
                  </label>
                  <input
                    type="date"
                    value={logForm.week_start}
                    onChange={(e) => setLogForm({ ...logForm, week_start: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Daily Quantities Input Grid */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {language === 'km' ? 'ទិន្នផលកាត់ដេរប្រចាំថ្ងៃ (Pieces Produced / Day)' : 'Daily Pieces Produced (Mon–Sat)'}
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                    Target: {rule.daily_target_qty} pcs/day
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { key: 'mon_qty', label: 'Mon' },
                    { key: 'tue_qty', label: 'Tue' },
                    { key: 'wed_qty', label: 'Wed' },
                    { key: 'thu_qty', label: 'Thu' },
                    { key: 'fri_qty', label: 'Fri' },
                    { key: 'sat_qty', label: 'Sat' },
                  ].map((d) => {
                    const qty = Number((logForm as any)[d.key]) || 0;
                    const res = computeDailyTargetBonus(qty, rule);
                    return (
                      <div key={d.key} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center">
                          {d.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => setLogForm({ ...logForm, [d.key]: Number(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                        />
                        <div className="text-center">
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                              res.tier === 'B3'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : res.tier === 'B2'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : res.tier === 'B1'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : res.tier === 'Base'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {res.tier} (+${res.bonusAmount.toFixed(1)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Summary */}
              {(() => {
                const days = [
                  logForm.mon_qty,
                  logForm.tue_qty,
                  logForm.wed_qty,
                  logForm.thu_qty,
                  logForm.fri_qty,
                  logForm.sat_qty,
                ];
                const totalPieces = days.reduce((a, b) => a + (Number(b) || 0), 0);
                const totalDailyBonus = days.reduce((acc, qty) => acc + computeDailyTargetBonus(Number(qty) || 0, rule).bonusAmount, 0);
                const daysMet = days.filter((qty) => computeDailyTargetBonus(Number(qty) || 0, rule).tier !== 'None').length;

                return (
                  <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Total Output: </span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">{totalPieces} pcs</strong>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600 dark:text-slate-400">Targets Met: </span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{daysMet}/6 days</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Daily Bonus: </span>
                      <strong className="font-mono text-indigo-700 dark:text-indigo-300 font-black text-sm">
                        +${totalDailyBonus.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'km' ? 'កំណត់សម្គាល់ (Notes)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="e.g. Completed target style #SK-408"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'រក្សាទុកទិន្នផល' : 'Save Production Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Daily Target Rules Config */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={17} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'km' ? 'កំណត់កម្រិតរង្វាន់គោលដៅប្រចាំថ្ងៃ (Daily Rules)' : 'Daily Target Bonus Tier Rules'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSaveRules} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'km' ? 'គោលដៅទិន្នផលប្រចាំថ្ងៃ (Daily Target Quantity pcs/day)' : 'Daily Target Quota (pcs / day)'}
                </label>
                <input
                  type="number"
                  min="50"
                  step="1"
                  required
                  value={rulesForm.daily_target_qty}
                  onChange={(e) => setRulesForm({ ...rulesForm, daily_target_qty: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              {/* Tier 3: B3 */}
              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center justify-between">
                  <span>Tier 3 (B3 - Maximum Production)</span>
                  <span className="text-[10px] text-purple-600 font-mono">
                    ≥ {Math.round(rulesForm.daily_target_qty * (rulesForm.tier_3_min_pct / 100))} pcs/day
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Min Percentage (%):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_3_min_pct}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_3_min_pct: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Bonus Amount ($ / day):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_3_bonus}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_3_bonus: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg font-mono font-bold text-purple-700 dark:text-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Tier 2: B2 */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center justify-between">
                  <span>Tier 2 (B2 - High Production)</span>
                  <span className="text-[10px] text-blue-600 font-mono">
                    ≥ {Math.round(rulesForm.daily_target_qty * (rulesForm.tier_2_min_pct / 100))} pcs/day
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Min Percentage (%):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_2_min_pct}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_2_min_pct: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Bonus Amount ($ / day):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_2_bonus}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_2_bonus: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg font-mono font-bold text-blue-700 dark:text-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Tier 1: B1 */}
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center justify-between">
                  <span>Tier 1 (B1 - Target Met 100%)</span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    ≥ {Math.round(rulesForm.daily_target_qty * (rulesForm.tier_1_min_pct / 100))} pcs/day
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Min Percentage (%):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_1_min_pct}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_1_min_pct: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Bonus Amount ($ / day):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.tier_1_bonus}
                      onChange={(e) => setRulesForm({ ...rulesForm, tier_1_bonus: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Base Tier: Base */}
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center justify-between">
                  <span>Base Tier (Standard Baseline Target)</span>
                  <span className="text-[10px] text-amber-600 font-mono">
                    ≥ {Math.round(rulesForm.daily_target_qty * (rulesForm.base_min_pct / 100))} pcs/day
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Min Percentage (%):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.base_min_pct}
                      onChange={(e) => setRulesForm({ ...rulesForm, base_min_pct: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Bonus Amount ($ / day):</span>
                    <input
                      type="number"
                      step="any"
                      value={rulesForm.base_bonus}
                      onChange={(e) => setRulesForm({ ...rulesForm, base_bonus: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg font-mono font-bold text-amber-700 dark:text-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRulesModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'រក្សាទុកគោលការណ៍' : 'Save Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
