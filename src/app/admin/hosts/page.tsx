'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert, Modal } from '@/components/ui';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FadeIn } from '@/components/animations';

const swissIbanRegex = /^CH\d{2}(?:\s?[A-Z0-9]){15,30}$/i;
const swissMwstRegex = /^(?:CHE-)?\d{3}\.\d{3}\.\d{3}(?:\s?(?:MWST|TVA|IVA))?$/i;

interface HostRow {
  id: string;
  user_id: string;
  company_name: string;
  contact_person?: string;
  company_phone?: string;
  company_address?: string;
  bank_iban?: string;
  mwst_number?: string;
  commission_rate?: number;
  facility_options?: Record<string, boolean> | string[];
  transfer_service?: Record<string, unknown>;
  photos?: string[];
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

interface HostFormState {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  contactPerson: string;
  companyPhone: string;
  companyAddress: string;
  bankIban: string;
  mwstNumber: string;
  commissionRate: string;
  facilityOptionsText: string;
  transferSchedule: string;
  transferVehicleType: string;
  transferCapacity: string;
  photos: string[];
  taxId: string;
  address: string;
  website: string;
}

const emptyForm = (): HostFormState => ({
  name: '',
  email: '',
  phone: '',
  companyName: '',
  contactPerson: '',
  companyPhone: '',
  companyAddress: '',
  bankIban: '',
  mwstNumber: '',
  commissionRate: '19',
  facilityOptionsText: '',
  transferSchedule: '',
  transferVehicleType: '',
  transferCapacity: '',
  photos: [],
  taxId: '',
  address: '',
  website: '',
});

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

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingHost, setEditingHost] = useState<HostRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<HostFormState>(emptyForm());

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

  const renderFacilityOptions = (value?: Record<string, boolean> | string[]) => {
    if (!value) return '';
    if (Array.isArray(value)) return value.join(', ');
    return Object.keys(value).filter((key) => value[key]).join(', ');
  };

  const getTransferValue = (value: unknown) => (typeof value === 'string' ? value : '');

  const openCreate = () => {
    setEditingHost(null);
    setForm(emptyForm());
    setFormError('');
    setShowFormModal(true);
  };

  const openEdit = (host: HostRow) => {
    setEditingHost(host);
    setFormError('');
    setForm({
      ...emptyForm(),
      name: host.user_name || '',
      email: host.user_email || '',
      phone: host.user_phone || '',
      companyName: host.company_name || '',
      contactPerson: host.contact_person || '',
      companyPhone: host.company_phone || host.user_phone || '',
      companyAddress: host.company_address || host.address || '',
      bankIban: host.bank_iban || '',
      mwstNumber: host.mwst_number || '',
      commissionRate: String(host.commission_rate ?? 19),
      facilityOptionsText: renderFacilityOptions(host.facility_options),
      transferSchedule: getTransferValue(host.transfer_service?.schedule),
      transferVehicleType: getTransferValue(host.transfer_service?.vehicleType || host.transfer_service?.vehicle_type),
      transferCapacity: getTransferValue(host.transfer_service?.capacity),
      photos: host.photos || [],
      taxId: host.tax_id || '',
      address: host.address || '',
      website: host.website || '',
    });
    setShowFormModal(true);
  };

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
          res.data.filter((item) => item.action === 'host.register' || item.action === 'admin.host.verify' || item.action === 'host.update')
        );
      }
    } finally {
      setActionLoadingKey((prev) => (prev === actionKey ? null : prev));
      setHistoryLoading(false);
    }
  }

  const facilityOptionsToPayload = (value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean);
    return items;
  };

  async function handleSaveHost(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const validationErrors: string[] = [];
    if (!form.name.trim()) validationErrors.push('Full name is required');
    if (!form.email.trim()) validationErrors.push('Email is required');
    if (!form.companyName.trim()) validationErrors.push('Company name is required');
    if (form.bankIban.trim() && !swissIbanRegex.test(form.bankIban.trim().replaceAll(/\s/g, ''))) {
      validationErrors.push('IBAN must use a valid Swiss format');
    }
    if (form.mwstNumber.trim() && !swissMwstRegex.test(form.mwstNumber.trim())) {
      validationErrors.push('MWST number must use a valid Swiss format');
    }

    if (validationErrors.length > 0) {
      setFormError(validationErrors.join('. '));
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      companyPhone: form.companyPhone.trim() || undefined,
      companyAddress: form.companyAddress.trim() || undefined,
      bankIban: form.bankIban.trim() || undefined,
      mwstNumber: form.mwstNumber.trim() || undefined,
      commissionRate: Number(form.commissionRate || 19),
      facilityOptions: facilityOptionsToPayload(form.facilityOptionsText),
      transferService: {
        schedule: form.transferSchedule.trim() || undefined,
        vehicleType: form.transferVehicleType.trim() || undefined,
        capacity: form.transferCapacity ? Number(form.transferCapacity) : undefined,
      },
      photos: form.photos,
      taxId: form.taxId.trim() || undefined,
      address: form.address.trim() || undefined,
      website: form.website.trim() || undefined,
    };

    const endpoint = editingHost ? `/hosts/${editingHost.id}` : '/admin/hosts';
    const method = editingHost ? 'PATCH' : 'POST';
    const res = await apiCall(method, endpoint, payload);

    if (res.success) {
      setMessage(editingHost ? 'Host erfolgreich aktualisiert' : 'Host erfolgreich erstellt. Zugangsdaten wurden per E-Mail gesendet.');
      setShowFormModal(false);
      setEditingHost(null);
      setForm(emptyForm());
      loadHosts();
    } else {
      setFormError(res.error?.message || 'Fehler beim Speichern des Hosts');
    }
    setSaving(false);
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hosts verwalten</h1>
            <p className="text-sm text-gray-500 mt-1">Kommission, Stammdaten und Fotos pro Host pflegen.</p>
          </div>
          <Button onClick={openCreate} disabled={!!actionLoadingKey || rejectSubmitting}>+ Host erstellen</Button>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Provision</th>
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
                      <td className="py-3 px-4 text-gray-600">
                        <p>{host.company_name || '—'}</p>
                        {host.contact_person && <p className="text-xs text-gray-400">{host.contact_person}</p>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{Number(host.commission_rate ?? 19).toFixed(2)}%</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[host.verification_status] || 'gray'}>{host.verification_status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(host.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(host)}>Bearbeiten</Button>
                          <Button size="sm" variant="ghost" loading={actionLoadingKey === `details:${host.id}`} disabled={!!actionLoadingKey || rejectSubmitting} onClick={() => { void openHostDetails(host); }}>Details</Button>
                          {host.verification_status === 'pending' && (
                            <>
                              <Button size="sm" loading={actionLoadingKey === `approved:${host.id}`} disabled={!!actionLoadingKey || rejectSubmitting} onClick={() => { void handleVerify(host.id, 'approved'); }}>Genehmigen</Button>
                              <Button size="sm" variant="danger" loading={actionLoadingKey === `rejected:${host.id}`} disabled={!!actionLoadingKey || rejectSubmitting} onClick={() => { setRejectingHostId(host.id); setRejectReason(''); }}>Ablehnen</Button>
                            </>
                          )}
                          {host.verification_status === 'approved' && (
                            <Button size="sm" variant="secondary" loading={actionLoadingKey === `rejected:${host.id}`} disabled={!!actionLoadingKey || rejectSubmitting} onClick={() => { setRejectingHostId(host.id); setRejectReason(''); }}>Sperren</Button>
                          )}
                          {host.verification_status === 'rejected' && (
                            <Button size="sm" loading={actionLoadingKey === `approved:${host.id}`} disabled={!!actionLoadingKey || rejectSubmitting} onClick={() => { void handleVerify(host.id, 'approved'); }}>Reaktivieren</Button>
                          )}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Zurück</Button>
                <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Weiter</Button>
              </div>
            )}
          </Card>
        )}

        <Modal
          isOpen={showFormModal}
          onClose={() => { setShowFormModal(false); setEditingHost(null); setFormError(''); }}
          title={editingHost ? 'Host bearbeiten' : 'Neuen Host erstellen'}
          size="full"
          className='max-h-[90vh] overflow-auto'

        >
          <form onSubmit={handleSaveHost} className="space-y-4">
            {formError && <Alert variant="error" onClose={() => setFormError('')}>{formError}</Alert>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Vollständiger Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Telefonnummer" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Firmenname *" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Kontaktperson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              <Input label="Firmen-Telefon" value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} />
            </div>
            <Input label="Firmenadresse" value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} helperText="Für das Host-Profil und die Payout-Unterlagen" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Bankkonto (IBAN)" value={form.bankIban} onChange={(e) => setForm({ ...form, bankIban: e.target.value })} helperText="Swiss format, for example CH12 3456 7890 1234 5678 9" />
              <Input label="MWST Nummer" value={form.mwstNumber} onChange={(e) => setForm({ ...form, mwstNumber: e.target.value })} helperText="Swiss VAT format, for example CHE-123.456.789 MWST" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Kommission / Gebühr (%)" type="number" step="0.1" min="0" max="100" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
              <Input label="Transfer-Schedule" value={form.transferSchedule} onChange={(e) => setForm({ ...form, transferSchedule: e.target.value })} />
              <Input label="Fahrzeug-Typ" value={form.transferVehicleType} onChange={(e) => setForm({ ...form, transferVehicleType: e.target.value })} />
            </div>
            <Input label="Transfer-Kapazität" type="number" min="0" value={form.transferCapacity} onChange={(e) => setForm({ ...form, transferCapacity: e.target.value })} />
            <Input label="Ausstattung (kommagetrennt)" value={form.facilityOptionsText} onChange={(e) => setForm({ ...form, facilityOptionsText: e.target.value })} helperText="Beispiele: covered parking, security, EV charging" />
            <Input label="Steuer-ID" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <Input label="Standard-Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <ImageUpload
              images={form.photos}
              onChange={(photos) => setForm({ ...form, photos })}
              maxImages={3}
              accept="image/jpeg,image/png"
              allowedMimeTypes={['image/jpeg', 'image/png']}
              maxFileSizeMB={5}
              label="Host-Fotos"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" disabled={saving} onClick={() => { setShowFormModal(false); setEditingHost(null); setFormError(''); }}>Abbrechen</Button>
              <Button type="submit" loading={saving} disabled={saving}>{editingHost ? 'Speichern' : 'Host erstellen'}</Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!rejectingHostId} onClose={() => { setRejectingHostId(null); setRejectReason(''); }} title="Host ablehnen" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Bitte geben Sie den Ablehnungsgrund an. Dieser wird dem Host per E-Mail gesendet.</p>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">Ablehnungsgrund</label>
              <textarea id="reject-reason" rows={4} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setRejectingHostId(null); setRejectReason(''); }} disabled={rejectSubmitting || !!actionLoadingKey}>Abbrechen</Button>
              <Button type="button" variant="danger" loading={rejectSubmitting || (rejectingHostId ? actionLoadingKey === `rejected:${rejectingHostId}` : false)} disabled={rejectSubmitting || !!actionLoadingKey} onClick={() => { void handleRejectSubmit(); }}>Ablehnen</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={!!selectedHost} onClose={() => { setSelectedHost(null); setHistory([]); }} title="Host-Details" size="full">
          {selectedHost && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Name</p><p className="font-medium text-gray-900">{selectedHost.user_name || '—'}</p></div>
                <div><p className="text-gray-500">E-Mail</p><p className="font-medium text-gray-900">{selectedHost.user_email || '—'}</p></div>
                <div><p className="text-gray-500">Telefon</p><p className="font-medium text-gray-900">{selectedHost.user_phone || '—'}</p></div>
                <div><p className="text-gray-500">Status</p><Badge variant={statusColors[selectedHost.verification_status] || 'gray'}>{selectedHost.verification_status}</Badge></div>
                <div><p className="text-gray-500">Firma</p><p className="font-medium text-gray-900">{selectedHost.company_name || '—'}</p></div>
                <div><p className="text-gray-500">Kommission</p><p className="font-medium text-gray-900">{Number(selectedHost.commission_rate ?? 19).toFixed(2)}%</p></div>
                <div><p className="text-gray-500">Kontaktperson</p><p className="font-medium text-gray-900">{selectedHost.contact_person || '—'}</p></div>
                <div><p className="text-gray-500">IBAN</p><p className="font-medium text-gray-900">{selectedHost.bank_iban || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-gray-500">Adresse</p><p className="font-medium text-gray-900 whitespace-pre-line">{selectedHost.company_address || selectedHost.address || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-gray-500">Ausstattung</p><p className="font-medium text-gray-900">{renderFacilityOptions(selectedHost.facility_options) || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-gray-500">Transfer-Service</p><p className="font-medium text-gray-900">{selectedHost.transfer_service ? JSON.stringify(selectedHost.transfer_service) : '—'}</p></div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500 mb-2">Fotos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedHost.photos || []).length > 0 ? selectedHost.photos?.map((photo) => (
                      <div key={photo} className="relative h-20 w-full overflow-hidden rounded-lg">
                        <Image src={photo} alt="Host" fill className="object-cover" sizes="120px" />
                      </div>
                    )) : <p className="font-medium text-gray-900">—</p>}
                  </div>
                </div>
                <div><p className="text-gray-500">Registriert am</p><p className="font-medium text-gray-900">{formatDate(selectedHost.created_at)}</p></div>
                <div><p className="text-gray-500">Dokumente verifiziert</p><p className="font-medium text-gray-900">{selectedHost.documents_verified ? 'Ja' : 'Nein'}</p></div>
                <div className="sm:col-span-2"><p className="text-gray-500">Ablehnungsgrund</p><p className="font-medium text-gray-900">{selectedHost.rejection_reason || '—'}</p></div>
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
