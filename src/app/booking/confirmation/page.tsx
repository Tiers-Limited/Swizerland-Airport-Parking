'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Spinner } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiCall } from '@/lib/api';

interface BookingAddonLine {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface BookingDetail {
  id: string;
  booking_code: string;
  start_datetime: string;
  end_datetime: string;
  arrival_lot_datetime: string;
  car_plate: string;
  car_model?: string;
  passengers: number;
  luggage: number;
  outbound_flight_no?: string;
  return_flight_no?: string;
  special_notes?: string;
  base_price: number;
  discount_amount: number;
  service_fee: number;
  total_price: number;
  addons?: BookingAddonLine[];
  addons_total?: number;
  currency: string;
  status: string;
  location_name?: string;
  location_address?: string;
  location_phone?: string;
  customer_email?: string;
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const bookingCode = searchParams.get('code') || '';

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooking = useCallback(async () => {
    if (!bookingId && !bookingCode) {
      setError('Kein Buchungscode angegeben.');
      setLoading(false);
      return;
    }

    try {
      let res;
      if (bookingId) {
        res = await apiCall<BookingDetail>('GET', `/bookings/${bookingId}`);
      } else {
        res = await apiCall<BookingDetail>('GET', `/bookings/code/${bookingCode}`);
      }

      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError('Buchung konnte nicht geladen werden.');
      }
    } catch {
      setError('Fehler beim Laden der Buchungsdetails.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, bookingCode]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const days = booking
    ? Math.ceil((new Date(booking.end_datetime).getTime() - new Date(booking.start_datetime).getTime()) / (1000 * 60 * 60 * 24)) || 1
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center"><Spinner size="lg" /></main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <p className="text-gray-600 mb-4">{error || 'Buchung nicht gefunden.'}</p>
            <Link href="/zurich"><Button>Zurück zur Suche</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const arrivalTime = booking.arrival_lot_datetime
    ? new Date(booking.arrival_lot_datetime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buchung bestätigt!</h1>
            <p className="text-gray-600">
              Ihre Parkplatzreservierung wurde erfolgreich erstellt.
            </p>
          </div>

          {/* Booking Code */}
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Ihr Buchungscode</p>
              <p className="text-3xl font-bold text-primary-600 tracking-wider">{booking.booking_code}</p>
              <p className="text-sm text-gray-500 mt-2">
                Zeigen Sie diesen Code bei Ihrer Ankunft am Parkplatz vor
              </p>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Buchungsdetails</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(booking.start_datetime)}
                    </p>
                    <p className="text-sm text-gray-600">Ankunft um {arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(booking.end_datetime)}
                    </p>
                    <p className="text-sm text-gray-600">{days} Tage</p>
                  </div>
                </div>
              </div>

              {booking.location_name && (
                <div className="border-t pt-6">
                  <h2 className="font-semibold text-gray-900 text-lg mb-4">Parkanlage</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{booking.location_name}</h3>
                      {booking.location_address && <p className="text-sm text-gray-600">{booking.location_address}</p>}
                      {booking.location_phone && <p className="text-sm text-gray-600">Telefon: {booking.location_phone}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Fahrzeug & Passagiere</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Kennzeichen</p>
                    <p className="font-medium text-gray-900">{booking.car_plate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passagiere</p>
                    <p className="font-medium text-gray-900">{booking.passengers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gepäck</p>
                    <p className="font-medium text-gray-900">{booking.luggage} Stücke</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown with Add-ons */}
              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Preisübersicht</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Parkgebühr ({days} Tage)</span>
                    <span className="text-gray-900">{formatCurrency(booking.base_price, booking.currency)}</span>
                  </div>
                  {booking.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabatt</span>
                      <span>-{formatCurrency(booking.discount_amount, booking.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicegebühr</span>
                    <span className="text-gray-900">{formatCurrency(booking.service_fee, booking.currency)}</span>
                  </div>
                  {booking.addons && booking.addons.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Zusatzleistungen</p>
                      </div>
                      {booking.addons.map((addon) => (
                        <div key={addon.addon_id} className="flex justify-between">
                          <span className="text-gray-500">
                            {addon.name}{addon.quantity > 1 ? ` ×${addon.quantity}` : ''}
                          </span>
                          <span className="text-gray-900">{formatCurrency(addon.total, booking.currency)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Gesamtbetrag</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(booking.total_price, booking.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Wie geht es weiter?</h2>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Am Parkplatz ankommen</p>
                    <p className="text-sm text-gray-600">
                      Fahren Sie am {formatDate(booking.start_datetime)} gegen {arrivalTime}{booking.location_address ? ` zur ${booking.location_address}` : ''}.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Mit Buchungscode einchecken</p>
                    <p className="text-sm text-gray-600">
                      Zeigen Sie Ihren Buchungscode ({booking.booking_code}) an der Rezeption.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Zum Flughafen fahren</p>
                    <p className="text-sm text-gray-600">
                      Nutzen Sie den öffentlichen Nahverkehr oder den Transfer des Parkplatzbetreibers zum Terminal.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold shrink-0">4</div>
                  <div>
                    <p className="font-medium text-gray-900">Rückkehr und Auto abholen</p>
                    <p className="text-sm text-gray-600">
                      Nach der Landung kehren Sie zum Parkplatz zurück und holen Ihr Auto ab.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/bookings">
              <Button variant="secondary">Meine Buchungen anzeigen</Button>
            </Link>
            <Button onClick={() => globalThis.print()}>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Buchung drucken
            </Button>
            <Link href="/">
              <Button variant="ghost">Zurück zur Startseite</Button>
            </Link>
          </div>

          {booking.customer_email && (
            <p className="text-center text-sm text-gray-500 mt-8">
              Eine Bestätigungs-E-Mail wurde an <strong>{booking.customer_email}</strong> gesendet
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
