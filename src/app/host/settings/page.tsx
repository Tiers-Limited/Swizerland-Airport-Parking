'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Alert, Spinner, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import type { HostProfile } from '@/types';

export default function HostSettingsPage() {
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

  // Password change state
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await apiCall('PATCH', '/hosts/profile', form);
    if (res.success) {
      setSuccess('Profil erfolgreich gespeichert');
    } else {
      setError(res.error?.message || 'Fehler');
    }
    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setPwSaving(true);
    try {
      const res = await apiCall('POST', '/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (res.success) {
        setPwSuccess('Passwort erfolgreich geändert.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwError(res.error?.message || 'Passwort konnte nicht geändert werden.');
      }
    } catch {
      setPwError('Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setPwSaving(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Verification status */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Verifizierungsstatus</h2>
              <p className="text-sm text-gray-500 mt-1">Ihr Account wird von unserem Team geprüft.</p>
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
              <span className="text-gray-500">Provisionsrate:</span>
              <span className="font-medium text-gray-900 ml-1">{profile?.commission_rate}%</span>
            </div>
          </div>
        </Card>

        {/* Profile form */}
        <form onSubmit={handleSave}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Geschäftsdetails</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Firmenname"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
              <Input
                label="Steuernummer"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
              <Input
                label="Adresse"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <Input
                label="Website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" loading={saving}>Speichern</Button>
            </div>
          </Card>
        </form>

        {/* Account info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontoinformationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="text-gray-900 font-medium mt-0.5">{user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">E-Mail</p>
              <p className="text-gray-900 font-medium mt-0.5">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Mitglied seit</p>
              <p className="text-gray-900 font-medium mt-0.5">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-CH') : '–'}
              </p>
            </div>
          </div>
        </Card>

        {/* Password change */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Passwort ändern</h2>
          {pwError && <Alert variant="error" className="mb-4">{pwError}</Alert>}
          {pwSuccess && <Alert variant="success" className="mb-4">{pwSuccess}</Alert>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Aktuelles Passwort"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Neues Passwort"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
              />
              <Input
                label="Neues Passwort bestätigen"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
              />
            </div>
            <p className="text-xs text-gray-500">Mindestens 8 Zeichen.</p>
            <div className="flex justify-end">
              <Button type="submit" loading={pwSaving}>Passwort ändern</Button>
            </div>
          </form>
        </Card>
      </div>
    </FadeIn>
  );
}
