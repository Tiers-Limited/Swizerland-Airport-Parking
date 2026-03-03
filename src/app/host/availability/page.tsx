'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Spinner, Button, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface BlackoutDate {
  id: string;
  location_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
}

interface Listing {
  id: string;
  name: string;
}

export default function HostAvailabilityPage() {
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ location_id: '', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Load host's listings
      const listingsRes = await apiCall<{ listings: Listing[] }>('GET', '/listings/my');
      if (listingsRes.success && listingsRes.data) {
        const data = listingsRes.data as unknown;
        const listingData = Array.isArray(data) ? data : (data as Record<string, unknown>).listings as Listing[] || [];
        setListings(listingData as Listing[]);
        if (listingData.length > 0 && !selectedListing) {
          setSelectedListing(listingData[0].id);
        }
      }

      // Load blackout dates
      if (selectedListing) {
        const blackoutRes = await apiCall<BlackoutDate[]>('GET', `/listings/${selectedListing}/blackouts`);
        if (blackoutRes.success && blackoutRes.data) {
          setBlackouts(Array.isArray(blackoutRes.data) ? blackoutRes.data : []);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [selectedListing, refreshKey]);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCall('POST', `/listings/${selectedListing}/blackouts`, {
      ...form,
      location_id: selectedListing,
    });
    if (res.success) {
      setShowCreate(false);
      setForm({ location_id: '', start_date: '', end_date: '', reason: '' });
      setRefreshKey(k => k + 1);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await apiCall('DELETE', `/listings/${selectedListing}/blackouts/${id}`);
    setRefreshKey(k => k + 1);
  };

  // Group blackouts by month for better display
  const now = new Date();
  const upcoming = blackouts.filter(b => new Date(b.end_date) >= now);
  const past = blackouts.filter(b => new Date(b.end_date) < now);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Verfügbarkeit</h1>
          <div className="flex items-center gap-3">
            {listings.length > 1 && (
              <select
                value={selectedListing}
                onChange={(e) => setSelectedListing(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            )}
            <Button onClick={() => setShowCreate(true)}>Sperrdatum hinzufügen</Button>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Sperrdaten sind Zeiträume, in denen Ihr Parkplatz nicht verfügbar ist. 
            Buchungen können für diese Zeiträume nicht erstellt werden.
          </p>

          {/* Calendar-like visualization */}
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Aktive & kommende Sperrungen</h3>
              <div className="space-y-3">
                {upcoming.map((b) => {
                  const start = new Date(b.start_date);
                  const end = new Date(b.end_date);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <div key={b.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                          {days}d
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {start.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' – '}
                            {end.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {b.reason && <p className="text-sm text-gray-500">{b.reason}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}>
                        Entfernen
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Vergangene Sperrungen</h3>
              <div className="space-y-2">
                {past.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
                    <span>
                      {new Date(b.start_date).toLocaleDateString('de-CH')} – {new Date(b.end_date).toLocaleDateString('de-CH')}
                    </span>
                    <span>{b.reason || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">Keine Sperrdaten vorhanden</p>
              <p className="text-sm text-gray-300 mt-1">Ihr Parkplatz ist durchgehend verfügbar</p>
            </div>
          )}
        </Card>

        {/* Create Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Sperrdatum hinzufügen">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Von</label>
                <input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                <input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Grund (optional)</label>
              <input
                id="reason"
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="z.B. Wartungsarbeiten, Ferien..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button type="submit" loading={saving}>Hinzufügen</Button>
            </div>
          </form>
        </Modal>
      </div>
    </FadeIn>
  );
}
