'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { formatCurrency, calculateDays } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import type { ParkingListing, PricingTier } from '@/types';
import { Icon } from '@/components/ui/Icons';
import BookingDateTimePicker from '@/components/ui/BookingDateTimePicker';
import dayjs from 'dayjs';
/** Find a matching pricing tier for the given date range. */
function findMatchingTier(tiers: PricingTier[] | undefined, startDate: string, endDate: string): PricingTier | null {
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0 || !startDate || !endDate) return null;
  const bStart = new Date(startDate).getTime();
  const bEnd = new Date(endDate).getTime();
  let best: PricingTier | null = null;
  for (const tier of tiers) {
    const tStart = new Date(tier.start_date).getTime();
    const tEnd = new Date(tier.end_date).getTime();
    if (bStart >= tStart && bEnd <= tEnd) {
      if (!best || tier.total_price < best.total_price) best = tier;
    }
  }
  return best;
}

function mapBackendListing(raw: Record<string, unknown>): ParkingListing {
  const distMin = raw.distance_to_airport_min;
  const rawTiers = raw.pricing_tiers;
  const rawHostPhotos = raw.host_photos;
  const tiers: PricingTier[] = Array.isArray(rawTiers)
    ? rawTiers
    : typeof rawTiers === 'string'
      ? (() => { try { return JSON.parse(rawTiers); } catch { return []; } })()
      : [];
  const hostPhotos = Array.isArray(rawHostPhotos) ? rawHostPhotos as string[] : [];
  const listingImages = (raw.images as string[]) || (raw.photos as string[]) || [];

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
    distanceToAirport: `${typeof distMin === 'number' ? distMin : '?'} min`,
    transferTime: (raw.distance_to_airport_min as number) || 0,
    totalSpaces: (raw.capacity_total as number) || 0,
    availableSpaces: (raw.capacity_available as number) || (raw.capacity_total as number) || 0,
    pricePerDay: (raw.base_price_per_day as number) || 0,
    currency: 'CHF',
    amenities: (raw.amenities as ParkingListing['amenities']) || {
      covered: false, evCharging: false, security247: false, cctv: false,
      fenced: false, lit: false, accessible: false, carWash: false,
    },
    images: [...listingImages, ...hostPhotos],
    hostPhotos,
    phoneNumber: (raw.phone_number as string) || '',
    pricingTiers: tiers,
    offers: [],
    isActive: raw.status === 'active',
    isApproved: raw.status === 'active',
    rating: (raw.rating as number) || undefined,
    reviewCount: (raw.review_count as number) || 0,
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

type SortOption = 'price' | 'rating' | 'distance';

export default function ZurichSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
    const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialArrival = searchParams.get('arrival') || '10:00';
  const initialReturn = searchParams.get('return') || '12:00';

  const defaultCheckin = initialStartDate && initialArrival
    ? dayjs(`${initialStartDate}T${initialArrival}`)
    : dayjs().add(1, 'day').hour(11).minute(0);
  const defaultCheckout = initialEndDate && initialReturn
    ? dayjs(`${initialEndDate}T${initialReturn}`)
    : dayjs().add(3, 'day').hour(13).minute(0);

  const [checkinDateTime, setCheckinDateTime] = useState<dayjs.Dayjs | null>(defaultCheckin);
  const [checkoutDateTime, setCheckoutDateTime] = useState<dayjs.Dayjs | null>(defaultCheckout);
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (globalThis.window === undefined) return 'list';
    const savedView = sessionStorage.getItem('zurich-list-view');
    return savedView === 'grid' ? 'grid' : 'list';
  });
  const [filters, setFilters] = useState({
    covered: false,
    evCharging: false,
    security247: false,
    priceMax: 100,
  });

   // Extract current search parameters
  const startDate = checkinDateTime?.format('YYYY-MM-DD') || '';
  const endDate = checkoutDateTime?.format('YYYY-MM-DD') || '';
  const arrivalTime = checkinDateTime?.format('HH:mm') || '';
  const returnTime = checkoutDateTime?.format('HH:mm') || '';
  const days = startDate && endDate ? calculateDays(startDate, endDate) : 1;

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (arrivalTime) params.set('arrival', arrivalTime);
    if (returnTime) params.set('return', returnTime);
    if (sortBy) params.set('sortBy', sortBy);
    router.replace(`/zurich?${params.toString()}`);
  }, [startDate, endDate, arrivalTime, returnTime, sortBy, router]);

  const updateDateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/zurich?${params.toString()}`);
  }, [searchParams, router]);

   const fetchListings = useCallback(async () => {
    if (!startDate || !endDate) {
      // Optionally show a toast or alert
      console.warn('Please select both check-in and check-out dates');
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams({ airportCode: 'ZRH' });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (sortBy) params.set('sortBy', sortBy);

    const res = await apiCall<{ listings: Record<string, unknown>[]; total: number }>(
      'GET', `/listings/search?${params}`
    );
    if (res.success && res.data) {
      const rawListings = res.data.listings || [];
      setListings(rawListings.map(mapBackendListing));
      // Update URL after successful fetch
      updateUrlParams();
    }
    setIsLoading(false);
  }, [startDate, endDate, sortBy, updateUrlParams]);

  // Initial fetch on mount using URL parameters (if present)
  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      fetchListings();
    }
  }, []); // Only once

  useEffect(() => {
    sessionStorage.setItem('zurich-list-view', viewMode);
  }, [viewMode]);


  // useEffect(() => {
  //   async function fetchListings() {
  //     setIsLoading(true);
  //     const params = new URLSearchParams({ airportCode: 'ZRH' });
  //     if (startDate) params.set('startDate', startDate);
  //     if (endDate) params.set('endDate', endDate);
  //     if (sortBy) params.set('sortBy', sortBy);

  //     const res = await apiCall<{ listings: Record<string, unknown>[]; total: number }>(
  //       'GET', `/listings/search?${params}`
  //     );
  //     console.log("Res", res)
  //     if (res.success && res.data) {
  //       const rawListings = res.data.listings || [];
  //       setListings(rawListings.map(mapBackendListing));
  //     }
  //     setIsLoading(false);
  //   }
  //   fetchListings();
  // }, [startDate, endDate, sortBy]);

  // useEffect(() => {
  //   sessionStorage.setItem('zurich-list-view', viewMode);
  // }, [viewMode]);

 const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.pricePerDay - b.pricePerDay;
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'distance': return a.transferTime - b.transferTime;
      default: return 0;
    }
  });

  const filteredListings = sortedListings.filter((listing) => {
    if (filters.covered && !listing.amenities.covered) return false;
    if (filters.evCharging && !listing.amenities.evCharging) return false;
    if (filters.security247 && !listing.amenities.security247) return false;
    if (listing.pricePerDay > filters.priceMax) return false;
    return true;
  });
  
  const getAmenityBadges = (amenities: ParkingListing['amenities']) => {
    const badges: { label: string; icon: React.ReactNode }[] = [];
    if (amenities.covered) badges.push({ label: 'Überdacht', icon: <Icon name="Home" className="h-3.5 w-3.5" /> });
    if (amenities.evCharging) badges.push({ label: 'E-Ladestation', icon: <Icon name="Zap" className="h-3.5 w-3.5" /> });
    if (amenities.security247) badges.push({ label: '24/7 Sicherheit', icon: <Icon name="ShieldCheck" className="h-3.5 w-3.5" /> });
    if (amenities.carWash) badges.push({ label: 'Autowaschanlage', icon: <Icon name="Car" className="h-3.5 w-3.5" /> });
    return badges;
  };

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    if (filteredListings.length === 0) {
      return (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <Icon name="Search" className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Parkplätze gefunden</h3>
            <p className="text-gray-500">Versuchen Sie andere Filter oder Daten.</p>
          </div>
        </Card>
      );
    }

    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
        {filteredListings?.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-soft transition-shadow">
            <div className={viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-col md:flex-row'}>
              {/* Image */}
              <div className={viewMode === 'grid' ? 'h-56 shrink-0 bg-primary-50 relative overflow-hidden' : 'md:w-64 h-48 md:h-auto shrink-0 bg-primary-50 relative overflow-hidden'}>
                {listing.images && listing.images.length > 0 ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 256px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-300">
                    <Icon name="ImageOff" className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={viewMode === 'grid' ? 'flex-1 p-5 sm:p-6 flex flex-col' : 'flex-1 p-5 sm:p-6'}>
                <div className={viewMode === 'grid' ? 'flex-1 flex flex-col gap-4' : 'flex flex-col md:flex-row md:items-start md:justify-between gap-4'}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{listing.name}</h3>
                      {findMatchingTier(listing.pricingTiers, startDate, endDate) && <Badge variant="success" size="sm">Festpreis</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{listing.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {getAmenityBadges(listing.amenities).slice(0, 4).map((badge) => (
                        <span key={badge.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-xs text-primary-700 font-medium">
                          {badge.icon} {badge.label}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon name="MapPin" className="h-4 w-4" />
                        {listing.distanceToAirport}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" className="h-4 w-4" />
                        {listing.transferTime} Min. Transfer
                      </span>
                      {listing.rating && (
                        <span className="flex items-center gap-1">
                          <Icon name="Star" className="h-4 w-4 text-yellow-400" />
                          {listing.rating} ({listing.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className={viewMode === 'grid' ? 'text-left shrink-0 mt-auto' : 'text-right shrink-0'}>
                    {(() => {
                      const tier = findMatchingTier(listing.pricingTiers, startDate, endDate);
                      if (tier) {
                        return (
                          <>
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(tier.total_price)}
                            </div>
                            <p className="text-sm text-gray-500 mb-3">
                              {tier.label || `${days} ${days === 1 ? 'Tag' : 'Tage'} Festpreis`}
                            </p>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(listing.pricePerDay * days)}
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            {formatCurrency(listing.pricePerDay)}/Tag × {days} {days === 1 ? 'Tag' : 'Tage'}
                          </p>
                        </>
                      );
                    })()}
                    <Link href={`/parking/${listing.id}?startDate=${startDate}&endDate=${endDate}&arrival=${arrivalTime}&return=${returnTime}`}>
                      <Button size="sm" className={viewMode === 'grid' ? 'w-full' : ''}>Details ansehen</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col w-full px-4 gap-5 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Parkplätze am Flughafen Zürich
              </h1>
              <p className="text-gray-500 mt-1">
                {filteredListings?.length} {filteredListings?.length === 1 ? 'Option' : 'Optionen'} verfügbar
                {startDate && endDate && <> für {days} {days === 1 ? 'Tag' : 'Tage'}</>}
              </p>
            </div>
            <div className="flex items-center flex-1 gap-3 flex-wrap justify-end">
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  className="rounded-lg"
                  onClick={() => setViewMode('list')}
                  leftIcon={<Icon name="List" className="h-4 w-4" />}
                >
                  Liste
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  className="rounded-lg"
                  onClick={() => setViewMode('grid')}
                  leftIcon={<Icon name="LayoutGrid" className="h-4 w-4" />}
                >
                  Grid
                </Button>
              </div>
              
            </div>
           
          </div>
           <div className=" flex flex-col lg:flex-row flex-wrap lg:items-end gap-3 w-full ">
            <BookingDateTimePicker
              onChange={(checkin, checkout) => {
                setCheckinDateTime(checkin);
                setCheckoutDateTime(checkout);
              }}
              defaultCheckin={defaultCheckin}
              defaultCheckout={defaultCheckout}
            />
            <Button
                onClick={fetchListings}
                className="flex-1 lg:max-w-xs h-fit"
                size="lg"
                leftIcon={<Icon name="Search" className="h-4 w-4" />}
                isLoading={isLoading}
              >
                Suchen
              </Button>
           
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8 w-full ">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <Card padding="md" className="sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Filter</h2>

              <div className="mb-6">
                <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-2">Sortieren nach</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-0"
                >
                  <option value="price">Preis</option>
                  <option value="rating">Bewertung</option>
                  <option value="distance">Entfernung</option>
                </select>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ausstattung</h3>
                <div className="space-y-2">
                  {[
                    { key: 'covered' as const, label: 'Überdacht' },
                    { key: 'evCharging' as const, label: 'E-Ladestation' },
                    { key: 'security247' as const, label: '24/7 Sicherheit' },
                  ].map((f) => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters[f.key]}
                        onChange={(e) => setFilters({ ...filters, [f.key]: e.target.checked })}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Max. Preis: {formatCurrency(filters.priceMax)}/Tag
                </h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })}
                  className="w-full accent-primary-500"
                />
              </div>
            </Card>
          </aside>

          {/* Listings */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
