// User roles matching backend
export type UserRole = 'customer' | 'host' | 'dispatcher' | 'driver' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'pending_verification' | 'suspended' | 'deleted';
  email_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'customer' | 'host';
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Parking Listing Types
export interface ParkingListing {
  id: string;
  hostId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  airportCode: string;
  latitude: number;
  longitude: number;
  distanceToAirport: string;
  transferTime: number; // minutes
  totalSpaces: number;
  availableSpaces: number;
  pricePerDay: number;
  currency: string;
  amenities: ParkingAmenities;
  images: string[];
  shuttleMode: 'scheduled' | 'on_demand' | 'hybrid';
  shuttleSchedule?: ShuttleSchedule;
  offers: PricingOffer[];
  addons?: LocationAddon[];
  isActive: boolean;
  isApproved: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingAmenities {
  covered: boolean;
  evCharging: boolean;
  security247: boolean;
  cctv: boolean;
  fenced: boolean;
  lit: boolean;
  accessible: boolean;
  carWash: boolean;
  valetParking: boolean;
}

export interface ShuttleSchedule {
  operatingHours: {
    start: string;
    end: string;
  };
  frequency: number; // minutes
  peakHours?: {
    start: string;
    end: string;
    frequency: number;
  };
}

export interface PricingOffer {
  id: string;
  name: string;
  type: 'duration_discount' | 'early_bird' | 'promo_code';
  conditions: {
    minDays?: number;
    maxDays?: number;
    bookingWindow?: number; // days in advance
    promoCode?: string;
  };
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

// Booking Types
export type BookingStatus = 
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  listingId: string;
  listing?: ParkingListing;
  
  // Dates
  startDate: string;
  endDate: string;
  arrivalTime: string;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Vehicle info
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  
  // Trip details
  passengerCount: number;
  luggageCount: number;
  
  // Flight info
  outboundFlight?: string;
  returnFlight?: string;
  returnFlightArrival?: string;
  
  // Special requests
  specialRequests?: SpecialRequests;
  
  // Pricing
  totalDays: number;
  basePrice: number;
  discountAmount: number;
  serviceFee: number;
  addons?: BookingAddon[];
  addonsTotal?: number;
  totalPrice: number;
  currency: string;
  appliedOffer?: string;
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  paymentIntentId?: string;
  
  // Status
  status: BookingStatus;
  
  // Shuttle
  outboundShuttleId?: string;
  returnShuttleId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SpecialRequests {
  childSeat: boolean;
  wheelchairAssistance: boolean;
  notes?: string;
}

export interface BookingCreateData {
  listingId: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  passengerCount: number;
  luggageCount: number;
  outboundFlight?: string;
  returnFlight?: string;
  returnFlightArrival?: string;
  specialRequests?: SpecialRequests;
  promoCode?: string;
  addons?: SelectedAddonInput[];
}

// Search Types
export interface SearchFilters {
  startDate: string;
  endDate: string;
  airportCode?: string;
  priceMin?: number;
  priceMax?: number;
  covered?: boolean;
  evCharging?: boolean;
  security247?: boolean;
  shuttleMode?: 'scheduled' | 'on_demand' | 'hybrid';
  sortBy?: 'price' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  listings: ParkingListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Shuttle Types
export type ShuttleTripType = 'lot_to_airport' | 'airport_to_lot';
export type ShuttleTripStatus = 
  | 'pending'
  | 'assigned'
  | 'arrived_lot'
  | 'departed_lot'
  | 'arrived_airport'
  | 'picked_up_airport'
  | 'completed'
  | 'cancelled';

export interface ShuttleTrip {
  id: string;
  listingId: string;
  driverId?: string;
  vehicleId?: string;
  type: ShuttleTripType;
  status: ShuttleTripStatus;
  scheduledTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  passengers: ShuttlePassenger[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShuttlePassenger {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;
  luggageCount: number;
  specialRequests?: SpecialRequests;
}

export interface ShuttleVehicle {
  id: string;
  location_id: string;
  plate: string;
  capacity_passengers: number;
  capacity_luggage: number;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  active: boolean;
  maintenance_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Host Types
export type HostType = 'operator' | 'private';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface HostProfile {
  id: string;
  user_id: string;
  company_name?: string;
  host_type: HostType;
  payout_account_id?: string;
  verification_status: VerificationStatus;
  documents_verified: boolean;
  commission_rate: number; // default 19%
  service_fee: number;
  tax_id?: string;
  address?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface HostRegisterData {
  companyName?: string;
  hostType: HostType;
  taxId?: string;
  address?: string;
  website?: string;
}

export interface BankAccountInfo {
  accountHolder: string;
  iban: string;
  bic?: string;
}

export interface Payout {
  id: string;
  hostId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bookings: string[]; // booking IDs
  stripePayoutId?: string;
  createdAt: string;
  completedAt?: string;
}

// Review Types (Phase 2)
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  listingId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  response?: string;
  responseAt?: string;
  isPublished: boolean;
  createdAt: string;
}

// Driver Types
export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  documents_verified: boolean;
  name?: string;
  email?: string;
  phone?: string;
}

// Shift Types
export interface ShuttleShift {
  id: string;
  location_id: string;
  vehicle_id: string;
  driver_user_id: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'active' | 'closed';
  vehicle_plate?: string;
  driver_name?: string;
}

// Blackout Date Types
export interface BlackoutDate {
  id: string;
  location_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

// Location Add-on / Extra Service Types
export interface LocationAddon {
  id: string;
  location_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  max_quantity: number;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingAddon {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface SelectedAddonInput {
  addonId: string;
  quantity: number;
}

// Dispatch Assignment
export interface DispatchAssignment {
  booking_id: string;
  trip_id: string;
  status: 'assigned' | 'boarded' | 'no_show' | 'cancelled';
}
