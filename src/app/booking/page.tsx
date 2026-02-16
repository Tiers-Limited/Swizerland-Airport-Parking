'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Badge, Spinner } from '@/components/ui';
import { Header, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock parking data
const mockParking = {
  id: '1',
  name: 'Zurich Secure Parking',
  dailyRate: 25,
  weeklyDiscount: 10,
  shuttleFrequency: '10 min',
  distanceFromAirport: 2.5,
  address: 'Flughafenstrasse 50, 8302 Kloten',
};

interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleColor: string;
  passengerCount: number;
  luggageCount: number;
  flightNumber: string;
  specialRequests: string;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get dates from URL params
  const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('end') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const arrivalTime = searchParams.get('arrival') || '10:00';
  const parkingId = searchParams.get('parking') || mockParking.id;

  // Calculate pricing
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const basePrice = totalDays * mockParking.dailyRate;
  const discountAmount = totalDays >= 7 ? basePrice * (mockParking.weeklyDiscount / 100) : 0;
  const serviceFee = 4.50;
  const totalPrice = basePrice - discountAmount + serviceFee;

  const [form, setForm] = useState<BookingFormData>({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    vehiclePlate: '',
    vehicleMake: '',
    vehicleColor: '',
    passengerCount: 1,
    luggageCount: 0,
    flightNumber: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: API call to create booking
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Redirect to confirmation page
      router.push(`/booking/confirmation?code=ZP-2024-${Math.random().toString().slice(2, 6)}`);
    } catch {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/zurich" className="hover:text-primary-600">Search</Link>
            <span>/</span>
            <Link href={`/parking/${parkingId}`} className="hover:text-primary-600">{mockParking.name}</Link>
            <span>/</span>
            <span className="text-gray-900">Booking</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>

              {error && <Alert variant="error">{error}</Alert>}

              {!isAuthenticated && (
                <Alert variant="info">
                  <Link href="/login" className="font-medium underline">Log in</Link> to auto-fill your details and manage your bookings easily.
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Full Name"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Email Address"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        required
                      />
                      <Input
                        label="Phone Number"
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
                    <CardTitle>Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="License Plate"
                        value={form.vehiclePlate}
                        onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                        placeholder="ZH 123456"
                        required
                      />
                      <Input
                        label="Make/Model (optional)"
                        value={form.vehicleMake}
                        onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
                        placeholder="e.g., VW Golf"
                      />
                      <Input
                        label="Color (optional)"
                        value={form.vehicleColor}
                        onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
                        placeholder="e.g., Silver"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Travel Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passengers
                        </label>
                        <select
                          value={form.passengerCount}
                          onChange={(e) => setForm({ ...form, passengerCount: parseInt(e.target.value) })}
                          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Luggage
                        </label>
                        <select
                          value={form.luggageCount}
                          onChange={(e) => setForm({ ...form, luggageCount: parseInt(e.target.value) })}
                          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n} value={n}>{n} piece{n !== 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Flight Number (optional)"
                        value={form.flightNumber}
                        onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g., LX 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requests (optional)
                      </label>
                      <textarea
                        value={form.specialRequests}
                        onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                        placeholder="Any special requirements..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <svg className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <p>Secure payment will be integrated here</p>
                      <p className="text-sm mt-1">Accept Visa, Mastercard, TWINT, and more</p>
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
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>,{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>, and{' '}
                    <Link href="/cancellation-policy" className="text-primary-600 hover:underline">Cancellation Policy</Link>.
                  </label>
                </div>

                <Button type="submit" size="lg" fullWidth loading={loading}>
                  Complete Booking
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{mockParking.name}</h3>
                    <p className="text-sm text-gray-500">{mockParking.address}</p>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Check-in</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(startDate)} at {arrivalTime}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Check-out</span>
                      <span className="font-medium text-gray-900">{formatDate(endDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">{totalDays} days</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {totalDays} x {formatCurrency(mockParking.dailyRate)}/day
                      </span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-success-600">
                        <span>Weekly discount ({mockParking.weeklyDiscount}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service fee</span>
                      <span>{formatCurrency(serviceFee)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-gray-900">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                  </div>

                  <div className="bg-success-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-success-700 text-sm">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Free cancellation until 24h before</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Free shuttle every {mockParking.shuttleFrequency}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
