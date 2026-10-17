'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { OvertimeRateType, OvertimeRateConfig, OvertimeSettings } from '@/lib/types';
import { DEFAULT_OVERTIME_SETTINGS } from '@/lib/overtime-calc';
import {
  X,
  Shield,
  Save,
  RotateCcw,
  Clock,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from 'lucide-react';

interface OvertimeRateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function OvertimeRateEditModal({
  isOpen,
  onClose,
  onSuccess,
}: OvertimeRateEditModalProps) {
  const { language, showToast, overtimeSettings, updateOvertimeSettingsContext, resetOvertimeSettingsContext } = useApp();

  const [settings, setSettings] = useState<OvertimeSettings>(overtimeSettings || DEFAULT_OVERTIME_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Synchronize local form when global overtimeSettings changes
  useEffect(() => {
    if (overtimeSettings) {
      setSettings(overtimeSettings);
    }
  }, [overtimeSettings, isOpen]);

  if (!isOpen) return null;

  const handleMultiplierChange = (rateType: OvertimeRateType, value: string) => {
    const num = parseFloat(value);
    const validNum = isNaN(num) ? 1.0 : Math.max(1.0, Math.min(5.0, num));
    setSettings((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateType]: {
          ...prev.rates[rateType],
          multiplier: validNum,
        },
      },
    }));
  };

  const handleFieldChange = (
    rateType: OvertimeRateType,
    field: 'label_km' | 'label_en' | 'law_reference' | 'description_km' | 'description_en',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateType]: {
          ...prev.rates[rateType],
          [field]: value,
        },
      },
    }));
  };

  const handleDivisorChange = (val: string) => {
    const num = parseInt(val, 10);
    setSettings((prev) => ({
      ...prev,
      standardMonthlyHours: isNaN(num) || num <= 0 ? 208 : num,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateOvertimeSettingsContext(settings);
    setSaving(false);

    if (success) {
      showToast(
        language === 'km'
          ? 'បានរក្សាទុកកម្រងអត្រាប្រាក់ថែមម៉ោងស្របច្បាប់ដោយជោគជ័យ! ✓'
          : 'Statutory overtime rates and parameters saved successfully! ✓',
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } else {
      showToast(
        language === 'km' ? 'បរាជ័យក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត' : 'Failed to save overtime rates. Please try again.',
        'error'
      );
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        language === 'km'
          ? 'តើអ្នកពិតជាចង់កំណត់អត្រាថែមម៉ោងឡើងវិញតាមបទដ្ឋានច្បាប់ការងារដើមមែនទេ?'
          : 'Are you sure you want to reset all overtime rates to Cambodian Labor Law defaults?'
      )
    ) {
      return;
    }

    setResetting(true);
    const success = await resetOvertimeSettingsContext();
    setResetting(false);

    if (success) {
      setSettings(DEFAULT_OVERTIME_SETTINGS);
      showToast(
        language === 'km'
          ? 'បានកំណត់អត្រាថែមម៉ោងឡើងវិញតាមច្បាប់ការងារកម្ពុជាជោគជ័យ ✓'
          : 'Overtime rates reset to Cambodian Labor Law statutory defaults ✓',
        'info'
      );
      if (onSuccess) onSuccess();
    }
  };

  const sampleSalary = 1000;
  const divisor = settings.standardMonthlyHours || 208;
  const baseHourly = Number((sampleSalary / divisor).toFixed(4));

  const rateKeys: OvertimeRateType[] = ['normal_day_150', 'night_200', 'weekend_200', 'holiday_200'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <span>{language === 'km' ? 'កែប្រែកម្រងអត្រាប្រាក់ថែមម៉ោងស្របច្បាប់' : 'Edit Statutory Overtime Rates'}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  Labor Law
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'ច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា (មាត្រា ១៣៩, ១៤៤, ១៤៧, ១៦២)'
                  : 'Labor Law of Cambodia statutory multipliers & monthly hours configuration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Monthly Divisor Setting Card */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'km' ? 'ម៉ោងការងារគោលប្រចាំខែ (Monthly Hours Divisor)' : 'Standard Monthly Hours Divisor'}</span>
              </div>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                {language === 'km'
                  ? 'រូបមន្តគណនាប្រាក់ឈ្នួលក្នុង ១ ម៉ោង ៖ (ប្រាក់ខែគោល / ម៉ោងគោល)។ តាមច្បាប់ការងារ ២៦ ថ្ងៃ × ៨ ម៉ោង = ២០៨ ម៉ោង/ខែ។'
                  : 'Base hourly rate formula: (Monthly Salary / Divisor). Statutory benchmark: 26 days × 8 hours = 208 hours/month.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="100"
                max="300"
                step="1"
                value={settings.standardMonthlyHours}
                onChange={(e) => handleDivisorChange(e.target.value)}
                className="w-24 px-3 py-1.5 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'km' ? 'ម៉ោង/ខែ' : 'hrs/mo'}
              </span>
            </div>
          </div>

          {/* 4 Rate Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator size={15} className="text-indigo-600" />
                <span>{language === 'km' ? 'កម្រិតអត្រាប្រាក់ថែមម៉ោងទាំង ៤ ថ្នាក់' : 'The 4 Statutory Overtime Multiplier Tiers'}</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {language === 'km' ? 'អាចកែប្រែមេគុណ និងការពិពណ៌នា' : 'Editable multipliers & descriptions'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rateKeys.map((key) => {
                const rate = settings.rates[key] || DEFAULT_OVERTIME_SETTINGS.rates[key];
                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs space-y-3"
                  >
                    {/* Tier Header with Multiplier Pill */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {language === 'km' ? rate.label_km : rate.label_en}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {Math.round(rate.multiplier * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({rate.multiplier}x)</span>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-2.5">
                      {/* Multiplier & Legal Reference */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            {language === 'km' ? 'មេគុណ (Multiplier)' : 'Multiplier (x)'}
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="1.0"
                            max="5.0"
                            value={rate.multiplier}
                            onChange={(e) => handleMultiplierChange(key, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            {language === 'km' ? 'មាត្រាច្បាប់ (Law Ref)' : 'Law Article'}
                          </label>
                          <input
                            type="text"
                            value={rate.law_reference}
                            onChange={(e) => handleFieldChange(key, 'law_reference', e.target.value)}
                            placeholder={language === 'km' ? 'មាត្រា ១៣៩' : 'Art. 139'}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      {/* Label Khmer */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Title (Khmer)'}
                        </label>
                        <input
                          type="text"
                          value={rate.label_km}
                          onChange={(e) => handleFieldChange(key, 'label_km', e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${language === 'km' ? 'font-khmer' : ''} text-slate-800 dark:text-slate-200`}
                        />
                      </div>

                      {/* Label English */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស' : 'Title (English)'}
                        </label>
                        <input
                          type="text"
                          value={rate.label_en}
                          onChange={(e) => handleFieldChange(key, 'label_en', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === 'km' ? 'ការពិពណ៌នាច្បាប់' : 'Legal Description'}
                        </label>
                        <textarea
                          rows={2}
                          value={language === 'km' ? rate.description_km : rate.description_en}
                          onChange={(e) =>
                            handleFieldChange(
                              key,
                              language === 'km' ? 'description_km' : 'description_en',
                              e.target.value
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-600 dark:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Dynamic Computation Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>{language === 'km' ? 'ការគណនាសាកល្បងជាក់ស្តែង (Live Calculation Preview)' : 'Live Statutory Rate Simulation'}</span>
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                Base: ${sampleSalary}/mo &divide; {divisor}h = ${baseHourly.toFixed(2)}/hr
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              {rateKeys.map((key) => {
                const rate = settings.rates[key] || DEFAULT_OVERTIME_SETTINGS.rates[key];
                const otHourly = baseHourly * rate.multiplier;
                const forTwoHours = otHourly * 2;
                return (
                  <div key={key} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-500 truncate">
                      {language === 'km' ? rate.short_label : (rate.short_label_en || rate.short_label)}
                    </div>
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      ${otHourly.toFixed(2)}<span className="text-[10px] font-normal text-slate-400">/h</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {language === 'km'
                        ? `2h = $${forTwoHours.toFixed(2)} (៛${Math.round(forTwoHours * 4100).toLocaleString()})`
                        : `2h = $${forTwoHours.toFixed(2)} (KHR ${Math.round(forTwoHours * 4100).toLocaleString()})`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Reset button */}
            <button
              type="button"
              disabled={resetting}
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
              <span>{language === 'km' ? 'កំណត់ឡើងវិញតាមច្បាប់ដើម' : 'Reset to Statutory Defaults'}</span>
            </button>

            {/* Cancel & Save Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (language === 'km' ? 'រក្សាទុកអត្រាថ្មី ✓' : 'Save Rates ✓')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
