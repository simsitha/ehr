'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import HestraLogo from '@/components/HestraLogo';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  HelpCircle,
  Globe,
  RefreshCw,
  Phone,
  Check,
  Users,
  AlertCircle,
  QrCode,
  CalendarCheck,
  CreditCard,
  FileCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, showToast, language, toggleLanguage } = useApp();

  // Selected portal mode: 'staff' (ESS) or 'management' (MSS/Admin)
  const [portalMode, setPortalMode] = useState<'staff' | 'management'>('staff');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Help & Forgot Password Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast(language === 'km' ? 'សូមបញ្ចូលឈ្មោះសម្គាល់ ឬអ៊ីមែល' : 'Please enter your username or email', 'error');
      return;
    }
    if (!password) {
      showToast(language === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portalType: portalMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || (language === 'km' ? 'បរាជ័យក្នុងការចូលប្រើប្រព័ន្ធ' : 'Sign in failed. Please check credentials.'), 'error');
        setLoading(false);
        return;
      }

      // Successful login
      finalizeLogin(data.user, data.redirectUrl, data.portalWarning);
    } catch (err) {
      console.error('Login error:', err);
      showToast(language === 'km' ? 'កំហុសម៉ាស៊ីនមេក្នុងការចូលប្រើប្រព័ន្ធ' : 'Server error occurred during sign in', 'error');
      setLoading(false);
    }
  };

  // Finalize login helper
  const finalizeLogin = (user: any, redirectUrl: string, warning?: string | null) => {
    loginAs({
      id: user.employee_id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.department_name ? `${user.role} - ${user.department_name}` : undefined,
      avatar: user.avatar,
    });

    if (warning) {
      showToast(warning, 'info');
    } else {
      showToast(
        language === 'km'
          ? `សូមស្វាគមន៍ ${user.name}! ចូលប្រព័ន្ធជោគជ័យ ✓`
          : `Welcome ${user.name}! Logged in successfully ✓`,
        'success'
      );
    }

    // Redirect to respective destination (Dashboard for Management, Staff Portal for Employee)
    const destination = redirectUrl || (user.role === 'Employee' ? '/portal/staff' : '/');

    setTimeout(() => {
      window.location.href = destination;
    }, 250);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/30 to-blue-50/20 flex flex-col justify-between ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
      {/* Top Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <HestraLogo size="md" showText={false} />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                HESTRA HRM
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្សសហគ្រាស' : 'Enterprise Human Resource'}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-indigo-300 bg-white text-xs font-semibold text-gray-700 shadow-2xs transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'km' ? 'ភាសាខ្មែរ 🇰🇭' : 'English 🇬🇧'}</span>
          </button>

          {/* HR Support Help Button */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'km' ? 'ជំនួយបច្ចេកទេស' : 'Support'}</span>
          </button>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
          {/* Left Column: Brand Hero & Khmer Corporate Atmosphere (5 Cols) */}
          <div className="lg:col-span-5 relative text-white p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
            {/* Cambodian Corporate Leadership Atmosphere with Pure CSS Enterprise Mesh Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-950/88 to-slate-900/80 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-radial-at-tr from-indigo-500/25 via-transparent to-black/30" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold backdrop-blur-md mb-6 border border-white/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'km' ? 'ប្រព័ន្ធ HRM ស្តង់ដារកម្ពុជា ឆ្នាំ 2026' : 'Cambodia Standard HRMS 2026'}</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold leading-snug tracking-tight drop-shadow-sm">
                {language === 'km'
                  ? 'គ្រប់គ្រងធនធានមនុស្ស ប្រកបដោយប្រសិទ្ធភាព & ទំនុកចិត្ត'
                  : 'Empowering Workforce Excellence Across Cambodia'}
              </h2>

              <p className="text-indigo-200 text-xs leading-relaxed mt-3 drop-shadow-xs">
                {language === 'km'
                  ? 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន, ច្បាប់ឈប់សម្រាក, ប្រាក់បៀវត្សរ៍, ប.ស.ស (NSSF) និងសិទ្ធិចូលដំណើរការ RBAC ស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។'
                  : 'Unified employee self-service and executive management platform complying with Cambodia Ministry of Labour and Vocational Training (MLVT) standards.'}
              </p>

              {/* Feature Glass Cards */}
              <div className="mt-7 space-y-3 text-xs text-indigo-100">
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
                  <div className="p-1.5 rounded-xl bg-emerald-500/25 text-emerald-300 shrink-0 mt-0.5 border border-emerald-400/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      {language === 'km' ? 'ផតថលបុគ្គលិកស្វ័យសេវា (ESS)' : 'Employee Self-Service (ESS)'}
                    </span>
                    <p className="text-[11px] text-indigo-200/90 mt-0.5">
                      {language === 'km' ? 'កាតឌីជីថល QR, ពិនិត្យប័ណ្ណប្រាក់ខែ និងកត់ត្រាម៉ោង' : 'Digital QR card, time punch, and payslip downloads'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
                  <div className="p-1.5 rounded-xl bg-blue-500/25 text-blue-300 shrink-0 mt-0.5 border border-blue-400/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      {language === 'km' ? 'ផតថលគណៈគ្រប់គ្រង (MSS)' : 'Manager Approval Hub (MSS)'}
                    </span>
                    <p className="text-[11px] text-indigo-200/90 mt-0.5">
                      {language === 'km' ? 'អនុម័តច្បាប់ឈប់កូនក្រុម និងតាមដានវត្តមានជាក់ស្តែង' : 'One-click leave approvals and team attendance radar'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
                  <div className="p-1.5 rounded-xl bg-violet-500/25 text-violet-300 shrink-0 mt-0.5 border border-violet-400/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      {language === 'km' ? 'សុវត្ថិភាពសិទ្ធិប្រើប្រាស់ RBAC & ការពារទិន្នន័យ' : 'Enterprise RBAC & Data Security'}
                    </span>
                    <p className="text-[11px] text-indigo-200/90 mt-0.5">
                      {language === 'km' ? 'ការពារទិន្នន័យសម្ងាត់ប្រាក់ខែ និងព័ត៌មានបុគ្គលិក' : 'Strict data privacy & 256-bit SSL encrypted sessions'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enterprise Trust Badges */}
              <div className="mt-6 pt-5 border-t border-white/15">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white text-[11px] font-bold ring-2 ring-indigo-300/60 shadow-xs">
                      HR
                    </div>
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-[11px] font-bold ring-2 ring-indigo-300/60 shadow-xs">
                      IT
                    </div>
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white text-[11px] font-bold ring-2 ring-indigo-300/60 shadow-xs">
                      QC
                    </div>
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold ring-2 ring-indigo-300/60 shadow-xs">
                      PR
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      ★★★★★
                      <span className="text-white text-[11px] ml-1">4.9/5</span>
                    </div>
                    <p className="text-[11px] text-indigo-200">
                      {language === 'km' ? 'ជឿទុកចិត្តដោយស្ថាប័នឈានមុខនៅកម្ពុជា' : 'Trusted by leading enterprises across Cambodia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Certification Badge */}
            <div className="relative z-10 mt-8 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-indigo-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span>{language === 'km' ? 'ម៉ាស៊ីនមេសុវត្ថិភាពសកម្ម 100%' : 'Secure Cloud Server Active'}</span>
              </div>
              <span className="font-mono text-indigo-300/80 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">v2.6.4</span>
            </div>
          </div>

          {/* Right Column: Portal Mode Switcher & Login Form (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Dual Portal Switcher Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {language === 'km' ? 'ជ្រើសរើសច្រកចូល (Select Portal Gate)' : 'Select Portal Gate'}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {portalMode === 'staff'
                      ? (language === 'km' ? 'សម្រាប់បុគ្គលិកទូទៅ' : 'For Staff Members')
                      : (language === 'km' ? 'សម្រាប់គណៈគ្រប់គ្រង' : 'For Management')}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80 gap-1">
                  {/* Staff Portal Tab */}
                  <button
                    type="button"
                    onClick={() => setPortalMode('staff')}
                    className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      portalMode === 'staff'
                        ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 ${portalMode === 'staff' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <div className="leading-tight">{language === 'km' ? 'ផតថលបុគ្គលិក (Staff)' : 'Staff Portal (ESS)'}</div>
                      <div className="text-[10px] font-normal text-gray-400">
                        {language === 'km' ? 'ស្វ័យសេវាបុគ្គលិក' : 'Employee Self-Service'}
                      </div>
                    </div>
                  </button>

                  {/* Management Portal Tab */}
                  <button
                    type="button"
                    onClick={() => setPortalMode('management')}
                    className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      portalMode === 'management'
                        ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 ${portalMode === 'management' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <div className="leading-tight">{language === 'km' ? 'គណៈគ្រប់គ្រង (Manager)' : 'Management (MSS)'}</div>
                      <div className="text-[10px] font-normal text-gray-400">
                        {language === 'km' ? 'អនុម័ត & រដ្ឋបាល HR' : 'Approval & Admin Hub'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Title */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {portalMode === 'staff'
                    ? (language === 'km' ? 'ចូលទៅកាន់ ផតថលបុគ្គលិកទូទៅ' : 'Sign In to Staff Portal (ESS)')
                    : (language === 'km' ? 'ចូលទៅកាន់ ផតថលគណៈគ្រប់គ្រង' : 'Sign In to Management Portal (MSS)')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {portalMode === 'staff'
                    ? (language === 'km'
                        ? 'ប្រើប្រាស់នាមខ្លួន (First Name) ជាឈ្មោះសម្គាល់ ឬអ៊ីមែលការងារដើម្បីចូលដំណើរការ'
                        : 'Use your employee First Name as your username or work email to access personal workspace')
                    : (language === 'km'
                        ? 'គណនីមានសិទ្ធិជាប្រធានផ្នែក (Manager) ឬអ្នកគ្រប់គ្រងជាន់ខ្ពស់ (Admin)'
                        : 'Authorized credentials for Team Leads, Department Heads, and HR Admins')}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email / Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      {portalMode === 'staff'
                        ? (language === 'km' ? 'ឈ្មោះសម្គាល់ / នាមខ្លួន (Username / First Name) *' : 'Staff Username (First Name) *')
                        : (language === 'km' ? 'អ៊ីមែលការងារ ឬឈ្មោះសម្គាល់ *' : 'Work Email or Username *')}
                    </label>
                    {portalMode === 'staff' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {language === 'km' ? 'នាមខ្លួន = Username' : 'First Name = Username'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        portalMode === 'staff'
                          ? (language === 'km' ? 'ឈ្មោះសម្គាល់ ឬអ៊ីមែលការងារ' : 'Username or work email')
                          : (language === 'km' ? 'អ៊ីមែលការងារ ឬឈ្មោះសម្គាល់' : 'Work email or username')
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl text-xs text-gray-900 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                  {portalMode === 'staff' && (
                    <p className={`text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1.5 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'km'
                          ? 'ប្រើប្រាស់នាមខ្លួន (First Name) របស់បុគ្គលិកជា Username សម្រាប់ចូលប្រព័ន្ធ'
                          : 'Use your employee First Name as your login username'}
                      </span>
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <span>{language === 'km' ? 'ពាក្យសម្ងាត់ (Password) *' : 'Password *'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {language === 'km' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់របស់អ្នក' : 'Enter your password'}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl text-xs text-gray-900 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & 2FA indicator */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span>{language === 'km' ? 'ចងចាំការចូលប្រើលើឧបករណ៍នេះ' : 'Remember me on this device'}</span>
                  </label>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SSL Protected</span>
                  </span>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 ${
                    portalMode === 'staff'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-600/20'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {portalMode === 'staff'
                          ? (language === 'km' ? 'ចូលទៅកាន់ផតថលបុគ្គលិក (Staff Portal)' : 'Access Staff Portal (ESS)')
                          : (language === 'km' ? 'ចូលទៅកាន់ផតថលគណៈគ្រប់គ្រង (Manager Portal)' : 'Access Management Portal (MSS)')}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </div>

            {/* Bottom Footer Note */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400 font-medium">
                {language === 'km'
                  ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026 - Sim Sitha'
                  : 'Copyright 2026 - All rights reserved. Sim Sitha'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* HELP / FORGOT PASSWORD MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 p-6 text-center ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {language === 'km' ? 'ជំនួយការកំណត់ពាក្យសម្ងាត់ឡើងវិញ' : 'HR Password Reset Assistance'}
            </h3>

            <p className="text-xs text-gray-600 mt-2 leading-relaxed text-left bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              {language === 'km' ? (
                <>
                  ដើម្បីធានាសុវត្ថិភាពទិន្នន័យបុគ្គលិក និងប្រាក់បៀវត្សរ៍ ការកំណត់ពាក្យសម្ងាត់ត្រូវឆ្លងកាត់ការផ្ទៀងផ្ទាត់ដោយផ្ទាល់ពី{' '}
                  <span className="font-bold text-indigo-700">នាយកដ្ឋានធនធានមនុស្ស (People & Culture Department)</span>។
                </>
              ) : (
                <>
                  To maintain strict workforce data integrity and payroll security, password resets are governed directly by the{' '}
                  <span className="font-bold text-indigo-700">HR Department (People & Culture)</span>.
                </>
              )}
            </p>

            <div className="mt-4 space-y-2 text-xs text-left">
              <div className="p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-gray-900">
                    {language === 'km' ? 'អ៊ីមែលរដ្ឋបាល HR' : 'HR Administration Email'}
                  </div>
                  <div className="text-gray-500 font-mono">admin@outlook.com</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-gray-900">
                    {language === 'km' ? 'លេខទូរស័ព្ទផ្ទៃក្នុង (Internal Hotline)' : 'Internal Hotline'}
                  </div>
                  <div className="text-gray-500 font-mono">(+855) 23 888 999 • Ext: 101</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {language === 'km' ? 'យល់ព្រម' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
