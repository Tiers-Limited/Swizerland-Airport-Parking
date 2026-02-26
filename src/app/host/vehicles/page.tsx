'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Modal, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Vehicle {
  id: string;
  location_id: string;
  plate: string;
  capacity_passengers: number;
  capacity_luggage: number;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  active: boolean;
  listing_name?: string;
}

interface Listing {
  id: string;
  name: string;
}

export default function HostVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    plate: '',
    capacityPassengers: '8',
    capacityLuggage: '8',
    vehicleType: '',
    make: '',
    model: '',
    year: '',
    listingId: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [vehiclesRes, listingsRes] = await Promise.all([
      apiCall<Vehicle[]>('GET', '/listings/my/vehicles'),
      apiCall<{ listings: Listing[] }>('GET', '/listings/my'),
    ]);

    if (vehiclesRes.success && vehiclesRes.data) {
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
    }
    if (listingsRes.success && listingsRes.data) {
      const l = listingsRes.data.listings || (listingsRes.data as unknown as Listing[]);
      setListings(Array.isArray(l) ? l : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditingVehicle(null);
    setForm({ plate: '', capacityPassengers: '8', capacityLuggage: '8', vehicleType: '', make: '', model: '', year: '', listingId: listings[0]?.id || '' });
    setError('');
    setIsModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditingVehicle(v);
    setForm({
      plate: v.plate,
      capacityPassengers: String(v.capacity_passengers),
      capacityLuggage: String(v.capacity_luggage),
      vehicleType: v.vehicle_type || '',
      make: v.make || '',
      model: v.model || '',
      year: v.year ? String(v.year) : '',
      listingId: v.location_id,
    });
    setError('');
    setIsModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      plate: form.plate,
      capacityPassengers: Number.parseInt(form.capacityPassengers),
      capacityLuggage: Number.parseInt(form.capacityLuggage),
    };
    if (form.vehicleType) payload.vehicleType = form.vehicleType;
    if (form.make) payload.make = form.make;
    if (form.model) payload.model = form.model;
    if (form.year) payload.year = Number.parseInt(form.year);

    if (editingVehicle) {
      const res = await apiCall('PATCH', `/listings/vehicles/${editingVehicle.id}`, payload);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setError(res.error?.message || 'Fehler');
      }
    } else {
      const res = await apiCall('POST', `/listings/${form.listingId}/vehicles`, payload);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setError(res.error?.message || 'Fehler');
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie dieses Fahrzeug löschen möchten?')) return;
    const res = await apiCall('DELETE', `/listings/vehicles/${id}`);
    if (res.success) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    }
  }

  async function toggleActive(v: Vehicle) {
    const res = await apiCall('PATCH', `/listings/vehicles/${v.id}`, { active: !v.active });
    if (res.success) {
      setVehicles((prev) => prev.map((veh) => veh.id === v.id ? { ...veh, active: !veh.active } : veh));
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fahrzeuge</h1>
          <Button size="sm" onClick={openCreate} disabled={listings.length === 0}>
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Fahrzeug hinzufügen
          </Button>
        </div>

        {listings.length === 0 && (
          <Alert variant="warning">Erstellen Sie zuerst einen Parkplatz, bevor Sie Fahrzeuge hinzufügen.</Alert>
        )}

        {vehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="h-16 w-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 17h.01M12 17h.01M16 17h.01M3 9l2.5-5h13L21 9M3 9h18M3 9v8a1 1 0 001 1h1m0 0a2 2 0 104 0m-4 0h4m6 0a2 2 0 104 0m-4 0h4a1 1 0 001-1V9" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Fahrzeuge</h3>
            <p className="text-gray-500 mb-6">Fügen Sie Shuttle-Fahrzeuge hinzu, um den Shuttleservice zu verwalten.</p>
            {listings.length > 0 && (
              <Button onClick={openCreate}>Erstes Fahrzeug hinzufügen</Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-baby-blue-50 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M12 17h.01M16 17h.01M3 9l2.5-5h13L21 9M3 9h18M3 9v8a1 1 0 001 1h1m0 0a2 2 0 104 0m-4 0h4m6 0a2 2 0 104 0m-4 0h4a1 1 0 001-1V9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || vehicle.plate}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">{vehicle.plate}</p>
                    </div>
                  </div>
                  <Badge variant={vehicle.active ? 'success' : 'gray'}>
                    {vehicle.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {vehicle.capacity_passengers} Passagiere
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {vehicle.capacity_luggage} Gepäck
                  </span>
                  {vehicle.vehicle_type && (
                    <span className="text-xs truncate">{vehicle.vehicle_type}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(vehicle)} className="flex-1">
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(vehicle)}
                    className={vehicle.active ? 'text-warning-600' : 'text-success-600'}
                  >
                    {vehicle.active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                    className="text-error-600 hover:bg-error-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label="Kennzeichen"
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
            placeholder="ZH 123456"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Passagierkapazität"
              type="number"
              value={form.capacityPassengers}
              onChange={(e) => setForm({ ...form, capacityPassengers: e.target.value })}
              required
            />
            <Input
              label="Gepäckkapazität"
              type="number"
              value={form.capacityLuggage}
              onChange={(e) => setForm({ ...form, capacityLuggage: e.target.value })}
              required
            />
          </div>
          <Input
            label="Fahrzeugtyp"
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            placeholder="Minibus, Van, ..."
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Marke"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              placeholder="Mercedes"
            />
            <Input
              label="Modell"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Sprinter"
            />
            <Input
              label="Baujahr"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2024"
            />
          </div>
          {!editingVehicle && listings.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Parkplatz zuweisen</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent"
                value={form.listingId}
                onChange={(e) => setForm({ ...form, listingId: e.target.value })}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingVehicle ? 'Speichern' : 'Fahrzeug hinzufügen'}
            </Button>
          </div>
        </div>
      </Modal>
    </FadeIn>
  );
}
