'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { Card, Button, Input, Alert } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  taxId: string;
  address: string;
  bankIban: string;
  mwstNumber: string;
  website: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  bankIban?: string;
  mwstNumber?: string;
}

const swissIbanRegex = /^CH\d{2}(?:\s?[A-Z0-9]){15,30}$/i;
const swissMwstRegex = /^(?:CHE-)?\d{3}\.\d{3}\.\d{3}(?:\s?(?:MWST|TVA|IVA))?$/i;

const validateHostRegistrationAccountFields = (form: FormState, isAuthenticated: boolean): FormErrors => {
  const nextErrors: FormErrors = {};

  if (isAuthenticated) {
    return nextErrors;
  }

  if (!form.name.trim()) nextErrors.name = 'Full name is required.';
  if (!form.email.trim()) nextErrors.email = 'Email is required.';
  if (!form.password.trim()) nextErrors.password = 'Password is required.';
  if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
};

const validateHostRegistrationBusinessFields = (form: FormState): FormErrors => {
  const nextErrors: FormErrors = {};

  if (!form.companyName.trim()) {
    nextErrors.companyName = 'Company name is required.';
  }

  if (form.bankIban.trim()) {
    const normalizedIban = form.bankIban.trim().replaceAll(/\s/g, '');
    if (!swissIbanRegex.test(normalizedIban)) {
      nextErrors.bankIban = 'Use a Swiss IBAN, for example CH12 3456 7890 1234 5678 9.';
    }
  }

  if (form.mwstNumber.trim() && !swissMwstRegex.test(form.mwstNumber.trim())) {
    nextErrors.mwstNumber = 'Use a Swiss MWST number, for example CHE-123.456.789 MWST.';
  }

  return nextErrors;
};

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  contactPerson: '',
  phoneNumber: '',
  taxId: '',
  address: '',
  bankIban: '',
  mwstNumber: '',
  website: '',
};

export default function HostRegistrationPage() {
  const router = useRouter();
  const { user, isAuthenticated, register } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const canShowAccountFields = !isAuthenticated;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitHostRegistration = async () => {
    return apiCall('POST', '/hosts/register', {
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      address: form.address.trim() || undefined,
      bankIban: form.bankIban.trim() || undefined,
      mwstNumber: form.mwstNumber.trim() || undefined,
      website: form.website.trim() || undefined,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const nextErrors = {
      ...validateHostRegistrationAccountFields(form, isAuthenticated),
      ...validateHostRegistrationBusinessFields(form),
    };

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      if (!isAuthenticated) {
        const reg = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          role: 'customer',
        });

        if (!reg.success) {
          setError(reg.error || 'Failed to create account.');
          setLoading(false);
          return;
        }
      }

      const hostRes = await submitHostRegistration();
      if (!hostRes.success) {
        setError(hostRes.error?.message || 'Failed to submit host registration.');
        setLoading(false);
        return;
      }

      setSuccess('Your host registration has been submitted. Your account is under approval. Once an admin approves, you will access the host portal.');
      setForm(initialForm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-700" />
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                  Parking partner program for airport hosts
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                    Turn your parking space into a steady booking channel.
                  </h1>
                  <p className="max-w-2xl text-base sm:text-lg text-white/80 leading-7">
                    Join ZurichPark to reach travelers looking for secure airport parking near Zurich.
                    We handle discovery, bookings, payments, and host onboarding while you focus on the parking experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'Verified', label: 'Admin-approved onboarding' },
                    { value: '24/7', label: 'Online booking availability' },
                    { value: '1 portal', label: 'Manage requests in one place' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                      <p className="text-lg font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="#registration-form">
                    <Button size="lg">Start application</Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="secondary">How it works</Button>
                  </Link>
                </div>
              </div>

              <div className="lg:pl-8">
                <Card className="p-6 sm:p-8 shadow-2xl shadow-slate-950/20 bg-white text-gray-900">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">What hosts get</p>
                    <h2 className="text-2xl font-bold">A cleaner way to fill empty parking spots</h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li>• A dedicated host portal for bookings and performance overview</li>
                      <li>• Admin-reviewed onboarding for quality and trust</li>
                      <li>• Support for airport travelers who need a simple, reliable parking experience</li>
                      <li>• Structured payouts and booking handling through the platform</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Better visibility',
                      text: 'Show up in a marketplace designed for airport parking, not a generic classifieds page.',
                    },
                    {
                      title: 'Simple onboarding',
                      text: 'Submit your company details once. We review the account before the portal opens.',
                    },
                    {
                      title: 'Operational control',
                      text: 'Handle arrivals, change requests, and booking visibility from one host workspace.',
                    },
                    {
                      title: 'Trusted payments',
                      text: 'Bookings, refunds, and payouts are handled inside the platform flow.',
                    },
                  ].map((item) => (
                    <Card key={item.title} className="p-5">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                    </Card>
                  ))}
                </div>

                <Card className="p-6" id="how-it-works">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">How it works</p>
                  <div className="mt-4 space-y-4">
                    {[
                      'Fill out the host application with your company and contact details.',
                      'Our team reviews the account and verifies the profile.',
                      'After approval, you get access to the host portal and can start receiving bookings.',
                    ].map((item, index) => (
                      <div key={item} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-gray-600">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-6 sm:p-8 shadow-soft" id="registration-form">
                {success && (
                  <Alert variant="success" className="mb-4">
                    {success}
                  </Alert>
                )}
                {error && (
                  <Alert variant="error" className="mb-4" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {isAuthenticated && user?.role === 'host' ? (
                  <div className="space-y-4 text-center">
                    <p className="text-gray-700">Your account already has host access.</p>
                    <Button onClick={() => router.push('/host')}>Go to Host Portal</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {canShowAccountFields && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Create your account</p>
                          <p className="mt-1 text-sm text-gray-500">You need an account before we can convert it into a host profile.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Full name"
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.name}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.email}
                          />
                          <Input
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            disabled={loading}
                          />
                          <div className="hidden md:block" />
                          <Input
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.password}
                          />
                          <Input
                            label="Confirm password"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            disabled={loading}
                            required
                            error={fieldErrors.confirmPassword}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Host application</p>
                        <p className="mt-1 text-sm text-gray-500">Tell us about the parking business you want to list.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Company name"
                          value={form.companyName}
                          onChange={(e) => updateField('companyName', e.target.value)}
                          disabled={loading}
                          required
                          error={fieldErrors.companyName}
                        />
                        <Input
                          label="Contact person"
                          value={form.contactPerson}
                          onChange={(e) => updateField('contactPerson', e.target.value)}
                          disabled={loading}
                          placeholder="Who should we contact?"
                        />
                        <Input
                          label="Company phone"
                          value={form.phoneNumber}
                          onChange={(e) => updateField('phoneNumber', e.target.value)}
                          disabled={loading}
                          placeholder="Main business phone"
                        />
                        <Input
                          label="Tax ID"
                          value={form.taxId}
                          onChange={(e) => updateField('taxId', e.target.value)}
                          disabled={loading}
                        />
                        <Input
                          label="IBAN"
                          value={form.bankIban}
                          onChange={(e) => updateField('bankIban', e.target.value)}
                          disabled={loading}
                          placeholder="For future payouts"
                          helperText="Swiss IBAN format, for example CH12 3456 7890 1234 5678 9."
                          error={fieldErrors.bankIban}
                        />
                        <Input
                          label="MWST number"
                          value={form.mwstNumber}
                          onChange={(e) => updateField('mwstNumber', e.target.value)}
                          disabled={loading}
                          placeholder="Optional"
                          helperText="Swiss VAT format, for example CHE-123.456.789 MWST."
                          error={fieldErrors.mwstNumber}
                        />
                        <Input
                          label="Website"
                          type="url"
                          value={form.website}
                          onChange={(e) => updateField('website', e.target.value)}
                          disabled={loading}
                          placeholder="https://..."
                        />
                        <div className="md:col-span-2">
                          <label htmlFor="host-address" className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-error-500">*</span></label>
                          <textarea
                            id="host-address"
                            value={form.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            rows={4}
                            disabled={loading}
                            placeholder="Business address or parking location address"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                      Submit host application
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-sm text-gray-500 text-center">
                        Already have an account? <Link href="/login?returnUrl=%2Fhost-registration" className="text-primary-600">Sign in</Link>
                      </p>
                    )}
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
