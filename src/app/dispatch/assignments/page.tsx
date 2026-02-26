'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';

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
  direction: string;
  scheduled_departure: string;
  capacity: number;
  passenger_count: number;
  status: string;
}

export default function DispatchAssignmentsPage() {
  const [unassigned, setUnassigned] = useState<UnassignedBooking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [direction, setDirection] = useState<'to_airport' | 'from_airport'>('to_airport');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [unRes, tripRes] = await Promise.all([
        apiCall<UnassignedBooking[]>('GET', `/dispatch/unassigned?date=${selectedDate}&direction=${direction}`),
        apiCall<Trip[]>('GET', `/dispatch/trips?date=${selectedDate}&direction=${direction}&status=planned,boarding`),
      ]);
      if (unRes.success && unRes.data) setUnassigned(unRes.data);
      if (tripRes.success && tripRes.data) setTrips(tripRes.data);
      setLoading(false);
    }
    loadData();
  }, [selectedDate, direction, refreshKey]);

  const assignBooking = async (bookingId: string, tripId: string) => {
    setAssigning(bookingId);
    const res = await apiCall('POST', '/dispatch/assignments', {
      booking_id: bookingId,
      trip_id: tripId,
    });
    if (res.success) {
      setRefreshKey((k) => k + 1);
    }
    setAssigning(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Zuweisungen</h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'to_airport' | 'from_airport')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="to_airport">Zum Flughafen</option>
              <option value="from_airport">Zum Parkplatz</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned bookings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nicht zugewiesen ({unassigned.length})
            </h2>
            <div className="space-y-3">
              {unassigned.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-400">Alle Buchungen sind zugewiesen</p>
                </Card>
              ) : (
                unassigned.map((b) => (
                  <Card key={b.id} className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{b.customer_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{b.booking_code}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {b.passenger_count} Pax &middot; {b.luggage_count} Gepäck
                        {b.outbound_flight && ` &middot; Flug: ${b.outbound_flight}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trips.filter(t => t.passenger_count < t.capacity).map((trip) => (
                        <Button
                          key={trip.id}
                          size="sm"
                          variant="ghost"
                          loading={assigning === b.id}
                          onClick={() => assignBooking(b.id, trip.id)}
                        >
                          →{' '}
                          {new Date(trip.scheduled_departure).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                          {' '}({trip.passenger_count}/{trip.capacity})
                        </Button>
                      ))}
                      {trips.filter(t => t.passenger_count < t.capacity).length === 0 && (
                        <p className="text-xs text-red-500">Keine verfügbare Fahrt</p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Available trips */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verfügbare Fahrten ({trips.length})
            </h2>
            <div className="space-y-3">
              {trips.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-400">Keine Fahrten verfügbar</p>
                </Card>
              ) : (
                trips.map((trip) => (
                  <Card key={trip.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(trip.scheduled_departure).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {trip.passenger_count}/{trip.capacity} Passagiere
                        </p>
                      </div>
                      <Badge variant={trip.passenger_count >= trip.capacity ? 'error' : 'success'}>
                        {trip.passenger_count >= trip.capacity ? 'Voll' : 'Frei'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
