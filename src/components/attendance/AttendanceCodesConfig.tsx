'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceStatusCode } from '@/lib/types';
import { Settings, Plus, Edit2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function AttendanceCodesConfig() {
  const { showToast, language } = useApp();
  const [codes, setCodes] = useState<AttendanceStatusCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<Partial<AttendanceStatusCode>>({
    code: '',
    name_en: '',
    name_km: '',
    description: '',
    is_paid: 1,
    attendance_value: 1.0,
    payroll_effect: 'full',
    badge_color: '#059669',
    badge_bg: '#ecfdf5',
    is_active: 1,
  });

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/codes');
      const data = await res.json();
      if (Array.isArray(data)) setCodes(data);
    } catch (err: any) {
      console.error('Error fetching attendance codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/attendance/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCode),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save code');

      showToast(
        language === 'km' ? 'បានរក្សាទុកកូដវត្តមានជោគជ័យ! ✓' : 'Attendance code saved successfully! ✓',
        'success'
      );
      setModalOpen(false);
      fetchCodes();
    } catch (err: any) {
      showToast(err.message || 'Error saving code', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            {language === 'km' ? 'ការកំណត់កូដវត្តមាន & ច្បាប់ឈប់សម្រាក' : 'Configurable Attendance & Leave Codes'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'km'
              ? 'កំណត់កូដអក្សរកាត់ ឈ្មោះ បន្ទុកប្រាក់ឈ្នួល (Paid/Unpaid) និងផលប៉ះពាល់លើការគណនាប្រាក់បៀវត្សរ៍'
              : 'Configure code abbreviations, descriptions, paid/unpaid value, and payroll calculation impact'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCode({
              code: '',
              name_en: '',
              name_km: '',
              description: '',
              is_paid: 1,
              attendance_value: 1.0,
              payroll_effect: 'full',
              badge_color: '#059669',
              badge_bg: '#ecfdf5',
              is_active: 1,
            });
            setModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          {language === 'km' ? 'បន្ថែមរូបសញ្ញាថ្មី' : 'Add New Code'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="p-3 font-bold">Code</th>
              <th className="p-3 font-bold">{language === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស' : 'Description / Name'}</th>
              {language === 'km' && <th className="p-3 font-bold font-khmer">ឈ្មោះខ្មែរ</th>}
              <th className="p-3 font-bold text-center">Paid Status</th>
              <th className="p-3 font-bold text-center">Attendance Value</th>
              <th className="p-3 font-bold text-center">Payroll Effect</th>
              <th className="p-3 font-bold text-center">Badge Preview</th>
              <th className="p-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={language === 'km' ? 8 : 7} className="p-8 text-center text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading codes...
                </td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/70">
                  <td className="p-3 font-mono font-bold text-slate-900">{c.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{c.name_en}</td>
                  {language === 'km' && <td className="p-3 font-khmer text-slate-800">{c.name_km}</td>}
                  <td className="p-3 text-center">
                    {c.is_paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={12} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <XCircle size={12} /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700">{c.attendance_value} day</td>
                  <td className="p-3 text-center uppercase font-mono text-[11px] text-slate-600">
                    {c.payroll_effect}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      style={{ color: c.badge_color, backgroundColor: c.badge_bg }}
                      className="px-2.5 py-1 rounded-md text-xs font-bold border border-current shadow-2xs"
                    >
                      {c.code}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditingCode(c);
                        setModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      <Edit2 size={14} className="inline mr-1" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCode.code ? `Edit Code: ${editingCode.code}` : 'Add Attendance Code'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Code Abbreviation</label>
                <input
                  type="text"
                  required
                  value={editingCode.code || ''}
                  onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AL, SL, 1, 0.5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Attendance Value (Day)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  required
                  value={editingCode.attendance_value ?? 1.0}
                  onChange={(e) => setEditingCode({ ...editingCode, attendance_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">English Name</label>
                <input
                  type="text"
                  required
                  value={editingCode.name_en || ''}
                  onChange={(e) => setEditingCode({ ...editingCode, name_en: e.target.value })}
                  placeholder="e.g. Annual Leave"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className={`block text-slate-600 font-bold mb-1 ${language === 'km' ? 'font-khmer' : ''}`}>
                  {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Local Code Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editingCode.name_km || ''}
                  onChange={(e) => setEditingCode({ ...editingCode, name_km: e.target.value })}
                  placeholder={language === 'km' ? 'ឧ. ច្បាប់ប្រចាំឆ្នាំ' : 'e.g. Annual Leave'}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 ${language === 'km' ? 'font-khmer' : ''}`}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Is Paid Leave?</label>
                <select
                  value={editingCode.is_paid ? '1' : '0'}
                  onChange={(e) => setEditingCode({ ...editingCode, is_paid: e.target.value === '1' ? 1 : 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="1">Yes - Paid by Factory</option>
                  <option value="0">No - Unpaid Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payroll Effect</label>
                <select
                  value={editingCode.payroll_effect || 'full'}
                  onChange={(e) => setEditingCode({ ...editingCode, payroll_effect: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="full">Full Day Pay</option>
                  <option value="half">Half Day Pay (Deduct 0.5)</option>
                  <option value="unpaid">Unpaid (Deduct Full Day)</option>
                  <option value="none">No Effect (Rest Day)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={editingCode.description || ''}
                  onChange={(e) => setEditingCode({ ...editingCode, description: e.target.value })}
                  placeholder="Policy explanation..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Code
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
