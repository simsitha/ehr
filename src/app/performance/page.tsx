'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PerformanceReview, Employee, isBoardMember } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';
import {
  Award,
  Star,
  TrendingUp,
  Target,
  Search,
  Plus,
  CheckCircle2,
  Calendar,
  User,
  Quote,
  Sparkles,
} from 'lucide-react';

export default function PerformancePage() {
  const { currentPersona, showToast, triggerRefresh, refreshKey, language } = useApp();

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const reviewableEmployees = useMemo(
    () => employees.filter((e) => !isBoardMember(e)),
    [employees]
  );

  const [form, setForm] = useState({
    employee_id: '',
    reviewer_id: currentPersona.id,
    review_period: 'Q3 2026',
    rating: 4.8,
    goals_achievement: 95,
    strengths: '',
    areas_for_growth: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/performance').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()),
    ])
      .then(([revData, empData]) => {
        if (Array.isArray(revData)) setReviews(revData);
        if (Array.isArray(empData)) {
          setEmployees(empData);
          const eligible = empData.filter((e) => !isBoardMember(e));
          if (eligible.length > 0 && !form.employee_id) {
            setForm((f) => ({ ...f, employee_id: eligible[0].id }));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reviewer_id: currentPersona.id,
        }),
      });
      if (res.ok) {
        showToast('Performance appraisal submitted successfully!', 'success');
        setModalOpen(false);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit review', 'error');
      }
    } catch {
      showToast('Network error submitting review', 'error');
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  const avgGoals = reviews.length > 0
    ? Math.round(reviews.reduce((acc, r) => acc + r.goals_achievement, 0) / reviews.length)
    : 95;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="text-indigo-600" size={26} />
            Performance & Review Management
          </h1>
          <p className="text-xs text-slate-500">
            Track OKRs, 360 review cycles, employee scorecards, and development plans
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95"
        >
          <Plus size={16} /> Conduct Review
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Average Company Rating
          </span>
          <div className="text-3xl font-black text-slate-900 my-1 flex items-baseline gap-2">
            <span>{avgRating}</span>
            <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={13} /> Exceeding industry benchmark (4.2)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            OKR Goal Completion
          </span>
          <div className="text-3xl font-black text-indigo-600 my-1">
            {avgGoals}%
          </div>
          <span className="text-[11px] text-slate-500">Cross-pod objectives achieved</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Appraisals Completed
          </span>
          <div className="text-3xl font-black text-emerald-600 my-1">
            {reviews.length}
          </div>
          <span className="text-[11px] text-slate-500">Documented in current cycle</span>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Documented Performance Reviews</h2>
          <span className="text-xs text-slate-400">{reviews.length} reviews published</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading performance reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No reviews recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {r.employee_avatar ? (
                        <img
                          src={r.employee_avatar}
                          alt={r.employee_name || 'Staff'}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-base flex items-center justify-center ring-2 ring-slate-100 shadow-2xs shrink-0">
                          {r.employee_name ? r.employee_name.trim().charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{formatLocalizedText(r.employee_name, language)}</h3>
                        <p className="text-xs text-slate-500">{formatLocalizedText(r.employee_role, language)}</p>
                        <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">
                          Cycle: {r.review_period}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-black text-xs">
                        <Star size={13} className="fill-amber-400 text-amber-500" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        OKR: {r.goals_achievement}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs text-slate-700 pt-3 border-t border-slate-100">
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/70">
                      <span className="font-bold text-emerald-900 text-[11px] block mb-0.5">
                        Key Strengths & Impact:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{r.strengths}</p>
                    </div>

                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/70">
                      <span className="font-bold text-blue-900 text-[11px] block mb-0.5">
                        Areas for Coaching & Growth:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{r.areas_for_growth}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Reviewed by: <strong className="text-slate-700">{formatLocalizedText(r.reviewer_name, language)}</strong></span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conduct Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Conduct Performance Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colleague Being Reviewed *</label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {reviewableEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {formatLocalizedText(`${e.first_name} ${e.last_name}`, language)} ({formatLocalizedText(e.role, language)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Review Period</label>
                  <input
                    type="text"
                    required
                    value={form.review_period}
                    onChange={(e) => setForm({ ...form, review_period: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="Q3 2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OKR Goal Completion (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.goals_achievement}
                  onChange={(e) => setForm({ ...form, goals_achievement: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Demonstrated Strengths</label>
                <textarea
                  rows={3}
                  required
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Key accomplishments, high autonomy, engineering excellence..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Areas for Development & Next Milestones</label>
                <textarea
                  rows={2}
                  required
                  value={form.areas_for_growth}
                  onChange={(e) => setForm({ ...form, areas_for_growth: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Cross-team communication, scaling test suites..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Publish Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
