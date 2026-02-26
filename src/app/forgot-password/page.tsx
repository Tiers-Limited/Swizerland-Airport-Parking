'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { apiCall } from '@/lib/api';
import { isValidEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiCall('POST', '/auth/forgot-password', { email });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        // Don't reveal if email exists or not for security
        setIsSubmitted(true);
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
            {!isSubmitted ? (
              <>
                <Link
                  href="/login"
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Zurück zur Anmeldung
                </Link>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-baby-blue-100 text-baby-blue-600 mb-4">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Passwort vergessen?</h1>
                  <p className="text-gray-500 mt-2">
                    Kein Problem, wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
                  </p>
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="sie@beispiel.com"
                    autoComplete="email"
                    required
                    leftIcon={
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                  >
                    Link senden
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Prüfen Sie Ihre E-Mails</h2>
                <p className="text-gray-500 mb-6">
                  Wir haben einen Link zum Zurücksetzen des Passworts gesendet an<br />
                  <span className="font-medium text-gray-700">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  E-Mail nicht erhalten? Überprüfen Sie Ihren Spam-Ordner oder{' '}
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-baby-blue-600 hover:text-baby-blue-700"
                  >
                    versuchen Sie es erneut
                  </button>
                </p>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Zurück zur Anmeldung
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
