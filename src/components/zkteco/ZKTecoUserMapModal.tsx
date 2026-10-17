'use client';

import React, { useState, useEffect } from 'react';
import { Users, X, Link as LinkIcon, Search, Check, AlertCircle } from 'lucide-react';
import { ZKTecoDeviceUser } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: ZKTecoDeviceUser | null;
  onMap: (recordId: string, employeeId: string) => Promise<void>;
}

export default function ZKTecoUserMapModal({ isOpen, onClose, user, onMap }: Props) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/employees')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setEmployees(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      setSelectedEmpId(user?.employee_id || '');
      setError('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
    const khmer = (e.khmer_name || '').toLowerCase();
    const id = (e.id || '').toLowerCase();
    return fullName.includes(q) || khmer.includes(q) || id.includes(q);
  });

  const handleSave = async () => {
    if (!selectedEmpId) {
      setError('Please select an employee to map');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onMap(user.id, selectedEmpId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to map user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LinkIcon size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Map Biometric User to Employee
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected User Summary */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs flex items-center gap-3">
          {user.user_photo && !user.user_photo.includes('khmer_') ? (
            <img
              src={user.user_photo}
              alt={user.device_user_name || user.device_user_id}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center ring-1 ring-indigo-200 dark:ring-indigo-800 shrink-0">
              #{user.device_user_id.slice(-3)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-indigo-900 dark:text-indigo-200 font-bold truncate">
              Device PIN #{user.device_user_id} ({user.device_user_name || 'Enrolled User'})
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">
              Terminal: {user.device_name || user.device_id} • Card: {user.card_number || 'None'}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Employee Options List */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No matching employees found</div>
          ) : (
            filteredEmployees.map((e) => {
              const isSelected = selectedEmpId === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEmpId(e.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {e.avatar && !e.avatar.includes('khmer_') ? (
                      <img
                        src={e.avatar}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center ring-1 ring-indigo-200 dark:ring-indigo-800 shrink-0">
                        {(e.first_name?.[0] || '') + (e.last_name?.[0] || '')}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {e.first_name} {e.last_name}
                        {e.khmer_name && <span className="font-normal text-slate-400 ml-1">({e.khmer_name})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {e.id} • {e.role}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedEmpId}
            className="btn-press px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check size={14} />
            <span>{saving ? 'Linking...' : 'Confirm Mapping'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
