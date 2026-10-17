'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PayrollReconciliationItem } from '@/lib/types';
import { CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw, X, ShieldCheck, Download } from 'lucide-react';

interface PayrollReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: string;
}

export default function PayrollReconciliationModal({ isOpen, onClose, period = 'August 2026' }: PayrollReconciliationModalProps) {
  const { showToast, language } = useApp();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    period: string;
    total_employees_audited: number;
    match_count: number;
    difference_count: number;
    match_rate: number;
    items: PayrollReconciliationItem[];
  } | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'MATCH' | 'DIFFERENCE'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/reconciliation?period=${encodeURIComponent(period)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch reconciliation');
      setData(json);
    } catch (err: any) {
      console.error('Error fetching reconciliation:', err);
      showToast(err.message || 'Error running audit', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReconciliation();
    }
  }, [isOpen, period]);

  if (!isOpen) return null;

  const filteredItems = (data?.items || []).filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchSearch =
      item.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.field_label_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Excel Baseline Reconciliation & Audit</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {period}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Comparing 8.2 2nd Payroll Test.xlsx imported baseline with authoritative application calculation engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        {/* Audit Stats Banner */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Audited Staff</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{data.total_employees_audited} employees</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-medium text-emerald-700">Perfect Matches</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{data.match_count}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-medium text-amber-700">Reconciled Heals (#REF!)</span>
              <div className="text-xl font-black text-amber-700 mt-0.5">{data.difference_count}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
              <span className="text-[11px] font-medium text-indigo-700">Reconciliation Match Rate</span>
              <div className="text-xl font-black text-indigo-700 mt-0.5">{data.match_rate}%</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All Rows ({data?.items.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('MATCH')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  statusFilter === 'MATCH' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Matches ({data?.items.filter((i) => i.status === 'MATCH').length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('DIFFERENCE')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  statusFilter === 'DIFFERENCE' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Differences ({data?.items.filter((i) => i.status === 'DIFFERENCE').length || 0})
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter employee ID, field..."
              className="px-3 py-1.5 rounded-xl border border-slate-200 w-44"
            />
          </div>

          <button
            onClick={fetchReconciliation}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto flex-1 max-h-[420px] rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-2.5">Emp ID</th>
                <th className="p-2.5">Employee Name</th>
                <th className="p-2.5">Salary Field</th>
                <th className="p-2.5 text-right font-mono text-slate-600">Excel Value</th>
                <th className="p-2.5 text-right font-mono text-indigo-700">System Engine</th>
                <th className="p-2.5 text-right font-mono">Diff</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5">Analysis Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center font-sans text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Auditing reconciliation values...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center font-sans text-slate-400">
                    No reconciliation items matching filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">{item.employee_id}</td>
                    <td className="p-2.5 font-sans font-medium text-slate-800">{item.employee_name}</td>
                    <td className="p-2.5 font-sans">
                      <span className="font-semibold text-slate-800 block">
                        {language === 'km' ? item.field_label_km || item.field_label_en : item.field_label_en}
                      </span>
                      {language === 'km' && item.field_label_en !== item.field_label_km && (
                        <span className="text-[10px] text-slate-400 font-sans">{item.field_label_en}</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right text-slate-600">
                      ${typeof item.excel_value === 'number' ? item.excel_value.toFixed(2) : item.excel_value}
                    </td>
                    <td className="p-2.5 text-right font-bold text-indigo-700">
                      ${typeof item.system_value === 'number' ? item.system_value.toFixed(2) : item.system_value}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-700">
                      ${item.difference.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-center font-sans">
                      {item.status === 'MATCH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={11} /> MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle size={11} /> HEALED
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-sans text-[10px] text-slate-500 max-w-[200px] truncate">
                      {item.reason || 'Exact match with factory procedure formula'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            Audited in accordance with Cambodia Labor Law & GDT Tax Regulations
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
