'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { isValidEmail, isValidSwissPhone } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/account');
    }
  }, [isAuthenticated, router]);

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name muss mindestens 2 Zeichen lang sein';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }
    if (formData.phone && !isValidSwissPhone(formData.phone)) {
      newErrors.phone = 'Bitte geben Sie eine gültige Schweizer Telefonnummer ein';
    }
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setGeneralError('');
    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        role: 'customer',
      });

      if (result.success) {
        router.push('/account');
      } else {
        setGeneralError(result.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      setGeneralError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
              <h1 className="text-2xl font-bold text-gray-900">Konto erstellen</h1>
              <p className="text-gray-500 mt-2">Geben Sie Ihre Daten ein, um zu starten</p>
            </div>

            {generalError && (
              <Alert variant="error" className="mb-6" onClose={() => setGeneralError('')}>
                {generalError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Vollständiger Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                error={errors.name}
                required
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <Input
                label="E-Mail-Adresse"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={errors.email}
                autoComplete="email"
                required
              />

              <Input
                label="Telefonnummer"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+41 XX XXX XX XX"
                error={errors.phone}
                helperText="Optional, aber empfohlen für Buchungs-Updates"
              />

              <Input
                label="Passwort"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
                helperText="Mindestens 8 Zeichen"
                autoComplete="new-password"
                required
              />

              <Input
                label="Passwort bestätigen"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Konto erstellen
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Bereits ein Konto?{' '}
                <Link href="/login" className="text-baby-blue-600 hover:text-baby-blue-700 font-medium">
                  Anmelden
                </Link>
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Mit der Kontoerstellung akzeptieren Sie unsere{' '}
              <Link href="/terms" className="text-baby-blue-600 hover:text-baby-blue-700">
                AGB
              </Link>{' '}
              und{' '}
              <Link href="/privacy" className="text-baby-blue-600 hover:text-baby-blue-700">
                Datenschutzrichtlinie
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
