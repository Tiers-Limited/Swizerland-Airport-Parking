'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import { Button, Card, Logo } from '@/components/ui';
import { getRoleDisplayName } from '@/lib/rbac';

export default function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth();
  const { getRedirectPath } = useRBAC();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-baby-blue-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card padding="lg" className="animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning-100 text-warning-600 mb-6">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
            <p className="text-gray-500 mb-6">
              Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
              {isAuthenticated && user && (
                <>
                  <br />
                  <span className="text-sm">
                    Sie sind als <strong>{getRoleDisplayName(user.role)}</strong> angemeldet.
                  </span>
                </>
              )}
            </p>

            <div className="space-y-3">
              {isAuthenticated ? (
                <>
                  <Link href={getRedirectPath()}>
                    <Button className="w-full">Zum Dashboard</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" className="w-full">Zur Startseite</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="w-full">Anmelden</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" className="w-full">Zur Startseite</Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
