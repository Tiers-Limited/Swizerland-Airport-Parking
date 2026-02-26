'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Trip {
  id: string;
  direction: 'to_airport' | 'from_airport';
  scheduled_departure: string;
  status: string;
  capacity: number;
  passenger_count: number;
  passengers?: Passenger[];
}

interface Passenger {
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  passenger_count: number;
  luggage_count: number;
  status: string;
}

export default function DriverShiftDetailPage() {
  const params = useParams();
  const shiftId = Array.isArray(params.shiftId) ? params.shiftId[0] : params.shiftId;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadTrips() {
      if (!shiftId) return;
      const res = await apiCall<Trip[]>('GET', `/drivers/shifts/${shiftId}/trips`);
      if (res.success && res.data) setTrips(res.data);
      setLoading(false);
    }
    loadTrips();
  }, [shiftId, refreshKey]);

  const updateTripStatus = async (tripId: string, status: string) => {
    await apiCall('PATCH', `/drivers/trips/${tripId}/status`, { status });
    setRefreshKey(k => k + 1);
  };

  const updatePassengerStatus = async (tripId: string, bookingId: string, status: string) => {
    await apiCall('PATCH', `/drivers/trips/${tripId}/passengers/${bookingId}/status`, { status });
    setRefreshKey(k => k + 1);
  };

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'> = {
    planned: 'info',
    boarding: 'warning',
    en_route: 'primary',
    completed: 'success',
    cancelled: 'error',
    assigned: 'gray',
    boarded: 'success',
    no_show: 'error',
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Schicht-Fahrten</h1>

        {trips.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400">Keine Fahrten in dieser Schicht</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                {/* Trip header */}
                <div className="p-5 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      trip.direction === 'to_airport' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {trip.direction === 'to_airport' ? '✈️' : '🅿️'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {trip.direction === 'to_airport' ? 'Zum Flughafen' : 'Zum Parkplatz'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(trip.scheduled_departure).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{trip.passenger_count}/{trip.capacity} Pax
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[trip.status] || 'gray'}>
                      {trip.status.replaceAll('_', ' ')}
                    </Badge>
                    {trip.status === 'planned' && (
                      <Button size="sm" onClick={() => updateTripStatus(trip.id, 'boarding')}>Boarding</Button>
                    )}
                    {trip.status === 'boarding' && (
                      <Button size="sm" onClick={() => updateTripStatus(trip.id, 'en_route')}>Losfahren</Button>
                    )}
                    {trip.status === 'en_route' && (
                      <Button size="sm" onClick={() => updateTripStatus(trip.id, 'completed')}>Angekommen</Button>
                    )}
                  </div>
                </div>

                {/* Passenger list */}
                {trip.passengers && trip.passengers.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {trip.passengers.map((p) => (
                      <div key={p.booking_id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{p.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            📞 {p.customer_phone} · {p.passenger_count} Pax · {p.luggage_count} Gepäck
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[p.status] || 'gray'}>{p.status}</Badge>
                          {p.status === 'assigned' && trip.status === 'boarding' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updatePassengerStatus(trip.id, p.booking_id, 'boarded')}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updatePassengerStatus(trip.id, p.booking_id, 'no_show')}
                              >
                                ✗
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
