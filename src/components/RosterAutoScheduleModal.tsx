'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatLocalizedText } from '@/lib/translations';
import { Sparkles, X, CheckCircle2, Shield, Calendar, Building2, Clock, AlertTriangle } from 'lucide-react';

interface RosterAutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: string;
  departments: { id: string; name: string }[];
  onGenerated: () => void;
}

export default function RosterAutoScheduleModal({
  isOpen,
  onClose,
  weekStart,
  departments,
  onGenerated,
}: RosterAutoScheduleModalProps) {
  const { language, showToast } = useApp();
  const [selectedDept, setSelectedDept] = useState('all');
  const [template, setTemplate] = useState<'standard_5day' | 'operational_6day' | 'rotating_shifts' | 'weekend_duty_only'>('standard_5day');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roster/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: weekStart,
          department_id: selectedDept,
          template,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          language === 'km'
            ? `បានបង្កើតកាលវិភាគស្វ័យប្រវត្តិចំនួន ${data.count} វេនជោគជ័យ!`
            : `Auto-scheduled ${data.count} shifts successfully!`,
          'success'
        );
        onGenerated();
        onClose();
      } else {
        showToast(data.error || 'Failed to auto-schedule', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Auto-scheduling error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    {
      id: 'standard_5day',
      title_km: 'កាលវិភាគធម្មតា ៥ ថ្ងៃ (ច័ន្ទ-សុក្រ)',
      title_en: 'Standard 5-Day Office Week (Mon-Fri)',
      desc_km: 'ច័ន្ទ-សុក្រ ០៧:៣០-១៦:៣០ (៨ ម៉ោង), សៅរ៍ & អាទិត្យ សម្រាក (OFF)។ ម៉ោងសរុប ៤០ ម៉ោង/សប្ដាហ៍។',
      desc_en: 'Mon-Fri 07:30-16:30 (8h), Sat & Sun Rest Day (OFF). Total 40h/week.',
      badge: '100% Art. 147',
      hours: '40 hrs/wk',
    },
    {
      id: 'operational_6day',
      title_km: 'កាលវិភាគប្រតិបត្តិការ ៦ ថ្ងៃ (ច័ន្ទ-សៅរ៍)',
      title_en: '6-Day Operational Schedule (Mon-Sat)',
      desc_km: 'ច័ន្ទ-សៅរ៍ ០៧:៣០-១៦:៣០ (៨ ម៉ោង), អាទិត្យ សម្រាកជាកំហិត (OFF)។ ម៉ោងសរុប ៤៨ ម៉ោង/សប្ដាហ៍។',
      desc_en: 'Mon-Sat 07:30-16:30 (8h), Sunday Mandatory Rest Day (OFF). Total 48h/week.',
      badge: 'Max 48h Legal',
      hours: '48 hrs/wk',
    },
    {
      id: 'rotating_shifts',
      title_km: 'វេនឆ្លាស់ ២៤/៧ (ព្រឹក / រសៀល / យប់ / ប្រចាំការ)',
      title_en: '24/7 Rotating Shift Pattern (M / E / N / Duty)',
      desc_km: 'បែងចែកវេនព្រឹក វេនរសៀល វេនយប់ និងវេនប្រចាំការចុងសប្ដាហ៍ ព្រមទាំងធានាថ្ងៃសម្រាកកំហិត។',
      desc_en: 'Distributes morning, evening, night & weekend duty evenly, guaranteeing required weekly rest days.',
      badge: '24/7 Coverage',
      hours: '40-48 hrs/wk',
    },
    {
      id: 'weekend_duty_only',
      title_km: 'បែងចែកវេនប្រចាំការចុងសប្ដាហ៍ (Weekend Duty)',
      title_en: 'Weekend Duty Allocation with Compensatory OFF',
      desc_km: 'ចាត់តាំងបុគ្គលិកវេនប្រចាំការថ្ងៃសៅរ៍-អាទិត្យ ដោយផ្ដល់ថ្ងៃសម្រាកជំនួសនៅថ្ងៃធ្វើការធម្មតា។',
      desc_en: 'Assigns Saturday/Sunday duty rosters with compensatory weekdays off to preserve 48h limits.',
      badge: 'Fair Duty Allocation',
      hours: '40 hrs/wk',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {language === 'km' ? 'បង្កើតកាលវិភាគវេនការងារស្វ័យប្រវត្តិ' : 'Auto-Schedule Work & Duty Roster'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km' ? 'សប្ដាហ៍គិតចាប់ពី' : 'Week starting'}: {weekStart}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Target Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'km' ? 'ជ្រើសរើសនាយកដ្ឋាន' : 'Target Department'}
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">{language === 'km' ? 'គ្រប់នាយកដ្ឋានទាំងអស់ (All Departments)' : 'All Departments'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {formatLocalizedText(dept.name, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Template Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'km' ? 'ជ្រើសរើសទម្រង់កាលវិភាគ' : 'Select Scheduling Template'}
            </label>
            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const isSelected = template === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setTemplate(tpl.id as any)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {language === 'km' ? tpl.title_km : tpl.title_en}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {tpl.hours}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5.5">
                      {language === 'km' ? tpl.desc_km : tpl.desc_en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cambodian Labor Law Banner */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-start gap-2.5">
              <Shield size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">
                  {language === 'km' ? 'អនុលោមភាពច្បាប់ស្តីពីការងារកម្ពុជា៖' : 'Cambodian Labor Law Guardrails:'}
                </span>
                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 mt-0.5">
                  {language === 'km'
                    ? 'ប្រព័ន្ធនឹងធានាថាបុគ្គលិកគ្រប់រូបទទួលបានថ្ងៃសម្រាកយ៉ាងតិច ១ ថ្ងៃក្នុងមួយសប្ដាហ៍ (មាត្រា ១៤៧) និងម៉ោងធ្វើការមិនលើស ៤៨ ម៉ោងក្នុងមួយសប្ដាហ៍ (មាត្រា ១៣៧)។'
                    : 'System automatically guarantees min 24h consecutive weekly rest (Article 147) and regular hours ≤ 48 hours/week (Article 137).'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{loading ? (language === 'km' ? 'កំពុងបង្កើត...' : 'Generating...') : (language === 'km' ? 'បង្កើតកាលវិភាគឥឡូវនេះ' : 'Generate Roster Now')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
