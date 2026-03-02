'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Badge, Spinner } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { apiCall } from '@/lib/api';
import { formatCurrency, formatDate, calculateDays, formatDateForInput } from '@/lib/utils';
import type { LocationAddon } from '@/types';

interface AddonBreakdownItem {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface PriceBreakdown {
  days: number;
  baseRatePerDay: number;
  basePrice: number;
  discountPercent: number;
  discountApplied: number;
  addons: AddonBreakdownItem[];
  addonsTotal: number;
  serviceFee: number;
  totalPrice: number;
  platformCommission: number;
  hostPayout: number;
  currency: string;
}

interface ParkingDetails {
  id: string;
  name: string;
  address: string;
  images: string[];
  phone_number: string;
  base_price_per_day: number;
  check_in_instructions: string;
}

interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleModel: string;
  passengerCount: number;
  luggageCount: number;
  outboundFlight: string;
  returnFlight: string;
  specialNotes: string;
  childSeatRequired: boolean;
  wheelchairAssistance: boolean;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [parking, setParking] = useState<ParkingDetails | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [availableAddons, setAvailableAddons] = useState<LocationAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  // Get dates from URL params
  const startDate = searchParams.get('start') || formatDateForInput(new Date());
  const endDate = searchParams.get('end') || formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const arrivalTime = searchParams.get('arrival') || '10:00';
  const parkingId = searchParams.get('parking') || '';

  const [form, setForm] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    vehiclePlate: '',
    vehicleModel: '',
    passengerCount: 1,
    luggageCount: 1,
    outboundFlight: '',
    returnFlight: '',
    specialNotes: '',
    childSeatRequired: false,
    wheelchairAssistance: false,
  });

  // Prefill user data
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone,
      }));
    }
  }, [user]);

  // Fetch parking details and pricing
  const fetchData = useCallback(async () => {
    if (!parkingId) {
      setError('Kein Parkplatz ausgewählt. Bitte wählen Sie zuerst einen Parkplatz.');
      setPageLoading(false);
      return;
    }

    try {
      // Fetch parking details
      const parkingRes = await apiCall<ParkingDetails>('GET', `/listings/public/${parkingId}`);
      if (!parkingRes.success || !parkingRes.data) {
        setError('Parkplatz nicht gefunden.');
        setPageLoading(false);
        return;
      }
      setParking(parkingRes.data);

      // Fetch available add-ons
      const addonsRes = await apiCall<LocationAddon[]>('GET', `/listings/public/${parkingId}/addons?activeOnly=true`);
      if (addonsRes.success && addonsRes.data) {
        setAvailableAddons(addonsRes.data);
      }

      // Fetch pricing
      const pricingRes = await apiCall<PriceBreakdown>(
        'GET',
        `/bookings/calculate-price?locationId=${parkingId}&startDate=${startDate}&endDate=${endDate}`
      );
      if (pricingRes.success && pricingRes.data) {
        setPricing(pricingRes.data);
      }
    } catch {
      setError('Fehler beim Laden der Parkplatzdetails.');
    } finally {
      setPageLoading(false);
    }
  }, [parkingId, startDate, endDate]);

  // Recalculate pricing when addons change
  const recalculatePrice = useCallback(async (addonsMap: Record<string, number>) => {
    if (!parkingId) return;
    const addonsList = Object.entries(addonsMap)
      .filter(([, qty]) => qty > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }));
    const addonsParam = addonsList.length > 0 ? `&addons=${encodeURIComponent(JSON.stringify(addonsList))}` : '';
    const pricingRes = await apiCall<PriceBreakdown>(
      'GET',
      `/bookings/calculate-price?locationId=${parkingId}&startDate=${startDate}&endDate=${endDate}${addonsParam}`
    );
    if (pricingRes.success && pricingRes.data) {
      setPricing(pricingRes.data);
    }
  }, [parkingId, startDate, endDate]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const next = current > 0 ? 0 : 1;
      const updated = { ...prev, [addonId]: next };
      recalculatePrice(updated);
      return updated;
    });
  };

  const changeAddonQty = (addonId: string, qty: number, maxQty: number) => {
    const clamped = Math.max(0, Math.min(qty, maxQty));
    setSelectedAddons((prev) => {
      const updated = { ...prev, [addonId]: clamped };
      recalculatePrice(updated);
      return updated;
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!form.vehiclePlate.trim()) {
        throw new Error('Bitte geben Sie Ihr Kennzeichen ein.');
      }
      if (!form.customerEmail.trim()) {
        throw new Error('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      }
      if (!form.customerName.trim()) {
        throw new Error('Bitte geben Sie Ihren Namen ein.');
      }

      const startDatetime = `${startDate}T${arrivalTime}:00`;
      const endDatetime = `${endDate}T12:00:00`;

      const addonsList = Object.entries(selectedAddons)
        .filter(([, qty]) => qty > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity }));

      // Choose route: authenticated → /bookings, guest → /bookings/guest
      if (isAuthenticated) {
        // Authenticated booking
        const res = await apiCall<{
          booking: Record<string, unknown>;
          payment: Record<string, unknown>;
          clientSecret?: string;
        }>('POST', '/bookings', {
          locationId: parkingId,
          startDatetime,
          endDatetime,
          arrivalLotDatetime: startDatetime,
          outboundFlightNo: form.outboundFlight || undefined,
          returnFlightNo: form.returnFlight || undefined,
          passengers: form.passengerCount,
          luggage: form.luggageCount,
          carPlate: form.vehiclePlate,
          carModel: form.vehicleModel || undefined,
          specialNotes: form.specialNotes || undefined,
          childSeatRequired: form.childSeatRequired,
          wheelchairAssistance: form.wheelchairAssistance,
          addons: addonsList.length > 0 ? addonsList : undefined,
        });

        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Buchung konnte nicht erstellt werden.');
        }

        const { booking, payment } = res.data;

        // Confirm payment (simulated MVP flow)
        const confirmRes = await apiCall<{
          booking: Record<string, unknown>;
          payment: Record<string, unknown>;
        }>('POST', `/bookings/${booking.id}/confirm-payment`, {
          paymentId: payment.id,
        });

        if (!confirmRes.success) {
          console.error('Payment confirmation failed:', confirmRes.error?.message);
        }

        router.push(`/booking/confirmation?id=${booking.id}&code=${booking.booking_code}`);
      } else {
        // Guest booking — auto-creates customer account
        const res = await apiCall<{
          booking: Record<string, unknown>;
          payment: Record<string, unknown>;
          clientSecret?: string;
          guestAccount?: boolean;
        }>('POST', '/bookings/guest', {
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone || undefined,
          locationId: parkingId,
          startDatetime,
          endDatetime,
          arrivalLotDatetime: startDatetime,
          outboundFlightNo: form.outboundFlight || undefined,
          returnFlightNo: form.returnFlight || undefined,
          passengers: form.passengerCount,
          luggage: form.luggageCount,
          carPlate: form.vehiclePlate,
          carModel: form.vehicleModel || undefined,
          specialNotes: form.specialNotes || undefined,
          childSeatRequired: form.childSeatRequired,
          wheelchairAssistance: form.wheelchairAssistance,
          addons: addonsList.length > 0 ? addonsList : undefined,
        });

        if (!res.success || !res.data) {
          // Check if email already exists — prompt login
          if (res.error?.code === 'EMAIL_EXISTS') {
            setError('Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an, um die Buchung abzuschliessen.');
            setLoading(false);
            return;
          }
          throw new Error(res.error?.message || 'Buchung konnte nicht erstellt werden.');
        }

        const { booking } = res.data;

        // Payment is auto-confirmed in the guest endpoint
        router.push(`/booking/confirmation?id=${booking.id}&code=${booking.booking_code}&guest=1`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Buchung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = pricing?.days || calculateDays(startDate, endDate);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/zurich" className="hover:text-primary-600">Suche</Link>
            <span>/</span>
            {parking && (
              <>
                <Link href={`/parking/${parkingId}`} className="hover:text-primary-600">{parking.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900">Buchung</span>
          </nav>

          {error && !parking && (
            <Alert variant="error" className="mb-6">{error}</Alert>
          )}

          {parking && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Buchung abschliessen</h1>

                {error && <Alert variant="error">{error}</Alert>}

                {/* {!isAuthenticated && (
                  <Alert variant="info">
                    Haben Sie bereits ein Konto? <Link href={`/login?redirect=/booking?parking=${parkingId}&start=${startDate}&end=${endDate}&arrival=${arrivalTime}`} className="font-medium underline">Anmelden</Link>, um Ihre Daten automatisch auszufüllen. Andernfalls wird beim Buchen automatisch ein Konto für Sie erstellt.
                  </Alert>
                )} */}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Kontaktdaten</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        label="Vollständiger Name"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="E-Mail-Adresse"
                          type="email"
                          value={form.customerEmail}
                          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                          required
                        />
                        <Input
                          label="Telefonnummer"
                          type="tel"
                          value={form.customerPhone}
                          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                          placeholder="+41 79 123 45 67"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vehicle Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Fahrzeugdaten</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Kennzeichen *"
                          value={form.vehiclePlate}
                          onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                          placeholder="ZH 123456"
                          required
                        />
                        <Input
                          label="Automodell (optional)"
                          value={form.vehicleModel}
                          onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                          placeholder="z.B. VW Golf"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Travel Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Reisedetails</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="passengerCount" className="block text-sm font-medium text-gray-700 mb-1">
                            Anzahl Passagiere
                          </label>
                          <select
                            id="passengerCount"
                            value={form.passengerCount}
                            onChange={(e) => setForm({ ...form, passengerCount: Number.parseInt(e.target.value) })}
                            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n}>{n} {n === 1 ? 'Passagier' : 'Passagiere'}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="luggageCount" className="block text-sm font-medium text-gray-700 mb-1">
                            Anzahl Gepäckstücke
                          </label>
                          <select
                            id="luggageCount"
                            value={form.luggageCount}
                            onChange={(e) => setForm({ ...form, luggageCount: Number.parseInt(e.target.value) })}
                            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <option key={n} value={n}>{n} {n === 1 ? 'Stück' : 'Stücke'}</option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Hinflug-Nr. (optional)"
                          value={form.outboundFlight}
                          onChange={(e) => setForm({ ...form, outboundFlight: e.target.value.toUpperCase() })}
                          placeholder="z.B. LX 123"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Rückflug-Nr. (optional)"
                          value={form.returnFlight}
                          onChange={(e) => setForm({ ...form, returnFlight: e.target.value.toUpperCase() })}
                          placeholder="z.B. LX 456"
                        />
                      </div>

                      {/* Extras */}
                      {/* <div className="border-t pt-4 space-y-3">
                        <p className="font-medium text-gray-700 text-sm">Zusatzleistungen</p>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={form.childSeatRequired}
                            onChange={(e) => setForm({ ...form, childSeatRequired: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Kindersitz benötigt</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={form.wheelchairAssistance}
                            onChange={(e) => setForm({ ...form, wheelchairAssistance: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Rollstuhlunterstützung</span>
                        </label>
                      </div> */}

                      <div>
                        <label htmlFor="specialNotes" className="block text-sm font-medium text-gray-700 mb-1">
                          Besondere Wünsche (optional)
                        </label>
                        <textarea
                          id="specialNotes"
                          value={form.specialNotes}
                          onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
                          rows={3}
                          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                          placeholder="Besondere Anforderungen..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Optional Extra Services / Add-ons */}
                  {availableAddons.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Optionale Zusatzleistungen</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-500">Wählen Sie optionale Extras für Ihren Aufenthalt.</p>
                        {availableAddons.map((addon) => {
                          const qty = selectedAddons[addon.id] || 0;
                          const isSelected = qty > 0;
                          return (
                            <button
                              type="button"
                              key={addon.id}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer w-full text-left ${
                                isSelected
                                  ? 'border-baby-blue-300 bg-baby-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                if (addon.max_quantity <= 1) {
                                  toggleAddon(addon.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAddon(addon.id)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                                  {addon.description && (
                                    <p className="text-xs text-gray-500 truncate">{addon.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                {addon.max_quantity > 1 && isSelected && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                      onClick={() => changeAddonQty(addon.id, qty - 1, addon.max_quantity)}
                                    >
                                      −
                                    </button>
                                    <span className="text-sm font-medium w-6 text-center">{qty}</span>
                                    <button
                                      type="button"
                                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                      onClick={() => changeAddonQty(addon.id, qty + 1, addon.max_quantity)}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                                <span className={`text-sm font-bold whitespace-nowrap ${
                                  Number(addon.price) === 0 ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {Number(addon.price) === 0 ? 'Kostenlos' : `CHF ${Number(addon.price).toFixed(2)}`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Zahlung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="font-medium text-blue-800">Sichere Zahlung</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Ihre Zahlung wird sicher verarbeitet. Die Abbuchung erfolgt erst nach Bestätigung der Buchung.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="gray" size="sm">Visa</Badge>
                          <Badge variant="gray" size="sm">Mastercard</Badge>
                          <Badge variant="gray" size="sm">TWINT</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      id="terms"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Ich stimme den{' '}
                      <Link href="/terms" className="text-primary-600 hover:underline">AGB</Link>,{' '}
                      der <Link href="/privacy" className="text-primary-600 hover:underline">Datenschutzrichtlinie</Link> und der{' '}
                      <Link href="/cancellation-policy" className="text-primary-600 hover:underline">Stornierungsrichtlinie</Link> zu.
                    </label>
                  </div>

                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                  {(() => {
                    if (loading) return 'Buchung wird erstellt...';
                    const priceText = pricing?.totalPrice == null ? '' : formatCurrency(pricing.totalPrice);
                    return `Jetzt buchen – ${priceText}`;
                  })()}
                  </Button>
                </form>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Buchungszusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{parking.name}</h3>
                      <p className="text-sm text-gray-500">{parking.address}</p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Check-in</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(startDate)} um {arrivalTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Check-out</span>
                        <span className="font-medium text-gray-900">{formatDate(endDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Dauer</span>
                        <span className="font-medium text-gray-900">{totalDays} Tage</span>
                      </div>
                    </div>

                    {pricing && (
                      <>
                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {pricing.days} x {formatCurrency(pricing.baseRatePerDay)}/Tag
                            </span>
                            <span>{formatCurrency(pricing.basePrice)}</span>
                          </div>
                          {pricing.discountApplied > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Rabatt ({pricing.discountPercent}%)</span>
                              <span>-{formatCurrency(pricing.discountApplied)}</span>
                            </div>
                          )}
                          {pricing.addons && pricing.addons.length > 0 && (
                            <>
                              {pricing.addons.map((addon) => (
                                <div key={addon.addonId} className="flex justify-between text-sm">
                                  <span className="text-gray-500">
                                    {addon.name}{addon.quantity > 1 ? ` ×${addon.quantity}` : ''}
                                  </span>
                                  <span>{formatCurrency(addon.total)}</span>
                                </div>
                              ))}
                            </>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Servicegebühr</span>
                            <span>{formatCurrency(pricing.serviceFee)}</span>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Gesamt</span>
                            <span className="font-bold text-xl text-gray-900">
                              {formatCurrency(pricing.totalPrice)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Inkl. MwSt. in {pricing.currency}</p>
                        </div>
                      </>
                    )}

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Kostenlose Stornierung bis 24h vorher</span>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
