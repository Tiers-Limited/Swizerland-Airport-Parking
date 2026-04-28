'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { apiCall } from '@/lib/api';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein';
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
      const result = await apiCall('POST', '/auth/reset-password', {
        token,
        newPassword: formData.password,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        if (result.error?.code === 'INVALID_TOKEN' || result.error?.code === 'EXPIRED_TOKEN') {
          setIsValidToken(false);
        } else {
          setGeneralError(result.error?.message || 'Passwort konnte nicht zur�ckgesetzt werden. Bitte versuchen Sie es erneut.');
        }
      }
    } catch (err) {
      setGeneralError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-baby-blue-50 flex flex-col">
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card padding="lg" className="animate-fade-in">
            {!isValidToken ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-100 text-error-600 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ung�ltiger oder abgelaufener Link</h2>
                <p className="text-gray-500 mb-6">
                  Dieser Link zum Zur�cksetzen des Passworts ist ung�ltig oder abgelaufen. Bitte fordern Sie einen neuen an.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full">Neuen Link anfordern</Button>
                </Link>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort erfolgreich zur�ckgesetzt</h2>
                <p className="text-gray-500 mb-6">
                  Ihr Passwort wurde zur�ckgesetzt. Sie k�nnen sich jetzt mit Ihrem neuen Passwort anmelden.
                </p>
                <Link href="/login">
                  <Button className="w-full">Anmelden</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-baby-blue-100 text-baby-blue-600 mb-4">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Neues Passwort festlegen</h1>
                  <p className="text-gray-500 mt-2">
                    Erstellen Sie ein sicheres Passwort f�r Ihr Konto
                  </p>
                </div>

                {generalError && (
                  <Alert variant="error" className="mb-6" onClose={() => setGeneralError('')}>
                    {generalError}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Neues Passwort"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="��������"
                    error={errors.password}
                    helperText="Mindestens 8 Zeichen"
                    autoComplete="new-password"
                    required
                  />

                  <Input
                    label="Neues Passwort best�tigen"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="��������"
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
                    Passwort zur�cksetzen
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
