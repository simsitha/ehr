'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { DashboardStats } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  Users,
  Clock,
  CalendarCheck,
  CreditCard,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Plus,
  AlertCircle,
  Megaphone,
  CheckCircle2,
  Cake,
  Building2,
  Bot,
  Zap,
  Activity,
  Calendar,
  Compass,
  Check,
  Shield,
  PartyPopper,
  UserPlus,
  RotateCcw,
  FileText,
  Calculator,
  CalendarDays,
  Scale,
  Network,
} from 'lucide-react';
import { formatLocalizedText } from '@/lib/translations';

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  onLeaveEmployees: 0,
  newHiresThisMonth: 0,
  attendanceToday: {
    present: 0,
    remote: 0,
    absent: 0,
    late: 0,
    percentage: 100,
  },
  pendingLeavesCount: 0,
  openPositionsCount: 0,
  monthlyPayrollTotal: 0,
  departmentDistribution: [],
  recentActivities: [],
  upcomingBirthdaysAndAnniversaries: [],
};

export default function StyledDashboardPage() {
  const { currentPersona, openModal, refreshKey, triggerRefresh, showToast, language, theme, t } = useApp();
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<'all' | 'leave' | 'hire'>('all');
  const [activeChartTab, setActiveChartTab] = useState<'departments' | 'weekly_trend'>('departments');

  // Real-time greeting & clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Welcome back');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      const hours = now.getHours();
      if (hours < 12) setGreeting(t('good_morning'));
      else if (hours < 18) setGreeting(t('good_afternoon'));
      else setGreeting(t('good_evening'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language, t]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && typeof data === 'object' && !data.error && data.attendanceToday) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard stats:', err);
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const triggerCelebration = (name: string, event: string) => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'],
      });
    }
    showToast(
      language === 'km'
        ? `បានផ្ញើសារអបអរសាទរជូន ${name} សម្រាប់ ${event}! 🎉`
        : `Sent congratulations to ${formatLocalizedText(name, language)} for ${formatLocalizedText(event, language)}! 🎉`,
      'success'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <p className={`text-xs text-slate-500 font-medium tracking-wide ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'កំពុងដំណើរការទិន្នន័យគ្រប់គ្រងធនធានមនុស្ស...' : 'Loading human resources dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Theme-specific styling tokens
  const themeClasses = {
    midnight: {
      wrapper: 'space-y-6 text-zinc-100',
      hero: 'relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 text-white shadow-2xl',
      card: 'bg-zinc-900/85 backdrop-blur-md border border-zinc-800/80 text-zinc-200 hover:border-zinc-700 shadow-sm hover:-translate-y-0.5 transition-all duration-200',
      cardHighlight: 'bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-indigo-950/30 border border-indigo-500/30 text-zinc-100 shadow-md',
      textMuted: 'text-zinc-400',
      subtleBox: 'bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all',
      badge: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
      accentText: 'text-indigo-400',
      pillActive: 'bg-indigo-600 text-white shadow-sm font-bold',
      pillInactive: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-semibold',
    },
    nordic: {
      wrapper: 'space-y-6 text-slate-900',
      hero: 'relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-indigo-950/95 to-slate-900 border border-slate-800/80 text-white shadow-xl shadow-indigo-950/15',
      card: 'bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 hover:border-indigo-300/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
      cardHighlight: 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 border border-indigo-200/90 text-slate-900 shadow-xs hover:shadow-md transition-all duration-200',
      textMuted: 'text-slate-500',
      subtleBox: 'bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 rounded-xl transition-all',
      badge: 'bg-slate-100 text-slate-700 border border-slate-200',
      accentText: 'text-indigo-600',
      pillActive: 'bg-indigo-600 text-white shadow-xs font-bold',
      pillInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold',
    },
    indigo: {
      wrapper: 'space-y-6 text-slate-100',
      hero: 'relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-950 to-purple-950 border border-indigo-800/60 text-white shadow-2xl shadow-indigo-950/40',
      card: 'bg-slate-900/85 backdrop-blur-md border border-slate-800/80 text-slate-200 hover:border-indigo-500/40 shadow-sm hover:-translate-y-0.5 transition-all duration-200',
      cardHighlight: 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-indigo-900/30 border border-indigo-500/40 text-white shadow-md',
      textMuted: 'text-slate-400',
      subtleBox: 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all',
      badge: 'bg-indigo-950 text-indigo-300 border border-indigo-800',
      accentText: 'text-cyan-400',
      pillActive: 'bg-indigo-600 text-white shadow-sm font-bold',
      pillInactive: 'text-slate-400 hover:text-white hover:bg-slate-800 font-semibold',
    },
  }[theme];

  const filteredActivities = stats.recentActivities.filter((act) => {
    if (activityFilter === 'all') return true;
    return act.type === activityFilter;
  });

  return (
    <div className={`space-y-6 transition-colors duration-300 ${themeClasses.wrapper}`}>
      {/* 1. HERO BENTO BANNER */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent ${themeClasses.hero}`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>{t('all_systems_operational')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-indigo-500/15 border border-indigo-500/35 text-indigo-300 shadow-2xs">
                <Clock size={12} className="text-indigo-400" />
                <span>{t('cambodia_time')}: {currentTime || '08:30:00 AM'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-500/35 text-purple-300 shadow-2xs">
                <Sparkles size={11} className="text-purple-400" />
                <span>{t('q4_fiscal')}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-xs">
              {greeting}, {formatLocalizedText(currentPersona.name, language)}!
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed max-w-xl text-slate-300/90 font-medium">
              {language === 'km' ? (
                <>
                  កំពុងដំណើរការក្នុងតួនាទី{' '}
                  <strong className="text-white font-bold px-1.5 py-0.5 rounded-md bg-white/10">{currentPersona.role}</strong> ({formatLocalizedText(currentPersona.title || '', language)})។
                  {stats.totalEmployees > 0 ? (
                    <> បុគ្គលិកសរុបមានចំនួន <strong className="text-white font-bold">{stats.totalEmployees} នាក់</strong> ជាមួយនឹង <span className="text-emerald-400 font-bold">អត្រាវត្តមាន {stats.attendanceToday.percentage}%</span> ថ្ងៃនេះ។</>
                  ) : (
                    <> បញ្ជីបុគ្គលិកបច្ចុប្បន្នទំនេរ។ លោកអ្នកអាចចាប់ផ្តើមចុះឈ្មោះបុគ្គលិកដំបូង។</>
                  )}
                </>
              ) : (
                <>
                  Operating in <strong className="text-white font-bold px-1.5 py-0.5 rounded-md bg-white/10">{currentPersona.role}</strong> role ({formatLocalizedText(currentPersona.title || '', language)}).
                  {stats.totalEmployees > 0 ? (
                    <> Total active workforce of <strong className="text-white font-bold">{stats.totalEmployees} colleagues</strong> with <span className="text-emerald-400 font-bold">{stats.attendanceToday.percentage}% attendance</span> today.</>
                  ) : (
                    <> Workforce directory is currently empty. You can start by onboarding your team members.</>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 lg:w-56 shrink-0">
            <button
              onClick={() => openModal('add-employee')}
              className="btn-press px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
            >
              <UserPlus size={15} /> {t('add_employee')}
            </button>
            <button
              onClick={() => openModal('request-leave')}
              className="btn-press px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs"
            >
              <CalendarCheck size={15} /> {t('request_leave')}
            </button>
            <button
              onClick={() => openModal('run-payroll')}
              className="btn-press px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <CreditCard size={15} /> {t('run_payroll')}
            </button>
          </div>
        </div>

        {/* Ambient Subtle Gradients */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ZERO EMPLOYEES ONBOARDING PROMPT (If empty) */}
      {stats.totalEmployees === 0 && (
        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${themeClasses.cardHighlight}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {language === 'km' ? 'បញ្ជីបុគ្គលិកបច្ចុប្បន្នទំនេរ' : 'Workforce Directory is Currently Empty'}
              </h3>
              <p className={`text-xs mt-0.5 ${themeClasses.textMuted}`}>
                {language === 'km'
                  ? 'ពុំទាន់មានបុគ្គលិកនៅក្នុងបញ្ជីនៅឡើយ។ លោកអ្នកអាចចាប់ផ្តើមចុះឈ្មោះបុគ្គលិកដំបូង។'
                  : 'No employee records found. You can start fresh by onboarding your first team member.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => openModal('add-employee')}
              className="btn-press flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> {language === 'km' ? 'បញ្ចូលបុគ្គលិកថ្មី' : 'Onboard Employee'}
            </button>
          </div>
        </div>
      )}

      {/* 1.5 EXECUTIVE HR LEGAL & TOOLKIT LAUNCHPAD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link
          href="/structure"
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 group cursor-pointer hover:border-indigo-400/80 shadow-xs hover:shadow-md ${themeClasses.card}`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <Network size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'រចនាសម្ព័ន្ធ' : 'Hierarchy'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-indigo-600 transition-colors">
              {language === 'km' ? 'រចនាសម្ព័ន្ធក្រុមហ៊ុន' : 'Company Structure'}
            </span>
          </div>
        </Link>

        <Link
          href="/tools?tab=letters"
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 group cursor-pointer hover:border-violet-400/80 shadow-xs hover:shadow-md ${themeClasses.card}`}
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'លិខិតផ្លូវការ' : 'Official Docs'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-violet-600 transition-colors">
              {language === 'km' ? 'ចេញលិខិតការងារ' : 'Generate Letters'}
            </span>
          </div>
        </Link>

        <Link
          href="/tools?tab=calculator"
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 group cursor-pointer hover:border-cyan-400/80 shadow-xs hover:shadow-md ${themeClasses.card}`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <Calculator size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'ច្បាប់ការងារ & ពន្ធ' : 'Legal & Taxes'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-cyan-600 transition-colors">
              {language === 'km' ? 'គណនា ប.ស.ស/ពន្ធ' : 'Labor & NSSF Calc'}
            </span>
          </div>
        </Link>

        <Link
          href="/tools?tab=holidays"
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 group cursor-pointer hover:border-amber-400/80 shadow-xs hover:shadow-md ${themeClasses.card}`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'បុណ្យជាតិបន្ទាប់' : 'Next Holiday'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-amber-600 transition-colors">
              {language === 'km' ? 'បុណ្យអុំទូក (២៣ វិច្ឆិកា)' : 'Water Festival'}
            </span>
          </div>
        </Link>

        <Link
          href="/tools?tab=contracts"
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 group cursor-pointer hover:border-emerald-400/80 shadow-xs hover:shadow-md ${themeClasses.card}`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <Scale size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'អនុលោមភាព' : 'Compliance'}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-emerald-600 transition-colors">
              {language === 'km' ? 'កិច្ចសន្យា & សាកល្បង' : 'Contract Tracking'}
            </span>
          </div>
        </Link>
      </div>

      {/* 2. BENTO METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Headcount */}
        <Link
          href="/employees"
          className={`group rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-blue-500 via-indigo-500 to-indigo-600 ${themeClasses.card}`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>{t('nav_employees')}</span>
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${themeClasses.textMuted}`}>
              {t('workforce_total')}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              {stats.totalEmployees} <span className="text-xs font-semibold opacity-60">{t('colleagues_unit')}</span>
            </div>
            {/* Visual mini progress track */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalEmployees > 0 ? (stats.activeEmployees / stats.totalEmployees) * 100 : 0}%` }}
              ></div>
            </div>
            <p className={`text-[11px] mt-2 ${themeClasses.textMuted} flex items-center justify-between`}>
              <span>{stats.activeEmployees} {t('active_staff')}</span>
              <span>&bull;</span>
              <span>{stats.onLeaveEmployees} {t('on_leave_staff')}</span>
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold border-current/10 ${themeClasses.accentText}`}>
            <span>{t('open_directory')}</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Attendance Rate */}
        <Link
          href="/attendance"
          className={`group rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-emerald-500 via-teal-500 to-cyan-500 ${themeClasses.card}`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{language === 'km' ? 'វត្តមានជាក់ស្តែង' : 'Real-time telemetry'}</span>
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${themeClasses.textMuted}`}>
              {t('attendance_today')}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {stats.attendanceToday.percentage}%
            </div>
            {/* Visual mini progress track */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.attendanceToday.percentage)}%` }}
              ></div>
            </div>
            <p className={`text-[11px] mt-2 ${themeClasses.textMuted} flex items-center justify-between`}>
              <span>{stats.attendanceToday.present} {t('in_office')}</span>
              <span>&bull;</span>
              <span>{stats.attendanceToday.remote} {t('remote_wfh')}</span>
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold border-current/10 ${themeClasses.accentText}`}>
            <span>{t('punch_timesheets')}</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Pending Approvals */}
        <Link
          href="/leaves"
          className={`group rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-amber-500 via-orange-500 to-amber-600 ${themeClasses.card}`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <CalendarCheck size={20} />
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>{language === 'km' ? 'រង់ចាំអនុម័ត' : 'Awaiting Review'}</span>
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${themeClasses.textMuted}`}>
              {t('pending_leaves')}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              {stats.pendingLeavesCount} <span className="text-xs font-semibold opacity-60">{t('requests_unit')}</span>
            </div>
            {/* Visual SLA progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.pendingLeavesCount > 0 ? Math.min(100, stats.pendingLeavesCount * 25) : 0}%` }}
              ></div>
            </div>
            <p className={`text-[11px] mt-2 ${themeClasses.textMuted}`}>
              {t('sla_24h')}
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold border-current/10 ${themeClasses.accentText}`}>
            <span>{t('review_queue')}</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Monthly Payroll */}
        <Link
          href="/payroll"
          className={`group rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-purple-500 via-indigo-500 to-pink-500 ${themeClasses.card}`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <CreditCard size={20} />
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>{language === 'km' ? 'ខែតុលា ២០២៦' : 'October 2026'}</span>
            </span>
          </div>

          <div className="mt-4">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${themeClasses.textMuted}`}>
              {t('monthly_payroll')}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">
              ${(stats.monthlyPayrollTotal).toLocaleString()}
            </div>
            {/* Visual budget track */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: '85%' }}
              ></div>
            </div>
            <p className={`text-[11px] mt-2 ${themeClasses.textMuted}`}>
              ~ {((stats.monthlyPayrollTotal * 4100) / 1000000).toFixed(1)}M {t('riel_equivalent')}
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold border-current/10 ${themeClasses.accentText}`}>
            <span>{t('ledger_payslips')}</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 3. AI AGENT INSIGHTS HUB */}
      <div className={`rounded-2xl p-5 border ${themeClasses.cardHighlight}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot size={17} />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">
                {t('ai_copilot_title')}
              </h3>
              <p className={`text-[11px] ${themeClasses.textMuted}`}>
                {t('ai_copilot_sub')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {language === 'km' ? 'វិភាគផ្ទាល់ ២៤/៧' : 'Autonomous 24/7'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeClasses.subtleBox}`}>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{t('ai_monitoring_leave')}</span>
              </div>
              <p className={`text-[11px] mt-1.5 leading-relaxed ${themeClasses.textMuted}`}>
                {language === 'km' ? (
                  stats.pendingLeavesCount > 0
                    ? `មាន ${stats.pendingLeavesCount} សំណើសុំច្បាប់រង់ចាំការពិនិត្យពីប្រធានផ្នែក។ កម្លាំងការងារឆ្លើយតបបានគ្រប់គ្រាន់។`
                    : 'ពុំមានសំណើសុំច្បាប់ដែលនៅសេសសល់ឡើយ។ សំណើទាំងអស់ត្រូវបានដំណើរការទាន់ពេល។'
                ) : (
                  stats.pendingLeavesCount > 0
                    ? `${stats.pendingLeavesCount} leave request(s) awaiting line manager approval. Coverage remains stable.`
                    : 'No pending leave requests. Approvals queue is up to date.'
                )}
              </p>
            </div>
            <Link
              href="/leaves"
              className={`text-[11px] font-bold flex items-center gap-1 mt-3 ${themeClasses.accentText}`}
            >
              {language === 'km' ? 'ពិនិត្យពាក្យសុំច្បាប់' : 'Review Requests'} <ArrowRight size={12} />
            </Link>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeClasses.subtleBox}`}>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{t('ai_monitoring_ats')}</span>
              </div>
              <p className={`text-[11px] mt-1.5 leading-relaxed ${themeClasses.textMuted}`}>
                {language === 'km'
                  ? `មាន ${stats.openPositionsCount} មុខតំណែងកំពុងប្រកាសជ្រើសរើសក្នុងរាជធានីភ្នំពេញ។ បេក្ខជនជាច្រើនកំពុងរង់ចាំការសម្ភាស។`
                  : `${stats.openPositionsCount} open position(s) published in Phnom Penh. Candidate interviews in progress.`}
              </p>
            </div>
            <Link
              href="/recruitment"
              className={`text-[11px] font-bold flex items-center gap-1 mt-3 ${themeClasses.accentText}`}
            >
              {language === 'km' ? 'ពិនិត្យប្រព័ន្ធជ្រើសរើស' : 'Open ATS Board'} <ArrowRight size={12} />
            </Link>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeClasses.subtleBox}`}>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>{t('ai_monitoring_payroll')}</span>
              </div>
              <p className={`text-[11px] mt-1.5 leading-relaxed ${themeClasses.textMuted}`}>
                {language === 'km' ? (
                  stats.totalEmployees > 0
                    ? `បញ្ជីបៀវត្សរ៍សរុប $${(stats.monthlyPayrollTotal).toLocaleString()} បានគណនាការកាត់កងបង់វិភាគទាន ប.ស.ស យ៉ាងត្រឹមត្រូវ។`
                    : 'បញ្ជីប្រាក់ខែបច្ចុប្បន្នទំនេរ។ រួចរាល់សម្រាប់ការកំណត់ប្រាក់បៀវត្សរ៍បុគ្គលិកថ្មី។'
                ) : (
                  stats.totalEmployees > 0
                    ? `Monthly payroll of $${(stats.monthlyPayrollTotal).toLocaleString()} calculated with NSSF contributions deducted.`
                    : 'Payroll register currently empty. Ready for employee compensation configuration.'
                )}
              </p>
            </div>
            <Link
              href="/payroll"
              className={`text-[11px] font-bold flex items-center gap-1 mt-3 ${themeClasses.accentText}`}
            >
              {language === 'km' ? 'មើលប័ណ្ណបើកប្រាក់បៀវត្សរ៍' : 'View Digital Payslips'} <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3.5 CAMBODIA LABOR LAW & REGULATORY PULSE */}
      <div className={`rounded-2xl p-4 sm:p-5 border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                {language === 'km' ? 'ប្រព័ន្ធតាមដានអនុលោមភាពច្បាប់ការងារកម្ពុជា' : 'Cambodia Labor Law Regulatory Pulse'}
              </span>
              <h3 className={`text-xs sm:text-sm font-bold text-white ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                {language === 'km'
                  ? 'ការទូទាត់ប្រាក់បំណាច់អតីតភាព ជុំទី ២ (ខែធ្នូ) & ការប្រកាសពន្ធប្រចាំខែ (GDT)'
                  : 'Seniority Payment Cycle 2 (Dec) & Monthly Tax on Salary (GDT)'}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/tools?tab=calculator"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator size={13} />
              <span>{language === 'km' ? 'គណនាប្រាក់អតីតភាព' : 'Seniority Calc'}</span>
            </Link>

            <Link
              href="/tools?tab=holidays"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CalendarDays size={13} />
              <span>{language === 'km' ? 'ប្រតិទិនបុណ្យជាតិ' : 'Public Holidays'}</span>
            </Link>
          </div>
        </div>

        {/* Ambient lighting */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* 4. DUAL-VIEW ANALYTICS BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Capacity Bars */}
        <div className={`lg:col-span-2 rounded-2xl p-6 border space-y-5 ${themeClasses.card}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Building2 size={18} className={themeClasses.accentText} />
                {t('department_allocation')}
              </h2>
              <p className={`text-xs ${themeClasses.textMuted}`}>
                {t('department_allocation_sub')}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link
                href="/departments"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200/60 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 shadow-2xs`}
              >
                <span>{language === 'km' ? 'គ្រប់គ្រងនាយកដ្ឋាន' : 'Manage Units'}</span>
                <ChevronRight size={13} />
              </Link>
              <div className={`flex items-center p-1 rounded-xl text-xs shrink-0 ${themeClasses.subtleBox}`}>
                <button
                  onClick={() => setActiveChartTab('departments')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeChartTab === 'departments' ? themeClasses.pillActive : themeClasses.pillInactive
                  }`}
                >
                  {t('divisions_tab')}
                </button>
                <button
                  onClick={() => setActiveChartTab('weekly_trend')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeChartTab === 'weekly_trend' ? themeClasses.pillActive : themeClasses.pillInactive
                  }`}
                >
                  {t('weekly_trend_tab')}
                </button>
              </div>
            </div>
          </div>

          {activeChartTab === 'departments' ? (
            <div className="space-y-4">
              {stats.departmentDistribution.map((dept) => {
                const percentage =
                  stats.totalEmployees > 0 ? Math.round((dept.count / stats.totalEmployees) * 100) : 0;

                return (
                  <div key={dept.name} className="group space-y-1.5 cursor-pointer">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: dept.color }}
                        ></span>
                        {formatLocalizedText(dept.name, language)}
                      </span>
                      <span className={themeClasses.textMuted}>
                        <strong className="text-current font-bold">{dept.count}</strong> {language === 'km' ? 'នាក់' : 'staff'} ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-current/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(2, percentage)}%`,
                          backgroundColor: dept.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t border-current/10 grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 rounded-xl ${themeClasses.subtleBox}`}>
                  <span className={`text-[11px] block font-medium ${themeClasses.textMuted}`}>
                    {language === 'km' ? 'ដេប៉ាតឺម៉ង់សកម្ម' : 'Active Divisions'}
                  </span>
                  <span className="text-xl font-black mt-0.5 block">
                    {stats.departmentDistribution.length}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.subtleBox}`}>
                  <span className={`text-[11px] block font-medium ${themeClasses.textMuted}`}>
                    {language === 'km' ? 'ផ្នែកកម្លាំងធំជាងគេ' : 'Largest Division'}
                  </span>
                  <span className={`text-xl font-black mt-0.5 block ${themeClasses.accentText}`}>
                    {formatLocalizedText(stats.departmentDistribution[0]?.name, language) || (language === 'km' ? 'ផ្នែកបច្ចេកវិទ្យា' : 'Engineering')}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${themeClasses.subtleBox}`}>
                  <span className={`text-[11px] block font-medium ${themeClasses.textMuted}`}>
                    {language === 'km' ? 'មធ្យមភាគក្នុងផ្នែក' : 'Avg per Division'}
                  </span>
                  <span className="text-xl font-black mt-0.5 block">
                    {stats.departmentDistribution.length > 0
                      ? (stats.totalEmployees / stats.departmentDistribution.length).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Weekly Presence Trend */
            <div className="space-y-4 py-2">
              <div className="h-44 flex items-end justify-between gap-3 px-2 pt-6">
                {[
                  { day: language === 'km' ? 'ច័ន្ទ' : 'Mon', height: 95, rate: '95%' },
                  { day: language === 'km' ? 'អង្គារ' : 'Tue', height: 98, rate: '98%' },
                  { day: language === 'km' ? 'ពុធ' : 'Wed', height: 92, rate: '92%' },
                  { day: language === 'km' ? 'ព្រហស្បតិ៍' : 'Thu', height: 94, rate: '94%' },
                  { day: language === 'km' ? 'សុក្រ' : 'Fri', height: 89, rate: '89%' },
                  { day: language === 'km' ? 'ថ្ងៃនេះ' : 'Today', height: 94, rate: '94%' },
                ].map((col) => (
                  <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.rate}
                    </span>
                    <div
                      className="w-full bg-indigo-500/30 group-hover:bg-indigo-600 rounded-xl transition-all duration-300"
                      style={{ height: `${col.height}%` }}
                    ></div>
                    <span className={`text-[10px] font-semibold ${themeClasses.textMuted}`}>
                      {col.day}
                    </span>
                  </div>
                ))}
              </div>
              <p className={`text-center text-[11px] ${themeClasses.textMuted}`}>
                {language === 'km'
                  ? 'អត្រាវត្តមានបុគ្គលិកត្រូវបានរក្សាខ្ពស់ជាង ៩០% ស្របតាមស្តង់ដារក្រុមហ៊ុន។'
                  : 'Workforce presence consistently maintained above 90% target benchmark.'}
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Workforce Presence Radar */}
        <div className={`rounded-2xl p-6 border flex flex-col justify-between space-y-4 ${themeClasses.card}`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Compass size={18} className="text-emerald-500" />
                {t('workforce_radar')}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30">
                {language === 'km' ? 'ផ្ទាល់' : 'Live'}
              </span>
            </div>
            <p className={`text-xs mb-4 ${themeClasses.textMuted}`}>
              {t('workforce_radar_sub')}
            </p>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.subtleBox}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></div>
                  <div>
                    <span className="text-xs font-bold block">{t('in_office')}</span>
                    <span className={`text-[10px] ${themeClasses.textMuted}`}>
                      {language === 'km' ? 'អគារការិយាល័យភ្នំពេញ' : 'Phnom Penh HQ Campus'}
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-500">
                  {stats.attendanceToday.present} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.subtleBox}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/30"></div>
                  <div>
                    <span className="text-xs font-bold block">{t('remote_wfh')}</span>
                    <span className={`text-[10px] ${themeClasses.textMuted}`}>
                      {language === 'km' ? 'បានកត់ត្រាវត្តមានតាមប្រព័ន្ធ' : 'Verified digital clock-in'}
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-blue-500">
                  {stats.attendanceToday.remote} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.subtleBox}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></div>
                  <div>
                    <span className="text-xs font-bold block">{t('late_arrivals')}</span>
                    <span className={`text-[10px] ${themeClasses.textMuted}`}>
                      {language === 'km' ? 'ចូលក្រោយម៉ោង ០៨:៣០ ព្រឹក' : 'Logged in after 08:30 AM'}
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-amber-500">
                  {stats.attendanceToday.late} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.subtleBox}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></div>
                  <div>
                    <span className="text-xs font-bold block">{t('on_authorized_leave')}</span>
                    <span className={`text-[10px] ${themeClasses.textMuted}`}>
                      {language === 'km' ? 'ច្បាប់ប្រចាំឆ្នាំ ឬច្បាប់ឈឺ' : 'Approved annual / medical'}
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-rose-500">
                  {stats.attendanceToday.absent} {language === 'km' ? 'នាក់' : 'staff'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-current/10">
            <Link
              href="/attendance"
              className={`text-xs font-bold flex items-center justify-between ${themeClasses.accentText}`}
            >
              <span>{language === 'km' ? 'មើលតារាងវត្តមានប្រចាំថ្ងៃ' : 'View Daily Timesheet'}</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. TIMELINE & CULTURE CELEBRATIONS BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Stream */}
        <div className={`lg:col-span-2 rounded-2xl p-6 border space-y-4 ${themeClasses.card}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity size={18} className={themeClasses.accentText} />
                {t('operations_stream')}
              </h2>
              <p className={`text-xs ${themeClasses.textMuted}`}>
                {t('operations_stream_sub')}
              </p>
            </div>

            <div className={`flex items-center gap-1 p-1 rounded-xl text-xs ${themeClasses.subtleBox}`}>
              {(['all', 'leave', 'hire'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activityFilter === filter ? themeClasses.pillActive : themeClasses.pillInactive
                  }`}
                >
                  {filter === 'all'
                    ? (language === 'km' ? 'សកម្មភាពទាំងអស់' : 'All Activity')
                    : filter === 'leave'
                    ? (language === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'Time Off')
                    : (language === 'km' ? 'បុគ្គលិកថ្មី' : 'New Hires')}
                </button>
              ))}
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className={`py-12 text-center text-xs ${themeClasses.textMuted}`}>
              {language === 'km'
                ? 'មិនទាន់មានសកម្មភាពថ្មីៗក្នុងជម្រើសនេះនៅឡើយទេ។'
                : 'No recent operations recorded in this filter.'}
            </div>
          ) : (
            <div className="divide-y divide-current/10">
              {filteredActivities.map((act) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        act.type === 'leave'
                          ? 'bg-amber-500/15 text-amber-500'
                          : act.type === 'hire'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-indigo-500/15 text-indigo-500'
                      }`}
                    >
                      {act.type === 'leave' ? (
                        <CalendarCheck size={18} />
                      ) : act.type === 'hire' ? (
                        <Users size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">{formatLocalizedText(act.title, language)}</h3>
                      <p className={`text-[11px] ${themeClasses.textMuted}`}>{formatLocalizedText(act.subtitle, language)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${themeClasses.textMuted}`}>
                      {act.timestamp.slice(0, 10)}
                    </span>
                    {act.statusBadge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${themeClasses.badge}`}>
                        {formatLocalizedText(act.statusBadge, language)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-current/10 flex justify-end">
            <Link
              href="/leaves"
              className={`text-xs font-bold flex items-center gap-1 ${themeClasses.accentText}`}
            >
              {language === 'km' ? 'ពិនិត្យបញ្ជីអនុម័តច្បាប់ទាំងអស់' : 'Review All Leave Approvals'}{' '}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Culture & Celebrations */}
        <div className={`rounded-2xl p-6 border flex flex-col justify-between space-y-4 ${themeClasses.card}`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Cake size={18} className="text-pink-500" />
                {t('team_celebrations')}
              </h2>
              <span className={`text-xs ${themeClasses.textMuted}`}>
                {language === 'km' ? 'ក្នុងខែនេះ' : 'This Month'}
              </span>
            </div>
            <p className={`text-xs mb-4 ${themeClasses.textMuted}`}>
              {t('team_celebrations_sub')}
            </p>

            {stats.upcomingBirthdaysAndAnniversaries.length === 0 ? (
              <div className={`py-8 text-center text-xs ${themeClasses.textMuted}`}>
                {language === 'km'
                  ? 'ពុំមានកម្មវិធីខួប ឬបុណ្យទានក្នុងខែនេះទេ។'
                  : 'No upcoming celebrations this month.'}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingBirthdaysAndAnniversaries.map((cel) => (
                  <div
                    key={cel.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.subtleBox}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cel.avatar}
                        alt={cel.name}
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{formatLocalizedText(cel.name, language)}</p>
                        <p className="text-[10px] text-pink-500 font-semibold truncate">{formatLocalizedText(cel.subtitle, language)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerCelebration(cel.name, cel.subtitle)}
                      className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all cursor-pointer shrink-0 border border-pink-500/20"
                      title="Send celebration confetti"
                    >
                      <PartyPopper size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-current/10">
            <Link
              href="/announcements"
              className={`text-xs font-bold flex items-center justify-between ${themeClasses.accentText}`}
            >
              <span>{t('bulletin_link')}</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
