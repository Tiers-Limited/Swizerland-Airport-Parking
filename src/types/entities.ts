import { UserRole, UserStatus, HostType, VerificationStatus } from './roles';

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

// Host (Parking Provider) entity
export interface Host extends BaseEntity {
  user_id: string;
  company_name?: string;
  host_type: HostType;
  payout_account_id?: string;
  verification_status: VerificationStatus;
  documents_verified: boolean;
  commission_rate: number; // % platform takes (default 19%)
  service_fee: number; // Optional CHF fee per booking
  tax_id?: string;
  address?: string;
  website?: string;
}

// Driver Profile - extra info for shuttle drivers
export interface DriverProfile extends BaseEntity {
  user_id: string;
  license_number: string;
  license_expiry: Date;
  verification_status: VerificationStatus;
  documents_verified: boolean;
}

// Dispatcher Profile
export interface DispatcherProfile extends BaseEntity {
  user_id: string;
  location_ids: string[]; // Can manage shuttles for these parking locations
  shift_preference?: string;
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

// Shuttle Hours configuration
export interface ShuttleHours {
  start: string; // "05:00"
  end: string; // "23:00"
  frequency_min?: number;
}

// Buffer Settings for parking operations
export interface BufferSettings {
  lot_processing_min: number;
  transfer_time_min: number;
  pickup_buffer_min: number;
}

// Location Status
export type LocationStatus = 'pending' | 'active' | 'inactive' | 'rejected';

// Shuttle Mode
export type ShuttleMode = 'scheduled' | 'on_demand' | 'hybrid';

// Parking Location entity
export interface ParkingLocation extends BaseEntity {
  host_id: string;
  name: string;
  address: string;
  location?: { latitude: number; longitude: number };
  airport_code: string; // Default 'ZRH'
  capacity_total: number;
  amenities?: Record<string, boolean>; // e.g., {"covered": true, "ev_charging": true}
  shuttle_mode: ShuttleMode;
  shuttle_hours?: ShuttleHours;
  buffer_settings?: BufferSettings;
  distance_to_airport_min?: number;
  description?: string;
  images?: string[];
  photos?: string[];
  base_price_per_day?: number;
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

// Booking Status
export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'shuttle_to_airport_completed'
  | 'awaiting_pickup'
  | 'shuttle_pickup_completed'
  | 'checked_out'
  | 'cancelled'
  | 'no_show'
  | 'refunded';

// Return Pickup Preference
export type ReturnPickupPreference = 'flight' | 'time';

// Booking entity
export interface Booking extends BaseEntity {
  customer_id: string;
  location_id: string;
  start_datetime: Date;
  end_datetime: Date;
  arrival_lot_datetime: Date;
  return_pickup_preference: ReturnPickupPreference;
  outbound_flight_no?: string;
  return_flight_no?: string;
  passengers: number;
  luggage: number;
  car_plate: string;
  car_model?: string;
  status: BookingStatus;
  base_price?: number;
  discount_applied: number;
  service_fee: number;
  total_price: number;
  platform_commission?: number;
  host_payout?: number;
  currency: string;
  payment_id?: string;
  special_notes?: string;
  child_seat_required: boolean;
  wheelchair_assistance: boolean;
  booking_code: string;
}

// Shuttle Vehicle entity
export interface ShuttleVehicle extends BaseEntity {
  location_id?: string;
  plate: string;
  capacity_passengers: number;
  capacity_luggage: number;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  active: boolean;
  maintenance_notes?: string;
}

// Shift Status
export type ShiftStatus = 'planned' | 'active' | 'closed' | 'cancelled';

// Shuttle Shift entity
export interface ShuttleShift extends BaseEntity {
  vehicle_id: string;
  driver_user_id: string;
  start_time: Date;
  end_time: Date;
  status: ShiftStatus;
  notes?: string;
}

// Trip Direction
export type TripDirection = 'lot_to_airport' | 'airport_to_lot';

// Trip Status
export type TripStatus = 'planned' | 'boarding' | 'en_route' | 'completed' | 'cancelled' | 'delayed';

// Shuttle Trip entity
export interface ShuttleTrip extends BaseEntity {
  shift_id: string;
  direction: TripDirection;
  scheduled_departure: Date;
  actual_departure?: Date;
  actual_arrival?: Date;
  status: TripStatus;
  current_passengers: number;
  current_luggage: number;
  max_capacity_passengers: number;
  max_capacity_luggage?: number;
  notes?: string;
}

// Trip Booking Status
export type TripBookingStatus = 'assigned' | 'boarded' | 'no_show' | 'cancelled';

// Shuttle Trip Booking (junction table)
export interface ShuttleTripBooking {
  trip_id: string;
  booking_id: string;
  seat_count: number;
  luggage_count: number;
  status: TripBookingStatus;
  assigned_at: Date;
  boarded_at?: Date;
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