'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import Link from 'next/link';

interface Shift {
  id: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'active' | 'closed';
  vehicle_plate?: string;
}

export default function DriverShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadShifts() {
      const res = await apiCall<Shift[]>('GET', '/drivers/shifts');
      if (res.success && res.data) setShifts(res.data);
      setLoading(false);
    }
    loadShifts();
  }, [refreshKey]);

  const handleStart = async (id: string) => {
    await apiCall('PATCH', `/drivers/shifts/${id}/start`, {});
    setRefreshKey(k => k + 1);
  };

  const handleEnd = async (id: string) => {
    await apiCall('PATCH', `/drivers/shifts/${id}/end`, {});
    setRefreshKey(k => k + 1);
  };

  const statusColors: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
    planned: 'info',
    active: 'success',
    closed: 'gray',
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Meine Schichten</h1>

        {shifts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400">Keine Schichten zugewiesen</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(shift.start_time).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(shift.start_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(shift.end_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                      {shift.vehicle_plate && ` · Fahrzeug: ${shift.vehicle_plate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[shift.status] || 'gray'}>{shift.status}</Badge>
                    {shift.status === 'active' && (
                      <>
                        <Link href={`/driver/shifts/${shift.id}`}>
                          <Button size="sm">Fahrten</Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => handleEnd(shift.id)}>
                          Beenden
                        </Button>
                      </>
                    )}
                    {shift.status === 'planned' && (
                      <Button size="sm" onClick={() => handleStart(shift.id)}>
                        Starten
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
