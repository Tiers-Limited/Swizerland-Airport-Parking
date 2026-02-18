'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface ListingRow {
  id: string;
  name: string;
  address: string;
  status: string;
  base_price_per_day: string | number;
  capacity_total: number;
  host_name: string;
  host_email: string;
  host_company: string;
  created_at: string;
}

export default function AdminListingsPage() {
  const { t } = useI18n();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ listings: ListingRow[]; totalPages: number }>('GET', `/admin/listings?${params}`);
    if (res.success && res.data) {
      setListings(res.data.listings || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { loadListings(); }, [loadListings]);

  async function handleStatusChange(id: string, status: string) {
    const res = await apiCall('PATCH', `/admin/listings/${id}/status`, { status });
    if (res.success) {
      setMessage(t('admin.statusUpdated'));
      loadListings();
    }
  }

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    active: 'success',
    pending: 'warning',
    rejected: 'error',
    inactive: 'gray',
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(Number(val || 0));

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.manageListings')}</h1>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}

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
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') },
                { value: 'rejected', label: t('common.rejected') },
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.listingLabel')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.host')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.capacity')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.price')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('common.status')}</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{listing.name}</p>
                          <p className="text-xs text-gray-500">{listing.address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>
                          <p>{listing.host_name || '—'}</p>
                          <p className="text-xs text-gray-400">{listing.host_company || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{listing.capacity_total}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(listing.base_price_per_day)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[listing.status] || 'gray'}>{listing.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {listing.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleStatusChange(listing.id, 'active')}>
                                {t('admin.approve')}
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleStatusChange(listing.id, 'rejected')}>
                                {t('admin.reject')}
                              </Button>
                            </>
                          )}
                          {listing.status === 'active' && (
                            <Button size="sm" variant="secondary" onClick={() => handleStatusChange(listing.id, 'inactive')}>
                              {t('admin.deactivate')}
                            </Button>
                          )}
                          {(listing.status === 'inactive' || listing.status === 'rejected') && (
                            <Button size="sm" onClick={() => handleStatusChange(listing.id, 'active')}>
                              {t('admin.activate')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">{t('common.noResults')}</td>
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
