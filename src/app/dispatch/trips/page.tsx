'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Trip {
  id: string;
  shift_id: string;
  direction: 'to_airport' | 'from_airport';
  scheduled_departure: string;
  status: string;
  capacity: number;
  passenger_count: number;
  actual_departure?: string;
  actual_arrival?: string;
  passengers?: Passenger[];
}

interface Passenger {
  booking_id: string;
  customer_name: string;
  passenger_count: number;
  luggage_count: number;
  status: string;
}

export default function DispatchTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ shift_id: '', direction: 'to_airport', scheduled_departure: '' });
  const [saving, setSaving] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadTrips() {
      setLoading(true);
      const res = await apiCall<Trip[]>('GET', `/dispatch/trips?date=${selectedDate}`);
      if (res.success && res.data) setTrips(res.data);
      setLoading(false);
    }
    loadTrips();
  }, [selectedDate, refreshKey]);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCall('POST', '/dispatch/trips', form);
    if (res.success) {
      setShowCreate(false);
      setForm({ shift_id: '', direction: 'to_airport', scheduled_departure: '' });
      setRefreshKey((k) => k + 1);
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await apiCall('PATCH', `/dispatch/trips/${id}/status`, { status });
    setRefreshKey((k) => k + 1);
  };

  const loadTripDetail = async (id: string) => {
    const res = await apiCall<Trip>('GET', `/dispatch/trips/${id}`);
    if (res.success && res.data) setSelectedTrip(res.data);
  };

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'> = {
    planned: 'info',
    boarding: 'warning',
    en_route: 'primary',
    completed: 'success',
    cancelled: 'error',
  };

  const passengerStatusVariant = (status: string): 'success' | 'error' | 'gray' => {
    if (status === 'boarded') return 'success';
    if (status === 'no_show') return 'error';
    return 'gray';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fahrten</h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Button onClick={() => setShowCreate(true)}>Neue Fahrt</Button>
          </div>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Keine Fahrten für dieses Datum</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      trip.direction === 'to_airport' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {trip.direction === 'to_airport' ? '✈️' : '🅿️'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {trip.direction === 'to_airport' ? 'Zum Flughafen' : 'Zum Parkplatz'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(trip.scheduled_departure).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        {' '}&middot; {trip.passenger_count}/{trip.capacity} Passagiere
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[trip.status] || 'gray'}>
                      {trip.status.replaceAll('_', ' ')}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => loadTripDetail(trip.id)}>
                      Details
                    </Button>
                    {trip.status === 'planned' && (
                      <Button size="sm" onClick={() => handleStatusChange(trip.id, 'boarding')}>
                        Boarding
                      </Button>
                    )}
                    {trip.status === 'boarding' && (
                      <Button size="sm" onClick={() => handleStatusChange(trip.id, 'en_route')}>
                        Losfahren
                      </Button>
                    )}
                    {trip.status === 'en_route' && (
                      <Button size="sm" onClick={() => handleStatusChange(trip.id, 'completed')}>
                        Fertig
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Trip Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Neue Fahrt erstellen">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="shift_id" className="block text-sm font-medium text-gray-700 mb-1">Schicht ID</label>
              <input
                id="shift_id"
                type="text"
                value={form.shift_id}
                onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Richtung</label>
              <select
                id="direction"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="to_airport">Zum Flughafen</option>
                <option value="from_airport">Zum Parkplatz</option>
              </select>
            </div>
            <div>
              <label htmlFor="scheduled_departure" className="block text-sm font-medium text-gray-700 mb-1">Geplante Abfahrt</label>
              <input
                id="scheduled_departure"
                type="datetime-local"
                value={form.scheduled_departure}
                onChange={(e) => setForm({ ...form, scheduled_departure: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button type="submit" loading={saving}>Erstellen</Button>
            </div>
          </form>
        </Modal>

        {/* Trip Detail Modal */}
        <Modal isOpen={!!selectedTrip} onClose={() => setSelectedTrip(null)} title="Fahrtdetails">
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Richtung</p>
                  <p className="font-medium">{selectedTrip.direction === 'to_airport' ? 'Zum Flughafen' : 'Zum Parkplatz'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge variant={statusColors[selectedTrip.status] || 'gray'}>{selectedTrip.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Gep. Abfahrt</p>
                  <p className="font-medium">{new Date(selectedTrip.scheduled_departure).toLocaleString('de-CH')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Passagiere</p>
                  <p className="font-medium">{selectedTrip.passenger_count}/{selectedTrip.capacity}</p>
                </div>
              </div>
              {selectedTrip.passengers && selectedTrip.passengers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Passagierliste</p>
                  <div className="space-y-2">
                    {selectedTrip.passengers.map((p) => (
                      <div key={p.booking_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{p.customer_name}</p>
                          <p className="text-xs text-gray-500">{p.passenger_count} Pax, {p.luggage_count} Gepäck</p>
                        </div>
                        <Badge variant={passengerStatusVariant(p.status)}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </FadeIn>
  );
}
