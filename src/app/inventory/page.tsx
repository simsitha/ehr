'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDateDMY } from '@/lib/translations';
import {
  ITAsset,
  ITAssetCategory,
  ITAssetStatus,
  ITAssetCondition,
  ITAssetLog,
  Employee,
  M365Account,
  M365Overview,
} from '@/lib/types';
import M365InventorySection from '@/components/M365InventorySection';
import {
  Laptop,
  Monitor,
  Printer,
  Fingerprint,
  ScanBarcode,
  Network,
  Tablet,
  HardDrive,
  Cloud,
  Mail,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  UserCheck,
  Building2,
  Trash2,
  Edit,
  X,
  FileText,
  Printer as PrintIcon,
  ShieldCheck,
  Wifi,
  ExternalLink,
  ChevronRight,
  Info,
  Eye,
  EyeOff,
  Key,
  Lock,
  User,
  Copy,
  Check,
} from 'lucide-react';

const CATEGORY_ICONS: Record<ITAssetCategory, React.ElementType> = {
  'Laptops & Computers': Laptop,
  'Biometric & Clocks': Fingerprint,
  'Barcode Scanners': ScanBarcode,
  'Printers & Imaging': Printer,
  'Monitors & Displays': Monitor,
  'Network & Servers': Network,
  'Mobile & Tablets': Tablet,
  'Accessories & Parts': HardDrive,
  'Software & Cloud Licenses': Cloud,
};

const CATEGORIES: ITAssetCategory[] = [
  'Laptops & Computers',
  'Biometric & Clocks',
  'Barcode Scanners',
  'Printers & Imaging',
  'Monitors & Displays',
  'Network & Servers',
  'Mobile & Tablets',
  'Accessories & Parts',
  'Software & Cloud Licenses',
];

const STATUSES: ITAssetStatus[] = ['Available', 'In Use', 'Maintenance', 'Damaged', 'Retired'];

const CONDITIONS: ITAssetCondition[] = ['New', 'Good', 'Fair', 'Poor', 'Broken'];

export default function InventoryPage() {
  const { currentPersona, showToast, language } = useApp();
  const isAdminOrManager = currentPersona.role === 'Admin' || currentPersona.role === 'Manager';

  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ITAssetLog[]>([]);
  const [m365Accounts, setM365Accounts] = useState<M365Account[]>([]);
  const [m365Overview, setM365Overview] = useState<M365Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'biometric' | 'm365' | 'assigned' | 'logs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ITAsset | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState<ITAsset | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedAssetForHandover, setSelectedAssetForHandover] = useState<ITAsset | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    category: 'Laptops & Computers' as ITAssetCategory,
    brand: '',
    model: '',
    serial_number: '',
    mac_address: '',
    ip_address: '',
    status: 'Available' as ITAssetStatus,
    condition: 'Good' as ITAssetCondition,
    purchase_date: '',
    purchase_cost: '',
    currency: 'USD',
    warranty_expiry: '',
    vendor: '',
    location: '',
    department: '',
    specifications: '',
    notes: '',
    windows_operation: 'Windows 11 Pro 64-bit',
    m365_account: '',
    assigned_to: '',
    local_account: 'Administrator',
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleCopyPassword = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    showToast('Password copied to clipboard', 'info');
    setTimeout(() => setCopiedPass(false), 2000);
  };

  // Assignment form state
  const [assigneeId, setAssigneeId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAssets, resEmps, resLogs, resM365] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/employees'),
        fetch('/api/inventory/logs'),
        fetch('/api/inventory/m365'),
      ]);

      if (resAssets.ok) {
        const data = await resAssets.json();
        if (Array.isArray(data)) {
          setAssets(data);
        } else if (data && Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
      }
      if (resEmps.ok) {
        const emps = await resEmps.json();
        setEmployees(Array.isArray(emps) ? emps : []);
      }
      if (resLogs.ok) {
        const logData = await resLogs.json();
        setLogs(Array.isArray(logData) ? logData : []);
      }
      if (resM365.ok) {
        const m365Data = await resM365.json();
        if (m365Data.accounts && Array.isArray(m365Data.accounts)) {
          setM365Accounts(m365Data.accounts);
          setM365Overview(m365Data.overview || null);
        } else if (Array.isArray(m365Data)) {
          setM365Accounts(m365Data);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      showToast('Error loading inventory data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // KPIs
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const totalValuation = assets.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0);
    const inUseCount = assets.filter((a) => a.status === 'In Use').length;
    const availableCount = assets.filter((a) => a.status === 'Available').length;
    const maintenanceCount = assets.filter((a) => a.status === 'Maintenance' || a.status === 'Damaged').length;
    const biometricClocks = assets.filter((a) => a.category === 'Biometric & Clocks');
    const biometricOnline = biometricClocks.filter((a) => a.status === 'In Use' || a.status === 'Available').length;

    return {
      totalAssets,
      totalValuation,
      inUseCount,
      availableCount,
      maintenanceCount,
      biometricTotal: biometricClocks.length,
      biometricOnline,
    };
  }, [assets]);

  // Departments for dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      const d = a.department_name || a.assigned_department || a.department;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Tab filter
      if (activeTab === 'biometric' && asset.category !== 'Biometric & Clocks') {
        return false;
      }
      if (activeTab === 'assigned' && asset.status !== 'In Use') {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && asset.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && asset.status !== statusFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'all') {
        const d = asset.department_name || asset.assigned_department || asset.department;
        if (d !== departmentFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tag = (asset.asset_tag || '').toLowerCase();
        const name = (asset.name || '').toLowerCase();
        const brand = (asset.brand || '').toLowerCase();
        const model = (asset.model || '').toLowerCase();
        const sn = (asset.serial_number || '').toLowerCase();
        const ip = (asset.ip_address || '').toLowerCase();
        const user = (asset.assigned_employee_name || '').toLowerCase();
        const loc = (asset.location || '').toLowerCase();
        const win = (asset.windows_operation || asset.os_version || '').toLowerCase();
        const m365 = (asset.m365_account || '').toLowerCase();
        const dUser = (asset.device_username || asset.username || '').toLowerCase();
        const lAcc = (asset.local_account || '').toLowerCase();
        return (
          tag.includes(q) ||
          name.includes(q) ||
          brand.includes(q) ||
          model.includes(q) ||
          sn.includes(q) ||
          ip.includes(q) ||
          user.includes(q) ||
          loc.includes(q) ||
          win.includes(q) ||
          m365.includes(q) ||
          dUser.includes(q) ||
          lAcc.includes(q)
        );
      }

      return true;
    });
  }, [assets, activeTab, categoryFilter, statusFilter, departmentFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setShowPassword(false);
    setCopiedPass(false);
    setFormData({
      asset_tag: `IT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Laptops & Computers',
      brand: '',
      model: '',
      serial_number: '',
      mac_address: '',
      ip_address: '',
      status: 'Available',
      condition: 'Good',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      currency: 'USD',
      warranty_expiry: '',
      vendor: '',
      location: '',
      department: '',
      specifications: '',
      notes: '',
      windows_operation: 'Windows 11 Pro 64-bit',
      m365_account: '',
      assigned_to: '',
      local_account: 'Administrator',
      username: '',
      password: '',
    });
    setIsAssetModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (asset: ITAsset) => {
    setEditingAsset(asset);
    setShowPassword(false);
    setCopiedPass(false);
    setFormData({
      asset_tag: asset.asset_tag,
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      mac_address: asset.mac_address || '',
      ip_address: asset.ip_address || '',
      status: asset.status,
      condition: asset.condition,
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost ? String(asset.purchase_cost) : '',
      currency: asset.currency || 'USD',
      warranty_expiry: asset.warranty_expiry || asset.warranty_end || '',
      vendor: asset.vendor || '',
      location: asset.location || '',
      department: asset.department_name || asset.department || '',
      specifications: asset.specifications || asset.specs || '',
      notes: asset.notes || '',
      windows_operation: asset.windows_operation || asset.os_version || '',
      m365_account: asset.m365_account || '',
      assigned_to: asset.assigned_to || '',
      local_account: asset.local_account || '',
      username: asset.device_username || asset.username || '',
      password: asset.device_password || asset.password || '',
    });
    setIsAssetModalOpen(true);
  };

  // Save (Create or Update) Asset
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.asset_tag.trim()) {
      showToast('Asset Name and Tag are required', 'error');
      return;
    }

    try {
      // Auto-adjust status based on direct assignment selection
      let finalStatus = formData.status;
      if (formData.assigned_to && finalStatus === 'Available') {
        finalStatus = 'In Use';
      } else if (!formData.assigned_to && finalStatus === 'In Use') {
        finalStatus = 'Available';
      }

      const payload = {
        ...formData,
        status: finalStatus,
        specs: formData.specifications,
        warranty_end: formData.warranty_expiry,
        purchase_cost: Number(formData.purchase_cost) || 0,
        assigned_to: formData.assigned_to || null,
        windows_operation: formData.windows_operation.trim() || null,
        os_version: formData.windows_operation.trim() || null,
        m365_account: formData.m365_account.trim() || null,
        local_account: formData.local_account.trim() || null,
        device_username: formData.username.trim() || null,
        username: formData.username.trim() || null,
        device_password: formData.password || null,
        password: formData.password || null,
      };

      if (editingAsset) {
        // Update
        const res = await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAsset.id,
            ...payload,
          }),
        });
        if (!res.ok) throw new Error('Failed to update asset');
        showToast('Asset updated successfully', 'success');
      } else {
        // Create
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create asset');
        showToast('Asset created successfully', 'success');
      }
      setIsAssetModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (asset: ITAsset) => {
    if (!window.confirm(`Are you sure you want to delete asset "${asset.asset_tag} - ${asset.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(asset.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      showToast('Asset deleted successfully', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete asset', 'error');
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (asset: ITAsset) => {
    setSelectedAssetForAssign(asset);
    setAssigneeId(asset.assigned_to || '');
    setAssignmentNotes('');
    setIsAssignModalOpen(true);
  };

  // Submit Assignment
  const handleConfirmAssignment = async () => {
    if (!selectedAssetForAssign || !assigneeId) {
      showToast('Please select an employee', 'error');
      return;
    }

    try {
      setSubmittingAssign(true);
      const res = await fetch('/api/inventory/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAssetForAssign.id,
          employee_id: assigneeId,
          performed_by: currentPersona.name,
          notes: assignmentNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to assign asset');
      showToast(`Asset assigned to employee`, 'success');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Return Asset
  const handleReturnAsset = async (asset: ITAsset) => {
    if (!window.confirm(`Confirm return of "${asset.asset_tag} - ${asset.name}" to IT stock?`)) {
      return;
    }

    try {
      const res = await fetch('/api/inventory/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          employee_id: null,
          performed_by: currentPersona.name,
          notes: 'Returned to IT inventory stock',
        }),
      });

      if (!res.ok) throw new Error('Failed to return asset');
      showToast('Asset returned to stock', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to return asset', 'error');
    }
  };

  // Open Handover Slip
  const handleOpenHandoverSlip = (asset: ITAsset) => {
    setSelectedAssetForHandover(asset);
    setIsHandoverModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (assets.length === 0) return;
    const headers = [
      'Asset Tag',
      'Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'MAC Address',
      'IP Address',
      'Status',
      'Condition',
      'Department',
      'Location',
      'Assigned Employee',
      'Assigned Date',
      'Purchase Cost (USD)',
      'Purchase Date',
      'Windows Operation',
      'Microsoft 365 Account',
      'Local Account',
      'Username',
    ];

    const rows = assets.map((a) => [
      `"${a.asset_tag}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.brand || ''}"`,
      `"${a.model || ''}"`,
      `"${a.serial_number || ''}"`,
      `"${a.mac_address || ''}"`,
      `"${a.ip_address || ''}"`,
      `"${a.status}"`,
      `"${a.condition}"`,
      `"${a.department_name || a.assigned_department || a.department || ''}"`,
      `"${a.location || ''}"`,
      `"${a.assigned_employee_name || ''}"`,
      `"${a.assigned_date || ''}"`,
      `"${a.purchase_cost || 0}"`,
      `"${a.purchase_date || ''}"`,
      `"${a.windows_operation || a.os_version || ''}"`,
      `"${a.m365_account || ''}"`,
      `"${a.local_account || ''}"`,
      `"${a.device_username || a.username || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HESTRA_IT_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper colors
  const getStatusBadge = (status: ITAssetStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Use':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Retired':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Damaged':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getConditionBadge = (condition: ITAssetCondition) => {
    switch (condition) {
      case 'New':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Good':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Fair':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Poor':
      case 'Broken':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              IT Infrastructure & Assets
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">HESTRA Garment Factory (Phnom Penh)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            {language === 'km' ? 'សារពើភ័ណ្ឌ IT & ឧបករណ៍រោងចក្រ' : 'IT Inventory & Asset Management'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'តាមដានឧបករណ៍កុំព្យូទ័រ ម៉ាស៊ីនស្កេនក្រយៅដៃ ZKTeco ម៉ាស៊ីនបោះពុម្ព និងការប្រគល់-ទទួលឧបករណ៍ជូនបុគ្គលិក'
              : 'Track laptops, workstations, ZKTeco biometric punch clocks, barcode scanners, and asset assignments.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {isAdminOrManager && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add IT Asset
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Assets & Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalAssets}</span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <div className="mt-1 text-xs text-blue-600 font-medium">
            Est. ${stats.totalValuation.toLocaleString()} USD
          </div>
        </div>

        {/* In Use / Deployed */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deployed / In Use</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.inUseCount}</span>
            <span className="text-xs text-slate-500">
              ({stats.totalAssets > 0 ? Math.round((stats.inUseCount / stats.totalAssets) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Assigned to staff & lines</div>
        </div>

        {/* Available In Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{stats.availableCount}</span>
            <span className="text-xs text-slate-500">ready to assign</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">In IT warehouse inventory</div>
        </div>

        {/* Maintenance / Repair */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Repair</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{stats.maintenanceCount}</span>
            <span className="text-xs text-slate-500">devices</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Requires IT technician service</div>
        </div>

        {/* Biometric Punch Clocks */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs relative overflow-hidden group hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biometric Clocks</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600">{stats.biometricTotal}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {stats.biometricOnline} Online
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Turnstile & gate sync active</div>
        </div>
      </div>

      {/* Tabs & Search Filter Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Sub-tabs */}
        <div className="border-b border-slate-100 px-6 pt-4 flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Laptop className="w-4 h-4" />
            {language === 'km' ? 'ឧបករណ៍ទាំងអស់' : 'All IT Assets'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
              {assets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('biometric')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'biometric'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            {language === 'km' ? 'ម៉ាស៊ីនស្កេនក្រយៅដៃ (Biometric Clocks)' : 'Biometric Punch Clocks'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
              {stats.biometricTotal}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('m365')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'm365'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cloud className="w-4 h-4" />
            {language === 'km' ? 'គណនី Microsoft 365' : 'Microsoft 365 Accounts'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">
              {m365Accounts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'assigned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {language === 'km' ? 'ឧបករណ៍កំពុងប្រគល់ជូនបុគ្គលិក' : 'Staff Custody / Checked Out'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              {stats.inUseCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            {language === 'km' ? 'ប្រវត្តិនៃការផ្ទេរ & កំណត់ហេតុ' : 'Assignment Logs & History'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Filter controls (Only for hardware/asset tabs) */}
        {activeTab !== 'logs' && activeTab !== 'm365' && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរក Tag, ម៉ូឌែល, សៀរៀល, IP, បុគ្គលិក...'
                    : 'Search Tag, Model, Serial No, IP, Staff...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              {activeTab === 'all' && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទទាំងអស់ (All Categories)' : 'All Categories'}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាពទាំងអស់ (All Statuses)' : 'All Statuses'}</option>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់ (All Departments)' : 'All Departments'}</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {(categoryFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Loading IT Inventory...</p>
          </div>
        ) : activeTab === 'logs' ? (
          /* Logs View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Asset Tag & Device</th>
                  <th className="px-6 py-3.5">Employee / Custodian</th>
                  <th className="px-6 py-3.5">Performed By</th>
                  <th className="px-6 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No assignment history or audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            log.action === 'Assigned'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.action === 'Returned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.action === 'Created'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 font-mono text-xs">{log.asset_tag}</div>
                        <div className="text-xs text-slate-500">{log.asset_name}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        {log.employee_name ? (
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              {log.employee_name.charAt(0)}
                            </span>
                            {log.employee_name}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None / Warehouse Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">{log.performed_by}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 max-w-xs truncate">{log.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'm365' ? (
          /* Microsoft 365 Accounts View */
          <div className="p-6">
            <M365InventorySection
              accounts={m365Accounts}
              overview={m365Overview}
              employees={employees}
              isAdminOrManager={isAdminOrManager}
              language={language}
              currentPersona={currentPersona}
              onRefresh={fetchData}
              showToast={showToast}
            />
          </div>
        ) : (
          /* Assets Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Asset Tag & Device</th>
                  <th className="px-6 py-3.5">Category & Specs</th>
                  <th className="px-6 py-3.5">Location & Network</th>
                  <th className="px-6 py-3.5">Status & Condition</th>
                  <th className="px-6 py-3.5">Assigned To</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto">
                        <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-600">No IT assets match your criteria</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search query, department, or status filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const IconComponent = CATEGORY_ICONS[asset.category] || HardDrive;
                    const isBiometric = asset.category === 'Biometric & Clocks';
                    const deptDisplay = asset.department_name || asset.assigned_department || asset.department || '';
                    const specsDisplay = asset.specifications || asset.specs || '';

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Asset Tag & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                asset.category === 'Software & Cloud Licenses'
                                  ? 'bg-sky-50 text-sky-600 border-sky-200'
                                  : isBiometric
                                  ? 'bg-teal-50 text-teal-600 border-teal-200'
                                  : asset.category === 'Laptops & Computers'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                                  : asset.category === 'Barcode Scanners'
                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {asset.asset_tag}
                                </span>
                                {asset.purchase_cost ? (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    ${Number(asset.purchase_cost).toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                              <div className="font-semibold text-slate-800 text-sm mt-1">{asset.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                {asset.brand && <span>{asset.brand}</span>}
                                {asset.model && <span>• {asset.model}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Specs */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-slate-700">{asset.category}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            SN: {asset.serial_number || 'N/A'}
                          </div>
                          {(asset.windows_operation || asset.os_version) && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              OS: {asset.windows_operation || asset.os_version}
                            </div>
                          )}
                          {asset.m365_account && (
                            <div className="text-[11px] text-blue-600 font-mono">
                              M365: {asset.m365_account}
                            </div>
                          )}
                          {specsDisplay && (
                            <div className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={specsDisplay}>
                              {specsDisplay}
                            </div>
                          )}
                        </td>

                        {/* Location & Network */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {asset.location || deptDisplay || 'Not assigned'}
                          </div>
                          {asset.ip_address ? (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Wifi className="w-2.5 h-2.5" />
                                {asset.ip_address}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-0.5">{deptDisplay || 'General IT'}</div>
                          )}
                          {asset.mac_address && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              MAC: {asset.mac_address}
                            </div>
                          )}
                        </td>

                        {/* Status & Condition */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                                asset.status
                              )}`}
                            >
                              {asset.status}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getConditionBadge(
                                asset.condition
                              )}`}
                            >
                              Cond: {asset.condition}
                            </span>
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td className="px-6 py-4">
                          {asset.assigned_employee_name ? (
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                  {asset.assigned_employee_name.charAt(0)}
                                </span>
                                {asset.assigned_employee_name}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Since {asset.assigned_date || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-block text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                              In Warehouse Stock
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Handover Slip Generator */}
                            {asset.status === 'In Use' && (
                              <button
                                onClick={() => handleOpenHandoverSlip(asset)}
                                title={language === 'km' ? 'Print Handover Slip / ប័ណ្ណប្រគល់-ទទួល' : 'Print Handover Slip'}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}

                            {/* Assign / Checkout */}
                            {isAdminOrManager && asset.status === 'Available' && (
                              <button
                                onClick={() => handleOpenAssignModal(asset)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Assign
                              </button>
                            )}

                            {/* Return */}
                            {isAdminOrManager && asset.status === 'In Use' && (
                              <button
                                onClick={() => handleReturnAsset(asset)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Return
                              </button>
                            )}

                            {/* Edit */}
                            {isAdminOrManager && (
                              <button
                                onClick={() => handleOpenEditModal(asset)}
                                title="Edit Asset"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            {isAdminOrManager && (
                              <button
                                onClick={() => handleDeleteAsset(asset)}
                                title="Delete Asset"
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
        )}
      </div>

      {/* CREATE / EDIT ASSET MODAL */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingAsset ? `Edit Asset: ${editingAsset.asset_tag}` : 'Add New IT Equipment / Device'}
                </h3>
              </div>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Tag */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Asset Tag / លេខកូដសម្ភារៈ *' : 'Asset Tag *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.asset_tag}
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                    placeholder="e.g. IT-LPT-001, IT-FPT-001"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Category / ប្រភេទសម្ភារៈ *' : 'Category *'}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ITAssetCategory })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Equipment / Device Name (ឈ្មោះឧបករណ៍) *' : 'Equipment / Device Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. ThinkPad E14 Gen 5, ZKTeco SilkBio-101 Punch Clock"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Brand / ម៉ាក' : 'Brand'}</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Lenovo, Dell, ZKTeco, Zebra"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Model / ម៉ូឌែល' : 'Model'}</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Latitude 5440, MB200"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Serial Number (SN) / លេខសៀរៀល' : 'Serial Number (SN)'}
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. PF4X891K"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Status / ស្ថានភាព' : 'Status'}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ITAssetStatus })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Condition / គុណភាព' : 'Condition'}</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as ITAssetCondition })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign to */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Assign to / ប្រគល់ជូនបុគ្គលិក' : 'Assign to'}
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setFormData({
                        ...formData,
                        assigned_to: empId,
                        status: empId && formData.status === 'Available' ? 'In Use' : (!empId && formData.status === 'In Use' ? 'Available' : formData.status),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'km' ? '-- Warehouse Stock / Unassigned (ស្តុកទុក) --' : '-- Warehouse Stock / Unassigned --'}</option>
                    {employees
                      .filter((emp) => emp.status !== 'Terminated')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          [{emp.id}] {emp.first_name} {emp.last_name}{language === 'km' && emp.khmer_name ? ` (${emp.khmer_name})` : ''} — {emp.role} ({emp.department_name || 'General'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Windows Operation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Windows Operation / OS (ប្រព័ន្ធប្រតិបត្តិការ)' : 'Windows Operation / OS'}
                  </label>
                  <input
                    type="text"
                    list="os-presets"
                    value={formData.windows_operation}
                    onChange={(e) => setFormData({ ...formData, windows_operation: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Windows 11 Pro 64-bit"
                  />
                  <datalist id="os-presets">
                    <option value="Windows 11 Pro 64-bit" />
                    <option value="Windows 11 Pro" />
                    <option value="Windows 11 Home" />
                    <option value="Windows 10 Pro 64-bit" />
                    <option value="Windows 10 Pro" />
                    <option value="Windows 10 Home" />
                    <option value="Windows Server 2022" />
                    <option value="Windows Server 2019" />
                    <option value="macOS Sonoma" />
                    <option value="Ubuntu Desktop 24.04" />
                  </datalist>
                </div>

                {/* Microsoft 365 account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Microsoft 365 account (គណនី M365)' : 'Microsoft 365 account'}
                  </label>
                  <input
                    type="text"
                    list="m365-presets"
                    value={formData.m365_account}
                    onChange={(e) => setFormData({ ...formData, m365_account: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. employee@hestra.com"
                  />
                  <datalist id="m365-presets">
                    {m365Accounts.map((acc) => (
                      <option key={acc.id} value={acc.email}>
                        {acc.display_name} — {acc.license_plan} ({acc.status})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Local Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Local Account (គណនីមូលដ្ឋាន)' : 'Local Account'}
                  </label>
                  <input
                    type="text"
                    list="local-acc-presets"
                    value={formData.local_account}
                    onChange={(e) => setFormData({ ...formData, local_account: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. Administrator"
                  />
                  <datalist id="local-acc-presets">
                    <option value="Administrator" />
                    <option value="LocalAdmin" />
                    <option value="Admin" />
                    <option value="User" />
                    <option value="Supervisor" />
                  </datalist>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Username (ឈ្មោះអ្នកប្រើប្រាស់)' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. sitha.sim"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {language === 'km' ? 'Password (ពាក្យសម្ងាត់)' : 'Password'}
                    </label>
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(formData.password)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                      >
                        {copiedPass ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedPass ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IP Address (For Punch Clocks/Printers)
                  </label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. 192.168.1.201"
                  />
                </div>

                {/* MAC Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={formData.mac_address}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. 00:1B:44:11:3A:B7"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Department / នាយកដ្ឋាន' : 'Department'}</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Production, HR, Quality Control"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Location / ទីតាំងជាក់ស្តែង' : 'Location'}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Gate 1 Security Turnstile, Sewing Line 2"
                  />
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 780"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Warranty Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Vendor / អ្នកផ្គត់ផ្គង់' : 'Vendor'}</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Anana Computer, ZKTeco Cambodia"
                  />
                </div>

                {/* Specifications */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'Technical Specifications (លក្ខណៈបច្ចេកទេស)' : 'Technical Specifications'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Core i5-1335U, 16GB DDR5, 512GB NVMe, 14-inch FHD IPS"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === 'km' ? 'Internal Notes / ចំណាំ' : 'Internal Notes'}</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Configured with factory VPN & HR portal credentials"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingAsset ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN / CHECKOUT ASSET MODAL */}
      {isAssignModalOpen && selectedAssetForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Assign Equipment: {selectedAssetForAssign.asset_tag}
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
              {/* Device Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-900 text-sm">{selectedAssetForAssign.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Category: {selectedAssetForAssign.category} • SN: {selectedAssetForAssign.serial_number || 'N/A'}
                </div>
                {(selectedAssetForAssign.specifications || selectedAssetForAssign.specs) && (
                  <div className="text-xs text-slate-600 mt-1 italic">
                    {selectedAssetForAssign.specifications || selectedAssetForAssign.specs}
                  </div>
                )}
              </div>

              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'Select Employee (ជ្រើសរើសបុគ្គលិកទទួលសម្ភារៈ) *' : 'Select Employee *'}
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

              {/* Handover notes / Accessories */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'Included Accessories & Handover Remarks (គ្រឿងបន្លាស់ & ចំណាំ)' : 'Included Accessories & Handover Remarks'}
                </label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Supplied with original AC charger, laptop sleeve, and wireless mouse."
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

      {/* OFFICIAL HANDOVER SLIP MODAL (PRINTABLE) */}
      {isHandoverModalOpen && selectedAssetForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar (No-Print) */}
            <div className="no-print px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm text-slate-800">
                  {language === 'km' ? 'Official IT Asset Handover Slip / ប័ណ្ណប្រគល់-ទទួល' : 'Official IT Asset Handover Slip'}
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
                  onClick={() => setIsHandoverModalOpen(false)}
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
                    IT EQUIPMENT HANDOVER & CUSTODY ACKNOWLEDGMENT
                  </h1>
                  {language === 'km' && (
                    <div className="text-xs text-slate-600 font-semibold">
                      ប័ណ្ណប្រគល់-ទទួល និងកិច្ចសន្យាថែរក្សាឧបករណ៍បច្ចេកវិទ្យា (IT)
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">{language === 'km' ? 'Document No / លេខប័ណ្ណ:' : 'Document No:'}</span>{' '}
                  <span className="font-mono font-bold text-slate-800">
                    HO-{selectedAssetForHandover.asset_tag}-{new Date().getFullYear()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-500">{language === 'km' ? 'Date / កាលបរិច្ឆេទ:' : 'Date:'}</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {formatDateDMY(selectedAssetForHandover.assigned_date || new Date())}
                  </span>
                </div>
              </div>

              {/* Custodian Information */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  {language === 'km' ? '1. Custodian / Employee Information (ព័ត៌មានបុគ្គលិកទទួល)' : '1. Custodian / Employee Information'}
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Employee Name (ឈ្មោះ):' : 'Employee Name:'}</span>{' '}
                    <span className="font-bold text-slate-900">
                      {selectedAssetForHandover.assigned_employee_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Employee ID (អត្តលេខ):' : 'Employee ID:'}</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedAssetForHandover.assigned_to || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Department (នាយកដ្ឋាន):' : 'Department:'}</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedAssetForHandover.department_name ||
                        selectedAssetForHandover.assigned_department ||
                        selectedAssetForHandover.department ||
                        'Garment Manufacturing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{language === 'km' ? 'Location (ទីតាំង):' : 'Location:'}</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedAssetForHandover.location || 'Head Office / Factory'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipment Specifications */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  {language === 'km' ? '2. IT Equipment Specifications (ព័ត៌មានលម្អិតនៃសម្ភារៈ)' : '2. IT Equipment Specifications'}
                </div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500 w-1/3">{language === 'km' ? 'Asset Tag / លេខកូដសម្ភារៈ:' : 'Asset Tag:'}</td>
                      <td className="px-4 py-2 font-mono font-bold text-blue-700">
                        {selectedAssetForHandover.asset_tag}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Device Name & Model:</td>
                      <td className="px-4 py-2 font-bold text-slate-800">
                        {selectedAssetForHandover.name} ({selectedAssetForHandover.brand} {selectedAssetForHandover.model})
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Category & Condition:</td>
                      <td className="px-4 py-2 text-slate-800">
                        {selectedAssetForHandover.category} • Condition: <strong>{selectedAssetForHandover.condition}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Serial Number (SN):</td>
                      <td className="px-4 py-2 font-mono font-semibold text-slate-800">
                        {selectedAssetForHandover.serial_number || 'N/A'}
                      </td>
                    </tr>
                    {selectedAssetForHandover.mac_address && (
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">MAC Address:</td>
                        <td className="px-4 py-2 font-mono text-slate-800">{selectedAssetForHandover.mac_address}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-500">Hardware Specifications:</td>
                      <td className="px-4 py-2 text-slate-700">
                        {selectedAssetForHandover.specifications ||
                          selectedAssetForHandover.specs ||
                          'Standard factory issue'}
                      </td>
                    </tr>
                    {(selectedAssetForHandover.windows_operation || selectedAssetForHandover.os_version) && (
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Windows Operation / OS:</td>
                        <td className="px-4 py-2 font-semibold text-slate-800">
                          {selectedAssetForHandover.windows_operation || selectedAssetForHandover.os_version}
                        </td>
                      </tr>
                    )}
                    {selectedAssetForHandover.m365_account && (
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Microsoft 365 Account:</td>
                        <td className="px-4 py-2 font-mono font-semibold text-sky-700">
                          {selectedAssetForHandover.m365_account}
                        </td>
                      </tr>
                    )}
                    {(selectedAssetForHandover.local_account || selectedAssetForHandover.device_username || selectedAssetForHandover.username) && (
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Local Account / Username:</td>
                        <td className="px-4 py-2 font-mono text-slate-800">
                          {selectedAssetForHandover.local_account ? `Local Admin: ${selectedAssetForHandover.local_account}` : ''}
                          {selectedAssetForHandover.local_account && (selectedAssetForHandover.device_username || selectedAssetForHandover.username) ? ' • ' : ''}
                          {selectedAssetForHandover.device_username || selectedAssetForHandover.username ? `Sign-in User: ${selectedAssetForHandover.device_username || selectedAssetForHandover.username}` : ''}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Custody Terms & Conditions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 text-[11px] leading-relaxed text-slate-600">
                <div className="font-bold text-slate-800 mb-1">
                  {language === 'km' ? 'Custody Terms & Acknowledgment / លក្ខខណ្ឌ និងការទទួលខុសត្រូវ៖' : 'Custody Terms & Acknowledgment:'}
                </div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    The equipment listed above remains the sole property of <strong>HESTRA (Cambodia) Garment Co., Ltd.</strong>
                  </li>
                  <li>
                    The employee agrees to use the device strictly for official company work and adhere to company cybersecurity and IT policies.
                  </li>
                  <li>
                    In the event of resignation, contract termination, or transfer, the employee shall immediately return this equipment with all accessories in good working condition.
                  </li>
                  {language === 'km' && (
                    <li>
                      សម្ភារៈខាងលើជាទ្រព្យសម្បត្តិផ្លូវការរបស់ក្រុមហ៊ុន ហេស្ត្រា (ខេមបូឌា) ហ្គាម៉ិន ខូអិលធីឌី។ បុគ្គលិកទទួលបន្ទុកថែរក្សា និងត្រូវប្រគល់ជូនក្រុមហ៊ុនវិញនៅពេលបញ្ចប់កិច្ចសន្យាការងារ។
                    </li>
                  )}
                </ol>
              </div>

              {/* Dual Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
                <div className="text-center">
                  <div className="font-bold text-slate-800">{language === 'km' ? 'Handed Over By / អ្នកប្រគល់ (IT Admin)' : 'Handed Over By (IT Admin)'}</div>
                  <div className="text-[11px] text-slate-500">{language === 'km' ? 'IT Department / រដ្ឋបាលបច្ចេកវិទ្យា' : 'IT Department'}</div>
                  <div className="h-16 border-b border-slate-300 mt-2"></div>
                  <div className="mt-2 font-semibold text-slate-700">{currentPersona.name}</div>
                  <div className="text-[10px] text-slate-400">Date: {formatDateDMY(new Date())}</div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-slate-800">{language === 'km' ? 'Received & Acknowledged By / អ្នកទទួល' : 'Received & Acknowledged By'}</div>
                  <div className="text-[11px] text-slate-500">Employee Signature & Thumbprint</div>
                  <div className="h-16 border-b border-slate-300 mt-2"></div>
                  <div className="mt-2 font-semibold text-slate-700">
                    {selectedAssetForHandover.assigned_employee_name || 'Employee'}
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
