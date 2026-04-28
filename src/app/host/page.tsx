'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Spinner } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { getBookingStatusLabel, getBookingStatusVariant } from '@/lib/booking-status';

interface HostStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface HostBooking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email?: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_price: string | number;
  currency: string;
  location_name?: string;
}

export default function HostDashboard() {
  const [stats, setStats] = useState<HostStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        apiCall<HostStats>('GET', '/listings/my/stats'),
        apiCall<{ bookings: HostBooking[]; total: number }>('GET', '/listings/my/bookings?limit=5&sortBy=created_at&sortOrder=desc'),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (bookingsRes.success && bookingsRes.data) {
        const data = bookingsRes.data as unknown;
        const bookings = Array.isArray(data) ? data as HostBooking[] : ((data as Record<string, unknown>).bookings as HostBooking[] || []);
        setRecentBookings(bookings);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number, currency = 'CHF') => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Parkplätze gesamt',
      value: stats?.totalListings ?? 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'text-baby-blue-600 bg-baby-blue-50',
    },
    {
      label: 'Aktive Parkplätze',
      value: stats?.activeListings ?? 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-success-600 bg-success-50',
    },
    {
      label: 'Anstehende Buchungen',
      value: stats?.upcomingBookings ?? 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-warning-600 bg-warning-50',
    },
    {
      label: 'Monatlicher Umsatz',
      value: formatCurrency(stats?.monthlyRevenue ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-baby-blue-600 bg-baby-blue-50',
    },
  ];

  const now = Date.now();
  const upcomingBookings = recentBookings.filter((booking) => new Date(booking.end_datetime).getTime() >= now);
  const pastBookings = recentBookings.filter((booking) => new Date(booking.end_datetime).getTime() < now);

  return (
    <FadeIn>
      <div className="space-y-6">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">Dashboard</h1>
          <Link href="/host/listings/create">
            <Button 
            leftIcon={
               <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            >
             
              Neuer Parkplatz
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Buchungen gesamt</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats?.totalBookings ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl text-baby-blue-600 bg-baby-blue-50">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Gesamtumsatz</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
              </div>
              <div className="p-3 rounded-xl text-success-600 bg-success-50">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming bookings */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Anstehende Buchungen</h2>
            <Link href="/host/bookings">
              <Button variant="ghost" size="sm">Alle anzeigen</Button>
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="p-10 text-center">
              <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">Noch keine anstehenden Buchungen vorhanden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Buchungscode</th>
                    <th className="px-5 py-3">Kunde</th>
                    <th className="px-5 py-3">Daten</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {upcomingBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-baby-blue-600">{booking.booking_code}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{booking.customer_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(booking.start_datetime)} – {formatDate(booking.end_datetime)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={getBookingStatusVariant(booking.status)}>
                          {getBookingStatusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(Number(booking.total_price || 0), booking.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Vergangene Buchungen</h2>
            <span className="text-sm text-gray-500">Read-only</span>
          </div>

          {pastBookings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500 text-sm">Noch keine vergangenen Buchungen vorhanden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Buchungscode</th>
                    <th className="px-5 py-3">Kunde</th>
                    <th className="px-5 py-3">Daten</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pastBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-baby-blue-600">{booking.booking_code}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{booking.customer_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(booking.start_datetime)} – {formatDate(booking.end_datetime)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={getBookingStatusVariant(booking.status)}>
                          {getBookingStatusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(Number(booking.total_price || 0), booking.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </FadeIn>
  );
}
