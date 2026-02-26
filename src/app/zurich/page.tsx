'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { formatCurrency, calculateDays, cn } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { 
  PageTransition, 
  FadeIn, 
  StaggerContainer, 
  StaggerItem,
  AnimatedCard 
} from '@/components/animations';
import type { ParkingListing, SearchFilters, SearchResult } from '@/types';

// Map backend snake_case response to frontend ParkingListing type
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
    createdAt: (raw.created_at as string) || '',
    updatedAt: (raw.updated_at as string) || '',
  };
}

type SortOption = 'price' | 'rating' | 'distance';

export default function ZurichSearchPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [filters, setFilters] = useState({
    covered: false,
    evCharging: false,
    security247: false,
    priceMin: 0,
    priceMax: 100,
  });

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const days = startDate && endDate ? calculateDays(startDate, endDate) : 1;

  // Fetch listings from API
  useEffect(() => {
    async function fetchListings() {
      setIsLoading(true);
      const params = new URLSearchParams({ airportCode: 'ZRH' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (sortBy) params.set('sortBy', sortBy);

      const res = await apiCall<{ listings: Record<string, unknown>[]; total: number }>(
        'GET', `/listings/search?${params}`
      );
      if (res.success && res.data) {
        const rawListings = res.data || [];
        setListings(rawListings.map(mapBackendListing));
      }
      setIsLoading(false);
    }
    fetchListings();
  }, [startDate, endDate, sortBy]);

  // Sort listings client-side for immediate UX
  const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.pricePerDay - b.pricePerDay;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'distance':
        return a.transferTime - b.transferTime;
      default:
        return 0;
    }
  });

  // Filter listings
  const filteredListings = sortedListings.filter((listing) => {
    if (filters.covered && !listing.amenities.covered) return false;
    if (filters.evCharging && !listing.amenities.evCharging) return false;
    if (filters.security247 && !listing.amenities.security247) return false;
    if (listing.pricePerDay < filters.priceMin || listing.pricePerDay > filters.priceMax) return false;
    return true;
  });

  const getAmenityBadges = (amenities: ParkingListing['amenities']) => {
    const badges = [];
    if (amenities.covered) badges.push({ label: 'Überdacht', icon: '🏠' });
    if (amenities.evCharging) badges.push({ label: 'E-Ladestation', icon: '⚡' });
    if (amenities.security247) badges.push({ label: '24/7 Sicherheit', icon: '🛡️' });
    if (amenities.valetParking) badges.push({ label: 'Valet Parking', icon: '🎩' });
    return badges;
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Parkplätze am Flughafen Zürich
                </h1>
              <p className="text-gray-500 mt-1">
                {filteredListings.length} Optionen verfügbar
                {startDate && endDate && (
                  <> {`für ${days} Tage`}</>
                )}
              </p>
            </div>
            {/* Date modifier */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Von:</span>
                <input
                  type="date"
                  defaultValue={startDate}
                  className="input py-1.5 px-3"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Bis:</span>
                <input
                  type="date"
                  defaultValue={endDate}
                  className="input py-1.5 px-3"
                />
              </div>
            </div>
          </div>
          </FadeIn>
        </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card padding="md" className="sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Filter</h2>
              
              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sortieren nach</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="select w-full"
                >
                  <option value="price">Preis</option>
                  <option value="rating">Bewertung</option>
                  <option value="distance">Entfernung</option>
                </select>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ausstattung</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.covered}
                      onChange={(e) => setFilters({ ...filters, covered: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">Überdacht</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.evCharging}
                      onChange={(e) => setFilters({ ...filters, evCharging: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">E-Ladestation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.security247}
                      onChange={(e) => setFilters({ ...filters, security247: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">24/7 Sicherheit</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Preis pro Tag: {formatCurrency(filters.priceMin)} - {formatCurrency(filters.priceMax)}
                </h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })}
                  className="w-full accent-baby-blue-500"
                />
              </div>
            </Card>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="py-8">
                  <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Parkplätze gefunden</h3>
                  <p className="text-gray-500">Versuchen Sie, Ihre Filter oder Daten anzupassen.</p>
                </div>
              </Card>
            ) : (
              <StaggerContainer className="space-y-4">
                {filteredListings.map((listing) => (
                  <StaggerItem key={listing.id}>
                    <AnimatedCard className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0 overflow-hidden">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{listing.name}</h3>
                              {listing.offers.length > 0 && (
                                <Badge variant="success" size="sm">Angebot</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{listing.description}</p>
                            
                            {/* Amenities */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {getAmenityBadges(listing.amenities).slice(0, 4).map((badge) => (
                                <Badge key={badge.label} variant="gray" size="sm">
                                  {badge.icon} {badge.label}
                                </Badge>
                              ))}
                            </div>

                            {/* Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {listing.distanceToAirport}
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                {`Shuttle alle ${listing.shuttleSchedule?.frequency || 20} Min.`}
                              </div>
                              {listing.rating && (
                                <div className="flex items-center gap-1">
                                  <svg className="h-4 w-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {listing.rating} ({listing.reviewCount})
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(listing.pricePerDay * days)}
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                              {formatCurrency(listing.pricePerDay)}/day × {days} days
                            </p>
                            <Link href={`/parking/${listing.id}?startDate=${startDate}&endDate=${endDate}`}>
                              <Button>Details anzeigen</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </PageTransition>
  );
}
