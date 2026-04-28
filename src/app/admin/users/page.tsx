'use client';

import { useEffect, useState } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Button, Input, Select, Spinner, Alert, Modal } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  email_verified: boolean;
  created_at: string;
}

interface EditFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  role: string;
  status: string;
}

interface ConfirmationChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<{ id: string; payload: Record<string, unknown>; changes: ConfirmationChange[] } | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadUsers() {
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
    }
    loadUsers();
  }, [page, statusFilter, roleFilter, search, refreshKey]);

  const roleColors: Record<string, 'primary' | 'warning' | 'info' | 'gray'> = {
    admin: 'primary',
    host: 'warning',
    customer: 'info',
  };

  const statusColors: Record<string, 'success' | 'error' | 'gray'> = {
    active: 'success',
    suspended: 'error',
    inactive: 'gray',
    pending_verification: 'gray',
    deleted: 'gray',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH');

  const splitName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
    };
  };

  const openEditor = (user: UserRow) => {
    const { firstName, lastName } = splitName(user.name || '');
    setSelectedUser(user);
    setForm({
      firstName,
      lastName,
      email: user.email || '',
      phone: user.phone || '',
      emailVerified: !!user.email_verified,
      role: user.role || 'customer',
      status: user.status || 'active',
    });
  };

  const fieldLabels: Record<string, string> = {
    name: 'Name',
    email: 'E-Mail',
    phone: 'Telefonnummer',
    emailVerified: 'E-Mail verifiziert',
    role: 'Rolle',
    status: 'Status',
  };

  const formatValue = (value: unknown) => {
    if (typeof value === 'boolean') return value ? 'Verifiziert' : 'Unverifiziert';
    if (value == null || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  const requestSave = () => {
    if (!selectedUser || !form) return;
    const payload = {
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      emailVerified: form.emailVerified,
      role: form.role,
      status: form.status,
    };

    const changes: ConfirmationChange[] = [];
    const candidates: Array<[string, unknown, unknown]> = [
      ['name', selectedUser.name, payload.name],
      ['email', selectedUser.email, payload.email],
      ['phone', selectedUser.phone || '', payload.phone],
      ['emailVerified', selectedUser.email_verified, payload.emailVerified],
      ['role', selectedUser.role, payload.role],
      ['status', selectedUser.status, payload.status],
    ];

    for (const [field, oldValue, newValue] of candidates) {
      if (oldValue !== newValue) {
        changes.push({
          field,
          label: fieldLabels[field] || field,
          oldValue: formatValue(oldValue),
          newValue: formatValue(newValue),
        });
      }
    }

    setConfirmPayload({ id: selectedUser.id, payload, changes });
  };

  const handleSave = async () => {
    if (!confirmPayload) return;
    setSaving(true);
    setError('');
    const res = await apiCall('PATCH', `/users/${confirmPayload.id}`, confirmPayload.payload);
    if (res.success) {
      setMessage('Benutzer erfolgreich aktualisiert');
      setConfirmPayload(null);
      setSelectedUser(null);
      setForm(null);
      setRefreshKey((k) => k + 1);
    } else {
      setError(res.error?.message || 'Fehler beim Speichern');
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setError('');
    const res = await apiCall('POST', `/users/${resetTarget.id}/reset-password`);
    if (res.success) {
      setMessage('Passwort-Reset-E-Mail gesendet');
      setResetTarget(null);
    } else {
      setError(res.error?.message || 'Passwort-Reset fehlgeschlagen');
    }
    setResetting(false);
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Benutzer verwalten</h1>
            <p className="text-sm text-gray-500 mt-1">Änderungen werden nach Bestätigung geloggt.</p>
          </div>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

        <Card className="p-4 w-full">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-1">
              <Select
                value={roleFilter}
                onChange={(val) => { setRoleFilter(val); setPage(1); }}
                options={[
                  { value: 'all', label: 'Alle Rollen' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'host', label: 'Host' },
                  { value: 'customer', label: 'Customer' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Select
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                options={[
                  { value: 'all', label: 'Alle' },
                  { value: 'active', label: 'Aktiv' },
                  { value: 'suspended', label: 'Gesperrt' },
                  { value: 'inactive', label: 'Inaktiv' },
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
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Benutzer</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Rolle</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">E-Mail verifiziert</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Beigetreten</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={roleColors[u.role] || 'gray'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {u.email_verified ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[u.status] || 'gray'}>{u.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="secondary" onClick={() => openEditor(u)}>Bearbeiten</Button>
                          <Button size="sm" variant="ghost" onClick={() => setResetTarget(u)}>Passwort-Reset</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
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

        <Modal isOpen={!!selectedUser && !!form} onClose={() => { setSelectedUser(null); setForm(null); }} title="Benutzer bearbeiten" size="lg">
          {selectedUser && form && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Vorname" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <Input label="Nachname" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="E-Mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Telefonnummer" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Rolle"
                  value={form.role}
                  onChange={(value) => setForm({ ...form, role: value })}
                  options={[
                    { value: 'customer', label: 'Customer' },
                    { value: 'host', label: 'Host' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'super_admin', label: 'Super Admin' },
                  ]}
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  options={[
                    { value: 'active', label: 'Aktiv' },
                    { value: 'suspended', label: 'Gesperrt' },
                    { value: 'inactive', label: 'Inaktiv' },
                    { value: 'pending_verification', label: 'Ausstehend' },
                    { value: 'deleted', label: 'Gelöscht' },
                  ]}
                />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.emailVerified}
                  onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">E-Mail manuell als verifiziert markieren</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setSelectedUser(null)}>Abbrechen</Button>
                <Button onClick={requestSave}>Speichern</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={!!confirmPayload} onClose={() => setConfirmPayload(null)} title="Änderung bestätigen" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Die folgenden Felder werden gespeichert und im Audit-Log vermerkt.</p>
            <div className="space-y-2 text-sm">
              {(confirmPayload?.changes || []).length > 0 ? (
                confirmPayload?.changes.map((field) => (
                  <div key={field.field} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{field.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{field.oldValue} → {field.newValue}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Keine Änderungen erkannt.</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmPayload(null)}>Abbrechen</Button>
              <Button loading={saving} onClick={handleSave}>Bestätigen</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Passwort-Reset senden" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Passwort-Reset-E-Mail an {resetTarget?.email || 'den Benutzer'} senden?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setResetTarget(null)}>Abbrechen</Button>
              <Button loading={resetting} onClick={handleResetPassword}>Senden</Button>
            </div>
          </div>
        </Modal>
      </div>
    </FadeIn>
  );
}
