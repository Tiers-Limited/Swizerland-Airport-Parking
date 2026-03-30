'use client';

import { useMemo, useState } from 'react';
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
  taxId: string;
  address: string;
  website: string;
}

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  taxId: '',
  address: '',
  website: '',
};

export default function HostRegistrationPage() {
  const router = useRouter();
  const { user, isAuthenticated, register } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canShowAccountFields = useMemo(
    () => !isAuthenticated,
    [isAuthenticated]
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitHostRegistration = async () => {
    return apiCall('POST', '/hosts/register', {
      companyName: form.companyName.trim(),
      taxId: form.taxId.trim() || undefined,
      address: form.address.trim() || undefined,
      website: form.website.trim() || undefined,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    if (!isAuthenticated) {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setError('Name, email and password are required.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Become a host</h1>
            <p className="text-gray-600 mt-3">
              Register as a parking partner. Your account stays under admin approval until verified.
            </p>
          </div>

          <Card className="p-6 sm:p-8">
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {canShowAccountFields && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full name"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        disabled={loading}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        disabled={loading}
                        required
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
                      />
                      <Input
                        label="Confirm password"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <hr className="border-gray-200" />
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company name"
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Input
                    label="Tax ID"
                    value={form.taxId}
                    onChange={(e) => updateField('taxId', e.target.value)}
                    disabled={loading}
                  />
                  <Input
                    label="Website"
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    disabled={loading}
                  />
                  <div className="md:col-span-2">
                    <label htmlFor="host-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      id="host-address"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      rows={3}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                  Become a host
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
      </main>

      <Footer />
    </div>
  );
}
