'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Announcement } from '@/lib/types';
import { formatLocalizedText } from '@/lib/translations';
import {
  Megaphone,
  Pin,
  Calendar,
  User,
  Plus,
  Tag,
  AlertTriangle,
  Sparkles,
  Heart,
  ShieldCheck,
  Search,
} from 'lucide-react';

const ANNOUNCEMENT_EN: Record<string, { title: string; content: string }> = {
  'ann-1': {
    title: 'Water Festival (Bon Om Touk) Official Company Holiday Notice',
    content: 'Please be informed that the company will observe a 3-day official holiday for the Royal Water Festival. Wishing all staff safe travels and joyful celebrations with family and friends!',
  },
  'ann-2': {
    title: 'Staff Solidarity Gathering & Pchum Ben Celebration',
    content: 'The company will host a solidarity lunch gathering and blessing ceremony at the Head Office to celebrate the traditional Pchum Ben Festival. All team members are warmly welcome to join.',
  },
  'ann-3': {
    title: 'NSSF Social Security Benefits & Health Care Coverage Policy',
    content: 'All staff are reminded to verify their National Social Security Fund (NSSF) member cards for healthcare, work injury, and pension schemes in accordance with Cambodian Labor Law.',
  },
};

export default function AnnouncementsPage() {
  const { openModal, refreshKey, language } = useApp();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshKey]);

  const filtered = announcements.filter((a) => {
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="text-pink-600" size={26} />
            {language === 'km' ? 'ព្រឹត្តិបត្រ & សេចក្តីជូនដំណឹងក្រុមហ៊ុន (Announcements)' : 'Company Announcements & Bulletins'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'km'
              ? 'ព័ត៌មានផ្លូវការក្រុមហ៊ុន, គោលការណ៍ច្បាប់ការងារ, ពិធីបុណ្យប្រពៃណី និងដំណឹងបន្ទាន់'
              : 'Official company notices, labor compliance guidelines, traditional celebrations, and urgent alerts'}
          </p>
        </div>
        <button
          onClick={() => openModal('post-announcement')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> {language === 'km' ? 'ផ្សាយដំណឹងថ្មី (New Announcement)' : 'New Announcement'}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: language === 'km' ? 'ទាំងអស់ (All)' : 'All' },
          { key: 'General', label: language === 'km' ? 'ទូទៅ (General)' : 'General' },
          { key: 'Policy', label: language === 'km' ? 'គោលការណ៍ (Policy)' : 'Policy' },
          { key: 'Celebration', label: language === 'km' ? 'អបអរសាទរ (Celebration)' : 'Celebration' },
          { key: 'Urgent', label: language === 'km' ? 'បន្ទាន់ (Urgent)' : 'Urgent' },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === cat.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcement List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          {language === 'km' ? 'កំពុងទាញយកសេចក្តីជូនដំណឹង...' : 'Loading announcements...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
          {language === 'km' ? 'ពុំមានសេចក្តីជូនដំណឹងក្នុងផ្នែកនេះឡើយ។' : 'No announcements found in this category.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => {
            const enFallback = ANNOUNCEMENT_EN[ann.id];
            const displayTitle = language === 'en' && enFallback ? enFallback.title : formatLocalizedText(ann.title, language);
            const displayContent = language === 'en' && enFallback ? enFallback.content : formatLocalizedText(ann.content, language);

            return (
              <div
                key={ann.id}
                className={`p-6 rounded-2xl border transition-all ${
                  ann.pinned
                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                    : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        ann.category === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.category === 'Celebration'
                          ? 'bg-pink-100 text-pink-800'
                          : ann.category === 'Policy'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {formatLocalizedText(ann.category, language)}
                    </span>

                    {ann.pinned === 1 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <Pin size={10} className="fill-indigo-600" /> {language === 'km' ? 'ខ្ទាស់' : 'Pinned'}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-base font-extrabold text-slate-900 mt-3">{displayTitle}</h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-2 whitespace-pre-line">
                  {displayContent}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-400" />
                    <span>
                      {language === 'km' ? 'ផ្សាយដោយ៖ ' : 'Posted by: '}
                      <strong className="text-slate-700">{formatLocalizedText(ann.author_name, language)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      {language === 'km' ? 'ជូនដំណឹងដល់គ្រប់ដេប៉ាតឺម៉ង់' : 'Public to all departments'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
