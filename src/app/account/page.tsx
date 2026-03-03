'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, getFirstName } from '@/lib/utils';
import { apiCall } from '@/lib/api';

interface BookingRow {
  id: string;
  booking_code: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  currency: string;
  status: string;
  location_name?: string;
}

interface CustomerStats {
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  upcomingBookings: number;
}

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalBookings: 0, completedBookings: 0, totalSpent: 0, upcomingBookings: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        apiCall<BookingRow[]>('GET', '/bookings/my?limit=5&status=confirmed,checked_in'),
        apiCall<CustomerStats>('GET', '/bookings/my/stats'),
      ]);

      if (bookingsRes.success && bookingsRes.data) {
        const data = bookingsRes.data as unknown;
        const bookingsArray = Array.isArray(data) ? data : (data as Record<string, unknown>).bookings as BookingRow[] || [];
        setBookings(bookingsArray as BookingRow[]);
      }
      if (statsRes.success && statsRes.data) {
        const upcoming = statsRes.data.upcomingBookings;
        setStats({
          ...statsRes.data,
          upcomingBookings: Array.isArray(upcoming) ? upcoming.length : Number(upcoming || 0),
        });
      }
    } catch {
      // Silently handle – empty state is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calcDays = (s: string, e: string) => {
    const diff = new Date(e).getTime() - new Date(s).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const statusVariant = (s: string) => {
    if (s === 'confirmed') return 'success' as const;
    if (s === 'checked_in') return 'primary' as const;
    if (s === 'pending_payment') return 'warning' as const;
    return 'gray' as const;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen zurück, {getFirstName(user?.name)}!
        </h1>
        <p className="text-gray-500">Hier ist eine Übersicht Ihrer Parkplatzreservierungen.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-baby-blue-100 text-baby-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-sm text-gray-500">Gesamte Buchungen</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-100 text-success-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
              <p className="text-sm text-gray-500">Anstehende Buchungen</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning-100 text-warning-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-sm text-gray-500">Gesamtausgaben</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Anstehende Buchungen</CardTitle>
            <Link href="/account/bookings">
              <Button variant="ghost" size="sm">Alle anzeigen</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-1">Keine anstehenden Buchungen</h3>
              <p className="text-sm text-gray-500 mb-4">Buchen Sie Ihren nächsten Parkplatz!</p>
              <Link href="/zurich">
                <Button>Parkplatz suchen</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{booking.location_name || 'Parkplatz'}</span>
                      <Badge variant={statusVariant(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(booking.start_datetime)} - {formatDate(booking.end_datetime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {booking.booking_code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(booking.total_price)}</p>
                      <p className="text-xs text-gray-500">{calcDays(booking.start_datetime, booking.end_datetime)} Tage</p>
                    </div>
                    <Link href={`/account/bookings/${booking.id}`}>
                      <Button variant="secondary" size="sm">Anzeigen</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card padding="md">
        <CardHeader className="pb-4 px-0 pt-0">
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/zurich" className="block">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-baby-blue-500 hover:bg-baby-blue-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Parkplatz suchen</p>
                  <p className="text-xs text-gray-500">Suche beim Flughafen Zürich</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/account/bookings" className="block">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-baby-blue-500 hover:bg-baby-blue-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-100 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Buchungen anzeigen</p>
                  <p className="text-xs text-gray-500">Reservierungen verwalten</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/account/profile" className="block">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-baby-blue-500 hover:bg-baby-blue-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning-100 text-warning-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Einstellungen</p>
                  <p className="text-xs text-gray-500">Profil bearbeiten</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
