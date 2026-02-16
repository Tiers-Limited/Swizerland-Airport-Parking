'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Alert, Logo } from '@/components/ui';
import { isValidEmail, isValidSwissPhone } from '@/lib/utils';

type AccountType = 'customer' | 'host';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  
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
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !isValidSwissPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Swiss phone number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        role: accountType,
      });

      if (result.success) {
        // Redirect based on account type
        if (accountType === 'host') {
          router.push('/host/onboarding');
        } else {
          router.push('/account');
        }
      } else {
        setGeneralError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
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
                <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
                <p className="text-gray-500 mt-2">Choose how you want to use ZurichPark</p>
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
                      <h3 className="font-semibold text-gray-900">I'm a traveler</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Book parking spaces near Zurich Airport with shuttle service
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
                      <h3 className="font-semibold text-gray-900">I'm a parking company</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        List your parking spaces and manage bookings
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-baby-blue-600 hover:text-baby-blue-700 font-medium">
                    Sign in
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
                  {accountType === 'host' ? 'Create host account' : 'Create your account'}
                </h1>
                <p className="text-gray-500 mt-2">Fill in your details to get started</p>
              </div>

              {generalError && (
                <Alert variant="error" className="mb-6" onClose={() => setGeneralError('')}>
                  {generalError}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full name"
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
                  label="Email address"
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
                  label="Phone number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+41 XX XXX XX XX"
                  error={errors.phone}
                  helperText="Optional, but recommended for booking updates"
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  error={errors.password}
                  helperText="At least 8 characters"
                  autoComplete="new-password"
                  required
                />

                <Input
                  label="Confirm password"
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
                  Create account
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-baby-blue-600 hover:text-baby-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-baby-blue-600 hover:text-baby-blue-700">
                  Privacy Policy
                </Link>
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
