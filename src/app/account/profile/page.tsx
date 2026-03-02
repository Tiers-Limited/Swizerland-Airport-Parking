'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert } from '@/components/ui';
import { apiCall } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiCall('PATCH', `/users/${user?.id}`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      if (res.success) {
        setSuccess('Profil erfolgreich aktualisiert.');
      } else {
        setError(res.error?.message || 'Profil konnte nicht aktualisiert werden.');
      }
    } catch {
      setError('Profil konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiCall('POST', '/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (res.success) {
        setSuccess('Passwort erfolgreich geändert.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(res.error?.message || 'Passwort konnte nicht geändert werden.');
      }
    } catch {
      setError('Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profileinstellungen</h1>
        <p className="text-gray-500">Verwalten Sie Ihre Kontodaten und Sicherheitseinstellungen.</p>
      </div>

      {success && <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Vollständiger Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
            <Input
              label="E-Mail-Adresse"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
              helperText="Eine Änderung Ihrer E-Mail-Adresse erfordert eine erneute Verifizierung."
            />
            <Input
              label="Telefonnummer"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+41 79 123 45 67"
              helperText="Wird für Buchungsbestätigungen verwendet."
            />
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Änderungen speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                helperText="Mindestens 8 Zeichen."
              />
              <Input
                label="Neues Passwort bestätigen"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Passwort ändern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungseinstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center gap-3" aria-label="Buchungsbestätigungen">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Buchungsbestätigungen</p>
                <p className="text-sm text-gray-500">E-Mail-Bestätigungen für Ihre Buchungen erhalten.</p>
              </div>
            </label>
            <label className="flex items-center gap-3" aria-label="Buchungs-Updates">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Buchungs-Updates</p>
                <p className="text-sm text-gray-500">Echtzeit-Benachrichtigungen über Ihren Buchungsstatus erhalten.</p>
              </div>
            </label>
            <label className="flex items-center gap-3" aria-label="Werbe-E-Mails">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Werbe-E-Mails</p>
                <p className="text-sm text-gray-500">Sonderangebote und Rabatte erhalten.</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-error-200">
        <CardHeader>
          <CardTitle className="text-error-600">Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Konto löschen</p>
              <p className="text-sm text-gray-500">
                Ihr Konto und alle zugehörigen Daten dauerhaft löschen.
              </p>
            </div>
            <Button variant="danger">Konto löschen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
