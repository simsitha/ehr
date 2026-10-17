'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ApprovalRequest, ApprovalRequestStatus } from '@/lib/types';
import NewStaffRequestModal from '@/components/NewStaffRequestModal';
import RequestApprovalModal from '@/components/RequestApprovalModal';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Laptop,
  Monitor,
  DollarSign,
  Package,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  User,
  Building2,
  AlertCircle,
  Eye,
  RefreshCw,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function RequestsPage() {
  const { currentPersona, language, showToast, refreshKey, triggerRefresh } = useApp();

  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending_manager' | 'pending_hr' | 'pending_top' | 'approved' | 'rejected' | 'my'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<ApprovalRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isEmployee = currentPersona.role === 'Employee';
  const isManager = currentPersona.role === 'Manager';
  const isAdmin = currentPersona.role === 'Admin';
  const isCeo =
    currentPersona?.name?.toLowerCase().includes('ceo') ||
    currentPersona?.email?.toLowerCase().includes('ceo') ||
    (currentPersona as any)?.username === 'ceo';

  // Load requests
  const fetchRequests = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.append('type', typeFilter);

    fetch(`/api/requests?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching requests:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, [typeFilter, refreshKey]);

  // If user is employee, default to 'my' tab
  useEffect(() => {
    if (isEmployee) {
      setActiveTab('my');
    }
  }, [isEmployee]);

  // Tab Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Tab filter
      if (activeTab === 'my') {
        const isMine =
          r.employee_id === currentPersona.id ||
          (currentPersona as any).employee_id === r.employee_id;
        if (!isMine) return false;
      } else if (activeTab === 'pending_manager') {
        if (r.status !== 'Pending Line Manager') return false;
      } else if (activeTab === 'pending_hr') {
        if (r.status !== 'Pending HR') return false;
      } else if (activeTab === 'pending_top') {
        if (r.status !== 'Pending Top Management') return false;
      } else if (activeTab === 'approved') {
        if (r.status !== 'Approved') return false;
      } else if (activeTab === 'rejected') {
        if (r.status !== 'Rejected') return false;
      }

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (r.employee_name || '').toLowerCase().includes(q);
        const matchItem = (r.item_name || '').toLowerCase().includes(q);
        const matchReqNum = (r.request_number || '').toLowerCase().includes(q);
        const matchDept = (r.department_name || '').toLowerCase().includes(q);
        if (!matchName && !matchItem && !matchReqNum && !matchDept) return false;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery, currentPersona.id]);

  // Counts for tabs
  const pendingManagerCount = requests.filter((r) => r.status === 'Pending Line Manager').length;
  const pendingHrCount = requests.filter((r) => r.status === 'Pending HR').length;
  const pendingTopCount = requests.filter((r) => r.status === 'Pending Top Management').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;

  const handleOpenReview = (item: ApprovalRequest) => {
    setSelectedRequest(item);
    setApprovalModalOpen(true);
  };

  const handleDeleteClick = (item: ApprovalRequest) => {
    setRequestToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${requestToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (language === 'km' ? 'បរាជ័យក្នុងការលុបសំណើ' : 'Failed to delete request'));
      }
      showToast(
        language === 'km'
          ? `បានលុបសំណើ #${requestToDelete.request_number} ដោយជោគជ័យ!`
          : `Request #${requestToDelete.request_number} deleted successfully!`,
        'success'
      );
      setIsDeleteModalOpen(false);
      setRequestToDelete(null);
      fetchRequests();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting request', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <FileCheck2 size={16} />
            <span>{language === 'km' ? 'ប្រព័ន្ធអនុម័តពហុថ្នាក់ (Multi-Tier Requisition)' : 'Multi-Tier Requisition Workflow'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            {language === 'km' ? 'សំណើ & ការអនុម័ត' : 'Requests & Approvals'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-khmer">
            {language === 'km'
              ? 'ស្នើសុំសម្ភារៈ បរិក្ខារការងារ និងដំឡើងបៀវត្សរ៍ តាមឋានានុក្រម៖ ប្រធានផ្នែក ➔ ធនធានមនុស្ស (HR) ➔ គណៈគ្រប់គ្រងកំពូល (CEO)។'
              : 'End-to-end request pipeline with Line Manager, HR, and Top Management (CEO) verification gates.'}
          </p>
        </div>

        {/* Quick actions dock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>{language === 'km' ? 'បង្កើតសំណើថ្មី' : 'New Request'}</span>
          </button>

          <button
            onClick={fetchRequests}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('pending_manager')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'km' ? 'រង់ចាំប្រធានផ្នែក (Tier 1)' : 'Pending Manager'}
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Clock size={15} />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">
            {pendingManagerCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Stage 1 Initial Review</p>
        </div>

        <div
          onClick={() => setActiveTab('pending_hr')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs cursor-pointer hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'km' ? 'រង់ចាំ HR (Tier 2)' : 'Pending HR'}
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={15} />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2 font-mono">
            {pendingHrCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Final for standard items</p>
        </div>

        <div
          onClick={() => setActiveTab('pending_top')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'km' ? 'រង់ចាំ CEO (Tier 3)' : 'Pending Top Mgmt'}
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShieldAlert size={15} />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {pendingTopCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Laptop, Computer, Salary</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'km' ? 'បានអនុម័តរួចរាល់' : 'Approved'}
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {approvedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Fully authorized</p>
        </div>
      </div>

      {/* 3. TABS & FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label_km: 'សំណើទាំងអស់', label_en: 'All Requests', count: requests.length },
            ...(isEmployee ? [{ id: 'my', label_km: 'សំណើរបស់ខ្ញុំ', label_en: 'My Requests', count: requests.filter((r) => r.employee_id === currentPersona.id).length }] : []),
            { id: 'pending_manager', label_km: 'រង់ចាំ Manager', label_en: 'Pending Manager', count: pendingManagerCount },
            { id: 'pending_hr', label_km: 'រង់ចាំ HR', label_en: 'Pending HR', count: pendingHrCount },
            { id: 'pending_top', label_km: 'រង់ចាំ CEO', label_en: 'Pending CEO', count: pendingTopCount },
            { id: 'approved', label_km: 'បានអនុម័ត', label_en: 'Approved', count: approvedCount },
            { id: 'rejected', label_km: 'បានបដិសេធ', label_en: 'Rejected', count: requests.filter((r) => r.status === 'Rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{language === 'km' ? tab.label_km : tab.label_en}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  activeTab === tab.id
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិក សម្ភារៈ...' : 'Search employee, item, #...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទ' : 'All Types'}</option>
            <option value="Material / Equipment">{language === 'km' ? 'សម្ភារៈ & ឧបករណ៍' : 'Material & Equipment'}</option>
            <option value="Salary Increase">{language === 'km' ? 'ដំឡើងបៀវត្សរ៍' : 'Salary Increase'}</option>
          </select>
        </div>
      </div>

      {/* 4. REQUESTS LIST / TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">{language === 'km' ? 'កំពុងទាញយកទិន្នន័យសំណើ...' : 'Loading requests...'}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileCheck2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {language === 'km' ? 'មិនមានសំណើក្នុងទិដ្ឋភាពនេះទេ' : 'No requests found in this view'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-khmer">
              {language === 'km'
                ? 'ចុចប៊ូតុង "បង្កើតសំណើថ្មី" ដើម្បីស្នើសុំសម្ភារៈ កុំព្យូទ័រ Laptop ឬស្នើសុំដំឡើងប្រាក់ខែ។'
                : 'Click "New Request" to submit a requisition for materials, laptops, or salary increase.'}
            </p>
            <button
              onClick={() => setNewModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>{language === 'km' ? 'បង្កើតសំណើដំបូង' : 'Create First Request'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Request #</th>
                  <th className="px-5 py-3.5">Requester / Department</th>
                  <th className="px-5 py-3.5">Item / Requisition</th>
                  <th className="px-5 py-3.5">Approval Hierarchy Path</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const isSalary =
                    req.request_type === 'Salary Increase' ||
                    req.item_category === 'salary_increase';
                  const isHighValue = req.requires_top_management === 1;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Request # */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {req.request_number}
                          </span>
                          {req.urgency === 'Urgent' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                              Urgent
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                          {req.created_at ? req.created_at.split('T')[0] : 'Today'}
                        </span>
                      </td>

                      {/* Requester */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {req.employee_avatar ? (
                            <img
                              src={req.employee_avatar}
                              alt={req.employee_name || 'Staff'}
                              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-100 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center ring-2 ring-indigo-100 shrink-0">
                              {req.employee_name ? req.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {req.employee_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-khmer">
                              {req.department_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Item Details */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {isSalary ? (
                              <DollarSign size={14} className="text-emerald-600 shrink-0" />
                            ) : req.item_name.toLowerCase().includes('laptop') ? (
                              <Laptop size={14} className="text-indigo-600 shrink-0" />
                            ) : req.item_name.toLowerCase().includes('computer') ? (
                              <Monitor size={14} className="text-blue-600 shrink-0" />
                            ) : (
                              <Package size={14} className="text-slate-500 shrink-0" />
                            )}
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {req.item_name}
                            </span>
                          </div>

                          {isSalary ? (
                            <span className="text-[11px] font-mono text-emerald-600 font-bold block">
                              ${Number(req.current_salary).toLocaleString()} ➔ ${Number(req.proposed_salary).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 block">
                              Qty: {req.quantity} • ~${Number(req.estimated_cost).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Multi-Tier Flow Badges */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {/* Tier 1: Line Manager */}
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              req.line_manager_status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.line_manager_status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title="Tier 1: Line Manager"
                          >
                            1. LM: {req.line_manager_status}
                          </span>

                          <ChevronRight size={12} className="text-slate-400" />

                          {/* Tier 2: HR */}
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              req.hr_status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.hr_status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                            title="Tier 2: HR Department"
                          >
                            2. HR: {req.hr_status}
                            {!isHighValue && ' (Final)'}
                          </span>

                          {/* Tier 3: Top Mgmt (if high value) */}
                          {isHighValue && (
                            <>
                              <ChevronRight size={12} className="text-slate-400" />
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  req.top_management_status === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : req.top_management_status === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                                title="Tier 3: Top Management (CEO)"
                              >
                                3. CEO: {req.top_management_status}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {isHighValue ? '⚠️ Requires CEO sign-off' : '✓ Final approval is HR'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : req.status === 'Pending Top Management'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : req.status === 'Pending HR'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {req.status === 'Approved' && <CheckCircle2 size={12} />}
                          {req.status === 'Rejected' && <XCircle size={12} />}
                          {req.status.startsWith('Pending') && <Clock size={12} />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(req)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>
                              {(req.status === 'Pending Line Manager' && (isManager || isAdmin)) ||
                              (req.status === 'Pending HR' && isAdmin) ||
                              (req.status === 'Pending Top Management' && isCeo)
                                ? language === 'km'
                                  ? 'ពិនិត្យ & អនុម័ត'
                                  : 'Review & Approve'
                                : language === 'km'
                                ? 'មើលព័ត៌មាន'
                                : 'View Details'}
                            </span>
                          </button>

                          {(isAdmin || isManager || req.employee_id === currentPersona.id) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(req);
                              }}
                              className="px-2.5 py-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white rounded-xl border border-rose-200 dark:border-rose-900 transition-all inline-flex items-center gap-1 font-bold text-xs cursor-pointer shadow-2xs active:scale-95"
                              title={language === 'km' ? 'លុបសំណើនេះ' : 'Delete request'}
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">
                                {language === 'km' ? 'លុប' : 'Delete'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <NewStaffRequestModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSuccess={() => {
          triggerRefresh();
          fetchRequests();
        }}
        defaultEmployeeId={currentPersona.id}
        defaultEmployeeName={currentPersona.name}
      />

      <RequestApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedRequest(null);
        }}
        requestItem={selectedRequest}
        onSuccess={() => {
          triggerRefresh();
          fetchRequests();
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && requestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'km' ? 'លុបសំណើនេះ? (Delete Request)' : 'Delete Request?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'km'
                    ? `តើអ្នកប្រាកដជាចង់លុបសំណើ #${requestToDelete.request_number} សម្រាប់ "${requestToDelete.item_name}" ដែរឬទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                    : `Are you sure you want to permanently delete request #${requestToDelete.request_number} for "${requestToDelete.item_name}"? This action cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{language === 'km' ? 'អ្នកស្នើសុំ៖' : 'Requester:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{requestToDelete.employee_name}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{language === 'km' ? 'សម្ភារៈ/មុខទំនិញ៖' : 'Item / Type:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{requestToDelete.item_name}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{language === 'km' ? 'ស្ថានភាព៖' : 'Status:'}</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{requestToDelete.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{language === 'km' ? 'កំពុងលុប...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{language === 'km' ? 'យល់ព្រម លុបសំណើ' : 'Yes, Delete Request'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
