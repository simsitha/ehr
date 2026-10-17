'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PayrollRulesConfig } from '@/lib/types';
import { Settings, CheckCircle2, RefreshCw, X, Shield, Plus, Trash2 } from 'lucide-react';

interface PayrollRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function PayrollRulesModal({ isOpen, onClose, onUpdated }: PayrollRulesModalProps) {
  const { showToast, language } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<PayrollRulesConfig | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/rules');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load rules');
      setRules(data);
    } catch (err: any) {
      showToast(err.message || 'Error loading rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setSaving(true);
    try {
      const res = await fetch('/api/payroll/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save rules');

      showToast(
        language === 'km' ? 'បានរក្សាទុកការកំណត់ប្រាក់បៀវត្សរ៍ជោគជ័យ! ✓' : 'Payroll rules updated successfully! ✓',
        'success'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTierChange = (index: number, field: 'years' | 'amount', val: number) => {
    if (!rules) return;
    const newTiers = [...rules.seniority_tiers];
    newTiers[index] = { ...newTiers[index], [field]: val };
    setRules({ ...rules, seniority_tiers: newTiers });
  };

  const handleAddTier = () => {
    if (!rules) return;
    const maxYear = rules.seniority_tiers.length > 0 ? Math.max(...rules.seniority_tiers.map((t) => t.years)) : 0;
    const newTier = { years: maxYear + 1, amount: (rules.seniority_tiers[rules.seniority_tiers.length - 1]?.amount || 10) + 1 };
    setRules({ ...rules, seniority_tiers: [...rules.seniority_tiers, newTier] });
  };

  const handleRemoveTier = (index: number) => {
    if (!rules) return;
    const newTiers = rules.seniority_tiers.filter((_, idx) => idx !== index);
    setRules({ ...rules, seniority_tiers: newTiers });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {language === 'km' ? 'ការកំណត់គោលការណ៍គណនាប្រាក់បៀវត្សរ៍ (Payroll Rules)' : 'Configurable Payroll & Attendance Rules'}
              </h3>
              <p className="text-xs text-slate-500">
                All business formula parameters are configurable and drive the calculation engines
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        {rules && (
          <form onSubmit={handleSave} className="space-y-6 overflow-y-auto flex-1 pr-1 text-xs">
            {/* Section 1: Working Standards & Overtime */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Working Standard & Overtime Multipliers
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Working Days / Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={rules.working_days_per_month}
                    onChange={(e) => setRules({ ...rules, working_days_per_month: parseFloat(e.target.value) || 26 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Factory Standard: 26</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Daily Work Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={rules.daily_working_hours}
                    onChange={(e) => setRules({ ...rules, daily_working_hours: parseFloat(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Standard: 8 hours</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Normal OT Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rules.ot_multiplier_normal}
                    onChange={(e) => setRules({ ...rules, ot_multiplier_normal: parseFloat(e.target.value) || 1.5 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Standard: 1.5x</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Night / Holiday OT</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rules.ot_multiplier_holiday}
                    onChange={(e) => setRules({ ...rules, ot_multiplier_holiday: parseFloat(e.target.value) || 2.0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Standard: 2.0x</span>
                </div>
              </div>
            </div>

            {/* Section 2: Non-Absent Bonus & Allowances */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {language === 'km' ? 'ប្រាក់រង្វាន់មិនអវត្តមាន ថ្លៃស្នាក់នៅ-ធ្វើដំណើរ ថ្លៃបាយ & អត្រាប្តូរប្រាក់' : 'Non-Absent Bonus, Housing-Transport, Meal Allowance & Rates'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'km' ? 'ប្រាក់រង្វាន់មិនអវត្តមាន ($)' : 'Non-Absent Bonus ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rules.non_absent_bonus_amount}
                    onChange={(e) => setRules({ ...rules, non_absent_bonus_amount: parseFloat(e.target.value) || 15 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">{language === 'km' ? 'បើអវត្តមាន = 0' : 'Paid if Absent = 0'}</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'km' ? 'ថ្លៃអាហារ ($/ថ្ងៃ)' : 'Daily Meal Allowance ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={rules.meal_allowance_per_day ?? 2.5}
                    onChange={(e) => setRules({ ...rules, meal_allowance_per_day: parseFloat(e.target.value) || 2.5 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-amber-700"
                  />
                  <span className="text-[10px] text-slate-400">{language === 'km' ? 'កាត់ $2.5/ថ្ងៃ បើអវត្តមាន ឬ 0.5 ថ្ងៃ' : 'Cut $2.5/day if absent or 0.5 day ($0)'}</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'km' ? 'ស្នាក់នៅ/ធ្វើដំណើរ ($/ខែ)' : 'Housing - Transport ($)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={rules.housing_transport_monthly ?? 16}
                    onChange={(e) => setRules({ ...rules, housing_transport_monthly: parseFloat(e.target.value) || 16 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-700"
                  />
                  <span className="text-[10px] text-slate-400">{language === 'km' ? '≤ ៨ ថ្ងៃ = $៨, > ៨ ថ្ងៃ = $១៦' : '≤8d: $8 | >8d: $16'}</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">GDT Exchange Rate (KHR)</label>
                  <input
                    type="number"
                    value={rules.gdt_rate_khr}
                    onChange={(e) => setRules({ ...rules, gdt_rate_khr: parseFloat(e.target.value) || 4044 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">General Tax Rate: 4,044</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">NSSF Rate (KHR)</label>
                  <input
                    type="number"
                    value={rules.nssf_rate_khr}
                    onChange={(e) => setRules({ ...rules, nssf_rate_khr: parseFloat(e.target.value) || 4049 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Pension Rate: 4,049</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tax Relief / Dependent</label>
                  <input
                    type="number"
                    value={rules.tax_relief_per_dependent_khr}
                    onChange={(e) => setRules({ ...rules, tax_relief_per_dependent_khr: parseFloat(e.target.value) || 150000 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">150,000 KHR / child</span>
                </div>
              </div>
            </div>

            {/* Section 3: Seniority Bonus Tier Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Seniority Bonus Scale (Cambodia Manufacturing Standard)
                </h4>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Year Tier
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {rules.seniority_tiers.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="absolute top-1 right-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                      <span>{t.years} Year{t.years > 1 ? 's' : ''}:</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={t.amount}
                        onChange={(e) => handleTierChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Shield size={13} className="text-indigo-600" /> Changes immediately apply to authoritative calculations
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
