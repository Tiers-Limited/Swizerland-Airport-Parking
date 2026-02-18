'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface HostRow {
  id: string;
  user_id: string;
  company_name: string;
  host_type: string;
  verification_status: string;
  documents_verified: boolean;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
}

export default function AdminHostsPage() {
  const { t } = useI18n();
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  const loadHosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ hosts: HostRow[]; totalPages: number }>('GET', `/admin/hosts?${params}`);
    if (res.success && res.data) {
      setHosts(res.data.hosts || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { loadHosts(); }, [loadHosts]);

  async function handleVerify(hostId: string, status: string) {
    const res = await apiCall('PATCH', `/admin/hosts/${hostId}/verify`, {
      status,
      documentsVerified: status === 'approved',
    });
    if (res.success) {
      setMessage(`Host ${status}`);
      loadHosts();
    }
  }

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH');

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.manageHosts')}</h1>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}

        {/* Filters */}
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
                { value: 'approved', label: t('common.approved') },
                { value: 'rejected', label: t('common.rejected') },
              ]}
            />
          </div>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.hostNameLabel')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.company')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.type')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.registered')}</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map((host) => (
                    <tr key={host.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{host.user_name || '—'}</p>
                          <p className="text-xs text-gray-500">{host.user_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{host.company_name || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={host.host_type === 'operator' ? 'primary' : 'gray'}>
                          {host.host_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[host.verification_status] || 'gray'}>
                          {host.verification_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(host.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {host.verification_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleVerify(host.id, 'approved')}>
                                {t('admin.approve')}
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleVerify(host.id, 'rejected')}>
                                {t('admin.reject')}
                              </Button>
                            </>
                          )}
                          {host.verification_status === 'approved' && (
                            <Button size="sm" variant="secondary" onClick={() => handleVerify(host.id, 'rejected')}>
                              {t('admin.suspend')}
                            </Button>
                          )}
                          {host.verification_status === 'rejected' && (
                            <Button size="sm" onClick={() => handleVerify(host.id, 'approved')}>
                              {t('admin.reactivate')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hosts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">{t('common.noResults')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
