'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Search,
  X,
  Bell,
  Clock,
  ScanFace,
  Plus,
  ChevronDown,
  UserCheck,
  CalendarPlus,
  Briefcase,
  DollarSign,
  Award,
  Megaphone,
  User,
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Building,
  Building2,
  Calendar,
  Globe,
  Sun,
  Moon,
  Flame,
  Check,
  FileText,
  Calculator,
  LogIn,
  LogOut,
  KeyRound,
  Menu,
  ChevronRight,
  Shield,
  CheckCheck,
  BellOff,
  Trash2,
  Maximize,
  Minimize,
  Layers,
  ArrowRight,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';
import { formatLocalizedText } from '@/lib/translations';

interface SearchPageItem {
  id: string;
  titleEn: string;
  titleKm: string;
  categoryEn: string;
  categoryKm: string;
  href: string;
  icon: any;
  iconBg: string;
  keywords: string[];
}

const SEARCH_PAGES: SearchPageItem[] = [
  {
    id: 'dashboard',
    titleEn: 'Dashboard Overview',
    titleKm: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
    categoryEn: 'Overview',
    categoryKm: 'ទិដ្ឋភាពទូទៅ',
    href: '/',
    icon: Building2,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    keywords: ['home', 'stats', 'analytics', 'overview', 'dashboard', 'ផ្ទាំងគ្រប់គ្រង'],
  },
  {
    id: 'employees',
    titleEn: 'Workforce Employees Directory',
    titleKm: 'បញ្ជីរាយនាមបុគ្គលិក',
    categoryEn: 'Workforce',
    categoryKm: 'កម្លាំងពលកម្ម',
    href: '/employees',
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    keywords: ['staff', 'workers', 'team', 'roster', 'directory', 'employees', 'បុគ្គលិក', 'កម្មករ'],
  },
  {
    id: 'departments',
    titleEn: 'Departments & Divisions',
    titleKm: 'ផ្នែក & នាយកដ្ឋាន',
    categoryEn: 'Workforce',
    categoryKm: 'កម្លាំងពលកម្ម',
    href: '/departments',
    icon: Building,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    keywords: ['departments', 'divisions', 'teams', 'org', 'ផ្នែក', 'នាយកដ្ឋាន'],
  },
  {
    id: 'structure',
    titleEn: 'Organization Structure',
    titleKm: 'រចនាសម្ព័ន្ធស្ថាប័ន',
    categoryEn: 'Workforce',
    categoryKm: 'កម្លាំងពលកម្ម',
    href: '/structure',
    icon: Layers,
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    keywords: ['tree', 'chart', 'hierarchy', 'structure', 'រចនាសម្ព័ន្ធ'],
  },
  {
    id: 'roster',
    titleEn: 'Duty Roster & Shifts',
    titleKm: 'វេនការងារ & កាលវិភាគ',
    categoryEn: 'Workforce',
    categoryKm: 'កម្លាំងពលកម្ម',
    href: '/roster',
    icon: Calendar,
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
    keywords: ['shifts', 'roster', 'schedule', 'planning', 'វេនការងារ', 'កាលវិភាគ'],
  },
  {
    id: 'attendance',
    titleEn: 'Attendance & Time Tracking',
    titleKm: 'វត្តមាន & ម៉ោងធ្វើការ',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/attendance',
    icon: Clock,
    iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    keywords: ['clock in', 'clock out', 'timesheet', 'attendance', 'វត្តមាន'],
  },
  {
    id: 'zkteco',
    titleEn: 'ZKTeco Biometric Devices',
    titleKm: 'ឧបករណ៍ស្កេនមុខ ZKTeco',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/attendance/zkteco',
    icon: ScanFace,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    keywords: ['zkteco', 'speedface', 'face', 'biometric', 'terminal', 'camera', 'ឧបករណ៍ស្កេន'],
  },
  {
    id: 'attendance-reports',
    titleEn: 'Attendance Reports & Logs',
    titleKm: 'របាយការណ៍វត្តមាន',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/attendance/reports',
    icon: FileText,
    iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
    keywords: ['attendance reports', 'logs', 'timesheet report', 'របាយការណ៍វត្តមាន'],
  },
  {
    id: 'attendance-bonus',
    titleEn: 'Attendance Bonus Module',
    titleKm: 'ប្រាក់រង្វាន់វត្តមាន (Bonus)',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/attendance/bonus',
    icon: Award,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    keywords: ['attendance bonus', 'bonus tiers', 'allowance', 'non-absent', 'ប្រាក់រង្វាន់វត្តមាន'],
  },
  {
    id: 'leaves',
    titleEn: 'Leave Management',
    titleKm: 'ច្បាប់ឈប់សម្រាក',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/leaves',
    icon: CalendarPlus,
    iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
    keywords: ['annual leave', 'sick leave', 'vacation', 'time off', 'ច្បាប់ឈប់សម្រាក'],
  },
  {
    id: 'overtime',
    titleEn: 'Overtime (OT) Management',
    titleKm: 'ការងារថែមម៉ោង (OT)',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/overtime',
    icon: Clock,
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    keywords: ['ot', 'overtime', 'extra hours', 'ថែមម៉ោង'],
  },
  {
    id: 'requests',
    titleEn: 'Requests & Approvals',
    titleKm: 'សំណើសុំ & ការអនុម័ត',
    categoryEn: 'Attendance',
    categoryKm: 'វត្តមាន',
    href: '/requests',
    icon: FileText,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    keywords: ['requests', 'approvals', 'pending', 'workflow', 'សំណើ'],
  },
  {
    id: 'salary',
    titleEn: 'Salary & Compensation',
    titleKm: 'ប្រាក់បៀវត្សរ៍ & ប្រាក់ឧបត្ថម្ភ',
    categoryEn: 'Compensation',
    categoryKm: 'ប្រាក់បំណាច់',
    href: '/salary',
    icon: DollarSign,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    keywords: ['salary', 'basic salary', 'allowance', 'meal', 'seniority', 'ប្រាក់ខែ'],
  },
  {
    id: 'payroll',
    titleEn: 'Payroll & NSSF (Sewing Bonus)',
    titleKm: 'បើកប្រាក់ខែ & ប.ស.ស (ប្រាក់រង្វាន់កាត់ដេរ)',
    categoryEn: 'Compensation',
    categoryKm: 'ប្រាក់បំណាច់',
    href: '/payroll',
    icon: Calculator,
    iconBg: 'bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400',
    keywords: ['payroll', 'payslip', 'nssf', 'sewing bonus', 'weekly output', 'b1', 'b2', 'b3', 'bonus', 'កាត់ដេរ', 'បៀវត្សរ៍', 'ប.ស.ស'],
  },
  {
    id: 'performance',
    titleEn: 'Performance & Reviews',
    titleKm: 'ការវាយតម្លៃសមិទ្ធកម្ម',
    categoryEn: 'Compensation',
    categoryKm: 'ប្រាក់បំណាច់',
    href: '/performance',
    icon: Sparkles,
    iconBg: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-400',
    keywords: ['kpi', 'performance', 'evaluation', 'reviews', 'វាយតម្លៃ'],
  },
  {
    id: 'medical',
    titleEn: 'Medical & Clinic Health Center',
    titleKm: 'បន្ទប់សុខភាព & គ្លីនិក',
    categoryEn: 'Workforce',
    categoryKm: 'កម្លាំងពលកម្ម',
    href: '/medical',
    icon: AlertCircle,
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    keywords: ['medical', 'clinic', 'first aid', 'doctor', 'nurse', 'medicine', 'ពេទ្យ', 'សុខភាព'],
  },
  {
    id: 'recruitment',
    titleEn: 'Recruitment & Job Openings',
    titleKm: 'ជ្រើសរើសបុគ្គលិក (ATS)',
    categoryEn: 'Compensation',
    categoryKm: 'ប្រាក់បំណាច់',
    href: '/recruitment',
    icon: Briefcase,
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    keywords: ['recruitment', 'jobs', 'hiring', 'candidates', 'ats', 'ជ្រើសរើស'],
  },
  {
    id: 'announcements',
    titleEn: 'Company Announcements & Notices',
    titleKm: 'សេចក្តីជូនដំណឹងទូទៅ',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/announcements',
    icon: Megaphone,
    iconBg: 'bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400',
    keywords: ['announcements', 'news', 'bulletin', 'notices', 'ដំណឹង'],
  },
  {
    id: 'inventory',
    titleEn: 'IT & Asset Inventory',
    titleKm: 'សម្ភារៈ & ឧបករណ៍ IT',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/inventory',
    icon: Shield,
    iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    keywords: ['inventory', 'assets', 'laptops', 'equipment', 'សម្ភារៈ'],
  },
  {
    id: 'reports',
    titleEn: 'Reports & Export Center',
    titleKm: 'មជ្ឈមណ្ឌលរបាយការណ៍ & ទាញយក',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/reports',
    icon: FileText,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    keywords: ['reports', 'export', 'csv', 'analytics', 'របាយការណ៍'],
  },
  {
    id: 'tools',
    titleEn: 'HR Tools & Letter Templates',
    titleKm: 'ឧបករណ៍ HR & គំរូលិខិត',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/tools',
    icon: FileText,
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    keywords: ['tools', 'letters', 'contracts', 'templates', 'លិខិត'],
  },
  {
    id: 'users',
    titleEn: 'User Access & Permissions',
    titleKm: 'អ្នកប្រើប្រាស់ & សិទ្ធិ',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/users',
    icon: KeyRound,
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    keywords: ['users', 'roles', 'permissions', 'accounts', 'អ្នកប្រើប្រាស់'],
  },
  {
    id: 'settings',
    titleEn: 'HRM Settings & Company Policies',
    titleKm: 'ការកំណត់ប្រព័ន្ធ & គោលការណ៍',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/settings',
    icon: Shield,
    iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    keywords: ['settings', 'config', 'policies', 'preferences', 'ការកំណត់'],
  },
  {
    id: 'security',
    titleEn: 'Security & Audit Logs',
    titleKm: 'កំណត់ហេតុសុវត្ថិភាព',
    categoryEn: 'Administration',
    categoryKm: 'រដ្ឋបាល',
    href: '/security',
    icon: Shield,
    iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    keywords: ['security', 'audit', 'logs', 'access log', 'សុវត្ថិភាព'],
  },
  {
    id: 'portal-staff',
    titleEn: 'Staff Self-Service Portal',
    titleKm: 'ផតថលបុគ្គលិក (Staff Portal)',
    categoryEn: 'Portals',
    categoryKm: 'ផតថល',
    href: '/portal/staff',
    icon: User,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    keywords: ['staff portal', 'my profile', 'self-service', 'ផតថល'],
  },
  {
    id: 'portal-manager',
    titleEn: 'Manager Portal',
    titleKm: 'ផតថលប្រធានគ្រប់គ្រង',
    categoryEn: 'Portals',
    categoryKm: 'ផតថល',
    href: '/portal/manager',
    icon: UserCheck,
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    keywords: ['manager portal', 'supervisor', 'approvals'],
  },
];

function formatTimeAgo(isoString: string, lang: 'en' | 'km'): string {
  if (!isoString) return '';
  try {
    const now = Date.now();
    const date = new Date(isoString).getTime();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) {
      return lang === 'km' ? 'ទើបតែឥឡូវ' : 'Just now';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return lang === 'km' ? `${diffMin} នាទីមុន` : `${diffMin}m ago`;
    }
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return lang === 'km' ? `${diffHour} ម៉ោងមុន` : `${diffHour}h ago`;
    }
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) {
      return lang === 'km' ? `${diffDay} ថ្ងៃមុន` : `${diffDay}d ago`;
    }
    return new Date(isoString).toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentPersona,
    isClockedIn,
    clockInTime,
    toggleClock,
    openFaceInModal,
    openModal,
    sidebarCollapsed,
    mobileMenuOpen,
    toggleMobileMenu,
    language,
    setLanguage,
    theme,
    setTheme,
    logout,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationItem,
    clearAllNotificationsContext,
    t,
  } = useApp();

  const [personaOpen, setPersonaOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [hasFetchedEmployees, setHasFetchedEmployees] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const personaRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const loadEmployees = async () => {
    if (hasFetchedEmployees || isLoadingEmployees) return;
    setIsLoadingEmployees(true);
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployeesList(data);
          setHasFetchedEmployees(true);
        }
      }
    } catch (err) {
      console.error('Failed to load employees for omni search:', err);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Pre-fetch employees on mount for instant omni search
  useEffect(() => {
    loadEmployees();
  }, []);

  // ⌘K or Ctrl+K to open and focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        loadEmployees();
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 10);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hasFetchedEmployees]);

  // Close search dropdown on route changes
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  // Scroll active item into view
  useEffect(() => {
    if (isSearchOpen) {
      const selectedEl = resultsContainerRef.current?.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isSearchOpen]);

  // Synchronize native computer fullscreen state with UI
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

      if (!isFs) {
        const requestMethod = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (requestMethod) {
          requestMethod.call(docEl);
        }
      } else {
        const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exitMethod) {
          exitMethod.call(doc);
        }
      }
    } catch (err) {
      console.warn('Native computer fullscreen error:', err);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setPersonaOpen(false);
      }
      if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
        setQuickActionOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEmployee = (emp: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hrm:select-employee', {
          detail: { id: emp.id, search: emp.id },
        })
      );
    }
    router.push(`/employees?search=${encodeURIComponent(emp.id)}&id=${encodeURIComponent(emp.id)}`);
  };

  const handleSelectPage = (page: SearchPageItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(page.href);
  };

  const handleSelectAction = (action: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    action.perform();
  };

  const handleViewAllEmployees = (queryStr: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hrm:select-employee', {
          detail: { search: queryStr.trim() },
        })
      );
    }
    router.push(`/employees?search=${encodeURIComponent(queryStr.trim())}`);
  };

  const quickActionsList = [
    {
      id: 'action-add-employee',
      titleEn: 'Add New Staff',
      titleKm: 'បញ្ចូលបុគ្គលិកថ្មី (Add Staff)',
      subEn: 'Onboard employee with contract & NSSF',
      subKm: 'ចុះឈ្មោះបុគ្គលិក និងកិច្ចសន្យា',
      icon: UserCheck,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      keywords: ['add', 'new', 'create', 'onboard', 'hire', 'staff', 'employee', 'បញ្ចូលបុគ្គលិក'],
      perform: () => openModal('add-employee'),
    },
    {
      id: 'action-face-in',
      titleEn: isClockedIn ? 'Face-Out / Clock-Out' : 'Face-In / Clock-In',
      titleKm: isClockedIn ? 'ស្កេនមុខចេញ (Face-Out)' : 'ស្កេនមុខចូល (Face-In)',
      subEn: 'ZKTeco SpeedFace biometrics camera',
      subKm: 'ឧបករណ៍ស្កេនមុខ ZKTeco',
      icon: ScanFace,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      keywords: ['face in', 'face out', 'clock in', 'clock out', 'scan', 'camera', 'zkteco', 'ស្កេន'],
      perform: () => openFaceInModal(),
    },
    {
      id: 'action-request-leave',
      titleEn: 'Request Leave / Time Off',
      titleKm: 'ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក',
      subEn: 'Submit annual, sick or maternity leave',
      subKm: 'សុំច្បាប់ប្រចាំឆ្នាំ ឬជំងឺ',
      icon: CalendarPlus,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      keywords: ['leave', 'vacation', 'sick', 'time off', 'request', 'ច្បាប់', 'សុំច្បាប់'],
      perform: () => openModal('request-leave'),
    },
    {
      id: 'action-run-payroll',
      titleEn: 'Run Monthly Payroll',
      titleKm: 'រៀបចំបើកប្រាក់បៀវត្សរ៍',
      subEn: 'Batch salary, NSSF & sewing bonus calculation',
      subKm: 'គណនាប្រាក់ខែ ប.ស.ស និងប្រាក់រង្វាន់',
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      keywords: ['run payroll', 'calculate', 'salary', 'payslip', 'nssf', 'បើកប្រាក់ខែ'],
      perform: () => openModal('run-payroll'),
    },
    {
      id: 'action-post-announcement',
      titleEn: 'Broadcast Announcement',
      titleKm: 'ផ្សាយដំណឹងក្នុងក្រុមហ៊ុន',
      subEn: 'Publish notice to company dashboard',
      subKm: 'ផ្សព្វផ្សាយដំណឹងទូទៅដល់បុគ្គលិក',
      icon: Megaphone,
      iconBg: 'bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400',
      keywords: ['announcement', 'broadcast', 'post', 'notice', 'ដំណឹង'],
      perform: () => openModal('post-announcement'),
    },
    {
      id: 'action-hr-letter',
      titleEn: 'Generate HR Letter / Certificate',
      titleKm: 'បង្កើតលិខិតរដ្ឋបាល & បញ្ជាក់',
      subEn: 'Employment verification & formal letters',
      subKm: 'លិខិតបញ្ជាក់ការងារ និងឯកសារផ្លូវការ',
      icon: FileText,
      iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
      keywords: ['letter', 'certificate', 'template', 'document', 'contract', 'លិខិត'],
      perform: () => router.push('/tools?tab=letters'),
    },
    {
      id: 'action-fullscreen',
      titleEn: isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen',
      titleKm: isFullscreen ? 'ចាកចេញពីពេញអេក្រង់' : 'បង្ហាញពេញផ្ទៃអេក្រង់',
      subEn: 'Toggle native browser fullscreen display',
      subKm: 'ប្តូរទំហំបង្ហាញពេញអេក្រង់កុំព្យូទ័រ',
      icon: isFullscreen ? Minimize : Maximize,
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      keywords: ['fullscreen', 'screen', 'maximize', 'ពេញអេក្រង់'],
      perform: () => toggleFullscreen(),
    },
  ];

  // Normalize search query
  const query = searchQuery.trim().toLowerCase();

  // Matched employees
  const matchingEmployees = query
    ? employeesList.filter((emp) => {
        const fullNameEn = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const reverseNameEn = `${emp.last_name || ''} ${emp.first_name || ''}`.toLowerCase();
        const khmerName = (emp.khmer_name || '').toLowerCase();
        const id = (emp.id || '').toLowerCase();
        const role = (emp.role || '').toLowerCase();
        const dept = (emp.department_name || '').toLowerCase();
        const group = (emp.group_name || '').toLowerCase();
        const email = (emp.email || '').toLowerCase();

        return (
          id.includes(query) ||
          fullNameEn.includes(query) ||
          reverseNameEn.includes(query) ||
          khmerName.includes(query) ||
          role.includes(query) ||
          dept.includes(query) ||
          group.includes(query) ||
          email.includes(query)
        );
      })
    : [];

  // Matched pages
  const matchingPages = query
    ? SEARCH_PAGES.filter((page) => {
        const titleEn = page.titleEn.toLowerCase();
        const titleKm = page.titleKm.toLowerCase();
        const categoryEn = page.categoryEn.toLowerCase();
        const categoryKm = page.categoryKm.toLowerCase();
        const href = page.href.toLowerCase();
        const matchesKeyword = page.keywords.some((kw) => kw.toLowerCase().includes(query));

        return (
          titleEn.includes(query) ||
          titleKm.includes(query) ||
          categoryEn.includes(query) ||
          categoryKm.includes(query) ||
          href.includes(query) ||
          matchesKeyword
        );
      })
    : SEARCH_PAGES.slice(0, 5); // top 5 suggested pages when query is empty

  // Matched actions
  const matchingActions = query
    ? quickActionsList.filter((act) => {
        const titleEn = act.titleEn.toLowerCase();
        const titleKm = act.titleKm.toLowerCase();
        const subEn = act.subEn.toLowerCase();
        const subKm = act.subKm.toLowerCase();
        const matchesKeyword = act.keywords.some((kw) => kw.toLowerCase().includes(query));

        return (
          titleEn.includes(query) ||
          titleKm.includes(query) ||
          subEn.includes(query) ||
          subKm.includes(query) ||
          matchesKeyword
        );
      })
    : quickActionsList.slice(0, 4); // top 4 suggested actions when query is empty

  // Build flattenedResults array for indexed keyboard navigation
  const visibleEmployees = matchingEmployees.slice(0, 5);
  const visiblePages = matchingPages.slice(0, 4);
  const visibleActions = matchingActions.slice(0, 3);

  const flattenedResults: Array<{
    id: string;
    type: 'employee' | 'page' | 'action' | 'view-all';
    onSelect: () => void;
  }> = [];

  if (query) {
    visibleEmployees.forEach((emp) => {
      flattenedResults.push({
        id: `emp-${emp.id}`,
        type: 'employee',
        onSelect: () => handleSelectEmployee(emp),
      });
    });

    if (matchingEmployees.length > 5) {
      flattenedResults.push({
        id: 'view-all-emp',
        type: 'view-all',
        onSelect: () => handleViewAllEmployees(searchQuery),
      });
    }

    visiblePages.forEach((page) => {
      flattenedResults.push({
        id: `page-${page.id}`,
        type: 'page',
        onSelect: () => handleSelectPage(page),
      });
    });

    visibleActions.forEach((act) => {
      flattenedResults.push({
        id: `act-${act.id}`,
        type: 'action',
        onSelect: () => handleSelectAction(act),
      });
    });
  } else {
    // When query is empty, allow keyboard navigating suggested pages and quick actions
    visiblePages.forEach((page) => {
      flattenedResults.push({
        id: `page-${page.id}`,
        type: 'page',
        onSelect: () => handleSelectPage(page),
      });
    });

    visibleActions.forEach((act) => {
      flattenedResults.push({
        id: `act-${act.id}`,
        type: 'action',
        onSelect: () => handleSelectAction(act),
      });
    });
  }

  const getFlatIndex = (id: string) => flattenedResults.findIndex((item) => item.id === id);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSearchOpen) {
        setIsSearchOpen(true);
        loadEmployees();
        return;
      }
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1 < flattenedResults.length ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isSearchOpen) {
        setIsSearchOpen(true);
        loadEmployees();
        return;
      }
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flattenedResults.length - 1));
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        flattenedResults[selectedIndex].onSelect();
      } else if (searchQuery.trim()) {
        handleViewAllEmployees(searchQuery);
      }
    }
  };

  const getPageInfo = () => {
    switch (pathname) {
      case '/':
        return { category: t('nav_sec_overview'), title: t('nav_dashboard') };
      case '/portal/staff':
        return { category: t('nav_sec_overview'), title: t('nav_staff_portal') };
      case '/portal/manager':
        return { category: t('nav_sec_overview'), title: t('nav_manager_portal') };
      case '/employees':
        return { category: t('nav_sec_workforce'), title: t('nav_employees') };
      case '/departments':
        return { category: t('nav_sec_workforce'), title: t('nav_departments') };
      case '/roster':
        return { category: t('nav_sec_workforce'), title: t('nav_roster') };
      case '/attendance':
        return { category: t('nav_sec_attendance'), title: t('nav_attendance') };
      case '/attendance/bonus':
        return { category: t('nav_sec_attendance'), title: language === 'km' ? 'ប្រាក់រង្វាន់វត្តមាន' : 'Attendance Bonus' };
      case '/overtime':
        return { category: t('nav_sec_attendance'), title: t('nav_overtime') };
      case '/leaves':
        return { category: t('nav_sec_attendance'), title: t('nav_leaves') };
      case '/requests':
        return { category: t('nav_sec_attendance'), title: t('nav_requests') };
      case '/salary':
        return { category: t('nav_sec_compensation'), title: t('nav_salary') };
      case '/payroll':
        return { category: t('nav_sec_compensation'), title: t('nav_payroll') };
      case '/recruitment':
        return { category: t('nav_sec_compensation'), title: t('nav_recruitment') };
      case '/performance':
        return { category: t('nav_sec_compensation'), title: t('nav_performance') };
      case '/announcements':
        return { category: t('nav_sec_admin'), title: t('nav_announcements') };
      case '/tools':
        return { category: t('nav_sec_admin'), title: t('nav_tools') };
      case '/reports':
        return { category: t('nav_sec_admin'), title: t('nav_reports') };
      case '/users':
        return { category: t('nav_sec_admin'), title: t('nav_users') };
      case '/settings':
        return { category: t('nav_sec_admin'), title: t('nav_settings') };
      case '/inventory':
        return { category: t('nav_sec_admin'), title: t('nav_it_inventory') };
      case '/medical':
        return { category: t('nav_sec_workforce'), title: t('nav_medical') };
      default:
        return { category: 'HESTRA', title: 'HRMS' };
    }
  };

  const pageInfo = getPageInfo();


  function getNotificationIcon(type: string) {
    switch (type) {
      case 'request':
        return {
          icon: FileText,
          color: 'text-amber-600 bg-amber-50',
        };
      case 'leave':
        return {
          icon: CalendarPlus,
          color: 'text-blue-600 bg-blue-50',
        };
      case 'overtime':
        return {
          icon: Clock,
          color: 'text-sky-600 bg-sky-50',
        };
      case 'recruitment':
        return {
          icon: Briefcase,
          color: 'text-purple-600 bg-purple-50',
        };
      case 'payroll':
        return {
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-50',
        };
      case 'announcement':
        return {
          icon: Megaphone,
          color: 'text-pink-600 bg-pink-50',
        };
      case 'system':
      default:
        return {
          icon: Sparkles,
          color: 'text-indigo-600 bg-indigo-50',
        };
    }
  }

  const displayedNotifications =
    notifFilter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <header
      className={`no-print sticky top-0 z-30 h-16 glass-panel border-t-0 border-l-0 border-r-0 border-b border-slate-200/80 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}
    >
      {/* Left: Mobile Menu Button & Breadcrumb Navigation */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            {pageInfo.category}
          </span>
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
          <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight truncate">
            {pageInfo.title}
          </span>
        </div>

        {/* Sleek Omni Search Bar */}
        <div className="relative flex-1 min-w-[100px] max-w-[140px] sm:max-w-none sm:w-60 md:w-72 lg:w-80 ml-1 sm:ml-4" ref={searchContainerRef}>
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              isSearchOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
            size={14}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onFocus={() => {
              setIsSearchOpen(true);
              loadEmployees();
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
              setSelectedIndex(0);
              loadEmployees();
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-100/70 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
          />

          {isLoadingEmployees ? (
            <Loader2
              size={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none"
            />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                setSelectedIndex(0);
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-bold font-mono text-slate-400 bg-white/90 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-md shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}

          {/* Search Results Popover Dropdown */}
          {isSearchOpen && (
            <div
              className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-16 sm:top-full mt-1 sm:mt-2 sm:w-[480px] md:w-[540px] max-w-[calc(100vw-1rem)] glass-dropdown rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col"
            >
              {/* Header Status / Top Prompt */}
              {!query ? (
                <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-sky-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-sky-950/20 text-xs flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-[11px]">
                    <Sparkles size={13} className="text-indigo-500" />
                    {language === 'km' ? 'ស្វែងរកទូទៅក្នុងប្រព័ន្ធ HRM' : 'Quick Omni Search & Navigation'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">
                    {employeesList.length || 141} {language === 'km' ? 'បុគ្គលិកសរុប' : 'total staff'}
                  </span>
                </div>
              ) : (
                <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <Search size={12} className="text-indigo-500" />
                    {language === 'km' ? 'លទ្ធផលស្វែងរកសម្រាប់' : 'Results for'}{' '}
                    <strong className="text-slate-900 dark:text-white">&quot;{searchQuery}&quot;</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">
                    {flattenedResults.length} {language === 'km' ? 'លទ្ធផល' : 'matches'}
                  </span>
                </div>
              )}

              {/* Scrollable Results Body */}
              <div
                ref={resultsContainerRef}
                className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
              >
                {/* When query is empty, show Quick Links / Suggested Pages and Quick Actions */}
                {!query ? (
                  <>
                    {/* Suggested Pages */}
                    <div className="p-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 size={12} className="text-indigo-500" />
                        {language === 'km' ? 'ទំព័រណែនាំ (Suggested Pages)' : 'Suggested Pages'}
                      </div>
                      <div className="space-y-0.5">
                        {visiblePages.map((page) => {
                          const flatIndex = getFlatIndex(`page-${page.id}`);
                          const isSelected = selectedIndex === flatIndex;
                          return (
                            <button
                              key={page.id}
                              data-selected={isSelected}
                              onClick={() => handleSelectPage(page)}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/30'
                                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${page.iconBg}`}>
                                  <page.icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">
                                    {language === 'km' ? page.titleKm : page.titleEn}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    {language === 'km' ? page.categoryKm : page.categoryEn} • {page.href}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-500" />
                        {language === 'km' ? 'សកម្មភាពរហ័ស (Quick Actions)' : 'Quick Actions'}
                      </div>
                      <div className="space-y-0.5">
                        {visibleActions.map((act) => {
                          const flatIndex = getFlatIndex(`act-${act.id}`);
                          const isSelected = selectedIndex === flatIndex;
                          return (
                            <button
                              key={act.id}
                              data-selected={isSelected}
                              onClick={() => handleSelectAction(act)}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/30'
                                  : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${act.iconBg}`}>
                                  <act.icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">
                                    {language === 'km' ? act.titleKm : act.titleEn}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    {language === 'km' ? act.subKm : act.subEn}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                <span className="hidden sm:inline">Launch</span>
                                <CornerDownLeft size={11} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* No Results Fallback */}
                    {flattenedResults.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                          <Search size={18} />
                        </div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {language === 'km' ? 'មិនមានលទ្ធផលសម្រាប់' : 'No results found for'} &quot;{searchQuery}&quot;
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                          {language === 'km'
                            ? 'សាកល្បងស្វែងរកតាមលេខកូដ (EMP-0001), ឈ្មោះ, ផ្នែក, ឬតួនាទី'
                            : 'Try searching by employee ID (EMP-0001), name, department, or role'}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewAllEmployees(searchQuery)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Users size={13} />
                            <span>{language === 'km' ? 'ស្វែងរកក្នុងបញ្ជីបុគ្គលិក' : 'Search in Workforce Directory'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 1. Matching Employees */}
                        {visibleEmployees.length > 0 && (
                          <div className="p-1">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users size={12} className="text-blue-500" />
                                {language === 'km' ? 'បុគ្គលិក' : 'Employees'} ({matchingEmployees.length})
                              </span>
                              {matchingEmployees.length > 5 && (
                                <button
                                  type="button"
                                  onClick={() => handleViewAllEmployees(searchQuery)}
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                                >
                                  {language === 'km' ? 'មើលទាំងអស់' : 'View all'}
                                  <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {visibleEmployees.map((emp) => {
                                const flatIndex = getFlatIndex(`emp-${emp.id}`);
                                const isSelected = selectedIndex === flatIndex;
                                return (
                                  <button
                                    key={emp.id}
                                    data-selected={isSelected}
                                    onClick={() => handleSelectEmployee(emp)}
                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/30'
                                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="relative shrink-0">
                                        {emp.avatar ? (
                                          <img
                                            src={emp.avatar}
                                            alt={emp.first_name}
                                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                            onError={(e) => {
                                              (e.target as HTMLElement).style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                                            {(emp.first_name?.[0] || 'E') + (emp.last_name?.[0] || '')}
                                          </div>
                                        )}
                                        <span
                                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 ${
                                            emp.status === 'Active'
                                              ? 'bg-emerald-500'
                                              : emp.status === 'On Leave'
                                              ? 'bg-amber-500'
                                              : 'bg-slate-400'
                                          }`}
                                        />
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-slate-900 dark:text-white truncate">
                                            {emp.first_name} {emp.last_name}
                                          </span>
                                          {emp.khmer_name && (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                                              ({emp.khmer_name})
                                            </span>
                                          )}
                                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                            {emp.id}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                          <span className="truncate">{emp.role}</span>
                                          {emp.department_name && (
                                            <>
                                              <span>•</span>
                                              <span className="truncate">{emp.department_name}</span>
                                            </>
                                          )}
                                          {emp.group_name && (
                                            <>
                                              <span>•</span>
                                              <span className="px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                                                {emp.group_name}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400">
                                      <span className="hidden sm:inline">Profile</span>
                                      <ChevronRight size={12} />
                                    </div>
                                  </button>
                                );
                              })}

                              {/* View all employees link */}
                              {matchingEmployees.length > 5 && (
                                <button
                                  type="button"
                                  data-selected={selectedIndex === getFlatIndex('view-all-emp')}
                                  onClick={() => handleViewAllEmployees(searchQuery)}
                                  onMouseEnter={() => setSelectedIndex(getFlatIndex('view-all-emp'))}
                                  className={`w-full text-center py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                    selectedIndex === getFlatIndex('view-all-emp')
                                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span>
                                    {language === 'km'
                                      ? `មើលបុគ្គលិកទាំង ${matchingEmployees.length} នាក់ក្នុងបញ្ជី`
                                      : `View all ${matchingEmployees.length} matching employees`}
                                  </span>
                                  <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Matching Pages */}
                        {visiblePages.length > 0 && (
                          <div className="p-1">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 size={12} className="text-amber-500" />
                              {language === 'km' ? 'ទំព័រ & ម៉ូឌុល' : 'Pages & Modules'} ({matchingPages.length})
                            </div>
                            <div className="space-y-0.5">
                              {visiblePages.map((page) => {
                                const flatIndex = getFlatIndex(`page-${page.id}`);
                                const isSelected = selectedIndex === flatIndex;
                                return (
                                  <button
                                    key={page.id}
                                    data-selected={isSelected}
                                    onClick={() => handleSelectPage(page)}
                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/30'
                                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`p-1.5 rounded-lg shrink-0 ${page.iconBg}`}>
                                        <page.icon size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate">
                                          {language === 'km' ? page.titleKm : page.titleEn}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                          {language === 'km' ? page.categoryKm : page.categoryEn} • {page.href}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                      <span className="hidden sm:inline">{page.href}</span>
                                      <ChevronRight size={12} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. Matching Actions */}
                        {visibleActions.length > 0 && (
                          <div className="p-1">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={12} className="text-emerald-500" />
                              {language === 'km' ? 'សកម្មភាពរហ័ស' : 'Quick Actions'} ({matchingActions.length})
                            </div>
                            <div className="space-y-0.5">
                              {visibleActions.map((act) => {
                                const flatIndex = getFlatIndex(`act-${act.id}`);
                                const isSelected = selectedIndex === flatIndex;
                                return (
                                  <button
                                    key={act.id}
                                    data-selected={isSelected}
                                    onClick={() => handleSelectAction(act)}
                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/30'
                                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`p-1.5 rounded-lg shrink-0 ${act.iconBg}`}>
                                        <act.icon size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate">
                                          {language === 'km' ? act.titleKm : act.titleEn}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                          {language === 'km' ? act.subKm : act.subEn}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                      <span className="hidden sm:inline">Launch</span>
                                      <CornerDownLeft size={11} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Keyboard Navigation Hints */}
              <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">↑</kbd>
                    <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">↓</kbd>
                    <span className="hidden sm:inline">{language === 'km' ? 'រំកិល' : 'navigate'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">↵</kbd>
                    <span>{language === 'km' ? 'ជ្រើសរើស' : 'select'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">ESC</kbd>
                    <span>{language === 'km' ? 'បិទ' : 'close'}</span>
                  </span>
                </div>
                <div className="text-slate-400 font-medium">
                  {query
                    ? `${flattenedResults.length} ${language === 'km' ? 'លទ្ធផល' : 'results'}`
                    : `${employeesList.length || 141} ${language === 'km' ? 'បុគ្គលិក' : 'staff'}`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Language, Theme, Clock, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Live Attendance Face-In / Out Toggle via ZKTeco SpeedFace Camera */}
        <button
          onClick={openFaceInModal}
          title={isClockedIn ? t('face_out') : t('face_in')}
          className={`btn-press flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
            isClockedIn
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isClockedIn && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isClockedIn ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            ></span>
          </span>
          <ScanFace size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">
            {isClockedIn
              ? `${t('faced_in')} (${clockInTime || '08:30 AM'})`
              : t('face_in')}
          </span>
        </button>

        {/* Quick Action Button */}
        <div className="relative" ref={actionRef}>
          <button
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden md:inline">{t('quick_action')}</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${
                quickActionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {quickActionOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('quick_actions_title')}
              </div>

              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  openModal('add-employee');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <UserCheck size={14} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{t('action_add_employee')}</div>
                  <div className="text-[10px] text-slate-500">{t('action_add_employee_sub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  openModal('request-leave');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <CalendarPlus size={14} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{t('action_request_leave')}</div>
                  <div className="text-[10px] text-slate-500">{t('action_request_leave_sub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  openModal('run-payroll');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign size={14} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{t('action_run_payroll')}</div>
                  <div className="text-[10px] text-slate-500">{t('action_run_payroll_sub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  openModal('post-announcement');
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                  <Megaphone size={14} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{t('action_announcement')}</div>
                  <div className="text-[10px] text-slate-500">{t('action_announcement_sub')}</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100"></div>

              <Link
                href="/tools?tab=letters"
                onClick={() => setQuickActionOpen(false)}
                className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                  <FileText size={14} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{t('action_hr_letter')}</div>
                  <div className="text-[10px] text-slate-500">{t('action_hr_letter_sub')}</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Global Website Theme Switcher */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={language === 'km' ? 'ប្តូររចនាប័ទ្មផ្ទាំងប្រព័ន្ធ (System Theme)' : 'Switch System Theme'}
          >
            {theme === 'midnight' ? (
              <Moon size={16} className="text-indigo-400" />
            ) : theme === 'indigo' ? (
              <Flame size={16} className="text-cyan-400" />
            ) : (
              <Sun size={16} className="text-amber-500" />
            )}
          </button>

          {themeOpen && (
            <div className="absolute right-0 mt-2 w-52 glass-dropdown rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('theme_label')}
              </div>

              <button
                onClick={() => {
                  setTheme('nordic');
                  setThemeOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                  theme === 'nordic' ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun size={15} className="text-amber-500" />
                  <span>{t('theme_light')}</span>
                </div>
                {theme === 'nordic' && <Check size={14} className="text-indigo-600" />}
              </button>

              <button
                onClick={() => {
                  setTheme('midnight');
                  setThemeOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                  theme === 'midnight' ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon size={15} className="text-indigo-400" />
                  <span>{t('theme_dark')}</span>
                </div>
                {theme === 'midnight' && <Check size={14} className="text-indigo-600" />}
              </button>

              <button
                onClick={() => {
                  setTheme('indigo');
                  setThemeOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                  theme === 'indigo' ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame size={15} className="text-cyan-400" />
                  <span>{t('theme_indigo')}</span>
                </div>
                {theme === 'indigo' && <Check size={14} className="text-indigo-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Global Whole Page Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title={
            isFullscreen
              ? (t('fullscreen_exit') || 'Exit Fullscreen') + ' (Esc)'
              : (t('fullscreen_enter') || 'Full Screen View') + ' (F11)'
          }
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize size={16} className="text-indigo-600" />
          ) : (
            <Maximize size={16} className="text-slate-600 hover:text-indigo-600" />
          )}
        </button>

        {/* Global Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={language === 'km' ? 'ប្តូរភាសា (Switch Language)' : 'Switch Language'}
          >
            <Globe size={14} className="text-indigo-500" />
            <span className="font-bold text-[11px]">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 glass-dropdown rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setLanguage('km');
                  setLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                  language === 'km' ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-slate-100/70'
                }`}
              >
                <span>🇰🇭 ភាសាខ្មែរ</span>
                {language === 'km' && <Check size={14} className="text-indigo-600" />}
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                  setLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                  language === 'en' ? 'bg-indigo-50 font-bold text-indigo-700' : 'hover:bg-slate-100/70'
                }`}
              >
                <span>🇬🇧 English</span>
                {language === 'en' && <Check size={14} className="text-indigo-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 relative transition-colors shadow-2xs cursor-pointer"
            title={language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-400 animate-ping opacity-30"></span>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              </>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 glass-dropdown rounded-2xl shadow-xl border border-slate-200/80 p-0 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {language === 'km' ? 'ការជូនដំណឹង (Notifications)' : 'Notifications'}
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {unreadNotificationsCount} {language === 'km' ? 'ថ្មី' : 'new'}
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllNotificationsAsRead();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    <span>{t('mark_all_read')}</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-4 py-1.5 border-b border-slate-100/80 bg-white">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    notifFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {t('all_notifications')} ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    notifFilter === 'unread'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {t('unread_notifications')} ({unreadNotificationsCount})
                </button>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100/80 max-h-80 overflow-y-auto">
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                      <BellOff size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{t('no_notifications')}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t('caught_up_message')}</p>
                  </div>
                ) : (
                  displayedNotifications.map((n) => {
                    const iconConfig = getNotificationIcon(n.type);
                    const Icon = iconConfig.icon;
                    const itemTitle = language === 'km' && n.title_km ? n.title_km : n.title;
                    const itemMessage = language === 'km' && n.message_km ? n.message_km : n.message;
                    const timeAgo = formatTimeAgo(n.created_at, language);

                    return (
                      <div
                        key={n.id}
                        className={`group relative flex items-start gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                          !n.is_read
                            ? 'bg-indigo-50/20 hover:bg-indigo-50/40'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <Link
                          href={n.link || '/'}
                          onClick={() => {
                            if (!n.is_read) {
                              markNotificationAsRead(n.id, true);
                            }
                            setNotificationsOpen(false);
                          }}
                          className="flex items-start gap-3 flex-1 min-w-0"
                        >
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconConfig.color}`}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0 pr-12">
                            <p className={`text-xs leading-snug truncate ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {itemTitle}
                            </p>
                            {itemMessage && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {itemMessage}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              {timeAgo}
                            </p>
                          </div>
                        </Link>

                        {/* Unread dot & hover action buttons */}
                        <div className="absolute right-3 top-3 flex items-center gap-1">
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 group-hover:hidden shrink-0"></span>
                          )}
                          <div className="hidden group-hover:flex items-center gap-1 bg-white/90 shadow-2xs rounded-lg p-0.5 border border-slate-200/60">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(n.id, !n.is_read);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title={n.is_read ? t('mark_as_unread') || 'Mark unread' : t('mark_as_read') || 'Mark read'}
                            >
                              <Check size={12} className={n.is_read ? 'text-slate-300' : 'text-indigo-600'} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationItem(n.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={t('delete_notification') || 'Delete'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/70 text-[11px]">
                  <button
                    onClick={() => clearAllNotificationsContext()}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                  >
                    {t('clear_all_notifications')}
                  </button>
                  <span className="text-slate-400 text-[10px]">
                    HESTRA HRM Notification Center
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Authenticated User Persona Dropdown */}
        <div className="relative" ref={personaRef}>
          <button
            onClick={() => setPersonaOpen(!personaOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="relative">
              {currentPersona.avatar ? (
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center ring-1 ring-indigo-200/50 shadow-2xs">
                  {currentPersona.name ? currentPersona.name.trim().charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight pr-1">
              <div className="font-bold text-slate-800">{formatLocalizedText(currentPersona.name, language)}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {currentPersona.role}
              </div>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {personaOpen && (
            <div className="absolute right-0 mt-2 w-72 glass-dropdown rounded-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Authenticated User Card */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                {currentPersona.avatar ? (
                  <img
                    src={currentPersona.avatar}
                    alt={currentPersona.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-indigo-500/20 shrink-0 shadow-sm">
                    {currentPersona.name ? currentPersona.name.trim().charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {formatLocalizedText(currentPersona.name, language)}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        currentPersona.role === 'Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : currentPersona.role === 'Medical Officer'
                          ? 'bg-rose-100 text-rose-700'
                          : currentPersona.role === 'HR Officer'
                          ? 'bg-cyan-100 text-cyan-700'
                          : currentPersona.role === 'Manager'
                          ? 'bg-blue-100 text-blue-700'
                          : currentPersona.role === 'IT Support'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currentPersona.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {formatLocalizedText(currentPersona.title || '', language)}
                  </p>
                  {currentPersona.email && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentPersona.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="my-2 border-t border-slate-100"></div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setPersonaOpen(false);
                    openModal('change-password');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition-colors cursor-pointer"
                >
                  <KeyRound size={15} className="text-indigo-600" />
                  <span>{language === 'km' ? 'ប្តូរពាក្យសម្ងាត់ (Change Password)' : 'Change Password'}</span>
                </button>

                <Link
                  href="/login"
                  onClick={() => setPersonaOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition-colors"
                >
                  <LogIn size={15} className="text-slate-400" />
                  <span>{language === 'km' ? 'ទំព័រចូលប្រើប្រព័ន្ធ (Login Page)' : 'Go to Login Portal'}</span>
                </Link>

                <button
                  onClick={() => {
                    setPersonaOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>{language === 'km' ? 'ចាកចេញពីប្រព័ន្ធ (Sign Out)' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
