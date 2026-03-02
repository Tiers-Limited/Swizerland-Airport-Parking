import { UserRole, UserStatus, VerificationStatus } from './roles';

// Base entity with common fields
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// User preferences
export interface UserPreferences {
  currency?: string;
  language?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_push?: boolean;
}

// User entity
export interface User extends BaseEntity {
  role: UserRole;
  email: string;
  phone?: string;
  name: string;
  password_hash: string;
  status: UserStatus;
  email_verified: boolean;
  preferences?: UserPreferences;
  last_login_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
}

// User without sensitive data
export interface UserPublic {
  id: string;
  role: UserRole;
  email: string;
  phone?: string;
  name: string;
  status: UserStatus;
  email_verified: boolean;
  preferences?: UserPreferences;
  created_at: Date;
}

// Host (Parking Provider) entity — single type, no operator/private distinction
export interface Host extends BaseEntity {
  user_id: string;
  company_name?: string;
  payout_account_id?: string;
  verification_status: VerificationStatus;
  documents_verified: boolean;
  commission_rate: number; // % platform takes (default 18%)
  service_fee: number; // CHF fee per booking (default 5)
  tax_id?: string;
  address?: string;
  phone_number?: string;
  website?: string;
}

// Refresh Token entity for session management
export interface RefreshToken extends BaseEntity {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  revoked_at?: Date;
  device_info?: string;
  ip_address?: string;
}

// Password Reset Token
export interface PasswordResetToken extends BaseEntity {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
}

// Email Verification Token
export interface EmailVerificationToken extends BaseEntity {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
}

// Audit Log for tracking important actions
export interface AuditLog extends BaseEntity {
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// ============================================
// CORE BUSINESS ENTITIES
// ============================================

// Location Status
export type LocationStatus = 'pending' | 'active' | 'inactive' | 'rejected';

// Pricing Tier (stored on parking_locations.pricing_tiers JSONB)
// Each tier represents a bookable date range with a flat total price
export interface PricingTier {
  start_date: string;   // ISO date, e.g. '2025-01-01'
  end_date: string;     // ISO date, e.g. '2025-01-15'
  total_price: number;  // flat total price for the entire date range (NOT per-day)
  label?: string;       // optional display label, e.g. '2 Wochen Januar'
}

// Parking Location entity
export interface ParkingLocation extends BaseEntity {
  host_id: string;
  name: string;
  address: string; // exact address sent to customer after booking
  phone_number: string; // host phone sent to customer after booking
  location?: { latitude: number; longitude: number };
  airport_code: string; // Default 'ZRH'
  capacity_total: number;
  amenities?: Record<string, boolean>;
  distance_to_airport_min?: number;
  description?: string;
  images?: string[];
  photos?: string[];
  base_price_per_day?: number;
  pricing_tiers?: PricingTier[];
  cancellation_policy?: string;
  check_in_instructions?: string;
  status: LocationStatus;
}

// Pricing Offers
export interface PricingOffer {
  min_days: number;
  discount_percent: number;
}

// Pricing Rules entity
export interface PricingRule extends BaseEntity {
  location_id: string;
  base_rate_per_day: number;
  offers?: PricingOffer[];
  min_stay_days: number;
  max_stay_days: number;
  currency: string;
}

// Booking Status — simplified (no shuttle statuses)
export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'refunded';

// Booking entity
export interface Booking extends BaseEntity {
  customer_id: string;
  location_id: string;
  start_datetime: Date;
  end_datetime: Date;
  car_plate: string;
  car_model?: string;
  passengers: number;
  luggage: number;
  outbound_flight_no?: string;
  return_flight_no?: string;
  status: BookingStatus;
  base_price?: number;
  discount_applied: number;
  service_fee: number;
  platform_service_fee: number;
  total_price: number;
  platform_commission?: number;
  host_payout?: number;
  addons?: BookingAddon[];
  addons_total?: number;
  currency: string;
  payment_id?: string;
  special_notes?: string;
  booking_code: string;
}

// Payment Status
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

// Payment entity
export interface Payment extends BaseEntity {
  user_id: string;
  booking_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refunded_amount: number;
  payment_method?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// ADD-ONS / EXTRA SERVICES
// ============================================

// Location Add-on entity (host-defined extra services per listing)
export interface LocationAddon extends BaseEntity {
  location_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  max_quantity: number;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

// Selected add-on stored in booking.addons JSONB
export interface BookingAddon {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number; // price × quantity
}

// Notification Type
export type NotificationType = 'email' | 'sms' | 'push';

// Notification Status
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Notification entity
export interface Notification extends BaseEntity {
  user_id?: string;
  booking_id?: string;
  type: NotificationType;
  subject?: string;
  content: string;
  status: NotificationStatus;
  sent_at?: Date;
  metadata?: Record<string, unknown>;
}