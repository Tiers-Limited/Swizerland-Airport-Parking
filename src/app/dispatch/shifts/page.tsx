'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Shift {
  id: string;
  vehicle_id: string;
  driver_user_id: string;
  driver_name?: string;
  vehicle_plate?: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'active' | 'closed';
}

export default function DispatchShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', driver_user_id: '', start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadShifts() {
      setLoading(true);
      const res = await apiCall<Shift[]>('GET', `/dispatch/shifts?date=${selectedDate}`);
      if (res.success && res.data) setShifts(res.data);
      setLoading(false);
    }
    loadShifts();
  }, [selectedDate, refreshKey]);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCall('POST', '/dispatch/shifts', form);
    if (res.success) {
      setShowCreate(false);
      setForm({ vehicle_id: '', driver_user_id: '', start_time: '', end_time: '' });
      setRefreshKey((k) => k + 1);
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await apiCall('PATCH', `/dispatch/shifts/${id}/status`, { status });
    setRefreshKey((k) => k + 1);
  };

  const statusColors: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
    planned: 'info',
    active: 'success',
    closed: 'gray',
  };

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Schichten</h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Button onClick={() => setShowCreate(true)}>Neue Schicht</Button>
          </div>
        </div>

        {shifts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Keine Schichten für dieses Datum</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(shift.start_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(shift.end_time).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Fahrzeug: {shift.vehicle_plate || shift.vehicle_id.slice(0, 8)}
                        {' '}&middot; Fahrer: {shift.driver_name || shift.driver_user_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[shift.status] || 'gray'}>{shift.status}</Badge>
                    {shift.status === 'planned' && (
                      <Button size="sm" onClick={() => handleStatusChange(shift.id, 'active')}>
                        Aktivieren
                      </Button>
                    )}
                    {shift.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(shift.id, 'closed')}>
                        Schliessen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Shift Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Neue Schicht erstellen">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">Fahrzeug ID</label>
              <input
                id="vehicle_id"
                type="text"
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="driver_user_id" className="block text-sm font-medium text-gray-700 mb-1">Fahrer ID</label>
              <input
                id="driver_user_id"
                type="text"
                value={form.driver_user_id}
                onChange={(e) => setForm({ ...form, driver_user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
                <input
                  id="start_time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">Endzeit</label>
                <input
                  id="end_time"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button type="submit" loading={saving}>Erstellen</Button>
            </div>
          </form>
        </Modal>
      </div>
    </FadeIn>
  );
}
