'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { FadeIn } from '@/components/animations';
import type { HostRegisterData } from '@/types';

export default function HostOnboardingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<HostRegisterData & { address: string; website: string }>({
    hostType: 'operator',
    companyName: '',
    taxId: '',
    address: '',
    website: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: HostRegisterData = {
      hostType: form.hostType,
      companyName: form.hostType === 'operator' ? form.companyName : undefined,
      taxId: form.taxId || undefined,
      address: form.address || undefined,
      website: form.website || undefined,
    };

    const res = await apiCall('POST', '/hosts/register', payload);
    if (res.success) {
      router.push('/host');
    } else {
      setError(res.error?.message || t('common.error'));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <FadeIn>
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-baby-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-baby-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('host.becomeHost')}</h1>
              <p className="text-gray-500 mt-2">{t('host.onboardingSubtitle')}</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-12 rounded-full transition-colors ${
                    s <= step ? 'bg-baby-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <Card className="p-6">
              {error && <Alert variant="error" className="mb-4">{error}</Alert>}

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('host.accountType')}</h2>

                    {/* Host type selection */}
                    <div className="grid grid-cols-2 gap-3">
                      {(['operator', 'private'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateField('hostType', type)}
                          className={`p-4 rounded-xl border-2 text-left transition-colors ${
                            form.hostType === type
                              ? 'border-baby-blue-500 bg-baby-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`text-2xl mb-2 ${form.hostType === type ? 'text-baby-blue-600' : 'text-gray-400'}`}>
                            {type === 'operator' ? '🏢' : '👤'}
                          </div>
                          <p className={`text-sm font-medium ${form.hostType === type ? 'text-baby-blue-700' : 'text-gray-700'}`}>
                            {t(`host.type.${type}`)}
                          </p>
                        </button>
                      ))}
                    </div>

                    {form.hostType === 'operator' && (
                      <Input
                        label={t('host.companyName')}
                        value={form.companyName || ''}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="Parking AG"
                        required
                      />
                    )}

                    <div className="pt-2">
                      <Button type="button" className="w-full" onClick={() => setStep(2)}>
                        {t('common.continue')}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('host.businessDetails')}</h2>

                    <Input
                      label={t('host.taxId')}
                      value={form.taxId || ''}
                      onChange={(e) => updateField('taxId', e.target.value)}
                      placeholder="CHE-123.456.789"
                    />
                    <Input
                      label={t('host.address')}
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Musterstrasse 1, 8000 Zürich"
                    />
                    <Input
                      label={t('host.website')}
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.example.ch"
                    />

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                        {t('common.back')}
                      </Button>
                      <Button type="submit" className="flex-1" loading={loading}>
                        {t('host.completeRegistration')}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Card>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">💰</div>
                <p className="text-xs text-gray-500">{t('host.benefit1')}</p>
              </div>
              <div>
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xs text-gray-500">{t('host.benefit2')}</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🛡️</div>
                <p className="text-xs text-gray-500">{t('host.benefit3')}</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
