'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Spinner } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface RevenueData {
  month: string;
  revenue: number;
}

interface BookingsByStatus {
  status: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [bookingStatus, setBookingStatus] = useState<BookingsByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [revRes, bookRes] = await Promise.all([
        apiCall<RevenueData[]>('GET', '/admin/analytics/revenue'),
        apiCall<BookingsByStatus[]>('GET', '/admin/analytics/bookings'),
      ]);
      if (revRes.success && revRes.data) setRevenue(revRes.data);
      if (bookRes.success && bookRes.data) setBookingStatus(bookRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  const maxRevenue = Math.max(...revenue.map(r => r.revenue), 1);
  const totalRevenue = revenue.reduce((sum, r) => sum + r.revenue, 0);
  const totalBookings = bookingStatus.reduce((sum, b) => sum + b.count, 0);

  const statusLabels: Record<string, string> = {
    pending_payment: 'Zahlung ausstehend',
    confirmed: 'Bestätigt',
    checked_in: 'Eingecheckt',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    refunded: 'Erstattet',
    draft: 'Entwurf',
  };

  const statusColors: Record<string, string> = {
    pending_payment: 'bg-yellow-400',
    confirmed: 'bg-green-400',
    checked_in: 'bg-blue-400',
    completed: 'bg-emerald-400',
    cancelled: 'bg-red-400',
    refunded: 'bg-orange-400',
    draft: 'bg-gray-400',
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytik</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm text-gray-500">Gesamtumsatz</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500">Gesamtbuchungen</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500">Durchschnittlicher Umsatz/Monat</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(revenue.length > 0 ? totalRevenue / revenue.length : 0)}
            </p>
          </Card>
        </div>

        {/* Revenue Chart (simple bar chart) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Umsatz pro Monat</h2>
          {revenue.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Keine Daten verfügbar</p>
          ) : (
            <div className="space-y-3">
              {revenue.map((r) => (
                <div key={r.month} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-500 shrink-0 text-right">
                    {r.month}
                  </span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-baby-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-sm font-medium text-gray-900 shrink-0">
                    {formatCurrency(r.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bookings by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Buchungen nach Status</h2>
          {bookingStatus.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Keine Daten verfügbar</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bookingStatus.map((b) => (
                <div key={b.status} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[b.status] || 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-500">{statusLabels[b.status] || b.status}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{b.count}</p>
                  {totalBookings > 0 && (
                    <p className="text-xs text-gray-400">{((b.count / totalBookings) * 100).toFixed(1)}%</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </FadeIn>
  );
}
