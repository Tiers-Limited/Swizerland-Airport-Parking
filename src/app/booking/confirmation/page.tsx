'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock booking data (in real app, fetch from API using booking code)
const mockBooking = {
  bookingCode: 'ZP-2024-1234',
  listing: {
    name: 'Zurich Secure Parking',
    address: 'Flughafenstrasse 50, 8302 Kloten',
    phone: '+41 44 888 77 66',
    shuttleFrequency: 'Every 10 minutes',
  },
  startDate: '2024-03-15',
  endDate: '2024-03-22',
  arrivalTime: '10:00',
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  vehiclePlate: 'ZH 123456',
  passengerCount: 2,
  luggageCount: 3,
  totalDays: 7,
  totalPrice: 162,
};

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingCode = searchParams.get('code') || mockBooking.bookingCode;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Your parking reservation has been successfully confirmed.
            </p>
          </div>

          {/* Booking Code */}
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Your Booking Code</p>
              <p className="text-3xl font-bold text-primary-600 tracking-wider">{bookingCode}</p>
              <p className="text-sm text-gray-500 mt-2">
                Show this code when you arrive at the parking facility
              </p>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Booking Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(mockBooking.startDate)}
                    </p>
                    <p className="text-sm text-gray-600">Arrival at {mockBooking.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(mockBooking.endDate)}
                    </p>
                    <p className="text-sm text-gray-600">{mockBooking.totalDays} days</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Parking Facility</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{mockBooking.listing.name}</h3>
                    <p className="text-sm text-gray-600">{mockBooking.listing.address}</p>
                    <p className="text-sm text-gray-600">Phone: {mockBooking.listing.phone}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="primary" size="sm">
                        Shuttle: {mockBooking.listing.shuttleFrequency}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Vehicle & Passengers</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium text-gray-900">{mockBooking.vehiclePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passengers</p>
                    <p className="font-medium text-gray-900">{mockBooking.passengerCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Luggage</p>
                    <p className="font-medium text-gray-900">{mockBooking.luggageCount} pieces</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Paid</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mockBooking.totalPrice)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">What's Next?</h2>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Arrive at the parking facility</p>
                    <p className="text-sm text-gray-600">
                      Drive to {mockBooking.listing.address} on {formatDate(mockBooking.startDate)} around {mockBooking.arrivalTime}.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Check in with your booking code</p>
                    <p className="text-sm text-gray-600">
                      Show your booking code ({bookingCode}) at the reception. Staff will guide you to your parking spot.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Take the shuttle to the airport</p>
                    <p className="text-sm text-gray-600">
                      Free shuttles run {mockBooking.listing.shuttleFrequency.toLowerCase()} and will take you directly to the terminal.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Return and collect your car</p>
                    <p className="text-sm text-gray-600">
                      When you land, take the shuttle back to the parking facility. Your car will be ready!
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/bookings">
              <Button variant="secondary">
                View My Bookings
              </Button>
            </Link>
            <Button onClick={() => window.print()}>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Confirmation
            </Button>
            <Link href="/">
              <Button variant="ghost">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Email Notice */}
          <p className="text-center text-sm text-gray-500 mt-8">
            A confirmation email has been sent to <strong>{mockBooking.customerEmail}</strong>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
