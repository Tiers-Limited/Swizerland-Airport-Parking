'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  email_verified: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('search', search);

    const res = await apiCall<{ users: UserRow[]; totalPages: number }>('GET', `/admin/users?${params}`);
    if (res.success && res.data) {
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, roleFilter, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleStatusChange(id: string, status: string) {
    const res = await apiCall('PATCH', `/admin/users/${id}/status`, { status });
    if (res.success) {
      setMessage(t('admin.statusUpdated'));
      loadUsers();
    }
  }

  const roleColors: Record<string, 'primary' | 'warning' | 'info' | 'gray'> = {
    admin: 'primary',
    host: 'warning',
    customer: 'info',
  };

  const statusColors: Record<string, 'success' | 'error' | 'gray'> = {
    active: 'success',
    suspended: 'error',
    inactive: 'gray',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH');

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.manageUsers')}</h1>

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
              value={roleFilter}
              onChange={(val) => { setRoleFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: t('admin.allRoles') },
                { value: 'admin', label: 'Admin' },
                { value: 'host', label: 'Host' },
                { value: 'customer', label: 'Customer' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'active', label: t('common.active') },
                { value: 'suspended', label: t('common.suspended') },
                { value: 'inactive', label: t('common.inactive') },
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.user')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.role')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.emailVerified')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.joined')}</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={roleColors[u.role] || 'gray'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {u.email_verified ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">✗</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[u.status] || 'gray'}>{u.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && (
                          <>
                            {u.status === 'active' && (
                              <Button size="sm" variant="danger" onClick={() => handleStatusChange(u.id, 'suspended')}>
                                {t('admin.suspend')}
                              </Button>
                            )}
                            {u.status === 'suspended' && (
                              <Button size="sm" onClick={() => handleStatusChange(u.id, 'active')}>
                                {t('admin.activate')}
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
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
