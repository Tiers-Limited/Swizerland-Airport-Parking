'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Logo, Spinner } from '@/components/ui';
import { apiCall } from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Ungültiger Verifizierungslink. Kein Token vorhanden.');
        return;
      }

      try {
        const result = await apiCall('POST', '/auth/verify-email', { token });

        if (result.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(result.error?.message || 'E-Mail konnte nicht verifiziert werden. Der Link ist möglicherweise abgelaufen.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    };

    verifyEmail();
  }, [token]);

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
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-6">
                  <Spinner size="lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Ihre E-Mail wird verifiziert...</h2>
                <p className="text-gray-500">Bitte warten Sie, während wir Ihre E-Mail-Adresse verifizieren.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-6">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">E-Mail erfolgreich verifiziert!</h2>
                <p className="text-gray-500 mb-6">
                  Ihre E-Mail wurde erfolgreich verifiziert. Sie können jetzt alle Funktionen nutzen.
                </p>
                <Link href="/login">
                  <Button className="w-full">Anmelden und fortfahren</Button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-100 text-error-600 mb-6">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifizierung fehlgeschlagen</h2>
                <p className="text-gray-500 mb-6">{errorMessage}</p>
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full">Zur Anmeldung</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" className="w-full">Zur Startseite</Button>
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
