'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';
import { Card, Spinner, Badge, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import type { HostProfile } from '@/types';

export default function HostSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);
    const res = await apiCall<HostProfile>('GET', '/hosts/profile');
    if (res.success && res.data) {
      setProfile(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => globalThis.clearTimeout(timer);
  }, []);

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

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Verifizierungsstatus</h2>
              <p className="text-sm text-gray-500 mt-1">Business-Änderungen werden vom Admin-Team freigegeben.</p>
            </div>
            <Badge variant={
              profile?.verification_status === 'approved' ? 'success' :
              profile?.verification_status === 'rejected' ? 'error' : 'warning'
            }>
              {profile?.verification_status}
            </Badge>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Persönliche Kontaktdaten, E-Mail und Passwort verwalten Sie unter dem regulären Konto.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Geschäftsprofil</h2>
              <p className="text-sm text-gray-500">Diese Angaben sind schreibgeschützt. Änderungen erfordern eine Admin-Freigabe.</p>
            </div>
            <Link href="/account/profile">
              <Button variant="secondary">Kontodaten ändern</Button>
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Firmenname</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.company_name || '–'}</p>
            </div>
            <div>
              <p className="text-gray-500">Steuernummer</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.tax_id || '–'}</p>
            </div>
            <div>
              <p className="text-gray-500">Adresse</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.address || '–'}</p>
            </div>
            <div>
              <p className="text-gray-500">Website</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.website || '–'}</p>
            </div>
            <div>
              <p className="text-gray-500">Kontaktperson</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.contact_person || '–'}</p>
            </div>
            <div>
              <p className="text-gray-500">Telefon</p>
              <p className="text-gray-900 font-medium mt-0.5">{profile?.company_phone || '–'}</p>
            </div>
          </div>
        </Card>

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
            <div>
              <p className="text-gray-500">E-Mail / Passwort</p>
              <p className="text-gray-900 font-medium mt-0.5">Im Konto-Bereich bearbeiten</p>
            </div>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}
