'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Card, Badge, Spinner, Button } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import Link from 'next/link';

interface BookingDetail {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location_name: string;
  location_address: string;
  location_images?: string;
  location_phone?: string;
  check_in_instructions?: string;
  start_datetime: string;
  end_datetime: string;
  arrival_lot_datetime: string;
  car_plate: string;
  car_model?: string;
  passengers: number;
  luggage: number;
  outbound_flight_no?: string;
  return_flight_no?: string;
  base_price: string | number;
  discount_applied: string | number;
  service_fee: string | number;
  addons_total: string | number;
  platform_commission: string | number;
  host_payout: string | number;
  total_price: string | number;
  currency: string;
  status: string;
  payment_status: string;
  child_seat_required?: boolean;
  wheelchair_assistance?: boolean;
  special_notes?: string;
  addons?: string;
  created_at: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      const res = await apiCall<BookingDetail>('GET', `/bookings/${bookingId}`);
      if (res.success && res.data) setBooking(res.data);
      setLoading(false);
    }
    loadBooking();
  }, [bookingId, refreshKey]);

  const handleCancel = async () => {
    if (!confirm('Möchten Sie diese Buchung wirklich stornieren?')) return;
    setCancelling(true);
    const res = await apiCall('POST', `/bookings/${bookingId}/cancel`, {});
    if (res.success) {
      setRefreshKey(k => k + 1);
    }
    setCancelling(false);
  };

  const formatCurrency = (val: number, currency = 'CHF') =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(val);

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'> = {
    draft: 'gray',
    pending_payment: 'warning',
    pending_approval: 'warning',
    confirmed: 'success',
    checked_in: 'primary',
    completed: 'info',
    cancelled: 'error',
    refunded: 'error',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Entwurf',
    pending_payment: 'Zahlung ausstehend',
    pending_approval: 'Wartet auf Genehmigung',
    confirmed: 'Bestätigt',
    checked_in: 'Eingecheckt',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    refunded: 'Erstattet',
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Buchung nicht gefunden</p>
        <Link href="/account/bookings" className="text-baby-blue-600 hover:underline mt-2 inline-block">
          Zurück zu Buchungen
        </Link>
      </div>
    );
  }

  const paymentVariant = (status: string) => {
    if (status === 'succeeded') return 'success' as const;
    if (status === 'refunded') return 'error' as const;
    if (status === 'failed') return 'error' as const;
    return 'warning' as const;
  };
  const paymentLabel = (status: string) => {
    if (status === 'succeeded') return 'Bezahlt';
    if (status === 'refunded') return 'Erstattet';
    if (status === 'failed') return 'Fehlgeschlagen';
    return 'Ausstehend';
  };

  const canCancel = ['confirmed', 'pending_payment'].includes(booking.status);

  // Calculate total days from start/end dates
  const totalDays = (() => {
    const start = new Date(booking.start_datetime);
    const end = new Date(booking.end_datetime);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  return (
    <FadeIn>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/account/bookings" className="text-sm text-baby-blue-600 hover:underline">
              ← Zurück zu Buchungen
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Buchung {booking.booking_code}</h1>
          </div>
          <Badge variant={statusColors[booking.status] || 'gray'} className="text-base px-4 py-1">
            {statusLabels[booking.status] || booking.status}
          </Badge>
        </div>

        {/* Parking Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parkplatz</h2>
          <div className="space-y-2">
            <p className="font-medium text-gray-900">{booking.location_name}</p>
            {booking.location_address && (
              <p className="text-sm text-gray-500">{booking.location_address}</p>
            )}
          </div>
        </Card>

        {/* Dates & Vehicle */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungsdetails</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Anreise</p>
              <p className="font-medium">{new Date(booking.start_datetime).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Abreise</p>
              <p className="font-medium">{new Date(booking.end_datetime).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Ankunftszeit</p>
              <p className="font-medium">{booking.arrival_lot_datetime ? new Date(booking.arrival_lot_datetime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Dauer</p>
              <p className="font-medium">{totalDays} Tage</p>
            </div>
            <div>
              <p className="text-gray-500">Fahrzeug</p>
              <p className="font-medium">{booking.car_plate}</p>
              {booking.car_model && <p className="text-xs text-gray-400">{booking.car_model}</p>}
            </div>
            <div>
              <p className="text-gray-500">Passagiere / Gepäck</p>
              <p className="font-medium">{booking.passengers} Pax / {booking.luggage} Gepäck</p>
            </div>
            {booking.outbound_flight_no && (
              <div>
                <p className="text-gray-500">Hinflug</p>
                <p className="font-medium">{booking.outbound_flight_no}</p>
              </div>
            )}
            {booking.return_flight_no && (
              <div>
                <p className="text-gray-500">Rückflug</p>
                <p className="font-medium">{booking.return_flight_no}</p>
              </div>
            )}
          </div>
          {(booking.child_seat_required || booking.wheelchair_assistance || booking.special_notes) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm mb-2">Sonderwünsche</p>
              <div className="flex flex-wrap gap-2">
                {booking.child_seat_required && (
                  <Badge variant="info">Kindersitz</Badge>
                )}
                {booking.wheelchair_assistance && (
                  <Badge variant="info">Rollstuhlhilfe</Badge>
                )}
                {booking.special_notes && (
                  <p className="text-sm text-gray-600 w-full">{booking.special_notes}</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kosten</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Grundpreis ({totalDays} Tage)</span>
              <span>{formatCurrency(Number(booking.base_price) || 0, booking.currency)}</span>
            </div>
            {Number(booking.discount_applied) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Rabatt</span>
                <span>-{formatCurrency(Number(booking.discount_applied), booking.currency)}</span>
              </div>
            )}
            {Number(booking.addons_total) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Zusatzleistungen</span>
                <span>{formatCurrency(Number(booking.addons_total), booking.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Servicegebühr</span>
              <span>{formatCurrency(Number(booking.service_fee) || 0, booking.currency)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-base">
              <span>Gesamtbetrag</span>
              <span>{formatCurrency(Number(booking.total_price) || 0, booking.currency)}</span>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant={paymentVariant(booking.payment_status)}>
              {paymentLabel(booking.payment_status)}
            </Badge>
          </div>
        </Card>

        {/* Actions */}
        {canCancel && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleCancel} loading={cancelling}>
              Buchung stornieren
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
