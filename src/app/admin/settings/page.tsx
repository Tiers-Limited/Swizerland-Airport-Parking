'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface PlatformSettings {
  commission_rate: string | number;
  service_fee_rate: string | number;
  min_booking_hours: number;
  max_booking_days: number;
  cancellation_window_hours: number;
  support_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  terms_version: string;
  privacy_version: string;
}

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await apiCall<PlatformSettings>('GET', '/admin/settings');
    if (res.success && res.data) {
      setSettings(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError('');
    setMessage('');

    const res = await apiCall('PATCH', '/admin/settings', {
      commission_rate: Number(settings.commission_rate),
      service_fee_rate: Number(settings.service_fee_rate),
      min_booking_hours: Number(settings.min_booking_hours),
      max_booking_days: Number(settings.max_booking_days),
      cancellation_window_hours: Number(settings.cancellation_window_hours),
      support_email: settings.support_email,
      support_phone: settings.support_phone,
      maintenance_mode: settings.maintenance_mode,
      terms_version: settings.terms_version,
      privacy_version: settings.privacy_version,
    });

    if (res.success) {
      setMessage(t('admin.settingsSaved'));
    } else {
      setError(res.error?.toString() || t('common.error'));
    }
    setSaving(false);
  }

  function updateField(field: keyof PlatformSettings, value: string | number | boolean) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!settings) {
    return <Alert variant="error">{t('common.error')}</Alert>;
  }

  return (
    <FadeIn>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.platformSettings')}</h1>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

        {/* Commission & Fees */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.commissionFees')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.commissionRate')} (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={String(settings.commission_rate)}
                onChange={(e) => updateField('commission_rate', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{t('admin.commissionRateHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.serviceFeeRate')} (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={String(settings.service_fee_rate)}
                onChange={(e) => updateField('service_fee_rate', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{t('admin.serviceFeeRateHint')}</p>
            </div>
          </div>
        </Card>

        {/* Booking Rules */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.bookingRules')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.minBookingHours')}
              </label>
              <Input
                type="number"
                min="1"
                value={String(settings.min_booking_hours)}
                onChange={(e) => updateField('min_booking_hours', Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.maxBookingDays')}
              </label>
              <Input
                type="number"
                min="1"
                value={String(settings.max_booking_days)}
                onChange={(e) => updateField('max_booking_days', Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.cancellationWindow')}
              </label>
              <Input
                type="number"
                min="0"
                value={String(settings.cancellation_window_hours)}
                onChange={(e) => updateField('cancellation_window_hours', Number.parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-400 mt-1">{t('admin.cancellationWindowHint')}</p>
            </div>
          </div>
        </Card>

        {/* Support / Contact */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.supportContact')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.supportEmail')}
              </label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => updateField('support_email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.supportPhone')}
              </label>
              <Input
                type="tel"
                value={settings.support_phone || ''}
                onChange={(e) => updateField('support_phone', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Versions & Maintenance */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.systemSettings')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.termsVersion')}
              </label>
              <Input
                value={settings.terms_version}
                onChange={(e) => updateField('terms_version', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.privacyVersion')}
              </label>
              <Input
                value={settings.privacy_version}
                onChange={(e) => updateField('privacy_version', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => updateField('maintenance_mode', !settings.maintenance_mode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <div>
              <p className="font-medium text-gray-900">{t('admin.maintenanceMode')}</p>
              <p className="text-xs text-gray-500">{t('admin.maintenanceModeHint')}</p>
            </div>
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}
