'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import Link from 'next/link';

interface DashboardData {
  planned: number;
  boarding: number;
  en_route: number;
  completed: number;
  activeVehicles: number;
  bookingsNeedingShuttle: number;
}

interface UnassignedBooking {
  id: string;
  booking_code: string;
  customer_name: string;
  passenger_count: number;
  luggage_count: number;
  outbound_flight: string;
  return_flight: string;
  start_date: string;
  end_date: string;
}

interface Trip {
  id: string;
  shift_id: string;
  direction: string;
  scheduled_departure: string;
  status: string;
  capacity: number;
  passenger_count: number;
}

export default function DispatchDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [unassigned, setUnassigned] = useState<UnassignedBooking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [dashRes, unassignedRes, tripsRes] = await Promise.all([
        apiCall<DashboardData>('GET', '/dispatch/dashboard'),
        apiCall<UnassignedBooking[]>('GET', `/dispatch/unassigned?date=${selectedDate}&direction=to_airport`),
        apiCall<Trip[]>('GET', `/dispatch/trips?date=${selectedDate}`),
      ]);
      if (dashRes.success && dashRes.data) setDashboard(dashRes.data);
      if (unassignedRes.success && unassignedRes.data) setUnassigned(unassignedRes.data);
      if (tripsRes.success && tripsRes.data) setTrips(tripsRes.data);
      setLoading(false);
    };
    loadData();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Geplante Fahrten', value: dashboard?.planned ?? 0, color: 'bg-blue-50 text-blue-600' },
    { label: 'Boarding', value: dashboard?.boarding ?? 0, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Unterwegs', value: dashboard?.en_route ?? 0, color: 'bg-green-50 text-green-600' },
    { label: 'Abgeschlossen', value: dashboard?.completed ?? 0, color: 'bg-gray-50 text-gray-600' },
    { label: 'Aktive Fahrzeuge', value: dashboard?.activeVehicles ?? 0, color: 'bg-purple-50 text-purple-600' },
    { label: 'Ohne Shuttle', value: dashboard?.bookingsNeedingShuttle ?? 0, color: 'bg-red-50 text-red-600' },
  ];

  const tripStatusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'> = {
    planned: 'info',
    boarding: 'warning',
    en_route: 'primary',
    completed: 'success',
    cancelled: 'error',
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dispatcher Dashboard</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Bookings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nicht zugewiesene Buchungen</h2>
              <Link href="/dispatch/assignments">
                <Button size="sm" variant="ghost">Alle anzeigen</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {unassigned.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Alle Buchungen zugewiesen</p>
              ) : (
                unassigned.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {b.booking_code} &middot; {b.passenger_count} Pax &middot; {b.luggage_count} Gepäck
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{b.outbound_flight || b.return_flight}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Today Trips */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Heutige Fahrten</h2>
              <Link href="/dispatch/trips">
                <Button size="sm" variant="ghost">Alle Fahrten</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {trips.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Keine Fahrten für heute</p>
              ) : (
                trips.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t.direction === 'to_airport' ? '→ Flughafen' : '← Parkplatz'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.scheduled_departure).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        {' '}&middot; {t.passenger_count}/{t.capacity} Pax
                      </p>
                    </div>
                    <Badge variant={tripStatusColors[t.status] || 'gray'}>
                      {t.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
