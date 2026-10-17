'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText } from '@/lib/translations';
import {
  Network,
  Users,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Sparkles,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Check,
  X,
  RefreshCw,
  GitBranch,
  Crown,
  Award,
  ExternalLink,
  Edit2,
  AlertCircle,
  HelpCircle,
  Move,
} from 'lucide-react';

interface OrgNode {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  khmer_name?: string | null;
  role: string;
  department_id: string;
  department_name?: string;
  department_color?: string;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  pay_grade?: string | null;
  group_name?: string | null;
  salary?: number;
  status: string;
  join_date?: string;
  direct_reports_count: number;
  total_subordinates_count: number;
  children: OrgNode[];
}

export interface CompanyHierarchyNode {
  id: string;
  name: string;
  name_km: string;
  role: string;
  role_km: string;
  level: 'board' | 'chairman' | 'executive' | 'department' | 'manager' | 'section' | 'line';
  level_label: string;
  level_label_km: string;
  tier: number;
  department_id?: string;
  department_name?: string;
  department_color?: string;
  group_id?: string;
  group_name?: string;
  description?: string;
  description_km?: string;
  employee_count: number;
  assigned_employees: Array<{
    id: string;
    name: string;
    khmer_name?: string;
    role: string;
    avatar?: string;
  }>;
  children: CompanyHierarchyNode[];
}

interface Department {
  id: string;
  name: string;
  color: string;
  manager_id?: string | null;
  manager_name?: string | null;
  manager_khmer_name?: string | null;
  manager_role?: string | null;
  manager_avatar?: string | null;
  employee_count: number;
  group_count?: number;
  groups?: Array<{
    id: string;
    name: string;
    department_id: string;
    description: string;
  }>;
}

export default function CompanyStructurePage() {
  const { language, showToast, currentPersona } = useApp();

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [companyHierarchy, setCompanyHierarchy] = useState<CompanyHierarchyNode | null>(null);
  const [flatEmployees, setFlatEmployees] = useState<OrgNode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState({
    total_employees: 0,
    total_departments: 0,
    leadership_count: 0,
    max_depth: 0,
  });

  // UI Modes
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'chart' | 'departments' | 'chain'>('hierarchy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');

  // Chart Zoom, Pan & Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Node expand/collapse set (tracks employee IDs and hierarchy node IDs that are expanded)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Selected Employee / Hierarchy Node Drawer State
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [selectedHierarchyNode, setSelectedHierarchyNode] = useState<CompanyHierarchyNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Chain Explorer Target
  const [chainTargetId, setChainTargetId] = useState<string>('HC004'); // default sample

  // Manager Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTargetEmp, setReassignTargetEmp] = useState<OrgNode | null>(null);
  const [newManagerId, setNewManagerId] = useState<string>('');
  const [reassignSaving, setReassignSaving] = useState(false);

  const canManage = currentPersona?.role === 'Manager' || currentPersona?.role === 'Admin';

  const fetchStructure = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/structure');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load organization structure');

      setTreeData(data.tree || []);
      setCompanyHierarchy(data.companyHierarchy || null);
      setFlatEmployees(data.flatEmployees || []);
      setDepartments(data.departments || []);
      if (data.summary) setSummary(data.summary);

      // Default expanded nodes for both Staff Tree and Company Hierarchy
      const initialExpanded = new Set<string>();

      // Expand staff tree roots & level 1
      (data.tree || []).forEach((root: OrgNode) => {
        initialExpanded.add(root.id);
        (root.children || []).forEach((c: OrgNode) => {
          initialExpanded.add(c.id);
        });
      });

      // Expand company hierarchy tree: Board, Chairman, GM, all Departments, and Sewing line
      const addHierarchyExpanded = (node: CompanyHierarchyNode | null | undefined) => {
        if (!node) return;
        initialExpanded.add(node.id);
        if (node.children) {
          node.children.forEach(addHierarchyExpanded);
        }
      };
      if (data.companyHierarchy) {
        addHierarchyExpanded(data.companyHierarchy);
      }

      setExpandedNodes(initialExpanded);
    } catch (err: any) {
      console.error('Error fetching structure:', err);
      showToast(err.message || 'Error loading structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructure();
  }, []);

  // Expand / Collapse toggler
  const toggleNodeExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const all = new Set<string>();
    if (activeTab === 'hierarchy' && companyHierarchy) {
      const collectHierarchyIds = (n: CompanyHierarchyNode) => {
        all.add(n.id);
        (n.children || []).forEach(collectHierarchyIds);
      };
      collectHierarchyIds(companyHierarchy);
    } else {
      flatEmployees.forEach((e) => all.add(e.id));
    }
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    const rootOnly = new Set<string>();
    if (activeTab === 'hierarchy' && companyHierarchy) {
      rootOnly.add(companyHierarchy.id);
    } else {
      treeData.forEach((r) => rootOnly.add(r.id));
    }
    setExpandedNodes(rootOnly);
  };

  const handleSelectHierarchyNode = (node: CompanyHierarchyNode) => {
    setSelectedHierarchyNode(node);
    setSelectedNode(null);
    setIsDrawerOpen(true);
  };

  // Zoom actions
  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(2.0, parseFloat((z + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(0.2, parseFloat((z - 0.1).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollLeft = 0;
      chartContainerRef.current.scrollTop = 0;
    }
  };

  const handleFitToScreen = () => {
    if (!chartContainerRef.current || !treeContentRef.current) return;
    const containerWidth = chartContainerRef.current.clientWidth - 80;
    const contentWidth = treeContentRef.current.scrollWidth;
    if (contentWidth > 0 && containerWidth > 0) {
      const calculated = containerWidth / contentWidth;
      const clamped = Math.max(0.25, Math.min(1.2, Math.round(calculated * 100) / 100));
      setZoomLevel(clamped);
      chartContainerRef.current.scrollLeft = 0;
    }
  };

  // Fullscreen Handlers (Native Computer Fullscreen API synchronized with UI)
  const handleToggleFullscreen = useCallback(() => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

      if (!isFs) {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (req) {
          req.call(docEl);
        }
        setIsFullscreen(true);
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(doc);
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Native computer fullscreen request blocked or not permitted, falling back to CSS fullscreen:', err);
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  const handleExitFullscreen = useCallback(() => {
    try {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      if (isFs) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(doc);
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
    setIsFullscreen(false);
  }, []);

  // Listen to native computer fullscreen changes (e.g. user presses Esc or F11)
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      if (!isFs) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  // Re-fit canvas when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Canvas Drag-to-Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('.org-node-card')
    ) {
      return;
    }
    if (!chartContainerRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: chartContainerRef.current.scrollLeft,
      scrollTop: chartContainerRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !chartContainerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    chartContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    chartContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Native Wheel Event with passive: false for smooth Ctrl+Wheel zooming
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoomLevel((prev) => Math.max(0.2, Math.min(2.0, parseFloat((prev + delta).toFixed(2)))));
      }
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, [activeTab]);

  // Keyboard shortcuts (+, -, 0, f, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'chart' && activeTab !== 'hierarchy') return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        handleExitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isFullscreen, handleExitFullscreen]);

  // Node selection for detail drawer
  const handleSelectNode = (node: OrgNode) => {
    setSelectedNode(node);
    setSelectedHierarchyNode(null);
    setIsDrawerOpen(true);
  };

  // Upward chain of command calculator
  const reportingChain = useMemo(() => {
    if (!chainTargetId) return [];
    const chain: OrgNode[] = [];
    let currId: string | null = chainTargetId;
    const visited = new Set<string>();

    const empMap = new Map<string, OrgNode>();
    flatEmployees.forEach((e) => empMap.set(e.id, e));

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const emp = empMap.get(currId);
      if (!emp) break;
      chain.unshift(emp);
      currId = emp.manager_id || null;
    }
    return chain;
  }, [chainTargetId, flatEmployees]);

  // Direct peers and subordinates of chain target
  const targetEmployee = useMemo(() => {
    return flatEmployees.find((e) => e.id === chainTargetId) || null;
  }, [chainTargetId, flatEmployees]);

  const targetSubordinates = useMemo(() => {
    if (!chainTargetId) return [];
    return flatEmployees.filter((e) => e.manager_id === chainTargetId);
  }, [chainTargetId, flatEmployees]);

  const targetPeers = useMemo(() => {
    if (!targetEmployee || !targetEmployee.manager_id) return [];
    return flatEmployees.filter(
      (e) => e.manager_id === targetEmployee.manager_id && e.id !== targetEmployee.id
    );
  }, [targetEmployee, flatEmployees]);

  // Handle reassign manager submit
  const handleSaveReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetEmp) return;

    setReassignSaving(true);
    try {
      const res = await fetch('/api/structure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: reassignTargetEmp.id,
          manager_id: newManagerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update manager');

      showToast(
        language === 'km'
          ? 'បានកែប្រែខ្សែសង្វាក់រាយការណ៍ជោគជ័យ!'
          : 'Reporting manager updated successfully!',
        'success'
      );
      setReassignModalOpen(false);
      fetchStructure();
    } catch (err: any) {
      showToast(err.message || 'Error updating manager', 'error');
    } finally {
      setReassignSaving(false);
    }
  };

  // Check if an employee matches search
  const isMatchSearch = (node: OrgNode): boolean => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      node.id.toLowerCase().includes(q) ||
      node.name.toLowerCase().includes(q) ||
      (node.khmer_name && node.khmer_name.toLowerCase().includes(q)) ||
      node.role.toLowerCase().includes(q)
    );
  };

  const isMatchSearchHierarchy = (node: CompanyHierarchyNode): boolean => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return Boolean(
      node.id.toLowerCase().includes(q) ||
      node.name.toLowerCase().includes(q) ||
      (node.name_km && node.name_km.toLowerCase().includes(q)) ||
      node.role.toLowerCase().includes(q) ||
      (node.role_km && node.role_km.toLowerCase().includes(q)) ||
      (node.group_name && node.group_name.toLowerCase().includes(q))
    );
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Node role level style helper
  const getNodeLevelStyle = (node: OrgNode) => {
    const roleLower = (node.role || '').toLowerCase();
    const isExecutive = roleLower.includes('director') || roleLower.includes('general manager') || roleLower.includes('head');
    const isChief = roleLower.includes('chief') || roleLower.includes('admin') || roleLower.includes('officer') || roleLower.includes('recruiter');
    const isLeader = roleLower.includes('leader');

    if (isExecutive) {
      return {
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        cardBorder: 'border-purple-300 ring-2 ring-purple-500/20 shadow-md',
        accentBg: 'bg-purple-600',
        levelLabel: language === 'km' ? 'ថ្នាក់ដឹកនាំជាន់ខ្ពស់' : 'Executive Level',
      };
    }
    if (isChief) {
      return {
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        cardBorder: 'border-indigo-300 ring-1 ring-indigo-500/10 shadow-sm',
        accentBg: 'bg-indigo-600',
        levelLabel: language === 'km' ? 'ប្រធានផ្នែក / មេការធំ' : 'Department Chief',
      };
    }
    if (isLeader) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        cardBorder: 'border-emerald-300 shadow-xs',
        accentBg: 'bg-emerald-600',
        levelLabel: language === 'km' ? 'ប្រធានក្រុម / មេការរង' : 'Line Supervisor',
      };
    }
    return {
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      cardBorder: 'border-slate-200 hover:border-slate-300 shadow-2xs',
      accentBg: 'bg-slate-500',
      levelLabel: language === 'km' ? 'បុគ្គលិក / កម្មករ' : 'Operator / Staff',
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shadow-2xs border border-indigo-200/60 dark:border-indigo-800/60">
              <Network size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{language === 'km' ? 'រចនាសម្ព័ន្ធក្រុមហ៊ុន' : 'Company Structure Chart'}</span>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
                  HESTRA Cambodia
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'km'
                  ? 'គំនូសបំព្រួញឋានានុក្រម ខ្សែសង្វាក់រាយការណ៍ និងការគ្រប់គ្រងផ្នែកនៃរោងចក្រ HESTRA'
                  : 'Interactive organizational hierarchy, reporting lines, and factory departmental leadership'}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'hierarchy'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown size={14} className="text-amber-500" />
              <span>{language === 'km' ? 'រចនាសម្ព័ន្ធស្ថាប័ន (Company Chart)' : 'Company Hierarchy'}</span>
            </button>

            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network size={14} />
              <span>{language === 'km' ? 'ខ្សែបញ្ជាបុគ្គលិក (Staff Tree)' : 'Staff Reporting Tree'}</span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'departments'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 size={14} />
              <span>{language === 'km' ? 'នាយកដ្ឋាន & ក្រុម' : 'Divisions & Groups'}</span>
            </button>

            <button
              onClick={() => setActiveTab('chain')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chain'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitBranch size={14} />
              <span>{language === 'km' ? 'ខ្សែសង្វាក់រាយការណ៍' : 'Reporting Chain'}</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchStructure}
            title={language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
            className="btn-press p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            title={language === 'km' ? 'បោះពុម្ពគំនូសបំព្រួញ' : 'Print Organization Chart'}
            className="btn-press p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-300">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[11px]">{language === 'km' ? 'កម្លាំងពលកម្មសរុប' : 'Total Headcount'}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
            {summary.total_employees}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {language === 'km' ? 'បុគ្គលិកសកម្មទាំងអស់' : 'Active factory staff'}
          </span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-300">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[11px]">{language === 'km' ? 'ចំនួនផ្នែក / នាយកដ្ឋាន' : 'Departments'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
            {summary.total_departments}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {language === 'km' ? 'ខ្សែសង្វាក់ & ការិយាល័យ' : 'Operating units'}
          </span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500 before:to-amber-300">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[11px]">{language === 'km' ? 'ថ្នាក់ដឹកនាំ & មេការ' : 'Leadership & Chiefs'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono tracking-tight">
            {summary.leadership_count}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {language === 'km' ? 'ប្រធានផ្នែក & មេការក្រុម' : 'Department heads & leads'}
          </span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-300/80 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-purple-500 before:to-purple-300">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[11px]">{language === 'km' ? 'កម្រិតឋានានុក្រម' : 'Hierarchy Depth'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono tracking-tight">
            {summary.max_depth} {language === 'km' ? 'កម្រិត' : 'Tiers'}
          </div>
          <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
            {language === 'km' ? 'រចនាសម្ព័ន្ធតភ្ជាប់ 100%' : '100% structured chain'}
          </span>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកបុគ្គលិកតាមឈ្មោះ ឬ ID...' : 'Search employee by name, ID or role...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 w-52 sm:w-72 transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ផ្នែកទាំងអស់' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatLocalizedText(d.name, language)} ({d.employee_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tree Zoom & Expansion Controls (when in hierarchy or chart mode) */}
        {(activeTab === 'hierarchy' || activeTab === 'chart') && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tree Expansion Group */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer"
                title={language === 'km' ? 'ពង្រីកសាខាទាំងអស់' : 'Expand all branches'}
              >
                {language === 'km' ? 'ពង្រីកទាំងអស់' : 'Expand All'}
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer"
                title={language === 'km' ? 'បង្រួមត្រឹមថ្នាក់លើ' : 'Collapse to top root'}
              >
                {language === 'km' ? 'បង្រួម' : 'Collapse'}
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Prominent Zoom In / Out Group */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                title={language === 'km' ? 'បង្រួមទំហំ (Zoom Out: -)' : 'Zoom Out (-)'}
                className="px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <ZoomOut size={14} className="text-slate-500" />
                <span className="hidden md:inline">{language === 'km' ? 'បង្រួម' : 'Zoom Out'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                title={language === 'km' ? 'កំណត់ឡើងវិញ 100%' : 'Click to reset to 100%'}
                className="px-2 py-1 rounded-lg hover:bg-white text-xs font-mono font-black text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer min-w-[50px] text-center"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                title={language === 'km' ? 'ពង្រីកទំហំ (Zoom In: +)' : 'Zoom In (+)'}
                className="px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <ZoomIn size={14} className="text-indigo-600" />
                <span className="hidden md:inline">{language === 'km' ? 'ពង្រីក' : 'Zoom In'}</span>
              </button>
            </div>

            {/* Fit to View & Fullscreen */}
            <button
              type="button"
              onClick={handleFitToScreen}
              title={language === 'km' ? 'ពង្រីកស្មើអេក្រង់ (Fit to View: F)' : 'Fit to Screen (F)'}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 size={13} />
              <span className="hidden lg:inline">{language === 'km' ? 'ពេញអេក្រង់' : 'Fit'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              title={language === 'km' ? 'កំណត់ទំហំដើម (100%: 0)' : 'Reset Zoom 100% (0)'}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={
                isFullscreen
                  ? (language === 'km' ? 'ចាកចេញពីអេក្រង់ពេញ (Esc)' : 'Exit Fullscreen (Esc)')
                  : (language === 'km' ? 'ពង្រីកពេញអេក្រង់ (Full Screen)' : 'Full Screen View')
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isFullscreen
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA */}

      {/* TAB 1 & 2: INTERACTIVE ORG CHART / COMPANY HIERARCHY TREE */}
      {(activeTab === 'hierarchy' || activeTab === 'chart') && (
        <div
          ref={chartContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`bg-slate-50/80 border border-slate-200 overflow-auto shadow-inner relative transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 rounded-none bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 h-screen w-screen'
              : 'rounded-3xl p-6 sm:p-10 min-h-[650px] max-h-[82vh]'
          } ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          {/* Top Instruction Pill & Fullscreen Exit Bar */}
          <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-between pointer-events-none mb-3">
            <span className="px-3 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-2 shadow-md">
              <Sparkles size={12} className="text-amber-300 shrink-0" />
              <span>
                {activeTab === 'hierarchy'
                  ? (language === 'km' ? 'រចនាសម្ព័ន្ធស្ថាប័នផ្លូវការ (Board ➔ Chairman ➔ General Management ➔ Departments)' : 'Official Company Hierarchy Chart (Board ➔ Chairman ➔ GM ➔ Departments)')
                  : (language === 'km' ? 'ចុចអូសផ្ទាំងដើម្បីរំកិល • ប្រើប៊ូតុង Zoom ឬ Ctrl + វិលកង់កណ្តុរ' : 'Click & drag canvas to pan • Use Zoom buttons or Ctrl + Scroll wheel')}
              </span>
            </span>

            {isFullscreen && (
              <button
                type="button"
                onClick={handleExitFullscreen}
                className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-xl ring-1 ring-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Minimize2 size={14} className="text-rose-400" />
                <span>{language === 'km' ? 'ចាកចេញពីអេក្រង់ពេញ (Exit Fullscreen)' : 'Exit Fullscreen (Esc)'}</span>
              </button>
            )}
          </div>

          {/* Floating Interactive Zoom & Pan Dock (Bottom Right) */}
          <div className="sticky bottom-4 float-right z-30 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 pointer-events-auto select-none">
            {/* Presets */}
            <div className="hidden sm:flex items-center gap-1 pr-1 border-r border-slate-200">
              {[
                { label: '35%', value: 0.35 },
                { label: '50%', value: 0.5 },
                { label: '75%', value: 0.75 },
                { label: '100%', value: 1.0 },
                { label: '125%', value: 1.25 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setZoomLevel(preset.value)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    Math.abs(zoomLevel - preset.value) < 0.05
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              title={language === 'km' ? 'បង្រួម (-)' : 'Zoom Out (-)'}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <ZoomOut size={16} />
            </button>

            {/* Current Zoom Badge / Reset */}
            <button
              type="button"
              onClick={handleResetZoom}
              title={language === 'km' ? 'កំណត់ទំហំដើម (100%)' : 'Reset to 100%'}
              className="px-2.5 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-black flex items-center justify-center min-w-[54px] transition-colors cursor-pointer"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              title={language === 'km' ? 'ពង្រីក (+)' : 'Zoom In (+)'}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <ZoomIn size={16} />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Fit to View */}
            <button
              type="button"
              onClick={handleFitToScreen}
              title={language === 'km' ? 'ពង្រីកស្មើអេក្រង់ (Fit to View: F)' : 'Fit to Screen (F)'}
              className="px-2.5 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 size={13} />
              <span className="hidden md:inline">{language === 'km' ? 'ពេញផ្ទាំង' : 'Fit'}</span>
            </button>

            {/* Reset Zoom */}
            <button
              type="button"
              onClick={handleResetZoom}
              title={language === 'km' ? 'កំណត់ឡើងវិញ (100%: 0)' : 'Reset Zoom (0)'}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={
                isFullscreen
                  ? (language === 'km' ? 'ចាកចេញពីអេក្រង់ពេញ (Esc)' : 'Exit Fullscreen (Esc)')
                  : (language === 'km' ? 'ពង្រីកពេញអេក្រង់ (Full Screen)' : 'Full Screen View')
              }
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isFullscreen
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
              <RefreshCw className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm font-semibold">{language === 'km' ? 'កំពុងបង្កើតគំនូសបំព្រួញរចនាសម្ព័ន្ធ...' : 'Rendering organization structure...'}</p>
            </div>
          ) : activeTab === 'hierarchy' ? (
            companyHierarchy ? (
              <div
                ref={treeContentRef}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="inline-block min-w-full text-center pb-28 select-none"
              >
                <CompanyHierarchyTreeNode
                  node={companyHierarchy}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleNodeExpand}
                  onSelectNode={handleSelectHierarchyNode}
                  isMatchSearch={isMatchSearchHierarchy}
                  selectedDeptFilter={selectedDeptFilter}
                  language={language}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Network size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-700">
                  {language === 'km' ? 'មិនមានទិន្នន័យរចនាសម្ព័ន្ធស្ថាប័ន' : 'No Organization Structure Found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {language === 'km'
                    ? 'រចនាសម្ព័ន្ធស្ថាប័ន និងផ្នែកទាំងអស់ត្រូវបានសម្អាតចេញពីប្រព័ន្ធ។'
                    : 'All departments and operational groups have been cleared from the database.'}
                </p>
                <Link
                  href="/departments"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Building2 size={14} />
                  <span>{language === 'km' ? 'ចូលទៅគ្រប់គ្រងផ្នែក' : 'Go to Departments'}</span>
                </Link>
              </div>
            )
          ) : treeData.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {language === 'km' ? 'មិនទាន់មានបុគ្គលិកក្នុងខ្សែបញ្ជាផ្ទាល់នៅឡើយ' : 'No staff reporting records created yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'km'
                  ? 'រចនាសម្ព័ន្ធស្ថាប័នផ្លូវការបានរៀបចំរួចរាល់។ សូមចូលទៅកាន់ផ្ទាំងរចនាសម្ព័ន្ធស្ថាប័ន ដើម្បីមើលរចនាសម្ព័ន្ធក្រុមហ៊ុនពេញលេញ។'
                  : 'The official organizational hierarchy is configured. Click below to view the Company Hierarchy.'}
              </p>
              <button
                onClick={() => setActiveTab('hierarchy')}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Crown size={14} className="text-amber-300" />
                <span>{language === 'km' ? 'មើលរចនាសម្ព័ន្ធស្ថាប័នក្រុមហ៊ុន (Company Hierarchy)' : 'View Company Hierarchy'}</span>
              </button>
            </div>
          ) : (
            <div
              ref={treeContentRef}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: isPanning ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="inline-block min-w-full text-center pb-28 select-none"
            >
              {treeData.map((rootNode) => (
                <OrgTreeNode
                  key={rootNode.id}
                  node={rootNode}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleNodeExpand}
                  onSelectNode={handleSelectNode}
                  isMatchSearch={isMatchSearch}
                  selectedDeptFilter={selectedDeptFilter}
                  getNodeLevelStyle={getNodeLevelStyle}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTAL MATRIX & TEAMS */}
      {activeTab === 'departments' && (
        departments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Building2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-700">
              {language === 'km' ? 'មិនមានផ្នែកក្នុងប្រព័ន្ធ' : 'No Departments Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'km'
                ? 'ផ្នែកទាំងអស់ត្រូវបានសម្អាតចេញពីប្រព័ន្ធ។ អ្នកអាចបង្កើតផ្នែកថ្មីបានគ្រប់ពេល។'
                : 'All departments have been cleared from the database. You can create new departments anytime.'}
            </p>
            <Link
              href="/departments"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Building2 size={14} />
              <span>{language === 'km' ? 'ចូលទៅគ្រប់គ្រងផ្នែក' : 'Go to Departments'}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const deptMembers = flatEmployees.filter((e) => e.department_id === dept.id);
            const deptLeaders = deptMembers.filter((e) => {
              const r = (e.role || '').toLowerCase();
              return r.includes('chief') || r.includes('leader') || r.includes('admin') || r.includes('head');
            });

            return (
              <div
                key={dept.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Department Header with custom color */}
                <div
                  className="p-4 border-b border-slate-100 flex items-center justify-between"
                  style={{ borderTop: `4px solid ${dept.color || '#6366f1'}` }}
                >
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {formatLocalizedText(dept.name, language)}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {dept.id}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-slate-100 text-slate-800">
                    {deptMembers.length} {language === 'km' ? 'នាក់' : 'staff'}
                  </span>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Department Manager Card */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      {language === 'km' ? 'ប្រធានផ្នែក / មេការធំ' : 'Department Head / Chief'}
                    </span>
                    {dept.manager_id ? (
                      <div
                        onClick={() => {
                          const mgrNode = flatEmployees.find((e) => e.id === dept.manager_id);
                          if (mgrNode) handleSelectNode(mgrNode);
                        }}
                        className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100/60 transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {(dept.manager_name?.[0] || 'M')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-indigo-950 truncate">
                            {dept.manager_name}
                          </div>
                          {dept.manager_khmer_name && (
                            <div className="font-khmer text-[11px] text-indigo-700 truncate">
                              {dept.manager_khmer_name}
                            </div>
                          )}
                          <div className="text-[10px] text-indigo-600 font-medium truncate">
                            {dept.manager_role || 'Department Chief'}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-indigo-400" />
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs italic">
                        {language === 'km' ? 'មិនទាន់ចាត់តាំងប្រធាន' : 'No Department Head assigned'}
                      </div>
                    )}
                  </div>

                  {/* Sub-leaders / Key Chiefs */}
                  {deptLeaders.length > 1 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {language === 'km' ? 'មេការរង & ប្រធានក្រុម' : 'Line Leaders & Supervisors'} ({deptLeaders.length - (dept.manager_id ? 1 : 0)})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {deptLeaders
                          .filter((l) => l.id !== dept.manager_id)
                          .map((lead) => (
                            <button
                              key={lead.id}
                              onClick={() => handleSelectNode(lead)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>{lead.name}</span>
                              <span className="text-[10px] text-emerald-600 opacity-75">({lead.role})</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Operational Groups in this Department */}
                  {dept.groups && dept.groups.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {language === 'km' ? 'ក្រុមការងារ & ខ្សែសង្វាក់' : 'Operational Groups & Lines'} ({dept.groups.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.groups.map((g) => (
                          <span
                            key={g.id}
                            className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff List Preview */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {language === 'km' ? 'សមាជិកក្នុងផ្នែក' : 'Team Members'} ({deptMembers.length})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {deptMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelectNode(m)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10px] font-mono cursor-pointer transition-colors truncate max-w-[120px]"
                          title={`${m.id} - ${m.name} (${m.role})`}
                        >
                          {m.first_name} {m.last_name?.[0]}.
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Link to Tree */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedDeptFilter(dept.id);
                        setActiveTab('chart');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'km' ? 'មើលលើគំនូស' : 'View in Tree'}</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )
      )}

      {/* TAB 3: REPORTING CHAIN EXPLORER */}
      {activeTab === 'chain' && (
        <div className="space-y-6">
          {/* Target Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                <GitBranch size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {language === 'km' ? 'ស្វែងរកខ្សែសង្វាក់រាយការណ៍' : 'Employee Reporting Line Trace'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'km'
                    ? 'ជ្រើសរើសបុគ្គលិកដើម្បីតាមដានខ្សែបញ្ជាពីលើចុះក្រោម'
                    : 'Select any worker to trace their exact upward chain of command up to the General Manager'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">
                {language === 'km' ? 'បុគ្គលិកគោលដៅ៖' : 'Target Employee:'}
              </label>
              <select
                value={chainTargetId}
                onChange={(e) => setChainTargetId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 cursor-pointer focus:ring-2 focus:ring-indigo-500 max-w-xs"
              >
                {flatEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id} - {e.name} {e.khmer_name ? `(${e.khmer_name})` : ''} [{e.role}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upward Reporting Line Breadcrumb Chain */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Crown size={14} className="text-amber-500" />
              <span>{language === 'km' ? 'ខ្សែបញ្ជា & ថ្នាក់លើ (Upward Chain of Command)' : 'Upward Chain of Command'}</span>
            </h4>

            <div className="flex flex-col md:flex-row items-center gap-3 overflow-x-auto pb-4">
              {reportingChain.map((node, index) => {
                const isTarget = node.id === chainTargetId;
                const isTop = index === 0;

                return (
                  <React.Fragment key={node.id}>
                    <div
                      onClick={() => handleSelectNode(node)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer w-full md:w-64 shrink-0 ${
                        isTarget
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg ring-4 ring-indigo-500/20'
                          : isTop
                          ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100/70'
                          : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isTarget
                              ? 'bg-white/20 text-white'
                              : isTop
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Level {index + 1}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isTarget ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {node.id}
                        </span>
                      </div>

                      <div className="font-bold text-sm truncate">
                        {node.name}
                      </div>
                      {language === 'km' && node.khmer_name && (
                        <div
                          className={`text-xs font-khmer truncate ${
                            isTarget ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {node.khmer_name}
                        </div>
                      )}
                      <div
                        className={`text-xs font-medium mt-1 truncate ${
                          isTarget ? 'text-indigo-200' : 'text-slate-600'
                        }`}
                      >
                        {node.role}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                        <span className="truncate opacity-80">{node.department_name}</span>
                        {node.direct_reports_count > 0 && (
                          <span className="font-mono font-bold opacity-90">
                            {node.direct_reports_count} reports
                          </span>
                        )}
                      </div>
                    </div>

                    {index < reportingChain.length - 1 && (
                      <div className="flex md:flex-col items-center justify-center text-slate-400 shrink-0">
                        <ChevronRight className="hidden md:block" size={20} />
                        <ChevronDown className="md:hidden" size={20} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Subordinates & Direct Peers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Direct Subordinates */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-600" />
                  <span>{language === 'km' ? 'កូនចៅក្រោមឱវាទផ្ទាល់' : 'Direct Subordinates'}</span>
                </h4>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                  {targetSubordinates.length} {language === 'km' ? 'នាក់' : 'people'}
                </span>
              </div>

              {targetSubordinates.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  {language === 'km'
                    ? 'បុគ្គលិកនេះមិនមានកូនចៅក្រោមឱវាទផ្ទាល់ទេ'
                    : 'This employee has no direct subordinates reporting to them.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {targetSubordinates.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectNode(sub)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {sub.first_name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{sub.name}</div>
                          {sub.khmer_name && (
                            <div className="font-khmer text-[11px] text-slate-500">{sub.khmer_name}</div>
                          )}
                          <div className="text-[11px] text-slate-500">{sub.role}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Peers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  <span>{language === 'km' ? 'មិត្តរួមក្រុមក្រោមប្រធានតែមួយ' : 'Colleague Peers (Same Manager)'}</span>
                </h4>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                  {targetPeers.length} {language === 'km' ? 'នាក់' : 'peers'}
                </span>
              </div>

              {targetPeers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  {language === 'km' ? 'គ្មានមិត្តរួមក្រុមក្រោមប្រធានផ្ទាល់ទេ' : 'No direct peers under this manager.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {targetPeers.slice(0, 20).map((peer) => (
                    <div
                      key={peer.id}
                      onClick={() => setChainTargetId(peer.id)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                          {peer.first_name?.[0] || 'P'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{peer.name}</div>
                          {peer.khmer_name && (
                            <div className="font-khmer text-[11px] text-slate-500">{peer.khmer_name}</div>
                          )}
                          <div className="text-[11px] text-slate-500">{peer.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold hover:underline">
                        Trace &rarr;
                      </span>
                    </div>
                  ))}
                  {targetPeers.length > 20 && (
                    <div className="text-center text-xs text-slate-400 pt-1">
                      + {targetPeers.length - 20} more peers
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SLIDE-OUT DETAIL DRAWER */}
      {isDrawerOpen && (selectedNode || selectedHierarchyNode) && (
        <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {selectedHierarchyNode ? (
                  <Building2 size={18} className="text-indigo-600" />
                ) : (
                  <Network size={18} className="text-indigo-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedHierarchyNode
                    ? (language === 'km' ? 'ព័ត៌មានរចនាសម្ព័ន្ធស្ថាប័ន' : 'Organization Unit Profile')
                    : (language === 'km' ? 'ព័ត៌មានរចនាសម្ព័ន្ធបុគ្គលិក' : 'Employee Structure Profile')}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSelectedNode(null);
                  setSelectedHierarchyNode(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body: Company Hierarchy Unit */}
            {selectedHierarchyNode ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Card */}
                <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                  <div
                    className="w-16 h-16 rounded-3xl text-white text-2xl font-bold flex items-center justify-center mx-auto shadow-lg"
                    style={{
                      backgroundColor: selectedHierarchyNode.department_color || '#6366f1',
                    }}
                  >
                    {selectedHierarchyNode.level === 'board' ? (
                      <Crown size={28} className="text-amber-300" />
                    ) : selectedHierarchyNode.level === 'chairman' ? (
                      <Award size={28} className="text-purple-200" />
                    ) : selectedHierarchyNode.level === 'executive' ? (
                      <Building2 size={28} className="text-indigo-200" />
                    ) : selectedHierarchyNode.level === 'department' ? (
                      <Layers size={28} className="text-white" />
                    ) : selectedHierarchyNode.level === 'manager' ? (
                      <ShieldCheck size={28} className="text-blue-200" />
                    ) : (
                      <GitBranch size={28} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedHierarchyNode.name}
                    </h3>
                    {selectedHierarchyNode.name_km && (
                      <div className="font-khmer text-sm text-indigo-700 font-bold mt-0.5">
                        {selectedHierarchyNode.name_km}
                      </div>
                    )}
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {language === 'km' ? selectedHierarchyNode.role_km : selectedHierarchyNode.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Tier {selectedHierarchyNode.tier} • {language === 'km' ? selectedHierarchyNode.level_label_km : selectedHierarchyNode.level_label}
                    </span>
                    {selectedHierarchyNode.department_name && (
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                        style={{ backgroundColor: selectedHierarchyNode.department_color || '#6366f1' }}
                      >
                        {selectedHierarchyNode.department_name}
                      </span>
                    )}
                    {selectedHierarchyNode.group_name && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedHierarchyNode.group_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scope & Description Card */}
                {(selectedHierarchyNode.description || selectedHierarchyNode.description_km) && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {language === 'km' ? 'ភារកិច្ច និងដែនសមត្ថកិច្ច' : 'Scope & Responsibilities'}
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {language === 'km' ? selectedHierarchyNode.description_km : selectedHierarchyNode.description}
                    </p>
                  </div>
                )}

                {/* Assigned Staff Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'km' ? 'បុគ្គលិកក្នុងផ្នែកនេះ' : 'Assigned Staff Members'}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {selectedHierarchyNode.assigned_employees.length} {language === 'km' ? 'នាក់' : 'staff'}
                    </span>
                  </div>

                  {selectedHierarchyNode.assigned_employees.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedHierarchyNode.assigned_employees.map((emp) => {
                        const fullEmp = flatEmployees.find((e) => e.id === emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              if (fullEmp) {
                                setSelectedNode(fullEmp);
                                setSelectedHierarchyNode(null);
                              }
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                {emp.name?.[0] || 'E'}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                  <span>{emp.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 font-normal">({emp.id})</span>
                                </div>
                                {emp.khmer_name && (
                                  <div className="font-khmer text-[11px] text-slate-500">{emp.khmer_name}</div>
                                )}
                                <div className="text-[10px] text-slate-500 font-medium">{emp.role}</div>
                              </div>
                            </div>
                            <ChevronRight size={13} className="text-slate-400" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Users size={20} className="mx-auto mb-1.5 text-slate-300" />
                      <p className="font-medium">
                        {language === 'km'
                          ? 'មិនទាន់មានបុគ្គលិកចាត់តាំងក្នុងមុខតំណែងនេះនៅឡើយ'
                          : 'No staff currently assigned to this position'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'km'
                          ? 'អ្នកអាចបញ្ចូលបុគ្គលិកថ្មី ឬកែសម្រួលក្រុមការងារក្នុងទំព័របុគ្គលិក'
                          : 'You can assign employees to this department/group in the Staff directory'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sub-Units & Lines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'km' ? 'ផ្នែក ឬខ្សែរាយការណ៍បន្ទាប់' : 'Direct Sub-Units & Lines'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {selectedHierarchyNode.children.length} {language === 'km' ? 'ផ្នែក' : 'units'}
                    </span>
                  </div>

                  {selectedHierarchyNode.children.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedHierarchyNode.children.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => setSelectedHierarchyNode(child)}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-[10px] shadow-2xs"
                              style={{ backgroundColor: child.department_color || '#6366f1' }}
                            >
                              T{child.tier}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{child.name}</div>
                              {child.name_km && (
                                <div className="font-khmer text-[10px] text-slate-500">{child.name_km}</div>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono">
                                {child.employee_count} {language === 'km' ? 'នាក់' : 'staff'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={12} className="text-slate-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl italic">
                      {language === 'km' ? 'ជាខ្សែប្រតិបត្តិការចុងក្រោយ (Operational End Line)' : 'Operational base tier (no further sub-units)'}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedNode ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Card */}
                <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white text-xl font-bold flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                    {selectedNode.first_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedNode.name}
                    </h3>
                    {selectedNode.khmer_name && (
                      <div className="font-khmer text-sm text-indigo-700 font-bold">
                        {selectedNode.khmer_name}
                      </div>
                    )}
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {selectedNode.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                      {selectedNode.id}
                    </span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: selectedNode.department_color || '#6366f1' }}
                    >
                      {selectedNode.department_name}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {selectedNode.status}
                    </span>
                  </div>
                </div>

                {/* Direct Reporting Manager Card */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {language === 'km' ? 'រាយការណ៍ជូនប្រធានផ្ទាល់ (Reports To)' : 'Direct Line Manager'}
                  </span>
                  {selectedNode.manager_id ? (
                    <div
                      onClick={() => {
                        const mgr = flatEmployees.find((e) => e.id === selectedNode.manager_id);
                        if (mgr) setSelectedNode(mgr);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                          {selectedNode.manager_name?.[0] || 'M'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {selectedNode.manager_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {selectedNode.manager_id}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2">
                      <Crown size={16} className="text-amber-500" />
                      <span>{language === 'km' ? 'ប្រធានជាន់ខ្ពស់បំផុត (Top Level Executive)' : 'Top Level Executive (No Superior)'}</span>
                    </div>
                  )}
                </div>

                {/* Direct Subordinates List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'km' ? 'កូនចៅក្រោមឱវាទផ្ទាល់' : 'Direct Subordinates'}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {selectedNode.direct_reports_count} {language === 'km' ? 'នាក់' : 'reports'}
                    </span>
                  </div>

                  {selectedNode.children && selectedNode.children.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedNode.children.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => setSelectedNode(child)}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {child.first_name?.[0] || 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{child.name}</div>
                              <div className="text-[10px] text-slate-500">{child.role}</div>
                            </div>
                          </div>
                          <ChevronRight size={12} className="text-slate-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl italic">
                      {language === 'km' ? 'គ្មានបុគ្គលិករាយការណ៍ផ្ទាល់' : 'No direct subordinates'}
                    </div>
                  )}
                </div>

                {/* Contact & Job Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  {selectedNode.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{selectedNode.email}</span>
                    </div>
                  )}
                  {selectedNode.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{selectedNode.phone}</span>
                    </div>
                  )}
                  {selectedNode.pay_grade && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase size={14} className="text-slate-400 shrink-0" />
                      <span>Grade: {selectedNode.pay_grade}</span>
                    </div>
                  )}
                  {selectedNode.group_name && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span>Line / Group: {selectedNode.group_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              {selectedHierarchyNode ? (
                <>
                  {selectedHierarchyNode.department_id ? (
                    <button
                      onClick={() => {
                        setSelectedDeptFilter(selectedHierarchyNode.department_id || 'all');
                        setActiveTab('departments');
                        setIsDrawerOpen(false);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers size={14} />
                      <span>{language === 'km' ? 'មើលផ្នែកទាំងអស់' : 'View Department'}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <Link
                    href={selectedHierarchyNode.department_id ? `/employees?department=${selectedHierarchyNode.department_id}` : '/employees'}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Users size={13} />
                    <span>{language === 'km' ? 'មើលបញ្ជីបុគ្គលិក' : 'View Staff List'}</span>
                  </Link>
                </>
              ) : selectedNode ? (
                <>
                  <button
                    onClick={() => {
                      setChainTargetId(selectedNode.id);
                      setActiveTab('chain');
                      setIsDrawerOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <GitBranch size={14} />
                    <span>{language === 'km' ? 'តាមដានខ្សែបញ្ជា' : 'Trace Chain'}</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={() => {
                        setReassignTargetEmp(selectedNode);
                        setNewManagerId(selectedNode.manager_id || '');
                        setReassignModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit2 size={13} />
                      <span>{language === 'km' ? 'ប្តូរប្រធានផ្ទាល់' : 'Reassign Manager'}</span>
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 6. REASSIGN MANAGER MODAL */}
      {reassignModalOpen && reassignTargetEmp && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveReassign}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'កែប្រែខ្សែសង្វាក់រាយការណ៍' : 'Reassign Direct Manager'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                {language === 'km' ? 'បុគ្គលិកគោលដៅ៖' : 'Target Employee:'}{' '}
                <strong className="text-slate-900 font-bold">
                  {reassignTargetEmp.name} ({reassignTargetEmp.id})
                </strong>
                <br />
                <span className="text-slate-400">{reassignTargetEmp.role}</span>
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ជ្រើសរើសប្រធានថ្មី (New Manager)' : 'Select New Reporting Manager'}
                </label>
                <select
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="">{language === 'km' ? '-- គ្មានប្រធានផ្ទាល់ (Top Level) --' : '-- No Manager (Top Level) --'}</option>
                  {flatEmployees
                    .filter((e) => e.id !== reassignTargetEmp.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} - {m.name} [{m.role}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'km'
                    ? 'ប្រព័ន្ធនឹងត្រួតពិនិត្យដោយស្វ័យប្រវត្តិកុំឱ្យមានវដ្តរាយការណ៍ជាន់គ្នា (Circular Loop Prevention)។'
                    : 'System automatically prevents circular reporting loops and updates the database immediately.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={reassignSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {reassignSaving ? (
                  <RefreshCw size={14} className="animate-spin inline mr-1" />
                ) : null}
                <span>{language === 'km' ? 'រក្សាទុក' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Recursive Company Hierarchy Tree Node Component
// ----------------------------------------------------
interface CompanyHierarchyTreeNodeProps {
  node: CompanyHierarchyNode;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string, e?: React.MouseEvent) => void;
  onSelectNode: (node: CompanyHierarchyNode) => void;
  isMatchSearch: (node: CompanyHierarchyNode) => boolean;
  selectedDeptFilter: string;
  language: string;
}

function CompanyHierarchyTreeNode({
  node,
  expandedNodes,
  onToggleExpand,
  onSelectNode,
  isMatchSearch,
  selectedDeptFilter,
  language,
}: CompanyHierarchyTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMatched = isMatchSearch(node);

  // Check if node or any of its descendants belongs to filtered department
  const isDeptMatch = useMemo(() => {
    if (selectedDeptFilter === 'all') return true;
    if (node.department_id === selectedDeptFilter) return true;
    const checkSub = (n: CompanyHierarchyNode): boolean => {
      if (n.department_id === selectedDeptFilter) return true;
      return (n.children || []).some(checkSub);
    };
    return checkSub(node);
  }, [node, selectedDeptFilter]);

  if (!isDeptMatch) return null;

  // Level-specific badge and border styles
  const getHierarchyLevelStyle = () => {
    switch (node.level) {
      case 'board':
        return {
          cardBorder: 'border-amber-300 ring-2 ring-amber-400/40 shadow-lg bg-linear-to-b from-amber-500/10 via-amber-500/5 to-white',
          topBar: '#f59e0b',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
          icon: <Crown size={16} className="text-amber-600" />,
        };
      case 'chairman':
        return {
          cardBorder: 'border-purple-300 ring-2 ring-purple-400/30 shadow-md bg-linear-to-b from-purple-500/10 via-purple-500/5 to-white',
          topBar: '#7c3aed',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-700 ring-1 ring-purple-300',
          icon: <Award size={16} className="text-purple-600" />,
        };
      case 'executive':
        return {
          cardBorder: 'border-indigo-300 ring-2 ring-indigo-400/30 shadow-md bg-linear-to-b from-indigo-500/10 via-indigo-500/5 to-white',
          topBar: '#4f46e5',
          badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300',
          icon: <Building2 size={16} className="text-indigo-600" />,
        };
      case 'department':
        return {
          cardBorder: 'border-slate-300 shadow-sm hover:shadow-md bg-white',
          topBar: node.department_color || '#6366f1',
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
          icon: <Layers size={16} style={{ color: node.department_color || '#6366f1' }} />,
        };
      case 'manager':
        return {
          cardBorder: 'border-blue-200 shadow-xs hover:shadow-md bg-white',
          topBar: node.department_color || '#3b82f6',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
          icon: <ShieldCheck size={16} className="text-blue-600" />,
        };
      case 'section':
        return {
          cardBorder: 'border-emerald-200 shadow-xs hover:shadow-md bg-white',
          topBar: node.department_color || '#10b981',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
          icon: <Briefcase size={15} className="text-emerald-600" />,
        };
      case 'line':
      default:
        return {
          cardBorder: 'border-teal-200 shadow-xs hover:shadow-md bg-white',
          topBar: node.department_color || '#14b8a6',
          badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
          iconBg: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
          icon: <GitBranch size={15} className="text-teal-600" />,
        };
    }
  };

  const style = getHierarchyLevelStyle();

  return (
    <div className="inline-flex flex-col items-center mx-2 sm:mx-3 my-2">
      {/* Node Card */}
      <div
        onClick={() => onSelectNode(node)}
        className={`w-64 rounded-2xl p-3.5 border text-left cursor-pointer transition-all duration-200 relative group select-none ${
          style.cardBorder
        } ${
          isMatched ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105' : 'hover:-translate-y-1 hover:shadow-lg'
        }`}
      >
        {/* Top Department / Level Color Strip */}
        <div
          className="absolute top-0 left-4 right-4 h-1 rounded-b-full"
          style={{ backgroundColor: style.topBar }}
        />

        <div className="flex items-start gap-2.5 pt-1">
          {/* Level Icon Avatar */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-2xl font-bold flex items-center justify-center shrink-0 ${style.iconBg}`}>
              {style.icon}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                node.employee_count > 0 ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          </div>

          {/* Titles & Tier */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${style.badgeBg} truncate max-w-[140px]`}>
                {language === 'km' ? node.level_label_km : node.level_label}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                T{node.tier}
              </span>
            </div>

            <div className="font-black text-xs text-slate-900 truncate mt-1">
              {node.name}
            </div>

            {language === 'km' && node.name_km && (
              <div className="font-khmer text-[11px] text-slate-600 truncate">
                {node.name_km}
              </div>
            )}
          </div>
        </div>

        {/* Role & Operational Detail */}
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          <div className="text-[11px] font-medium text-slate-600 truncate">
            {language === 'km' ? node.role_km : node.role}
          </div>

          <div className="flex items-center justify-between text-[10px] gap-1">
            {node.department_name ? (
              <span
                className="inline-block px-1.5 py-0.5 rounded font-bold truncate max-w-[130px] text-white shadow-2xs"
                style={{ backgroundColor: node.department_color || '#6366f1' }}
              >
                {node.department_name}
              </span>
            ) : (
              <span className="font-mono text-slate-400">{node.id}</span>
            )}

            <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              node.employee_count > 0 ? 'text-indigo-700 bg-indigo-50' : 'text-slate-400 bg-slate-50'
            }`}>
              {node.employee_count} {language === 'km' ? 'នាក់' : 'staff'}
            </span>
          </div>

          {/* Group badge if assigned */}
          {node.group_name && (
            <div className="pt-0.5">
              <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-1.5 py-0.2 rounded truncate max-w-full">
                {node.group_name}
              </span>
            </div>
          )}
        </div>

        {/* Expand / Collapse Button if has children */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => onToggleExpand(node.id, e)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center shadow-xs transition-colors z-10 cursor-pointer"
            title={isExpanded ? 'Collapse' : `Expand ${node.children.length} sub-units`}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Children Sub-tree & Connectors */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center pt-5 relative">
          {/* Vertical line from parent down to horizontal connector bar */}
          <div className="w-px h-5 bg-slate-300 absolute top-0 left-1/2 -translate-x-1/2" />

          {/* Children container with connecting branches */}
          <div className="flex items-start justify-center pt-1 relative">
            {node.children.length > 1 && (
              <div
                className="h-px bg-slate-300 absolute top-1"
                style={{
                  left: '128px',
                  right: '128px',
                }}
              />
            )}

            {node.children.map((childNode) => (
              <div key={childNode.id} className="relative flex flex-col items-center">
                {/* Vertical line from horizontal bar down to child */}
                <div className="w-px h-2 bg-slate-300" />
                <CompanyHierarchyTreeNode
                  node={childNode}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  onSelectNode={onSelectNode}
                  isMatchSearch={isMatchSearch}
                  selectedDeptFilter={selectedDeptFilter}
                  language={language}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Recursive Tree Node Component
// ----------------------------------------------------
interface OrgTreeNodeProps {
  node: OrgNode;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string, e?: React.MouseEvent) => void;
  onSelectNode: (node: OrgNode) => void;
  isMatchSearch: (node: OrgNode) => boolean;
  selectedDeptFilter: string;
  getNodeLevelStyle: (node: OrgNode) => {
    badgeBg: string;
    cardBorder: string;
    accentBg: string;
    levelLabel: string;
  };
  language: string;
}

function OrgTreeNode({
  node,
  expandedNodes,
  onToggleExpand,
  onSelectNode,
  isMatchSearch,
  selectedDeptFilter,
  getNodeLevelStyle,
  language,
}: OrgTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMatched = isMatchSearch(node);
  const levelStyle = getNodeLevelStyle(node);

  // If department filter is active, check if node or any of its descendants belongs to that department
  const isDeptMatch = useMemo(() => {
    if (selectedDeptFilter === 'all') return true;
    if (node.department_id === selectedDeptFilter) return true;
    const checkSub = (n: OrgNode): boolean => {
      if (n.department_id === selectedDeptFilter) return true;
      return (n.children || []).some(checkSub);
    };
    return checkSub(node);
  }, [node, selectedDeptFilter]);

  if (!isDeptMatch) return null;

  return (
    <div className="inline-flex flex-col items-center mx-2 sm:mx-3 my-2">
      {/* Node Card */}
      <div
        onClick={() => onSelectNode(node)}
        className={`org-node-card w-64 bg-white rounded-2xl p-3.5 border text-left cursor-pointer transition-all duration-200 relative group select-none ${
          levelStyle.cardBorder
        } ${
          isMatched ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105' : 'hover:-translate-y-1 hover:shadow-lg'
        }`}
      >
        {/* Top Department Color Strip */}
        <div
          className="absolute top-0 left-4 right-4 h-1 rounded-b-full"
          style={{ backgroundColor: node.department_color || '#6366f1' }}
        />

        <div className="flex items-start gap-2.5 pt-1">
          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-indigo-200">
              {node.first_name?.[0] || 'E'}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                node.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          {/* Name & ID */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {node.id}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${levelStyle.badgeBg}`}>
                {levelStyle.levelLabel}
              </span>
            </div>

            <div className="font-black text-xs text-slate-900 truncate">
              {node.name}
            </div>

            {language === 'km' && node.khmer_name && (
              <div className="font-khmer text-[11px] text-slate-500 truncate">
                {node.khmer_name}
              </div>
            )}
          </div>
        </div>

        {/* Role & Department */}
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          <div className="text-[11px] font-semibold text-slate-700 truncate">
            {node.role}
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span
              className="inline-block px-1.5 py-0.5 rounded font-medium truncate max-w-[140px] text-white"
              style={{ backgroundColor: node.department_color || '#6366f1' }}
            >
              {node.department_name}
            </span>

            {node.direct_reports_count > 0 && (
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {node.direct_reports_count} {language === 'km' ? 'នាក់' : 'leads'}
              </span>
            )}
          </div>
        </div>

        {/* Expand / Collapse Button if has children */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => onToggleExpand(node.id, e)}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center shadow-xs transition-colors z-10 cursor-pointer`}
            title={isExpanded ? 'Collapse' : `Expand ${node.children.length} direct reports`}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Children Sub-tree & Connectors */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center pt-5 relative">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-px h-5 bg-slate-300 absolute top-0 left-1/2 -translate-x-1/2" />

          {/* Children container with connecting branches */}
          <div className="flex items-start justify-center pt-1 relative">
            {node.children.length > 1 && (
              <div
                className="h-px bg-slate-300 absolute top-1"
                style={{
                  left: '128px',
                  right: '128px',
                }}
              />
            )}

            {node.children.map((childNode) => (
              <div key={childNode.id} className="relative flex flex-col items-center">
                {/* Vertical line from horizontal bar down to child */}
                <div className="w-px h-2 bg-slate-300" />
                <OrgTreeNode
                  node={childNode}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  onSelectNode={onSelectNode}
                  isMatchSearch={isMatchSearch}
                  selectedDeptFilter={selectedDeptFilter}
                  getNodeLevelStyle={getNodeLevelStyle}
                  language={language}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
