'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Badge, Input, Select, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface PaymentRow {
  id: string;
  amount: string | number;
  status: string;
  payment_method: string;
  booking_id: string;
  user_name: string;
  user_email: string;
  listing_name: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ payments: PaymentRow[]; totalPages: number }>('GET', `/admin/payments?${params}`);
    if (res.success && res.data) {
      setPayments(res.data.payments || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    completed: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'gray',
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(Number(val || 0));
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('de-CH') : '—';
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.managePayments')}</h1>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'pending', label: t('common.pending') },
                { value: 'completed', label: t('common.completed') },
                { value: 'failed', label: t('common.failed') },
                { value: 'refunded', label: t('common.refunded') },
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.paymentId')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.customer')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.listingLabel')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.amount')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.method')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.date')}</th>
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
                      <td className="py-3 px-4 text-gray-600">{p.listing_name || '—'}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{p.payment_method || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[p.status] || 'gray'}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        <p>{formatDate(p.created_at)}</p>
                        <p>{formatTime(p.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">{t('common.noResults')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </FadeIn>
  );
}
