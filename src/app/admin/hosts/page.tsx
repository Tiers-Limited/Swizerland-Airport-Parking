'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface HostRow {
  id: string;
  user_id: string;
  company_name: string;
  host_type?: string;
  verification_status: string;
  documents_verified: boolean;
  rejection_reason?: string;
  tax_id?: string;
  address?: string;
  website?: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
  updated_at?: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  new_values?: Record<string, unknown>;
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
  const [error, setError] = useState('');
  const [rejectingHostId, setRejectingHostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [selectedHost, setSelectedHost] = useState<HostRow | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<AuditLogItem[]>([]);

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

  useEffect(() => {
    const timer = setTimeout(() => { void loadHosts(); }, 0);
    return () => clearTimeout(timer);
  }, [loadHosts]);

  async function handleVerify(hostId: string, status: string, rejectionReason?: string) {
    const actionKey = `${status}:${hostId}`;
    setActionLoadingKey(actionKey);

    try {
      const res = await apiCall('PATCH', `/admin/hosts/${hostId}/verify`, {
        status,
        documentsVerified: status === 'approved',
        rejectionReason,
      });
      if (res.success) {
        setMessage(`Host ${status}`);
        await loadHosts();
        setError('');
      } else {
        setError(res.error?.message || 'Aktion fehlgeschlagen');
      }
    } finally {
      setActionLoadingKey((prev) => (prev === actionKey ? null : prev));
    }
  }

  async function handleRejectSubmit() {
    if (!rejectingHostId) return;
    if (!rejectReason.trim()) {
      setError('Ablehnungsgrund ist erforderlich.');
      return;
    }

    setRejectSubmitting(true);
    try {
      await handleVerify(rejectingHostId, 'rejected', rejectReason.trim());
      setRejectingHostId(null);
      setRejectReason('');
    } finally {
      setRejectSubmitting(false);
    }
  }

  async function openHostDetails(host: HostRow) {
    const actionKey = `details:${host.id}`;
    setActionLoadingKey(actionKey);
    setSelectedHost(host);
    setHistory([]);
    setHistoryLoading(true);

    try {
      const res = await apiCall<AuditLogItem[]>('GET', `/users/${host.user_id}/audit-logs?limit=30`);
      if (res.success && Array.isArray(res.data)) {
        setHistory(
          res.data.filter((item) => item.action === 'host.register' || item.action === 'admin.host.verify')
        );
      }
    } finally {
      setActionLoadingKey((prev) => (prev === actionKey ? null : prev));
      setHistoryLoading(false);
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

  const renderHistory = () => {
    if (historyLoading) {
      return <div className="flex items-center justify-center py-4"><Spinner size="md" /></div>;
    }

    if (history.length === 0) {
      return <p className="text-sm text-gray-500">Keine Historie vorhanden.</p>;
    }

    return (
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {history.map((entry) => {
          const status = (entry.new_values?.status as string) || null;
          const reason = (entry.new_values?.rejectionReason as string)
            || (entry.new_values?.rejection_reason as string)
            || null;

          return (
            <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString('de-CH')}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{entry.action}</p>
              {status && <p className="text-sm text-gray-700 mt-1">Status: {status}</p>}
              {reason && <p className="text-sm text-red-600 mt-1">Grund: {reason}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Hosts verwalten</h1>
          <Button onClick={() => setShowCreateModal(true)} disabled={creating || !!actionLoadingKey || rejectSubmitting}>
            + Host erstellen
          </Button>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

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
                              <Button
                                size="sm"
                                loading={actionLoadingKey === `approved:${host.id}`}
                                disabled={!!actionLoadingKey || rejectSubmitting || creating}
                                onClick={() => { void handleVerify(host.id, 'approved'); }}
                              >
                                Genehmigen
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={actionLoadingKey === `rejected:${host.id}`}
                                disabled={!!actionLoadingKey || rejectSubmitting || creating}
                                onClick={() => {
                                  setRejectingHostId(host.id);
                                  setRejectReason('');
                                }}
                              >
                                Ablehnen
                              </Button>
                            </>
                          )}
                          {host.verification_status === 'approved' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionLoadingKey === `rejected:${host.id}`}
                              disabled={!!actionLoadingKey || rejectSubmitting || creating}
                              onClick={() => {
                                setRejectingHostId(host.id);
                                setRejectReason('');
                              }}
                            >
                              Sperren
                            </Button>
                          )}
                          {host.verification_status === 'rejected' && (
                            <Button
                              size="sm"
                              loading={actionLoadingKey === `approved:${host.id}`}
                              disabled={!!actionLoadingKey || rejectSubmitting || creating}
                              onClick={() => { void handleVerify(host.id, 'approved'); }}
                            >
                              Reaktivieren
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={actionLoadingKey === `details:${host.id}`}
                            disabled={!!actionLoadingKey || rejectSubmitting || creating}
                            onClick={() => { void openHostDetails(host); }}
                          >
                            Details
                          </Button>
                        </div>
                        {host.verification_status === 'rejected' && host.rejection_reason && (
                          <p className="text-xs text-red-600 mt-2">Grund: {host.rejection_reason}</p>
                        )}
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
                  disabled={creating}
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
              >
                Abbrechen
              </Button>
              <Button type="submit" loading={creating} disabled={creating}>
                Host erstellen
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={!!rejectingHostId}
          onClose={() => {
            setRejectingHostId(null);
            setRejectReason('');
          }}
          title="Host ablehnen"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Bitte geben Sie den Ablehnungsgrund an. Dieser wird dem Host per E-Mail gesendet.</p>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">Ablehnungsgrund</label>
              <textarea
                id="reject-reason"
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => {
                setRejectingHostId(null);
                setRejectReason('');
              }} disabled={rejectSubmitting || !!actionLoadingKey}>
                Abbrechen
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={rejectSubmitting || (rejectingHostId ? actionLoadingKey === `rejected:${rejectingHostId}` : false)}
                disabled={rejectSubmitting || !!actionLoadingKey}
                onClick={() => { void handleRejectSubmit(); }}
              >
                Ablehnen
              </Button>
            </div>
          </div>
        </Modal>

        {/* Host Details Modal */}
        <Modal
          isOpen={!!selectedHost}
          onClose={() => {
            setSelectedHost(null);
            setHistory([]);
          }}
          title="Host-Antrag Details"
          size="lg"
        >
          {selectedHost && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{selectedHost.user_name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">E-Mail</p>
                  <p className="font-medium text-gray-900">{selectedHost.user_email || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefon</p>
                  <p className="font-medium text-gray-900">{selectedHost.user_phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge variant={statusColors[selectedHost.verification_status] || 'gray'}>
                    {selectedHost.verification_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Firma</p>
                  <p className="font-medium text-gray-900">{selectedHost.company_name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Host-Typ</p>
                  <p className="font-medium text-gray-900">{selectedHost.host_type || 'operator'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Steuer-ID</p>
                  <p className="font-medium text-gray-900">{selectedHost.tax_id || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Website</p>
                  <p className="font-medium text-gray-900 break-all">{selectedHost.website || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">Adresse</p>
                  <p className="font-medium text-gray-900 whitespace-pre-line">{selectedHost.address || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Registriert am</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedHost.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Dokumente verifiziert</p>
                  <p className="font-medium text-gray-900">{selectedHost.documents_verified ? 'Ja' : 'Nein'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">Aktueller Ablehnungsgrund</p>
                  <p className="font-medium text-gray-900">{selectedHost.rejection_reason || '—'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Entscheidungs-Historie</h3>
                {renderHistory()}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </FadeIn>
  );
}
