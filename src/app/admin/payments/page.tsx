'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Input, Select, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import {
  AdminDateRangeFilter,
  type AdminDateRangeValue,
  clearStoredAdminRange,
  formatAdminRangeLabel,
  getPresetRange,
  loadStoredAdminRange,
  storeAdminRange,
} from '@/components/admin/AdminDateRangeFilter';

interface PaymentRow {
  id: string;
  amount: string | number;
  currency: string;
  status: string;
  payment_method: string;
  booking_id: string;
  user_name: string;
  user_email: string;
  listing_name?: string;
  refunded_amount?: string | number;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultRange = useMemo(() => getPresetRange('thisMonth'), []);
  const [range, setRange] = useState<AdminDateRangeValue>(defaultRange);
  const [appliedRange, setAppliedRange] = useState<AdminDateRangeValue>(defaultRange);
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPayments = useCallback(async (activeRange: AdminDateRangeValue = appliedRange) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '15',
      fromDate: activeRange.fromDate,
      toDate: activeRange.toDate,
    });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ payments: PaymentRow[]; totalPages: number }>('GET', `/admin/payments?${params}`);
    if (res.success && res.data) {
      setPayments(res.data.payments || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, search, appliedRange]);

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
    const timer = setTimeout(() => { void loadPayments(); }, 0);
    return () => clearTimeout(timer);
  }, [hydrated, loadPayments]);

  const handleApplyRange = () => {
    setPage(1);
    storeAdminRange(range);
    setAppliedRange(range);
  };

  const handleResetRange = () => {
    setPage(1);
    clearStoredAdminRange();
    setRange(defaultRange);
    setAppliedRange(defaultRange);
  };

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    succeeded: 'success',
    completed: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'gray',
  };

  const statusLabels: Record<string, string> = {
    succeeded: 'Erfolgreich',
    completed: 'Abgeschlossen',
    pending: 'Ausstehend',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet',
  };

  const formatCurrency = (val: string | number, currency = 'CHF') =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(Number(val || 0));
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('de-CH') : '—';
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Zahlungen verwalten</h1>

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

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-1">
              <Select
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                options={[
                  { value: 'all', label: 'Alle' },
                  { value: 'pending', label: 'Ausstehend' },
                  { value: 'succeeded', label: 'Erfolgreich' },
                  { value: 'failed', label: 'Fehlgeschlagen' },
                  { value: 'refunded', label: 'Erstattet' },
                ]}
              />
            </div>
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Zahlungs-ID</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Kunde</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Betrag</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Methode</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{p.user_name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.user_email || ''}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(p.amount, p.currency || 'CHF')}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{p.payment_method || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[p.status] || 'gray'}>{statusLabels[p.status] || p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        <p>{formatDate(p.created_at)}</p>
                        <p>{formatTime(p.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">Keine Ergebnisse gefunden</td>
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
