'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './Toast';
import GlobalModals from './GlobalModals';
import ChangePasswordModal from './ChangePasswordModal';
import FaceInModal from './zkteco/FaceInModal';
import { useApp } from '@/context/AppContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu, language } = useApp();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 app-mesh-bg">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 app-mesh-bg flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-35 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Navigation Sidebar */}
      <Sidebar />

      {/* Top Glassmorphic Navigation Header */}
      <Header />

      {/* Core Page Content Viewport */}
      <main
        className={`flex-1 transition-all duration-300 px-4 py-6 sm:px-6 lg:px-8 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Sleek Enterprise Status Footer */}
      <footer
        className={`no-print py-3.5 px-6 border-b-0 border-l-0 border-r-0 border-t border-slate-200/80 glass-panel transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700">HESTRA HRM v2.4</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400">
              {language === 'km' ? 'ប្រព័ន្ធដំណើរការធម្មតា (Phnom Penh Node)' : 'All Systems Operational • Phnom Penh HQ'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="font-medium text-slate-400">
              {language === 'km'
                ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026 Sim Sitha'
                : 'Copyright © 2026 Sim Sitha. All rights reserved.'}
            </span>
          </div>
        </div>
      </footer>

      <ToastContainer />
      <GlobalModals />
      <ChangePasswordModal />
      <FaceInModal />
    </div>
  );
}
