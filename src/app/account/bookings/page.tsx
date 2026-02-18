'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Input } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

// Mock data
const mockBookings: (Booking & { listing: { name: string } })[] = [
  {
    id: '1',
    bookingCode: 'ZP-2024-001',
    customerId: 'c1',
    listingId: 'l1',
    listing: { name: 'Zurich Secure Parking' },
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    arrivalTime: '10:00',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+41 79 123 45 67',
    vehiclePlate: 'ZH 123456',
    passengerCount: 2,
    luggageCount: 3,
    totalDays: 7,
    basePrice: 175,
    discountAmount: 17.50,
    serviceFee: 4.50,
    totalPrice: 162,
    currency: 'CHF',
    paymentStatus: 'paid',
    status: 'confirmed',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  },
  {
    id: '2',
    bookingCode: 'ZP-2024-002',
    customerId: 'c1',
    listingId: 'l2',
    listing: { name: 'Budget Park ZRH' },
    startDate: '2024-01-10',
    endDate: '2024-01-15',
    arrivalTime: '08:30',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+41 79 123 45 67',
    vehiclePlate: 'ZH 123456',
    passengerCount: 1,
    luggageCount: 2,
    totalDays: 5,
    basePrice: 75,
    discountAmount: 0,
    serviceFee: 4.50,
    totalPrice: 79.50,
    currency: 'CHF',
    paymentStatus: 'paid',
    status: 'completed',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-15',
  },
  {
    id: '3',
    bookingCode: 'ZP-2023-015',
    customerId: 'c1',
    listingId: 'l1',
    listing: { name: 'Zurich Secure Parking' },
    startDate: '2023-12-20',
    endDate: '2023-12-27',
    arrivalTime: '14:00',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+41 79 123 45 67',
    vehiclePlate: 'ZH 123456',
    passengerCount: 4,
    luggageCount: 6,
    totalDays: 7,
    basePrice: 175,
    discountAmount: 17.50,
    serviceFee: 4.50,
    totalPrice: 162,
    currency: 'CHF',
    paymentStatus: 'paid',
    status: 'completed',
    createdAt: '2023-12-01',
    updatedAt: '2023-12-27',
  },
];

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

const statusColors: Record<BookingStatus, 'success' | 'primary' | 'warning' | 'error' | 'gray'> = {
  draft: 'gray',
  pending_payment: 'warning',
  confirmed: 'success',
  checked_in: 'primary',
  completed: 'gray',
  cancelled: 'error',
  refunded: 'error',
};

export default function BookingsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = mockBookings.filter((booking) => {
    // Filter by status
    if (filter === 'upcoming') {
      return ['confirmed', 'checked_in'].includes(booking.status);
    }
    if (filter === 'completed') {
      return booking.status === 'completed';
    }
    if (filter === 'cancelled') {
      return ['cancelled', 'refunded'].includes(booking.status);
    }

    // Search by booking code or parking name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (booking.bookingCode || '').toLowerCase().includes(query) ||
        (booking.listing?.name || '').toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500">View and manage your parking reservations.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by booking code or parking name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card padding="lg" className="text-center">
          <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filter === 'all'
              ? "You haven't made any bookings yet."
              : `No ${filter} bookings.`}
          </p>
          <Link href="/zurich">
            <Button>Find Parking</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} variant="hover" padding="none">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{booking.listing.name}</h3>
                      <Badge variant={statusColors[booking.status]}>
                        {(booking.status || '').replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Booking Code</p>
                        <p className="font-medium text-gray-900">{booking.bookingCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Dates</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(booking.startDate, { month: 'short', day: 'numeric' })} -{' '}
                          {formatDate(booking.endDate, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-medium text-gray-900">{booking.vehiclePlate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-gray-900">{formatCurrency(booking.totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/account/bookings/${booking.id}`}>
                      <Button variant="secondary" size="sm">View Details</Button>
                    </Link>
                    {['confirmed', 'pending_payment'].includes(booking.status) && (
                      <Button variant="ghost" size="sm" className="text-error-600 hover:text-error-700">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
