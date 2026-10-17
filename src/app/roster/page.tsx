'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { DutyRosterEntry, Department, Employee, ShiftType, isBoardMember } from '@/lib/types';
import {
  SHIFTS,
  SHIFT_LIST,
  getShiftConfig,
  getShiftList,
  getMondayOfWeek,
  formatDateISO,
  getWeekDays,
  DayColumn,
} from '@/lib/roster-shifts';
import { formatLocalizedText } from '@/lib/translations';
import RosterShiftModal from '@/components/RosterShiftModal';
import RosterAutoScheduleModal from '@/components/RosterAutoScheduleModal';
import RosterPrintModal from '@/components/RosterPrintModal';
import ShiftTemplateEditModal from '@/components/ShiftTemplateEditModal';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Printer,
  Download,
  Search,
  Filter,
  Clock,
  Users,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Sun,
  Coffee,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export default function RosterPage() {
  const { currentPersona, language, showToast, refreshKey, triggerRefresh, shiftSettings } = useApp();
  const isManagerOrAdmin = currentPersona.role === 'Manager' || currentPersona.role === 'Admin';

  // Current working date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Mode: 'matrix' (Weekly Team Matrix) or 'my-shifts' (Personal Schedule)
  const [viewMode, setViewMode] = useState<'matrix' | 'my-shifts'>(
    isManagerOrAdmin ? 'matrix' : 'my-shifts'
  );

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Data
  const [rosterEntries, setRosterEntries] = useState<DutyRosterEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Modals
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [autoScheduleModalOpen, setAutoScheduleModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Active cell state for shift editing
  const [activeCell, setActiveCell] = useState<{
    entry: DutyRosterEntry | null;
    employeeInfo: { id: string; name: string; role: string; department: string; avatar: string };
    dateStr: string;
    dayName: string;
  } | null>(null);

  // Compute Monday of active week
  const monday = useMemo(() => getMondayOfWeek(currentDate), [currentDate]);
  const mondayStr = useMemo(() => formatDateISO(monday), [monday]);

  // Compute 7 days for the active week
  const weekDays: DayColumn[] = useMemo(() => {
    return getWeekDays(monday, todayStr);
  }, [monday, todayStr]);

  // Week navigation helpers
  const handlePrevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleThisWeek = () => {
    setCurrentDate(new Date());
  };

  // Fetch departments & employees
  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
    ])
      .then(([deptData, empData]) => {
        if (Array.isArray(deptData)) setDepartments(deptData);
        if (Array.isArray(empData)) setEmployees(empData);
      })
      .catch((err) => console.error('Error fetching initial meta:', err));
  }, []);

  // Fetch roster entries for active week
  const fetchRoster = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('week_start', mondayStr);
    if (selectedDepartment !== 'all') {
      params.append('department_id', selectedDepartment);
    }
    if (viewMode === 'my-shifts' && currentPersona.id) {
      params.append('employee_id', currentPersona.id);
    }

    fetch(`/api/roster?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRosterEntries(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching roster:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRoster();
  }, [mondayStr, selectedDepartment, viewMode, currentPersona.id, refreshKey]);

  // Index roster entries by `${employee_id}_${date}` for O(1) lookup
  const rosterMap = useMemo(() => {
    const map = new Map<string, DutyRosterEntry>();
    rosterEntries.forEach((entry) => {
      map.set(`${entry.employee_id}_${entry.date}`, entry);
    });
    return map;
  }, [rosterEntries]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (isBoardMember(emp)) {
        return false;
      }
      if (viewMode === 'my-shifts' && emp.id !== currentPersona.id) {
        return false;
      }
      if (selectedDepartment !== 'all' && emp.department_id !== selectedDepartment) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName =
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
          (emp.role || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }
      if (selectedShiftFilter !== 'all') {
        // Must have this shift type on at least one day of the week
        const hasShift = weekDays.some((day) => {
          const entry = rosterMap.get(`${emp.id}_${day.dateStr}`);
          return entry?.shift_type === selectedShiftFilter;
        });
        if (!hasShift) return false;
      }
      return true;
    });
  }, [employees, viewMode, currentPersona.id, selectedDepartment, searchQuery, selectedShiftFilter, weekDays, rosterMap]);

  // Calculate schedule rows & telemetry metrics
  const employeeScheduleRows = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const shifts: Record<string, DutyRosterEntry | undefined> = {};
      let totalHours = 0;
      let offDaysCount = 0;

      weekDays.forEach((day) => {
        const entry = rosterMap.get(`${emp.id}_${day.dateStr}`);
        shifts[day.dateStr] = entry;
        const shiftType = entry?.shift_type || 'off';
        if (shiftType === 'off') {
          offDaysCount++;
        } else {
          totalHours += entry?.hours !== undefined ? Number(entry.hours) : (getShiftConfig(shiftType, shiftSettings?.shifts).default_hours || 8.0);
        }
      });

      // Cambodian Labor Law Article 147: At least 24h rest per week (min 1 day OFF) and regular hours <= 48h
      const isCompliant = offDaysCount >= 1 && totalHours <= 48;

      return {
        employee: {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          role: emp.role,
          department_name: emp.department_name || '',
          avatar: emp.avatar || '',
        },
        shifts,
        totalHours,
        offDaysCount,
        isCompliant,
      };
    });
  }, [filteredEmployees, weekDays, rosterMap]);

  // Telemetry KPIs
  const telemetry = useMemo(() => {
    let grandTotalHours = 0;
    let onDutyToday = 0;
    let weekendDutyCount = 0;
    let offTodayCount = 0;
    let compliantCount = 0;

    employeeScheduleRows.forEach((row) => {
      grandTotalHours += row.totalHours;
      if (row.isCompliant) compliantCount++;

      const todayShift = row.shifts[todayStr];
      const todayType = todayShift?.shift_type || 'off';
      if (todayType !== 'off') {
        onDutyToday++;
      } else {
        offTodayCount++;
      }

      // Check Sat and Sun
      const sat = weekDays[5]?.dateStr;
      const sun = weekDays[6]?.dateStr;
      if (sat && row.shifts[sat]?.shift_type === 'weekend_duty') weekendDutyCount++;
      if (sun && row.shifts[sun]?.shift_type === 'weekend_duty') weekendDutyCount++;
    });

    const totalStaff = employeeScheduleRows.length;
    const complianceRate = totalStaff > 0 ? Math.round((compliantCount / totalStaff) * 100) : 100;

    return {
      grandTotalHours,
      onDutyToday,
      offTodayCount,
      weekendDutyCount,
      complianceRate,
      totalStaff,
    };
  }, [employeeScheduleRows, todayStr, weekDays]);

  // Handle cell click to open shift modal
  const handleCellClick = (emp: Employee, day: DayColumn) => {
    if (!isManagerOrAdmin) {
      showToast(
        language === 'km'
          ? 'មានតែអ្នកគ្រប់គ្រង និងរដ្ឋបាលទេដែលអាចកែសម្រួលកាលវិភាគ'
          : 'Only Managers and Admins can assign or edit roster shifts',
        'info'
      );
      return;
    }

    const entry = rosterMap.get(`${emp.id}_${day.dateStr}`) || null;
    setActiveCell({
      entry,
      employeeInfo: {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        role: emp.role,
        department: emp.department_name || '',
        avatar: emp.avatar || '',
      },
      dateStr: day.dateStr,
      dayName: language === 'km' ? day.nameKm : day.nameEn,
    });
    setShiftModalOpen(true);
  };

  // Save or delete shift handler
  const handleSaveShift = async (entryData: Partial<DutyRosterEntry>) => {
    const res = await fetch('/api/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData),
    });
    const data = await res.json();
    if (data.success) {
      showToast(language === 'km' ? 'បានរក្សាទុកវេនជោគជ័យ!' : 'Shift saved successfully!', 'success');
      fetchRoster();
      triggerRefresh();
    } else {
      showToast(data.error || 'Failed to save shift', 'error');
    }
  };

  const handleDeleteShift = async (employeeId: string, dateStr: string) => {
    const res = await fetch(`/api/roster?employee_id=${employeeId}&date=${dateStr}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      showToast(language === 'km' ? 'បានលុបវេនការងារជោគជ័យ!' : 'Shift removed successfully!', 'success');
      fetchRoster();
      triggerRefresh();
    } else {
      showToast(data.error || 'Failed to delete shift', 'error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (employeeScheduleRows.length === 0) {
      showToast(language === 'km' ? 'គ្មានទិន្នន័យសម្រាប់ទាញយកទេ' : 'No data to export', 'error');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Position',
      'Department',
      ...weekDays.map((d) => `${d.nameEn} (${d.dateStr})`),
      'Total Hours',
      'OFF Days',
      'Labor Law Status',
    ];

    const csvRows = employeeScheduleRows.map((r) => {
      const dayCells = weekDays.map((d) => {
        const s = r.shifts[d.dateStr];
        if (!s || s.shift_type === 'off') return 'OFF';
        const def = getShiftConfig(s.shift_type, shiftSettings?.shifts);
        return `${def?.short_code || s.shift_type} (${s.start_time || def?.start_time}-${s.end_time || def?.end_time})`;
      });

      return [
        `"${r.employee.id}"`,
        `"${r.employee.name}"`,
        `"${r.employee.role}"`,
        `"${r.employee.department_name}"`,
        ...dayCells.map((c) => `"${c}"`),
        r.totalHours,
        r.offDaysCount,
        `"${r.isCompliant ? 'Compliant' : 'Overtime Limit Warning'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Duty_Roster_${mondayStr}.csv`);
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
              <CalendarDays size={22} />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                {language === 'km' ? 'កាលវិភាគការងារ & វេនប្រចាំការ' : 'Work & Duty Roster'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'ការរៀបចំវេនការងារ វេនប្រចាំការចុងសប្ដាហ៍ និងអនុលោមភាពច្បាប់ការងារកម្ពុជា'
                  : 'Shift scheduling, weekend duty allocation, and Cambodian labor compliance'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'ទិដ្ឋភាពរួម (Team Matrix)' : 'Team Matrix'}
            </button>
            <button
              onClick={() => setViewMode('my-shifts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'my-shifts'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'វេនរបស់ខ្ញុំ (My Shifts)' : 'My Shifts'}
            </button>
          </div>

          {/* Shift Templates & Legend (Admin/Manager) */}
          {isManagerOrAdmin && (
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'km' ? 'គំរូវេន & សម្គាល់' : 'Shift Templates'}</span>
            </button>
          )}

          {/* Auto Schedule (Admin/Manager) */}
          {isManagerOrAdmin && (
            <button
              onClick={() => setAutoScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{language === 'km' ? 'កាលវិភាគស្វ័យប្រវត្តិ' : 'Auto-Schedule'}</span>
            </button>
          )}

          {/* Print Official Roster */}
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={14} className="text-slate-500" />
            <span>{language === 'km' ? 'បោះពុម្ពផ្លូវការ' : 'Print A4'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Week Navigator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={language === 'km' ? 'សប្ដាហ៍មុន' : 'Previous Week'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={language === 'km' ? 'សប្ដាហ៍បន្ទាប់' : 'Next Week'}
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleThisWeek}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'សប្ដាហ៍នេះ (Today)' : 'This Week'}
          </button>
          <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-white ml-2 flex items-center gap-1.5">
            <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>
              {weekDays[0]?.dateStr} {language === 'km' ? 'ដល់' : 'to'} {weekDays[6]?.dateStr}
            </span>
          </div>
        </div>

        {/* Date Jump Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'km' ? 'ជ្រើសថ្ងៃ៖' : 'Jump to:'}
          </span>
          <input
            type="date"
            value={formatDateISO(currentDate)}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setCurrentDate(new Date(y, m - 1, d));
              }
            }}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Telemetry & Compliance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Scheduled Hours */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'ម៉ោងសរុបសប្ដាហ៍នេះ' : 'Total Weekly Hours'}</span>
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {telemetry.grandTotalHours}
            </span>
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'ម៉ោង (hrs)' : 'Hours (hrs)'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? `សម្រាប់បុគ្គលិក ${telemetry.totalStaff} នាក់` : `Across ${telemetry.totalStaff} staff members`}
          </p>
        </div>

        {/* Staff On Duty Today */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'កំពុងបំពេញការងារថ្ងៃនេះ' : 'On Duty Today'}</span>
            <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {telemetry.onDutyToday}
            </span>
            <span className="text-xs text-slate-500 font-medium">/{telemetry.totalStaff} {language === 'km' ? 'នាក់' : 'staff'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? `${telemetry.offTodayCount} នាក់សម្រាកថ្ងៃនេះ` : `${telemetry.offTodayCount} on rest day today`}
          </p>
        </div>

        {/* Weekend Duty Staff */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'វេនប្រចាំការចុងសប្ដាហ៍' : 'Weekend Duty'}</span>
            <Coffee size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {telemetry.weekendDutyCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'វេន (shifts)' : 'shifts'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? 'ប្រចាំការថ្ងៃសៅរ៍ & អាទិត្យ' : 'Saturday & Sunday coverage'}
          </p>
        </div>

        {/* Rest Days (OFF) */}
        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{language === 'km' ? 'ថ្ងៃសម្រាក (OFF) ថ្ងៃនេះ' : 'Rest Days Today'}</span>
            <Moon size={16} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">
              {telemetry.offTodayCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">{language === 'km' ? 'នាក់ (staff)' : 'staff'}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'km' ? 'សម្រាកកំហិតតាមច្បាប់' : 'Guaranteed rest days'}
          </p>
        </div>

        {/* Cambodian Labor Law Compliance */}
        <div className="col-span-2 lg:col-span-1 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-bold">{language === 'km' ? 'ច្បាប់ការងារ (មាត្រា ១៤៧)' : 'Labor Compliance'}</span>
            <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
              {telemetry.complianceRate}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {telemetry.complianceRate === 100
                ? (language === 'km' ? '✓ ពេញលេញ' : '✓ Full Compliance')
                : (language === 'km' ? '! ត្រួតពិនិត្យ' : '! Needs Review')}
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 mt-1 leading-tight">
            {language === 'km'
              ? 'សម្រាកយ៉ាងតិច ២៤h/សប្ដាហ៍ និងមិនលើស ៤៨h'
              : 'Min 24h weekly rest & max 48h regular hours'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'km' ? 'ស្វែងរកឈ្មោះបុគ្គលិក ឬតួនាទី...' : 'Search employee or role...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Department Filter */}
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

          {/* Shift Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទវេន' : 'All Shifts'}</option>
              {SHIFT_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {language === 'km' ? s.name_km : s.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Shift Matrix Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                {/* Employee Header */}
                <th className="p-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[220px] sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{language === 'km' ? 'បុគ្គលិក & ផ្នែក' : 'Employee & Role'}</span>
                  </div>
                </th>

                {/* 7 Days Headers */}
                {weekDays.map((day) => {
                  return (
                    <th
                      key={day.dateStr}
                      className={`p-2.5 text-center min-w-[124px] border-l border-slate-200 dark:border-slate-700/60 ${
                        day.isToday
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          : day.isWeekend
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold">
                          {language === 'km' ? day.nameKm : day.nameEn}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              day.isToday
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {day.dateStr.slice(8)}
                          </span>
                          {day.isToday && (
                            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                              {language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}

                {/* Weekly Summary Metrics Header */}
                <th className="p-3 text-center text-xs font-bold text-slate-700 dark:text-slate-200 w-28 border-l border-slate-200 dark:border-slate-700/60">
                  {language === 'km' ? 'សរុប & អនុលោម' : 'Summary'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
                    <p className="text-xs">{language === 'km' ? 'កំពុងផ្ទុកកាលវិភាគ...' : 'Loading roster...'}</p>
                  </td>
                </tr>
              ) : employeeScheduleRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <CalendarDays size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {language === 'km' ? 'រកមិនឃើញទិន្នន័យកាលវិភាគទេ' : 'No roster entries found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'km' ? 'សូមសាកល្បងជ្រើសរើសនាយកដ្ឋានផ្សេង ឬចុច Auto-Schedule' : 'Try selecting another department or click Auto-Schedule'}
                    </p>
                  </td>
                </tr>
              ) : (
                employeeScheduleRows.map((row) => {
                  const emp = employees.find((e) => e.id === row.employee.id);
                  return (
                    <tr
                      key={row.employee.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Employee Info Cell */}
                      <td className="p-3 sticky left-0 bg-white dark:bg-slate-800/95 z-10 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          {row.employee.avatar ? (
                            <img
                              src={row.employee.avatar}
                              alt={row.employee.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                              {row.employee.name ? row.employee.name.trim().charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {formatLocalizedText(row.employee.name, language)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {formatLocalizedText(row.employee.role, language)}
                            </div>
                            <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                              {formatLocalizedText(row.employee.department_name, language)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Days Shift Cells */}
                      {weekDays.map((day) => {
                        const shiftEntry = row.shifts[day.dateStr];
                        const shiftType: ShiftType = shiftEntry?.shift_type || 'off';
                        const def = getShiftConfig(shiftType, shiftSettings?.shifts);
                        const isOff = shiftType === 'off';

                        return (
                          <td
                            key={day.dateStr}
                            onClick={() => emp && handleCellClick(emp, day)}
                            className={`p-2 text-center border-l border-slate-100 dark:border-slate-700/40 transition-all ${
                              isManagerOrAdmin ? 'cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20' : ''
                            } ${day.isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}
                          >
                            <div
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-transform ${
                                isOff
                                  ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-400'
                                  : `${def.badgeBg} ${def.badgeBorder} ${def.badgeText} shadow-xs hover:scale-[1.02]`
                              }`}
                              title={
                                shiftEntry?.notes
                                  ? `${language === 'km' ? def.name_km : def.name_en} (${shiftEntry.start_time}-${shiftEntry.end_time})\nNotes: ${shiftEntry.notes}`
                                  : `${language === 'km' ? def.name_km : def.name_en} (${shiftEntry?.start_time || def.start_time}-${shiftEntry?.end_time || def.end_time})`
                              }
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: isOff ? '#94a3b8' : def.color }}
                                />
                                <span className="text-[11px] font-bold tracking-tight">
                                  {def.short_code}
                                </span>
                              </div>

                              {!isOff ? (
                                <span className="text-[10px] font-medium opacity-90 font-mono">
                                  {shiftEntry?.start_time || def.start_time}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {language === 'km' ? 'សម្រាក' : 'REST'}
                                </span>
                              )}

                              {shiftEntry?.notes && (
                                <span className="text-[9px] truncate max-w-[100px] text-slate-500 font-normal italic">
                                  • {shiftEntry.notes}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly Summary / Compliance Column */}
                      <td className="p-3 text-center border-l border-slate-100 dark:border-slate-700/40 bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                            {row.totalHours} hrs
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {row.offDaysCount} {language === 'km' ? 'ថ្ងៃសម្រាក' : 'days OFF'}
                          </div>
                          {row.isCompliant ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={10} />
                              <span>{language === 'km' ? 'ស្របច្បាប់' : 'Legal'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              <AlertTriangle size={10} />
                              <span>&gt;48h / 0 OFF</span>
                            </span>
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

      {/* Shift Legend & Cambodian Compliance Footer */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {language === 'km' ? 'កំណត់សម្គាល់វេនការងារ (Shift Legend)' : 'Shift Templates & Legend'}
            </span>
            {shiftSettings?.isCustomized && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {language === 'km' ? 'កែប្រែផ្ទាល់ខ្លួន' : 'Customized'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'km' ? 'ចុចលើប្រអប់វេនណាមួយដើម្បីកែសម្រួល ឬចាត់តាំង' : 'Click any grid cell to assign or modify shifts'}
            </span>
            {isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Layers size={13} />
                <span>{language === 'km' ? 'កែប្រែគំរូវេន (Edit Templates)' : 'Edit Shift Templates'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {getShiftList(shiftSettings?.shifts).map((s) => (
            <div
              key={s.id}
              className={`p-2 rounded-xl border flex items-center gap-2 ${s.badgeBg} ${s.badgeBorder}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${s.badgeText}`}>
                  {s.short_code} - {language === 'km' ? s.name_km : s.name_en}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {s.start_time ? `${s.start_time}-${s.end_time}` : '0.0h OFF'}
                </div>
                {s.sub_shifts && s.sub_shifts.length > 0 && (
                  <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-medium truncate">
                    AM 07:30-11:30 | PM 12:30-16:30
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Assign Modal */}
      {activeCell && (
        <RosterShiftModal
          isOpen={shiftModalOpen}
          onClose={() => setShiftModalOpen(false)}
          entry={activeCell.entry}
          employeeInfo={activeCell.employeeInfo}
          dateStr={activeCell.dateStr}
          dayName={activeCell.dayName}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      )}

      {/* Auto Schedule Modal */}
      <RosterAutoScheduleModal
        isOpen={autoScheduleModalOpen}
        onClose={() => setAutoScheduleModalOpen(false)}
        weekStart={mondayStr}
        departments={departments}
        onGenerated={fetchRoster}
      />

      {/* Official A4 Print Modal */}
      <RosterPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        weekDays={weekDays}
        rows={employeeScheduleRows}
        weekStart={mondayStr}
        departmentName={
          selectedDepartment === 'all'
            ? language === 'km'
              ? 'គ្រប់នាយកដ្ឋានទាំងអស់'
              : 'All Divisions'
            : departments.find((d) => d.id === selectedDepartment)?.name || 'General'
        }
      />

      {/* Shift Templates & Legend Edit Modal */}
      <ShiftTemplateEditModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSuccess={fetchRoster}
      />
    </div>
  );
}
