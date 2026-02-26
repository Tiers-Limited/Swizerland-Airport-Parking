'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  verification_status: string;
  documents_verified: boolean;
  name?: string;
  email?: string;
  phone?: string;
}

interface DriverListResponse {
  drivers: Driver[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminDriversPage() {
  const [data, setData] = useState<DriverListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', licenseNumber: '', licenseExpiry: '' });
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadDrivers() {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await apiCall<DriverListResponse>('GET', `/drivers/admin?${params}`);
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    }
    loadDrivers();
  }, [statusFilter, search, page, refreshKey]);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCall('POST', '/drivers/admin', form);
    if (res.success) {
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', licenseNumber: '', licenseExpiry: '' });
      setRefreshKey(k => k + 1);
    }
    setSaving(false);
  };

  const handleVerify = async (id: string, verificationStatus: string) => {
    await apiCall('PATCH', `/drivers/admin/${id}/verify`, {
      verificationStatus,
      documentsVerified: verificationStatus === 'approved',
    });
    setRefreshKey(k => k + 1);
  };

  const verificationColors: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fahrer verwalten</h1>
          <Button onClick={() => setShowCreate(true)}>Neuer Fahrer</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle Status</option>
            <option value="pending">Ausstehend</option>
            <option value="approved">Genehmigt</option>
            <option value="rejected">Abgelehnt</option>
          </select>
        </div>

        {/* Drivers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">E-Mail</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Führerschein</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Gültig bis</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {(data?.drivers || []).map((driver) => (
                  <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{driver.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{driver.email || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{driver.license_number}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(driver.license_expiry).toLocaleDateString('de-CH')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={verificationColors[driver.verification_status] || 'gray'}>
                        {driver.verification_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {driver.verification_status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleVerify(driver.id, 'approved')}>
                              Genehmigen
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleVerify(driver.id, 'rejected')}>
                              Ablehnen
                            </Button>
                          </>
                        )}
                        {driver.verification_status === 'rejected' && (
                          <Button size="sm" variant="ghost" onClick={() => handleVerify(driver.id, 'approved')}>
                            Genehmigen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.drivers || data.drivers.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">Keine Fahrer gefunden</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Zurück
            </Button>
            <span className="px-4 py-2 text-sm text-gray-500">
              Seite {page} von {Math.ceil(data.total / data.limit)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= Math.ceil(data.total / data.limit)}
              onClick={() => setPage(p => p + 1)}
            >
              Weiter
            </Button>
          </div>
        )}

        {/* Create Driver Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Neuen Fahrer erstellen">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">Führerscheinnr.</label>
                <input
                  id="license_number"
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">Gültig bis</label>
                <input
                  id="license_expiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button type="submit" loading={saving}>Erstellen</Button>
            </div>
          </form>
        </Modal>
      </div>
    </FadeIn>
  );
}
