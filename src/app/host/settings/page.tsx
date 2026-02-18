'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Alert, Spinner, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import type { HostProfile } from '@/types';

export default function HostSettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    taxId: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const res = await apiCall<HostProfile>('GET', '/hosts/profile');
    if (res.success && res.data) {
      setProfile(res.data);
      setForm({
        companyName: res.data.company_name || '',
        taxId: res.data.tax_id || '',
        address: res.data.address || '',
        website: res.data.website || '',
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await apiCall('PATCH', '/hosts/profile', form);
    if (res.success) {
      setSuccess(t('host.profileSaved'));
    } else {
      setError(res.error?.message || t('common.error'));
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('host.settings')}</h1>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Verification status */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{t('host.verificationStatus')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('host.verificationDesc')}</p>
            </div>
            <Badge variant={
              profile?.verification_status === 'approved' ? 'success' :
              profile?.verification_status === 'rejected' ? 'error' : 'warning'
            }>
              {profile?.verification_status}
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">{t('host.commissionRate')}:</span>
              <span className="font-medium text-gray-900 ml-1">{profile?.commission_rate}%</span>
            </div>
            <div>
              <span className="text-gray-500">{t('host.hostType')}:</span>
              <span className="font-medium text-gray-900 ml-1 capitalize">{profile?.host_type}</span>
            </div>
          </div>
        </Card>

        {/* Profile form */}
        <form onSubmit={handleSave}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.businessDetails')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('host.companyName')}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
              <Input
                label={t('host.taxId')}
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
              <Input
                label={t('host.address')}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <Input
                label={t('host.website')}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" loading={saving}>{t('common.save')}</Button>
            </div>
          </Card>
        </form>

        {/* Account info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('host.accountInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t('common.name')}</p>
              <p className="text-gray-900 font-medium mt-0.5">{user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">{t('common.email')}</p>
              <p className="text-gray-900 font-medium mt-0.5">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">{t('host.memberSince')}</p>
              <p className="text-gray-900 font-medium mt-0.5">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-CH') : '–'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}
