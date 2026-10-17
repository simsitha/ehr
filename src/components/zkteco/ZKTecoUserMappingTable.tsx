'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Fingerprint,
  Smile,
  CreditCard,
  RotateCw,
  Sparkles,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Server,
  Camera,
} from 'lucide-react';
import { ZKTecoDevice, ZKTecoDeviceUser } from '@/lib/types';
import { useApp } from '@/context/AppContext';

interface Props {
  users: ZKTecoDeviceUser[];
  devices?: ZKTecoDevice[];
  loading: boolean;
  onAutoMatch: () => void;
  onOpenMapModal: (user: ZKTecoDeviceUser) => void;
  onUnmapUser: (user: ZKTecoDeviceUser) => void;
  onEnrollUser?: (device?: ZKTecoDevice) => void;
  onEditUser?: (user: ZKTecoDeviceUser) => void;
  onDeleteUser?: (user: ZKTecoDeviceUser) => void;
  onPushEmployees?: (deviceId: string) => void;
  onDeployToEmployees?: (deviceId?: string) => void;
  onSyncPhotos?: (deviceId?: string) => void;
  initialDeviceId?: string;
  isAutoMatching: boolean;
  isSyncingPhotos?: boolean;
}

export default function ZKTecoUserMappingTable({
  users,
  devices = [],
  loading,
  onAutoMatch,
  onOpenMapModal,
  onUnmapUser,
  onEnrollUser,
  onEditUser,
  onDeleteUser,
  onPushEmployees,
  onDeployToEmployees,
  onSyncPhotos,
  initialDeviceId = 'all',
  isAutoMatching,
  isSyncingPhotos = false,
}: Props) {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Mapped' | 'Needs Mapping'>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>(initialDeviceId);
  const [biometricFilter, setBiometricFilter] = useState<'all' | 'face' | 'fingerprint' | 'card'>('all');

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (u.device_user_id || '').toLowerCase().includes(q) ||
      (u.device_user_name || '').toLowerCase().includes(q) ||
      (u.employee_name || '').toLowerCase().includes(q) ||
      (u.employee_id || '').toLowerCase().includes(q) ||
      (u.card_number || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || u.sync_status === statusFilter;
    const matchDevice = deviceFilter === 'all' || u.device_id === deviceFilter;

    const matchBio =
      biometricFilter === 'all' ||
      (biometricFilter === 'face' && u.has_face) ||
      (biometricFilter === 'fingerprint' && u.has_fingerprint) ||
      (biometricFilter === 'card' && (u.has_card || u.card_number));

    return matchSearch && matchStatus && matchDevice && matchBio;
  });

  const totalUsers = users.length;
  const mappedCount = users.filter((u) => u.sync_status === 'Mapped').length;
  const unmappedCount = users.filter((u) => u.sync_status !== 'Mapped').length;
  const faceCount = users.filter((u) => u.has_face).length;
  const fpCount = users.filter((u) => u.has_fingerprint).length;
  const cardCount = users.filter((u) => u.has_card || u.card_number).length;

  return (
    <div className="space-y-4">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Enrolled
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5 flex items-center gap-1.5">
            <Users size={14} className="text-indigo-600" />
            {totalUsers}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Face Templates
          </span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 flex items-center gap-1.5">
            <Smile size={14} />
            {faceCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fingerprints
          </span>
          <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5 flex items-center gap-1.5">
            <Fingerprint size={14} />
            {fpCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            RFID Badges
          </span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 flex items-center gap-1.5">
            <CreditCard size={14} />
            {cardCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Mapped Staff
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            {mappedCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Needs Review
          </span>
          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
            <AlertCircle size={14} />
            {unmappedCount}
          </span>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search PIN, Name, Card, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Dynamic Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer font-medium"
          >
            <option value="all">All Terminals ({users.length})</option>
            {devices.map((d) => {
              const dCount = users.filter((u) => u.device_id === d.id).length;
              return (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.location}) — {dCount} users
                </option>
              );
            })}
          </select>

          {/* Biometric Modality Filter */}
          <select
            value={biometricFilter}
            onChange={(e) => setBiometricFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer font-medium"
          >
            <option value="all">All Biometrics</option>
            <option value="face">Face Enrolled ({faceCount})</option>
            <option value="fingerprint">Fingerprint Enrolled ({fpCount})</option>
            <option value="card">RFID Card ({cardCount})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer font-medium"
          >
            <option value="all">All Status ({users.length})</option>
            <option value="Mapped">Mapped Staff ({mappedCount})</option>
            <option value="Needs Mapping">Needs Review ({unmappedCount})</option>
          </select>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Enroll User Button */}
          {onEnrollUser && (
            <button
              onClick={() => onEnrollUser()}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus size={14} className="text-indigo-600" />
              <span>Enroll User</span>
            </button>
          )}

          {/* Deploy Employees */}
          {onPushEmployees && (
            <button
              onClick={() => onPushEmployees(deviceFilter !== 'all' ? deviceFilter : 'zk-01')}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Deploy active Hestra employees onto terminal"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Deploy Staff</span>
            </button>
          )}

          {/* Deploy to HRM Employees */}
          {onDeployToEmployees && (
            <button
              onClick={() => onDeployToEmployees(deviceFilter !== 'all' ? deviceFilter : 'zk-01')}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Deploy all enrolled users from ZKTeco into HRM employees"
            >
              <UserCheck size={14} />
              <span>Deploy to Employees</span>
            </button>
          )}

          {/* Sync Photos Button */}
          {onSyncPhotos && (
            <button
              onClick={() => onSyncPhotos(deviceFilter !== 'all' ? deviceFilter : undefined)}
              disabled={isSyncingPhotos}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Synchronize user photos between biometric terminals and employee records"
            >
              <Camera size={14} className={isSyncingPhotos ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
              <span>{isSyncingPhotos ? 'Syncing...' : 'Sync Photos'}</span>
            </button>
          )}

          {/* Auto Match Button */}
          <button
            onClick={onAutoMatch}
            disabled={isAutoMatching}
            className="btn-press px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} className={isAutoMatching ? 'animate-spin' : ''} />
            <span>{isAutoMatching ? 'Matching Engine...' : 'Auto-Match Users'}</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Enrolled Biometric Users ({filteredUsers.length} Users)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {mappedCount} Mapped • {unmappedCount} Needs Review
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RotateCw size={22} className="animate-spin mx-auto mb-2 text-indigo-500" />
            Loading device user catalog...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs px-4">
            No biometric users found matching your filters.
            <p className="mt-1 text-slate-500">
              Click &quot;Enroll User&quot; to register a profile, or &quot;Deploy Staff&quot; to provision employees.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-3.5 text-center">Terminal Photo</th>
                  <th className="px-4 py-3.5">Device PIN / User ID</th>
                  <th className="px-4 py-3.5">Device Source</th>
                  <th className="px-4 py-3.5">Biometrics Enrolled</th>
                  <th className="px-4 py-3.5">Privilege</th>
                  <th className="px-4 py-3.5">Mapped Hestra Employee</th>
                  <th className="px-4 py-3.5">Status & Confidence</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isMapped = u.sync_status === 'Mapped' && u.employee_id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                    >
                      {/* Terminal Photo from ZKTeco Device */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
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

                      {/* PIN & Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            PIN #{u.device_user_id}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {u.device_user_name || 'Enrolled User'}
                          </span>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {u.device_name || u.device_id}
                        </span>
                      </td>

                      {/* Biometrics */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.has_face ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                              title="Face Biometrics Enrolled"
                            >
                              <Smile size={11} /> Face
                            </span>
                          ) : null}

                          {u.has_fingerprint ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
                              title="Fingerprint Enrolled"
                            >
                              <Fingerprint size={11} /> Finger
                            </span>
                          ) : null}

                          {u.card_number || u.has_card ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono"
                              title={`RFID Card: ${u.card_number || 'Enrolled'}`}
                            >
                              <CreditCard size={11} /> {u.card_number || 'Card'}
                            </span>
                          ) : null}

                          {!u.has_face && !u.has_fingerprint && !u.card_number && !u.has_card && (
                            <span className="text-[10px] text-slate-400 italic">PIN Only</span>
                          )}
                        </div>
                      </td>

                      {/* Privilege */}
                      <td className="px-4 py-3 whitespace-nowrap">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isMapped ? (
                          <div className="flex items-center gap-2.5">
                            {u.employee_avatar && !u.employee_avatar.includes('khmer_') ? (
                              <img
                                src={u.employee_avatar}
                                alt={u.employee_name || 'Staff'}
                                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0">
                                {(u.employee_name || 'E').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <span>{u.employee_name}</span>
                                {u.khmer_name && (
                                  <span className="text-slate-400 font-normal">
                                    ({u.khmer_name})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {u.employee_id} • {u.department_name || 'General'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                            <AlertCircle size={13} className="text-amber-500" />
                            Unmapped — select employee
                          </span>
                        )}
                      </td>

                      {/* Status & Method */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isMapped ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 size={11} /> Mapped
                            </span>
                            <div className="text-[10px] text-slate-400">
                              via {u.match_method} ({Math.round((u.match_confidence || 1) * 100)}%)
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            Needs Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Map / Unmap */}
                          {isMapped ? (
                            <button
                              onClick={() => onUnmapUser(u)}
                              className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Unmap this employee link"
                            >
                              <Unlink size={13} /> Unmap
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenMapModal(u)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <LinkIcon size={13} /> Map Employee
                            </button>
                          )}

                          {/* Edit User */}
                          {onEditUser && (
                            <button
                              onClick={() => onEditUser(u)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title="Edit user credentials"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {/* Delete User */}
                          {onDeleteUser && (
                            <button
                              onClick={() => onDeleteUser(u)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Unenroll user from device"
                            >
                              <Trash2 size={13} />
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
    </div>
  );
}
