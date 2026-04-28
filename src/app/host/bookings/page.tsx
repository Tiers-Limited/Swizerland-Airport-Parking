'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Spinner, Select } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { getBookingStatusLabel, getBookingStatusVariant } from '@/lib/booking-status';

interface HostBooking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  car_plate?: string;
  car_model?: string;
  start_datetime: string;
  end_datetime: string;
  arrival_lot_datetime?: string;
  outbound_flight_no?: string;
  return_flight_no?: string;
  passengers?: number;
  luggage?: number;
  special_requests?: string;
  created_at: string;
  status?: string;
  total_price?: string | number;
  currency?: string;
  location_name?: string;
}

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<HostBooking[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10', sortBy: 'created_at', sortOrder: 'desc' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await apiCall<{ bookings: HostBooking[]; total: number; totalPages: number }>(
        'GET', `/listings/my/bookings?${params}`
      );

      if (!active) return;

      if (res.success && res.data) {
        const bk = res.data.bookings || (Array.isArray(res.data) ? res.data as unknown as HostBooking[] : []);
        setBookings(bk);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setBookings([]);
        setTotalPages(1);
      }
    };

    void loadBookings();

    return () => {
      active = false;
    };
  }, [statusFilter, page]);

  const formatDate = (d?: string) => {
    if (!d) return '–';
    try {
      return new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '–';
    }
  };

  const formatTime = (d?: string) => {
    if (!d) return '–';
    try {
      return new Date(d).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '–';
    }
  };

  const formatCurrency = (amount: number, currency = 'CHF') => new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(amount);

  const loading = bookings === null;

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Buchungen</h1>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Select
              label=""
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: 'Alle Status' },
                { value: 'confirmed', label: 'Bestätigt' },
                { value: 'pending_payment', label: 'Zahlung ausstehend' },
                { value: 'checked_in', label: 'Eingecheckt' },
                { value: 'completed', label: 'Abgeschlossen' },
                { value: 'cancelled', label: 'Storniert' },
              ]}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="h-16 w-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Buchungen</h3>
            <p className="text-gray-500">Buchungen erscheinen hier, sobald Kunden bei Ihnen buchen.</p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-baby-blue-600">{booking.booking_code}</span>
                        <Badge variant={getBookingStatusVariant(booking.status)}>
                          {getBookingStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{booking.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {booking.location_name} · {formatDate(booking.start_datetime)} – {formatDate(booking.end_datetime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(booking.total_price || 0), booking.currency)}</span>
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expandedId === booking.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">E-Mail</p>
                          <p className="text-gray-900">{booking.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Telefon</p>
                          <p className="text-gray-900">{booking.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Kennzeichen</p>
                          <p className="text-gray-900 font-mono">{booking.car_plate || '–'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Modell</p>
                          <p className="text-gray-900">{booking.car_model || '–'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Ankunftszeit</p>
                          <p className="text-gray-900">{formatTime(booking.arrival_lot_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Passagiere</p>
                          <p className="text-gray-900">{booking.passengers ?? '–'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Gepäck</p>
                          <p className="text-gray-900">{booking.luggage ?? '–'}</p>
                        </div>
                        {booking.outbound_flight_no && (
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Hinflug</p>
                            <p className="text-gray-900">{booking.outbound_flight_no}</p>
                          </div>
                        )}
                        {booking.return_flight_no && (
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Rückflug</p>
                            <p className="text-gray-900">{booking.return_flight_no}</p>
                          </div>
                        )}
                      </div>
                      {booking.special_requests && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Besondere Wünsche</p>
                          <p className="text-sm text-gray-700">{booking.special_requests}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Zurück
                </Button>
                <span className="text-sm text-gray-500 px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                >
                  Weiter
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </FadeIn>
  );
}
