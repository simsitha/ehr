'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import HestraLogo from '@/components/HestraLogo';
import { formatLocalizedText } from '@/lib/translations';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Timer,
  CalendarCheck,
  FileCheck2,
  Banknote,
  CreditCard,
  Briefcase,
  Award,
  Megaphone,
  Scale,
  BarChart3,
  UserCheck,
  Shield,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  LogOut,
  X,
  Network,
  Laptop,
  Server,
  HeartPulse,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const {
    currentPersona,
    sidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    closeMobileMenu,
    language,
    toggleLanguage,
    logout,
    openModal,
    refreshKey,
    t,
  } = useApp();

  const [employeeCount, setEmployeeCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployeeCount(data.length);
      })
      .catch(() => {});
  }, [refreshKey]);

  const userRole = currentPersona?.role || 'Employee';
  const homeHref = userRole === 'Employee' ? '/portal/staff' : '/';

  // Navigation Categorized by Enterprise Modules
  const navSections = [
    {
      title: t('nav_sec_overview'),
      items: [
        { label: t('nav_dashboard'), href: '/', icon: LayoutDashboard, roles: ['Manager', 'Admin', 'Medical Officer', 'HR Officer'] },
        { label: t('nav_structure'), href: '/structure', icon: Network, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_staff_portal'), href: '/portal/staff', icon: UserCheck, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_manager_portal'), href: '/portal/manager', icon: Shield, roles: ['Manager', 'Admin'] },
      ],
    },
    {
      title: t('nav_sec_workforce'),
      items: [
        {
          label: t('nav_employees'),
          href: '/employees',
          icon: Users,
          roles: ['Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'],
          badge: employeeCount !== null ? String(employeeCount) : undefined,
        },
        { label: t('nav_medical'), href: '/medical', icon: HeartPulse, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_departments'), href: '/departments', icon: Building2, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_roster'), href: '/roster', icon: CalendarDays, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
      ],
    },
    {
      title: t('nav_sec_attendance'),
      items: [
        { label: t('nav_attendance'), href: '/attendance', icon: Clock, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_overtime'), href: '/overtime', icon: Timer, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_leaves'), href: '/leaves', icon: CalendarCheck, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_requests'), href: '/requests', icon: FileCheck2, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_zkteco') || 'ZKTeco Management', href: '/attendance/zkteco', icon: Server, roles: ['Manager', 'Admin', 'IT Support'] },
      ],
    },
    {
      title: t('nav_sec_compensation'),
      items: [
        { label: t('nav_salary'), href: '/salary', icon: Banknote, roles: ['Manager', 'Admin'] },
        { label: t('nav_payroll'), href: '/payroll', icon: CreditCard, roles: ['Admin'] },
        { label: t('nav_recruitment'), href: '/recruitment', icon: Briefcase, roles: ['Admin', 'HR Officer'] },
        { label: t('nav_performance'), href: '/performance', icon: Award, roles: ['Manager', 'Admin'] },
      ],
    },
    {
      title: t('nav_sec_admin'),
      items: [
        { label: t('nav_it_inventory'), href: '/inventory', icon: Laptop, roles: ['Employee', 'Manager', 'Admin', 'IT Support'] },
        { label: t('nav_announcements'), href: '/announcements', icon: Megaphone, roles: ['Employee', 'Manager', 'Admin', 'Medical Officer', 'HR Officer', 'IT Support'] },
        { label: t('nav_tools'), href: '/tools', icon: Scale, roles: ['Admin'] },
        { label: t('nav_reports'), href: '/reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
        { label: t('nav_users'), href: '/users', icon: UserCog, roles: ['Admin', 'IT Support'] },
        { label: t('nav_security') || 'Security & Firewall', href: '/security', icon: ShieldAlert, roles: ['Admin', 'IT Support'] },
        { label: t('nav_settings'), href: '/settings', icon: Settings, roles: ['Admin', 'IT Support'] },
      ],
    },
  ];

  return (
    <aside
      className={`no-print fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white text-slate-700 border-r-0 transition-all duration-300 shadow-xs ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        mobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100/90 bg-white/95 shrink-0">
        <Link
          href={homeHref}
          onClick={closeMobileMenu}
          className="flex items-center gap-3 overflow-hidden group"
        >
          <HestraLogo
            size="md"
            showText={!sidebarCollapsed}
            subtext={t('brand_tagline')}
          />
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          aria-label="Close sidebar"
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links with Categorized Sections */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-2.5">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || sIdx} className="space-y-0.5">
              {/* Section Header (Expanded Mode) */}
              {!sidebarCollapsed ? (
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
              ) : (
                <div className="my-1.5 border-t border-slate-100" />
              )}

              {/* Section Nav Items */}
              {visibleItems.map((item: any) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <div key={item.href} className="relative flex items-center group/item">
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex-1 flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group relative ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r-full before:bg-indigo-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-indigo-600'
                        }`}
                      />

                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {!sidebarCollapsed && item.badge && (
                        <span className="ml-auto mr-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                          {item.badge}
                        </span>
                      )}

                      {/* Floating Tooltip in Collapsed Desktop Mode */}
                      {sidebarCollapsed && (
                        <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          {item.label} {item.badge ? `(${item.badge})` : ''}
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Language Quick Toggle in Sidebar */}
      <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-white/50">
        {!sidebarCollapsed ? (
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
            title={language === 'km' ? 'ប្តូរទៅ English' : 'Switch to Khmer'}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language === 'km' ? '🇰🇭' : '🇬🇧'}</span>
              <span>{language === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English'}</span>
            </div>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
              {language === 'km' ? 'ប្តូរ ⇄ EN' : 'Switch to Khmer'}
            </span>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-base shadow-2xs transition-transform active:scale-95 cursor-pointer"
              title={language === 'km' ? 'ប្តូរទៅ English' : 'Switch to Khmer'}
            >
              {language === 'km' ? '🇰🇭' : '🇬🇧'}
            </button>
          </div>
        )}
      </div>

      {/* Persona Footer Widget */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="relative shrink-0">
              <img
                src={currentPersona.avatar}
                alt={currentPersona.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {formatLocalizedText(currentPersona.name, language)}
                </p>
                <button
                  onClick={() => {
                    logout();
                  }}
                  title={language === 'km' ? 'ចាកចេញ (Sign Out)' : 'Sign Out'}
                  className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-slate-500 truncate">
                  {formatLocalizedText(currentPersona.title, language)}
                </p>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    currentPersona.role === 'Admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : currentPersona.role === 'Medical Officer'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : currentPersona.role === 'HR Officer'
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : currentPersona.role === 'Manager'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : currentPersona.role === 'IT Support'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {currentPersona.role}
                </span>
              </div>
              {userRole === 'Employee' && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-700 font-bold">
                  <div className="flex items-center gap-1">
                    <ShieldAlert size={12} className="text-amber-500 shrink-0" />
                    <span>{language === 'km' ? 'សិទ្ធិកម្រិតកំណត់' : 'Limited Role'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={currentPersona.avatar}
                alt={currentPersona.name}
                title={`${currentPersona.name} (${currentPersona.role})`}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <button
              onClick={() => {
                logout();
              }}
              title={language === 'km' ? 'ចាកចេញ (Sign Out)' : 'Sign Out'}
              className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
