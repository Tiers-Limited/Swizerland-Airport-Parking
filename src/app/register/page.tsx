'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { isValidEmail, isValidSwissPhone } from '@/lib/utils';
import { useI18n } from '@/i18n';

type AccountType = 'customer' | 'host';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const { t } = useI18n();
  
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [accountType, setAccountType] = useState<AccountType>('customer');
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
      newErrors.name = t('auth.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.nameMinLength');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }
    if (formData.phone && !isValidSwissPhone(formData.phone)) {
      newErrors.phone = t('auth.phoneInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordMinLength');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsMismatch');
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
        role: accountType, // 'host' or 'customer' — host profile is created separately during onboarding
      });

      if (result.success) {
        // Redirect based on account type
        if (accountType === 'host') {
          router.push('/host/onboarding');
        } else {
          router.push('/account');
        }
      } else {
        setGeneralError(result.error || t('auth.registerFailed'));
      }
    } catch (err) {
      setGeneralError(t('auth.unexpectedError'));
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
          {step === 'type' ? (
            <Card padding="lg" className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
                <p className="text-gray-500 mt-2">{t('auth.chooseType')}</p>
              </div>

              <div className="space-y-4">
                {/* Customer option */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('customer');
                    setStep('details');
                  }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-baby-blue-500 
                           hover:bg-baby-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-baby-blue-100 text-baby-blue-600 group-hover:bg-baby-blue-200">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t('auth.imTraveler')}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('auth.travelDesc')}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Host option */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('host');
                    setStep('details');
                  }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-baby-blue-500 
                           hover:bg-baby-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-baby-blue-100 text-baby-blue-600 group-hover:bg-baby-blue-200">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t('auth.imCompany')}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('auth.companyDesc')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  {t('auth.hasAccount')}{' '}
                  <Link href="/login" className="text-baby-blue-600 hover:text-baby-blue-700 font-medium">
                    {t('common.signIn')}
                  </Link>
                </p>
              </div>
            </Card>
          ) : (
            <Card padding="lg" className="animate-fade-in">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  {accountType === 'host' ? t('auth.createHostAccount') : t('auth.registerTitle')}
                </h1>
                <p className="text-gray-500 mt-2">{t('auth.fillDetails')}</p>
              </div>

              {generalError && (
                <Alert variant="error" className="mb-6" onClose={() => setGeneralError('')}>
                  {generalError}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label={t('auth.name')}
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
                  label={t('auth.email')}
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
                  label={t('auth.phone')}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+41 XX XXX XX XX"
                  error={errors.phone}
                  helperText={t('auth.phoneHelper')}
                />

                <Input
                  label={t('auth.password')}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  error={errors.password}
                  helperText={t('auth.passwordHelper')}
                  autoComplete="new-password"
                  required
                />

                <Input
                  label={t('auth.confirmPassword')}
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
                  {t('auth.createAccount')}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {t('auth.byCreating')}{' '}
                <Link href="/terms" className="text-baby-blue-600 hover:text-baby-blue-700">
                  {t('booking.termsOfService')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" className="text-baby-blue-600 hover:text-baby-blue-700">
                  {t('booking.privacyPolicy')}
                </Link>
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
