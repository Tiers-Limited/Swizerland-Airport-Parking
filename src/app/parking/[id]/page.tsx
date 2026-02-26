'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, Card, Badge, Alert, Spinner } from '@/components/ui';
import { formatCurrency, calculateDays, formatDate } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import type { ParkingListing, SpecialRequests, LocationAddon } from '@/types';

// Map backend response to ParkingListing
function mapBackendListing(raw: Record<string, unknown>): ParkingListing {
  return {
    id: raw.id as string,
    hostId: (raw.host_id as string) || '',
    name: (raw.name as string) || '',
    description: (raw.description as string) || '',
    address: (raw.address as string) || '',
    city: (raw.city as string) || '',
    postalCode: (raw.postal_code as string) || '',
    country: (raw.country as string) || 'CH',
    airportCode: (raw.airport_code as string) || 'ZRH',
    latitude: (raw.latitude as number) || 0,
    longitude: (raw.longitude as number) || 0,
    distanceToAirport: `${raw.distance_to_airport_min || '?'} min`,
    transferTime: (raw.distance_to_airport_min as number) || 0,
    totalSpaces: (raw.capacity_total as number) || 0,
    availableSpaces: (raw.capacity_available as number) || (raw.capacity_total as number) || 0,
    pricePerDay: (raw.base_price_per_day as number) || 0,
    currency: 'CHF',
    amenities: (raw.amenities as ParkingListing['amenities']) || {
      covered: false, evCharging: false, security247: false, cctv: false,
      fenced: false, lit: false, accessible: false, carWash: false, valetParking: false,
    },
    images: (raw.images as string[]) || (raw.photos as string[]) || [],
    shuttleMode: (raw.shuttle_mode as ParkingListing['shuttleMode']) || 'scheduled',
    shuttleSchedule: raw.shuttle_hours ? {
      operatingHours: {
        start: (raw.shuttle_hours as Record<string, string>).start || '04:00',
        end: (raw.shuttle_hours as Record<string, string>).end || '23:00',
      },
      frequency: 20,
    } : undefined,
    offers: (raw.pricing_rules as ParkingListing['offers']) || [],
    isActive: raw.status === 'active',
    isApproved: raw.status === 'active',
    rating: (raw.rating as number) || undefined,
    reviewCount: (raw.review_count as number) || 0,
    addons: ((raw.addons as Array<Record<string, unknown>>) || []).map((a) => ({
      id: a.id as string,
      locationId: a.location_id as string,
      name: a.name as string,
      description: (a.description as string) || '',
      price: a.price as number,
      currency: (a.currency as string) || 'CHF',
      maxQuantity: (a.max_quantity as number) || 1,
      icon: (a.icon as string) || '',
      isActive: a.is_active as boolean,
      sortOrder: (a.sort_order as number) || 0,
    })) as LocationAddon[],
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function ParkingDetailPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [listing, setListing] = useState<ParkingListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    arrivalTime: '10:00',
    vehiclePlate: '',
    vehicleModel: '',
    passengerCount: 1,
    luggageCount: 1,
    outboundFlight: '',
    returnFlight: '',
    returnFlightArrival: '',
    specialRequests: {
      childSeat: false,
      wheelchairAssistance: false,
      notes: '',
    } as SpecialRequests,
  });

  useEffect(() => {
    async function fetchListing() {
      setIsLoading(true);
      const res = await apiCall<Record<string, unknown>>('GET', `/listings/public/${id}`);
      if (res.success && res.data) {
        setListing(mapBackendListing(res.data));
      }
      setIsLoading(false);
    }
    fetchListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card padding="lg" className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Parkplatz nicht gefunden</h1>
            <p className="text-gray-500 mb-4">Der gesuchte Parkplatz existiert nicht.</p>
            <Link href="/zurich">
              <Button>Alle Parkplätze durchsuchen</Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const days = startDate && endDate ? calculateDays(startDate, endDate) : 1;
  const basePrice = listing.pricePerDay * days;
  
  // Calculate discount
  let discountAmount = 0;
  let appliedOffer = '';
  listing.offers.forEach((offer) => {
    if (offer.isActive && offer.conditions?.minDays && days >= offer.conditions.minDays) {
      if (offer.discount?.type === 'percentage' && offer.discount?.value) {
        const discount = (basePrice * offer.discount.value) / 100;
        if (discount > discountAmount) {
          discountAmount = discount;
          appliedOffer = offer.name;
        }
      }
    }
  });
  
  const serviceFee = 4.50;
  const totalPrice = basePrice - discountAmount + serviceFee;

  const amenityList = [
    { key: 'covered', label: 'Überdacht', icon: '🏠' },
    { key: 'evCharging', label: 'E-Ladestation', icon: '⚡' },
    { key: 'security247', label: '24/7 Sicherheit', icon: '🛡️' },
    { key: 'cctv', label: 'CCTV', icon: '📹' },
    { key: 'fenced', label: 'Eingezäunt', icon: '🔒' },
    { key: 'lit', label: 'Beleuchtet', icon: '💡' },
    { key: 'accessible', label: 'Barrierefrei', icon: '♿' },
    { key: 'carWash', label: 'Autowaschanlage', icon: '🚿' },
    { key: 'valetParking', label: 'Valet Parking', icon: '🎩' },
  ];

  const handleProceedToBooking = () => {
    if (!startDate || !endDate) {
      alert('Bitte wählen Sie Ihre Reisedaten');
      return;
    }
    setShowBookingForm(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero/Gallery Section */}
        <div className="bg-gray-200 h-64 md:h-80 lg:h-96">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            {listing.images && listing.images.length > 0 ? (
              <div className="relative h-full w-full">
                <Image
                  src={listing.images[0]}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Parkplatzbilder</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {listing.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {listing.address}, {listing.city}
                      </div>
                      <span>•</span>
                      <span>{listing.distanceToAirport}</span>
                    </div>
                  </div>
                  {listing.rating && (
                    <div className="flex items-center gap-1 bg-success-50 px-3 py-1.5 rounded-lg">
                      <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-gray-900">{listing.rating}</span>
                      <span className="text-gray-500">({listing.reviewCount} Bewertungen)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Über diesen Parkplatz</h2>
                <p className="text-gray-600">{listing.description}</p>
              </Card>

              {/* Shuttle Info */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Shuttleservice</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Gratis Shuttle</p>
                      <p className="text-xs text-gray-500">{`Alle ${listing.shuttleSchedule?.frequency || 20} Minuten`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Betriebszeiten</p>
                      <p className="text-xs text-gray-500">
                        {listing.shuttleSchedule?.operatingHours.start} - {listing.shuttleSchedule?.operatingHours.end}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transferzeit</p>
                      <p className="text-xs text-gray-500">{`${listing.transferTime} Minuten zum Terminal`}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Amenities */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Ausstattung</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityList.map((amenity) => {
                    const isAvailable = listing.amenities[amenity.key as keyof typeof listing.amenities];
                    return (
                      <div
                        key={amenity.key}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          isAvailable ? 'bg-success-50 text-gray-700' : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        <span>{amenity.icon}</span>
                        <span className="text-sm">{amenity.label}</span>
                        {isAvailable && (
                          <svg className="h-4 w-4 ml-auto text-success-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Extra Services / Add-ons */}
              {listing.addons && listing.addons.length > 0 && (
                <Card padding="md" className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Zusatzleistungen</h2>
                  <p className="text-sm text-gray-500 mb-4">Folgende Extras können bei der Buchung hinzugefügt werden:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-baby-blue-50 border border-baby-blue-100"
                      >
                        {addon.icon && <span className="text-lg">{addon.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                          {addon.description && (
                            <p className="text-xs text-gray-500 truncate">{addon.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-baby-blue-700 whitespace-nowrap">
                          +{formatCurrency(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Cancellation Policy */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Stornierungsrichtlinie</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-success-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Kostenlose Stornierung bis 24 Stunden vor Ankunft</span>
                  </div>
                  <div className="flex items-center gap-2 text-warning-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>50% Erstattung bei Stornierung 12-24 Stunden vorher</span>
                  </div>
                  <div className="flex items-center gap-2 text-error-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Keine Erstattung bei Stornierung weniger als 12 Stunden vorher</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:w-96">
              <Card padding="md" className="sticky top-24">
                {/* Price */}
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(listing.pricePerDay)}
                    </span>
                    <span className="text-gray-500">/day</span>
                  </div>
                  {listing.availableSpaces < 20 && (
                    <Badge variant="warning">{`Nur noch ${listing.availableSpaces} frei`}</Badge>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Abgabe</label>
                      <input
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={() => {}}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Abholung</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={() => {}}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {formatCurrency(listing.pricePerDay)} × {days} Tage
                      </span>
                      <span className="text-gray-900">{formatCurrency(basePrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-success-600">
                      <span>{appliedOffer} Rabatt</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Servicegebühr</span>
                      <span className="text-gray-900">{formatCurrency(serviceFee)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">Gesamt</span>
                    <span className="font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                {/* Offer Badge */}
                {listing.offers.length > 0 && (
                  <Alert variant="success" className="mb-4">
                    <span className="font-medium">Sonderangebot:</span> 7+ Tage buchen und 10% sparen!
                  </Alert>
                )}

                {/* CTA */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceedToBooking}
                >
                  Jetzt reservieren
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Noch keine Belastung
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
