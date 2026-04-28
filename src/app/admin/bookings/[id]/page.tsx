'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Card, Alert, Spinner, Button, Input, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { getBookingStatusLabel, getBookingStatusVariant } from '@/lib/booking-status';

interface BookingDetail {
  id: string;
  booking_code: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  total_price: string | number;
  currency: string;
  car_plate?: string;
  car_model?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  listing_name?: string;
  location_name?: string;
  location_address?: string;
  location_phone?: string;
  created_at: string;
  payment_status?: string;
}

const formatDateTimeForInput = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const formatDateTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('de-CH', {
      timeZone: 'Europe/Zurich',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params.id;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ arrivalDateTime: '', returnDateTime: '' });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      const res = await apiCall<BookingDetail>('GET', `/admin/bookings/${bookingId}`);
      if (res.success && res.data) {
        setBooking(res.data);
        setForm({
          arrivalDateTime: formatDateTimeForInput(res.data.start_datetime),
          returnDateTime: formatDateTimeForInput(res.data.end_datetime),
        });
      } else {
        setError(res.error?.message || 'Buchung konnte nicht geladen werden.');
      }
      setLoading(false);
    }

    if (bookingId) {
      void loadBooking();
    }
  }, [bookingId]);

  const formattedTotal = useMemo(() => {
    if (!booking) return 'CHF 0.00';
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: booking.currency || 'CHF' }).format(Number(booking.total_price || 0));
  }, [booking]);

  const handleSaveDates = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    const res = await apiCall('PATCH', `/admin/bookings/${bookingId}/dates`, {
      arrivalDateTime: new Date(form.arrivalDateTime).toISOString(),
      returnDateTime: new Date(form.returnDateTime).toISOString(),
    });

    if (res.success) {
      setMessage('Buchungsdaten wurden aktualisiert.');
      const refreshed = await apiCall<BookingDetail>('GET', `/admin/bookings/${bookingId}`);
      if (refreshed.success && refreshed.data) {
        setBooking(refreshed.data);
      }
    } else {
      setError(res.error?.message || 'Buchungsdaten konnten nicht gespeichert werden.');
    }

    setSaving(false);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    setMessage('');
    setError('');

    const res = await apiCall('POST', `/admin/bookings/${bookingId}/cancel`, {
      reason: cancelReason,
    });

    if (res.success) {
      setMessage('Buchung wurde storniert.');
      const refreshed = await apiCall<BookingDetail>('GET', `/admin/bookings/${bookingId}`);
      if (refreshed.success && refreshed.data) {
        setBooking(refreshed.data);
      }
    } else {
      setError(res.error?.message || 'Buchung konnte nicht storniert werden.');
    }

    setCancelling(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!booking) {
    return <div className="text-center py-20 text-gray-500">Buchung nicht gefunden</div>;
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buchung {booking.booking_code}</h1>
            <p className="text-sm text-gray-500">{booking.listing_name || booking.location_name || '—'}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/admin/bookings')}>Zurück</Button>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')}>{message}</Alert>}
        {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 sm:p-6 xl:col-span-2 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={getBookingStatusVariant(booking.status)}>{getBookingStatusLabel(booking.status)}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Betrag</p>
                <p className="text-lg font-semibold text-gray-900">{formattedTotal}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Kunde</p>
                <p className="font-medium text-gray-900">{booking.customer_name || '—'}</p>
                <p className="text-gray-500">{booking.customer_email || '—'}</p>
                <p className="text-gray-500">{booking.customer_phone || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Fahrzeug</p>
                <p className="font-medium text-gray-900">{booking.car_plate || '—'}</p>
                <p className="text-gray-500">{booking.car_model || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Anreise</p>
                <p className="font-medium text-gray-900">{formatDateTime(booking.start_datetime)}</p>
              </div>
              <div>
                <p className="text-gray-500">Abreise</p>
                <p className="font-medium text-gray-900">{formatDateTime(booking.end_datetime)}</p>
              </div>
              <div>
                <p className="text-gray-500">Parkplatz</p>
                <p className="font-medium text-gray-900">{booking.location_name || booking.listing_name || '—'}</p>
                <p className="text-gray-500">{booking.location_address || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Zahlung</p>
                <p className="font-medium text-gray-900">{booking.payment_status || '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Buchung ändern</h2>
              <p className="text-sm text-gray-500">Neue Ankunfts- und Rückgabezeiten setzen.</p>
            </div>
            <Input
              label="Neue Ankunft"
              type="datetime-local"
              value={form.arrivalDateTime}
              onChange={(e) => setForm({ ...form, arrivalDateTime: e.target.value })}
            />
            <Input
              label="Neue Rückgabe"
              type="datetime-local"
              value={form.returnDateTime}
              onChange={(e) => setForm({ ...form, returnDateTime: e.target.value })}
            />
            <Button onClick={handleSaveDates} loading={saving} disabled={saving || !form.arrivalDateTime || !form.returnDateTime} className="w-full sm:w-auto">
              Daten speichern
            </Button>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Buchung stornieren</h2>
              <p className="text-sm text-gray-500">Nur mit Begründung.</p>
            </div>
            <Input
              label="Stornierungsgrund"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Warum wird die Buchung storniert?"
            />
            <Button variant="danger" onClick={handleCancelBooking} loading={cancelling} disabled={cancelling || !cancelReason.trim()} className="w-full sm:w-auto">
              Buchung stornieren
            </Button>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}