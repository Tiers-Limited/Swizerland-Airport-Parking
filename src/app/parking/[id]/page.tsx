'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, Card, Badge, Alert } from '@/components/ui';
import { formatCurrency, calculateDays, formatDate } from '@/lib/utils';
import type { ParkingListing, SpecialRequests } from '@/types';

// Mock data (will be replaced by API)
const getMockListing = (id: string): ParkingListing | null => {
  const listings: Record<string, ParkingListing> = {
    '1': {
      id: '1',
      hostId: 'h1',
      name: 'Zurich Secure Parking',
      description: 'Premium secure parking with covered spaces and 24/7 security surveillance. Our facility offers the best combination of security, convenience, and value for travelers using Zurich Airport. With our modern covered parking structure, your vehicle is protected from the elements while you travel. Our free shuttle service runs every 20 minutes to all terminals, making your journey seamless from start to finish.',
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
      images: ['/images/parking-1.jpg', '/images/parking-1b.jpg', '/images/parking-1c.jpg'],
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
  };
  return listings[id] || listings['1'];
};

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function ParkingDetailPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [listing] = useState<ParkingListing | null>(() => getMockListing(id));
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

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card padding="lg" className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Parking not found</h1>
            <p className="text-gray-500 mb-4">The parking location you're looking for doesn't exist.</p>
            <Link href="/zurich">
              <Button>Browse All Parking</Button>
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
    if (offer.isActive && offer.conditions.minDays && days >= offer.conditions.minDays) {
      if (offer.discount.type === 'percentage') {
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
    { key: 'covered', label: 'Covered Parking', icon: '🏠' },
    { key: 'evCharging', label: 'EV Charging', icon: '⚡' },
    { key: 'security247', label: '24/7 Security', icon: '🛡️' },
    { key: 'cctv', label: 'CCTV Surveillance', icon: '📹' },
    { key: 'fenced', label: 'Fenced Area', icon: '🔒' },
    { key: 'lit', label: 'Well Lit', icon: '💡' },
    { key: 'accessible', label: 'Accessible', icon: '♿' },
    { key: 'carWash', label: 'Car Wash', icon: '🚿' },
    { key: 'valetParking', label: 'Valet Parking', icon: '🎩' },
  ];

  const handleProceedToBooking = () => {
    if (!startDate || !endDate) {
      alert('Please select your travel dates');
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
                  <p>Parking Images</p>
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
                      <span className="text-gray-500">({listing.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About this parking</h2>
                <p className="text-gray-600">{listing.description}</p>
              </Card>

              {/* Shuttle Info */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Shuttle Service</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Free Shuttle</p>
                      <p className="text-xs text-gray-500">Every {listing.shuttleSchedule?.frequency || 20} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-baby-blue-100 text-baby-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Operating Hours</p>
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
                      <p className="text-sm font-medium text-gray-900">Transfer Time</p>
                      <p className="text-xs text-gray-500">{listing.transferTime} minutes to terminal</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Amenities */}
              <Card padding="md" className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
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

              {/* Cancellation Policy */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-success-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Full refund if cancelled more than 24 hours before arrival</span>
                  </div>
                  <div className="flex items-center gap-2 text-warning-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>50% refund if cancelled 12-24 hours before arrival</span>
                  </div>
                  <div className="flex items-center gap-2 text-error-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>No refund if cancelled less than 12 hours before arrival</span>
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
                    <Badge variant="warning">Only {listing.availableSpaces} left</Badge>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off</label>
                      <input
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={() => {}}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pick-up</label>
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
                        {formatCurrency(listing.pricePerDay)} × {days} days
                      </span>
                      <span className="text-gray-900">{formatCurrency(basePrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-success-600">
                        <span>{appliedOffer} discount</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service fee</span>
                      <span className="text-gray-900">{formatCurrency(serviceFee)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                {/* Offer Badge */}
                {listing.offers.length > 0 && (
                  <Alert variant="success" className="mb-4">
                    <span className="font-medium">Special Offer:</span> Book 7+ days and save 10%!
                  </Alert>
                )}

                {/* CTA */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceedToBooking}
                >
                  Reserve Now
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  You won't be charged yet
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
