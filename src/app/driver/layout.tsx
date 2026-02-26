'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';

const driverNavItems = [
  {
    key: 'dashboard',
    label: 'Übersicht',
    href: '/driver',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'shifts',
    label: 'Meine Schichten',
    href: '/driver/shifts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function DriverLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/driver') return pathname === '/driver';
    return pathname.startsWith(href);
  };

  return (
    <ProtectedRoute requiredRole="driver">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 flex">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-emerald-600 text-white rounded-full shadow-lg"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <aside className={cn(
            'fixed lg:sticky top-0 lg:top-20 left-0 z-40 w-64 h-screen lg:h-[calc(100vh-5rem)] bg-white border-r border-gray-200 transition-transform lg:translate-x-0 overflow-y-auto',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="p-5 border-b border-gray-100 lg:mt-0 mt-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">Fahrer</p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              {driverNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
