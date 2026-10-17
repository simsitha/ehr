'use client';

import React, { useState } from 'react';
import {
  Server,
  Activity,
  MapPin,
  Clock,
  Users,
  FileText,
  Play,
  RotateCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Smile,
  Fingerprint,
  CreditCard,
  Edit2,
  Trash2,
  Link as LinkIcon,
  Unlink,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Camera,
  UserCheck,
} from 'lucide-react';
import { ZKTecoDevice, ZKTecoDeviceUser } from '@/lib/types';

interface Props {
  devices: ZKTecoDevice[];
  users: ZKTecoDeviceUser[];
  loading: boolean;
  onTestConnection: (device: ZKTecoDevice) => void;
  onSyncUsers: (device: ZKTecoDevice) => void;
  onSyncAttendance: (device: ZKTecoDevice) => void;
  onSyncTime: (device: ZKTecoDevice) => void;
  onSyncPhotos?: (device: ZKTecoDevice) => void;
  onEditDevice: (device: ZKTecoDevice) => void;
  onEnrollUser: (device: ZKTecoDevice) => void;
  onEditUser: (user: ZKTecoDeviceUser) => void;
  onDeleteUser: (user: ZKTecoDeviceUser) => void;
  onPushEmployees: (device: ZKTecoDevice) => void;
  onDeployToEmployees?: (device: ZKTecoDevice) => void;
  onOpenMapModal: (user: ZKTecoDeviceUser) => void;
  onUnmapUser: (user: ZKTecoDeviceUser) => void;
  onViewAllUsersForDevice?: (deviceId: string) => void;
  testingDeviceId: string | null;
  syncingDeviceId: string | null;
  syncingPhotosDeviceId?: string | null;
}

export default function ZKTecoDeviceList({
  devices,
  users,
  loading,
  onTestConnection,
  onSyncUsers,
  onSyncAttendance,
  onSyncTime,
  onSyncPhotos,
  onEditDevice,
  onEnrollUser,
  onEditUser,
  onDeleteUser,
  onPushEmployees,
  onDeployToEmployees,
  onOpenMapModal,
  onUnmapUser,
  onViewAllUsersForDevice,
  testingDeviceId,
  syncingDeviceId,
  syncingPhotosDeviceId,
}: Props) {
  // Track expansion of enrolled users list per device
  const [expandedDevices, setExpandedDevices] = useState<Record<string, boolean>>({
    'zk-01': true, // Expand zk-01 by default so enrolled users are immediately visible
  });

  // Search query per device
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Biometric filter per device
  const [biometricFilters, setBiometricFilters] = useState<Record<string, string>>({});

  // Status filter per device
  const [statusFilters, setStatusFilters] = useState<Record<string, string>>({});

  const toggleDeviceUsers = (deviceId: string) => {
    setExpandedDevices((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <RotateCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
        Loading configured ZKTeco biometric terminals...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => {
        const isTesting = testingDeviceId === device.id;
        const isSyncing = syncingDeviceId === device.id;
        const isOnline = device.status === 'Online';
        const hasTimeSkew = Math.abs(device.time_difference_sec || 0) > 30;
        const isExpanded = !!expandedDevices[device.id];

        // Filter users belonging to this device
        const deviceUsers = users.filter((u) => u.device_id === device.id);

        const currentSearch = (searchQueries[device.id] || '').toLowerCase();
        const currentBioFilter = biometricFilters[device.id] || 'all';
        const currentStatusFilter = statusFilters[device.id] || 'all';

        const filteredDeviceUsers = deviceUsers.filter((u) => {
          const matchSearch =
            !currentSearch ||
            (u.device_user_id || '').toLowerCase().includes(currentSearch) ||
            (u.device_user_name || '').toLowerCase().includes(currentSearch) ||
            (u.employee_name || '').toLowerCase().includes(currentSearch) ||
            (u.employee_id || '').toLowerCase().includes(currentSearch) ||
            (u.card_number || '').toLowerCase().includes(currentSearch);

          const matchBio =
            currentBioFilter === 'all' ||
            (currentBioFilter === 'face' && u.has_face) ||
            (currentBioFilter === 'fingerprint' && u.has_fingerprint) ||
            (currentBioFilter === 'card' && (u.has_card || u.card_number));

          const matchStatus =
            currentStatusFilter === 'all' ||
            (currentStatusFilter === 'Mapped' && u.sync_status === 'Mapped') ||
            (currentStatusFilter === 'Needs Mapping' && u.sync_status !== 'Mapped');

          return matchSearch && matchBio && matchStatus;
        });

        const faceCount = deviceUsers.filter((u) => u.has_face).length;
        const fpCount = deviceUsers.filter((u) => u.has_fingerprint).length;
        const cardCount = deviceUsers.filter((u) => u.has_card || u.card_number).length;
        const mappedCount = deviceUsers.filter((u) => u.sync_status === 'Mapped').length;
        const unmappedCount = deviceUsers.filter((u) => u.sync_status !== 'Mapped').length;

        return (
          <div
            key={device.id}
            className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-700 relative overflow-hidden"
          >
            {/* Top Bar: Device Name, IP, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Server size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {device.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {device.model} ({device.platform || 'ZAM230'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        device.connection_type === 'Push/ADMS'
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {device.connection_type || 'Push/ADMS'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {device.ip_address}
                      {device.connection_type === 'Push/ADMS'
                        ? ' → Push to 192.168.88.168:8081'
                        : `:${device.port}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={13} className="text-rose-500" />
                      {device.location}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">
                      SN: {device.serial_number || 'SF5L2026'}
                    </span>
                    <span>•</span>
                    <span className="text-[11px]">
                      FW: {device.firmware_version || 'Ver 6.60'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    device.status === 'Online'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : device.status === 'Syncing'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                      : device.status === 'Error'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      device.status === 'Online'
                        ? 'bg-emerald-500 animate-pulse'
                        : device.status === 'Syncing'
                        ? 'bg-indigo-500 animate-spin'
                        : device.status === 'Error'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  <span>
                    {device.status === 'Online'
                      ? 'Online (ON)'
                      : device.status === 'Offline'
                      ? 'Offline (OFF)'
                      : device.status}
                  </span>
                </span>
              </div>
            </div>

            {/* Metrics & Spec Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 my-1">
              {/* Interactive Enrolled Users Metric Box */}
              <button
                type="button"
                onClick={() => toggleDeviceUsers(device.id)}
                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  isExpanded
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
                title="Click to view enrolled users list for this device"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Enrolled Users
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                    {isExpanded ? 'Hide' : 'View List'}
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono flex items-center gap-1.5 mt-0.5">
                  <Users size={14} className="text-indigo-500" />
                  {deviceUsers.length > 0 ? deviceUsers.length : (device.user_count || 0)} users
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {mappedCount} Mapped • {unmappedCount} Needs Review
                </span>
              </button>

              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Attendance Logs
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono flex items-center gap-1.5 mt-0.5">
                  <FileText size={14} className="text-teal-500" />
                  {device.log_count || 0} records
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Real-time ADMS Push
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Biometric Engine
                </span>
                <span
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate mt-0.5"
                  title="Face VX3.6 / Finger VX13.0"
                >
                  {device.face_alg || 'ZKFace VX3.6'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {faceCount || device.face_count || 0} Faces • {fpCount || device.fingerprint_count || 0} Fingers
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Last Sync
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 block truncate mt-0.5">
                  {device.last_sync
                    ? new Date(device.last_sync).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Never'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Interval: {device.sync_interval_minutes || 5}m
                </span>
              </div>
            </div>

            {/* Time Skew Warning */}
            {hasTimeSkew && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                  <span>
                    Clock drift detected: Device is {Math.abs(device.time_difference_sec || 0)}s off
                    from server clock.
                  </span>
                </div>
                <button
                  onClick={() => onSyncTime(device)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer transition-colors shadow-2xs"
                >
                  Sync Time Now
                </button>
              </div>
            )}

            {/* Error Message banner */}
            {device.last_error && device.status !== 'Online' && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                <XCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Last Communication Notice: </span>
                  <span className="font-mono text-[11px]">{device.last_error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Toggle Enrolled Users List */}
                <button
                  onClick={() => toggleDeviceUsers(device.id)}
                  className={`btn-press px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800'
                  }`}
                  title="Toggle Enrolled Users List on this device"
                >
                  <Users size={14} />
                  <span>
                    Enrolled Users ({deviceUsers.length > 0 ? deviceUsers.length : (device.user_count || 0)})
                  </span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {/* 2. Enroll New User Button */}
                <button
                  onClick={() => onEnrollUser(device)}
                  className="btn-press px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Add / Enroll user directly onto this device"
                >
                  <UserPlus size={14} className="text-indigo-600" />
                  <span>Enroll User</span>
                </button>

                {/* 3. Push Employees to Device */}
                <button
                  onClick={() => onPushEmployees(device)}
                  className="btn-press px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Provision active Hestra employees onto this device"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Deploy Staff</span>
                </button>

                {/* 3b. Deploy Enrolled Users to HRM Employees */}
                {onDeployToEmployees && (
                  <button
                    onClick={() => onDeployToEmployees(device)}
                    className="btn-press px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Deploy all enrolled terminal users into official Hestra HRM employees"
                  >
                    <UserCheck size={14} className="text-emerald-600" />
                    <span>Deploy to Employees</span>
                  </button>
                )}

                {/* 4. Test Connection */}
                <button
                  onClick={() => onTestConnection(device)}
                  disabled={isTesting}
                  className="btn-press px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title={
                    device.connection_type === 'Push/ADMS'
                      ? 'Verify HRM ADMS Push Receiver (192.168.88.168:8081)'
                      : 'Verify Direct TCP Socket'
                  }
                >
                  <Wifi
                    size={14}
                    className={isTesting ? 'animate-spin text-indigo-600' : 'text-slate-500'}
                  />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {/* 5. Sync Users from Device */}
                <button
                  onClick={() => onSyncUsers(device)}
                  disabled={isSyncing}
                  className="btn-press px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Pull / Sync enrolled users from hardware terminal"
                >
                  <RotateCw size={13} className={isSyncing ? 'animate-spin text-blue-600' : 'text-blue-500'} />
                  <span>Sync Users</span>
                </button>

                {/* 5b. Sync Enrolled User Photos */}
                {onSyncPhotos && (
                  <button
                    onClick={() => onSyncPhotos(device)}
                    disabled={isSyncing || syncingPhotosDeviceId === device.id}
                    className="btn-press px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Synchronize user biometric face photos between terminal and employee profiles"
                  >
                    <Camera size={13} className={syncingPhotosDeviceId === device.id ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
                    <span>{syncingPhotosDeviceId === device.id ? 'Syncing...' : 'Sync Photos'}</span>
                  </button>
                )}

                {/* 6. Sync Attendance */}
                <button
                  onClick={() => onSyncAttendance(device)}
                  disabled={isSyncing}
                  className="btn-press px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCw
                    size={14}
                    className={isSyncing ? 'animate-spin text-indigo-600' : 'text-indigo-600'}
                  />
                  <span>{isSyncing ? 'Synchronizing...' : 'Sync Attendance'}</span>
                </button>
              </div>

              {/* Configure / Manage */}
              <button
                onClick={() => onEditDevice(device)}
                className="btn-press px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Settings size={14} className="text-slate-500" />
                <span>Configure</span>
              </button>
            </div>

            {/* EXPANDABLE SECTION: ENROLLED USERS LIST FOR THIS DEVICE */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3.5 animate-in fade-in duration-200">
                {/* Enrolled Users Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Enrolled Users on {device.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          {deviceUsers.length} Users
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {mappedCount} Mapped to Hestra Staff • {unmappedCount} Needs Review • {faceCount} Faces • {fpCount} Fingerprints
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative w-48 sm:w-56">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search PIN, Name, Card..."
                        value={searchQueries[device.id] || ''}
                        onChange={(e) =>
                          setSearchQueries((prev) => ({ ...prev, [device.id]: e.target.value }))
                        }
                        className="w-full pl-8 pr-3 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Biometric filter */}
                    <select
                      value={biometricFilters[device.id] || 'all'}
                      onChange={(e) =>
                        setBiometricFilters((prev) => ({ ...prev, [device.id]: e.target.value }))
                      }
                      className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer font-medium"
                    >
                      <option value="all">All Biometrics</option>
                      <option value="face">Face Only ({faceCount})</option>
                      <option value="fingerprint">Fingerprint Only ({fpCount})</option>
                      <option value="card">RFID Card Only ({cardCount})</option>
                    </select>

                    {/* Status filter */}
                    <select
                      value={statusFilters[device.id] || 'all'}
                      onChange={(e) =>
                        setStatusFilters((prev) => ({ ...prev, [device.id]: e.target.value }))
                      }
                      className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer font-medium"
                    >
                      <option value="all">All Status</option>
                      <option value="Mapped">Mapped Only ({mappedCount})</option>
                      <option value="Needs Mapping">Needs Review ({unmappedCount})</option>
                    </select>

                    {/* Quick Enroll Button */}
                    <button
                      onClick={() => onEnrollUser(device)}
                      className="btn-press px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <UserPlus size={13} />
                      <span>Enroll User</span>
                    </button>

                    {/* Deploy to HRM Employees Button */}
                    {onDeployToEmployees && (
                      <button
                        onClick={() => onDeployToEmployees(device)}
                        className="btn-press px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Deploy all enrolled users on this device to HRM employee profiles"
                      >
                        <UserCheck size={13} />
                        <span>Deploy to Employees</span>
                      </button>
                    )}

                    {/* Sync Photos Button */}
                    {onSyncPhotos && (
                      <button
                        onClick={() => onSyncPhotos(device)}
                        disabled={syncingPhotosDeviceId === device.id}
                        className="btn-press px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        title="Synchronize biometric photos for users on this device"
                      >
                        <Camera size={13} className={syncingPhotosDeviceId === device.id ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
                        <span>Sync Photos</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Enrolled Users Table */}
                {filteredDeviceUsers.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Users size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {deviceUsers.length === 0
                        ? `No users enrolled on ${device.name} yet.`
                        : 'No users found matching your search and filter criteria.'}
                    </p>
                    {deviceUsers.length === 0 ? (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => onPushEmployees(device)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Sparkles size={14} />
                          <span>Deploy All Active Employees</span>
                        </button>
                        <button
                          onClick={() => onEnrollUser(device)}
                          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <UserPlus size={14} className="text-indigo-600" />
                          <span>Enroll User Manually</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try resetting your search query or filters.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2.5 text-center">Photo</th>
                          <th className="px-3.5 py-2.5">PIN / User ID</th>
                          <th className="px-3.5 py-2.5">Display Name</th>
                          <th className="px-3.5 py-2.5">Biometrics Enrolled</th>
                          <th className="px-3.5 py-2.5">Privilege</th>
                          <th className="px-3.5 py-2.5">Mapped Employee</th>
                          <th className="px-3.5 py-2.5">Mapping Status</th>
                          <th className="px-3.5 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredDeviceUsers.map((u) => {
                          const isMapped = u.sync_status === 'Mapped' && u.employee_id;

                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                            >
                              {/* Photo / Avatar */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap text-center">
                                <div className="relative inline-flex items-center justify-center">
                                  {u.user_photo && !u.user_photo.includes('khmer_') ? (
                                    <img
                                      src={u.user_photo}
                                      alt={u.device_user_name || 'Enrolled User'}
                                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 shadow-2xs"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-[10px]"
                                      title={u.has_face ? 'Face biometrics enrolled on terminal' : 'No photo enrolled on terminal'}
                                    >
                                      {u.device_user_name ? u.device_user_name.slice(0, 2).toUpperCase() : `#${u.device_user_id.slice(-2)}`}
                                    </div>
                                  )}
                                  {Boolean(u.has_face) && (
                                    <span
                                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"
                                      title="Face Biometrics Enrolled on Terminal"
                                    />
                                  )}
                                </div>
                              </td>

                              {/* PIN */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px]">
                                  PIN #{u.device_user_id}
                                </span>
                              </td>

                              {/* Display Name */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {u.device_user_name || 'Enrolled User'}
                                </span>
                              </td>

                              {/* Biometrics */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {u.has_face ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                                      title="Face 3D Template Enrolled"
                                    >
                                      <Smile size={11} /> Face
                                    </span>
                                  ) : null}

                                  {u.has_fingerprint ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
                                      title="Fingerprint Enrolled"
                                    >
                                      <Fingerprint size={11} /> Finger
                                    </span>
                                  ) : null}

                                  {u.card_number || u.has_card ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono"
                                      title={`RFID Card: ${u.card_number || 'Enrolled'}`}
                                    >
                                      <CreditCard size={11} /> {u.card_number || 'Card'}
                                    </span>
                                  ) : null}

                                  {!u.has_face && !u.has_fingerprint && !u.card_number && !u.has_card ? (
                                    <span className="text-[10px] text-slate-400 italic">
                                      PIN Only
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              {/* Privilege */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    u.privilege === 'Admin' || u.privilege === 'SuperAdmin'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                      : u.privilege === 'Enroller'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {u.privilege === 'Admin' || u.privilege === 'SuperAdmin' ? (
                                    <Shield size={10} />
                                  ) : null}
                                  {u.privilege || 'User'}
                                </span>
                              </td>

                              {/* Mapped Employee */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                {isMapped ? (
                                  <div className="flex items-center gap-2">
                                    {u.employee_avatar && !u.employee_avatar.includes('khmer_') ? (
                                      <img
                                        src={u.employee_avatar}
                                        alt={u.employee_name || 'Staff'}
                                        className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-[9px] shrink-0">
                                        {(u.employee_name || 'E').slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
                                        <span>{u.employee_name}</span>
                                        {u.khmer_name && (
                                          <span className="text-slate-400 font-normal">
                                            ({u.khmer_name})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {u.employee_id} • {u.department_name || 'General'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    Unmapped
                                  </span>
                                )}
                              </td>

                              {/* Mapping Status */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                {isMapped ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                    <CheckCircle2 size={10} /> Mapped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                    Needs Review
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Map / Unmap */}
                                  {isMapped ? (
                                    <button
                                      onClick={() => onUnmapUser(u)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Unmap employee link"
                                    >
                                      <Unlink size={13} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onOpenMapModal(u)}
                                      className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Map to Hestra employee"
                                    >
                                      <LinkIcon size={11} /> Map
                                    </button>
                                  )}

                                  {/* Edit User */}
                                  <button
                                    onClick={() => onEditUser(u)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                    title="Edit enrolled user"
                                  >
                                    <Edit2 size={13} />
                                  </button>

                                  {/* Delete User */}
                                  <button
                                    onClick={() => onDeleteUser(u)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Unenroll user from device"
                                  >
                                    <Trash2 size={13} />
                                  </button>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
