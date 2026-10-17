'use client';

import React from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { ZKTecoDashboardStats } from '@/lib/types';

interface Props {
  stats: ZKTecoDashboardStats | null;
  loading: boolean;
}

export default function ZKTecoDashboardCards({ stats, loading }: Props) {
  const totalDevices = stats?.total_devices ?? 2;
  const onlineDevices = stats?.online_devices ?? 0;
  const offlineDevices = stats?.offline_devices ?? 2;
  const mappedUsers = stats?.total_mapped_users ?? 0;
  const todayPunches = stats?.today_punches ?? 0;
  const syncErrors = stats?.sync_errors_today ?? 0;
  const lastSync = stats?.last_sync ? new Date(stats.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Total Devices */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Devices</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <HardDrive size={16} />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white my-1 font-mono">
          {loading ? '...' : totalDevices}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">SpeedFace-V5L (ZAM230)</span>
      </div>

      {/* 2. Online Devices */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Online</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-1 font-mono flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          {loading ? '...' : onlineDevices}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Active LAN / TCP 4370</span>
      </div>

      {/* 3. Offline Devices */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500 before:to-amber-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Offline</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle size={16} />
          </div>
        </div>
        <div className={`text-2xl font-black my-1 font-mono ${offlineDevices > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
          {loading ? '...' : offlineDevices}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Needs VPN / Routing</span>
      </div>

      {/* 4. Mapped Users */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-blue-500 before:to-blue-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Mapped Staff</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users size={16} />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 my-1 font-mono">
          {loading ? '...' : mappedUsers}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Linked Biometric Users</span>
      </div>

      {/* 5. Today's Transactions */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-teal-500 before:to-teal-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Punches</span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Clock size={16} />
          </div>
        </div>
        <div className="text-2xl font-black text-teal-600 dark:text-teal-400 my-1 font-mono">
          {loading ? '...' : todayPunches}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Real-time Biometrics</span>
      </div>

      {/* 6. Last Sync / Errors */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-purple-500 before:to-purple-300">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Last Sync</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <RefreshCw size={16} />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white my-1 font-mono">
          {loading ? '...' : lastSync}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          {syncErrors > 0 ? (
            <span className="text-rose-600 font-bold flex items-center gap-0.5">
              <AlertTriangle size={11} /> {syncErrors} errors today
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold">Sync Healthy</span>
          )}
        </div>
      </div>
    </div>
  );
}
