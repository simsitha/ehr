'use client';

import React, { useState, useMemo } from 'react';
import {
  M365Account,
  M365Overview,
  M365LicensePlan,
  M365AccountStatus,
  M365MFAStatus,
  Employee,
} from '@/lib/types';
import { formatDateDMY } from '@/lib/translations';
import {
  Cloud,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Download,
  Copy,
  Check,
  UserCheck,
  RotateCcw,
  Edit,
  Trash2,
  FileText,
  Printer as PrintIcon,
  X,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Server,
  Key,
} from 'lucide-react';

interface M365InventorySectionProps {
  accounts: M365Account[];
  overview: M365Overview | null;
  employees: Employee[];
  isAdminOrManager: boolean;
  language: string;
  currentPersona: any;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ALL_PLANS: M365LicensePlan[] = [
  'Microsoft 365 Business Standard',
  'Microsoft 365 Business Basic',
  'Microsoft 365 Business Premium',
  'Microsoft 365 Apps for enterprise',
  'Office 365 E3',
  'Office 365 E5',
  'Exchange Online Plan 1',
];

const PLAN_DETAILS: Record<
  M365LicensePlan,
  {
    defaultPrice: number;
    badgeColor: string;
    apps: string[];
    description: string;
    defaultMailbox: number;
    defaultOneDrive: number;
  }
> = {
  'Microsoft 365 Business Standard': {
    defaultPrice: 12.5,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    apps: ['Desktop Office', 'Outlook', 'Teams', 'OneDrive', 'SharePoint'],
    description: 'Desktop Office apps + 50GB Business Mailbox + 1TB Cloud Storage + Teams',
    defaultMailbox: 50,
    defaultOneDrive: 1024,
  },
  'Microsoft 365 Business Basic': {
    defaultPrice: 6.0,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    apps: ['Web/Mobile Apps', 'Exchange', 'Teams', 'OneDrive'],
    description: 'Web & Mobile Office apps + 50GB Mailbox + 1TB OneDrive + Teams',
    defaultMailbox: 50,
    defaultOneDrive: 1024,
  },
  'Microsoft 365 Business Premium': {
    defaultPrice: 22.0,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    apps: ['Desktop Apps', 'Defender', 'Intune MDM', 'Teams', 'Entra ID P1'],
    description: 'Standard Apps + Advanced Cybersecurity Threat Protection + Intune MDM',
    defaultMailbox: 50,
    defaultOneDrive: 1024,
  },
  'Microsoft 365 Apps for enterprise': {
    defaultPrice: 8.25,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    apps: ['Word', 'Excel', 'PowerPoint', 'Access', 'OneDrive 1TB'],
    description: 'Full Desktop Office suite installation for up to 5 PCs/Macs per user',
    defaultMailbox: 0,
    defaultOneDrive: 1024,
  },
  'Office 365 E3': {
    defaultPrice: 23.0,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    apps: ['Enterprise Apps', '100GB Mailbox', 'Unlimited Archive', 'eDiscovery', 'DLP'],
    description: 'Enterprise productivity with legal hold, eDiscovery, and unlimited archiving',
    defaultMailbox: 100,
    defaultOneDrive: 1024,
  },
  'Office 365 E5': {
    defaultPrice: 38.0,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    apps: ['E5 Suite', 'Power BI Pro', 'Teams Phone', 'Advanced Threat Analytics'],
    description: 'Top-tier enterprise productivity + Power BI Pro + Advanced Threat Analytics',
    defaultMailbox: 100,
    defaultOneDrive: 1024,
  },
  'Exchange Online Plan 1': {
    defaultPrice: 4.0,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    apps: ['Outlook Web', '50GB Mailbox', 'Anti-Spam/Malware'],
    description: 'Business-class email hosting (50 GB per mailbox) + custom domain support',
    defaultMailbox: 50,
    defaultOneDrive: 0,
  },
};

export default function M365InventorySection({
  accounts,
  overview,
  employees,
  isAdminOrManager,
  language,
  currentPersona,
  onRefresh,
  showToast,
}: M365InventorySectionProps) {
  // Filters
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mfaFilter, setMfaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<M365Account | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedForAssign, setSelectedForAssign] = useState<M365Account | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedForSlip, setSelectedForSlip] = useState<M365Account | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    email: string;
    display_name: string;
    license_plan: M365LicensePlan;
    status: M365AccountStatus;
    assigned_to: string;
    mfa_status: M365MFAStatus;
    mailbox_usage_gb: string;
    mailbox_quota_gb: string;
    onedrive_usage_gb: string;
    onedrive_quota_gb: string;
    monthly_cost: string;
    renewal_date: string;
    admin_notes: string;
  }>({
    email: '',
    display_name: '',
    license_plan: 'Microsoft 365 Business Standard',
    status: 'Active',
    assigned_to: '',
    mfa_status: 'Enforced',
    mailbox_usage_gb: '0',
    mailbox_quota_gb: '50',
    onedrive_usage_gb: '0',
    onedrive_quota_gb: '1024',
    monthly_cost: '12.50',
    renewal_date: '',
    admin_notes: '',
  });

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (planFilter !== 'all' && acc.license_plan !== planFilter) {
        return false;
      }
      if (statusFilter !== 'all' && acc.status !== statusFilter) {
        return false;
      }
      if (mfaFilter !== 'all' && acc.mfa_status !== mfaFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emailMatch = acc.email.toLowerCase().includes(q);
        const nameMatch = acc.display_name.toLowerCase().includes(q);
        const planMatch = acc.license_plan.toLowerCase().includes(q);
        const empMatch = (acc.assigned_employee_name || '').toLowerCase().includes(q);
        const khmerMatch = (acc.assigned_khmer_name || '').toLowerCase().includes(q);
        const deptMatch = (acc.assigned_department || '').toLowerCase().includes(q);
        const notesMatch = (acc.admin_notes || '').toLowerCase().includes(q);
        if (!emailMatch && !nameMatch && !planMatch && !empMatch && !khmerMatch && !deptMatch && !notesMatch) {
          return false;
        }
      }
      return true;
    });
  }, [accounts, planFilter, statusFilter, mfaFilter, searchQuery]);

  // Copy Email to clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(`Copied ${email} to clipboard`, 'info');
    setTimeout(() => {
      setCopiedEmail(null);
    }, 2000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      email: '',
      display_name: '',
      license_plan: 'Microsoft 365 Business Standard',
      status: 'Active',
      assigned_to: '',
      mfa_status: 'Enforced',
      mailbox_usage_gb: '0',
      mailbox_quota_gb: '50',
      onedrive_usage_gb: '0',
      onedrive_quota_gb: '1024',
      monthly_cost: '12.50',
      renewal_date: `${new Date().getFullYear() + 1}-12-31`,
      admin_notes: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc: M365Account) => {
    setEditingAccount(acc);
    setFormData({
      email: acc.email,
      display_name: acc.display_name,
      license_plan: acc.license_plan,
      status: acc.status,
      assigned_to: acc.assigned_to || '',
      mfa_status: acc.mfa_status,
      mailbox_usage_gb: String(acc.mailbox_usage_gb || 0),
      mailbox_quota_gb: String(acc.mailbox_quota_gb || 50),
      onedrive_usage_gb: String(acc.onedrive_usage_gb || 0),
      onedrive_quota_gb: String(acc.onedrive_quota_gb || 1024),
      monthly_cost: String(acc.monthly_cost || 12.5),
      renewal_date: acc.renewal_date || '',
      admin_notes: acc.admin_notes || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle plan change to auto-update suggested pricing and quotas
  const handlePlanChange = (plan: M365LicensePlan) => {
    const details = PLAN_DETAILS[plan];
    setFormData((prev) => ({
      ...prev,
      license_plan: plan,
      monthly_cost: String(details.defaultPrice),
      mailbox_quota_gb: String(details.defaultMailbox),
      onedrive_quota_gb: String(details.defaultOneDrive),
    }));
  };

  // Save Account (Create or Update)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.license_plan) {
      showToast('Email and License Plan are required', 'error');
      return;
    }

    try {
      if (editingAccount) {
        // Update
        const res = await fetch('/api/inventory/m365', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAccount.id,
            email: formData.email.trim().toLowerCase(),
            display_name: formData.display_name.trim() || formData.email.split('@')[0],
            license_plan: formData.license_plan,
            status: formData.status,
            assigned_to: formData.assigned_to || null,
            mfa_status: formData.mfa_status,
            mailbox_usage_gb: Number(formData.mailbox_usage_gb) || 0,
            mailbox_quota_gb: Number(formData.mailbox_quota_gb) || 50,
            onedrive_usage_gb: Number(formData.onedrive_usage_gb) || 0,
            onedrive_quota_gb: Number(formData.onedrive_quota_gb) || 1024,
            monthly_cost: Number(formData.monthly_cost) || 0,
            renewal_date: formData.renewal_date || null,
            admin_notes: formData.admin_notes.trim() || null,
            performed_by: currentPersona.name,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update M365 account');
        }
        showToast('Microsoft 365 account updated successfully', 'success');
      } else {
        // Create
        const res = await fetch('/api/inventory/m365', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            display_name: formData.display_name.trim() || formData.email.split('@')[0],
            license_plan: formData.license_plan,
            status: formData.status,
            assigned_to: formData.assigned_to || null,
            mfa_status: formData.mfa_status,
            mailbox_usage_gb: Number(formData.mailbox_usage_gb) || 0,
            mailbox_quota_gb: Number(formData.mailbox_quota_gb) || 50,
            onedrive_usage_gb: Number(formData.onedrive_usage_gb) || 0,
            onedrive_quota_gb: Number(formData.onedrive_quota_gb) || 1024,
            monthly_cost: Number(formData.monthly_cost) || 0,
            renewal_date: formData.renewal_date || null,
            admin_notes: formData.admin_notes.trim() || null,
            performed_by: currentPersona.name,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create M365 account');
        }
        showToast('Microsoft 365 account registered successfully', 'success');
      }

      setIsAddEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Open Quick Assign Modal
  const handleOpenAssignModal = (acc: M365Account) => {
    setSelectedForAssign(acc);
    setAssigneeId(acc.assigned_to || '');
    setAssignNotes('');
    setIsAssignModalOpen(true);
  };

  // Confirm Assignment
  const handleConfirmAssignment = async () => {
    if (!selectedForAssign || !assigneeId) return;
    try {
      setSubmittingAssign(true);
      const res = await fetch('/api/inventory/m365/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedForAssign.id,
          employee_id: assigneeId,
          performed_by: currentPersona.name,
          notes: assignNotes || `Assigned M365 license to employee`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign M365 account');
      }

      showToast(`Assigned ${selectedForAssign.email} successfully`, 'success');
      setIsAssignModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign account', 'error');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Return to Pool / Revoke License
  const handleReturnToPool = async (acc: M365Account) => {
    const empName = acc.assigned_employee_name || 'current staff';
    if (!window.confirm(`Revoke M365 license from ${empName} and return ${acc.email} to the unassigned license pool?`)) {
      return;
    }

    try {
      const res = await fetch('/api/inventory/m365/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: acc.id,
          employee_id: null,
          performed_by: currentPersona.name,
          notes: `License released from ${empName} back to company pool.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to revoke license');
      }

      showToast(`Returned ${acc.email} to license pool`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (acc: M365Account) => {
    if (!window.confirm(`Are you sure you want to completely delete M365 account "${acc.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory/m365?id=${encodeURIComponent(acc.id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete account');
      }

      showToast(`M365 account ${acc.email} deleted successfully`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account', 'error');
    }
  };

  // Open Handover Slip Modal
  const handleOpenSlip = (acc: M365Account) => {
    setSelectedForSlip(acc);
    setIsSlipModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (accounts.length === 0) {
      showToast('No Microsoft 365 accounts to export', 'error');
      return;
    }

    const headers = [
      'Email (UPN)',
      'Display Name',
      'License Plan',
      'Status',
      'Assigned Employee ID',
      'Assigned Employee Name',
      'Khmer Name',
      'Department',
      'Role',
      'MFA Status',
      'Mailbox Usage (GB)',
      'Mailbox Quota (GB)',
      'OneDrive Usage (GB)',
      'OneDrive Quota (GB)',
      'Monthly Cost (USD)',
      'Annual Cost (USD)',
      'Renewal Date',
      'Admin Notes',
    ];

    const rows = accounts.map((acc) => [
      `"${acc.email}"`,
      `"${acc.display_name}"`,
      `"${acc.license_plan}"`,
      `"${acc.status}"`,
      `"${acc.assigned_to || ''}"`,
      `"${acc.assigned_employee_name || 'Unassigned Pool'}"`,
      `"${acc.assigned_khmer_name || ''}"`,
      `"${acc.assigned_department || ''}"`,
      `"${acc.assigned_role || ''}"`,
      `"${acc.mfa_status}"`,
      `"${acc.mailbox_usage_gb}"`,
      `"${acc.mailbox_quota_gb}"`,
      `"${acc.onedrive_usage_gb}"`,
      `"${acc.onedrive_quota_gb}"`,
      `"${acc.monthly_cost}"`,
      `"${(acc.monthly_cost * 12).toFixed(2)}"`,
      `"${acc.renewal_date || ''}"`,
      `"${(acc.admin_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `HESTRA_Microsoft_365_Licenses_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Microsoft 365 license audit exported successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Cloud Tenant Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {language === 'km' ? 'គណនី Microsoft 365 & អាជ្ញាប័ណ្ណ Cloud' : 'Microsoft 365 Cloud Enterprise Directory'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Enterprise Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Tenant: <strong className="text-slate-700 font-mono font-medium">hestra-garment.onmicrosoft.com</strong></span>
                <span>•</span>
                <span>Domain: <strong className="text-slate-700 font-mono font-medium">@hestra-garment.com</strong></span>
                <span>•</span>
                <span className="text-slate-400">Region: Southeast Asia (Singapore Azure Cloud)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export M365 Audit (CSV)
            </button>
            {isAdminOrManager && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add M365 Account
              </button>
            )}
          </div>
        </div>

        {/* 5 KPIs inside Tenant Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Total M365 Licenses
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-900">
              {overview?.totalLicenses ?? accounts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Provisioned cloud seats</div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Assigned Staff
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600">
              {overview?.assignedCount ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Active user mailboxes</div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Available Pool
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {overview?.availableCount ?? 0}
            </div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">Ready for new hires</div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Monthly Cloud Cost
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">
              ${Number(overview?.totalMonthlySpend || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ${Number(overview?.totalAnnualSpend || 0).toLocaleString()} / yr run-rate
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 col-span-2 sm:col-span-1">
            <div className="text-xs font-medium text-slate-500">
              MFA Security Health
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              {overview?.mfaEnforcedRate ?? 0}%
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">
              {overview?.mfaEnforcedCount ?? 0} accounts enforced
            </div>
          </div>
        </div>
      </div>

      {/* Plan Breakdown Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">Plan Filters:</span>
        <button
          onClick={() => setPlanFilter('all')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap border ${
            planFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Plans ({accounts.length})
        </button>
        {ALL_PLANS.map((plan) => {
          const breakdown = overview?.planBreakdown?.[plan];
          const count = breakdown ? breakdown.total : accounts.filter((a) => a.license_plan === plan).length;
          if (count === 0 && planFilter !== plan) return null;
          const isSelected = planFilter === plan;
          return (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{plan.replace('Microsoft 365 ', 'M365 ')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'km'
                ? 'ស្វែងរកអ៊ីមែល, ឈ្មោះ, គម្រោង, បុគ្គលិក...'
                : 'Search UPN Email, Name, Plan, Staff...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព (All Statuses)' : 'All Statuses'}</option>
            <option value="Active">{language === 'km' ? 'កំពុងប្រើប្រាស់ (Active)' : 'Active'}</option>
            <option value="Available">{language === 'km' ? 'ក្នុងឃ្លាំង (Available Pool)' : 'Available Pool'}</option>
            <option value="Suspended">{language === 'km' ? 'ផ្អាកបណ្តោះអាសន្ន (Suspended)' : 'Suspended'}</option>
          </select>

          <select
            value={mfaFilter}
            onChange={(e) => setMfaFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព MFA (All MFA Status)' : 'All MFA Status'}</option>
            <option value="Enforced">{language === 'km' ? 'តម្រូវជាកាតព្វកិច្ច (Enforced)' : 'Enforced'}</option>
            <option value="Enabled">{language === 'km' ? 'បានបើកដំណើរការ (Enabled)' : 'Enabled'}</option>
            <option value="Disabled">{language === 'km' ? 'មិនទាន់បើក (Disabled)' : 'Disabled'}</option>
          </select>

          {(planFilter !== 'all' || statusFilter !== 'all' || mfaFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setPlanFilter('all');
                setStatusFilter('all');
                setMfaFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* M365 Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Account (UPN) & User</th>
                <th className="px-6 py-3.5">Assigned Employee</th>
                <th className="px-6 py-3.5">License Plan & Apps</th>
                <th className="px-6 py-3.5">MFA Security</th>
                <th className="px-6 py-3.5">Storage Quota</th>
                <th className="px-6 py-3.5">Cost & Renewal</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Cloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No Microsoft 365 accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your plan, status, or search query filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const details = PLAN_DETAILS[acc.license_plan] || PLAN_DETAILS['Microsoft 365 Business Standard'];
                  const mailboxUsed = Number(acc.mailbox_usage_gb) || 0;
                  const mailboxQuota = Number(acc.mailbox_quota_gb) || 50;
                  const mailboxPercent = mailboxQuota > 0 ? Math.min(100, Math.round((mailboxUsed / mailboxQuota) * 100)) : 0;
                  const isAssigned = !!acc.assigned_to;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Account UPN & Display Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {acc.email}
                              </span>
                              <button
                                onClick={() => handleCopyEmail(acc.email)}
                                title="Copy email address"
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              >
                                {copiedEmail === acc.email ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-xs font-semibold text-slate-700 mt-0.5">
                              {acc.display_name}
                            </div>
                            {acc.admin_notes && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-xs truncate" title={acc.admin_notes}>
                                {acc.admin_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Employee */}
                      <td className="px-6 py-4">
                        {isAssigned ? (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {acc.assigned_employee_name?.charAt(0) || 'E'}
                              </span>
                              <span>
                                {acc.assigned_employee_name}
                                {acc.assigned_khmer_name && (
                                  <span className="text-slate-500 font-normal ml-1">
                                    ({acc.assigned_khmer_name})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {acc.assigned_role || 'Staff'} • {acc.assigned_department || 'Garment Factory'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Emp ID: <span className="font-mono">{acc.assigned_to}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Layers className="w-3 h-3" />
                              Available Pool
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">Ready to assign</div>
                          </div>
                        )}
                      </td>

                      {/* License Plan & Apps */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${details.badgeColor}`}>
                          {acc.license_plan}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {details.apps.slice(0, 4).map((app) => (
                            <span
                              key={app}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200"
                            >
                              {app}
                            </span>
                          ))}
                          {details.apps.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{details.apps.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* MFA Security Status */}
                      <td className="px-6 py-4">
                        {acc.mfa_status === 'Enforced' ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>MFA Enforced</span>
                          </div>
                        ) : acc.mfa_status === 'Enabled' ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 w-fit">
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>MFA Enabled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-fit">
                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>MFA Disabled</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          {acc.status === 'Active' ? 'Active sign-in' : acc.status}
                        </div>
                      </td>

                      {/* Storage Quota */}
                      <td className="px-6 py-4">
                        <div className="w-36">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                            <span>Mailbox</span>
                            <span className="font-mono">{mailboxUsed} / {mailboxQuota} GB</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                mailboxPercent > 85 ? 'bg-rose-500' : mailboxPercent > 60 ? 'bg-amber-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${mailboxPercent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>OneDrive:</span>
                            <span className="font-mono">{acc.onedrive_usage_gb || 0} GB</span>
                          </div>
                        </div>
                      </td>

                      {/* Cost & Renewal */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          ${Number(acc.monthly_cost).toFixed(2)} <span className="text-[10px] font-normal text-slate-500">/ mo</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Renews: {acc.renewal_date || 'Annual Auto-Renew'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Printable Handover Slip */}
                          {isAssigned && (
                            <button
                              onClick={() => handleOpenSlip(acc)}
                              title={language === 'km' ? 'Print Account Issue Slip / ប័ណ្ណប្រគល់គណនី' : 'Print Account Issue Slip'}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Assign to Staff */}
                          {isAdminOrManager && !isAssigned && (
                            <button
                              onClick={() => handleOpenAssignModal(acc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Assign
                            </button>
                          )}

                          {/* Revoke / Return to Pool */}
                          {isAdminOrManager && isAssigned && (
                            <button
                              onClick={() => handleReturnToPool(acc)}
                              title="Revoke license back to pool"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Revoke
                            </button>
                          )}

                          {/* Edit */}
                          {isAdminOrManager && (
                            <button
                              onClick={() => handleOpenEditModal(acc)}
                              title="Edit M365 Account"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isAdminOrManager && (
                            <button
                              onClick={() => handleDeleteAccount(acc)}
                              title="Delete M365 Account"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT M365 MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingAccount ? `Edit M365 Account: ${editingAccount.email}` : 'Add Microsoft 365 Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email (UPN) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    User Principal Name (UPN / Work Email) *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. firstname.lastname@hestra-garment.com"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Primary Microsoft 365 identity used for sign-in, Outlook, Teams, and Office suite.
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Display Name (ឈ្មោះបង្ហាញ) *' : 'Display Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g. Sitha Sim"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* License Plan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'License Plan (ប្រភេទអាជ្ញាប័ណ្ណ) *' : 'License Plan *'}
                  </label>
                  <select
                    value={formData.license_plan}
                    onChange={(e) => handlePlanChange(e.target.value as M365LicensePlan)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan} (${PLAN_DETAILS[plan].defaultPrice}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Employee */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Assign To Employee (បុគ្គលិកទទួលប្រើប្រាស់)' : 'Assign To Employee'}
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assigned_to: e.target.value,
                        status: e.target.value ? 'Active' : 'Available',
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'km' ? '-- គ្មាន (រក្សាទុកក្នុងឃ្លាំង) --' : '-- None (Keep in Available License Pool) --'}</option>
                    {employees
                      .filter((e) => e.status !== 'Terminated')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}{language === 'km' && emp.khmer_name ? ` (${emp.khmer_name})` : ''} - {emp.role} (
                          {emp.department_name || 'Garment Staff'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* MFA Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Multi-Factor Authentication (MFA)
                  </label>
                  <select
                    value={formData.mfa_status}
                    onChange={(e) => setFormData({ ...formData, mfa_status: e.target.value as M365MFAStatus })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Enforced">{language === 'km' ? 'Enforced (Recommended / កាតព្វកិច្ច)' : 'Enforced (Recommended)'}</option>
                    <option value="Enabled">{language === 'km' ? 'Enabled (បានបើក)' : 'Enabled'}</option>
                    <option value="Disabled">{language === 'km' ? 'Disabled (មិនទាន់បើក)' : 'Disabled'}</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as M365AccountStatus })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">{language === 'km' ? 'Active (កំពុងដំណើរការ)' : 'Active'}</option>
                    <option value="Available">{language === 'km' ? 'Available Pool (ក្នុងឃ្លាំង)' : 'Available Pool'}</option>
                    <option value="Suspended">{language === 'km' ? 'Suspended (ផ្អាកបណ្តោះអាសន្ន)' : 'Suspended'}</option>
                  </select>
                </div>

                {/* Monthly Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_cost}
                    onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="12.50"
                  />
                </div>

                {/* Renewal Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscription Renewal Date
                  </label>
                  <input
                    type="date"
                    value={formData.renewal_date}
                    onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Mailbox Quota */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mailbox Quota (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.mailbox_quota_gb}
                    onChange={(e) => setFormData({ ...formData, mailbox_quota_gb: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="50"
                  />
                </div>

                {/* Mailbox Usage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Mailbox Usage (GB)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.mailbox_usage_gb}
                    onChange={(e) => setFormData({ ...formData, mailbox_usage_gb: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="0"
                  />
                </div>

                {/* Admin Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Admin Remarks & Notes / ចំណាំ' : 'Admin Remarks & Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    placeholder="e.g. Dedicated mailbox for quality assurance audits and customer correspondence."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN M365 MODAL */}
      {isAssignModalOpen && selectedForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Assign M365 License: {selectedForAssign.email}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Account Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-900 text-sm">{selectedForAssign.email}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Plan: <span className="font-semibold text-blue-700">{selectedForAssign.license_plan}</span> • MFA: {selectedForAssign.mfa_status}
                </div>
              </div>

              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'Select Employee (ជ្រើសរើសបុគ្គលិកទទួល) *' : 'Select Employee *'}
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees
                    .filter((e) => e.status !== 'Terminated')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}{language === 'km' && emp.khmer_name ? ` (${emp.khmer_name})` : ''} - {emp.role} (
                        {emp.department_name || 'General'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'Remarks / Provisioning Notes (ចំណាំ)' : 'Remarks / Provisioning Notes'}
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Onboarded new hire with initial temporary password and Microsoft Authenticator enrollment QR code."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignment}
                  disabled={submittingAssign || !assigneeId}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                >
                  {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL M365 HANDOVER SLIP MODAL (PRINTABLE) */}
      {isSlipModalOpen && selectedForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar (No-Print) */}
            <div className="no-print px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm text-slate-800">
                  {language === 'km' ? 'Microsoft 365 Cloud Account Issue Slip / ប័ណ្ណប្រគល់គណនី' : 'Microsoft 365 Cloud Account Issue Slip'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <PrintIcon className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setIsSlipModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 font-sans text-slate-800 space-y-6 bg-white">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                {language === 'km' && (
                  <h2 className="text-base font-bold text-slate-900">
                    ព្រះរាជាណាចក្រកម្ពុជា • ជាតិ សាសនា ព្រះមហាក្សត្រ
                  </h2>
                )}
                <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide mt-2">
                  HESTRA (CAMBODIA) GARMENT CO., LTD.
                </h3>
                <div className="text-xs text-slate-500 font-medium">
                  Phnom Penh Special Economic Zone (PPSEZ), National Road 4, Cambodia
                </div>
                <div className="mt-4 inline-block bg-slate-100 px-4 py-1.5 rounded-full border border-slate-300">
                  <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    MICROSOFT 365 CLOUD ACCOUNT & SECURITY ACKNOWLEDGMENT SLIP
                  </h1>
                  {language === 'km' && (
                    <div className="text-xs text-slate-600 font-semibold">
                      ប័ណ្ណប្រគល់-ទទួលគណនី Microsoft 365 និងកិច្ចព្រមព្រៀងសុវត្ថិភាព Cloud
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">{language === 'km' ? 'Document Ref / លេខប័ណ្ណ:' : 'Document Ref:'}</span>{' '}
                  <span className="font-mono font-bold text-slate-800">
                    HO-M365-{selectedForSlip.id.toUpperCase()}-{new Date().getFullYear()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-500">{language === 'km' ? 'Issue Date / កាលបរិច្ឆេទ:' : 'Issue Date:'}</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {formatDateDMY(selectedForSlip.assigned_date || new Date())}
                  </span>
                </div>
              </div>

              {/* Custodian Information */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  {language === 'km' ? '1. Authorized Employee / Custodian (ព័ត៌មានបុគ្គលិកទទួល)' : '1. Authorized Employee / Custodian'}
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Employee Name (ឈ្មោះ):' : 'Employee Name:'}</span>{' '}
                    <span className="font-bold text-slate-900">
                      {selectedForSlip.assigned_employee_name || 'N/A'}{' '}
                      {language === 'km' && selectedForSlip.assigned_khmer_name ? `(${selectedForSlip.assigned_khmer_name})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Employee ID (អត្តលេខ):' : 'Employee ID:'}</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedForSlip.assigned_to || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Department (នាយកដ្ឋាន):' : 'Department:'}</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedForSlip.assigned_department || 'Garment Manufacturing & Administration'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Role / Position (តួនាទី):' : 'Role / Position:'}</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedForSlip.assigned_role || 'Staff Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account & Security Specifications */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  {language === 'km' ? '2. Microsoft 365 Account & Credential Details (ព័ត៌មានលម្អិតនៃគណនី)' : '2. Microsoft 365 Account & Credential Details'}
                </div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500 w-1/3">User Principal Name (UPN):</td>
                      <td className="px-4 py-2 font-mono font-bold text-blue-700">
                        {selectedForSlip.email}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Subscription License SKU:</td>
                      <td className="px-4 py-2 font-bold text-slate-800">
                        {selectedForSlip.license_plan}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Multi-Factor Authentication (MFA):</td>
                      <td className="px-4 py-2 font-semibold text-emerald-700">
                        {selectedForSlip.mfa_status} (Mandatory Enforced via Microsoft Authenticator App)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Mailbox & Cloud Storage:</td>
                      <td className="px-4 py-2 text-slate-800 font-mono">
                        Exchange Mailbox: {selectedForSlip.mailbox_quota_gb} GB • OneDrive Cloud: {selectedForSlip.onedrive_quota_gb} GB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Official Sign-In Portal:</td>
                      <td className="px-4 py-2 text-blue-600 font-mono">
                        https://portal.office.com (or https://outlook.office.com)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cybersecurity & Data Protection Terms */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 text-[11px] leading-relaxed text-slate-600">
                <div className="font-bold text-slate-800 mb-1">
                  {language === 'km' ? 'Cloud Security & Compliance Terms / លក្ខខណ្ឌសុវត្ថិភាព និងការទទួលខុសត្រូវ៖' : 'Cloud Security & Compliance Terms:'}
                </div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    This Microsoft 365 cloud account is official corporate property of <strong>HESTRA (Cambodia) Garment Co., Ltd.</strong> and must be used exclusively for authorized business work.
                  </li>
                  <li>
                    Multi-Factor Authentication (MFA) is strictly mandatory. Never share 2FA approval prompts, SMS verification codes, or temporary passwords with any third party.
                  </li>
                  <li>
                    Corporate correspondence, technical specifications, garment design CAD patterns, and payroll records stored in OneDrive or SharePoint are strictly confidential.
                  </li>
                  <li>
                    Upon employment termination or contract cessation, account access will be revoked immediately and all data remains company property.
                  </li>
                  {language === 'km' && (
                    <li>
                      គណនី Microsoft 365 នេះជាកម្មសិទ្ធិផ្លូវការរបស់ក្រុមហ៊ុន ហេស្ត្រា (ខេមបូឌា)។ បុគ្គលិកត្រូវថែរក្សាការសម្ងាត់នៃពាក្យសម្ងាត់ និងការផ្ទៀងផ្ទាត់ ២ ជាន់ (MFA) មិនត្រូវចែករំលែកជាមួយអ្នកដទៃឡើយ។
                    </li>
                  )}
                </ol>
              </div>

              {/* Dual Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
                <div className="text-center">
                  <div className="font-bold text-slate-800">{language === 'km' ? 'Issued By / អ្នកប្រគល់ (IT Administrator)' : 'Issued By (IT Administrator)'}</div>
                  <div className="text-[11px] text-slate-500">{language === 'km' ? 'IT Department / រដ្ឋបាលបច្ចេកវិទ្យា' : 'IT Department'}</div>
                  <div className="h-16 border-b border-slate-300 mt-2"></div>
                  <div className="mt-2 font-semibold text-slate-700">{currentPersona.name}</div>
                  <div className="text-[10px] text-slate-400">Date: {formatDateDMY(new Date())}</div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-slate-800">{language === 'km' ? 'Received & Acknowledged By / អ្នកទទួល' : 'Received & Acknowledged By'}</div>
                  <div className="text-[11px] text-slate-500">Authorized Employee Signature</div>
                  <div className="h-16 border-b border-slate-300 mt-2"></div>
                  <div className="mt-2 font-semibold text-slate-700">
                    {selectedForSlip.assigned_employee_name || 'Employee'}
                  </div>
                  <div className="text-[10px] text-slate-400">Date: ____________________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
