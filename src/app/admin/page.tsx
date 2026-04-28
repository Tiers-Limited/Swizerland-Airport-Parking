'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icons';
import { getBookingStatusLabel, getBookingStatusVariant } from '@/lib/booking-status';
import {
  AdminDateRangeFilter,
  type AdminDateRangeValue,
  clearStoredAdminRange,
  formatAdminRangeLabel,
  getPresetRange,
  loadStoredAdminRange,
  storeAdminRange,
} from '@/components/admin/AdminDateRangeFilter';

interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingHosts: number;
  pendingListings: number;
  activeBookings: number;
  recentBookings: Array<{
    id: string;
    booking_code: string;
    customer_name: string;
    listing_name: string;
    total_price: string | number;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const defaultRange = useMemo(() => getPresetRange('thisMonth'), []);
  const [range, setRange] = useState<AdminDateRangeValue>(defaultRange);
  const [appliedRange, setAppliedRange] = useState<AdminDateRangeValue>(defaultRange);
  const [hydrated, setHydrated] = useState(false);

  const loadStats = useCallback(async (activeRange: AdminDateRangeValue = appliedRange) => {
    setLoading(true);
    const params = new URLSearchParams({
      fromDate: activeRange.fromDate,
      toDate: activeRange.toDate,
    });
    const res = await apiCall<DashboardStats>('GET', `/admin/dashboard?${params}`);
    if (res.success && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  }, [appliedRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedRange = loadStoredAdminRange(defaultRange);
      setRange(storedRange);
      setAppliedRange(storedRange);
      setHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [defaultRange]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void loadStats();
    }, 0);

    return () => clearTimeout(timer);
  }, [hydrated, loadStats]);

  const handleApplyRange = () => {
    storeAdminRange(range);
    setAppliedRange(range);
  };

  const handleResetRange = () => {
    clearStoredAdminRange();
    setRange(defaultRange);
    setAppliedRange(defaultRange);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-gray-500">Fehler</div>;
  }

  const statCards = [
    { label: 'Gesamtbenutzer', value: stats.totalUsers, icon: <Icon name="Users" className="h-6 w-6" />, color: 'bg-blue-50 text-blue-600', href: '/admin/users' },
    { label: 'Gesamthosts', value: stats.totalHosts, icon: <Icon name="Building" className="h-6 w-6" />, color: 'bg-purple-50 text-purple-600', href: '/admin/hosts' },
    { label: 'Gesamtinserate', value: stats.totalListings, icon: <Icon name="MapPin" className="h-6 w-6" />, color: 'bg-green-50 text-green-600', href: '/admin/listings' },
    { label: 'Gesamtbuchungen', value: stats.totalBookings, icon: <Icon name="Clipboard" className="h-6 w-6" />, color: 'bg-orange-50 text-orange-600', href: '/admin/bookings' },
    { label: 'Gesamtumsatz', value: formatCurrency(stats.totalRevenue), icon: <Icon name="DollarSign" className="h-6 w-6" />, color: 'bg-emerald-50 text-emerald-600', href: '/admin/payments' },
    { label: 'Aktive Buchungen', value: stats.activeBookings, icon: <Icon name="Car" className="h-6 w-6" />, color: 'bg-cyan-50 text-cyan-600', href: '/admin/bookings' },
  ];

  const alertCards = [
    { label: 'ausstehende Hosts', value: stats.pendingHosts, href: '/admin/hosts', color: 'text-orange-600 bg-orange-50' },
    { label: 'ausstehende Inserate', value: stats.pendingListings, href: '/admin/listings', color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <Card className="p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Zeitraum</p>
            <p className="text-sm text-gray-500">Aktiver Zeitraum: {formatAdminRangeLabel(appliedRange)}</p>
          </div>
          <AdminDateRangeFilter
            value={range}
            onChange={setRange}
            onApply={handleApplyRange}
            onReset={handleResetRange}
          />
        </Card>

        {/* Alert badges for pending items */}
        {(stats.pendingHosts > 0 || stats.pendingListings > 0) && (
          <div className="flex flex-wrap gap-3">
            {alertCards.filter(a => a.value > 0).map((alert) => (
              <Link key={alert.label} href={alert.href}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${alert.color} hover:opacity-80 transition-opacity`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                  </span>
                  {alert.value} {alert.label}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="p-5 hover:shadow-medium transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Letzte Buchungen</h2>
            <Link href="/admin/bookings" className="text-sm text-baby-blue-600 hover:text-baby-blue-700 font-medium">
              Alle anzeigen →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Buchungscode</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Kunde</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Inserat</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentBookings || []).map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{booking.booking_code || '—'}</td>
                    <td className="py-3 px-2">{booking.customer_name || '—'}</td>
                    <td className="py-3 px-2 text-gray-600">{booking.listing_name || '—'}</td>
                    <td className="py-3 px-2">
                      <Badge variant={getBookingStatusVariant(booking.status)}>
                        {getBookingStatusLabel(booking.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(Number(booking.total_price || 0))}
                    </td>
                  </tr>
                ))}
                {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">Keine Ergebnisse gefunden</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}
