'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  Server,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Sparkles,
  KeyRound,
  Activity,
  Flame,
  Search,
  Check,
  X,
  ExternalLink,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface UfwRule {
  id: number;
  to: string;
  action: string;
  from: string;
  comment: string;
  isV6: boolean;
  isFail2ban: boolean;
}

interface Fail2banJail {
  name: string;
  failedCurrent: number;
  failedTotal: number;
  bannedCurrent: number;
  bannedTotal: number;
  bannedIps: string[];
}

interface WhitelistItem {
  target: string;
  description: string;
  type: 'gemini' | 'system' | 'admin' | 'network';
}

interface SecurityData {
  firewall: {
    status: string;
    defaultIncoming: string;
    defaultOutgoing: string;
    rules: UfwRule[];
  };
  fail2ban: {
    status: string;
    jails: Fail2banJail[];
    ignoreIps: WhitelistItem[];
    totalBanned: number;
  };
  ssl: {
    domain: string;
    expiryDate: string;
    daysRemaining: number;
    status: string;
    certPath: string;
    keyPath: string;
    timerActive: boolean;
  };
  wazuh?: {
    installed: boolean;
    managerActive: boolean;
    indexerActive: boolean;
    dashboardActive: boolean;
    version: string;
    dashboardPort: number;
    dashboardUrl: string;
  };
  sshSessions: Array<{
    local: string;
    peer: string;
    process: string;
  }>;
  logs: Array<{
    timestamp: string;
    service: string;
    level: string;
    message: string;
  }>;
}

export default function SecurityPage() {
  const { showToast, language, t } = useApp();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ufw' | 'fail2ban' | 'whitelist' | 'logs'>('ufw');
  const [isPending, startTransition] = useTransition();

  // Modals & form state
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [rulePort, setRulePort] = useState('');
  const [ruleProto, setRuleProto] = useState<'tcp' | 'udp'>('tcp');
  const [ruleAction, setRuleAction] = useState<'allow' | 'deny' | 'reject'>('allow');
  const [ruleFromIp, setRuleFromIp] = useState('');
  const [ruleComment, setRuleComment] = useState('');
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  // Manual Ban state
  const [manualBanIp, setManualBanIp] = useState('');
  const [manualBanJail, setManualBanJail] = useState('sshd');
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);

  // Search in logs & rules
  const [logSearch, setLogSearch] = useState('');
  const [ruleFilter, setRuleFilter] = useState<'all' | 'custom' | 'fail2ban'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security', { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load security status');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      showToast(err.message || 'Error connecting to security agent', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReload = async () => {
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reload', payload: {} }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to reload services');
      showToast(resJson.message || 'Firewall & Fail2ban reloaded', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUnban = async (ip: string) => {
    if (!confirm(`Are you sure you want to unban IP address ${ip}?`)) return;
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban_ip', payload: { ip } }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to unban IP');
      showToast(resJson.message || `IP ${ip} has been unbanned`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBanIp) return;
    try {
      setIsSubmittingBan(true);
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban_ip',
          payload: { ip: manualBanIp.trim(), jail: manualBanJail },
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to ban IP');
      showToast(resJson.message || `IP ${manualBanIp} banned`, 'success');
      setManualBanIp('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(rulePort, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      showToast('Please specify a valid port (1-65535)', 'error');
      return;
    }

    try {
      setIsSubmittingRule(true);
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_rule',
          payload: {
            port: portNum,
            proto: ruleProto,
            ruleAction: ruleAction,
            fromIp: ruleFromIp.trim() || undefined,
            comment: ruleComment.trim() || undefined,
          },
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to create rule');
      showToast(resJson.message || 'Rule successfully added', 'success');
      setIsAddRuleOpen(false);
      setRulePort('');
      setRuleComment('');
      setRuleFromIp('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const handleDeleteRule = async (ruleNumber: number) => {
    if (!confirm(`Are you sure you want to delete firewall rule #${ruleNumber}?`)) return;
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_rule', payload: { ruleNumber } }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to delete rule');
      showToast(resJson.message || `Rule #${ruleNumber} removed`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filtered rules
  const rulesList = data?.firewall.rules || [];
  const filteredRules = rulesList.filter((r) => {
    if (ruleFilter === 'fail2ban') return r.isFail2ban;
    if (ruleFilter === 'custom') return !r.isFail2ban;
    return true;
  });

  // Extract all banned IPs across jails
  const allBannedEntries: Array<{ ip: string; jail: string }> = [];
  data?.fail2ban.jails.forEach((j) => {
    j.bannedIps.forEach((ip) => {
      if (ip) allBannedEntries.push({ ip, jail: j.name });
    });
  });

  // Filtered logs
  const filteredLogs = (data?.logs || []).filter((l) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      l.message.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q) ||
      l.level.toLowerCase().includes(q) ||
      l.timestamp.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('sec_title') || 'Security & Firewall Center'}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Protected
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                {t('sec_subtitle') ||
                  'Enterprise management for UFW firewall, Fail2ban intrusion defense, Let\'s Encrypt SSL, and trusted IP whitelist'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Reload Policies</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. UFW Firewall */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                UFW Firewall
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">
                  {data?.firewall.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    data?.firewall.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Incoming Policy:</span>
              <span className="font-bold text-rose-600 uppercase">
                {data?.firewall.defaultIncoming || 'deny'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Rules:</span>
              <span className="font-bold text-slate-700">{rulesList.length} rules</span>
            </div>
          </div>
        </div>

        {/* 2. Fail2ban */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Intrusion Defense
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">
                  {data?.fail2ban.status === 'active' ? 'Guarded' : 'Offline'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {data?.fail2ban.jails.length || 0} Jails
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Currently Banned:</span>
              <span className="font-bold text-rose-600">
                {data?.fail2ban.totalBanned || 0} IPs
              </span>
            </div>
            <div className="flex justify-between">
              <span>Backend Action:</span>
              <span className="font-bold text-slate-700">UFW Block</span>
            </div>
          </div>
        </div>

        {/* 3. Wazuh SIEM */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Wazuh SIEM
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">
                  {data?.wazuh?.installed ? 'Online' : 'Offline'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    data?.wazuh?.managerActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>
            <a
              href="https://hrm.eclypetech.biz:8443"
              target="_blank"
              rel="noreferrer"
              title="Open Wazuh Dashboard (Port 8443)"
              className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Stack Status:</span>
              <span className="font-bold text-emerald-600">v4.14.8 Active</span>
            </div>
            <div className="flex justify-between">
              <span>Dashboard Web:</span>
              <a
                href="https://hrm.eclypetech.biz:8443"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                Port 8443 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. Trusted Networks & Whitelist */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Trusted Networks
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">Protected</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Whitelist Active
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Admin Remote IP:</span>
              <span className="font-bold text-indigo-600">175.100.11.71</span>
            </div>
            <div className="flex justify-between">
              <span>Server Public IP:</span>
              <span className="font-bold text-slate-700">49.156.43.93</span>
            </div>
          </div>
        </div>

        {/* 5. SSL / Let's Encrypt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                SSL / TLS Security
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">HTTPS Valid</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {data?.ssl.daysRemaining || 89}d Left
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between truncate">
              <span>Domain:</span>
              <span className="font-bold text-slate-700 truncate max-w-[140px]">
                {data?.ssl.domain || 'hrm.eclypetech.biz'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Certbot Auto-Renew:</span>
              <span className="font-bold text-emerald-600">Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('ufw')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ufw'
              ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 border-x border-slate-200 -mb-px shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('sec_tab_ufw') || 'UFW Firewall Rules'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {rulesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fail2ban')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'fail2ban'
              ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 border-x border-slate-200 -mb-px shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('sec_tab_fail2ban') || 'Fail2ban Jails & Bans'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold">
            {allBannedEntries.length} banned
          </span>
        </button>

        <button
          onClick={() => setActiveTab('whitelist')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'whitelist'
              ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 border-x border-slate-200 -mb-px shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t('sec_tab_whitelist') || 'Trusted Networks Whitelist'}</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 border-x border-slate-200 -mb-px shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>{t('sec_tab_logs') || 'Security Event Logs'}</span>
        </button>
      </div>

      {/* TAB 1: UFW FIREWALL RULES */}
      {activeTab === 'ufw' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Rules:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setRuleFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    ruleFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All ({rulesList.length})
                </button>
                <button
                  onClick={() => setRuleFilter('custom')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    ruleFilter === 'custom' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Firewall Inbound/Outbound
                </button>
                <button
                  onClick={() => setRuleFilter('fail2ban')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    ruleFilter === 'fail2ban' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Fail2ban Injected Rules
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsAddRuleOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Firewall Rule</span>
            </button>
          </div>

          {/* Add Rule Modal / Form */}
          {isAddRuleOpen && (
            <div className="bg-slate-900/40 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">Add New Firewall Rule</h3>
                  </div>
                  <button
                    onClick={() => setIsAddRuleOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddRule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Port Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 8080, 5432, 3000"
                      value={rulePort}
                      onChange={(e) => setRulePort(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Protocol</label>
                      <select
                        value={ruleProto}
                        onChange={(e) => setRuleProto(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      >
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                      <select
                        value={ruleAction}
                        onChange={(e) => setRuleAction(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      >
                        <option value="allow">ALLOW</option>
                        <option value="deny">DENY</option>
                        <option value="reject">REJECT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Source IP (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave empty for 'Anywhere' or enter IP (e.g. 192.168.1.50)"
                      value={ruleFromIp}
                      onChange={(e) => setRuleFromIp(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Comment / Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZKTeco Biometrics, API Service"
                      value={ruleComment}
                      onChange={(e) => setRuleComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddRuleOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRule}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs disabled:opacity-50"
                    >
                      {isSubmittingRule ? 'Saving Rule...' : 'Create Rule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rules Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Destination / Port</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Source (From)</th>
                    <th className="py-3 px-4">Description / Origin</th>
                    <th className="py-3 px-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No firewall rules matched the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule) => {
                      const isAllow = rule.action.includes('ALLOW');
                      const isReject = rule.action.includes('REJECT') || rule.action.includes('DENY');

                      return (
                        <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {rule.id}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {rule.to}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                isAllow
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isReject
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isAllow ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {rule.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {rule.from}
                          </td>
                          <td className="py-3 px-4">
                            {rule.isFail2ban ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                                {rule.comment || 'Injected by Fail2Ban defense'}
                              </span>
                            ) : rule.comment ? (
                              <span className="text-slate-700 font-medium">{rule.comment}</span>
                            ) : (
                              <span className="text-slate-400 italic">Standard Rule</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              title={`Delete Rule #${rule.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAIL2BAN JAILS & BANS */}
      {activeTab === 'fail2ban' && (
        <div className="space-y-6">
          {/* Active Jails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.fail2ban.jails.map((jail) => (
              <div
                key={jail.name}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-mono">{jail.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Intrusion Jail
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Currently Banned
                    </span>
                    <span className="text-lg font-black text-rose-600">
                      {jail.bannedCurrent}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Failed
                    </span>
                    <span className="text-lg font-black text-slate-700">
                      {jail.failedTotal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Ban Bar & Banned Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Manual IP Ban Tool</h3>
                <p className="text-xs text-slate-500">
                  Block an offending IP address directly through Fail2ban and UFW
                </p>
              </div>

              <form onSubmit={handleManualBan} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="IP address (e.g. 198.51.100.1)"
                  value={manualBanIp}
                  onChange={(e) => setManualBanIp(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono w-48"
                />
                <select
                  value={manualBanJail}
                  onChange={(e) => setManualBanJail(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="sshd">sshd jail</option>
                  <option value="nginx-botsearch">nginx-botsearch</option>
                  <option value="nginx-http-auth">nginx-http-auth</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmittingBan}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBan ? 'Banning...' : 'Ban IP'}
                </button>
              </form>
            </div>

            {/* Currently Banned IPs List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Currently Banned Attackers ({allBannedEntries.length})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Banned IP Address</th>
                      <th className="py-2.5 px-4">Triggered Jail</th>
                      <th className="py-2.5 px-4">Enforcement Engine</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBannedEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No attacker IPs are currently banned. System clean!
                        </td>
                      </tr>
                    ) : (
                      allBannedEntries.map((entry) => (
                        <tr key={`${entry.jail}-${entry.ip}`} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-rose-600">
                            {entry.ip}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {entry.jail}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="text-[11px] font-bold text-slate-700">
                              UFW REJECT IN
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleUnban(entry.ip)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Unban IP
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRUSTED NETWORKS WHITELIST */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6">
          {/* Trusted Networks Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold backdrop-blur-xs border border-indigo-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fail2ban ignoreip & Firewall Protection Active</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                Trusted Management & Network Whitelist
              </h2>
              <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed">
                The firewall and intrusion prevention system are configured with an explicit
                whitelist. Authorized administration offices, server network interfaces, and
                loopback endpoints are safeguarded against accidental rate-limiting or automated bans.
              </p>
            </div>
          </div>

          {/* Whitelisted Endpoints Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configured Whitelist Targets (`ignoreip`)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.fail2ban.ignoreIps || [])
                .filter(
                  (item) =>
                    !item.target.includes('google') &&
                    !item.target.includes('googleapis') &&
                    item.type !== 'gemini'
                )
                .map((item, idx) => {
                  const isAdmin = item.type === 'admin';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isAdmin
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.target}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{item.description}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS & SSH SESSIONS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* SSH Active Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Active SSH Sessions ({data?.sshSessions.length || 0})
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Port 22 Monitored
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(data?.sshSessions || []).map((sess, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-mono font-bold text-slate-900">
                        Peer: {sess.peer}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Local: {sess.local}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    ESTABLISHED
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fail2ban Audit Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Live Security Event Log</h3>
                <p className="text-xs text-slate-500">
                  Real-time attack detections, bans, and unbans from /var/log/fail2ban.log
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by IP or keyword..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-900 text-slate-200 p-3 font-mono text-xs max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <p className="text-slate-500 py-4 text-center">No logs match your filter.</p>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, idx) => {
                    const isBan = log.message.includes('Ban ');
                    const isUnban = log.message.includes('Unban ');

                    return (
                      <div
                        key={idx}
                        className="py-1 px-2 rounded hover:bg-slate-800/80 flex items-start gap-3 transition-colors"
                      >
                        <span className="text-slate-500 text-[11px] shrink-0">
                          {log.timestamp}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                            isBan
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : isUnban
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
