// User roles matching backend — simplified (no dispatcher/driver)
export type UserRole = 'customer' | 'host' | 'admin' | 'super_admin';

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
  role?: UserRole;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Pricing Tier (JSONB on parking_locations)
// Each tier represents a bookable date range with a flat total price
export interface PricingTier {
  start_date: string;   // ISO date, e.g. '2025-01-01'
  end_date: string;     // ISO date, e.g. '2025-01-15'
  total_price: number;  // flat total for the entire date range
  label?: string;       // optional label, e.g. '2 Wochen Januar'
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
  transferTime: number;
  totalSpaces: number;
  availableSpaces: number;
  pricePerDay: number;
  currency: string;
  amenities: ParkingAmenities;
  images: string[];
  phoneNumber: string;
  pricingTiers?: PricingTier[];
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
}

export interface PricingOffer {
  id: string;
  name: string;
  type: 'duration_discount' | 'early_bird' | 'promo_code';
  conditions: {
    minDays?: number;
    maxDays?: number;
    bookingWindow?: number;
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

  // Flight info
  outboundFlight?: string;
  returnFlight?: string;

  // Special requests
  specialRequests?: string;

  // Pricing
  totalDays: number;
  basePrice: number;
  discountAmount: number;
  serviceFee: number;
  platformServiceFee: number;
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

  createdAt: string;
  updatedAt: string;
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
  outboundFlight?: string;
  returnFlight?: string;
  specialRequests?: string;
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

// Host Types
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface HostProfile {
  id: string;
  user_id: string;
  company_name?: string;
  payout_account_id?: string;
  verification_status: VerificationStatus;
  documents_verified: boolean;
  rejection_reason?: string;
  commission_rate: number;
  service_fee: number;
  tax_id?: string;
  address?: string;
  phone_number?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface HostRegisterData {
  companyName?: string;
  taxId?: string;
  address?: string;
  phoneNumber?: string;
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
  bookings: string[];
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
  rating: number;
  title?: string;
  comment?: string;
  response?: string;
  responseAt?: string;
  isPublished: boolean;
  createdAt: string;
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
