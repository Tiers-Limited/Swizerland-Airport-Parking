'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import Link from 'next/link';

interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  verification_status: string;
  documents_verified: boolean;
}

interface Shift {
  id: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'active' | 'closed';
}

const verificationVariant = (status: string) => {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'error' as const;
  return 'warning' as const;
};

const verificationLabel = (status: string) => {
  if (status === 'approved') return 'Verifiziert';
  if (status === 'rejected') return 'Abgelehnt';
  return 'Ausstehend';
};

export default function DriverDashboardPage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [profileRes, shiftsRes] = await Promise.all([
        apiCall<DriverProfile>('GET', '/drivers/me'),
        apiCall<Shift[]>('GET', '/drivers/shifts'),
      ]);
      if (profileRes.success && profileRes.data) setProfile(profileRes.data);
      if (shiftsRes.success && shiftsRes.data) setShifts(shiftsRes.data);
      setLoading(false);
    }
    loadData();
  }, [refreshKey]);

  const handleStartShift = async (shiftId: string) => {
    await apiCall('PATCH', `/drivers/shifts/${shiftId}/start`, {});
    setRefreshKey(k => k + 1);
  };

  const handleEndShift = async (shiftId: string) => {
    await apiCall('PATCH', `/drivers/shifts/${shiftId}/end`, {});
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  const activeShift = shifts.find(s => s.status === 'active');
  const upcomingShifts = shifts.filter(s => s.status === 'planned');

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Fahrer-Übersicht</h1>

        {/* Profile Status */}
        {profile && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Führerschein</p>
                <p className="font-medium text-gray-900">{profile.license_number}</p>
                <p className="text-xs text-gray-400">
                  Gültig bis: {new Date(profile.license_expiry).toLocaleDateString('de-CH')}
                </p>
              </div>
              <Badge variant={verificationVariant(profile.verification_status)}>
                {verificationLabel(profile.verification_status)}
              </Badge>
            </div>
          </Card>
        )}

        {/* Active Shift */}
        {activeShift ? (
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Aktive Schicht</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {new Date(activeShift.start_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(activeShift.end_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/driver/shifts/${activeShift.id}`}>
                  <Button size="sm">Schicht anzeigen</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => handleEndShift(activeShift.id)}>
                  Schicht beenden
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-400">Keine aktive Schicht</p>
          </Card>
        )}

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Nächste Schichten</h2>
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <Card key={shift.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(shift.start_time).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(shift.start_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(shift.end_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleStartShift(shift.id)}>
                      Starten
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
