'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner } from '@/components/ui';
import { FadeIn } from '@/components/animations';

interface Payout {
  id: string;
  host_id: string;
  amount: string | number;
  commission_amount: string | number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  booking_count: number;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

interface PayoutSummary {
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  totalServiceFees: number;
  totalPayout: number;
  totalPaid: number;
  currency: string;
}

export default function HostPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [payoutsRes, summaryRes] = await Promise.all([
          apiCall<{ payouts: Payout[]; total: number }>('GET', `/payouts/host?page=${page}&limit=20`),
          apiCall<PayoutSummary>('GET', '/payouts/host/summary'),
        ]);
        if (payoutsRes.success && payoutsRes.data) {
          const rawData = payoutsRes.data as unknown;
          const pData = Array.isArray(rawData) ? rawData : (rawData as Record<string, unknown>).payouts as Payout[] || [];
          setPayouts(pData as Payout[]);
        }
        if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      } catch (err) {
        console.error('Failed to load payout data', err);
      }
      setLoading(false);
    }
    loadData();
  }, [page]);

  const formatCurrency = (val: number, currency = 'CHF') =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(val);

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'error',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Auszahlungen</h1>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-gray-500">Bereits ausgezahlt</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(Number(summary.totalPaid) || 0)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Ausstehend</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {formatCurrency(Number(summary.totalPayout) || 0)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Einnahmen (Gesamt)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency((Number(summary.totalPaid) || 0) + (Number(summary.totalPayout) || 0))}
              </p>
            </Card>
          </div>
        )}

        {/* Payouts List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Beschreibung</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Buchungen</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Betrag</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Datum</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {payout.notes || `Auszahlung #${payout.id.slice(0, 8)}`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payout.booking_count || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusColors[payout.status] || 'gray'}>
                        {statusLabels[payout.status] || payout.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(Number(payout.amount) || 0, payout.currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString('de-CH')}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Noch keine Auszahlungen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}
