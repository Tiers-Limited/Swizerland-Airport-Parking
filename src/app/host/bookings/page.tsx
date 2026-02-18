'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Spinner, Select } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface HostBooking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle_plate: string;
  vehicle_model?: string;
  start_date: string;
  end_date: string;
  arrival_time: string;
  status: string;
  total_price: number;
  currency: string;
  listing_name: string;
  passenger_count: number;
  luggage_count: number;
  outbound_flight?: string;
  return_flight?: string;
  special_requests?: string;
  created_at: string;
}

export default function HostBookingsPage() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', sortBy: 'created_at', sortOrder: 'desc' });
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const res = await apiCall<{ bookings: HostBooking[]; total: number; totalPages: number }>(
      'GET', `/listings/my/bookings?${params}`
    );
    if (res.success && res.data) {
      const bk = res.data.bookings || (Array.isArray(res.data) ? res.data as unknown as HostBooking[] : []);
      setBookings(bk);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatCurrency = (a: number, c = 'CHF') => new Intl.NumberFormat('de-CH', { style: 'currency', currency: c }).format(a);

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
    confirmed: 'success',
    pending_payment: 'warning',
    checked_in: 'info',
    completed: 'gray',
    cancelled: 'error',
    refunded: 'error',
    draft: 'gray',
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('host.bookings')}</h1>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Select
              label=""
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: t('host.allStatuses') },
                { value: 'confirmed', label: t('host.statusConfirmed') },
                { value: 'pending_payment', label: t('host.statusPendingPayment') },
                { value: 'checked_in', label: t('host.statusCheckedIn') },
                { value: 'completed', label: t('host.statusCompleted') },
                { value: 'cancelled', label: t('host.statusCancelled') },
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('host.noBookingsTitle')}</h3>
            <p className="text-gray-500">{t('host.noBookingsDesc')}</p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  {/* Summary row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-baby-blue-600">{booking.booking_code}</span>
                        <Badge variant={statusColors[booking.status] || 'gray'}>
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{booking.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {booking.listing_name} · {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(booking.total_price || 0), booking.currency)}</span>
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedId === booking.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.customerEmail')}</p>
                          <p className="text-gray-900">{booking.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.customerPhone')}</p>
                          <p className="text-gray-900">{booking.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.vehiclePlate')}</p>
                          <p className="text-gray-900 font-mono">{booking.vehicle_plate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.vehicleModel')}</p>
                          <p className="text-gray-900">{booking.vehicle_model || '–'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.arrivalTime')}</p>
                          <p className="text-gray-900">{booking.arrival_time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.passengers')}</p>
                          <p className="text-gray-900">{booking.passenger_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">{t('host.luggage')}</p>
                          <p className="text-gray-900">{booking.luggage_count}</p>
                        </div>
                        {booking.outbound_flight && (
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">{t('host.outboundFlight')}</p>
                            <p className="text-gray-900">{booking.outbound_flight}</p>
                          </div>
                        )}
                        {booking.return_flight && (
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">{t('host.returnFlight')}</p>
                            <p className="text-gray-900">{booking.return_flight}</p>
                          </div>
                        )}
                      </div>
                      {booking.special_requests && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">{t('host.specialRequests')}</p>
                          <p className="text-sm text-gray-700">{booking.special_requests}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-gray-500 px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </FadeIn>
  );
}
