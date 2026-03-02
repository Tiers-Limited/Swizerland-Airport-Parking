'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { Spinner } from '@/components/ui';

const hostNavItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/host',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'listings',
    label: 'Parkplätze',
    href: '/host/listings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'bookings',
    label: 'Buchungen',
    href: '/host/bookings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'availability',
    label: 'Verfügbarkeit',
    href: '/host/availability',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'payouts',
    label: 'Auszahlungen',
    href: '/host/payouts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Einstellungen',
    href: '/host/settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function HostLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasHostProfile, setHasHostProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const isOnboarding = pathname === '/host/onboarding';

  useEffect(() => {
    if (authLoading || !isAuthenticated || isOnboarding) {
      setCheckingProfile(false);
      return;
    }

    async function checkHostProfile() {
      try {
        const res = await apiCall('GET', '/hosts/profile');
        setHasHostProfile(res.success && !!res.data);
      } catch {
        setHasHostProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    }

    checkHostProfile();
  }, [authLoading, isAuthenticated, isOnboarding]);

  useEffect(() => {
    if (!checkingProfile && hasHostProfile === false && !isOnboarding && isAuthenticated) {
      router.push('/host/onboarding');
    }
  }, [checkingProfile, hasHostProfile, isOnboarding, isAuthenticated, router]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  const isActive = (href: string) => {
    if (href === '/host') return pathname === '/host';
    return pathname.startsWith(href);
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="host">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 flex">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-baby-blue-600 text-white rounded-full shadow-lg"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Sidebar — CMS style matching admin */}
          <aside className={cn(
            'fixed lg:sticky top-0 lg:top-20 left-0 z-40 w-64 h-screen lg:h-[calc(100vh-5rem)] bg-white border-r border-gray-200 transition-transform lg:translate-x-0 overflow-y-auto',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="p-5 border-b border-gray-100 lg:mt-0 mt-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-baby-blue-100 flex items-center justify-center text-baby-blue-600 font-bold text-sm">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-baby-blue-600 font-medium">Host Portal</p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              {hostNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 capitalize rounded-xl text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-baby-blue-50 text-baby-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Overlay */}
          {isSidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            />
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0 p-4 lg:p-8">
            {children}
          </main>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
