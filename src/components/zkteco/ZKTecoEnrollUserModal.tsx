'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Edit2,
  X,
  Server,
  Smile,
  Fingerprint,
  CreditCard,
  Key,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Camera,
} from 'lucide-react';
import { ZKTecoDevice, ZKTecoDeviceUser } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  devices: ZKTecoDevice[];
  initialDeviceId?: string;
  editingUser?: ZKTecoDeviceUser | null;
}

export default function ZKTecoEnrollUserModal({
  isOpen,
  onClose,
  onSuccess,
  devices,
  initialDeviceId,
  editingUser,
}: Props) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceUserId, setDeviceUserId] = useState('');
  const [deviceUserName, setDeviceUserName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [privilege, setPrivilege] = useState<'User' | 'Enroller' | 'Admin' | 'SuperAdmin'>('User');
  const [hasFace, setHasFace] = useState(true);
  const [hasFingerprint, setHasFingerprint] = useState(true);
  const [hasCard, setHasCard] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [employees, setEmployees] = useState<any[]>([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch employees on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoadingEmployees(true);
      fetch('/api/employees')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setEmployees(data);
          setLoadingEmployees(false);
        })
        .catch(() => setLoadingEmployees(false));

      if (editingUser) {
        setDeviceId(editingUser.device_id);
        setDeviceUserId(editingUser.device_user_id);
        setDeviceUserName(editingUser.device_user_name || '');
        setCardNumber(editingUser.card_number || '');
        const p = (editingUser.user_photo || '').trim();
        setUserPhoto(p.includes('khmer_') ? '' : p);
        setPrivilege(editingUser.privilege || 'User');
        setHasFace(Boolean(editingUser.has_face));
        setHasFingerprint(Boolean(editingUser.has_fingerprint));
        setHasCard(Boolean(editingUser.has_card || editingUser.card_number));
        setSelectedEmployeeId(editingUser.employee_id || '');
      } else {
        setDeviceId(initialDeviceId || (devices.length > 0 ? devices[0].id : 'zk-01'));
        setDeviceUserId('');
        setDeviceUserName('');
        setCardNumber('');
        setUserPhoto('');
        setPrivilege('User');
        setHasFace(true);
        setHasFingerprint(true);
        setHasCard(false);
        setSelectedEmployeeId('');
      }
    }
  }, [isOpen, editingUser, initialDeviceId, devices]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((e) => {
    const q = searchEmployee.toLowerCase();
    const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
    const khmer = (e.khmer_name || '').toLowerCase();
    const id = (e.id || '').toLowerCase();
    return fullName.includes(q) || khmer.includes(q) || id.includes(q);
  });

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmployeeId(emp.id);
    if (!deviceUserName) {
      setDeviceUserName(`${emp.first_name || ''} ${emp.last_name || ''}`.trim());
    }
    if (!deviceUserId) {
      // Extract numeric ID if available
      const cleanNum = (emp.id || '').replace(/\D/g, '');
      if (cleanNum) setDeviceUserId(cleanNum);
    }
    if (emp.avatar && !emp.avatar.includes('khmer_') && !userPhoto) {
      setUserPhoto(emp.avatar);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) {
      setError('Please select a target device.');
      return;
    }
    if (!deviceUserId.trim()) {
      setError('Device PIN / User ID is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        // Update user
        const res = await fetch('/api/attendance/zkteco/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            record_id: editingUser.id,
            updates: {
              device_user_name: deviceUserName.trim() || null,
              card_number: cardNumber.trim() || null,
              privilege,
              has_face: hasFace ? 1 : 0,
              has_fingerprint: hasFingerprint ? 1 : 0,
              has_card: hasCard || cardNumber.trim() ? 1 : 0,
              employee_id: selectedEmployeeId || null,
              sync_status: selectedEmployeeId ? 'Mapped' : 'Needs Mapping',
              biometric_status: (hasFace || hasFingerprint) ? 'Enrolled' : 'Not Enrolled',
              user_photo: userPhoto.trim() || null,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to update user');
        }
      } else {
        // Enroll new user
        const res = await fetch('/api/attendance/zkteco/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'enroll',
            device_id: deviceId,
            device_user_id: deviceUserId.trim(),
            device_user_name: deviceUserName.trim() || undefined,
            card_number: cardNumber.trim() || undefined,
            privilege,
            has_face: hasFace ? 1 : 0,
            has_fingerprint: hasFingerprint ? 1 : 0,
            has_card: hasCard || cardNumber.trim() ? 1 : 0,
            employee_id: selectedEmployeeId || undefined,
            user_photo: userPhoto.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to enroll user');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {editingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingUser ? 'Edit Biometric Device User' : 'Enroll New User to Terminal'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {editingUser
                  ? `Update credentials & permissions for PIN #${editingUser.device_user_id}`
                  : 'Register user credentials and dispatch to ZKTeco SpeedFace hardware'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Target Device */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Biometric Device <span className="text-rose-500">*</span>
              </label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                disabled={Boolean(editingUser)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.location}) — {d.ip_address}
                  </option>
                ))}
              </select>
            </div>

            {/* Device PIN / User ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Device PIN / User ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={deviceUserId}
                onChange={(e) => setDeviceUserId(e.target.value)}
                disabled={Boolean(editingUser)}
                placeholder="e.g. 160 or 003"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Device User Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Name on Device Display
              </label>
              <input
                type="text"
                value={deviceUserName}
                onChange={(e) => setDeviceUserName(e.target.value)}
                placeholder="e.g. Sarath Te"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Terminal Privilege */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Device Privilege
              </label>
              <select
                value={privilege}
                onChange={(e) => setPrivilege(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="User">User (Normal Punch In/Out)</option>
                <option value="Admin">Administrator (Device Menu Access)</option>
                <option value="Enroller">Enroller (Biometric Registrar)</option>
                <option value="SuperAdmin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* RFID Card */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              RFID Card Number (Optional)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(e.target.value);
                  if (e.target.value) setHasCard(true);
                }}
                placeholder="e.g. 0004128935"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Biometric Modalities Checkboxes */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Enrolled Biometric Modalities
            </span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:border-indigo-400">
                <input
                  type="checkbox"
                  checked={hasFace}
                  onChange={(e) => setHasFace(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Smile size={14} className="text-indigo-600 shrink-0" />
                <span>Face 3D</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:border-indigo-400">
                <input
                  type="checkbox"
                  checked={hasFingerprint}
                  onChange={(e) => setHasFingerprint(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <Fingerprint size={14} className="text-teal-600 shrink-0" />
                <span>Fingerprint</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:border-indigo-400">
                <input
                  type="checkbox"
                  checked={hasCard}
                  onChange={(e) => setHasCard(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <CreditCard size={14} className="text-blue-600 shrink-0" />
                <span>RFID Badge</span>
              </label>
            </div>
          </div>

          {/* Real Biometric Face Photo from ZKTeco Device */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1.5">
                <Camera size={13} className="text-indigo-500" />
                Terminal Biometric Photo
              </span>
              {userPhoto && (
                <button
                  type="button"
                  onClick={() => setUserPhoto('')}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Photo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="Device Biometric Photo"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-1">
                    <Camera size={16} className="text-slate-400 mb-0.5" />
                    <span>No photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {userPhoto ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Real photo captured from ZKTeco terminal
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Captured directly from the ZKTeco SpeedFace terminal camera when face biometric is enrolled.
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">
                  Device camera face pictures are stored in hardware terminal memory and synchronized to Hestra HRM via ADMS push.
                </p>
                {userPhoto && (
                  <span className="font-mono text-[10px] text-slate-400 truncate block">
                    {userPhoto}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Link to Employee */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Link to Hestra Employee (Optional)
              </label>
              {selectedEmployeeId && (
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId('')}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search employee by name, ID, or Khmer..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 bg-slate-50/50 dark:bg-slate-800/30">
              {loadingEmployees ? (
                <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
                  <RotateCw size={14} className="animate-spin text-indigo-500" />
                  Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  No matching employees found.
                </div>
              ) : (
                filteredEmployees.slice(0, 15).map((emp) => {
                  const isSelected = selectedEmployeeId === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {emp.avatar && !emp.avatar.includes('khmer_') ? (
                          <img
                            src={emp.avatar}
                            alt={emp.first_name}
                            className="w-6 h-6 rounded-md object-cover"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {(emp.first_name || 'E').slice(0, 1)}
                          </div>
                        )}
                        <div className="truncate">
                          <span>{emp.first_name} {emp.last_name}</span>
                          {emp.khmer_name && (
                            <span className={`ml-1 text-[11px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                              ({emp.khmer_name})
                            </span>
                          )}
                          <span className={`ml-1.5 font-mono text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            [{emp.id}]
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={14} className="shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-press px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Saving & Queuing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>{editingUser ? 'Save Changes' : 'Enroll on Terminal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
