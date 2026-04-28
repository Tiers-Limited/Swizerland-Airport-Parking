'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { formatCurrency, calculateDays, formatDateForInput } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import type { ParkingListing, LocationAddon, PricingTier } from '@/types';

/** Price breakdown returned by the calculatePrice API */
interface PriceBreakdown {
  basePrice: number;
  discount: number;
  serviceFee: number;
  totalPrice: number;
  days: number;
  currency: string;
  tierMatched: boolean;
  tierLabel?: string;
}

// Map backend response to ParkingListing
function mapBackendListing(raw: Record<string, unknown>): ParkingListing {
  const rawTiers = raw.pricing_tiers;
  const tiers: PricingTier[] = Array.isArray(rawTiers)
    ? rawTiers
    : typeof rawTiers === 'string'
      ? (() => { try { return JSON.parse(rawTiers); } catch { return []; } })()
      : [];

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
    distanceToAirport: `${typeof raw.distance_to_airport_min === 'number' ? raw.distance_to_airport_min : '?'} min`,
    transferTime: (raw.distance_to_airport_min as number) || 0,
    totalSpaces: (raw.capacity_total as number) || 0,
    availableSpaces: (raw.capacity_available as number) || (raw.capacity_total as number) || 0,
    pricePerDay: (raw.base_price_per_day as number) || 0,
    currency: 'CHF',
    amenities: (raw.amenities as ParkingListing['amenities']) || {
      covered: false, evCharging: false, security247: false, cctv: false,
      fenced: false, lit: false, accessible: false, carWash: false,
    },
    images: (raw.images as string[]) || (raw.photos as string[]) || [],
    phoneNumber: (raw.phone_number as string) || '',
    pricingTiers: tiers,
    offers: [],
    isActive: raw.status === 'active',
    isApproved: raw.status === 'active',
    rating: (raw.rating as number) || undefined,
    reviewCount: (raw.review_count as number) || 0,
    addons: ((raw.addons as Array<Record<string, unknown>>) || []).map((a) => ({
      id: a.id as string,
      location_id: a.location_id as string,
      name: a.name as string,
      description: (a.description as string) || '',
      price: a.price as number,
      currency: (a.currency as string) || 'CHF',
      max_quantity: (a.max_quantity as number) || 1,
      icon: (a.icon as string) || '',
      is_active: a.is_active as boolean,
      sort_order: (a.sort_order as number) || 0,
      created_at: (a.created_at as string) || '',
      updated_at: (a.updated_at as string) || '',
    })) as LocationAddon[],
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function ParkingDetailClient({ params }: PageParams) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const arrivalTime = searchParams.get('arrival') || '10:00';
  const returnTime = searchParams.get('return') || '12:00';

  const updateDateParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) { p.set(key, value); } else { p.delete(key); }
    router.replace(`/parking/${id}?${p.toString()}`);
  }, [searchParams, router, id]);

  const updateTimeParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) { p.set(key, value); } else { p.delete(key); }
    router.replace(`/parking/${id}?${p.toString()}`);
  }, [searchParams, router, id]);

  const [listing, setListing] = useState<ParkingListing | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const endDateRef = useRef<HTMLInputElement | null>(null);

  const imageCount = listing?.images?.length || 0;

  const prevImage = () => {
    if (!imageCount) return;
    setActiveImageIndex((i) => (i - 1 + imageCount) % imageCount);
  };

  const nextImage = () => {
    if (!imageCount) return;
    setActiveImageIndex((i) => (i + 1) % imageCount);
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const res = await apiCall<Record<string, unknown>>('GET', `/listings/public/${id}`);
      if (res.success && res.data) {
        setListing(mapBackendListing(res.data));
      }
      // Fetch server-calculated pricing
      if (startDate && endDate) {
        const params = new URLSearchParams({ locationId: id, startDate, endDate });
        const priceRes = await apiCall<PriceBreakdown>('GET', `/bookings/calculate-price?${params}`);
        if (priceRes.success && priceRes.data) {
          setPricing(priceRes.data);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [id, startDate, endDate]);

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

  const amenityList = [
    { key: 'covered', label: 'Überdacht', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: 'evCharging', label: 'E-Ladestation', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { key: 'security247', label: '24/7 Sicherheit', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { key: 'cctv', label: 'CCTV', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { key: 'fenced', label: 'Eingezäunt', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    { key: 'lit', label: 'Beleuchtet', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
    { key: 'accessible', label: 'Barrierefrei', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { key: 'carWash', label: 'Autowaschanlage', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  ];

  const handleProceedToBooking = () => {
    if (!startDate || !endDate) {
      alert('Bitte wählen Sie Ihre Reisedaten');
      return;
    }
    globalThis.location.href = `/booking?parking=${listing.id}&start=${startDate}&end=${endDate}&arrival=${arrivalTime}&return=${returnTime}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero/Gallery Section */}
        <div className="bg-gray-200 h-64 md:h-80 lg:h-96">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            {listing.images && listing.images.length > 0 ? (
              <div className="relative h-full w-full group">
                <Image
                  src={listing.images[activeImageIndex]}
                  alt={`${listing.name} – Bild ${activeImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Navigation arrows */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Vorheriges Bild"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Nächstes Bild"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}

                {/* Image counter badge */}
                {listing.images.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    {activeImageIndex + 1} / {listing.images.length}
                  </span>
                )}
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

        {/* Thumbnail strip */}
        {listing.images && listing.images.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImageIndex ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Bild ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

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
                    <div className="flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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

              {/* Transfer Info */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Transferservice</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transfer inklusive</p>
                      <p className="text-xs text-gray-500">Zum und vom Terminal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transferzeit</p>
                      <p className="text-xs text-gray-500">{listing.transferTime} Minuten zum Terminal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Kontakt</p>
                      <p className="text-xs text-gray-500">{listing.phoneNumber || 'Verfügbar nach Buchung'}</p>
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
                          isAvailable ? 'bg-primary-50 text-gray-700' : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        <span>{amenity.icon}</span>
                        <span className="text-sm">{amenity.label}</span>
                        {isAvailable && (
                          <svg className="h-4 w-4 ml-auto text-primary-500" fill="currentColor" viewBox="0 0 20 20">
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
                        className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-100"
                      >
                        {addon.icon && <span className="text-lg">{addon.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                          {addon.description && (
                            <p className="text-xs text-gray-500 truncate">{addon.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-primary-700 whitespace-nowrap">
                          +{formatCurrency(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Pricing Tiers / Preiszeiträume */}
              {listing.pricingTiers && listing.pricingTiers.length > 0 && (
                <Card padding="md" className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Preiszeiträume</h2>
                  <p className="text-sm text-gray-500 mb-4">Verfügbare Festpreise für bestimmte Zeiträume:</p>
                  <div className="space-y-3">
                    {listing.pricingTiers.map((tier, idx) => {
                      const fmtDate = (d: string) => {
                        try { return new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; }
                      };
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-primary-100 bg-primary-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary-100 text-primary-700">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {tier.label || `Zeitraum ${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {fmtDate(tier.start_date)} – {fmtDate(tier.end_date)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-primary-700 whitespace-nowrap">
                            {formatCurrency(Number(tier.total_price) || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Cancellation Policy */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Stornierungsrichtlinie</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Kostenlose Stornierung bis 24 Stunden vor Ankunft</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>50% Erstattung bei Stornierung 12-24 Stunden vorher</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
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
                {/* Price Header */}
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    {pricing?.tierMatched ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(pricing.basePrice)}
                        </span>
                        <Badge variant="success" size="sm" className="ml-2">Festpreis</Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(listing.pricePerDay)}
                        </span>
                        <span className="text-gray-500">/Tag</span>
                      </>
                    )}
                  </div>
                  {listing.availableSpaces < 20 && (
                    <Badge variant="warning">{`Nur noch ${listing.availableSpaces} frei`}</Badge>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="detail-start-date" className="block text-sm font-medium text-gray-700 mb-1">Abgabe</label>
                      <input
                        id="detail-start-date"
                        type="date"
                        value={startDate}
                        min={formatDateForInput(new Date())}
                        onChange={(e) => {
                          updateDateParam('startDate', e.target.value);
                          if (e.target.value) {
                            window.setTimeout(() => {
                              endDateRef.current?.showPicker?.();
                              endDateRef.current?.focus();
                            }, 0);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <input
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => updateTimeParam('arrival', e.target.value)}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="detail-end-date" className="block text-sm font-medium text-gray-700 mb-1">Abholung</label>
                      <input
                        ref={endDateRef}
                        id="detail-end-date"
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => updateDateParam('endDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => updateTimeParam('return', e.target.value)}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {pricing ? (
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          {pricing.tierMatched
                            ? (pricing.tierLabel || `Festpreis ${days} ${days === 1 ? 'Tag' : 'Tage'}`)
                            : `${formatCurrency(listing.pricePerDay)} × ${days} ${days === 1 ? 'Tag' : 'Tage'}`}
                        </span>
                        <span className="text-gray-900">{formatCurrency(pricing.basePrice)}</span>
                      </div>
                      {pricing.serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Servicegebühr</span>
                          <span className="text-gray-900">{formatCurrency(pricing.serviceFee)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-3 mt-3 border-t border-gray-100">
                      <span className="font-semibold text-gray-900">Gesamt</span>
                      <span className="font-bold text-gray-900">{formatCurrency(pricing.totalPrice)}</span>
                    </div>
                  </div>
                ) : startDate && endDate ? (
                  <div className="border-t border-gray-100 pt-4 mb-4 text-center text-sm text-gray-400">
                    <Spinner size="sm" /> Preis wird berechnet…
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-4 mb-4 text-center text-sm text-gray-400">
                    Wählen Sie Daten um den Preis zu sehen
                  </div>
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