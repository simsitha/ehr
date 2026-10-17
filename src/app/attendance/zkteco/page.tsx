'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Server,
  Plus,
  RotateCw,
  Users,
  Clock,
  History,
  Activity,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit3,
  FileText,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ZKTecoDevice, ZKTecoDeviceUser, ZKTecoRawTransaction, ZKTecoSyncLog, ZKTecoDashboardStats } from '@/lib/types';
import { TestConnectionResult } from '@/lib/zkteco/types';

import ZKTecoDashboardCards from '@/components/zkteco/ZKTecoDashboardCards';
import ZKTecoDeviceList from '@/components/zkteco/ZKTecoDeviceList';
import ZKTecoUserMappingTable from '@/components/zkteco/ZKTecoUserMappingTable';
import ZKTecoLiveAttendanceTable from '@/components/zkteco/ZKTecoLiveAttendanceTable';
import ZKTecoSyncHistoryTable from '@/components/zkteco/ZKTecoSyncHistoryTable';
import ZKTecoNetworkDiagnosticsView from '@/components/zkteco/ZKTecoNetworkDiagnosticsView';
import ZKTecoReportSuite from '@/components/zkteco/reports/ZKTecoReportSuite';

import ZKTecoDeviceModal from '@/components/zkteco/ZKTecoDeviceModal';
import ZKTecoTestResultModal from '@/components/zkteco/ZKTecoTestResultModal';
import ZKTecoUserMapModal from '@/components/zkteco/ZKTecoUserMapModal';
import ZKTecoManualCorrectionModal from '@/components/zkteco/ZKTecoManualCorrectionModal';
import ZKTecoEnrollUserModal from '@/components/zkteco/ZKTecoEnrollUserModal';

export default function ZKTecoDevicesPage() {
  const { currentPersona, showToast, language } = useApp();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'devices' | 'users' | 'punches' | 'reports' | 'history' | 'diagnostics'>('devices');

  // Data states
  const [devices, setDevices] = useState<ZKTecoDevice[]>([]);
  const [users, setUsers] = useState<ZKTecoDeviceUser[]>([]);
  const [transactions, setTransactions] = useState<ZKTecoRawTransaction[]>([]);
  const [logs, setLogs] = useState<ZKTecoSyncLog[]>([]);
  const [stats, setStats] = useState<ZKTecoDashboardStats | null>(null);

  // Loading states
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPunches, setLoadingPunches] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Operational states
  const [syncingAll, setSyncingAll] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [syncingPhotosDeviceId, setSyncingPhotosDeviceId] = useState<string | null>(null);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  // Modals
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ZKTecoDevice | null>(null);

  const [testResultModalOpen, setTestResultModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testedDeviceName, setTestedDeviceName] = useState<string>('');

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedUserToMap, setSelectedUserToMap] = useState<ZKTecoDeviceUser | null>(null);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedDeviceForEnroll, setSelectedDeviceForEnroll] = useState<string | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<ZKTecoDeviceUser | null>(null);

  // Check permissions (Admin or authorized manager)
  const isAuthorized = currentPersona.role === 'Admin' || currentPersona.role === 'Manager';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/zkteco/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
    setLoadingStats(false);
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const res = await fetch('/api/attendance/zkteco/devices');
      if (res.ok) setDevices(await res.json());
    } catch {}
    setLoadingDevices(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/attendance/zkteco/users');
      if (res.ok) setUsers(await res.json());
    } catch {}
    setLoadingUsers(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingPunches(true);
    try {
      const res = await fetch('/api/attendance/zkteco/raw-transactions?limit=250');
      if (res.ok) setTransactions(await res.json());
    } catch {}
    setLoadingPunches(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/attendance/zkteco/sync-history?limit=100');
      if (res.ok) setLogs(await res.json());
    } catch {}
    setLoadingLogs(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchDevices();
    fetchUsers();
  }, [fetchStats, fetchDevices, fetchUsers]);

  // Tab switch fetch
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'punches') fetchTransactions();
    else if (activeTab === 'history') fetchLogs();
  }, [activeTab, fetchUsers, fetchTransactions, fetchLogs]);

  // Handlers
  const handleTestConnection = async (device: ZKTecoDevice) => {
    setTestingDeviceId(device.id);
    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${device.id}/test`, {
        method: 'POST',
      });
      const data: TestConnectionResult = await res.json();
      setTestResult(data);
      setTestedDeviceName(device.name);
      setTestResultModalOpen(true);
      fetchDevices();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Error executing connection test', 'error');
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleSyncUsers = async (device: ZKTecoDevice) => {
    setSyncingDeviceId(device.id);
    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${device.id}/sync/users`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synced ${data.recordsRetrieved} users from ${device.name}.`, 'success');
      } else {
        showToast(data.errorMessage || 'Failed to sync users', 'error');
      }
      fetchDevices();
      fetchStats();
      if (activeTab === 'users') fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Error syncing users', 'error');
    } finally {
      setSyncingDeviceId(null);
    }
  };

  const handleSyncAttendance = async (device: ZKTecoDevice) => {
    setSyncingDeviceId(device.id);
    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${device.id}/sync/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incremental: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Attendance synchronized from ${device.name}: ${data.recordsCreated} new, ${data.duplicates} duplicates.`, 'success');
      } else {
        showToast(data.errorMessage || 'Failed to sync attendance', 'error');
      }
      fetchDevices();
      fetchStats();
      if (activeTab === 'punches') fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'Error syncing attendance', 'error');
    } finally {
      setSyncingDeviceId(null);
    }
  };

  const handleSyncTime = async (device: ZKTecoDevice) => {
    if (!confirm(`Synchronize hardware clock of ${device.name} with server time (Asia/Phnom_Penh)?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${device.id}/sync/time`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Failed to sync time', 'error');
      }
      fetchDevices();
    } catch (err: any) {
      showToast(err.message || 'Error syncing time', 'error');
    }
  };

  const handleSyncPhotos = async (deviceOrId?: ZKTecoDevice | string) => {
    const devId = typeof deviceOrId === 'string' ? deviceOrId : deviceOrId?.id;
    setSyncingPhotosDeviceId(devId || 'all');
    try {
      const url = devId && devId !== 'all'
        ? `/api/attendance/zkteco/devices/${devId}/sync/photos`
        : `/api/attendance/zkteco/users`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_photos', device_id: devId !== 'all' ? devId : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Successfully synchronized biometric user photos.', 'success');
      } else {
        showToast(data.error || data.message || 'Failed to sync user photos', 'error');
      }
      fetchUsers();
      fetchDevices();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Error syncing user photos', 'error');
    } finally {
      setSyncingPhotosDeviceId(null);
    }
  };

  const handleSyncAllDevices = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch('/api/attendance/zkteco/sync-all', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Sync All Complete: ${data.totalRetrieved} logs retrieved (${data.totalNew} new, ${data.totalDuplicates} duplicates). ${data.processedAttendanceCount} daily attendance records processed!`,
          'success'
        );
      } else {
        showToast('Sync All failed for some devices. Check device status.', 'error');
      }
      fetchDevices();
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'punches') fetchTransactions();
      if (activeTab === 'history') fetchLogs();
    } catch (err: any) {
      showToast(err.message || 'Error running batch sync', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleAutoMatchUsers = async () => {
    setIsAutoMatching(true);
    try {
      const res = await fetch('/api/attendance/zkteco/users/auto-match', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || 'Auto matching failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    } finally {
      setIsAutoMatching(false);
    }
  };

  const handleSaveDevice = async (deviceData: Partial<ZKTecoDevice>) => {
    if (editingDevice) {
      const res = await fetch(`/api/attendance/zkteco/devices/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update device');
      }
      showToast('Device configuration updated successfully.', 'success');
    } else {
      const res = await fetch('/api/attendance/zkteco/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register device');
      }
      showToast('New ZKTeco device registered successfully.', 'success');
    }
    fetchDevices();
    fetchStats();
  };

  const handleMapUser = async (recordId: string, employeeId: string) => {
    const res = await fetch('/api/attendance/zkteco/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'map', record_id: recordId, employee_id: employeeId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to map employee');
    }
    showToast('Employee mapped successfully! Historical logs updated.', 'success');
    fetchUsers();
    fetchStats();
  };

  const handleUnmapUser = async (user: ZKTecoDeviceUser) => {
    if (!confirm(`Unmap employee ${user.employee_name || user.employee_id} from PIN #${user.device_user_id}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/attendance/zkteco/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unmap', record_id: user.id }),
      });
      if (res.ok) {
        showToast('User mapping removed.', 'success');
        fetchUsers();
        fetchStats();
      }
    } catch {
      showToast('Error unmapping user', 'error');
    }
  };

  const handleEnrollUser = (device?: ZKTecoDevice) => {
    setSelectedDeviceForEnroll(device?.id);
    setEditingUser(null);
    setEnrollModalOpen(true);
  };

  const handleEditUser = (user: ZKTecoDeviceUser) => {
    setSelectedDeviceForEnroll(user.device_id);
    setEditingUser(user);
    setEnrollModalOpen(true);
  };

  const handleDeleteUser = async (user: ZKTecoDeviceUser) => {
    if (
      !confirm(
        `Are you sure you want to unenroll PIN #${user.device_user_id} (${user.device_user_name || user.employee_name || 'User'}) from ${user.device_name || 'this terminal'}?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/attendance/zkteco/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', record_id: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'User unenrolled from terminal.', 'success');
        fetchUsers();
        fetchDevices();
        fetchStats();
      } else {
        showToast(data.error || 'Failed to unenroll user', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting user', 'error');
    }
  };

  const handlePushEmployees = async (device: ZKTecoDevice | string) => {
    const dId = typeof device === 'string' ? device : device.id;
    const devObj = devices.find((d) => d.id === dId) || (typeof device === 'object' ? device : null);
    const dName = devObj ? devObj.name : dId;

    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${dId}/push-users`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully deployed ${data.queuedCount} active staff profiles to ${dName}!`, 'success');
        fetchUsers();
        fetchDevices();
        fetchStats();
      } else {
        showToast(data.errorMessage || data.message || 'Failed to deploy employees', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deploying employees', 'error');
    }
  };

  const handleDeployToEmployees = async (deviceOrId?: ZKTecoDevice | string) => {
    const dId = typeof deviceOrId === 'string' ? deviceOrId : deviceOrId?.id || 'zk-01';
    const devObj = devices.find((d) => d.id === dId);
    const dName = devObj ? devObj.name : dId;

    if (
      !confirm(
        `Deploy all enrolled users from ${dName} to official HRM employee profiles?\n\nThis will provision new employee profiles with their names, departments, and biometric face photos, and link all device users.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/attendance/zkteco/devices/${dId}/deploy-to-employees`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.message || `Deployment Complete! ${data.newlyCreatedEmployees} employees provisioned, ${data.existingMapped} mapped.`,
          'success'
        );
        fetchUsers();
        fetchDevices();
        fetchStats();
      } else {
        showToast(data.error || data.message || 'Failed to deploy users to employees', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deploying users to employees', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Link href="/attendance" className="hover:text-indigo-600 transition-colors">
              Attendance
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              ZKTeco Biometric Devices
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Server size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ZKTeco Biometric Integration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                SpeedFace-V5L (Platform ZAM230) Native LAN TCP/IP 4370 Synchronization
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sync All Devices */}
          <button
            onClick={handleSyncAllDevices}
            disabled={syncingAll}
            className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCw size={15} className={syncingAll ? 'animate-spin' : ''} />
            <span>{syncingAll ? 'Syncing All Devices...' : 'Sync All Devices'}</span>
          </button>

          {/* Manual Correction (Section 37) */}
          <button
            onClick={() => setCorrectionModalOpen(true)}
            className="btn-press px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Submit HR administrator attendance correction"
          >
            <Edit3 size={15} className="text-amber-600" />
            <span>Attendance Correction</span>
          </button>

          {/* Add Device */}
          <button
            onClick={() => {
              setEditingDevice(null);
              setDeviceModalOpen(true);
            }}
            className="btn-press px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Dashboard KPI Cards (Section 27) */}
      <ZKTecoDashboardCards stats={stats} loading={loadingStats} />

      {/* Tabs Switcher */}
      <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'devices'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Server size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Configured Terminals ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={14} className="text-blue-600" />
          <span>Enrolled Users & Mapping ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('punches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'punches'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs ring-1 ring-emerald-200 dark:ring-emerald-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock size={14} className="text-emerald-600" />
          <span>Live Punches & Raw Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs ring-1 ring-indigo-200 dark:ring-indigo-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={14} className="text-indigo-600" />
          <span>Attendance Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-2xs ring-1 ring-purple-200 dark:ring-purple-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History size={14} className="text-purple-600" />
          <span>Sync Audit History</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'diagnostics'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs ring-1 ring-teal-200 dark:ring-teal-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity size={14} className="text-teal-600" />
          <span>Network Diagnostics & VPN</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'devices' && (
        <ZKTecoDeviceList
          devices={devices}
          users={users}
          loading={loadingDevices}
          onTestConnection={handleTestConnection}
          onSyncUsers={handleSyncUsers}
          onSyncAttendance={handleSyncAttendance}
          onSyncTime={handleSyncTime}
          onSyncPhotos={handleSyncPhotos}
          onEditDevice={(device) => {
            setEditingDevice(device);
            setDeviceModalOpen(true);
          }}
          onEnrollUser={(device) => handleEnrollUser(device)}
          onEditUser={(user) => handleEditUser(user)}
          onDeleteUser={(user) => handleDeleteUser(user)}
          onPushEmployees={(device) => handlePushEmployees(device)}
          onDeployToEmployees={handleDeployToEmployees}
          onOpenMapModal={(u) => {
            setSelectedUserToMap(u);
            setMapModalOpen(true);
          }}
          onUnmapUser={handleUnmapUser}
          onViewAllUsersForDevice={() => setActiveTab('users')}
          testingDeviceId={testingDeviceId}
          syncingDeviceId={syncingDeviceId}
          syncingPhotosDeviceId={syncingPhotosDeviceId}
        />
      )}

      {activeTab === 'users' && (
        <ZKTecoUserMappingTable
          users={users}
          devices={devices}
          loading={loadingUsers}
          onAutoMatch={handleAutoMatchUsers}
          onOpenMapModal={(u) => {
            setSelectedUserToMap(u);
            setMapModalOpen(true);
          }}
          onUnmapUser={handleUnmapUser}
          onEnrollUser={() => handleEnrollUser()}
          onEditUser={(user) => handleEditUser(user)}
          onDeleteUser={(user) => handleDeleteUser(user)}
          onPushEmployees={(deviceId) => handlePushEmployees(deviceId)}
          onDeployToEmployees={handleDeployToEmployees}
          onSyncPhotos={(devId) => handleSyncPhotos(devId)}
          isAutoMatching={isAutoMatching}
          isSyncingPhotos={Boolean(syncingPhotosDeviceId)}
        />
      )}

      {activeTab === 'punches' && (
        <ZKTecoLiveAttendanceTable
          transactions={transactions}
          loading={loadingPunches}
          onRefresh={fetchTransactions}
        />
      )}

      {activeTab === 'reports' && <ZKTecoReportSuite embedded={true} />}

      {activeTab === 'history' && (
        <ZKTecoSyncHistoryTable
          logs={logs}
          loading={loadingLogs}
          onRefresh={fetchLogs}
        />
      )}

      {activeTab === 'diagnostics' && <ZKTecoNetworkDiagnosticsView />}

      {/* Modals */}
      <ZKTecoDeviceModal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onSave={handleSaveDevice}
        device={editingDevice}
      />

      <ZKTecoTestResultModal
        isOpen={testResultModalOpen}
        onClose={() => setTestResultModalOpen(false)}
        result={testResult}
        deviceName={testedDeviceName}
      />

      <ZKTecoUserMapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        user={selectedUserToMap}
        onMap={handleMapUser}
      />

      <ZKTecoEnrollUserModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onSuccess={() => {
          showToast(
            editingUser ? 'User credentials updated.' : 'User enrolled successfully onto terminal.',
            'success'
          );
          fetchUsers();
          fetchDevices();
          fetchStats();
        }}
        devices={devices}
        initialDeviceId={selectedDeviceForEnroll}
        editingUser={editingUser}
      />

      <ZKTecoManualCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        onSuccess={() => {
          showToast('Manual attendance correction applied.', 'success');
          if (activeTab === 'punches') fetchTransactions();
        }}
      />
    </div>
  );
}
