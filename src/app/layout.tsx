import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'HESTRA HRM | Enterprise Human Resource Management System',
  description: 'Next-Generation Full-Stack HRMS: Employees, Time Off, Payroll, ATS, Performance & Attendance',
  icons: {
    icon: '/hestra-logo.svg',
    shortcut: '/hestra-logo.svg',
    apple: '/hestra-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full antialiased font-sans text-slate-900 bg-slate-50">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
