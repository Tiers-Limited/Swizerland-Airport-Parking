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
    href: '/host',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'listings',
    href: '/host/listings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'bookings',
    href: '/host/bookings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'vehicles',
    href: '/host/vehicles',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M12 17h.01M16 17h.01M3 9l2.5-5h13L21 9M3 9h18M3 9v8a1 1 0 001 1h1m0 0a2 2 0 104 0m-4 0h4m6 0a2 2 0 104 0m-4 0h4a1 1 0 001-1V9" />
      </svg>
    ),
  },
  {
    key: 'availability',
    href: '/host/availability',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'payouts',
    href: '/host/payouts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'settings',
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

  // Check if user has a host profile (only for non-onboarding routes)
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

  // Redirect to onboarding if no host profile and not already on onboarding
  useEffect(() => {
    if (!checkingProfile && hasHostProfile === false && !isOnboarding && isAuthenticated) {
      router.push('/host/onboarding');
    }
  }, [checkingProfile, hasHostProfile, isOnboarding, isAuthenticated, router]);

  // For the onboarding page, render children directly (it has its own layout)
  if (isOnboarding) {
    return <>{children}</>;
  }

  const navLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    listings: 'Parkplätze',
    bookings: 'Buchungen',
    vehicles: 'Fahrzeuge',
    availability: 'Verfügbarkeit',
    payouts: 'Auszahlungen',
    settings: 'Einstellungen',
  };

  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="host">
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-600 bg-white rounded-xl px-4 py-3 shadow-soft border border-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menü
              </button>

              {/* Sidebar */}
              <aside className={cn(
                'lg:w-64 shrink-0',
                isSidebarOpen ? 'block' : 'hidden lg:block'
              )}>
                {/* Host info */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-baby-blue-100 flex items-center justify-center text-baby-blue-600 font-bold text-lg">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-baby-blue-600 font-medium uppercase tracking-wide">
                        Host Portal
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="bg-white rounded-2xl shadow-soft border border-gray-100 p-2">
                  {hostNavItems.map((item) => {
                    const isActive = item.href === '/host'
                      ? pathname === '/host'
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-baby-blue-50 text-baby-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.icon}
                        {navLabels[item.key]}
                      </Link>
                    );
                  })}
                </nav>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0">{children}</div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
