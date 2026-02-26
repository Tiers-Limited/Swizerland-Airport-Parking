'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Button, Input, Alert, Spinner, Toggle } from '@/components/ui';
import type { LocationAddon } from '@/types';

interface AddonsManagerProps {
  locationId: string;
}

interface AddonFormData {
  name: string;
  description: string;
  price: string;
  maxQuantity: string;
  icon: string;
}

const emptyForm: AddonFormData = {
  name: '',
  description: '',
  price: '',
  maxQuantity: '1',
  icon: '',
};

export default function AddonsManager({ locationId }: AddonsManagerProps) {
  const [addons, setAddons] = useState<LocationAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing / creating state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddonFormData>(emptyForm);

  const loadAddons = useCallback(async () => {
    setLoading(true);
    const res = await apiCall<LocationAddon[]>('GET', `/listings/${locationId}/addons`);
    if (res.success && res.data) {
      setAddons(res.data);
    }
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    if (locationId) loadAddons();
  }, [locationId, loadAddons]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (addon: LocationAddon) => {
    setForm({
      name: addon.name,
      description: addon.description || '',
      price: String(addon.price),
      maxQuantity: String(addon.max_quantity),
      icon: addon.icon || '',
    });
    setEditingId(addon.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price) || 0,
      maxQuantity: parseInt(form.maxQuantity) || 1,
      icon: form.icon || undefined,
    };

    let res;
    if (editingId) {
      res = await apiCall('PATCH', `/listings/addons/${editingId}`, payload);
    } else {
      res = await apiCall('POST', `/listings/${locationId}/addons`, payload);
    }

    if (res.success) {
      setSuccess(editingId ? 'Zusatzleistung aktualisiert' : 'Zusatzleistung hinzugefügt');
      cancelForm();
      await loadAddons();
    } else {
      setError(res.error?.message || 'Fehler beim Speichern');
    }
    setSaving(false);
  };

  const handleDelete = async (addonId: string) => {
    if (!confirm('Möchten Sie diese Zusatzleistung wirklich löschen?')) return;

    const res = await apiCall('DELETE', `/listings/addons/${addonId}`);
    if (res.success) {
      setSuccess('Zusatzleistung gelöscht');
      await loadAddons();
    } else {
      setError(res.error?.message || 'Fehler beim Löschen');
    }
  };

  const handleToggle = async (addon: LocationAddon) => {
    const res = await apiCall('PATCH', `/listings/addons/${addon.id}`, {
      isActive: !addon.is_active,
    });
    if (res.success) {
      await loadAddons();
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Zusatzleistungen / Extras</h2>
          <p className="text-sm text-gray-500 mt-1">
            Definieren Sie optionale Zusatzleistungen, die Kunden während der Buchung auswählen können.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            + Leistung hinzufügen
          </Button>
        )}
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingId ? 'Zusatzleistung bearbeiten' : 'Neue Zusatzleistung'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Name *"
                placeholder="z.B. Fahrzeugwäsche (aussen)"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Preis (CHF)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <Input
              label="Max. Anzahl"
              type="number"
              min="1"
              max="10"
              placeholder="1"
              value={form.maxQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, maxQuantity: e.target.value }))}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung (optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-baby-blue-500 focus:border-transparent resize-none"
                placeholder="Kurze Beschreibung der Leistung..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="secondary" type="button" size="sm" onClick={cancelForm}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editingId ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      )}

      {/* Addons List */}
      {addons.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-sm">Noch keine Zusatzleistungen definiert</p>
          <p className="text-xs mt-1">Fügen Sie optionale Extras wie Autowäsche, Kindersitz oder Übergrössengebühren hinzu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                addon.is_active
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{addon.name}</h4>
                  <span className="text-sm font-bold text-baby-blue-600">
                    CHF {Number(addon.price).toFixed(2)}
                  </span>
                  {addon.max_quantity > 1 && (
                    <span className="text-xs text-gray-400">(max {addon.max_quantity}×)</span>
                  )}
                  {Number(addon.price) === 0 && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Kostenlos
                    </span>
                  )}
                </div>
                {addon.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{addon.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Toggle
                  checked={addon.is_active}
                  onChange={() => handleToggle(addon)}
                  size="sm"
                />
                <Button variant="secondary" size="sm" onClick={() => openEdit(addon)}>
                  Bearbeiten
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDelete(addon.id)} className="text-red-600 hover:text-red-700">
                  Löschen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
