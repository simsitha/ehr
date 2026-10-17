'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftDefinition, ShiftSettings } from '@/lib/types';
import {
  DEFAULT_SHIFTS,
  DEFAULT_SHIFT_SETTINGS,
  SHIFT_COLOR_PRESETS,
  getShiftBadgeClasses,
} from '@/lib/roster-shifts';
import {
  X,
  Clock,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Palette,
  Sun,
  Moon,
} from 'lucide-react';

interface ShiftTemplateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShiftTemplateEditModal({
  isOpen,
  onClose,
  onSuccess,
}: ShiftTemplateEditModalProps) {
  const {
    language,
    showToast,
    currentPersona,
    shiftSettings,
    updateShiftSettingsContext,
    resetShiftSettingsContext,
  } = useApp();

  const isManagerOrAdmin = currentPersona.role === 'Manager' || currentPersona.role === 'Admin';

  const [shifts, setShifts] = useState<Record<string, ShiftDefinition>>(() => {
    return shiftSettings?.shifts || DEFAULT_SHIFTS;
  });

  const [selectedId, setSelectedId] = useState<string>('office');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // New shift creation form
  const [newShift, setNewShift] = useState({
    id: '',
    short_code: '',
    name_km: '',
    name_en: '',
    start_time: '08:30',
    end_time: '17:30',
    default_hours: '8.0',
    color: '#2563eb',
  });

  // Sync when global settings update
  useEffect(() => {
    if (shiftSettings?.shifts) {
      setShifts(shiftSettings.shifts);
      if (!shiftSettings.shifts[selectedId]) {
        setSelectedId(Object.keys(shiftSettings.shifts)[0] || 'office');
      }
    }
  }, [shiftSettings, isOpen]);

  if (!isOpen) return null;

  const currentShift = shifts[selectedId] || shifts.office || Object.values(shifts)[0];

  const handleUpdateCurrentShift = (field: keyof ShiftDefinition, value: any) => {
    if (!currentShift) return;

    let updatedBadgeClasses = {};
    if (field === 'color') {
      updatedBadgeClasses = getShiftBadgeClasses(value);
    }

    setShifts((prev) => ({
      ...prev,
      [currentShift.id]: {
        ...prev[currentShift.id],
        [field]: value,
        ...updatedBadgeClasses,
      },
    }));
  };

  const handleSelectColorPreset = (preset: typeof SHIFT_COLOR_PRESETS[0]) => {
    if (!currentShift) return;
    setShifts((prev) => ({
      ...prev,
      [currentShift.id]: {
        ...prev[currentShift.id],
        color: preset.color,
        badgeBg: preset.badgeBg,
        badgeText: preset.badgeText,
        badgeBorder: preset.badgeBorder,
      },
    }));
  };

  const handleCreateNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = newShift.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `shift_${Date.now()}`;
    const shortCode = newShift.short_code.trim().toUpperCase() || 'NEW';
    const nameKm = newShift.name_km.trim() || `វេន ${shortCode}`;
    const nameEn = newShift.name_en.trim() || `${shortCode} Shift`;
    const hours = Math.max(0, Number(newShift.default_hours) || 0);

    const badgeClasses = getShiftBadgeClasses(newShift.color);

    const created: ShiftDefinition = {
      id: rawId,
      short_code: shortCode,
      name_km: nameKm,
      name_en: nameEn,
      start_time: newShift.start_time,
      end_time: newShift.end_time,
      default_hours: hours,
      color: newShift.color,
      badgeBg: badgeClasses.badgeBg,
      badgeText: badgeClasses.badgeText,
      badgeBorder: badgeClasses.badgeBorder,
      is_active: true,
    };

    setShifts((prev) => ({
      ...prev,
      [rawId]: created,
    }));

    setSelectedId(rawId);
    setIsAddingNew(false);
    setNewShift({
      id: '',
      short_code: '',
      name_km: '',
      name_en: '',
      start_time: '08:30',
      end_time: '17:30',
      default_hours: '8.0',
      color: '#2563eb',
    });

    showToast(
      language === 'km' ? `បានបន្ថែមគំរូវេន "${shortCode}" ជោគជ័យ!` : `Shift template "${shortCode}" added!`,
      'success'
    );
  };

  const handleDeleteShift = (idToDelete: string) => {
    if (['office', 'morning', 'night', 'off'].includes(idToDelete)) {
      showToast(
        language === 'km'
          ? 'មិនអាចលុបវេនស្នូលនៃប្រព័ន្ធបានទេ (អ្នកអាចកែប្រែម៉ោង និងឈ្មោះបាន)'
          : 'Core system shifts cannot be deleted. You can modify their times, names, and hours.',
        'error'
      );
      return;
    }

    if (
      confirm(
        language === 'km'
          ? `តើអ្នកប្រាកដជាចង់លុបគំរូវេនការងារនេះមែនទេ?`
          : `Are you sure you want to remove this shift template?`
      )
    ) {
      setShifts((prev) => {
        const copy = { ...prev };
        delete copy[idToDelete];
        return copy;
      });
      setSelectedId('office');
      showToast(language === 'km' ? 'បានលុបគំរូវេនការងារ' : 'Shift template removed', 'info');
    }
  };

  const handleSaveAll = async () => {
    if (!isManagerOrAdmin) {
      showToast(
        language === 'km'
          ? 'មានតែ Admin ឬ Manager ប៉ុណ្ណោះដែលអាចរក្សាទុកការកំណត់វេនបាន'
          : 'Only Managers and Admins can update shift templates',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const success = await updateShiftSettingsContext({ shifts });
      if (success) {
        showToast(
          language === 'km'
            ? 'បានរក្សាទុកគំរូវេនការងារ & កំណត់សម្គាល់ដោយជោគជ័យ! ✓'
            : 'Shift templates & legend saved successfully! ✓',
          'success'
        );
        onSuccess?.();
        onClose();
      } else {
        showToast(
          language === 'km' ? 'មានបញ្ហាក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត' : 'Failed to save shift templates',
          'error'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving shift settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        language === 'km'
          ? 'តើអ្នកប្រាកដជាចង់កំណត់គំរូវេនទាំងអស់ឡើងវិញតាមលំនាំដើមនៃប្រព័ន្ធ?'
          : 'Are you sure you want to reset all shift templates and legend back to system defaults?'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const success = await resetShiftSettingsContext();
      if (success) {
        setShifts(DEFAULT_SHIFTS);
        setSelectedId('office');
        setIsAddingNew(false);
        showToast(
          language === 'km'
            ? 'បានកំណត់គំរូវេនឡើងវិញតាមលំនាំដើមជោគជ័យ ✓'
            : 'Shift templates reset to defaults ✓',
          'success'
        );
        onSuccess?.();
      } else {
        showToast('Failed to reset shift settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Reset error', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  {language === 'km' ? 'កែប្រែគំរូវេនការងារ & កំណត់សម្គាល់ (Shift Templates & Legend)' : 'Edit Shift Templates & Legend'}
                </h3>
                {shiftSettings?.isCustomized && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {language === 'km' ? 'កែប្រែផ្ទាល់ខ្លួន' : 'Customized'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'km'
                  ? 'កំណត់ម៉ោងចូល-ចេញ ចំនួនម៉ោងស្តង់ដារ កូដកាត់ និងពណ៌សម្គាល់សម្រាប់តារាងវេន'
                  : 'Configure shift timings, standard hours, short codes, and color legend for duty roster'}
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

        {/* Modal Main Content: Split into Sidebar and Editor */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Column: Template List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                {language === 'km' ? 'បញ្ជីគំរូវេន' : 'Shift Templates'} ({Object.keys(shifts).length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 cursor-pointer"
              >
                <Plus size={13} />
                <span>{language === 'km' ? 'បន្ថែមវេន' : 'Add Shift'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[380px] md:max-h-[500px] overflow-y-auto pr-1">
              {Object.values(shifts).map((s) => {
                const isSelected = !isAddingNew && selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setIsAddingNew(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded border ${s.badgeBg} ${s.badgeBorder} ${s.badgeText}`}>
                            {s.short_code}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {language === 'km' ? s.name_km : s.name_en}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {s.start_time ? `${s.start_time}-${s.end_time} (${s.default_hours}h)` : '0.0h (OFF)'}
                        </p>
                        {s.sub_shifts && s.sub_shifts.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span>{language === 'km' ? 'រួមបញ្ចូល៖ ព្រឹក 4h + រសៀល 4h' : 'Includes: Morning 4h + Afternoon 4h'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Editor / Add Form */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            {isAddingNew ? (
              /* Add New Shift Form */
              <form onSubmit={handleCreateNewShift} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                      <Plus size={16} className="text-indigo-600" />
                      <span>{language === 'km' ? 'បង្កើតគំរូវេនការងារថ្មី' : 'Create New Shift Template'}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'km' ? 'បញ្ចូលឈ្មោះ កាលវិភាគ និងកូដសម្គាល់' : 'Specify code, names, schedule times, and color'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'កូដកាត់ (Short Code)' : 'Short Code (e.g. MID)'}
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      value={newShift.short_code}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          short_code: e.target.value.toUpperCase(),
                          id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                        })
                      }
                      placeholder="MID"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'អត្តសញ្ញាណ (Unique ID)' : 'Unique ID'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newShift.id}
                      onChange={(e) => setNewShift({ ...newShift, id: e.target.value.toLowerCase() })}
                      placeholder="midday"
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Name (Khmer)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newShift.name_km}
                      onChange={(e) => setNewShift({ ...newShift, name_km: e.target.value })}
                      placeholder={language === 'km' ? 'វេនថ្ងៃត្រង់' : 'e.g. Afternoon Shift'}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស' : 'Name (English)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newShift.name_en}
                      onChange={(e) => setNewShift({ ...newShift, name_en: e.target.value })}
                      placeholder="Midday Shift"
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'ម៉ោងចាប់ផ្តើម' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={newShift.start_time}
                      onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'ម៉ោងបញ្ចប់' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={newShift.end_time}
                      onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'km' ? 'ម៉ោងស្តង់ដារ' : 'Default Hours'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      required
                      value={newShift.default_hours}
                      onChange={(e) => setNewShift({ ...newShift, default_hours: e.target.value })}
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Color Swatch Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'km' ? 'ពណ៌សម្គាល់ (Color Legend)' : 'Color Legend'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SHIFT_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setNewShift({ ...newShift, color: preset.color })}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          newShift.color.toLowerCase() === preset.color.toLowerCase()
                            ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-xs'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{language === 'km' ? 'បង្កើតគំរូវេន' : 'Create Template'}</span>
                  </button>
                </div>
              </form>
            ) : currentShift ? (
              /* Edit Existing Shift */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === 'km' ? 'កែប្រែគំរូវេន' : 'Editing Template'} • ID: {currentShift.id}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                      {language === 'km' ? currentShift.name_km : currentShift.name_en}
                    </h4>
                  </div>
                  {!['office', 'morning', 'night', 'off'].includes(currentShift.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteShift(currentShift.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete shift template"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Live Preview Card */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'km' ? 'ទិដ្ឋភាពជាក់ស្តែង (Live Preview)' : 'Live Preview in Schedule Grid & Legend'}
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                    {/* Legend Style Preview */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${currentShift.badgeBg} ${currentShift.badgeBorder}`}>
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: currentShift.color }} />
                      <div>
                        <div className={`text-xs font-bold ${currentShift.badgeText}`}>
                          {currentShift.short_code} - {language === 'km' ? currentShift.name_km : currentShift.name_en}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {currentShift.start_time ? `${currentShift.start_time}-${currentShift.end_time}` : '0.0h OFF'}
                        </div>
                      </div>
                    </div>

                    {/* Schedule Grid Cell Preview */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">{language === 'km' ? 'ម៉ោងការងារ (Hours)' : 'Working Hours'}</span>
                      <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {currentShift.default_hours} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'កូដកាត់ (Short Code)' : 'Short Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      value={currentShift.short_code}
                      onChange={(e) => handleUpdateCurrentShift('short_code', e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'ម៉ោងស្តង់ដារ (Hours)' : 'Default Hours'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={currentShift.default_hours}
                      onChange={(e) => handleUpdateCurrentShift('default_hours', Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Name (Khmer)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={currentShift.name_km}
                      onChange={(e) => handleUpdateCurrentShift('name_km', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស' : 'Name (English)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={currentShift.name_en}
                      onChange={(e) => handleUpdateCurrentShift('name_en', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'ម៉ោងចូលធ្វើការ' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={currentShift.start_time}
                      onChange={(e) => handleUpdateCurrentShift('start_time', e.target.value)}
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'km' ? 'ម៉ោងចេញពីធ្វើការ' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={currentShift.end_time}
                      onChange={(e) => handleUpdateCurrentShift('end_time', e.target.value)}
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Included Sub-Shifts / Sessions Breakdown */}
                {((currentShift.sub_shifts && currentShift.sub_shifts.length > 0) || currentShift.id === 'office') && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {language === 'km' ? 'វេនការងាររង & សម្រាកអាហារ (Included Shifts & Breaks)' : 'Included Shift Sessions & Meal Break'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {currentShift.default_hours}h total work
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Morning Shift Session */}
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                            <Sun size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {language === 'km' ? 'វេនព្រឹក (Morning Shift)' : 'Morning Shift'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              07:30AM to 11:30AM
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          4h
                        </span>
                      </div>

                      {/* Afternoon / Evening Shift Session */}
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                            <Moon size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {language === 'km' ? 'វេនរសៀល (Afternoon / Evening)' : 'Afternoon / Evening'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              12:30PM to 16:30PM
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          4h
                        </span>
                      </div>
                    </div>

                    {/* Meal Break banner */}
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between font-medium">
                      <span>{language === 'km' ? '🍽️ សម្រាកអាហារថ្ងៃត្រង់ (Lunch Break):' : '🍽️ Lunch & Meal Break:'}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">11:30AM to 12:30PM (1h)</span>
                    </div>
                  </div>
                )}

                {/* Color Legend Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'km' ? 'ក្ដារពណ៌សម្គាល់ (Color Legend Palette)' : 'Color Legend Palette'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {SHIFT_COLOR_PRESETS.map((preset) => {
                      const isColorSelected = currentShift.color.toLowerCase() === preset.color.toLowerCase();
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectColorPreset(preset)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isColorSelected
                              ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-xs'
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        >
                          {isColorSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={resetting || saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            <span>{language === 'km' ? 'កំណត់ឡើងវិញតាមលំនាំដើម' : 'Reset to Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || resetting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
