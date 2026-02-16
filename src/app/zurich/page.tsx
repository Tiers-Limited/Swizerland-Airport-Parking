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

// Mock data for now (will be replaced with API calls)
const mockListings: ParkingListing[] = [
  {
    id: '1',
    hostId: 'h1',
    name: 'Zurich Secure Parking',
    description: 'Premium secure parking with covered spaces and 24/7 security surveillance. Direct shuttle service to all terminals.',
    address: 'Flughofstrasse 45',
    city: 'Kloten',
    postalCode: '8302',
    country: 'Switzerland',
    airportCode: 'ZRH',
    latitude: 47.464,
    longitude: 8.549,
    distanceToAirport: '5 min drive',
    transferTime: 5,
    totalSpaces: 200,
    availableSpaces: 45,
    pricePerDay: 25,
    currency: 'CHF',
    amenities: {
      covered: true,
      evCharging: true,
      security247: true,
      cctv: true,
      fenced: true,
      lit: true,
      accessible: true,
      carWash: false,
      valetParking: false,
    },
    images: ['/images/parking-1.jpg'],
    shuttleMode: 'scheduled',
    shuttleSchedule: {
      operatingHours: { start: '04:00', end: '00:00' },
      frequency: 20,
    },
    offers: [
      {
        id: 'o1',
        name: 'Week Special',
        type: 'duration_discount',
        conditions: { minDays: 7 },
        discount: { type: 'percentage', value: 10 },
        isActive: true,
      },
    ],
    isActive: true,
    isApproved: true,
    rating: 4.8,
    reviewCount: 234,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    hostId: 'h2',
    name: 'Budget Park ZRH',
    description: 'Affordable parking solution with reliable shuttle service. Open-air parking with security patrol.',
    address: 'Industriestrasse 12',
    city: 'Kloten',
    postalCode: '8302',
    country: 'Switzerland',
    airportCode: 'ZRH',
    latitude: 47.458,
    longitude: 8.555,
    distanceToAirport: '8 min drive',
    transferTime: 8,
    totalSpaces: 350,
    availableSpaces: 120,
    pricePerDay: 15,
    currency: 'CHF',
    amenities: {
      covered: false,
      evCharging: false,
      security247: true,
      cctv: true,
      fenced: true,
      lit: true,
      accessible: true,
      carWash: false,
      valetParking: false,
    },
    images: ['/images/parking-1b.jpg'],
    shuttleMode: 'on_demand',
    offers: [],
    isActive: true,
    isApproved: true,
    rating: 4.5,
    reviewCount: 456,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    hostId: 'h3',
    name: 'Premium Airport Parking',
    description: 'VIP parking experience with valet service, car wash, and meet & greet. Covered parking only.',
    address: 'Flughafenstrasse 22',
    city: 'Kloten',
    postalCode: '8302',
    country: 'Switzerland',
    airportCode: 'ZRH',
    latitude: 47.465,
    longitude: 8.552,
    distanceToAirport: '3 min drive',
    transferTime: 3,
    totalSpaces: 100,
    availableSpaces: 15,
    pricePerDay: 45,
    currency: 'CHF',
    amenities: {
      covered: true,
      evCharging: true,
      security247: true,
      cctv: true,
      fenced: true,
      lit: true,
      accessible: true,
      carWash: true,
      valetParking: true,
    },
    images: ['/images/parking-1c.jpg'],
    shuttleMode: 'scheduled',
    shuttleSchedule: {
      operatingHours: { start: '05:00', end: '23:00' },
      frequency: 15,
    },
    offers: [
      {
        id: 'o2',
        name: 'Early Bird',
        type: 'early_bird',
        conditions: { bookingWindow: 14 },
        discount: { type: 'percentage', value: 15 },
        isActive: true,
      },
    ],
    isActive: true,
    isApproved: true,
    rating: 4.9,
    reviewCount: 89,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

type SortOption = 'price' | 'rating' | 'distance';

export default function ZurichSearchPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<ParkingListing[]>(mockListings);
  const [isLoading, setIsLoading] = useState(false);
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

  // Sort listings
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
    if (amenities.covered) badges.push({ label: 'Covered', icon: '🏠' });
    if (amenities.evCharging) badges.push({ label: 'EV Charging', icon: '⚡' });
    if (amenities.security247) badges.push({ label: '24/7 Security', icon: '🛡️' });
    if (amenities.valetParking) badges.push({ label: 'Valet', icon: '🎩' });
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
                  Parking near Zurich Airport (ZRH)
                </h1>
              <p className="text-gray-500 mt-1">
                {filteredListings.length} options available
                {startDate && endDate && (
                  <> for {days} day{days > 1 ? 's' : ''}</>
                )}
              </p>
            </div>
            {/* Date modifier */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">From:</span>
                <input
                  type="date"
                  defaultValue={startDate}
                  className="input py-1.5 px-3"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">To:</span>
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
              <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="select w-full"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="distance">Distance: Closest</option>
                </select>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Amenities</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.covered}
                      onChange={(e) => setFilters({ ...filters, covered: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">Covered parking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.evCharging}
                      onChange={(e) => setFilters({ ...filters, evCharging: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">EV charging</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.security247}
                      onChange={(e) => setFilters({ ...filters, security247: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm text-gray-600">24/7 security</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Price per day: {formatCurrency(filters.priceMin)} - {formatCurrency(filters.priceMax)}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No parking found</h3>
                  <p className="text-gray-500">Try adjusting your filters or dates.</p>
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
                                <Badge variant="success" size="sm">Offer</Badge>
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
                                Shuttle every {listing.shuttleSchedule?.frequency || 20} min
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
                              <Button>View Details</Button>
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
