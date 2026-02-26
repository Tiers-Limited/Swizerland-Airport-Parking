'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface BookingRow {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  total_price: string | number;
  vehicle_plate: string;
  listing_name: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ bookings: BookingRow[]; totalPages: number }>('GET', `/admin/bookings?${params}`);
    if (res.success && res.data) {
      setBookings(res.data.bookings || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function handleRefund(id: string) {
    if (!confirm('Möchten Sie diese Buchung wirklich erstatten?')) return;
    const res = await apiCall('PATCH', `/admin/bookings/${id}/refund`);
    if (res.success) {
      setMessage('Erstattung erfolgreich verarbeitet');
      loadBookings();
    }
  }

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'info',
    refunded: 'gray',
    active: 'success',
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(Number(val || 0));
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('de-CH') : '—';

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Buchungen verwalten</h1>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: 'Alle' },
                { value: 'pending', label: 'Ausstehend' },
                { value: 'confirmed', label: 'Bestätigt' },
                { value: 'active', label: 'Aktiv' },
                { value: 'completed', label: 'Abgeschlossen' },
                { value: 'cancelled', label: 'Storniert' },
                { value: 'refunded', label: 'Erstattet' },
              ]}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Buchung</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Kunde</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Inserat</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Daten</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Gesamt</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs text-gray-500">{b.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">{formatDate(b.created_at)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{b.user_name || '—'}</p>
                        <p className="text-xs text-gray-400">{b.user_email || ''}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{b.listing_name || '—'}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        <p>{formatDate(b.check_in)}</p>
                        <p>{formatDate(b.check_out)}</p>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(b.total_price)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[b.status] || 'gray'}>{b.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(b.status === 'confirmed' || b.status === 'active') && (
                          <Button size="sm" variant="danger" onClick={() => handleRefund(b.id)}>
                            Erstatten
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">Keine Ergebnisse gefunden</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Zurück
                </Button>
                <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Weiter
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </FadeIn>
  );
}
