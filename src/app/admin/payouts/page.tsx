'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Select, Spinner, Button, Alert } from '@/components/ui';
import { FadeIn } from '@/components/animations';

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
}

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pendingPayouts, setPendingPayouts] = useState<PendingHostPayout[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCurrency = (val: number, currency = 'CHF') =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(val);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('de-CH') : '—';

  const loadPending = useCallback(async () => {
    setLoading(true);
    const res = await apiCall<PendingHostPayout[]>('GET', '/payouts/pending');
    if (res.success && res.data) {
      setPendingPayouts(Array.isArray(res.data.hosts) ? res.data.hosts : []);
    }
    setLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await apiCall<{ payouts: PayoutRow[]; total: number; totalPages: number; page: number }>('GET', `/payouts/list?${params}`);
    if (res.success && res.data) {
      const raw = res.data as unknown as Record<string, unknown>;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw.payouts) ? raw.payouts : [];
      setPayoutHistory(list as PayoutRow[]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (tab === 'pending') loadPending();
    else loadHistory();
  }, [tab, loadPending, loadHistory]);

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
    if (!globalThis.confirm('Sind Sie sicher? Dies macht die Auszahlung rückgängig.')) return;
    setProcessing(payoutId);
    const res = await apiCall('POST', `/payouts/${payoutId}/fail`, { reason: 'Manuell abgelehnt' });
    if (res.success) {
      setSuccess('Auszahlung als fehlgeschlagen markiert.');
      loadHistory();
    } else {
      setError(res.error?.message || 'Fehler.');
    }
    setProcessing(null);
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
                                  onClick={() => handleFailPayout(p.id)}
                                  disabled={!!processing}
                                >
                                  Ablehnen
                                </Button>
                              )}
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
    </FadeIn>
  );
}
