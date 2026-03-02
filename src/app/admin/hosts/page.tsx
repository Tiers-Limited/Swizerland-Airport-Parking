'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface HostRow {
  id: string;
  user_id: string;
  company_name: string;
  verification_status: string;
  documents_verified: boolean;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
}

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  // Create Host modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
  });

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

  async function handleCreateHost(e: { preventDefault: () => void }) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    const res = await apiCall<unknown>('POST', '/admin/hosts', {
      name: createForm.name,
      email: createForm.email,
      phone: createForm.phone || undefined,
      companyName: createForm.companyName,
    });

    if (res.success) {
      setMessage('Host erfolgreich erstellt. Zugangsdaten wurden per E-Mail gesendet.');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', phone: '', companyName: '' });
      loadHosts();
    } else {
      setCreateError(res.error?.message || 'Fehler beim Erstellen des Hosts');
    }
    setCreating(false);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Hosts verwalten</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            + Host erstellen
          </Button>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}

        {/* Filters */}
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
                  { value: 'approved', label: 'Genehmigt' },
                  { value: 'rejected', label: 'Abgelehnt' },
                ]}
              />
            </div>
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Host</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Unternehmen</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Registriert</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Aktionen</th>
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
                                Genehmigen
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleVerify(host.id, 'rejected')}>
                                Ablehnen
                              </Button>
                            </>
                          )}
                          {host.verification_status === 'approved' && (
                            <Button size="sm" variant="secondary" onClick={() => handleVerify(host.id, 'rejected')}>
                              Sperren
                            </Button>
                          )}
                          {host.verification_status === 'rejected' && (
                            <Button size="sm" onClick={() => handleVerify(host.id, 'approved')}>
                              Reaktivieren
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hosts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">Keine Ergebnisse gefunden</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

        {/* Create Host Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setCreateError(''); }}
          title="Neuen Host erstellen"
          size="lg"
        >
          <form onSubmit={handleCreateHost} className="space-y-4">
            {createError && (
              <Alert variant="error" onClose={() => setCreateError('')}>{createError}</Alert>
            )}

            <div>
              {/* <label htmlFor="host-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label> */}
              <Input
                id="host-name"
                label="Vollständiger Name"
                placeholder="Vollständiger Name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              {/* <label htmlFor="host-email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label> */}
              <Input
                id="host-email"
                label="Email"
                type="email"
                placeholder="host@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              {/* <label htmlFor="host-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label> */}
              <Input
                id="host-phone"
                label="Telefonnummer"
                placeholder="+41 79 123 45 67"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>

            <div>
              {/* <label htmlFor="host-company" className="block text-sm font-medium text-gray-700 mb-1">Firmenname *</label> */}
              <Input
                id="host-company"
                label="Firmenname"
                placeholder="Firmenname"
                value={createForm.companyName}
                onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Erstellen...' : 'Host erstellen'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </FadeIn>
  );
}
