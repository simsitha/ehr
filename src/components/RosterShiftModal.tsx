'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DutyRosterEntry, ShiftType } from '@/lib/types';
import { getShiftConfig, getShiftList, SHIFTS } from '@/lib/roster-shifts';
import { formatLocalizedText } from '@/lib/translations';
import { X, Clock, Calendar, MapPin, FileText, Trash2, CheckCircle2, Shield } from 'lucide-react';

interface RosterShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DutyRosterEntry | null;
  employeeInfo: { id: string; name: string; role: string; department: string; avatar: string } | null;
  dateStr: string;
  dayName: string;
  onSave: (savedEntry: Partial<DutyRosterEntry>) => Promise<void>;
  onDelete: (employeeId: string, dateStr: string) => Promise<void>;
}

export default function RosterShiftModal({
  isOpen,
  onClose,
  entry,
  employeeInfo,
  dateStr,
  dayName,
  onSave,
  onDelete,
}: RosterShiftModalProps) {
  const { language, shiftSettings } = useApp();
  const [selectedShift, setSelectedShift] = useState<ShiftType>('office');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:30');
  const [hours, setHours] = useState('8.0');
  const [location, setLocation] = useState('Head Office');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setSelectedShift(entry.shift_type || 'office');
      setStartTime(entry.start_time || '');
      setEndTime(entry.end_time || '');
      setHours(entry.hours !== undefined ? String(entry.hours) : '8.0');
      setLocation(entry.location || 'Head Office');
      setNotes(entry.notes || '');
    } else {
      // Default to office
      const def = getShiftConfig('office', shiftSettings?.shifts);
      setSelectedShift('office');
      setStartTime(def.start_time);
      setEndTime(def.end_time);
      setHours(String(def.default_hours));
      setLocation('Head Office');
      setNotes('');
    }
  }, [entry, isOpen, shiftSettings]);

  if (!isOpen || !employeeInfo) return null;

  const handleSelectShiftType = (type: string) => {
    setSelectedShift(type as ShiftType);
    const def = getShiftConfig(type, shiftSettings?.shifts);
    setStartTime(def.start_time);
    setEndTime(def.end_time);
    setHours(String(def.default_hours));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        employee_id: employeeInfo.id,
        date: dateStr,
        shift_type: selectedShift,
        start_time: startTime,
        end_time: endTime,
        hours: Number(hours) || 0,
        location,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (confirm(language === 'km' ? 'តើអ្នកពិតជាចង់លុបវេនការងារនេះមែនទេ?' : 'Are you sure you want to remove this shift?')) {
      setSaving(true);
      try {
        await onDelete(employeeInfo.id, dateStr);
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            {employeeInfo.avatar ? (
              <img
                src={employeeInfo.avatar}
                alt={employeeInfo.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center border-2 border-indigo-500/20 shrink-0">
                {employeeInfo.name ? employeeInfo.name.trim().charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {formatLocalizedText(employeeInfo.name, language)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatLocalizedText(employeeInfo.role, language)} • {dayName}, {dateStr}
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

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Shift Type Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'km' ? 'ជ្រើសរើសប្រភេទវេនការងារ' : 'Select Shift Template'}
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {getShiftList(shiftSettings?.shifts).map((shift) => {
                const isSelected = selectedShift === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => handleSelectShiftType(shift.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${shift.badgeBg} ${shift.badgeBorder} ring-2 ring-indigo-500/30 font-medium`
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: shift.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${shift.badgeText}`}>
                          {shift.short_code}
                        </span>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {language === 'km' ? shift.name_km : shift.name_en}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {shift.start_time ? `${shift.start_time} - ${shift.end_time}` : (language === 'km' ? 'សម្រាកពេញមួយថ្ងៃ' : 'Full Day Off')}
                        {shift.sub_shifts && shift.sub_shifts.length > 0 && (
                          <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {language === 'km' ? 'ព្រឹក 4h + រសៀល 4h' : 'Morning 4h + Afternoon 4h'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Hours Controls (Shown if not OFF) */}
          {selectedShift !== 'off' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ម៉ោងចាប់ផ្តើម' : 'Start Time'}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ម៉ោងបញ្ចប់' : 'End Time'}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'km' ? 'ចំនួនម៉ោង (h)' : 'Work Hours (h)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Day Office Session Breakdown Banner */}
              {selectedShift === 'office' && (
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{language === 'km' ? 'វេនពេញ 8h រួមមាន៖' : '8h Shift Includes:'}</span>
                    <span>{language === 'km' ? 'ព្រឹក 07:30-11:30 (4h) | រសៀល 12:30-16:30 (4h)' : 'Morning 07:30-11:30 (4h) | Afternoon 12:30-16:30 (4h)'}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">Lunch: 11:30-12:30</span>
                </div>
              )}
            </div>
          )}

          {/* Location & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'km' ? 'ទីតាំងបំពេញការងារ' : 'Work Location'}
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Head Office / Branch / Remote..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'km' ? 'កំណត់ចំណាំបន្ថែម' : 'Shift Notes / Coverage Task'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'km' ? 'ឧ. ប្រចាំការបន្ទាន់, តាមដាន Server...' : 'e.g. Primary On-Call, Incident Support...'}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Cambodian Labor Law Tip */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300">
            <Shield size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              {language === 'km'
                ? 'មាត្រា ១៤៧ ច្បាប់ការងារ៖ បុគ្គលិកត្រូវទទួលបានថ្ងៃសម្រាកយ៉ាងតិច ២៤ ម៉ោងជាប់ៗគ្នាក្នុងមួយសប្ដាហ៍។'
                : 'Labor Law Art. 147: Employees must be provided at least 24 consecutive hours of rest per week.'}
            </span>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {entry ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{language === 'km' ? 'លុបវេននេះ' : 'Clear Shift'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{saving ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (language === 'km' ? 'រក្សាទុកវេន' : 'Save Shift')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
