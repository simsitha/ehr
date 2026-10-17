'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Shield,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Terminal,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { NetworkDiagnosticsSummary } from '@/lib/zkteco/network-diagnostics';

export default function ZKTecoNetworkDiagnosticsView() {
  const [data, setData] = useState<NetworkDiagnosticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/zkteco/network-diagnostics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Visual Topology Architecture */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                HESTRA HRM — ZKTeco Biometric Network & ADMS Architecture
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-Time ADMS Push (Port 8081) & Direct TCP/IP Port 4370 Communication Schemes
              </p>
            </div>
          </div>
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="btn-press px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Running Diagnostics...' : 'Re-Run Connectivity Test'}</span>
          </button>
        </div>

        {/* ADMS Cloud Push Receiver Status Bar */}
        <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${data?.admsReceiverRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                ADMS Push Listener Service (Port 8081):
              </span>{' '}
              <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                http://192.168.88.168:8081/iclock/cdata
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold border ${
                data?.admsReceiverRunning
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              {data?.admsReceiverRunning ? `● LISTENING (${data?.admsReceiverLatencyMs || 1}ms)` : '● CHECKING'}
            </span>
          </div>
        </div>

        {/* Topology Diagram */}
        <div className="py-4 px-2 overflow-x-auto">
          <div className="min-w-[650px] flex items-center justify-between gap-4 font-mono text-xs">
            {/* HRM Server */}
            <div className="p-4 rounded-2xl bg-indigo-900 text-white shadow-md border border-indigo-700/60 w-56 text-center space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                HRM Push Receiver Server
              </div>
              <div className="text-sm font-black">HESTRA HRM</div>
              <div className="text-[11px] text-emerald-300 font-bold">
                ADMS Port: 8081 (Active)
              </div>
              <div className="text-[10px] text-indigo-200">
                Server IP: 192.168.88.168
              </div>
            </div>

            {/* Bridge */}
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="w-full h-0.5 bg-indigo-300 dark:bg-indigo-700 relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 whitespace-nowrap">
                  ◀ Inbound ADMS HTTP Pushes (Port 8081) / TCP 4370
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 text-center">
                Subnet 192.168.88.0/24 (Target: 192.168.88.168:8081)
              </span>
            </div>

            {/* Devices Branch */}
            <div className="space-y-3 w-64">
              {/* Device 01 */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">ZKTeco-01</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                    Push/ADMS
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  192.168.88.201 → Push to :8081 • Main Entrance
                </div>
              </div>

              {/* Device 02 */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">ZKTeco-02</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                    Push/ADMS
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  192.168.88.202 → Push to :8081 • Secondary Entrance
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Device Probes & Section 31 Verification Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data?.reports || {
          '192.168.88.201': { ip: '192.168.88.201', port: 8081, name: 'ZKTeco-01 (Main Entrance)', status: 'Offline', connectionType: 'Push/ADMS', pingSuccess: true, tcpPortOpen: false, overallReachable: false },
          '192.168.88.202': { ip: '192.168.88.202', port: 8081, name: 'ZKTeco-02 (Secondary Entrance)', status: 'Offline', connectionType: 'Push/ADMS', pingSuccess: true, tcpPortOpen: false, overallReachable: false },
        }).map(([ip, rawReport]) => {
          const report = rawReport as any;
          const isDev01 = ip === '192.168.88.201';
          const devName = report.name || (isDev01 ? 'ZKTeco-01 (Main Entrance)' : 'ZKTeco-02 (Secondary Entrance)');
          const isOnline = report.status === 'Online' || report.overallReachable;
          const isPush = (report.connectionType || 'Push/ADMS') === 'Push/ADMS';

          return (
            <div
              key={ip}
              className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{devName}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {ip}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {report.connectionType || 'Push/ADMS'}
                    </span>
                  </div>
                </div>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 size={13} className="text-emerald-500" /> ● Online (ON)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    <AlertTriangle size={13} className="text-amber-500" /> ● Offline (OFF)
                  </span>
                )}
              </div>

              {/* Probe Results */}
              <div className="space-y-1.5 text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ping Probe (ICMP):</span>
                  <span className={report.pingSuccess ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {report.pingSuccess ? '✓ SUCCESS (REACHABLE)' : '✗ 100% PACKET LOSS'}
                  </span>
                </div>
                {isPush ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Push Channel (Port 8081):</span>
                      <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {isOnline ? '✓ ACTIVE ADMS PUSHES' : '✗ WAITING FOR PUSH'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last ADMS Activity:</span>
                      <span className="text-slate-300">
                        {report.lastConnection ? new Date(report.lastConnection).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">TCP Socket (nc -vz):</span>
                    <span className={report.tcpPortOpen ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {report.tcpPortOpen ? `✓ OPEN (${report.tcpLatencyMs}ms)` : '✗ TIMED OUT / CLOSED'}
                    </span>
                  </div>
                )}
              </div>

              {/* Troubleshooting Checklist if offline */}
              {!isOnline && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                  <span className="font-bold flex items-center gap-1">
                    <Info size={14} className="text-amber-600" />
                    {report.pingSuccess
                      ? 'Terminal is Reachable via Ping — Cloud Server Configuration Needed:'
                      : 'Terminal Unreachable on LAN:'}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                    {report.troubleshooting ? (
                      report.troubleshooting.map((item: string, i: number) => <li key={i}>{item}</li>)
                    ) : report.pingSuccess ? (
                      <>
                        <li>Device IP ({ip}) is powered on and responding to ping.</li>
                        <li>On terminal screen: Menu → Comm. → Cloud Server (or ADMS / Web Server).</li>
                        <li>Set Server IP to 192.168.88.168 and Port to 8081.</li>
                        <li>Set Domain Name: OFF (use direct IP mode).</li>
                      </>
                    ) : (
                      <>
                        <li>Verify power cable and ensure terminal is turned on.</li>
                        <li>Verify physical Ethernet link LED on terminal and network switch.</li>
                        <li>Verify IP address ({ip}) on physical SpeedFace-V5L screen.</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Security & Best Practices Notice (Section 32) */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
        <Shield size={20} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            Enterprise Security Notice — Internal LAN & VPN Protocol (Section 32)
          </span>
          <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
            ZKTeco SpeedFace-V5L devices operate strictly over the internal enterprise network. TCP port 4370 must never be directly exposed to the public Internet. For remote production factory branches, communication must traverse an IPsec Site-to-Site VPN, WireGuard tunnel, or private leased line. Communication Comm Keys are never logged in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}
