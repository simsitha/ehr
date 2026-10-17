'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TRANSLATIONS, formatLocalizedText } from '@/lib/translations';
import { Theme, CompanySettings, DEFAULT_COMPANY_SETTINGS, NotificationItem, OvertimeSettings, ShiftSettings } from '@/lib/types';
import { DEFAULT_OVERTIME_SETTINGS } from '@/lib/overtime-calc';
import { DEFAULT_SHIFT_SETTINGS } from '@/lib/roster-shifts';

export interface Persona {
  id: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Medical Officer' | 'HR Officer' | 'IT Support';
  title: string;
  avatar: string;
  email: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'usr-admin',
    name: 'Administrator',
    role: 'Admin',
    title: 'HR Administrator / CPO',
    email: 'admin@outlook.com',
    avatar: '',
  },
  {
    id: 'usr-med-01',
    name: 'Dr. Chea Sokhom',
    role: 'Medical Officer',
    title: 'Staff Doctor & Chief Medical Officer (Medical Records + Medicine)',
    email: 'dr.sokhom@hestra.com',
    avatar: '',
  },
  {
    id: 'usr-hro-01',
    name: 'Sokha Ly',
    role: 'HR Officer',
    title: 'HR Employee Relations Officer (Employee Medical Information)',
    email: 'sokha.ly@hestra.com',
    avatar: '',
  },
  {
    id: 'usr-mgr-01',
    name: 'Vann Sopheak',
    role: 'Manager',
    title: 'Production Manager (Limited/Summary Information)',
    email: 'van.sopheak@outlook.com',
    avatar: '',
  },
  {
    id: 'usr-emp-01',
    name: 'Staff Member',
    role: 'Employee',
    title: 'Staff Member (Self Service)',
    email: 'staff@hestra.com',
    avatar: '',
  },
  {
    id: 'usr-it-01',
    name: 'Suon Visal',
    role: 'IT Support',
    title: 'IT Support Specialist (System Admin, No Medical Details)',
    email: 'suon.visal@outlook.com',
    avatar: '',
  },
];

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentPersona: Persona;
  switchPersona: (personaId: string) => void;
  loginAs: (user: { id: string; name: string; email: string; role: 'Admin' | 'Manager' | 'Employee' | 'Medical Officer' | 'HR Officer' | 'IT Support'; avatar?: string; title?: string }) => void;
  logout: () => Promise<void>;
  isClockedIn: boolean;
  clockInTime: string | null;
  toggleClock: () => Promise<void>;
  faceInModalOpen: boolean;
  openFaceInModal: () => void;
  closeFaceInModal: () => void;
  recordFacePunch: (options: {
    photo?: string;
    deviceId?: string;
    confidence?: number;
    action?: 'clock_in' | 'clock_out';
  }) => Promise<{ success: boolean; message?: string; isClockedIn?: boolean }>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  activeModal: string | null;
  openModal: (modalName: string) => void;
  closeModal: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  companySettings: CompanySettings;
  updateCompanySettingsContext: (newSettings: Partial<CompanySettings>) => Promise<boolean>;
  overtimeSettings: OvertimeSettings;
  updateOvertimeSettingsContext: (newSettings: Partial<OvertimeSettings>) => Promise<boolean>;
  resetOvertimeSettingsContext: () => Promise<boolean>;
  shiftSettings: ShiftSettings;
  updateShiftSettingsContext: (newSettings: Partial<ShiftSettings>) => Promise<boolean>;
  resetShiftSettingsContext: () => Promise<boolean>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  loadingNotifications: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string, isRead?: boolean) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotificationItem: (id: string) => Promise<void>;
  clearAllNotificationsContext: () => Promise<void>;
  t: (key: keyof typeof TRANSLATIONS['km']) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPersona, setCurrentPersona] = useState<Persona>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('hestra_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.name && parsed.role) return parsed;
        }
      } catch {}
    }
    return PERSONAS[0];
  });
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [faceInModalOpen, setFaceInModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const userChoice = localStorage.getItem('hestra_user_lang_selected') as Language | null;
        if (userChoice === 'en' || userChoice === 'km') {
          return userChoice;
        }
        // Website is English by default; overwrite any legacy stored defaults
        localStorage.setItem('hestra_lang', 'en');
        localStorage.setItem('hestrahrm_lang', 'en');
        return 'en';
      } catch {}
    }
    return 'en';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = (localStorage.getItem('hestra_theme') || localStorage.getItem('hestrahrm_theme')) as Theme | null;
        if (savedTheme === 'nordic' || savedTheme === 'midnight' || savedTheme === 'indigo') return savedTheme;
      } catch {}
    }
    return 'nordic';
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedComp = localStorage.getItem('hestra_company_settings');
        if (cachedComp) return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(cachedComp) };
      } catch {}
    }
    return DEFAULT_COMPANY_SETTINGS;
  });
  const [overtimeSettings, setOvertimeSettings] = useState<OvertimeSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedOt = localStorage.getItem('hestra_overtime_settings');
        if (cachedOt) return { ...DEFAULT_OVERTIME_SETTINGS, ...JSON.parse(cachedOt) };
      } catch {}
    }
    return DEFAULT_OVERTIME_SETTINGS;
  });
  const [shiftSettings, setShiftSettings] = useState<ShiftSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedShift = localStorage.getItem('hestra_shift_settings');
        if (cachedShift) return { ...DEFAULT_SHIFT_SETTINGS, ...JSON.parse(cachedShift) };
      } catch {}
    }
    return DEFAULT_SHIFT_SETTINGS;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      const finalMsg = formatLocalizedText(message, language) || message;
      setToasts((prev) => [...prev, { id, message: finalMsg, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [language]
  );

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setCompanySettings(data);
          try {
            localStorage.setItem('hestra_company_settings', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});

    fetch('/api/overtime/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          setOvertimeSettings(data);
          try {
            localStorage.setItem('hestra_overtime_settings', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});

    fetch('/api/roster/shifts')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shifts) {
          setShiftSettings(data);
          try {
            localStorage.setItem('hestra_shift_settings', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.remove('theme-nordic', 'theme-midnight', 'theme-indigo', 'dark');
      if (theme === 'midnight') {
        document.documentElement.classList.add('theme-midnight', 'dark');
      } else if (theme === 'indigo') {
        document.documentElement.classList.add('theme-indigo', 'dark');
      } else {
        document.documentElement.classList.add('theme-nordic');
      }
    }
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('hestra_theme', newTheme);
      } catch {}
      const themeName =
        newTheme === 'nordic'
          ? (language === 'km' ? 'ពន្លឺធម្មជាតិ (Nordic Light)' : 'Nordic Minimal (Light)')
          : newTheme === 'midnight'
          ? (language === 'km' ? 'ងងឹត (Midnight Dark)' : 'Midnight Obsidian (Dark)')
          : (language === 'km' ? 'ខៀវចាស់ (Indigo)' : 'Indigo Electric');

      showToast(
        language === 'km'
          ? `រចនាប័ទ្មប្រព័ន្ធត្រូវបានប្តូរទៅជា ${themeName}`
          : `System theme switched to ${themeName}`,
        'info'
      );
    },
    [language, showToast]
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'km' ? 'km-KH' : 'en-GB';
      if (language === 'km') {
        document.documentElement.classList.add('lang-km');
      } else {
        document.documentElement.classList.remove('lang-km');
      }
    }
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('hestra_lang', newLang);
      localStorage.setItem('hestrahrm_lang', newLang);
      localStorage.setItem('hestra_user_lang_selected', newLang);
    } catch {}
    showToast(
      newLang === 'km'
        ? 'ភាសាត្រូវបានប្តូរទៅជា ភាសាខ្មែរ 🇰🇭'
        : 'Language switched to English 🇬🇧',
      'info'
    );
  }, [showToast]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'km' ? 'en' : 'km');
  }, [language, setLanguage]);

  const t = useCallback((key: keyof typeof TRANSLATIONS['km']) => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) return dict[key];
    if (language === 'en') {
      return TRANSLATIONS['en'][key] || (key as string);
    }
    return TRANSLATIONS['km'][key] || (key as string);
  }, [language]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const checkClockStatus = useCallback(async (personaId: string) => {
    if (!personaId) {
      setIsClockedIn(false);
      setClockInTime(null);
      return;
    }
    try {
      const res = await fetch(`/api/attendance/clock?employee_id=${encodeURIComponent(personaId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isClockedIn && data.record && data.record.clock_in) {
          setIsClockedIn(true);
          const timeParts = data.record.clock_in.split(':');
          let displayTime = data.record.clock_in;
          if (timeParts.length >= 2) {
            const h = parseInt(timeParts[0], 10);
            const m = timeParts[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            displayTime = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
          }
          setClockInTime(displayTime);
        } else {
          setIsClockedIn(false);
          setClockInTime(null);
        }
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
      }
    } catch {
      setIsClockedIn(false);
      setClockInTime(null);
    }
  }, []);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('hestra_current_user');
      if (savedUser) {
        document.cookie = `hestra_auth=${encodeURIComponent(currentPersona.id)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `hestra_role=${encodeURIComponent(currentPersona.role)}; path=/; max-age=604800; SameSite=Lax`;
      }
    } catch {}

    if (currentPersona?.id) {
      let isMounted = true;
      fetch(`/api/attendance/clock?employee_id=${encodeURIComponent(currentPersona.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data && data.isClockedIn && data.record && data.record.clock_in) {
            setIsClockedIn(true);
            const timeParts = data.record.clock_in.split(':');
            let displayTime = data.record.clock_in;
            if (timeParts.length >= 2) {
              const h = parseInt(timeParts[0], 10);
              const m = timeParts[1];
              const ampm = h >= 12 ? 'PM' : 'AM';
              const h12 = h % 12 || 12;
              displayTime = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
            }
            setClockInTime(displayTime);
          } else {
            setIsClockedIn(false);
            setClockInTime(null);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [currentPersona.id, currentPersona.role]);

  const switchPersona = (personaId: string) => {
    const found = PERSONAS.find((p) => p.id === personaId);
    if (found) {
      setIsClockedIn(false);
      setClockInTime(null);
      setCurrentPersona(found);
      try {
        localStorage.setItem('hestra_current_user', JSON.stringify(found));
        document.cookie = `hestra_auth=${encodeURIComponent(found.id)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `hestra_role=${encodeURIComponent(found.role)}; path=/; max-age=604800; SameSite=Lax`;
        fetch('/api/auth/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: found.id, role: found.role }),
        }).catch(() => {});
      } catch {}
      checkClockStatus(found.id);
      showToast(`Switched view to ${found.name} (${found.role})`, 'info');
    }
  };

  const loginAs = (userData: { id: string; name: string; email: string; role: 'Admin' | 'Manager' | 'Employee' | 'Medical Officer' | 'HR Officer' | 'IT Support'; avatar?: string; title?: string }) => {
    const newPersona: Persona = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      title: userData.title || (userData.role === 'Admin' ? 'Head of Human Resources' : userData.role === 'Manager' ? 'Department Manager' : 'Staff Member'),
      avatar: userData.avatar || '',
    };
    // Ensure state starts strictly manual upon login
    setIsClockedIn(false);
    setClockInTime(null);
    setCurrentPersona(newPersona);
    try {
      localStorage.setItem('hestra_current_user', JSON.stringify(newPersona));
      document.cookie = `hestra_auth=${encodeURIComponent(userData.id)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `hestra_role=${encodeURIComponent(userData.role)}; path=/; max-age=604800; SameSite=Lax`;
      fetch('/api/auth/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, role: userData.role }),
      }).catch(() => {});
    } catch {}
    checkClockStatus(newPersona.id);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('hestra_current_user');
      document.cookie = 'hestra_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'hestra_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'hestra_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {}
    setIsClockedIn(false);
    setClockInTime(null);
    showToast(language === 'km' ? 'បានចាកចេញពីប្រព័ន្ធដោយជោគជ័យ' : 'Logged out successfully', 'info');
    window.location.replace('/login?logout=1');
  };

  const toggleClock = async () => {
    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: currentPersona.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsClockedIn(data.isClockedIn);
        if (data.isClockedIn) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setClockInTime(nowStr);
          showToast(
            language === 'km'
              ? `បានកត់ត្រាវត្តមានចូលដោយជោគជ័យនៅម៉ោង ${nowStr} ✓`
              : `Clocked in successfully at ${nowStr} ✓`,
            'success'
          );
        } else {
          setClockInTime(null);
          showToast(
            data.message || (language === 'km' ? 'បានកត់ត្រាចេញដោយជោគជ័យ ✓' : 'Clocked out successfully ✓'),
            'info'
          );
        }
        triggerRefresh();
      } else {
        showToast(data.error || 'Failed to update clock status', 'error');
      }
    } catch {
      // Fallback optimistic update
      setIsClockedIn(!isClockedIn);
      showToast(isClockedIn ? 'Clocked out for the day' : 'Clocked in successfully', 'success');
    }
  };

  const openFaceInModal = () => setFaceInModalOpen(true);
  const closeFaceInModal = () => setFaceInModalOpen(false);

  const recordFacePunch = async (options: {
    photo?: string;
    deviceId?: string;
    confidence?: number;
    action?: 'clock_in' | 'clock_out';
  }) => {
    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: currentPersona.id,
          method: 'Face',
          verification_method: 'Face',
          device_id: options.deviceId || 'zk-01',
          photo: options.photo,
          confidence: options.confidence || 0.988,
          action: options.action,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsClockedIn(data.isClockedIn);
        if (data.isClockedIn) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setClockInTime(nowStr);
          showToast(
            language === 'km'
              ? `ស្កេនមុខចូលជោគជ័យនៅម៉ោង ${nowStr} (ZKTeco SpeedFace) ✓`
              : `Faced in successfully at ${nowStr} via ZKTeco SpeedFace ✓`,
            'success'
          );
        } else {
          setClockInTime(null);
          showToast(
            data.message || (language === 'km' ? 'ស្កេនមុខចេញជោគជ័យ (ZKTeco SpeedFace) ✓' : 'Faced out successfully via ZKTeco SpeedFace ✓'),
            'info'
          );
        }
        triggerRefresh();
        return { success: true, message: data.message, isClockedIn: data.isClockedIn };
      } else {
        showToast(data.error || 'Failed to record face biometric attendance', 'error');
        return { success: false, message: data.error, isClockedIn };
      }
    } catch (err: any) {
      showToast('Network error while recording face biometric attendance', 'error');
      return { success: false, message: err.message, isClockedIn };
    }
  };

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);
  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleMobileMenu = () => setMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const updateCompanySettingsContext = useCallback(
    async (newSettings: Partial<CompanySettings>): Promise<boolean> => {
      try {
        const merged = { ...companySettings, ...newSettings };
        setCompanySettings(merged);
        try {
          localStorage.setItem('hestra_company_settings', JSON.stringify(merged));
        } catch {}

        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setCompanySettings(data.settings);
            try {
              localStorage.setItem('hestra_company_settings', JSON.stringify(data.settings));
            } catch {}
          }
          triggerRefresh();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error updating company settings:', err);
        return false;
      }
    },
    [companySettings, triggerRefresh]
  );

  const updateOvertimeSettingsContext = useCallback(
    async (newSettings: Partial<OvertimeSettings>): Promise<boolean> => {
      try {
        const merged: OvertimeSettings = {
          ...overtimeSettings,
          ...newSettings,
          rates: {
            ...overtimeSettings.rates,
            ...(newSettings.rates || {}),
          },
        };
        setOvertimeSettings(merged);
        try {
          localStorage.setItem('hestra_overtime_settings', JSON.stringify(merged));
        } catch {}

        const res = await fetch('/api/overtime/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setOvertimeSettings(data.settings);
            try {
              localStorage.setItem('hestra_overtime_settings', JSON.stringify(data.settings));
            } catch {}
          }
          triggerRefresh();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error updating overtime settings:', err);
        return false;
      }
    },
    [overtimeSettings, triggerRefresh]
  );

  const resetOvertimeSettingsContext = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/overtime/settings?action=reset', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setOvertimeSettings(data.settings);
          try {
            localStorage.setItem('hestra_overtime_settings', JSON.stringify(data.settings));
          } catch {}
        }
        triggerRefresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error resetting overtime settings:', err);
      return false;
    }
  }, [triggerRefresh]);

  const updateShiftSettingsContext = useCallback(
    async (newSettings: Partial<ShiftSettings>): Promise<boolean> => {
      try {
        const merged: ShiftSettings = {
          ...shiftSettings,
          ...newSettings,
          isCustomized: true,
          shifts: {
            ...shiftSettings.shifts,
            ...(newSettings.shifts || {}),
          },
        };
        setShiftSettings(merged);
        try {
          localStorage.setItem('hestra_shift_settings', JSON.stringify(merged));
        } catch {}

        const res = await fetch('/api/roster/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setShiftSettings(data.settings);
            try {
              localStorage.setItem('hestra_shift_settings', JSON.stringify(data.settings));
            } catch {}
          }
          triggerRefresh();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error updating shift settings:', err);
        return false;
      }
    },
    [shiftSettings, triggerRefresh]
  );

  const resetShiftSettingsContext = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/roster/shifts?action=reset', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setShiftSettings(data.settings);
          try {
            localStorage.setItem('hestra_shift_settings', JSON.stringify(data.settings));
          } catch {}
        }
        triggerRefresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error resetting shift settings:', err);
      return false;
    }
  }, [triggerRefresh]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const markNotificationAsRead = useCallback(
    async (id: string, isRead: boolean = true) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: isRead } : n))
      );
      setUnreadNotificationsCount((prev) =>
        isRead ? Math.max(0, prev - 1) : prev + 1
      );

      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_read: isRead }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadNotificationsCount(data.unreadCount);
          }
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadNotificationsCount(0);

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadNotificationsCount(data.unreadCount);
        }
        showToast(
          language === 'km'
            ? 'បានសម្គាល់ការជូនដំណឹងទាំងអស់ថាបានអាន ✓'
            : 'All notifications marked as read ✓',
          'success'
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotifications();
    }
  }, [fetchNotifications, language, showToast]);

  const deleteNotificationItem = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadNotificationsCount(data.unreadCount);
          }
        }
      } catch (err) {
        console.error('Error deleting notification:', err);
        fetchNotifications();
      }
    },
    [notifications, fetchNotifications]
  );

  const clearAllNotificationsContext = useCallback(async () => {
    setNotifications([]);
    setUnreadNotificationsCount(0);

    try {
      await fetch('/api/notifications?all=true', { method: 'DELETE' });
    } catch (err) {
      console.error('Error clearing notifications:', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = () => {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          setNotifications(data?.notifications || []);
          setUnreadNotificationsCount(data?.unreadCount || 0);
        })
        .catch(() => {});
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey, currentPersona.id]);

  return (
    <AppContext.Provider
      value={{
        currentPersona,
        switchPersona,
        loginAs,
        logout,
        isClockedIn,
        clockInTime,
        toggleClock,
        faceInModalOpen,
        openFaceInModal,
        closeFaceInModal,
        recordFacePunch,
        toasts,
        showToast,
        removeToast,
        activeModal,
        openModal,
        closeModal,
        refreshKey,
        triggerRefresh,
        sidebarCollapsed,
        toggleSidebar,
        mobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        companySettings,
        updateCompanySettingsContext,
        overtimeSettings,
        updateOvertimeSettingsContext,
        resetOvertimeSettingsContext,
        shiftSettings,
        updateShiftSettingsContext,
        resetShiftSettingsContext,
        notifications,
        unreadNotificationsCount,
        loadingNotifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotificationItem,
        clearAllNotificationsContext,
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
