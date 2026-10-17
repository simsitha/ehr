'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { UserAccount, UserRole, UserStatus, Employee, Department } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserPlus,
  KeyRound,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  Mail,
  Building2,
  RefreshCw,
  BadgeCheck,
  UserCheck,
  UserX,
  Sliders,
  Eye,
  Info,
} from 'lucide-react';

interface PermissionOption {
  id: string;
  nameKm: string;
  nameEn: string;
  category: 'core' | 'approvals' | 'finance' | 'admin';
}

const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { id: 'self_service', nameKm: 'ផតថលស្វ័យសេវាបុគ្គលិក (ESS)', nameEn: 'Employee Self-Service Portal', category: 'core' },
  { id: 'clock_in', nameKm: 'កត់ត្រាវត្តមាន (Clock In / Out)', nameEn: 'Time Clock Punching', category: 'core' },
  { id: 'request_leave', nameKm: 'ស្នើសុំច្បាប់ឈប់សម្រាក', nameEn: 'Submit Leave Requests', category: 'core' },
  { id: 'view_payslips', nameKm: 'ពិនិត្យ & បោះពុម្ពប័ណ្ណបើកប្រាក់ខែ', nameEn: 'View & Print Digital Payslips', category: 'core' },
  { id: 'approve_leaves', nameKm: 'អនុម័តច្បាប់ឈប់សម្រាកបុគ្គលិក', nameEn: 'Approve / Reject Team Leaves', category: 'approvals' },
  { id: 'manage_team_attendance', nameKm: 'គ្រប់គ្រងវត្តមានក្រុមការងារ', nameEn: 'Team Attendance & Rosters', category: 'approvals' },
  { id: 'evaluate_performance', nameKm: 'វាយតម្លៃសមត្ថភាព & KPI', nameEn: 'Performance & KPI Appraisals', category: 'approvals' },
  { id: 'manage_payroll', nameKm: 'គណនា & បើកប្រាក់បៀវត្សរ៍', nameEn: 'Process Payroll & Salary Runs', category: 'finance' },
  { id: 'manage_nssf', nameKm: 'រៀបចំរបាយការណ៍ ប.ស.ស (NSSF)', nameEn: 'Manage NSSF Filings & Compliance', category: 'finance' },
  { id: 'manage_employees', nameKm: 'គ្រប់គ្រងទិន្នន័យបុគ្គលិក & កិច្ចសន្យា', nameEn: 'Employee Master Records & Contracts', category: 'admin' },
  { id: 'manage_users', nameKm: 'គ្រប់គ្រងគណនី & សិទ្ធិ RBAC', nameEn: 'User Accounts & RBAC Permissions', category: 'admin' },
  { id: 'system_settings', nameKm: 'កំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ', nameEn: 'System Configuration & Audits', category: 'admin' },
  { id: 'view_analytics', nameKm: 'របាយការណ៍ & វិភាគទិន្នន័យជាន់ខ្ពស់', nameEn: 'Executive Analytics & BI Reports', category: 'admin' },
];

export default function UserManagementPage() {
  const { currentPersona, language, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee' as UserRole,
    status: 'Active' as UserStatus,
    department_name: '',
    employee_id: '',
    avatar: '',
    two_factor_enabled: false,
    permissions: ['self_service', 'clock_in', 'request_leave', 'view_payslips'],
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch users, employees & departments
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, empsRes, deptsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/employees'),
        fetch('/api/departments'),
      ]);
      const usersData = await usersRes.json();
      const empsData = await empsRes.json();
      const deptsData = await deptsRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(empsData)) setEmployees(empsData);
      if (Array.isArray(deptsData)) setDepartments(deptsData);
    } catch (err) {
      console.error('Failed to load user management data:', err);
      showToast(language === 'km' ? 'បរាជ័យក្នុងការទាញយកទិន្នន័យ' : 'Failed to fetch user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department_name && u.department_name.toLowerCase().includes(q)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'Admin').length;
    const managers = users.filter((u) => u.role === 'Manager').length;
    const regularEmployees = users.filter((u) => u.role === 'Employee').length;
    const with2FA = users.filter((u) => u.two_factor_enabled === 1).length;
    const twoFactorRate = total > 0 ? Math.round((with2FA / total) * 100) : 0;
    return { total, admins, managers, regularEmployees, with2FA, twoFactorRate };
  }, [users]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Employee',
      status: 'Active',
      department_name: departments[0]?.name || '',
      employee_id: '',
      avatar: '',
      two_factor_enabled: false,
      permissions: ['self_service', 'clock_in', 'request_leave', 'view_payslips'],
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    const userPerms = user.permissions ? user.permissions.split(',').map((p) => p.trim()) : [];
    const linkedEmp = employees.find((e) => e.id === user.employee_id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department_name: user.department_name || linkedEmp?.department_name || '',
      employee_id: user.employee_id || '',
      avatar: user.avatar || '',
      two_factor_enabled: user.two_factor_enabled === 1,
      permissions: userPerms,
    });
  };

  // Link with existing employee in Add Modal
  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    // Recommend role based on job title
    let detectedRole: UserRole = 'Employee';
    const title = (emp.role || '').toLowerCase();
    if (title.includes('director') || title.includes('head') || title.includes('manager') || title.includes('vp')) {
      detectedRole = 'Manager';
    }

    setFormData((prev) => ({
      ...prev,
      name: `${emp.first_name} ${emp.last_name}`.trim(),
      email: emp.email,
      department_name: emp.department_name || prev.department_name,
      employee_id: emp.id,
      avatar: emp.avatar || prev.avatar,
      role: detectedRole,
    }));
  };

  // Toggle permission checkbox
  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      const updated = exists
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  // Select all or preset permissions by Role
  const applyPresetForRole = (role: UserRole) => {
    if (role === 'Admin') {
      setFormData((prev) => ({
        ...prev,
        role,
        permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
      }));
    } else if (role === 'Manager') {
      setFormData((prev) => ({
        ...prev,
        role,
        permissions: [
          'self_service',
          'clock_in',
          'request_leave',
          'view_payslips',
          'approve_leaves',
          'manage_team_attendance',
          'evaluate_performance',
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        role,
        permissions: ['self_service', 'clock_in', 'request_leave', 'view_payslips'],
      }));
    }
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast(language === 'km' ? 'សូមបំពេញឈ្មោះ' : 'Please fill in name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: formData.permissions.join(','),
          two_factor_enabled: formData.two_factor_enabled ? 1 : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || (language === 'km' ? 'បរាជ័យក្នុងការបង្កើតគណនី' : 'Failed to create user account'), 'error');
        return;
      }

      showToast(language === 'km' ? 'បានបង្កើតគណនីអ្នកប្រើប្រាស់ថ្មីដោយជោគជ័យ! ✓' : 'User account created successfully! ✓', 'success');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសក្នុងការបង្កើតគណនី' : 'Error creating account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          status: formData.status,
          department_name: formData.department_name,
          permissions: formData.permissions.join(','),
          two_factor_enabled: formData.two_factor_enabled ? 1 : 0,
        }),
      });

      if (!res.ok) {
        showToast(language === 'km' ? 'បរាជ័យក្នុងការកែប្រែគណនី' : 'Failed to update user account', 'error');
        return;
      }

      showToast(language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពគណនីជោគជ័យ! ✓' : 'User account updated successfully! ✓', 'success');
      setEditingUser(null);
      fetchData();
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសប្រព័ន្ធ' : 'System error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPrimaryAdmin = (u: UserAccount | null | undefined) => {
    if (!u) return false;
    const adminCount = users.filter((x) => x.role === 'Admin' && x.status === 'Active').length;
    return u.role === 'Admin' && adminCount <= 1;
  };

  // Toggle user status (Active <-> Suspended)
  const handleToggleStatus = async (user: UserAccount) => {
    if (isPrimaryAdmin(user)) {
      showToast(language === 'km' ? 'មិនអាចផ្អាកគណនីអ្នកគ្រប់គ្រងគោល (Root Admin) បានទេ' : 'Cannot suspend Root Administrator account', 'error');
      return;
    }

    const nextStatus: UserStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showToast(
          nextStatus === 'Active'
            ? (language === 'km' ? `បានបើកដំណើរការគណនី ${user.name} ឡើងវិញ` : `Account ${user.name} reactivated`)
            : (language === 'km' ? `បានផ្អាកដំណើរការគណនី ${user.name}` : `Account ${user.name} suspended`),
          'success'
        );
        fetchData();
      } else {
        showToast(language === 'km' ? 'បរាជ័យក្នុងការប្តូរស្ថានភាព' : 'Failed to update account status', 'error');
      }
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសប្រព័ន្ធ' : 'System error', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (isPrimaryAdmin(deletingUser)) {
      showToast(language === 'km' ? 'មិនអាចលុបគណនីអ្នកគ្រប់គ្រងគោល (Root Admin) បានទេ' : 'Cannot delete Root Administrator account', 'error');
      setDeletingUser(null);
      return;
    }

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(language === 'km' ? `បានលុបគណនី ${deletingUser.name} ចេញពីប្រព័ន្ធ` : `Account ${deletingUser.name} deleted`, 'info');
        setDeletingUser(null);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || (language === 'km' ? 'បរាជ័យក្នុងការលុបគណនី' : 'Failed to delete user'), 'error');
      }
    } catch (err) {
      showToast(language === 'km' ? 'កំហុសក្នុងការលុប' : 'Error deleting account', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-gradient-to-r from-white via-indigo-50/40 to-blue-50/30 rounded-2xl p-6 border border-indigo-100/70 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងសិទ្ធិ & សុវត្ថិភាព' : 'Security & Access Control'}</span>
            </div>
            <h1 className={`text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិចូលដំណើរការ'
                : 'User Accounts & Access Management'}
            </h1>
            <p className={`text-gray-600 text-sm mt-1 max-w-2xl leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? 'កំណត់តួនាទី (Admin, Manager, Employee), កំណត់សិទ្ធិលម្អិត RBAC, តាមដានសុវត្ថិភាព 2FA និងគ្រប់គ្រងការចូលប្រើប្រាស់ប្រព័ន្ធ HESTRA HRM'
                : 'Manage system credentials, configure granular Role-Based Access Control (RBAC), enforce 2FA security policies and govern workforce access.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher Tabs */}
            <div className="bg-white/80 backdrop-blur p-1 rounded-xl border border-gray-200/80 shadow-xs flex items-center">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'បញ្ជីគណនី' : 'User Accounts'}</span>
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'ម៉ាទ្រីសសិទ្ធិ RBAC' : 'RBAC Matrix'}</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'km' ? '+ បង្កើតគណនីថ្មី' : '+ Invite User'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium text-gray-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'គណនីសរុប' : 'Total Accounts'}
            </span>
            <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
          <p className={`text-[11px] text-gray-500 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'គណនីក្នុងប្រព័ន្ធទាំងអស់' : 'All registered system users'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-indigo-100/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium text-indigo-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់' : 'Admin Role'}
            </span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-950 mt-2">{stats.admins}</p>
          <p className={`text-[11px] text-indigo-600/80 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'សិទ្ធិពេញលេញគ្រប់ម៉ូឌុល' : 'Superadmin full access'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-100/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium text-blue-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'គណៈគ្រប់គ្រង' : 'Manager Role'}
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-950 mt-2">{stats.managers}</p>
          <p className={`text-[11px] text-blue-600/80 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'អនុម័ត & ដឹកនាំក្រុម' : 'Team approval scope'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-100/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium text-emerald-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'បុគ្គលិកទូទៅ' : 'Employee Role'}
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-2">{stats.regularEmployees}</p>
          <p className={`text-[11px] text-emerald-600/80 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {language === 'km' ? 'ស្វ័យសេវាបុគ្គលិក ESS' : 'Self-service portal only'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-violet-100/80 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium text-violet-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'សុវត្ថិភាព 2FA' : '2FA Enforced'}
            </span>
            <span className="p-2 rounded-lg bg-violet-50 text-violet-600">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-violet-950 mt-2">{stats.twoFactorRate}%</p>
          <p className={`text-[11px] text-violet-600/80 mt-0.5 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            {stats.with2FA} / {stats.total} {language === 'km' ? 'គណនីបានបើក' : 'active accounts'}
          </p>
        </div>
      </div>

      {activeTab === 'users' ? (
        /* Users Tab Content */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ, អ៊ីមែល, ឬផ្នែក...' : 'Search by name, email, department...'}
                className={`w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Role Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className={`text-gray-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{language === 'km' ? 'តួនាទី:' : 'Role:'}</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'ទាំងអស់ (All)' : 'All Roles'}</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs">
                <span className={`text-gray-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{language === 'km' ? 'ស្ថានភាព:' : 'Status:'}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'ទាំងអស់ (All)' : 'All Status'}</option>
                  <option value="Active">{language === 'km' ? 'សកម្ម (Active)' : 'Active'}</option>
                  <option value="Suspended">{language === 'km' ? 'ផ្អាក (Suspended)' : 'Suspended'}</option>
                </select>
              </div>

              <button
                onClick={fetchData}
                title="Refresh"
                className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  <th className="py-3 px-4">{language === 'km' ? 'អ្នកប្រើប្រាស់ (User & Identity)' : 'User & Identity'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'តួនាទី (Role)' : 'Role'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ផ្នែក / នាយកដ្ឋាន' : 'Department'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'សិទ្ធិចូលប្រើ (Permissions)' : 'Permissions'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'សុវត្ថិភាព 2FA' : '2FA Status'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ចូលចុងក្រោយ' : 'Last Login'}</th>
                  <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className={language === 'km' ? 'font-khmer' : 'font-sans'}>{language === 'km' ? 'កំពុងទាញយកបញ្ជីគណនី...' : 'Loading user accounts...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-gray-300" />
                        <span className={`text-sm text-gray-600 font-medium ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                          {language === 'km' ? 'ពុំមានគណនីត្រូវនឹងលក្ខខណ្ឌស្វែងរក' : 'No user accounts match your search filter'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const permList = u.permissions ? u.permissions.split(',').filter(Boolean) : [];
                    const isRootAdmin = isPrimaryAdmin(u);

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-gray-200">
                                  {u.name ? u.name.trim().charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              {isRootAdmin && (
                                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full ring-2 ring-white" title="Root Admin">
                                  <Shield className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold text-gray-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>{formatLocalizedText(u.name, language)}</span>
                                {isRootAdmin && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                                    Primary Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-[11px] mt-0.5">
                                <span>{u.email}</span>
                                {u.employee_id && (
                                  <span className="bg-gray-100 px-1.5 py-0.2 rounded text-[10px] text-gray-600">
                                    {u.employee_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          {u.role === 'Admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Administrator</span>
                            </span>
                          ) : u.role === 'Manager' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Team Manager</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                              <UserCheck className="w-3 h-3" />
                              <span>Staff Employee</span>
                            </span>
                          )}
                        </td>

                        {/* Department */}
                        <td className={`py-3 px-4 text-gray-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                          {formatLocalizedText(u.department_name || (language === 'km' ? 'ទូទៅ (General)' : 'General'), language)}
                        </td>

                        {/* Permissions */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {permList.slice(0, 2).map((p) => {
                              const match = AVAILABLE_PERMISSIONS.find((opt) => opt.id === p.trim());
                              return (
                                <span
                                  key={p}
                                  className={`px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded-md ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
                                >
                                  {match ? (language === 'km' ? match.nameKm.split('(')[0] : match.nameEn.split('(')[0]) : p}
                                </span>
                              );
                            })}
                            {permList.length > 2 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                                +{permList.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2FA */}
                        <td className="py-3 px-4">
                          {u.two_factor_enabled === 1 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              <span>2FA Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              <Unlock className="w-3 h-3" />
                              <span>Disabled</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {u.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className={language === 'km' ? 'font-khmer' : 'font-sans'}>{language === 'km' ? 'សកម្ម' : 'Active'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className={language === 'km' ? 'font-khmer' : 'font-sans'}>{language === 'km' ? 'បានផ្អាក' : 'Suspended'}</span>
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {u.last_login || 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title={language === 'km' ? 'កែប្រែសិទ្ធិ & ព័ត៌មាន' : 'Edit Role & Permissions'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isRootAdmin}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isRootAdmin
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : u.status === 'Active'
                                  ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={
                                isRootAdmin
                                  ? 'Protected'
                                  : u.status === 'Active'
                                  ? 'Suspend Account'
                                  : 'Activate Account'
                              }
                            >
                              {u.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => setDeletingUser(u)}
                              disabled={isRootAdmin}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isRootAdmin
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isRootAdmin ? 'Root Admin Protected' : 'Delete Account'}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      ) : (
        /* RBAC Permission Matrix Tab Content */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h2 className={`text-lg font-bold text-gray-900 flex items-center gap-2 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'km' ? 'ម៉ាទ្រីសសិទ្ធិចូលដំណើរការប្រព័ន្ធ (Role-Based Access Control Matrix)' : 'Role-Based Access Control (RBAC) Matrix'}</span>
                </h2>
                <p className={`text-xs text-gray-500 mt-1 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km'
                    ? 'តារាងប្រៀបធៀបសិទ្ធិជាក់ស្តែងរវាង Admin, Manager, និង Employee តាមលក្ខខណ្ឌច្បាប់ការងារ & គោលការណ៍រក្សាការសម្ងាត់ទិន្នន័យ'
                    : 'System permission levels mapped against roles to ensure strict data confidentiality and MLVT labor compliance.'}
                </p>
              </div>

              <div className={`flex items-center gap-4 text-xs ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-700">{language === 'km' ? 'សិទ្ធិពេញលេញ' : 'Full Access'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{language === 'km' ? 'សម្រាប់ក្រុមការងារ (Team Scope)' : 'Team Scope'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-700">{language === 'km' ? 'ផ្ទាល់ខ្លួន (Self Only)' : 'Self Only'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-400">{language === 'km' ? 'គ្មានសិទ្ធិ' : 'No Access'}</span>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto mt-4">
              <table className={`w-full text-left border-collapse text-xs ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    <th className="py-3 px-4 font-semibold text-gray-700 w-2/5">
                      {language === 'km' ? 'ម៉ូឌុល / សមត្ថភាពប្រព័ន្ធ (Module & Capability)' : 'Module & Capability'}
                    </th>
                    <th className="py-3 px-4 font-semibold text-indigo-700 text-center w-1/5">
                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Administrator</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold text-blue-700 text-center w-1/5">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Line Manager</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold text-emerald-700 text-center w-1/5">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5" />
                        <span>Employee (Staff)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Row 1 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ & សិទ្ធិ RBAC' : 'User Accounts & RBAC Configuration'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'បង្កើត, កែប្រែសិទ្ធិ, ផ្អាក និងលុបគណនីក្នុងប្រព័ន្ធ' : 'Create, edit roles, toggle permissions and suspend logins'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Admin</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle className="w-4 h-4 text-gray-300" />
                        <span className="text-[11px]">Blocked</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle className="w-4 h-4 text-gray-300" />
                        <span className="text-[11px]">Blocked</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'គ្រប់គ្រងបញ្ជីបុគ្គលិក & កិច្ចសន្យាការងារ' : 'Employee Master Records & Contracts'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'បន្ថែមបុគ្គលិកថ្មី, កំណត់ប្រាក់ខែគោល, កិច្ចសន្យា UDC/FDC' : 'Add employees, base salary records, and employment contracts'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Access</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'មើលក្រុមខ្លួន (Team Only)' : 'Team Only'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold text-[11px]">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'មើលតែខ្លួនឯង (Self Profile)' : 'Self Profile'}</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'អនុម័តច្បាប់ឈប់សម្រាក (Leave Approval Hub)' : 'Leave Approval Hub & Coverage'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'ពិនិត្យ និងចុចអនុម័ត ឬបដិសេធសំណើសុំច្បាប់របស់បុគ្គលិក' : 'Review and 1-click Approve/Reject leave requests with comments'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Depts</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'អនុម័តកូនក្រុម (Direct Reports)' : 'Direct Reports'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold text-[11px]">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ស្នើសុំផ្ទាល់ខ្លួន (Submit Only)' : 'Submit Only'}</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'ដំណើរការបើកប្រាក់ខែ & ប.ស.ស (Payroll & NSSF)' : 'Payroll Runs & NSSF e-Filing'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'គណនាប្រាក់បៀវត្សរ៍, ពន្ធកាត់ទុក, ប.ស.ស និងចេញប័ណ្ណបើកប្រាក់ខែ' : 'Calculate gross-to-net, tax withholding, NSSF pension & health'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Admin</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle className="w-4 h-4 text-gray-300" />
                        <span className="text-[11px]">Restricted</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold text-[11px]">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ប័ណ្ណប្រាក់ខែខ្លួនឯង (My Payslip)' : 'My Payslip'}</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 5 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'វាយតម្លៃសមត្ថភាពការងារ KPI & ការឡើងឋានៈ' : 'Performance Appraisals & KPIs'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'វាយតម្លៃសមិទ្ធផលការងារប្រចាំត្រីមាស និងការដំឡើងប្រាក់ខែ' : 'Quarterly performance scoring, competencies and salary reviews'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Manage All</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'វាយតម្លៃកូនក្រុម (Team Appraisals)' : 'Team Appraisals'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold text-[11px]">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ស្វ័យវាយតម្លៃ (Self-Review)' : 'Self-Review'}</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 6 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'ផតថលស្វ័យសេវាបុគ្គលិក ESS (Digital ID & Clock)' : 'Staff Self-Service Portal (ESS)'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'កាតសម្គាល់បុគ្គលិកឌីជីថល, កត់ត្រាវត្តមានចូល/ចេញ, ពិនិត្យសល់ច្បាប់' : 'Digital QR employee ID, time punching, personal balances & payslips'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Available</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Available</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Primary Portal</span>
                      </span>
                    </td>
                  </tr>

                  {/* Row 7 */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {language === 'km' ? 'ការកំណត់ប្រព័ន្ធ & កំណត់ហេតុសុវត្ថិភាព' : 'System Settings & Audit Log'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {language === 'km' ? 'ការកំណត់គោលការណ៍ច្បាប់, ការតភ្ជាប់ម៉ាស៊ីនស្កេនម្រាមដៃ, ការបម្រុងទុក' : 'Labor law rules, biometric integration, and security audit logs'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Admin</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle className="w-4 h-4 text-gray-300" />
                        <span className="text-[11px]">Blocked</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <XCircle className="w-4 h-4 text-gray-300" />
                        <span className="text-[11px]">Blocked</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tip Pod */}
            <div className="mt-6 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className={`text-xs text-indigo-900 leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                <span className="font-bold">{language === 'km' ? 'ចំណាំស្តីពីការបែងចែកសិទ្ធិ:' : 'Access Governance Note:'} </span>
                {language === 'km'
                  ? 'គណនី Administrator អាចចូលដំណើរការម៉ូឌុលទាំងអស់រួមទាំងការកែសម្រួលគណនី។ គណនី Manager ត្រូវបានកំណត់ឱ្យមើលឃើញ និងអនុម័តតែបុគ្គលិកចំណុះផ្ទាល់ខ្លួន ដើម្បីគោរពតាមឯកជនភាព និងច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។'
                  : 'Administrators maintain global access across all enterprise workflows. Line Managers operate under a scoped team visibility domain, strictly restricted to their direct reports to guarantee workforce confidentiality and Cambodia labor law compliance.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-bold text-gray-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី' : 'Create / Invite System User'}
                  </h3>
                  <p className={`text-[11px] text-gray-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? 'ភ្ជាប់ជាមួយបុគ្គលិកមានស្រាប់ ឬបង្កើតគណនីឯករាជ្យ' : 'Link with an existing employee profile or invite custom user'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className={`overflow-y-auto p-6 space-y-4 text-xs ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {/* Quick Link from Existing Employee */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/70">
                <label className="block text-xs font-bold text-indigo-900 mb-1">
                  {language === 'km' ? 'ភ្ជាប់ជាមួយបុគ្គលិកមានស្រាប់ (Quick Link from Employee)' : 'Quick Link from Employee Profile'}
                </label>
                <select
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  defaultValue=""
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" disabled>
                    {language === 'km' ? '-- ជ្រើសរើសបុគ្គលិកដើម្បីបំពេញព័ត៌មានស្វ័យប្រវត្តិ --' : '-- Select employee to autofill credentials --'}
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {formatLocalizedText(`${emp.first_name} ${emp.last_name}`, language)} ({emp.id}) - {formatLocalizedText(emp.role, language)} [{formatLocalizedText(emp.department_name, language)}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះពេញ (Full Name) *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === 'km' ? 'e.g. សារ៉ាត់ (Sarath)' : 'e.g. Sarath'}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'អ៊ីមែលចូលប្រព័ន្ធ (Email)' : 'Work Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@outlook.com (Optional)"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Department & Role Preset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{language === 'km' ? 'ផ្នែក / នាយកដ្ឋាន' : 'Department'}</span>
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  </label>
                  <select
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{language === 'km' ? '-- ជ្រើសរើសនាយកដ្ឋាន --' : '-- Select Department --'}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {formatLocalizedText(dept.name, language)}
                      </option>
                    ))}
                    {formData.department_name && !departments.some((d) => d.name === formData.department_name) && (
                      <option value={formData.department_name}>
                        {formatLocalizedText(formData.department_name, language)}
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'តួនាទី (Role & Preset)' : 'System Role Preset'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Employee', 'Manager', 'Admin'] as UserRole[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => applyPresetForRole(r)}
                        className={`py-2 px-1 text-center font-bold rounded-lg border transition-all ${
                          formData.role === r
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2FA Toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${formData.two_factor_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {language === 'km' ? 'តម្រូវឱ្យបើកសុវត្ថិភាព 2FA (Two-Factor Authentication)' : 'Enforce 2FA Security'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {language === 'km' ? 'ការពារគណនីដោយផ្ទៀងផ្ទាត់លេខកូដ OTP ពេលចូលប្រើ' : 'Requires multi-factor authentication upon login'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.two_factor_enabled}
                  onChange={(e) => setFormData({ ...formData, two_factor_enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Granular Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-gray-900">
                    {language === 'km' ? 'សិទ្ធិលម្អិត (Granular Permissions)' : 'Granular Permissions'}
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    {formData.permissions.length} / {AVAILABLE_PERMISSIONS.length} {language === 'km' ? 'បានជ្រើសរើស' : 'selected'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50/70 border border-gray-200 rounded-xl">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white border-indigo-200 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(perm.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`text-xs ${checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {language === 'km' ? perm.nameKm : perm.nameEn}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">
                          {perm.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'km' ? 'បង្កើតគណនី' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-white">
              <div className="flex items-center gap-2.5">
                {editingUser.avatar ? (
                  <img
                    src={editingUser.avatar}
                    alt={editingUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-gray-200">
                    {editingUser.name ? editingUser.name.trim().charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h3 className={`text-base font-bold text-gray-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    {language === 'km' ? `កែប្រែគណនី: ${editingUser.name}` : `Edit User: ${formatLocalizedText(editingUser.name, language)}`}
                  </h3>
                  <p className={`text-[11px] text-gray-500 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                    ID: {editingUser.id} &bull; {editingUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateUser} className={`overflow-y-auto p-6 space-y-4 text-xs ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {/* Name & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះបង្ហាញ (Display Name)' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{language === 'km' ? 'ផ្នែក / នាយកដ្ឋាន' : 'Department'}</span>
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  </label>
                  <select
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{language === 'km' ? '-- ជ្រើសរើសនាយកដ្ឋាន --' : '-- Select Department --'}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {formatLocalizedText(dept.name, language)}
                      </option>
                    ))}
                    {formData.department_name && !departments.some((d) => d.name === formData.department_name) && (
                      <option value={formData.department_name}>
                        {formatLocalizedText(formData.department_name, language)}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'តួនាទី (Role)' : 'Role'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Employee', 'Manager', 'Admin'] as UserRole[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => applyPresetForRole(r)}
                        className={`py-2 px-1 text-center font-bold rounded-lg border transition-all ${
                          formData.role === r
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {language === 'km' ? 'ស្ថានភាពគណនី (Status)' : 'Account Status'}
                  </label>
                  <select
                    value={formData.status}
                    disabled={isPrimaryAdmin(editingUser)}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Active">{language === 'km' ? 'សកម្ម (Active)' : 'Active'}</option>
                    <option value="Suspended">{language === 'km' ? 'បានផ្អាក (Suspended)' : 'Suspended'}</option>
                  </select>
                </div>
              </div>

              {/* 2FA Toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${formData.two_factor_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {language === 'km' ? 'សុវត្ថិភាព 2FA (Two-Factor Authentication)' : 'Enforce 2FA Security'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {formData.two_factor_enabled
                        ? (language === 'km' ? 'បើកដំណើរការ (Active)' : 'Active')
                        : (language === 'km' ? 'បិទដំណើរការ (Disabled)' : 'Disabled')}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.two_factor_enabled}
                  onChange={(e) => setFormData({ ...formData, two_factor_enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Granular Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-gray-900">
                    {language === 'km' ? 'សិទ្ធិលម្អិត (Granular Permissions)' : 'Granular Permissions'}
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    {formData.permissions.length} / {AVAILABLE_PERMISSIONS.length} {language === 'km' ? 'បានជ្រើសរើស' : 'selected'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50/70 border border-gray-200 rounded-xl">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                          checked
                            ? 'bg-white border-indigo-200 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(perm.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`text-xs ${checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {language === 'km' ? perm.nameKm : perm.nameEn}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">
                          {perm.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold text-gray-900 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km' ? 'បញ្ជាក់ការលុបគណនីអ្នកប្រើប្រាស់?' : 'Confirm Delete User?'}
            </h3>
            <p className={`text-xs text-gray-500 mt-2 leading-relaxed ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
              {language === 'km'
                ? `តើអ្នកប្រាកដជាចង់លុបគណនី "${deletingUser.name}" (${deletingUser.email}) ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។`
                : `Are you sure you want to permanently delete user account "${formatLocalizedText(deletingUser.name, language)}" (${deletingUser.email})? This action cannot be reversed.`}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className={`px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-xs cursor-pointer ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
              >
                {language === 'km' ? 'ទេ, បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteUser}
                className={`px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors text-xs cursor-pointer ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
              >
                {language === 'km' ? 'បាទ/ចាស, លុបគណនី' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
