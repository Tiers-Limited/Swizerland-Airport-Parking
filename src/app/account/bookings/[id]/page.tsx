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
  listing_name: string;
  listing_address: string;
  start_date: string;
  end_date: string;
  arrival_time: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_color?: string;
  passenger_count: number;
  luggage_count: number;
  outbound_flight?: string;
  return_flight?: string;
  return_flight_arrival?: string;
  total_days: number;
  base_price: number;
  discount_amount: number;
  service_fee: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  special_requests?: {
    child_seat?: boolean;
    wheelchair_assistance?: boolean;
    notes?: string;
  };
  outbound_shuttle?: ShuttleInfo;
  return_shuttle?: ShuttleInfo;
  created_at: string;
}

interface ShuttleInfo {
  id: string;
  direction: string;
  scheduled_departure: string;
  actual_departure?: string;
  actual_arrival?: string;
  status: string;
  vehicle_plate?: string;
  driver_name?: string;
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
    const res = await apiCall('PATCH', `/bookings/${bookingId}/cancel`, {});
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
    confirmed: 'success',
    checked_in: 'primary',
    completed: 'info',
    cancelled: 'error',
    refunded: 'error',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Entwurf',
    pending_payment: 'Zahlung ausstehend',
    confirmed: 'Bestätigt',
    checked_in: 'Eingecheckt',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    refunded: 'Erstattet',
  };

  const shuttleStatusLabels: Record<string, string> = {
    planned: 'Geplant',
    boarding: 'Boarding',
    en_route: 'Unterwegs',
    completed: 'Angekommen',
    cancelled: 'Storniert',
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
    if (status === 'paid') return 'success' as const;
    if (status === 'refunded') return 'error' as const;
    return 'warning' as const;
  };
  const paymentLabel = (status: string) => {
    if (status === 'paid') return 'Bezahlt';
    if (status === 'refunded') return 'Erstattet';
    return 'Ausstehend';
  };

  const canCancel = ['confirmed', 'pending_payment'].includes(booking.status);

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
            <p className="font-medium text-gray-900">{booking.listing_name}</p>
            {booking.listing_address && (
              <p className="text-sm text-gray-500">{booking.listing_address}</p>
            )}
          </div>
        </Card>

        {/* Dates & Vehicle */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungsdetails</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Anreise</p>
              <p className="font-medium">{new Date(booking.start_date).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Abreise</p>
              <p className="font-medium">{new Date(booking.end_date).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-gray-500">Ankunftszeit</p>
              <p className="font-medium">{booking.arrival_time}</p>
            </div>
            <div>
              <p className="text-gray-500">Dauer</p>
              <p className="font-medium">{booking.total_days} Tage</p>
            </div>
            <div>
              <p className="text-gray-500">Fahrzeug</p>
              <p className="font-medium">{booking.vehicle_plate}</p>
              {booking.vehicle_model && <p className="text-xs text-gray-400">{booking.vehicle_model} {booking.vehicle_color}</p>}
            </div>
            <div>
              <p className="text-gray-500">Passagiere / Gepäck</p>
              <p className="font-medium">{booking.passenger_count} Pax / {booking.luggage_count} Gepäck</p>
            </div>
            {booking.outbound_flight && (
              <div>
                <p className="text-gray-500">Hinflug</p>
                <p className="font-medium">{booking.outbound_flight}</p>
              </div>
            )}
            {booking.return_flight && (
              <div>
                <p className="text-gray-500">Rückflug</p>
                <p className="font-medium">{booking.return_flight}</p>
                {booking.return_flight_arrival && (
                  <p className="text-xs text-gray-400">Ankunft: {booking.return_flight_arrival}</p>
                )}
              </div>
            )}
          </div>
          {booking.special_requests && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm mb-2">Sonderwünsche</p>
              <div className="flex flex-wrap gap-2">
                {booking.special_requests.child_seat && (
                  <Badge variant="info">Kindersitz</Badge>
                )}
                {booking.special_requests.wheelchair_assistance && (
                  <Badge variant="info">Rollstuhlhilfe</Badge>
                )}
                {booking.special_requests.notes && (
                  <p className="text-sm text-gray-600 w-full">{booking.special_requests.notes}</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Shuttle Status */}
        {(booking.outbound_shuttle || booking.return_shuttle) && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shuttle-Status</h2>
            <div className="space-y-4">
              {booking.outbound_shuttle && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">→ Zum Flughafen</p>
                    <p className="text-sm text-gray-500">
                      Geplant: {new Date(booking.outbound_shuttle.scheduled_departure).toLocaleString('de-CH')}
                    </p>
                    {booking.outbound_shuttle.driver_name && (
                      <p className="text-xs text-gray-400">Fahrer: {booking.outbound_shuttle.driver_name}</p>
                    )}
                  </div>
                  <Badge variant={statusColors[booking.outbound_shuttle.status] || 'gray'}>
                    {shuttleStatusLabels[booking.outbound_shuttle.status] || booking.outbound_shuttle.status}
                  </Badge>
                </div>
              )}
              {booking.return_shuttle && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">← Zum Parkplatz</p>
                    <p className="text-sm text-gray-500">
                      Geplant: {new Date(booking.return_shuttle.scheduled_departure).toLocaleString('de-CH')}
                    </p>
                    {booking.return_shuttle.driver_name && (
                      <p className="text-xs text-gray-400">Fahrer: {booking.return_shuttle.driver_name}</p>
                    )}
                  </div>
                  <Badge variant={statusColors[booking.return_shuttle.status] || 'gray'}>
                    {shuttleStatusLabels[booking.return_shuttle.status] || booking.return_shuttle.status}
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kosten</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Grundpreis ({booking.total_days} Tage)</span>
              <span>{formatCurrency(booking.base_price, booking.currency)}</span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Rabatt</span>
                <span>-{formatCurrency(booking.discount_amount, booking.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Servicegebühr</span>
              <span>{formatCurrency(booking.service_fee, booking.currency)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-base">
              <span>Gesamtbetrag</span>
              <span>{formatCurrency(booking.total_price, booking.currency)}</span>
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
