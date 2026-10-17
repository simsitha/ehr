'use client';

import React, { useState, useEffect } from 'react';
import { Server, X, Check, AlertCircle, Cloud, ArrowDownRight, Radio } from 'lucide-react';
import { ZKTecoDevice, ZKTecoConnectionType } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Partial<ZKTecoDevice>) => Promise<void>;
  device: ZKTecoDevice | null;
}

export default function ZKTecoDeviceModal({ isOpen, onClose, onSave, device }: Props) {
  const [formData, setFormData] = useState<Partial<ZKTecoDevice>>({
    name: 'ZKTeco-01',
    model: 'SpeedFace-V5L',
    platform: 'ZAM230',
    connection_type: 'Push/ADMS',
    ip_address: '192.168.88.201',
    port: 8081,
    location: 'Main Entrance',
    site_name: 'Head Office',
    department_id: '',
    auth_password: '0',
    is_enabled: 1,
    auto_sync: 1,
    sync_interval_minutes: 5,
    connection_timeout: 10,
    retry_attempts: 3,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (device) {
      setFormData({
        ...device,
        connection_type: device.connection_type || 'Push/ADMS',
        port: device.port || (device.connection_type === 'Push/ADMS' ? 8081 : 4370),
      });
    } else {
      setFormData({
        name: 'ZKTeco-03',
        model: 'SpeedFace-V5L',
        platform: 'ZAM230',
        connection_type: 'Push/ADMS',
        ip_address: '192.168.88.203',
        port: 8081,
        location: 'Warehouse Gate',
        site_name: 'Factory Site',
        department_id: '',
        auth_password: '0',
        is_enabled: 1,
        auto_sync: 1,
        sync_interval_minutes: 5,
        connection_timeout: 10,
        retry_attempts: 3,
      });
    }
    setError('');
  }, [device, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ip_address || !formData.location) {
      setError('Please fill in all required fields (Name, IP Address, Location)');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save device configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {device ? `Edit Device — ${device.name}` : 'Register New ZKTeco Biometric Terminal'}
            </h3>
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

        {/* Form (Section 7 Specifications) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connection Mode Selection */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Cloud size={15} className="text-indigo-600 dark:text-indigo-400" />
                Connection Protocol & Mode *
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Target HRM: 192.168.88.168:8081
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  formData.connection_type === 'Push/ADMS'
                    ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <input
                  type="radio"
                  name="connection_type"
                  value="Push/ADMS"
                  checked={formData.connection_type === 'Push/ADMS'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      connection_type: 'Push/ADMS',
                      port: formData.port === 4370 ? 8081 : formData.port || 8081,
                    })
                  }
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-black text-slate-900 dark:text-white block">
                    Push / ADMS (Cloud Push)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Terminal pushes to HRM (Port 8081)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  formData.connection_type === 'TCP/IP'
                    ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <input
                  type="radio"
                  name="connection_type"
                  value="TCP/IP"
                  checked={formData.connection_type === 'TCP/IP'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      connection_type: 'TCP/IP',
                      port: formData.port === 8081 ? 4370 : formData.port || 4370,
                    })
                  }
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-black text-slate-900 dark:text-white block">
                    Direct TCP/IP (Pull Mode)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    HRM pulls device directly (Port 4370)
                  </span>
                </div>
              </label>
            </div>

            {/* ADMS Terminal Setup Parameters Guide */}
            {formData.connection_type === 'Push/ADMS' && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 text-[11px]">
                <div className="text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                  Settings for Physical Terminal Screen (<strong>Menu &rarr; Comm. &rarr; Cloud Server / ADMS</strong>):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Server Host</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">192.168.88.168</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Server Port</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">8081</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Push Path</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">/iclock/cdata</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Domain Name</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">OFF (Disabled)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Device Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Device Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. ZKTeco-01"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.model || 'SpeedFace-V5L'}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Platform
              </label>
              <input
                type="text"
                value={formData.platform || 'ZAM230'}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Terminal LAN IP Address *
              </label>
              <input
                type="text"
                required
                value={formData.ip_address || ''}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="e.g. 192.168.88.201"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {formData.connection_type === 'Push/ADMS' ? 'ADMS Port (8081) *' : 'Direct TCP Port (4370) *'}
              </label>
              <input
                type="number"
                required
                value={formData.port || (formData.connection_type === 'Push/ADMS' ? 8081 : 4370)}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Main Entrance"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Comm Key */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comm Password / Comm Key
              </label>
              <input
                type="password"
                value={formData.auth_password || '0'}
                onChange={(e) => setFormData({ ...formData, auth_password: e.target.value })}
                placeholder="0 (Default)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Sync Interval */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sync Interval (Minutes)
              </label>
              <select
                value={formData.sync_interval_minutes || 5}
                onChange={(e) => setFormData({ ...formData, sync_interval_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes (Default)</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            {/* Connection Timeout */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Connection Timeout (Seconds)
              </label>
              <input
                type="number"
                value={formData.connection_timeout || 10}
                onChange={(e) => setFormData({ ...formData, connection_timeout: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* Retry Attempts */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Retry Attempts
              </label>
              <input
                type="number"
                value={formData.retry_attempts || 3}
                onChange={(e) => setFormData({ ...formData, retry_attempts: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.is_enabled)}
                onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked ? 1 : 0 })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">Terminal Enabled</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.auto_sync)}
                onChange={(e) => setFormData({ ...formData, auto_sync: e.target.checked ? 1 : 0 })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">Automatic Sync (5 Min)</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-press px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
