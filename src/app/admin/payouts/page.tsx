'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, apiCall } from '@/lib/api';
import { Card, Badge, Select, Spinner, Button, Alert, Modal } from '@/components/ui';
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

interface PendingBooking {
  id: string;
  booking_code: string;
  total_price: string | number;
  platform_commission: string | number;
  host_payout: string | number;
  service_fee: string | number;
  addons_total: string | number;
  currency: string;
  status: string;
  created_at: string;
  start_datetime: string;
  end_datetime: string;
  location_name: string;
  host_id: string;
  company_name: string;
  commission_rate: string | number;
  host_name: string;
  host_email: string;
}

interface PendingHostPayout {
  hostId: string;
  hostName: string;
  hostEmail: string;
  companyName: string | null;
  commissionRate: number;
  bookings: PendingBooking[];
  totalRevenue: number;
  totalCommission: number;
  totalAddons: number;
  totalPayout: number;
}

interface PayoutRow {
  id: string;
  host_id: string;
  host_name?: string;
  amount: number;
  commission_amount: number;
  currency: string;
  status: string;
  booking_count: number;
  notes?: string;
  created_at: string;
  processed_at?: string;
  statement_generated_at?: string;
}

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pendingPayouts, setPendingPayouts] = useState<PendingHostPayout[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const defaultRange = useMemo(() => getPresetRange('thisMonth'), []);
  const [range, setRange] = useState<AdminDateRangeValue>(defaultRange);
  const [appliedRange, setAppliedRange] = useState<AdminDateRangeValue>(defaultRange);
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [failTarget, setFailTarget] = useState<string | null>(null);

  const formatCurrency = (val: number, currency = 'CHF') =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(val);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('de-CH') : '—';

  const loadPending = useCallback(async (activeRange: AdminDateRangeValue = appliedRange) => {
    setLoading(true);
    // API sometimes returns { hosts: PendingHostPayout[] } or directly PendingHostPayout[]
    const params = new URLSearchParams({ fromDate: activeRange.fromDate, toDate: activeRange.toDate });
    const res = await apiCall('GET', `/payouts/pending?${params}`);
    if (res.success && res.data) {
      const data = res.data as unknown;
      type HostsWrapper = { hosts?: unknown };
      let hosts: PendingHostPayout[] = [];

      if (Array.isArray(data)) {
        hosts = data as PendingHostPayout[];
      } else if (typeof data === 'object' && data !== null && 'hosts' in (data as HostsWrapper)) {
        const wrapper = data as HostsWrapper;
        if (Array.isArray(wrapper.hosts)) hosts = wrapper.hosts as PendingHostPayout[];
      }

      setPendingPayouts(hosts);
    }
    setLoading(false);
  }, [appliedRange]);

  const loadHistory = useCallback(async (activeRange: AdminDateRangeValue = appliedRange) => {
    setLoading(true);
    const params = new URLSearchParams({ fromDate: activeRange.fromDate, toDate: activeRange.toDate });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await apiCall<{ payouts: PayoutRow[]; total: number; totalPages: number; page: number }>('GET', `/payouts/list?${params}`);
    if (res.success && res.data) {
      const data = res.data as unknown;
      type PayoutsWrapper = { payouts?: unknown };
      let list: PayoutRow[] = [];

      if (Array.isArray(data)) {
        list = data as PayoutRow[];
      } else if (typeof data === 'object' && data !== null && 'payouts' in (data as PayoutsWrapper)) {
        const wrapper = data as PayoutsWrapper;
        if (Array.isArray(wrapper.payouts)) list = wrapper.payouts as PayoutRow[];
      }

      setPayoutHistory(list);
    }
    setLoading(false);
  }, [statusFilter, appliedRange]);

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
    const timer = setTimeout(() => {
      if (tab === 'pending') loadPending();
      else loadHistory();
    }, 0);

    return () => clearTimeout(timer);
  }, [tab, hydrated, loadPending, loadHistory]);

  const handleApplyRange = () => {
    storeAdminRange(range);
    setAppliedRange(range);
  };

  const handleResetRange = () => {
    clearStoredAdminRange();
    setRange(defaultRange);
    setAppliedRange(defaultRange);
  };

  const handleCreatePayout = async (host: PendingHostPayout) => {
    setProcessing(host.hostId);
    setError('');
    setSuccess('');
    try {
      const bookingIds = host.bookings.map(b => b.id);
      const res = await apiCall<{ payout: PayoutRow }>('POST', '/payouts', {
        hostId: host.hostId,
        bookingIds,
        notes: `Auszahlung für ${host.bookings.length} Buchung(en)`,
      });
      if (res.success) {
        setSuccess(`Auszahlung von ${formatCurrency(host.totalPayout)} für ${host.hostName || host.companyName} erstellt.`);
        loadPending();
      } else {
        setError(res.error?.message || 'Auszahlung konnte nicht erstellt werden.');
      }
    } catch {
      setError('Fehler beim Erstellen der Auszahlung.');
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    setProcessing(payoutId);
    setError('');
    try {
      const res = await apiCall('POST', `/payouts/${payoutId}/process`);
      if (res.success) {
        setSuccess('Auszahlung als abgeschlossen markiert.');
        loadHistory();
      } else {
        setError(res.error?.message || 'Verarbeitung fehlgeschlagen.');
      }
    } catch {
      setError('Fehler bei der Verarbeitung.');
    } finally {
      setProcessing(null);
    }
  };

  const handleFailPayout = async (payoutId: string) => {
    setProcessing(payoutId);
    const res = await apiCall('POST', `/payouts/${payoutId}/fail`, { reason: 'Manuell abgelehnt' });
    if (res.success) {
      setSuccess('Auszahlung als fehlgeschlagen markiert.');
      loadHistory();
    } else {
      setError(res.error?.message || 'Fehler.');
    }
    setProcessing(null);
    setFailTarget(null);
  };

  const handleDownloadStatement = async (payoutId: string, fileName?: string) => {
    setProcessing(payoutId);
    setError('');
    try {
      const response = await api.get(`/payouts/${payoutId}/statement`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = globalThis.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || `payout-statement-${payoutId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      globalThis.URL.revokeObjectURL(url);
      setSuccess('Auszug wurde heruntergeladen.');
    } catch {
      setError('Statement konnte nicht geladen werden.');
    } finally {
      setProcessing(null);
    }
  };

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'gray' | 'primary'> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'error',
  };

  // Summary stats
  const totalPendingRevenue = pendingPayouts.reduce((s, p) => s + (p.totalRevenue || 0), 0);
  const totalPendingCommission = pendingPayouts.reduce((s, p) => s + (p.totalCommission || 0), 0);
  const totalPendingPayout = pendingPayouts.reduce((s, p) => s + (p.totalPayout || 0), 0);
  const totalPendingBookings = pendingPayouts.reduce((s, p) => s + (p.bookings?.length || 0), 0);

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Auszahlungen</h1>
          <div className="flex gap-2">
            <Button
              variant={tab === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('pending')}
            >
              Ausstehend
            </Button>
            <Button
              variant={tab === 'history' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab('history')}
            >
              Verlauf
            </Button>
          </div>
        </div>

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

        {success && <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

        {tab === 'pending' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="md">
                <p className="text-sm text-gray-500">Hosts mit Auszahlungen</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayouts.length}</p>
              </Card>
              <Card padding="md">
                <p className="text-sm text-gray-500">Ausstehende Buchungen</p>
                <p className="text-2xl font-bold text-gray-900">{totalPendingBookings}</p>
              </Card>
              <Card padding="md">
                <p className="text-sm text-gray-500">Einnahmen (Brutto)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendingRevenue)}</p>
              </Card>
              <Card padding="md">
                <p className="text-sm text-gray-500">Kommission</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPendingCommission)}</p>
                <p className="text-xs text-gray-400 mt-1">Auszahlung: {formatCurrency(totalPendingPayout)}</p>
              </Card>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            )}
            {!loading && pendingPayouts.length === 0 && (
              <Card padding="lg" className="text-center">
                <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="font-medium text-gray-900 mb-1">Keine ausstehenden Auszahlungen</h3>
                <p className="text-sm text-gray-500">Alle Hosts wurden bezahlt.</p>
              </Card>
            )}
            {!loading && pendingPayouts.length > 0 && (
              <div className="space-y-4">
                {pendingPayouts.map((host) => (
                  <Card key={host.hostId} padding="none">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {host.companyName || host.hostName}
                            </h3>
                            <Badge variant="warning" size="sm">
                              {host.bookings?.length || 0} Buchung(en)
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">{host.hostEmail}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Einnahmen</p>
                              <p className="font-medium text-gray-900">{formatCurrency(host.totalRevenue || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Kommission ({host.commissionRate}%)</p>
                              <p className="font-medium text-green-600">{formatCurrency(host.totalCommission || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Auszahlung</p>
                              <p className="font-bold text-gray-900 text-lg">{formatCurrency(host.totalPayout || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Zusatzleistungen</p>
                              <p className="font-medium text-gray-900">{formatCurrency(host.totalAddons || 0)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Button
                            onClick={() => handleCreatePayout(host)}
                            loading={processing === host.hostId}
                            disabled={!!processing}
                          >
                            Auszahlung erstellen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            <Card className="p-4">
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'all', label: 'Alle Status' },
                  { value: 'pending', label: 'Ausstehend' },
                  { value: 'processing', label: 'In Bearbeitung' },
                  { value: 'completed', label: 'Abgeschlossen' },
                  { value: 'failed', label: 'Fehlgeschlagen' },
                ]}
              />
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Host</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Kommission</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Auszahlung</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Buchungen</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Erstellt</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutHistory.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-gray-900">{p.host_name || p.host_id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">{formatCurrency(p.commission_amount)}</td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-4 text-gray-600">{p.booking_count}</td>
                          <td className="py-3 px-4">
                            <Badge variant={statusColors[p.status] || 'gray'}>{p.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">
                            <p>{formatDate(p.created_at)}</p>
                            {p.processed_at && <p className="text-green-600">{formatDate(p.processed_at)}</p>}
                            {p.statement_generated_at && <p className="text-gray-500">Statement: {formatDate(p.statement_generated_at)}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {p.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleProcessPayout(p.id)}
                                  loading={processing === p.id}
                                  disabled={!!processing}
                                >
                                  Abschliessen
                                </Button>
                              )}
                              {['pending', 'processing'].includes(p.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => setFailTarget(p.id)}
                                  disabled={!!processing}
                                >
                                  Ablehnen
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadStatement(p.id, `payout-statement-${p.id}.pdf`)}
                                loading={processing === p.id}
                                disabled={!!processing}
                              >
                                Statement
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {payoutHistory.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-gray-400">Keine Auszahlungen gefunden</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Fail Payout Confirmation Modal */}
      <Modal isOpen={!!failTarget} onClose={() => setFailTarget(null)} title="Auszahlung ablehnen" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sind Sie sicher? Dies macht die Auszahlung rückgängig.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFailTarget(null)}>Abbrechen</Button>
            <Button variant="danger" onClick={() => failTarget && handleFailPayout(failTarget)}>Ablehnen</Button>
          </div>
        </div>
      </Modal>
    </FadeIn>
  );
}
