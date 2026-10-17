'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Medicine,
  MedicineCategory,
  MedicineStatus,
  EmployeeMedicalRecord,
  MedicineIssuance,
  MedicineStockTransaction,
  MedicalDashboardStats,
  Employee,
  Department,
} from '@/lib/types';
import { getMedicalAccess, computeMedicineStatus } from '@/lib/medical-db';
import { formatLocalizedText } from '@/lib/translations';
import HestraLogo from '@/components/HestraLogo';
import {
  HeartPulse,
  Pill,
  Stethoscope,
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarDays,
  User,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  RefreshCw,
  Printer,
  FileText,
  DollarSign,
  Info,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ClipboardList,
  History,
  FileCheck2,
  Lock,
  CalendarCheck,
} from 'lucide-react';

const MEDICINE_CATEGORIES: MedicineCategory[] = [
  'Analgesics & Antipyretics',
  'Antibiotics',
  'Antihistamines & Allergy',
  'Gastrointestinal',
  'First Aid & Topical',
  'Vitamins & Supplements',
  'Respiratory & Cold',
  'Cardiovascular & Hypertensive',
  'Dermatology & Skin',
  'Eye & Ear Drops',
  'Other',
];

function MedicalManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'overview';
  const initialEmp = searchParams.get('emp') || '';

  const { currentPersona, language, showToast, t } = useApp();
  const permissions = useMemo(() => getMedicalAccess(currentPersona.role), [currentPersona.role]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'records' | 'issuing' | 'stock' | 'reports' | 'permissions'>(
    permissions.isEmployeeOnly ? 'records' : initialTab
  );

  // Core Data States
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [records, setRecords] = useState<EmployeeMedicalRecord[]>([]);
  const [issuances, setIssuances] = useState<MedicineIssuance[]>([]);
  const [transactions, setTransactions] = useState<MedicineStockTransaction[]>([]);
  const [stats, setStats] = useState<MedicalDashboardStats | null>(null);
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters - Inventory
  const [medSearch, setMedSearch] = useState('');
  const [medCategory, setMedCategory] = useState('all');
  const [medStatus, setMedStatus] = useState('all');

  // Filters - Records
  const [recSearch, setRecSearch] = useState('');
  const [recEmpFilter, setRecEmpFilter] = useState(initialEmp);
  const [recDeptFilter, setRecDeptFilter] = useState('all');

  // Filters - Stock History
  const [stockMedFilter, setStockMedFilter] = useState('all');
  const [stockTypeFilter, setStockTypeFilter] = useState('all');

  // Modals
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<'Stock-in' | 'Stock-out' | 'Adjustment' | 'Expired Disposal'>('Stock-in');
  const [selectedStockMedicine, setSelectedStockMedicine] = useState<Medicine | null>(null);

  // Detail Drawer & Print Modal
  const [viewingRecord, setViewingRecord] = useState<EmployeeMedicalRecord | null>(null);
  const [isPrintCertificateOpen, setIsPrintCertificateOpen] = useState(false);

  // -----------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [medRes, recRes, issRes, stkRes, repRes, empRes, deptRes] = await Promise.all([
        fetch('/api/medical/medicines'),
        fetch('/api/medical/records'),
        fetch('/api/medical/issuing'),
        fetch('/api/medical/stock'),
        fetch('/api/medical/reports'),
        fetch('/api/employees'),
        fetch('/api/departments'),
      ]);

      const [medData, recData, issData, stkData, repData, empData, deptData] = await Promise.all([
        medRes.json(),
        recRes.json(),
        issRes.json(),
        stkRes.json(),
        repRes.json(),
        empRes.json(),
        deptRes.json(),
      ]);

      if (medData.medicines) setMedicines(medData.medicines);
      if (medData.stats) setStats(medData.stats);
      if (Array.isArray(recData)) setRecords(recData);
      if (Array.isArray(issData)) setIssuances(issData);
      if (Array.isArray(stkData)) setTransactions(stkData);
      if (repData && !repData.error) setReportsData(repData);
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(deptData)) setDepartments(deptData);
    } catch (err) {
      console.error('Error fetching medical data:', err);
      showToast('Error loading medical data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync tab with employee restriction
  useEffect(() => {
    if (permissions.isEmployeeOnly && activeTab !== 'records') {
      setActiveTab('records');
    }
    if (permissions.isNoMedicalAccess && activeTab !== 'permissions' && activeTab !== 'overview') {
      setActiveTab('permissions');
    }
  }, [permissions]);

  // Filtered Medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchCategory = medCategory === 'all' || m.category === medCategory;
      const matchStatus = medStatus === 'all' || m.status === medStatus;
      const term = medSearch.toLowerCase();
      const matchSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(term)) ||
        m.batch_number.toLowerCase().includes(term) ||
        (m.supplier && m.supplier.toLowerCase().includes(term));
      return matchCategory && matchStatus && matchSearch;
    });
  }, [medicines, medCategory, medStatus, medSearch]);

  // Filtered Medical Records (respecting Employee Role and Manager privacy)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // If Employee role: strictly own records only
      if (permissions.isEmployeeOnly) {
        const isOwn =
          r.employee_id === currentPersona.id ||
          (r.employee_name && currentPersona.name && r.employee_name.toLowerCase().includes(currentPersona.name.toLowerCase()));
        if (!isOwn) return false;
      }

      const matchEmp = !recEmpFilter || r.employee_id === recEmpFilter;
      const matchDept = recDeptFilter === 'all' || r.department_name === recDeptFilter;
      const term = recSearch.toLowerCase();
      const matchSearch =
        !term ||
        (r.employee_name && r.employee_name.toLowerCase().includes(term)) ||
        r.diagnosis.toLowerCase().includes(term) ||
        r.symptoms.toLowerCase().includes(term) ||
        r.doctor_name.toLowerCase().includes(term);
      return matchEmp && matchDept && matchSearch;
    });
  }, [records, recEmpFilter, recDeptFilter, recSearch, permissions, currentPersona]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchMed = stockMedFilter === 'all' || t.medicine_id === stockMedFilter;
      const matchType = stockTypeFilter === 'all' || t.transaction_type === stockTypeFilter;
      return matchMed && matchType;
    });
  }, [transactions, stockMedFilter, stockTypeFilter]);

  // Alerts
  const lowStockAlerts = useMemo(() => {
    return medicines.filter((m) => m.quantity_in_stock <= m.min_stock_level || m.status === 'Low Stock' || m.status === 'Out of Stock');
  }, [medicines]);

  const expiringAlerts = useMemo(() => {
    return medicines.filter((m) => m.status === 'Expiring Soon');
  }, [medicines]);

  const expiredAlerts = useMemo(() => {
    return medicines.filter((m) => m.status === 'Expired');
  }, [medicines]);

  // -----------------------------------------------------------
  // Action Handlers
  // -----------------------------------------------------------
  const handleOpenRestock = (med: Medicine) => {
    setSelectedStockMedicine(med);
    setStockModalType('Stock-in');
    setIsStockModalOpen(true);
  };

  const handleOpenDisposal = (med: Medicine) => {
    setSelectedStockMedicine(med);
    setStockModalType('Expired Disposal');
    setIsStockModalOpen(true);
  };

  const handleExportMedicinesCSV = () => {
    if (medicines.length === 0) return;
    const headers = [
      'ID',
      'Medicine Name',
      'Generic Name',
      'Category',
      'Unit',
      'Dosage',
      'Supplier',
      'Batch Number',
      'Expiry Date',
      'Qty in Stock',
      'Min Stock Level',
      'Purchase Price USD',
      'Status',
      'Storage Location',
    ];
    const rows = medicines.map((m) => [
      m.id,
      `"${m.name}"`,
      `"${m.generic_name || ''}"`,
      `"${m.category}"`,
      `"${m.unit}"`,
      `"${m.dosage}"`,
      `"${m.supplier || ''}"`,
      `"${m.batch_number}"`,
      m.expiry_date,
      m.quantity_in_stock,
      m.min_stock_level,
      m.purchase_price,
      `"${m.status}"`,
      `"${m.storage_location || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `hestra_medicine_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'km' ? 'បានទាញយកទិន្នន័យឱសថជា CSV' : 'Medicine inventory exported to CSV', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH QUICK STATS                        */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-300 text-xs font-bold mb-3 backdrop-blur-xs border border-white/10">
              <HeartPulse size={14} className="text-rose-400 animate-pulse" />
              <span>HESTRA HRM • HEALTH & MEDICAL MANAGEMENT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{language === 'km' ? 'គ្រប់គ្រងសុខភាព & ឱសថ' : 'Medicine & Medical Management'}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              {language === 'km'
                ? 'ប្រព័ន្ធគ្រប់គ្រងសារពើភ័ណ្ឌឱសថ កំណត់ត្រាសុខភាពបុគ្គលិក ការបើកថ្នាំស្វ័យប្រវត្តិកាត់ស្តុក និងការអនុលោមតាមសុខុមាលភាពការងារ'
                : 'Enterprise medicine inventory, electronic clinical records, automated stock-deducted dispensary, and occupational health compliance.'}
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {permissions.canManageRecords && (
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-900/30 cursor-pointer active:scale-95"
              >
                <Stethoscope size={16} />
                <span>{language === 'km' ? 'កត់ត្រាពិនិត្យជំងឺ' : 'Log Medical Visit'}</span>
              </button>
            )}

            {permissions.canIssueMedicine && (
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/30 cursor-pointer active:scale-95"
              >
                <Pill size={16} />
                <span>{language === 'km' ? 'បើកផ្តល់ឱសថ' : 'Dispense Medicine'}</span>
              </button>
            )}

            {permissions.canManageMedicine && (
              <button
                onClick={() => {
                  setEditingMedicine(null);
                  setIsMedicineModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 transition-all border border-white/15 cursor-pointer"
              >
                <Plus size={16} />
                <span>{language === 'km' ? 'បញ្ចូលឱសថថ្មី' : 'Add Medicine'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setRefreshing(true);
                fetchAllData();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LIVE ALERTS BANNER (Low stock, Expiring, Expired)    */}
      {/* ======================================================== */}
      {(lowStockAlerts.length > 0 || expiringAlerts.length > 0 || expiredAlerts.length > 0) && !permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lowStockAlerts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-800">
                    {language === 'km' ? 'ការជូនដំណឹងស្តុកទាប' : 'Low Stock Alert'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px]">
                    {lowStockAlerts.length} SKUs
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1 line-clamp-1">
                  {lowStockAlerts.map((m) => `${m.name} (${m.quantity_in_stock} left)`).join(', ')}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('inventory');
                    setMedStatus('Low Stock');
                  }}
                  className="mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'km' ? 'ពិនិត្យ & បញ្ជាទិញបន្ថែម' : 'Review & Reorder'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {expiringAlerts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-orange-50/90 border border-orange-200 text-orange-900 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-orange-800">
                    {language === 'km' ? 'ជិតផុតកំណត់ (< 30 ថ្ងៃ)' : 'Expiring Soon Alert'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 font-black text-[10px]">
                    {expiringAlerts.length} SKUs
                  </span>
                </div>
                <p className="text-xs text-orange-700 mt-1 line-clamp-1">
                  {expiringAlerts.map((m) => `${m.name} (Exp: ${m.expiry_date})`).join(', ')}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('inventory');
                    setMedStatus('Expiring Soon');
                  }}
                  className="mt-2 text-[11px] font-bold text-orange-800 hover:text-orange-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'km' ? 'តាមដានថ្ងៃផុតកំណត់' : 'Inspect Expiry Dates'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {expiredAlerts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                <AlertCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-rose-800">
                    {language === 'km' ? 'ឱសថផុតកំណត់' : 'Expired Medicine Alert'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-black text-[10px]">
                    {expiredAlerts.length} SKUs
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-1 line-clamp-1">
                  {expiredAlerts.map((m) => `${m.name} (Quarantined)`).join(', ')}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('stock');
                    setStockTypeFilter('Expired Disposal');
                  }}
                  className="mt-2 text-[11px] font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'km' ? 'កត់ត្រាកម្ទេចចោលដោយសុវត្ថិភាព' : 'Safe Disposal & Quarantine'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NAVIGATION TABS                                     */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 py-1.5 rounded-2xl shadow-2xs overflow-x-auto no-scrollbar">
        {!permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity size={15} />
            <span>{language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង & ស្ថិតិ' : 'Dashboard & Overview'}</span>
          </button>
        )}

        {!permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package size={15} />
            <span>{language === 'km' ? 'សារពើភ័ណ្ឌឱសថ (Inventory)' : 'Medicine Inventory'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'inventory' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {medicines.length}
            </span>
          </button>
        )}

        {!permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Stethoscope size={15} />
            <span>{permissions.isEmployeeOnly ? (language === 'km' ? 'កំណត់ត្រាសុខភាពរបស់ខ្ញុំ' : 'My Medical Records') : (language === 'km' ? 'កំណត់ត្រាសុខភាពបុគ្គលិក' : 'Employee Medical Records')}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'records' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {filteredRecords.length}
            </span>
          </button>
        )}

        {!permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('issuing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'issuing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Pill size={15} />
            <span>{language === 'km' ? 'ការបើកផ្តល់ឱសថ (Issuing)' : 'Medicine Issuing'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'issuing' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {issuances.length}
            </span>
          </button>
        )}

        {!permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History size={15} />
            <span>{language === 'km' ? 'គ្រប់គ្រងស្តុក & តាមដាន (Stock Control)' : 'Stock Control'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'stock' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {transactions.length}
            </span>
          </button>
        )}

        {!permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={15} />
            <span>{language === 'km' ? 'របាយការណ៍ & វិភាគ (Reports)' : 'Reports & Dashboard'}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ml-auto ${
            activeTab === 'permissions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Shield size={14} />
          <span>{language === 'km' ? 'សិទ្ធិ & RBAC Guide' : 'Permissions & Roles'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS                    */}
      {/* ======================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Medicines Stock */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'km' ? 'ឱសថក្នុងស្តុកសរុប' : 'Total Stock Units'}
                </span>
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Package size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalStockUnits.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-semibold">units ({stats.totalMedicines} SKUs)</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{language === 'km' ? 'តម្លៃសារពើភ័ណ្ឌ:' : 'Inventory Value:'}</span>
                <span className="font-bold text-slate-900">${stats.totalInventoryValue.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. Low Stock Alerts */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'km' ? 'ឱសថជិតអស់ពីស្តុក' : 'Low-Stock Medicines'}
                </span>
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600">{stats.lowStockCount}</span>
                <span className="text-xs text-slate-500 font-semibold">items below threshold</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{language === 'km' ? 'ជិតផុតកំណត់:' : 'Expiring Soon:'}</span>
                <span className="font-bold text-orange-600">{stats.expiringCount} items</span>
              </div>
            </div>

            {/* 3. Monthly Employee Visits */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'km' ? 'ការពិនិត្យជំងឺខែនេះ' : 'Visits This Month'}
                </span>
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                  <HeartPulse size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalVisitsMonth}</span>
                <span className="text-xs text-slate-500 font-semibold">consultations</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{language === 'km' ? 'ច្បាប់ឈឺបានអនុម័ត:' : 'Sick Leaves Granted:'}</span>
                <span className="font-bold text-indigo-600">{stats.totalSickLeaveDaysMonth} days</span>
              </div>
            </div>

            {/* 4. Monthly Medicine Cost */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'km' ? 'ចំណាយឱសថខែនេះ' : 'Monthly Medical Cost'}
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">${stats.medicalCostMonth.toFixed(2)}</span>
                <span className="text-xs text-slate-500 font-semibold">USD</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{language === 'km' ? 'ចំនួនថ្នាំបានបើក:' : 'Total Units Dispensed:'}</span>
                <span className="font-bold text-slate-900">{stats.totalIssuedMonth} units</span>
              </div>
            </div>
          </div>

          {/* Quick Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Dispensed Medicines */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === 'km' ? 'ឱសថដែលបានបើកច្រើនជាងគេ' : 'Top Dispensed Medications'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' ? 'និន្នាការនៃការប្រើប្រាស់ថ្នាំក្នុងគ្លីនិកការងារ' : 'High-frequency dispensary items for workplace health'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'km' ? 'មើលរបាយការណ៍ពេញ' : 'View Full Report'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5">Medicine</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5">Remaining Stock</th>
                      <th className="pb-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicines.slice(0, 5).map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5">
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] text-slate-400 block">{m.generic_name} • {m.dosage}</span>
                        </td>
                        <td className="py-2.5 text-slate-600 font-medium">{m.category}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-slate-900">{m.quantity_in_stock}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{m.unit}</span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              m.status === 'In Stock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : m.status === 'Expiring Soon'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Clinic Consultations */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === 'km' ? 'ការពិនិត្យថ្មីៗ' : 'Recent Consultations'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('records')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {records.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setViewingRecord(r)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 transition-all cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{r.employee_name || 'Staff Employee'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{r.visit_date}</span>
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-1 font-medium">
                        {r.diagnosis}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>{r.doctor_name}</span>
                        {Number(r.medical_leave_granted || 0) > 0 ? (
                          <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                            {r.medical_leave_days}d Med Leave
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Fit for Duty</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Hestra Occupational Clinic</span>
                <span className="font-bold text-indigo-600">On-Site Nurse & Doctor</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEDICINE INVENTORY (All user required fields)     */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && !permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-56 flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  placeholder={language === 'km' ? 'ស្វែងរកឱសថ, Generic, បាច់...' : 'Search medicine, generic, batch...'}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={medCategory}
                onChange={(e) => setMedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none bg-white cursor-pointer"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទ (All Categories)' : 'All Categories'}</option>
                {MEDICINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={medStatus}
                onChange={(e) => setMedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none bg-white cursor-pointer"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព (All Statuses)' : 'All Statuses'}</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMedicinesCSV}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              {permissions.canManageMedicine && (
                <button
                  onClick={() => {
                    setEditingMedicine(null);
                    setIsMedicineModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{language === 'km' ? 'បន្ថែមឱសថ' : 'Add Medicine'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Medicines Master Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Medicine & Generic Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit / Dosage</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right">Min Level</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Pill size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-slate-600">No medicines found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((m) => {
                      const isLowStock = m.quantity_in_stock <= m.min_stock_level;
                      const isExpired = m.status === 'Expired';
                      const isExpiring = m.status === 'Expiring Soon';

                      return (
                        <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors">
                          {/* Name & Generic Name */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[11px] text-slate-400 block">{m.generic_name || '—'}</span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                              {m.category}
                            </span>
                          </td>

                          {/* Unit / Dosage */}
                          <td className="py-3 px-4 text-slate-700">
                            <div>{m.dosage}</div>
                            <span className="text-[10px] text-slate-400">{m.unit}</span>
                          </td>

                          {/* Supplier */}
                          <td className="py-3 px-4 text-slate-600">
                            {m.supplier || '—'}
                          </td>

                          {/* Batch Number */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {m.batch_number}
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3 px-4">
                            <span className={`font-mono text-xs ${isExpired ? 'text-rose-600 font-bold' : isExpiring ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>
                              {m.expiry_date}
                            </span>
                          </td>

                          {/* Quantity In Stock */}
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-black ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                              {m.quantity_in_stock.toLocaleString()}
                            </span>
                          </td>

                          {/* Min Stock Level */}
                          <td className="py-3 px-4 text-right text-slate-400 font-medium">
                            {m.min_stock_level}
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3 px-4 text-right text-slate-700 font-medium">
                            ${m.purchase_price.toFixed(2)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                m.status === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : m.status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                  : m.status === 'Expiring Soon'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : m.status === 'Expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Restock */}
                              {permissions.canControlStock && (
                                <button
                                  onClick={() => handleOpenRestock(m)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Receive Stock-In"
                                >
                                  <PackagePlus size={14} />
                                </button>
                              )}

                              {/* Safe Disposal if expired */}
                              {permissions.canControlStock && isExpired && (
                                <button
                                  onClick={() => handleOpenDisposal(m)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                                  title="Safe Disposal of Expired Batch"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}

                              {/* Edit */}
                              {permissions.canManageMedicine && (
                                <button
                                  onClick={() => {
                                    setEditingMedicine(m);
                                    setIsMedicineModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Edit Medicine"
                                >
                                  <Edit size={14} />
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

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredMedicines.length} of {medicines.length} inventory medicines</span>
              <span className="font-semibold text-slate-700">HESTRA Clinic Pharmacy Standards</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: EMPLOYEE MEDICAL RECORDS (Full Electronic Chart)  */}
      {/* ======================================================== */}
      {activeTab === 'records' && !permissions.isNoMedicalAccess && (
        <div className="space-y-4">
          {/* Record Search & Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-56 flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិក, រោគវិនិច្ឆ័យ...' : 'Search employee, diagnosis, symptoms...'}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {!permissions.isEmployeeOnly && (
                <select
                  value={recDeptFilter}
                  onChange={(e) => setRecDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ផ្នែក (All Departments)' : 'All Departments'}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            {permissions.canManageRecords && (
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus size={15} />
                <span>{language === 'km' ? 'កត់ត្រាការពិនិត្យថ្មី' : 'New Medical Consultation'}</span>
              </button>
            )}
          </div>

          {/* Records Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                <Stethoscope size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
                <p className="font-semibold text-slate-600">No medical consultation records found.</p>
              </div>
            ) : (
              filteredRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Employee & Date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {r.employee_avatar ? (
                          <img
                            src={r.employee_avatar}
                            alt={r.employee_name || 'Staff'}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center ring-2 ring-slate-100 shrink-0">
                            {r.employee_name ? r.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{r.employee_name || 'Staff Member'}</h4>
                          <span className="text-[10px] text-slate-400 block">{r.department_name || r.employee_role || 'Staff'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {r.visit_date}
                      </span>
                    </div>

                    {/* Diagnosis & Symptoms */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{r.diagnosis}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        <strong className="text-slate-700">Reason/Symptoms:</strong> {r.symptoms}
                      </p>
                    </div>

                    {/* Vitals Ribbon */}
                    {(r.temperature || r.blood_pressure || r.heart_rate) && (
                      <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        {r.temperature && <span>Temp: <strong>{r.temperature}°C</strong></span>}
                        {r.blood_pressure && <span>BP: <strong>{r.blood_pressure}</strong></span>}
                        {r.heart_rate && <span>HR: <strong>{r.heart_rate} bpm</strong></span>}
                      </div>
                    )}

                    {/* Prescriptions */}
                    {r.medicine_prescribed && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                        <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                          <Pill size={12} />
                          <span>Prescription</span>
                        </div>
                        <p className="font-bold text-rose-950 text-xs">{r.medicine_prescribed}</p>
                        <p className="text-[11px] text-rose-800">
                          {r.dosage} • {r.frequency} • {r.duration}
                        </p>
                      </div>
                    )}

                    {/* Medical Notes (Clinical confidentiality) */}
                    {r.medical_notes && permissions.canViewConfidentialNotes && (
                      <div className="mt-2.5 text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        &ldquo;{r.medical_notes}&rdquo;
                      </div>
                    )}

                    {/* Medical Leave Badge if granted */}
                    {Number(r.medical_leave_granted || 0) > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        <CalendarCheck size={14} className="text-amber-600" />
                        <span>Granted {r.medical_leave_days} Day(s) Medical Leave</span>
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Dr. {r.doctor_name}</span>
                    <button
                      onClick={() => setViewingRecord(r)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye size={13} />
                      <span>{language === 'km' ? 'ពិនិត្យលម្អិត' : 'View Chart'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MEDICINE ISSUING (Auto-Deduct Dispensing Console)  */}
      {/* ======================================================== */}
      {activeTab === 'issuing' && !permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'km' ? 'កំណត់ត្រាបើកថ្នាំស្វ័យប្រវត្តិកាត់ស្តុក' : 'Automated Stock-Deducted Medicine Dispensing Log'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'km'
                  ? 'រាល់ការបើកផ្តល់ថ្នាំ នឹងកាត់ស្តុកស្វ័យប្រវត្តិចេញពីសារពើភ័ណ្ឌភ្លាមៗ'
                  : 'Every dispensing event automatically debits pharmacy inventory balance.'}
              </p>
            </div>

            {permissions.canIssueMedicine && (
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus size={15} />
                <span>{language === 'km' ? 'បើកផ្តល់ថ្នាំថ្មី' : 'Dispense Medicine'}</span>
              </button>
            )}
          </div>

          {/* Issuances Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Employee Recipient</th>
                    <th className="py-3 px-4">Medicine Issued</th>
                    <th className="py-3 px-4">Dosage & Instructions</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Issued By</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {issuances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Pill size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-slate-600">No medicine issuance records found.</p>
                      </td>
                    </tr>
                  ) : (
                    issuances.map((iss) => (
                      <tr key={iss.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {iss.employee_avatar ? (
                              <img
                                src={iss.employee_avatar}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                                {iss.employee_name ? iss.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block">{iss.employee_name || 'Staff Employee'}</span>
                              <span className="text-[10px] text-slate-400 block">{iss.department_name || iss.employee_id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{iss.medicine_name}</span>
                          <span className="text-[10px] text-slate-400">{iss.generic_name}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          <div>{iss.prescription_instruction}</div>
                          {iss.frequency && <span className="text-[10px] text-slate-400">{iss.frequency} • {iss.duration}</span>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-rose-600 text-sm">
                            -{iss.quantity_issued}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">{iss.unit || 'units'}</span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {iss.batch_number || '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {iss.issued_by}
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {iss.issued_at?.replace('T', ' ').slice(0, 16)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ${iss.total_cost?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Total Dispensary Records: {issuances.length}</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Automatic Stock Deductions Verified</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: STOCK CONTROL & AUDIT HISTORY                     */}
      {/* ======================================================== */}
      {activeTab === 'stock' && !permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Filter by medicine */}
              <select
                value={stockMedFilter}
                onChange={(e) => setStockMedFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none bg-white cursor-pointer"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ឱសថ (All Medicines)' : 'All Medicines'}</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              {/* Filter by transaction type */}
              <select
                value={stockTypeFilter}
                onChange={(e) => setStockTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none bg-white cursor-pointer"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទប្រតិបត្តិការ' : 'All Transaction Types'}</option>
                <option value="Stock-in">Stock-in</option>
                <option value="Stock-out">Stock-out</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Expired Disposal">Expired Disposal</option>
                <option value="Issue Deduction">Issue Deduction</option>
              </select>
            </div>

            {permissions.canControlStock && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedStockMedicine(null);
                    setStockModalType('Stock-in');
                    setIsStockModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <PackagePlus size={15} />
                  <span>Receive Stock-in</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStockMedicine(null);
                    setStockModalType('Adjustment');
                    setIsStockModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Inventory Adjustment</span>
                </button>
              </div>
            )}
          </div>

          {/* Stock Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-center">Stock Change</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Supplier / Reference</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <History size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-slate-600">No stock control transactions logged.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isAddition = tx.transaction_type === 'Stock-in' || tx.transaction_type === 'Return';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                tx.transaction_type === 'Stock-in'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : tx.transaction_type === 'Expired Disposal'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : tx.transaction_type === 'Adjustment'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : tx.transaction_type === 'Issue Deduction'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {tx.transaction_type}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{tx.medicine_name}</span>
                            <span className="text-[10px] text-slate-400">{tx.generic_name}</span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className={`font-black text-sm ${isAddition ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {isAddition ? `+${tx.quantity}` : `-${tx.quantity}`}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                            {tx.previous_stock} &rarr; <strong className="text-slate-900">{tx.new_stock}</strong>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {tx.batch_number || '—'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <div>{tx.supplier_or_dest || tx.reference_id || '—'}</div>
                            {tx.notes && <span className="text-[10px] text-slate-400 block truncate max-w-xs">{tx.notes}</span>}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {tx.performed_by}
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {tx.created_at?.replace('T', ' ').slice(0, 16)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Audit Trail Logs: {transactions.length} events</span>
              <span className="font-semibold text-slate-700">Permanent Ledger Integrity</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: REPORTS & ANALYTICS                               */}
      {/* ======================================================== */}
      {activeTab === 'reports' && reportsData && !permissions.isEmployeeOnly && !permissions.isNoMedicalAccess && (
        <div className="space-y-6">
          {/* Section 1: Usage by Month & Cost by Department */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medicine Usage by Month */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === 'km' ? 'ការប្រើប្រាស់ឱសថតាមខែ (Usage by Month)' : 'Medicine Usage by Month'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' ? 'បរិមាណថ្នាំបានបើក និងតម្លៃសរុប ៦ ខែចុងក្រោយ' : 'Monthly units dispensed and financial value over past 6 months'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {reportsData.monthlyUsage?.map((m: any) => {
                  const maxUnits = Math.max(...reportsData.monthlyUsage.map((u: any) => u.units), 20);
                  const pct = Math.min(100, Math.round((m.units / maxUnits) * 100));

                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{m.monthName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-600 font-bold">{m.units} units</span>
                          <span className="text-slate-500 font-normal">(${m.cost.toFixed(2)})</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medical Cost & Visits by Department */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === 'km' ? 'ចំណាយវេជ្ជសាស្ត្រតាមនាយកដ្ឋាន' : 'Medical Cost by Department'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' ? 'ការបែងចែកថវិកាព្យាបាល និងចំនួនការពិនិត្យតាមផ្នែក' : 'Breakdown of pharmaceutical expense allocation by business unit'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {reportsData.costByDepartment?.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-8 text-center">No departmental costs recorded yet.</p>
                ) : (
                  reportsData.costByDepartment?.map((dept: any) => (
                    <div key={dept.department_name} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{dept.department_name}</span>
                        <span className="text-[10px] text-slate-500">{dept.prescriptions_count} prescriptions issued</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-950 block">${dept.total_medical_cost.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">Total Med Cost</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Top Diagnoses & Medicine Consumption Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Diagnoses */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {language === 'km' ? 'ជំងឺដែលជួបប្រទះញឹកញាប់បំផុត' : 'Most Frequent Clinic Diagnoses'}
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                {language === 'km' ? 'ទិន្នន័យជំងឺទូទៅក្នុងរោងចក្រ និងការិយាល័យ' : 'Epidemiological trends for occupational ergonomics & preventive health'}
              </p>

              <div className="space-y-2.5">
                {reportsData.topDiagnoses?.map((d: any, idx: number) => (
                  <div key={d.diagnosis} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{d.diagnosis}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-extrabold text-[10px]">
                      {d.count} visits
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Medicine Consumption Trends */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {language === 'km' ? 'និន្នាការនៃការប្រើប្រាស់ឱសថ' : 'Medicine Consumption Trends'}
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">
                {language === 'km' ? 'ឱសថដែលមានចរាចរណ៍លឿន (Fast Moving Items)' : 'Fast-moving pharmaceutical inventory items'}
              </p>

              <div className="space-y-2.5">
                {reportsData.consumptionTrends?.map((item: any) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.category} • In Stock: {item.quantity_in_stock} {item.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-600 block">{item.total_issued} dispensed</span>
                      <span className="text-[10px] text-slate-400">${item.total_expense.toFixed(2)} value</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: PERMISSIONS & RBAC SPECIFICATION                 */}
      {/* ======================================================== */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'km' ? 'តារាងសិទ្ធិប្រើប្រាស់ប្រព័ន្ធវេជ្ជសាស្ត្រ (RBAC Matrix)' : 'Role-Based Access Control (RBAC) Specification'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'km' ? 'ការកំណត់សិទ្ធិស្របតាមតម្រូវការផ្លូវការរបស់ Hestra HRM' : 'Formal role matrix recommended for medical privacy & clinical operations'}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Access Level</th>
                    <th className="py-3 px-4">Medical Inventory</th>
                    <th className="py-3 px-4">Clinical Records</th>
                    <th className="py-3 px-4">Dispensing & Issuing</th>
                    <th className="py-3 px-4">Stock Control</th>
                    <th className="py-3 px-4">Reports & Costs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className={currentPersona.role === 'Admin' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      <span>HR Admin</span>
                    </td>
                    <td className="py-3 px-4 text-purple-700 font-bold">Full medical management</td>
                    <td className="py-3 px-4 text-emerald-600">Full (Create/Edit/Delete)</td>
                    <td className="py-3 px-4 text-emerald-600">Full Chart Access</td>
                    <td className="py-3 px-4 text-emerald-600">Yes</td>
                    <td className="py-3 px-4 text-emerald-600">Full Audit</td>
                    <td className="py-3 px-4 text-emerald-600">Full Cost & Trends</td>
                  </tr>

                  <tr className={currentPersona.role === 'Medical Officer' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Medical Officer</span>
                    </td>
                    <td className="py-3 px-4 text-rose-700 font-bold">Medical records + medicine</td>
                    <td className="py-3 px-4 text-emerald-600">Full (Stock & Expiry)</td>
                    <td className="py-3 px-4 text-emerald-600">Full Clinical Notes</td>
                    <td className="py-3 px-4 text-emerald-600">Yes (Auto-deduct)</td>
                    <td className="py-3 px-4 text-emerald-600">Yes</td>
                    <td className="py-3 px-4 text-emerald-600">Full Medical Analytics</td>
                  </tr>

                  <tr className={currentPersona.role === 'HR Officer' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                      <span>HR Officer</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-700 font-bold">Employee medical information</td>
                    <td className="py-3 px-4 text-slate-500">View Catalog</td>
                    <td className="py-3 px-4 text-slate-700">General diagnoses & leaves</td>
                    <td className="py-3 px-4 text-slate-400">Read only</td>
                    <td className="py-3 px-4 text-slate-400">Read only</td>
                    <td className="py-3 px-4 text-slate-700">Summary Reports</td>
                  </tr>

                  <tr className={currentPersona.role === 'Manager' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>Manager</span>
                    </td>
                    <td className="py-3 px-4 text-blue-700 font-bold">Limited / summary information</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-500">Anonymized team stats</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-700">Summary Only</td>
                  </tr>

                  <tr className={currentPersona.role === 'Employee' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Employee</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">Own medical records only</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-emerald-700">Own Visits & Prescriptions</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                  </tr>

                  <tr className={currentPersona.role === 'IT Support' ? 'bg-indigo-50/70 font-bold' : ''}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>IT Support</span>
                    </td>
                    <td className="py-3 px-4 text-amber-700 font-bold">System administration, no medical details</td>
                    <td className="py-3 px-4 text-slate-300">No Medical Access</td>
                    <td className="py-3 px-4 text-rose-500 font-bold">Strictly Restricted</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                    <td className="py-3 px-4 text-slate-300">No Access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT MEDICINE                             */}
      {/* ======================================================== */}
      {isMedicineModalOpen && (
        <MedicineFormModal
          medicine={editingMedicine}
          onClose={() => setIsMedicineModalOpen(false)}
          onSuccess={() => {
            setIsMedicineModalOpen(false);
            fetchAllData();
            showToast(
              editingMedicine
                ? (language === 'km' ? 'បានកែប្រែព័ត៌មានឱសថដោយជោគជ័យ' : 'Medicine updated successfully')
                : (language === 'km' ? 'បានបញ្ចូលឱសថថ្មីជោគជ័យ' : 'Medicine added successfully'),
              'success'
            );
          }}
          language={language}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: NEW MEDICAL CONSULTATION VISIT                  */}
      {/* ======================================================== */}
      {isRecordModalOpen && (
        <MedicalRecordFormModal
          employees={employees}
          medicines={medicines}
          onClose={() => setIsRecordModalOpen(false)}
          onSuccess={() => {
            setIsRecordModalOpen(false);
            fetchAllData();
            showToast(
              language === 'km'
                ? 'បានកត់ត្រាការពិនិត្យសុខភាព & បើកថ្នាំជោគជ័យ'
                : 'Medical consultation & prescription recorded successfully',
              'success'
            );
          }}
          language={language}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3: MEDICINE ISSUING (AUTO STOCK DEDUCT)            */}
      {/* ======================================================== */}
      {isIssueModalOpen && (
        <MedicineIssueModal
          employees={employees}
          medicines={medicines.filter((m) => m.quantity_in_stock > 0 && m.status !== 'Expired')}
          currentUserName={currentPersona.name}
          onClose={() => setIsIssueModalOpen(false)}
          onSuccess={() => {
            setIsIssueModalOpen(false);
            fetchAllData();
            showToast(
              language === 'km'
                ? 'បានបើកផ្តល់ថ្នាំ និងកាត់ស្តុកស្វ័យប្រវត្តិកាត់រួចរាល់ ✓'
                : 'Medicine issued & inventory balance automatically deducted ✓',
              'success'
            );
          }}
          language={language}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 4: STOCK CONTROL TRANSACTION                       */}
      {/* ======================================================== */}
      {isStockModalOpen && (
        <StockTransactionModal
          medicines={medicines}
          selectedMedicine={selectedStockMedicine}
          initialType={stockModalType}
          currentUserName={currentPersona.name}
          onClose={() => setIsStockModalOpen(false)}
          onSuccess={() => {
            setIsStockModalOpen(false);
            fetchAllData();
            showToast(
              language === 'km'
                ? 'បានកត់ត្រាប្រតិបត្តិការស្តុកជោគជ័យ'
                : 'Stock transaction recorded successfully',
              'success'
            );
          }}
          language={language}
        />
      )}

      {/* ======================================================== */}
      {/* DRAWER: DETAILED MEDICAL CHART & PRINTABLE CERTIFICATE   */}
      {/* ======================================================== */}
      {viewingRecord && (
        <MedicalChartDrawer
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          language={language}
          permissions={permissions}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: MEDICINE FORM MODAL (Add / Edit)
// =========================================================================
function MedicineFormModal({
  medicine,
  onClose,
  onSuccess,
  language,
}: {
  medicine: Medicine | null;
  onClose: () => void;
  onSuccess: () => void;
  language: string;
}) {
  const [formData, setFormData] = useState(() => ({
    name: medicine?.name || '',
    generic_name: medicine?.generic_name || '',
    category: medicine?.category || 'Analgesics & Antipyretics',
    unit: medicine?.unit || 'Tablets',
    dosage: medicine?.dosage || '500mg',
    supplier: medicine?.supplier || 'Pharma Product Manufacturing (PPM)',
    batch_number: medicine?.batch_number || `BATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 90 + 10)}`,
    expiry_date: medicine?.expiry_date || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    quantity_in_stock: medicine?.quantity_in_stock !== undefined ? medicine.quantity_in_stock : 100,
    min_stock_level: medicine?.min_stock_level !== undefined ? medicine.min_stock_level : 20,
    purchase_price: medicine?.purchase_price !== undefined ? medicine.purchase_price : 0.1,
    storage_location: medicine?.storage_location || 'Clinic Cabinet A1',
    description: medicine?.description || '',
    side_effects: medicine?.side_effects || '',
  }));

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = '/api/medical/medicines';
      const method = medicine ? 'PATCH' : 'POST';
      const payload = medicine ? { ...formData, id: medicine.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save medicine');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Pill size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {medicine
                  ? (language === 'km' ? 'កែប្រែព័ត៌មានឱសថ' : 'Edit Medicine SKU')
                  : (language === 'km' ? 'បញ្ចូលឱសថថ្មីក្នុងសារពើភ័ណ្ឌ' : 'Add New Medicine to Inventory')}
              </h3>
              <p className="text-[10px] text-slate-500">HESTRA Clinic Pharmacy Standards</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Medicine Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Paracetamol 500mg"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Generic Name
              </label>
              <input
                type="text"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                placeholder="e.g., Acetaminophen"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {MEDICINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Dosage <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg, 10mg, 100ml"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Unit of Measure <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., Tablets, Capsules, Bottles, Sachets"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., Pharma Product Manufacturing (PPM)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="e.g., PPM-2026-PC01"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Quantity in Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData({ ...formData, quantity_in_stock: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Minimum Stock Level (Alert Trigger)
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Purchase Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={formData.storage_location}
                onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                placeholder="e.g., Clinic Cabinet A1, Fridge #1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Indications & Clinical Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="First-line analgesic, directions, precautions..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : medicine ? 'Update Medicine' : 'Add to Pharmacy Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: MEDICAL RECORD FORM MODAL (New Consultation Visit)
// =========================================================================
function MedicalRecordFormModal({
  employees,
  medicines,
  onClose,
  onSuccess,
  language,
}: {
  employees: Employee[];
  medicines: Medicine[];
  onClose: () => void;
  onSuccess: () => void;
  language: string;
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [temperature, setTemperature] = useState('37.0');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState('78');
  const [weightKg, setWeightKg] = useState('60');
  const [doctorName, setDoctorName] = useState('Dr. Chea Sokhom (Chief Medical Officer)');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('Return to regular duty');
  const [medicalLeaveGranted, setMedicalLeaveGranted] = useState(false);
  const [medicalLeaveDays, setMedicalLeaveDays] = useState('1');

  // Multi-prescription items
  const [prescriptions, setPrescriptions] = useState<
    Array<{ medicine_id: string; quantity: number; dosage: string; frequency: string; duration: string; instruction: string }>
  >([]);

  const [submitting, setSubmitting] = useState(false);

  const handleAddMedicineToPrescription = () => {
    if (medicines.length === 0) return;
    const defaultMed = medicines.find((m) => m.quantity_in_stock > 0) || medicines[0];
    setPrescriptions([
      ...prescriptions,
      {
        medicine_id: defaultMed.id,
        quantity: 10,
        dosage: defaultMed.dosage,
        frequency: '3 times daily after meals',
        duration: '3 days',
        instruction: `Take ${defaultMed.dosage} after meals`,
      },
    ]);
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !symptoms.trim() || !diagnosis.trim()) {
      alert('Please fill all required consultation fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Build summary string of medicines
      const summaryPrescriptions = prescriptions
        .map((p) => {
          const med = medicines.find((m) => m.id === p.medicine_id);
          return `${med?.name || ''} (${p.quantity} units - ${p.frequency})`;
        })
        .join(', ');

      const res = await fetch('/api/medical/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          visit_date: visitDate,
          visit_time: visitTime,
          symptoms,
          diagnosis,
          temperature: temperature ? Number(temperature) : null,
          blood_pressure: bloodPressure,
          heart_rate: heartRate ? Number(heartRate) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          doctor_name: doctorName,
          medical_notes: medicalNotes,
          recommended_action: recommendedAction,
          medical_leave_granted: medicalLeaveGranted ? 1 : 0,
          medical_leave_days: medicalLeaveGranted ? Number(medicalLeaveDays) : 0,
          medicine_prescribed: summaryPrescriptions,
          medicinesToIssue: prescriptions,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save medical consultation');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-rose-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'km' ? 'កត់ត្រាការពិនិត្យជំងឺបុគ្គលិកថ្មី' : 'Log New Employee Medical Consultation'}
              </h3>
              <p className="text-[10px] text-slate-500">HESTRA Clinic Diagnostic & Prescription Registry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Patient Selection & Visit Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.id}) • {emp.department_name || ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Consultation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Time of Visit
              </label>
              <input
                type="text"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Symptoms / Reason for Visit <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="High fever 38.5°C, headache, dehydration, laceration..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Acute Upper Respiratory Tract Infection, Minor Laceration..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vital Signs Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Vital Signs & Triage
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="37.0"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Blood Pressure</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="76"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="60"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Prescription & Auto-Stock Deduction Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill size={15} className="text-indigo-600" />
                  <span>Prescribe Medicines & Auto-Deduct Stock</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Medicines added here will be automatically deducted from pharmacy inventory upon submission.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddMedicineToPrescription}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Med</span>
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-2">
                No medicines prescribed for this visit. Click &quot;Add Med&quot; if medications are needed.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {prescriptions.map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                    <div className="sm:col-span-4">
                      <select
                        value={p.medicine_id}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          const m = medicines.find((x) => x.id === e.target.value);
                          updated[idx].medicine_id = e.target.value;
                          if (m) updated[idx].dosage = m.dosage;
                          setPrescriptions(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs"
                      >
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.quantity_in_stock} in stock)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].quantity = Number(e.target.value);
                          setPrescriptions(updated);
                        }}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={p.frequency}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].frequency = e.target.value;
                          setPrescriptions(updated);
                        }}
                        placeholder="e.g., 3x daily after food"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={p.duration}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].duration = e.target.value;
                          setPrescriptions(updated);
                        }}
                        placeholder="3 days"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                      />
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Leave Integration */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="grantMedLeave"
                checked={medicalLeaveGranted}
                onChange={(e) => setMedicalLeaveGranted(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="grantMedLeave" className="text-xs font-bold text-amber-950 cursor-pointer">
                Grant Medical Leave (Auto-syncs with Hestra Leave Management)
              </label>
            </div>

            {medicalLeaveGranted && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-800 font-semibold">Days:</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={medicalLeaveDays}
                  onChange={(e) => setMedicalLeaveDays(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg border border-amber-300 text-xs bg-white text-center font-bold"
                />
              </div>
            )}
          </div>

          {/* Notes & Attending Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Attending Doctor / Medical Officer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Chea Sokhom (Chief Medical Officer)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Recommended Duty Action
              </label>
              <input
                type="text"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                placeholder="Return to regular duty, 2hr rest in clinic, hospital transfer"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Confidential Medical Notes (Clinical Observations)
            </label>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Clinical examination findings, allergy check, follow-up instructions..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Processing Consultation...' : 'Save Consultation & Deduct Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: MEDICINE ISSUE MODAL (Standalone Fast Dispenser)
// =========================================================================
function MedicineIssueModal({
  employees,
  medicines,
  currentUserName,
  onClose,
  onSuccess,
  language,
}: {
  employees: Employee[];
  medicines: Medicine[];
  currentUserName: string;
  onClose: () => void;
  onSuccess: () => void;
  language: string;
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [medicineId, setMedicineId] = useState(medicines[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [instruction, setInstruction] = useState('Take 1 tablet after meals 3 times a day');
  const [dosage, setDosage] = useState(medicines[0]?.dosage || '500mg');
  const [frequency, setFrequency] = useState('3 times daily');
  const [duration, setDuration] = useState('3 days');
  const [submitting, setSubmitting] = useState(false);

  const selectedMed = useMemo(() => medicines.find((m) => m.id === medicineId), [medicines, medicineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !medicineId || quantity <= 0) return;

    if (selectedMed && quantity > selectedMed.quantity_in_stock) {
      alert(`Cannot issue ${quantity}. Only ${selectedMed.quantity_in_stock} available in stock!`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/medical/issuing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          medicine_id: medicineId,
          quantity_issued: quantity,
          prescription_instruction: instruction,
          dosage,
          frequency,
          duration,
          issued_by: currentUserName || 'Dr. Chea Sokhom (Chief Medical Officer)',
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to issue medicine');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Pill size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'km' ? 'បើកផ្តល់ឱសថ (Fast Dispenser)' : 'Medicine Dispensary Console'}
              </h3>
              <p className="text-[10px] text-slate-500">Automatically deducts pharmacy stock on issue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Select Employee Recipient <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.id}) • {emp.department_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Select Medicine <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                const m = medicines.find((x) => x.id === e.target.value);
                if (m) setDosage(m.dosage);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.quantity_in_stock} {m.unit} in stock - Batch: {m.batch_number})
                </option>
              ))}
            </select>
          </div>

          {selectedMed && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">{selectedMed.name}</span>
                <span className="text-[10px] text-slate-500 block">Unit: {selectedMed.unit} • Batch: {selectedMed.batch_number}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-600 block">{selectedMed.quantity_in_stock} {selectedMed.unit}</span>
                <span className="text-[10px] text-slate-400">Available</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Quantity Issued <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedMed?.quantity_in_stock || 999}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="3 days"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Prescription / Instruction
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Take 1 tablet after meals 3 times a day"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-[11px] text-indigo-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
            <span>
              Issuing will automatically decrease stock from <strong>{selectedMed?.quantity_in_stock || 0}</strong> to{' '}
              <strong>{Math.max(0, (selectedMed?.quantity_in_stock || 0) - quantity)}</strong>.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Deducting Stock...' : 'Confirm Issue & Auto-Deduct'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: STOCK TRANSACTION MODAL (Stock-In, Out, Adjust, Dispose)
// =========================================================================
function StockTransactionModal({
  medicines,
  selectedMedicine,
  initialType,
  currentUserName,
  onClose,
  onSuccess,
  language,
}: {
  medicines: Medicine[];
  selectedMedicine: Medicine | null;
  initialType: 'Stock-in' | 'Stock-out' | 'Adjustment' | 'Expired Disposal';
  currentUserName: string;
  onClose: () => void;
  onSuccess: () => void;
  language: string;
}) {
  const [medicineId, setMedicineId] = useState(selectedMedicine?.id || medicines[0]?.id || '');
  const [transactionType, setTransactionType] = useState(initialType);
  const [quantity, setQuantity] = useState(
    initialType === 'Expired Disposal' && selectedMedicine ? selectedMedicine.quantity_in_stock : 50
  );
  const [batchNumber, setBatchNumber] = useState(selectedMedicine?.batch_number || `BATCH-${new Date().getFullYear()}-02`);
  const [unitCost, setUnitCost] = useState(selectedMedicine?.purchase_price || 0.1);
  const [supplierOrDest, setSupplierOrDest] = useState(
    initialType === 'Expired Disposal' ? 'Medical Waste Disposal Inc.' : selectedMedicine?.supplier || 'DKSH Cambodia'
  );
  const [notes, setNotes] = useState(
    initialType === 'Expired Disposal'
      ? 'Quarantine disposal of expired pharmaceuticals following Cambodia MoH guidelines'
      : 'Stock replenishment intake'
  );
  const [submitting, setSubmitting] = useState(false);

  const curMed = useMemo(() => medicines.find((m) => m.id === medicineId), [medicines, medicineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || quantity <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/medical/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: medicineId,
          transaction_type: transactionType,
          quantity,
          batch_number: batchNumber,
          unit_cost: unitCost,
          supplier_or_dest: supplierOrDest,
          performed_by: currentUserName || 'HR Admin',
          notes,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record stock transaction');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <PackagePlus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {transactionType === 'Stock-in'
                  ? 'Receive Stock-in Delivery'
                  : transactionType === 'Expired Disposal'
                  ? 'Expired Medicine Safe Disposal'
                  : 'Stock Adjustment & Audit'}
              </h3>
              <p className="text-[10px] text-slate-500">Pharmacy Ledger Inventory Control</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Transaction Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            >
              <option value="Stock-in">Stock-in (Shipment Intake)</option>
              <option value="Stock-out">Stock-out (Department Transfer)</option>
              <option value="Adjustment">Adjustment (Physical Audit Count)</option>
              <option value="Expired Disposal">Expired Disposal (Medical Waste)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Medicine SKU
            </label>
            <select
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                const m = medicines.find((x) => x.id === e.target.value);
                if (m) {
                  setBatchNumber(m.batch_number);
                  setUnitCost(m.purchase_price);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.quantity_in_stock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {transactionType === 'Adjustment' ? 'New Target Stock' : 'Quantity'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Batch Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Supplier / Disposal Destination
            </label>
            <input
              type="text"
              value={supplierOrDest}
              onChange={(e) => setSupplierOrDest(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Audit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Commit Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: MEDICAL CHART DRAWER & PRINT CERTIFICATE
// =========================================================================
function MedicalChartDrawer({
  record,
  onClose,
  language,
  permissions,
}: {
  record: EmployeeMedicalRecord;
  onClose: () => void;
  language: string;
  permissions: any;
}) {
  const [printMode, setPrintMode] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white h-full w-full max-w-xl shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col justify-between">
        {/* Top Header */}
        <div>
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <HeartPulse size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'km' ? 'កំណត់ត្រាសុខភាពផ្លូវការ' : 'Official Medical Consultation Record'}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Chart ID: {record.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintMode(true)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Print Medical Consultation Certificate"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
              <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Consultation Certificate */}
          <div id="medical-printable-area" className="p-6 space-y-5">
            {/* Brand Header */}
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
              <HestraLogo size="sm" showText={true} subtext="Occupational Health & Medical Department" />
              <div className="text-right text-[10px] text-slate-400 font-mono">
                <div>Date: {record.visit_date}</div>
                <div>Time: {record.visit_time || '10:00 AM'}</div>
              </div>
            </div>

            {/* Patient Dossier Ribbon */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              {record.employee_avatar ? (
                <img
                  src={record.employee_avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 font-bold text-base flex items-center justify-center ring-2 ring-slate-200 shrink-0">
                  {record.employee_name ? record.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm">{record.employee_name || 'Staff Employee'}</h4>
                <p className="text-xs text-slate-500 font-medium">{record.department_name} • {record.employee_role}</p>
                <span className="text-[10px] text-slate-400 font-mono">Staff ID: {record.employee_id}</span>
              </div>
            </div>

            {/* Diagnosis & Symptoms */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Clinical Diagnosis</span>
                <span className="text-base font-black text-rose-950 mt-0.5 block">{record.diagnosis}</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Reported Symptoms & Reason for Visit:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {record.symptoms}
                </p>
              </div>
            </div>

            {/* Vitals Summary */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Temp</span>
                <span className="text-xs font-black text-slate-800">{record.temperature ? `${record.temperature}°C` : '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">BP</span>
                <span className="text-xs font-black text-slate-800">{record.blood_pressure || '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Heart Rate</span>
                <span className="text-xs font-black text-slate-800">{record.heart_rate ? `${record.heart_rate} bpm` : '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Weight</span>
                <span className="text-xs font-black text-slate-800">{record.weight_kg ? `${record.weight_kg} kg` : '—'}</span>
              </div>
            </div>

            {/* Prescribed Medications */}
            {record.medicine_prescribed && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <Pill size={13} />
                  <span>Prescribed Pharmacy Treatment</span>
                </span>
                <div className="text-xs font-black text-indigo-950">{record.medicine_prescribed}</div>
                {record.dosage && (
                  <div className="text-[11px] text-indigo-800">
                    Dosage: <strong>{record.dosage}</strong> • Frequency: <strong>{record.frequency}</strong> • Duration: <strong>{record.duration}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Medical Leave Status */}
            {Number(record.medical_leave_granted || 0) > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                <CalendarCheck size={20} className="text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">Approved Medical Leave ({record.medical_leave_days} Days)</span>
                  <span className="text-[11px] text-amber-700">Synchronized with employee PTO Sick Leave balance.</span>
                </div>
              </div>
            )}

            {/* Clinical Observations */}
            {record.medical_notes && permissions.canViewConfidentialNotes && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Notes & Follow-up Instructions:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
                  &ldquo;{record.medical_notes}&rdquo;
                </div>
              </div>
            )}

            {/* Attending Doctor Sign-off */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Attending Medical Practitioner</span>
                <span className="text-xs font-black text-slate-900 block mt-1">{record.doctor_name}</span>
                <span className="text-[10px] text-slate-500">HESTRA Occupational Health Clinic</span>
              </div>
              <div className="text-right">
                <div className="w-24 h-8 border-b border-dashed border-slate-400 mb-1"></div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Official Clinic Seal / Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Prompt Overlay */}
        {printMode && (
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <span className="text-xs font-semibold">Print this consultation certificate for employee file?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintMode(false)}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.print();
                  setPrintMode(false);
                }}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MedicalManagementPage() {
  const { language } = useApp();
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400 font-medium">
          {language === 'km' ? 'កំពុងដំណើរការប្រព័ន្ធគ្រប់គ្រងវេជ្ជសាស្ត្រ...' : 'Loading Medicine & Medical Management...'}
        </div>
      }
    >
      <MedicalManagementContent />
    </Suspense>
  );
}

