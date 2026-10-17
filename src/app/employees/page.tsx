'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Employee, Department, isBoardMember } from '@/lib/types';
import { formatLocalizedText, cleanEnglishOnly, formatDateDMY } from '@/lib/translations';
import {
  Crown,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  X,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Edit2,
  UserX,
  Trash2,
  ShieldCheck,
  CreditCard,
  FolderOpen,
  IdCard,
  User,
  UploadCloud,
  Printer,
  HeartPulse,
  Pill,
  Layers,
} from 'lucide-react';
import EmployeeImportModal from '@/components/EmployeeImportModal';
import EmployeePrintModal from '@/components/EmployeePrintModal';
import EmployeeEditModal from '@/components/EmployeeEditModal';

export default function EmployeesPage() {
  const { openModal, showToast, triggerRefresh, refreshKey, language, t } = useApp();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<'dossier' | 'roster'>('roster');
  const [employeeToPrint, setEmployeeToPrint] = useState<any | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Print Handlers
  const handlePrintRoster = () => {
    setPrintModalMode('roster');
    setPrintModalOpen(true);
  };

  const handlePrintEmployeeDossier = (emp: any) => {
    setEmployeeToPrint(emp);
    setPrintModalMode('dossier');
    setPrintModalOpen(true);
  };

  const handleEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [positionsList, setPositionsList] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Selected employee for deep profile drawer
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [drawerDetails, setDrawerDetails] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'hr_profile' | 'leaves' | 'attendance' | 'payroll' | 'reviews' | 'medical'>('overview');

  // Load departments & distinct positions list
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch((err) => console.error('Error fetching departments:', err));

    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const roles = Array.from(
            new Set(data.map((e: any) => e.role?.trim()).filter(Boolean))
          ).sort((a: any, b: any) => String(a).localeCompare(String(b))) as string[];
          setPositionsList(roles);
        }
      })
      .catch((err) => console.error('Error fetching positions:', err));
  }, [refreshKey]);

  // Sync URL search parameters on mount, popstate, or custom navigation event from Header
  useEffect(() => {
    const applyFromUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search') || params.get('q');
      const id = params.get('id');
      if (search !== null && search !== undefined && search !== '') {
        setSearchQuery(search);
      }
      if (id) {
        setActiveEmployeeId(id);
      }
    };

    applyFromUrl();

    const handleSelectEmployee = (e: any) => {
      if (e.detail?.id) {
        setActiveEmployeeId(e.detail.id);
      }
      if (e.detail?.search !== undefined) {
        setSearchQuery(e.detail.search);
      }
    };

    window.addEventListener('hrm:select-employee', handleSelectEmployee);
    window.addEventListener('popstate', applyFromUrl);

    return () => {
      window.removeEventListener('hrm:select-employee', handleSelectEmployee);
      window.removeEventListener('popstate', applyFromUrl);
    };
  }, []);

  // Fetch employees
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedDept !== 'all') params.append('department', selectedDept);
    if (selectedRole !== 'all') params.append('role', selectedRole);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    if (selectedType !== 'all') params.append('type', selectedType);

    fetch(`/api/employees?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching employees:', err);
        setLoading(false);
      });
  }, [searchQuery, selectedDept, selectedRole, selectedStatus, selectedType, refreshKey]);

  // Load drawer details when employee selected
  useEffect(() => {
    if (!activeEmployeeId) {
      setDrawerDetails(null);
      return;
    }
    setDrawerLoading(true);
    fetch(`/api/employees/${activeEmployeeId}`)
      .then((r) => r.json())
      .then((data) => {
        setDrawerDetails(data);
        setDrawerLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setDrawerLoading(false);
      });
  }, [activeEmployeeId, refreshKey]);

  // Export CSV
  const handleExportCSV = () => {
    if (employees.length === 0) {
      showToast('No employees to export', 'error');
      return;
    }
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Position', 'Department', 'Type', 'Status', 'Salary', 'Location', 'Join Date'];
    const rows = employees.map((e) => [
      e.id,
      `"${e.first_name}"`,
      `"${e.last_name}"`,
      `"${e.email}"`,
      `"${e.role}"`,
      `"${e.department_name || ''}"`,
      `"${e.employment_type}"`,
      `"${e.status}"`,
      e.salary,
      `"${e.location}"`,
      formatDateDMY(e.join_date),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hestra_hrm_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employee roster exported to CSV successfully!', 'success');
  };

  // Delete Employee state
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Terminate Employee
  const handleTerminate = async (id: string, name: string) => {
    if (!confirm(language === 'km' ? `តើអ្នកប្រាកដជាចង់កំណត់ ${name} ជា "បញ្ចប់ការងារ (Terminated)" មែនទេ?` : `Are you sure you want to mark ${name} as Terminated?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}?action=terminate`, { method: 'DELETE' });
      if (res.ok) {
        showToast(language === 'km' ? `បុគ្គលិក ${name} ត្រូវបានកំណត់ជាបញ្ចប់ការងារ` : `Employee ${name} set to Terminated`, 'info');
        triggerRefresh();
        if (activeEmployeeId === id) setActiveEmployeeId(null);
      }
    } catch {
      showToast(language === 'km' ? 'បរាជ័យក្នុងការបញ្ចប់ការងារ' : 'Failed to terminate employee', 'error');
    }
  };

  // Permanently Delete Employee
  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      const res = await fetch(`/api/employees/${deletingEmployee.id}`, { method: 'DELETE' });
      if (res.ok) {
        const empName = `${deletingEmployee.first_name} ${deletingEmployee.last_name}`;
        showToast(
          language === 'km'
            ? `បានលុបបុគ្គលិក ${empName} ចេញពីប្រព័ន្ធជោគជ័យ`
            : `Employee ${empName} deleted successfully`,
          'info'
        );
        triggerRefresh();
        if (activeEmployeeId === deletingEmployee.id) setActiveEmployeeId(null);
        setDeletingEmployee(null);
      } else {
        const data = await res.json();
        showToast(data.error || (language === 'km' ? 'បរាជ័យក្នុងការលុបបុគ្គលិក' : 'Failed to delete employee'), 'error');
      }
    } catch {
      showToast(language === 'km' ? 'កំហុសបណ្តាញក្នុងការលុបបុគ្គលិក' : 'Network error deleting employee', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('emp_directory_title')}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                  {employees.length} {t('colleagues_unit')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {t('emp_directory_sub')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 flex items-center gap-2 shadow-2xs cursor-pointer"
            title={language === 'km' ? 'នាំចូលទិន្នន័យពី CSV ឬ Excel' : 'Import employees from CSV or Excel'}
          >
            <UploadCloud size={15} className="text-indigo-600 dark:text-indigo-400" /> {t('emp_import_csv')}
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Download size={15} /> {t('emp_export_csv')}
          </button>
          <button
            onClick={handlePrintRoster}
            className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 flex items-center gap-2 shadow-2xs cursor-pointer"
            title={language === 'km' ? 'បោះពុម្ពបញ្ជីរាយនាមបុគ្គលិកសរុប (A4)' : 'Print Workforce Roster Report (A4)'}
          >
            <Printer size={15} className="text-slate-600 dark:text-slate-400" /> {t('emp_print_roster')}
          </button>
          <button
            onClick={() => openModal('add-employee')}
            className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer border border-indigo-400/30"
          >
            <Plus size={16} /> {t('emp_add_staff')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('emp_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans transition-all cursor-pointer"
          >
            <option value="all">{t('emp_all_departments')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {formatLocalizedText(d.name, language)}
              </option>
            ))}
          </select>

          {/* Position Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans transition-all cursor-pointer"
          >
            <option value="all">{t('emp_all_positions')}</option>
            {positionsList.map((pos) => (
              <option key={pos} value={pos}>
                {formatLocalizedText(pos, language)}
              </option>
            ))}
          </select>

          {/* Employment Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans transition-all cursor-pointer"
          >
            <option value="all">{t('emp_all_types')}</option>
            <option value="Full-Time">{t('emp_type_fulltime')}</option>
            <option value="Part-Time">{t('emp_type_parttime')}</option>
            <option value="Contract">{t('emp_type_contract')}</option>
            <option value="Intern">{t('emp_type_intern')}</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Records', color: 'bg-slate-400' },
            { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
            { id: 'Remote', label: 'Remote', color: 'bg-blue-500' },
            { id: 'On Leave', label: 'On Leave', color: 'bg-amber-500' },
            { id: 'Terminated', label: 'Terminated', color: 'bg-rose-500' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === st.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${st.color}`}></span>
              <span>{st.label}</span>
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-700 dark:text-slate-200">{employees.length}</strong> colleagues
          </span>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-slate-500">Loading colleagues...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No employees found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filters, or onboard a new employee.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UploadCloud size={14} /> {t('emp_import_csv')}
            </button>
            <button
              onClick={() => openModal('add-employee')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> {t('emp_add_staff')}
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
                setSelectedRole('all');
                setSelectedStatus('all');
                setSelectedType('all');
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              {language === 'km' ? 'សម្អាតការច្រោះ' : 'Clear Filters'}
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setActiveEmployeeId(emp.id)}
              className="glass-card p-5.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-400/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={emp.first_name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-600 transition-all shadow-2xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold flex items-center justify-center text-base border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                        {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        emp.status === 'Active'
                          ? 'bg-emerald-500'
                          : emp.status === 'Remote'
                          ? 'bg-blue-500'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      title={emp.status}
                    ></span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {formatLocalizedText(emp.department_name || (language === 'km' ? 'ទូទៅ (General)' : 'General'), language)}
                    </span>
                    {emp.group_name && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                        <Layers className="w-2.5 h-2.5 text-indigo-500" />
                        {emp.group_name}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatLocalizedText(emp.employment_type, language)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {formatLocalizedText(emp.first_name, language)} {formatLocalizedText(emp.last_name, language)}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-semibold">
                      {emp.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Briefcase size={13} className="text-indigo-500 shrink-0" />
                    <span title={emp.role}>{formatLocalizedText(emp.role, language)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email || (language === 'km' ? 'គ្មានអ៊ីមែល' : 'No email')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{formatLocalizedText(emp.location, language)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {language === 'km' ? 'ប្រាក់បៀវត្សរ៍' : 'Compensation'}
                  </span>
                  {isBoardMember(emp) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                      <Crown size={12} className="shrink-0" />
                      {language === 'km' ? 'លើកលែង (ក្រុមប្រឹក្សា)' : 'Exempt (Board)'}
                    </span>
                  ) : (
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                      ${(emp.salary || 0).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(emp);
                    }}
                    title={language === 'km' ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'Edit Employee'}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintEmployeeDossier(emp);
                    }}
                    title={language === 'km' ? 'បោះពុម្ពប្រវត្តិរូប (A4)' : 'Print Dossier (A4)'}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingEmployee(emp);
                    }}
                    title={language === 'km' ? 'លុបបុគ្គលិក' : 'Delete Employee'}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 ml-1">
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">{language === 'km' ? 'បុគ្គលិក (Colleague)' : 'Colleague'}</th>
                  <th className="px-5 py-3.5">{t('emp_position_col')}</th>
                  <th className="px-5 py-3.5">{language === 'km' ? 'ផ្នែក (Department)' : 'Department'}</th>
                  <th className="px-5 py-3.5">{language === 'km' ? 'ស្ថានភាព (Status)' : 'Status'}</th>
                  <th className="px-5 py-3.5">{language === 'km' ? 'ប្រភេទ (Type)' : 'Type'}</th>
                  <th className="px-5 py-3.5">{language === 'km' ? 'ទីតាំង (Location)' : 'Location'}</th>
                  <th className="px-5 py-3.5">{language === 'km' ? 'បៀវត្សរ៍ (Salary)' : 'Salary'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'km' ? 'សកម្មភាព (Actions)' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setActiveEmployeeId(emp.id)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.first_name}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 shadow-2xs">
                            {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {formatLocalizedText(emp.first_name, language)} {formatLocalizedText(emp.last_name, language)}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{emp.id}</span>
                            {emp.email && <span className="truncate max-w-[150px] hidden sm:inline">&bull; {emp.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[200px]" title={emp.role}>
                          {formatLocalizedText(emp.role, language)}
                        </span>
                      </div>
                      {emp.labor_type && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 ml-5">
                          {emp.labor_type}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {formatLocalizedText(emp.department_name || (language === 'km' ? 'ទូទៅ (General)' : 'General'), language)}
                        </span>
                        {emp.group_name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                            <Layers className="w-2.5 h-2.5 text-indigo-500" />
                            {emp.group_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                            : emp.status === 'Remote'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                            : emp.status === 'On Leave'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === 'Active' ? 'bg-emerald-500' :
                          emp.status === 'Remote' ? 'bg-blue-500' :
                          emp.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></span>
                        {formatLocalizedText(emp.status, language)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{formatLocalizedText(emp.employment_type, language)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatLocalizedText(emp.location, language)}</td>
                    <td className="px-5 py-3 font-bold font-mono text-slate-800 dark:text-slate-200">
                      {isBoardMember(emp) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                          <Crown size={12} className="shrink-0" />
                          {language === 'km' ? 'លើកលែង (ក្រុមប្រឹក្សា)' : 'Exempt (Board)'}
                        </span>
                      ) : (
                        `$${(emp.salary || 0).toLocaleString()}`
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintEmployeeDossier(emp);
                          }}
                          title={language === 'km' ? 'បោះពុម្ពប្រវត្តិរូប (A4)' : 'Print Dossier (A4)'}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEmployee(emp);
                          }}
                          title={language === 'km' ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'Edit Employee'}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEmployeeId(emp.id);
                          }}
                          className="px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          {language === 'km' ? 'លម្អិត' : 'Details'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingEmployee(emp);
                          }}
                          title={language === 'km' ? 'លុបបុគ្គលិក' : 'Delete Employee'}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEEP PROFILE SLIDE-OVER DRAWER */}
      {activeEmployeeId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
              {drawerLoading || !drawerDetails ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-slate-800 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-slate-800 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {drawerDetails.employee.avatar ? (
                    <img
                      src={drawerDetails.employee.avatar}
                      alt={drawerDetails.employee.first_name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/50 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-bold text-xl flex items-center justify-center shadow-md">
                      {(drawerDetails.employee.first_name?.[0] || 'E') + (drawerDetails.employee.last_name?.[0] || '')}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">
                        {formatLocalizedText(drawerDetails.employee.first_name, language)} {formatLocalizedText(drawerDetails.employee.last_name, language)}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        {formatLocalizedText(drawerDetails.employee.status, language)}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-300">{formatLocalizedText(drawerDetails.employee.role, language)}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                        {formatLocalizedText(drawerDetails.employee.department_name || (language === 'km' ? 'ទូទៅ (General)' : 'General'), language)}
                      </span> &bull;{' '}
                      <span>{formatLocalizedText(drawerDetails.employee.location, language)}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditEmployee(drawerDetails.employee)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title={language === 'km' ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'Edit employee profile'}
                >
                  <Edit2 size={14} />
                  <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => handlePrintEmployeeDossier(drawerDetails.employee)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-700"
                  title={language === 'km' ? 'បោះពុម្ពទម្រង់ព័ត៌មានបុគ្គលិក (A4)' : 'Print official employee dossier'}
                >
                  <Printer size={14} className="text-indigo-400" />
                  <span>{t('emp_print_profile')}</span>
                </button>
                <Link
                  href="/tools?tab=letters"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FileText size={14} />
                  <span>{t('emp_official_letter')}</span>
                </Link>
                <button
                  onClick={() => setActiveEmployeeId(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'overview', label: language === 'km' ? 'សង្ខេប' : 'Overview' },
                { id: 'hr_profile', label: t('emp_hr_profile_tab') },
                { id: 'leaves', label: language === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'Leave Balances' },
                { id: 'attendance', label: language === 'km' ? 'វត្តមាន' : 'Attendance' },
                { id: 'payroll', label: language === 'km' ? 'ប្រាក់បៀវត្សរ៍' : 'Compensation & Payslips' },
                { id: 'reviews', label: language === 'km' ? 'ការវាយតម្លៃ' : 'Performance Reviews' },
                { id: 'medical', label: language === 'km' ? 'សុខភាព & វេជ្ជសាស្ត្រ' : 'Health & Medical' },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setDrawerTab(tb.id as any)}
                  className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    drawerTab === tb.id
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700">
              {drawerLoading || !drawerDetails ? (
                <div className="py-20 text-center text-slate-400">
                  {language === 'km' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading profile records...'}
                </div>
              ) : (
                <>
                  {/* 1. OVERVIEW TAB */}
                  {drawerTab === 'overview' && (
                    <div className="space-y-6">
                      {isBoardMember(drawerDetails.employee) && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3 shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Crown size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              {language === 'km' ? 'សមាជិកក្រុមប្រឹក្សាភិបាល (Board of Directors)' : 'Board of Directors Member'}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                {language === 'km' ? 'លើកលែងកាតព្វកិច្ច' : 'Exempt'}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {language === 'km'
                                ? 'សមាជិកក្រុមប្រឹក្សាភិបាលត្រូវបានលើកលែងពីប្រាក់បៀវត្សរ៍ប្រចាំខែ ការកត់ត្រាវត្តមានប្រចាំថ្ងៃ និងភារកិច្ចប្រតិបត្តិការនានារបស់បុគ្គលិកទូទៅ។'
                                : 'Members of the Board of Directors are exempt from monthly payroll processing, daily attendance tracking, and standard operational staff tasks.'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-2">
                          {language === 'km' ? 'សេចក្តីសង្ខេបវិជ្ជាជីវៈ' : 'Professional Summary'}
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                          {formatLocalizedText(drawerDetails.employee.bio, language) ||
                            (language === 'km'
                              ? 'បុគ្គលិកដែលមានការប្តេជ្ញាចិត្តខ្ពស់ និងចូលរួមយ៉ាងសកម្មក្នុងភាពជោគជ័យរបស់ក្រុមហ៊ុន។'
                              : 'Dedicated team member contributing actively to corporate initiatives and cross-functional pod velocity.')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            {language === 'km' ? 'អ្នកគ្រប់គ្រងផ្ទាល់' : 'Direct Manager'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {drawerDetails.employee.manager_name || (language === 'km' ? 'ថ្នាក់ដឹកនាំ' : 'Executive Leadership')}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            {language === 'km' ? 'ថ្ងៃចូលបម្រើការ' : 'Hire Date'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatDateDMY(drawerDetails.employee.join_date)}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            {language === 'km' ? 'អ៊ីមែលការងារ' : 'Work Email'}
                          </span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {drawerDetails.employee.email || (language === 'km' ? 'គ្មានអ៊ីមែល' : 'No email')}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            {language === 'km' ? 'លេខទូរស័ព្ទ' : 'Contact Phone'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {drawerDetails.employee.phone || (language === 'km' ? 'មិនមាន' : 'Not recorded')}
                          </span>
                        </div>
                      </div>

                      {/* Key HR & Compliance Badges */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/70 space-y-1">
                          <span className="text-[10px] text-purple-700 font-bold block uppercase">
                            {language === 'km' ? 'ប.ស.ស' : 'NSSF'}
                          </span>
                          <span className="font-bold text-purple-950 block truncate">
                            {formatLocalizedText(drawerDetails.employee.nssf_number || drawerDetails.employee.nssf_member, language) || 'N/A'}
                          </span>
                        </div>
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/70 space-y-1">
                          <span className="text-[10px] text-blue-700 font-bold block uppercase">
                            {language === 'km' ? 'កិច្ចសន្យា' : 'Contract'}
                          </span>
                          <span className="font-bold text-blue-950 block truncate">
                            {formatLocalizedText(drawerDetails.employee.contract_type, language) || 'UDC'}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 space-y-1">
                          <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                            {language === 'km' ? 'ធនាគារ' : 'Bank'}
                          </span>
                          <span className="font-bold text-emerald-950 block truncate">
                            {formatLocalizedText(drawerDetails.employee.bank_name, language)?.split(' ')[0] || 'ABA Bank'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-3">
                          {language === 'km' ? 'ទំនាក់ទំនងពេលមានអាសន្ន' : 'Emergency Contact'}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              {language === 'km' ? 'ឈ្មោះ & ត្រូវជា' : 'Name & Relation'}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {drawerDetails.employee.emergency_contact_name
                                ? `${drawerDetails.employee.emergency_contact_name} (${formatLocalizedText(drawerDetails.employee.emergency_contact_relationship, language) || (language === 'km' ? 'ទំនាក់ទំនង' : 'Contact')})`
                                : (language === 'km' ? 'មានក្នុងប្រព័ន្ធ HR' : 'On File with HR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              {language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                            </span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {drawerDetails.employee.emergency_contact_phone || '+855 12 000 000'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditEmployee(drawerDetails.employee)}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={language === 'km' ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'Edit Employee'}
                          >
                            <Edit2 size={15} /> {language === 'km' ? 'កែប្រែព័ត៌មាន' : 'Edit Employee'}
                          </button>
                          <button
                            onClick={() => handlePrintEmployeeDossier(drawerDetails.employee)}
                            className="px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={language === 'km' ? 'បោះពុម្ពទម្រង់ព័ត៌មានបុគ្គលិក (A4)' : 'Print official employee dossier'}
                          >
                            <Printer size={15} /> {t('emp_print_profile')}
                          </button>
                          <button
                            onClick={() => handleTerminate(drawerDetails.employee.id, `${drawerDetails.employee.first_name} ${drawerDetails.employee.last_name}`)}
                            className="px-3 py-2 rounded-lg text-amber-600 hover:bg-amber-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserX size={15} /> {language === 'km' ? 'បញ្ចប់ការងារ' : 'Terminate'}
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(drawerDetails.employee)}
                            className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={15} /> {language === 'km' ? 'លុបបុគ្គលិក' : 'Delete'}
                          </button>
                        </div>
                        <button
                          onClick={() => setDrawerTab('hr_profile')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t('emp_view_7_sections')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1.5 HR PROFILE (7 DETAILED SECTIONS) */}
                  {drawerTab === 'hr_profile' && (
                    <div className="space-y-6">
                      {/* Section 1: Personal Information */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-indigo-700 font-bold text-xs">
                          <User size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ១៖ ព័ត៌មានផ្ទាល់ខ្លួន' : 'Section 1: Personal Information'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'នាមត្រកូល' : 'Last name'}
                            </span>
                            <span className="font-bold text-slate-800">{drawerDetails.employee.last_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'នាមខ្លួន' : 'First name'}
                            </span>
                            <span className="font-bold text-slate-800">{drawerDetails.employee.first_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ភេទ' : 'Gender'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.gender || (language === 'km' ? 'ប្រុស' : 'Male'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'}
                            </span>
                            <span className="font-semibold text-slate-700">{formatDateDMY(drawerDetails.employee.dob, 'N/A')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'សញ្ជាតិ' : 'Nationality'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {cleanEnglishOnly(drawerDetails.employee.nationality) || 'Cambodian'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ស្ថានភាពគ្រួសារ' : 'Marital Status'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.marital_status || (language === 'km' ? 'នៅលីវ' : 'Single'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អត្តសញ្ញាណប័ណ្ណ' : 'National ID'}
                            </span>
                            <span className="font-mono font-bold text-indigo-600">{drawerDetails.employee.national_id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ស្ថានភាព' : 'Status'}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {formatLocalizedText(drawerDetails.employee.status, language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ប្រភេទការងារ' : 'Employment Type'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.employment_type, language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ប្រាក់បៀវត្សរ៍' : 'Salary'}
                            </span>
                            <span className="font-mono font-bold text-emerald-700">${drawerDetails.employee.salary?.toLocaleString()}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ទីតាំង' : 'Location'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {cleanEnglishOnly(drawerDetails.employee.location) || 'Phnom Penh'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Contact Information */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-700 font-bold text-xs">
                          <Phone size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ២៖ ព័ត៌មានទំនាក់ទំនង' : 'Section 2: Contact Information'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{drawerDetails.employee.phone || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អ៊ីមែលការងារ' : 'Work Email'}
                            </span>
                            <span className="font-semibold text-slate-800">{drawerDetails.employee.email || (language === 'km' ? 'មិនមាន' : 'N/A')}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អាសយដ្ឋានបច្ចុប្បន្ន' : 'Current Address'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.current_address, language) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ខេត្ត/រាជធានី' : 'Province/City'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.province_city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ស្រុក/ខណ្ឌ' : 'District'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.district, language) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ឃុំ/សង្កាត់' : 'Commune/Sangkat'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.commune_sangkat, language) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ភូមិ' : 'Village'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.village, language) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Employee Information */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-700 font-bold text-xs">
                          <Briefcase size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ៣៖ ព័ត៌មានការងារ' : 'Section 3: Employee Information'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អត្តលេខ' : 'Employee ID'}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{drawerDetails.employee.id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ដេប៉ាតឺម៉ង់' : 'Department'}
                            </span>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                              {formatLocalizedText(drawerDetails.employee.department_name || (language === 'km' ? 'ទូទៅ (General)' : 'General'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'មុខតំណែង' : 'Position'}
                            </span>
                            <span className="font-bold text-indigo-700">
                              {formatLocalizedText(drawerDetails.employee.role, language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ក្រុម / ខ្សែសង្វាក់' : 'Group / Line'}
                            </span>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-500" />
                              {drawerDetails.employee.group_name || (language === 'km' ? 'មិនទាន់ចាត់តាំង' : 'Unassigned')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ប្រភេទបុគ្គលិក' : 'Employee Type'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.employee_type || (language === 'km' ? 'ពេញសិទ្ធិ' : 'Full-Time'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ចូលបម្រើការ' : 'Join Date'}
                            </span>
                            <span className="font-semibold text-slate-700">{formatDateDMY(drawerDetails.employee.join_date)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ប្រភេទកិច្ចសន្យា' : 'Contract Type'}
                            </span>
                            <span className="font-bold text-blue-700">
                              {formatLocalizedText(drawerDetails.employee.contract_type || 'UDC', language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Contract Start'}
                            </span>
                            <span className="font-semibold text-slate-700">{formatDateDMY(drawerDetails.employee.contract_start || drawerDetails.employee.join_date)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'កាលបរិច្ឆេទបញ្ចប់' : 'Contract End'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {drawerDetails.employee.contract_end && /^\d/.test(drawerDetails.employee.contract_end) ? formatDateDMY(drawerDetails.employee.contract_end) : formatLocalizedText(drawerDetails.employee.contract_end || (language === 'km' ? 'មិនកំណត់' : 'Indefinite'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Manager'}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatLocalizedText(drawerDetails.employee.manager_name || (language === 'km' ? 'ថ្នាក់ដឹកនាំ' : 'Executive Leadership'), language)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ការិយាល័យធ្វើការ' : 'Work Location'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {cleanEnglishOnly(drawerDetails.employee.work_location) || 'Head Office'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Salary & Payroll */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-amber-700 font-bold text-xs">
                          <DollarSign size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ៤៖ ប្រាក់បៀវត្សរ៍ & ធនាគារ' : 'Section 4: Salary & Payroll'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ប្រាក់បៀវត្សរ៍គោល' : 'Basic Salary'}
                            </span>
                            <span className="font-mono font-bold text-base text-emerald-700">${drawerDetails.employee.salary?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'រូបិយប័ណ្ណ' : 'Currency'}
                            </span>
                            <span className="font-semibold text-slate-700">{drawerDetails.employee.salary_currency || 'USD ($)'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ភាពញឹកញាប់បើក' : 'Frequency'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.salary_frequency || (language === 'km' ? 'កន្លះខែ' : 'Semi-monthly'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ឈ្មោះធនាគារ' : 'Bank Name'}
                            </span>
                            <span className="font-bold text-indigo-700">
                              {formatLocalizedText(drawerDetails.employee.bank_name || 'ABA Bank', language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ឈ្មោះម្ចាស់គណនី' : 'Account Name'}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{drawerDetails.employee.bank_account_name || `${drawerDetails.employee.first_name} ${drawerDetails.employee.last_name}`}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'លេខគណនី' : 'Account Number'}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{drawerDetails.employee.bank_account_number || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: NSSF Information */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-purple-700 font-bold text-xs">
                          <ShieldCheck size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ៥៖ ព័ត៌មាន ប.ស.ស' : 'Section 5: NSSF Information'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'សមាជិក ប.ស.ស' : 'NSSF Member'}
                            </span>
                            <span className="font-bold text-purple-800">
                              {formatLocalizedText(drawerDetails.employee.nssf_member || (language === 'km' ? 'មាន' : 'Yes'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'លេខកាត ប.ស.ស' : 'NSSF Number'}
                            </span>
                            <span className="font-mono font-bold text-purple-900">{drawerDetails.employee.nssf_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'កាលបរិច្ឆេទចុះបញ្ជី' : 'Registration Date'}
                            </span>
                            <span className="font-semibold text-slate-700">{formatDateDMY(drawerDetails.employee.nssf_reg_date || drawerDetails.employee.join_date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 6: Emergency Contact */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-rose-700 font-bold text-xs">
                          <AlertCircle size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ៦៖ ទំនាក់ទំនងពេលមានអាសន្ន' : 'Section 6: Emergency Contact'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ឈ្មោះអ្នកទំនាក់ទំនង' : 'Contact Name'}
                            </span>
                            <span className="font-bold text-slate-800">{drawerDetails.employee.emergency_contact_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'ត្រូវជា' : 'Relationship'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.emergency_contact_relationship || (language === 'km' ? 'ប្តី/ប្រពន្ធ' : 'Spouse'), language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'លេខទូរស័ព្ទអាសន្ន' : 'Emergency Phone'}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{drawerDetails.employee.emergency_contact_phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                              {language === 'km' ? 'អាសយដ្ឋាន' : 'Address'}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatLocalizedText(drawerDetails.employee.emergency_contact_address || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh'), language)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 7: Documents */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-700 font-bold text-xs">
                          <FolderOpen size={16} />
                          <span>{language === 'km' ? 'ផ្នែកទី ៧៖ ឯកសារភ្ជាប់' : 'Section 7: Attached Documents'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">
                              {language === 'km' ? 'ច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណ' : 'National ID Copy'}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[140px]">{drawerDetails.employee.doc_national_id || 'National_ID_Scan.pdf'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">
                              {language === 'km' ? 'លិខិតឆ្លងដែន' : 'Passport Copy'}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[140px]">{drawerDetails.employee.doc_passport || 'Passport_Copy.pdf'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">
                              {language === 'km' ? 'កិច្ចសន្យាការងារ' : 'Employment Contract'}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[140px]">{drawerDetails.employee.doc_contract || 'Contract_Signed.pdf'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">
                              {language === 'km' ? 'ឯកសារផ្សេងៗ' : 'Other Documents'}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[140px]">{drawerDetails.employee.doc_others || 'Certificates.zip'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. LEAVE BALANCES TAB */}
                  {drawerTab === 'leaves' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-blue-700 uppercase">Annual PTO</span>
                          <div className="text-2xl font-black text-blue-900 my-1">
                            {drawerDetails.leaveBalance ? 20 - drawerDetails.leaveBalance.annual_used : 14}
                          </div>
                          <span className="text-[10px] text-blue-600">days remaining of 20</span>
                        </div>

                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Sick Leave</span>
                          <div className="text-2xl font-black text-emerald-900 my-1">
                            {drawerDetails.leaveBalance ? 10 - drawerDetails.leaveBalance.sick_used : 8}
                          </div>
                          <span className="text-[10px] text-emerald-600">days remaining of 10</span>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Casual Days</span>
                          <div className="text-2xl font-black text-amber-900 my-1">
                            {drawerDetails.leaveBalance ? 5 - drawerDetails.leaveBalance.casual_used : 4}
                          </div>
                          <span className="text-[10px] text-amber-600">days remaining of 5</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 mb-3">Leave Request History</h4>
                        {drawerDetails.leaves && drawerDetails.leaves.length > 0 ? (
                          <div className="space-y-2.5">
                            {drawerDetails.leaves.map((l: any) => (
                              <div key={l.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-900">{l.leave_type} Leave ({l.days_count} days)</div>
                                  <div className="text-[11px] text-slate-500">{l.start_date} &rarr; {l.end_date}</div>
                                  {l.reason && <div className="text-[10px] text-slate-600 mt-1 italic">&ldquo;{l.reason}&rdquo;</div>}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {l.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No historical leave requests recorded.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. ATTENDANCE TAB */}
                  {drawerTab === 'attendance' && (
                    <div className="space-y-4">
                      {isBoardMember(drawerDetails.employee) ? (
                        <div className="p-6 text-center rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 space-y-2">
                          <Crown className="w-10 h-10 text-amber-500 mx-auto opacity-90" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {language === 'km' ? 'លើកលែងការកត់ត្រាវត្តមាន (Board of Directors)' : 'Exempt from Attendance Tracking (Board Member)'}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                            {language === 'km'
                              ? 'ក្នុងនាមជាសមាជិកក្រុមប្រឹក្សាភិបាល ថ្នាក់ដឹកនាំរូបនេះមិនតម្រូវឱ្យកត់ត្រាវត្តមាន ឬតាមដានការចូល/ចេញប្រចាំថ្ងៃឡើយ។'
                              : 'As a member of the Board of Directors, this executive is exempt from daily clock-in/out tracking and factory attendance schedules.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-900">Recent Attendance Logs (Past 14 Days)</h4>
                          {drawerDetails.attendance && drawerDetails.attendance.length > 0 ? (
                            <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                              {drawerDetails.attendance.map((a: any) => (
                                <div key={a.id} className="p-3 flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-slate-800">{a.date}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {a.clock_in ? `In: ${a.clock_in}` : 'No Punch In'} &bull; {a.clock_out ? `Out: ${a.clock_out}` : 'Active / Pending'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-700">{a.work_hours} hrs</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : a.status === 'Remote' ? 'bg-blue-100 text-blue-700' : a.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                      {a.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No attendance records for this period.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 4. PAYROLL TAB */}
                  {drawerTab === 'payroll' && (
                    <div className="space-y-4">
                      {isBoardMember(drawerDetails.employee) ? (
                        <div className="p-6 text-center rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 space-y-2">
                          <Crown className="w-10 h-10 text-amber-500 mx-auto opacity-90" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {language === 'km' ? 'លើកលែងប្រាក់បៀវត្សរ៍ (Board of Directors)' : 'Exempt from Payroll & Salary (Board Member)'}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                            {language === 'km'
                              ? 'សមាជិកក្រុមប្រឹក្សាភិបាលត្រូវបានលើកលែងពីការបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ និងការគណនាពន្ធលើប្រាក់បៀវត្សរ៍ក្នុងប្រព័ន្ធ។'
                              : 'Members of the Board of Directors do not receive monthly payroll compensation or salary slip processing through this system.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-indigo-600 uppercase font-bold">Base Annual Salary</span>
                              <div className="text-2xl font-black text-indigo-950">
                                ${(drawerDetails.employee.salary || 0).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-indigo-600 uppercase font-bold">Est. Monthly Net</span>
                              <div className="text-lg font-extrabold text-indigo-900">
                                ${Math.round(((drawerDetails.employee.salary || 0) / 12) * 0.72).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-900">Issued Payslips</h4>
                          {drawerDetails.payrolls && drawerDetails.payrolls.length > 0 ? (
                            <div className="space-y-2">
                              {drawerDetails.payrolls.map((p: any) => (
                                <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-800">{p.pay_period}</span>
                                    <span className="text-[11px] text-slate-500 block">Disbursed on: {p.payment_date}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-black text-slate-900 block">${p.net_salary.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      {p.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No payslips issued yet.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 5. PERFORMANCE REVIEWS */}
                  {drawerTab === 'reviews' && (
                    <div className="space-y-4">
                      {isBoardMember(drawerDetails.employee) ? (
                        <div className="p-6 text-center rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 space-y-2">
                          <Crown className="w-10 h-10 text-amber-500 mx-auto opacity-90" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {language === 'km' ? 'លើកលែងការវាយតម្លៃការងារ (Board of Directors)' : 'Exempt from Performance Appraisals (Board Member)'}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                            {language === 'km'
                              ? 'សមាជិកក្រុមប្រឹក្សាភិបាលជាថ្នាក់ដឹកនាំអភិបាលកិច្ចជាន់ខ្ពស់ និងត្រូវបានលើកលែងពីការវាយតម្លៃការងារប្រតិបត្តិការបុគ្គលិក។'
                              : 'Members of the Board of Directors serve in strategic governance and are exempt from standard employee performance reviews.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-900">Official Review Records</h4>
                          {drawerDetails.reviews && drawerDetails.reviews.length > 0 ? (
                            <div className="space-y-3">
                              {drawerDetails.reviews.map((r: any) => (
                                <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{r.review_period}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                                      Rating: {r.rating} / 5.0
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700"><strong>Strengths:</strong> {r.strengths}</p>
                                  <p className="text-xs text-slate-600"><strong>Areas for Growth:</strong> {r.areas_for_growth}</p>
                                  <div className="text-[10px] text-slate-400 pt-1">Reviewed by: {r.reviewer_name}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No formal performance reviews logged yet.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 6. HEALTH & MEDICAL MANAGEMENT TAB */}
                  {drawerTab === 'medical' && (
                    <div className="space-y-5">
                      <div className="p-4 bg-linear-to-r from-rose-50 to-indigo-50 border border-rose-200/80 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                            <HeartPulse size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {language === 'km' ? 'ប្រវត្តិសុខភាព & វេជ្ជសាស្ត្រ' : 'Employee Health & Medical Profile'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {language === 'km' ? 'ការពិនិត្យព្យាបាល វេជ្ជបញ្ជាថ្នាំ និងច្បាប់ឈប់សម្រាកព្យាបាល' : 'Clinic consultations, dispensed medicines & medical leaves'}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/medical?tab=records&emp=${drawerDetails.employee.id}`}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                        >
                          <Pill size={14} />
                          <span>{language === 'km' ? 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ' : 'Medical Hub'}</span>
                        </Link>
                      </div>

                      {/* Summary Badges */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">
                            {language === 'km' ? 'ការពិនិត្យគ្លីនិក' : 'Clinic Visits'}
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            {drawerDetails.medicalRecords?.length || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">
                            {language === 'km' ? 'ថ្នាំបានបើក' : 'Meds Dispensed'}
                          </span>
                          <span className="text-lg font-black text-rose-600">
                            {drawerDetails.medicineIssuances?.length || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">
                            {language === 'km' ? 'ច្បាប់ឈឺ (ថ្ងៃ)' : 'Sick Leave Days'}
                          </span>
                          <span className="text-lg font-black text-indigo-600">
                            {drawerDetails.leaveBalance?.sick_used || 0}
                          </span>
                        </div>
                      </div>

                      {/* Consultation History */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <HeartPulse size={14} className="text-rose-500" />
                            <span>{language === 'km' ? 'កំណត់ត្រាពិនិត្យជំងឺ (Consultations)' : 'Medical Consultation History'}</span>
                          </h5>
                        </div>

                        {drawerDetails.medicalRecords && drawerDetails.medicalRecords.length > 0 ? (
                          <div className="space-y-3">
                            {drawerDetails.medicalRecords.map((rec: any) => (
                              <div key={rec.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{rec.diagnosis}</span>
                                    {rec.medical_leave_granted > 0 && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        {rec.medical_leave_days}d Med Leave
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-400 text-[11px] font-medium">{rec.visit_date} {rec.visit_time || ''}</span>
                                </div>
                                <p className="text-slate-600"><strong className="text-slate-700">Symptoms:</strong> {rec.symptoms}</p>
                                {rec.medicine_prescribed && (
                                  <p className="text-slate-600"><strong className="text-slate-700">Prescription:</strong> {rec.medicine_prescribed} ({rec.dosage} - {rec.frequency})</p>
                                )}
                                {rec.medical_notes && (
                                  <p className="text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                                    &ldquo;{rec.medical_notes}&rdquo;
                                  </p>
                                )}
                                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Attending Doctor: <strong>{rec.doctor_name}</strong></span>
                                  <span className="font-bold text-emerald-600">{rec.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                            {language === 'km' ? 'មិនមានកំណត់ត្រាពិនិត្យសុខភាពនៅឡើយទេ' : 'No medical consultation records logged.'}
                          </div>
                        )}
                      </div>

                      {/* Dispensed Medicines */}
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-2.5">
                          <Pill size={14} className="text-indigo-500" />
                          <span>{language === 'km' ? 'ប្រវត្តិបើកថ្នាំ (Dispensed Medications)' : 'Prescriptions Dispensed'}</span>
                        </h5>

                        {drawerDetails.medicineIssuances && drawerDetails.medicineIssuances.length > 0 ? (
                          <div className="space-y-2">
                            {drawerDetails.medicineIssuances.map((iss: any) => (
                              <div key={iss.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-800 block">
                                    {iss.medicine_name} ({iss.quantity_issued} {iss.medicine_unit || 'units'})
                                  </span>
                                  <span className="text-[11px] text-slate-500 block">
                                    {iss.prescription_instruction || iss.dosage || 'As directed'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[11px] text-slate-400 block">{iss.issued_at?.split('T')[0]}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">By: {iss.issued_by}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-xs">
                            {language === 'km' ? 'មិនមានប្រវត្តិបើកថ្នាំទេ' : 'No medicines dispensed to this employee.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE EMPLOYEE CONFIRMATION MODAL */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'km' ? 'បញ្ជាក់ការលុបបុគ្គលិក?' : 'Confirm Delete Employee?'}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {language === 'km'
                ? `តើអ្នកប្រាកដជាចង់លុបបុគ្គលិក "${deletingEmployee.first_name} ${deletingEmployee.last_name}" (${deletingEmployee.id}) ចេញពីប្រព័ន្ធមែនទេ? រាល់កំណត់ត្រាវត្តមាន ច្បាប់ឈប់សម្រាក និងប្រាក់បៀវត្សរ៍នឹងត្រូវលុបចេញទាំងស្រុង។`
                : `Are you sure you want to permanently delete employee "${formatLocalizedText(deletingEmployee.first_name, language)} ${formatLocalizedText(deletingEmployee.last_name, language)}" (${deletingEmployee.id})? All associated attendance, leave, and payroll records will be permanently removed.`}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                {language === 'km' ? 'ទេ, បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors text-xs cursor-pointer"
              >
                {language === 'km' ? 'បាទ/ចាស, លុបបុគ្គលិក' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Employee Import Modal */}
      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />

      {/* Printable Preview & Execution Modal */}
      <EmployeePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        mode={printModalMode}
        employee={employeeToPrint}
        employees={employees}
        language={language}
        filterSummary={
          selectedDept !== 'all' || selectedStatus !== 'all' || selectedType !== 'all'
            ? `${selectedDept !== 'all' ? selectedDept : ''} ${selectedStatus !== 'all' ? selectedStatus : ''} ${selectedType !== 'all' ? selectedType : ''}`.trim()
            : undefined
        }
      />

      {/* Edit Employee Modal */}
      <EmployeeEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        departments={departments}
        onSuccess={(updatedEmp) => {
          setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
          if (drawerDetails && drawerDetails.employee.id === updatedEmp.id) {
            setDrawerDetails((prev: any) => (prev ? { ...prev, employee: updatedEmp } : prev));
          }
          triggerRefresh();
        }}
      />
    </div>
  );
}
