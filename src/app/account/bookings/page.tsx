'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Input, Spinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import type { BookingStatus } from '@/types';

interface BookingRow {
  id: string;
  booking_code: string;
  start_datetime: string;
  end_datetime: string;
  car_plate: string;
  total_price: number;
  currency: string;
  status: BookingStatus;
  location_name?: string;
}

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

const filterLabels: Record<FilterType, string> = {
  all: 'Alle',
  upcoming: 'Anstehend',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const statusColors: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'gray'> = {
  draft: 'gray',
  pending_payment: 'warning',
  confirmed: 'success',
  checked_in: 'primary',
  completed: 'gray',
  cancelled: 'error',
  refunded: 'error',
};

export default function BookingsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'upcoming') params.set('status', 'confirmed,checked_in,pending_payment');
      else if (filter === 'completed') params.set('status', 'completed');
      else if (filter === 'cancelled') params.set('status', 'cancelled,refunded');
      if (searchQuery) params.set('search', searchQuery);

      const res = await apiCall<{ bookings: BookingRow[]; total: number }>('GET', `/bookings/my?${params}`);
      if (res.success && res.data) {
        const data = res.data as unknown;
        const bookingsArray = Array.isArray(data) ? data : (data as Record<string, unknown>).bookings as BookingRow[] || [];
        setBookings(bookingsArray as BookingRow[]);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    if (!globalThis.confirm('Sind Sie sicher, dass Sie diese Buchung stornieren möchten?')) return;
    const res = await apiCall('POST', `/bookings/${id}/cancel`);
    if (res.success) fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meine Buchungen</h1>
        <p className="text-gray-500">Sehen und verwalten Sie Ihre Parkplatzreservierungen.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Suche nach Buchungscode oder Parkplatzname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterLabels[filterType]}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading && (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      )}
      {!loading && bookings.length === 0 && (
        <Card padding="lg" className="text-center">
          <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="font-medium text-gray-900 mb-1">Keine Buchungen gefunden</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filter === 'all'
              ? 'Sie haben noch keine Buchungen vorgenommen.'
              : `Keine ${filterLabels[filter].toLowerCase()}en Buchungen.`}
          </p>
          <Link href="/zurich">
            <Button>Parkplatz suchen</Button>
          </Link>
        </Card>
      )}
      {!loading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} variant="hover" padding="none">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{booking.location_name || 'Parkplatz'}</h3>
                      <Badge variant={statusColors[booking.status] || 'gray'}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Buchungscode</p>
                        <p className="font-medium text-gray-900">{booking.booking_code}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Datum</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(booking.start_datetime, { month: 'short', day: 'numeric' })} -{' '}
                          {formatDate(booking.end_datetime, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fahrzeug</p>
                        <p className="font-medium text-gray-900">{booking.car_plate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gesamt</p>
                        <p className="font-medium text-gray-900">{formatCurrency(booking.total_price)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/account/bookings/${booking.id}`}>
                      <Button variant="secondary" size="sm">Details anzeigen</Button>
                    </Link>
                    {['confirmed', 'pending_payment'].includes(booking.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Stornieren
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
