'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { OvertimeRateType } from '@/lib/types';
import { OVERTIME_RATES, calculateOvertimePay, STANDARD_MONTHLY_HOURS } from '@/lib/overtime-calc';
import { X, Calculator, Shield, DollarSign, HelpCircle, ArrowRight, Check } from 'lucide-react';

interface OvertimeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OvertimeCalculatorModal({
  isOpen,
  onClose,
}: OvertimeCalculatorModalProps) {
  const { language, overtimeSettings } = useApp();
  const [salary, setSalary] = useState('800');
  const [hours, setHours] = useState('2.5');
  const [rateType, setRateType] = useState<OvertimeRateType>('normal_day_150');

  if (!isOpen) return null;

  const activeRates = overtimeSettings?.rates || OVERTIME_RATES;
  const activeRateList = Object.values(activeRates);
  const activeDivisor = overtimeSettings?.standardMonthlyHours || STANDARD_MONTHLY_HOURS;

  const numSalary = Math.max(0, Number(salary) || 0);
  const numHours = Math.max(0, Number(hours) || 0);
  const result = calculateOvertimePay(numSalary, numHours, rateType, activeRates, activeDivisor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {language === 'km' ? 'កម្មវិធីគណនាប្រាក់ថែមម៉ោង (OT Calculator)' : 'Overtime Pay Calculator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km' ? 'គិតតាមរូបមន្តច្បាប់ស្តីពីការងារកម្ពុជា (មាត្រា ១៣៩)' : 'Based on Cambodian Labor Law Article 139 formula'}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Inputs Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {language === 'km' ? 'ប្រាក់ខែគោលប្រចាំខែ ($)' : 'Monthly Base Salary ($)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {language === 'km' ? 'ចំនួនម៉ោងថែម (ម៉ោង)' : 'Overtime Hours (h)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Rate Multiplier Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'km' ? 'ជ្រើសរើសប្រភេទម៉ោងថែម (Rate)' : 'Select Overtime Rate Multiplier'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeRateList.map((rate) => {
                const isSelected = rateType === rate.id;
                return (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => setRateType(rate.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${rate.badgeBg} ${rate.badgeBorder} ring-2 ring-indigo-500/30 font-medium`
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${rate.badgeText}`}>
                        {Math.round(rate.multiplier * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rate.multiplier}x
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {language === 'km' ? rate.label_km : rate.label_en}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation Steps Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              {language === 'km' ? 'ជំហានគណនាលម្អិតតាមច្បាប់ការងារ' : 'Step-by-Step Calculation Breakdown'}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {language === 'km' ? '១. ចំនួនម៉ោងស្តង់ដារប្រចាំខែ:' : '1. Standard Monthly Hours Divisor:'}
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {activeDivisor} ម៉ោង (hrs)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {language === 'km' ? `២. ប្រាក់ឈ្នួលគោលក្នុងមួយម៉ោង ($Salary / ${activeDivisor}):` : `2. Base Hourly Rate ($Salary / ${activeDivisor}):`}
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                ${result.hourlyRate.toFixed(4)} / ម៉ោង
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {language === 'km' ? '៣. ប្រាក់ឈ្នួលថែមម៉ោងក្នុងមួយម៉ោង (OT Hourly Rate):' : '3. Overtime Hourly Rate (Base x Rate):'}
              </span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                ${result.otHourlyRate.toFixed(4)} / ម៉ោង
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'km' ? '៤. ប្រាក់ថែមម៉ោងសរុប (Total OT Pay):' : '4. Total Overtime Payout:'}
                </span>
                <p className="text-[10px] text-slate-500">
                  {numHours} hrs × ${result.otHourlyRate.toFixed(4)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  +${result.totalPay.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  ≈ {language === 'km' ? `៛${result.khrPay.toLocaleString()} រៀល` : `${result.khrPay.toLocaleString()} KHR`}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Reference Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
            <Shield size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              {language === 'km'
                ? 'មាត្រា ១៣៩ ច្បាប់ការងារ៖ ម៉ោងធ្វើការថែមនៅថ្ងៃធម្មតាគិត ១៥០%។ ការងារពេលយប់ (២២:០០-០៦:០០) ថ្ងៃសម្រាកសប្ដាហ៍ និងថ្ងៃបុណ្យជាតិគិត ២០០%។'
                : 'Article 139 Labor Law: Daytime overtime on normal working days paid at 150%. Night work (22:00-06:00), weekly rest days, and public holidays paid at 200%.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {language === 'km' ? 'យល់ព្រម / បិទ' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
