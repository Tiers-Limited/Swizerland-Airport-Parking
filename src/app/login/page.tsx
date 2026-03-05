'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { getDefaultRedirectPath } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icons';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  const { login, isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(returnUrl || getDefaultRedirectPath(user.role));
    }
  }, [isAuthenticated, user, returnUrl, router]);

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = returnUrl ? decodeURIComponent(returnUrl) : getDefaultRedirectPath(result.user?.role || 'customer');
        router.push(redirectPath);
      } else {
        setError(result.error || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Card padding="lg" className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Willkommen zurück</h1>
              <p className="text-gray-500 mt-2">Melden Sie sich bei Ihrem Konto an</p>
            </div>

            {error && (
              <Alert variant="error" className="mb-6" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="E-Mail-Adresse"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
                leftIcon={<Icon name="Mail" className="h-5 w-5" />}
              />

              <div>
                <Input
                  label="Passwort"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  leftIcon={<Icon name="Lock" className="h-5 w-5" />}
                />
                <div className="text-right mt-2">
                  <Link href="/forgot-password" className="text-sm text-baby-blue-600 hover:text-baby-blue-700">
                    Passwort vergessen?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                <span >Anmelden</span>
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Noch kein Konto?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/register">
                  <Button variant="secondary" className="w-full" size="lg">
                    <span >Registrieren</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            Mit der Anmeldung akzeptieren Sie unsere{' '}
            <Link href="/terms" className="text-baby-blue-600 hover:text-baby-blue-700">
              AGB
            </Link>{' '}
            und{' '}
            <Link href="/privacy" className="text-baby-blue-600 hover:text-baby-blue-700">
              Datenschutzrichtlinie
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
