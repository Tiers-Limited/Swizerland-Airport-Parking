import { db } from '../database';
import { NotFoundError, ValidationError, AppError } from '../utils/errors';
import { generateBookingCode } from '../utils/auth.utils';
import { BookingStatus } from '../types/entities';

// ─── Types ─────────────────────────────────────────────────────────
export interface SelectedAddonInput {
  addonId: string;
  quantity: number;
}

export interface CreateBookingInput {
  customerId: string;
  locationId: string;
  startDatetime: string;
  endDatetime: string;
  arrivalLotDatetime: string;
  returnPickupPreference?: 'flight' | 'time';
  outboundFlightNo?: string;
  returnFlightNo?: string;
  passengers: number;
  luggage: number;
  carPlate: string;
  carModel?: string;
  specialNotes?: string;
  childSeatRequired?: boolean;
  wheelchairAssistance?: boolean;
  addons?: SelectedAddonInput[];
}

export interface AddonBreakdownItem {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface BookingPriceBreakdown {
  days: number;
  baseRatePerDay: number;
  basePrice: number;
  discountPercent: number;
  discountApplied: number;
  addons: AddonBreakdownItem[];
  addonsTotal: number;
  serviceFee: number;
  totalPrice: number;
  platformCommission: number;
  hostPayout: number;
  currency: string;
}

export interface CancelBookingResult {
  booking: Record<string, unknown>;
  refundAmount: number;
  refundPercent: number;
  reason: string;
}

// ─── Valid state transitions ────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['shuttle_to_airport_completed', 'cancelled'],
  shuttle_to_airport_completed: ['awaiting_pickup'],
  awaiting_pickup: ['shuttle_pickup_completed'],
  shuttle_pickup_completed: ['checked_out'],
  checked_out: [],
  cancelled: ['refunded'],
  no_show: [],
  refunded: [],
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Round to 2 decimal places. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Calculate parking days between two dates (min 1). */
function calcDays(startDatetime: string, endDatetime: string): number {
  const diffMs = new Date(endDatetime).getTime() - new Date(startDatetime).getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Validate min/max stay against pricing rule. */
function validateStay(days: number, pricingRule: Record<string, unknown> | undefined): void {
  if (!pricingRule) return;
  const minDays = (pricingRule.min_stay_days as number) || 1;
  const maxDays = (pricingRule.max_stay_days as number) || 30;
  if (days < minDays) throw new ValidationError(`Minimum stay is ${minDays} day(s)`);
  if (days > maxDays) throw new ValidationError(`Maximum stay is ${maxDays} day(s)`);
}

/** Find best applicable discount percent from offers. */
function bestDiscountPercent(pricingRule: Record<string, unknown> | undefined, days: number): number {
  if (!pricingRule?.offers) return 0;
  const offers = typeof pricingRule.offers === 'string'
    ? JSON.parse(pricingRule.offers)
    : pricingRule.offers;
  if (!Array.isArray(offers)) return 0;
  let best = 0;
  for (const offer of offers) {
    if (days >= (offer.min_days || 0) && offer.discount_percent > best) {
      best = offer.discount_percent;
    }
  }
  return best;
}

// ─── Booking Service ────────────────────────────────────────────────
export class BookingService {

  // ── Calculate Price ────────────────────────────────────────────────
  async calculatePrice(
    locationId: string,
    startDatetime: string,
    endDatetime: string,
    selectedAddons?: SelectedAddonInput[]
  ): Promise<BookingPriceBreakdown> {
    const location = await db('parking_locations').where('id', locationId).first();
    if (!location) throw new NotFoundError('Parking location');

    const pricingRule = await db('pricing_rules').where('location_id', locationId).first();

    const baseRatePerDay = pricingRule
      ? Number(pricingRule.base_rate_per_day)
      : Number(location.base_price_per_day || 15);

    const days = calcDays(startDatetime, endDatetime);
    validateStay(days, pricingRule);

    const basePrice = days * baseRatePerDay;
    const discountPercent = bestDiscountPercent(pricingRule, days);
    const discountApplied = round2(basePrice * discountPercent / 100);
    const priceAfterDiscount = basePrice - discountApplied;

    // Resolve add-ons
    const addonBreakdown: AddonBreakdownItem[] = [];
    let addonsTotal = 0;
    if (selectedAddons && selectedAddons.length > 0) {
      const addonIds = selectedAddons.map(a => a.addonId);
      const dbAddons = await db('location_addons')
        .whereIn('id', addonIds)
        .where('location_id', locationId)
        .where('is_active', true);

      for (const sel of selectedAddons) {
        const dbAddon = dbAddons.find((a: { id: string }) => a.id === sel.addonId);
        if (!dbAddon) continue; // skip unknown addons silently
        const qty = Math.min(Math.max(sel.quantity, 1), dbAddon.max_quantity);
        const total = round2(Number(dbAddon.price) * qty);
        addonBreakdown.push({
          addonId: dbAddon.id,
          name: dbAddon.name,
          price: Number(dbAddon.price),
          quantity: qty,
          total,
        });
        addonsTotal += total;
      }
      addonsTotal = round2(addonsTotal);
    }

    // Platform settings
    const settings = await db('platform_settings').first();
    const serviceFeeRate = settings ? Number(settings.service_fee_rate || 5) : 5;
    const commissionRate = settings ? Number(settings.commission_rate || 19) : 19;

    const serviceFee = round2(priceAfterDiscount * serviceFeeRate / 100);
    // Commission applies to parking price only, NOT add-ons
    const platformCommission = round2(priceAfterDiscount * commissionRate / 100);
    // Total = parking after discount + service fee + all add-ons
    const totalPrice = round2(priceAfterDiscount + serviceFee + addonsTotal);
    // Host gets: parking minus commission + full add-ons revenue
    const hostPayout = round2(priceAfterDiscount - platformCommission + addonsTotal);

    return {
      days,
      baseRatePerDay,
      basePrice: round2(basePrice),
      discountPercent,
      discountApplied,
      addons: addonBreakdown,
      addonsTotal,
      serviceFee,
      totalPrice,
      platformCommission,
      hostPayout,
      currency: pricingRule?.currency || 'CHF',
    };
  }

  // ── Create Booking ─────────────────────────────────────────────────
  async createBooking(input: CreateBookingInput): Promise<Record<string, unknown>> {
    const location = await db('parking_locations').where('id', input.locationId).first();
    if (!location) throw new NotFoundError('Parking location');
    if (location.status !== 'active') {
      throw new ValidationError('This parking location is not currently available');
    }

    // Check availability (current confirmed/active bookings overlapping dates)
    const overlappingCount = await this.getOverlappingBookingCount(
      input.locationId,
      input.startDatetime,
      input.endDatetime
    );

    if (overlappingCount >= location.capacity_total) {
      throw new ValidationError('No available spaces for the selected dates');
    }

    // Calculate pricing
    const pricing = await this.calculatePrice(input.locationId, input.startDatetime, input.endDatetime, input.addons);

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db('bookings').where('booking_code', bookingCode).first();
      if (!existing) break;
      bookingCode = generateBookingCode();
      attempts++;
    }

    // Create booking in draft status
    const [booking] = await db('bookings')
      .insert({
        customer_id: input.customerId,
        location_id: input.locationId,
        start_datetime: input.startDatetime,
        end_datetime: input.endDatetime,
        arrival_lot_datetime: input.arrivalLotDatetime,
        return_pickup_preference: input.returnPickupPreference || 'flight',
        outbound_flight_no: input.outboundFlightNo,
        return_flight_no: input.returnFlightNo,
        passengers: input.passengers,
        luggage: input.luggage,
        car_plate: input.carPlate,
        car_model: input.carModel,
        special_notes: input.specialNotes,
        child_seat_required: input.childSeatRequired || false,
        wheelchair_assistance: input.wheelchairAssistance || false,
        status: 'pending_payment',
        base_price: pricing.basePrice,
        discount_applied: pricing.discountApplied,
        service_fee: pricing.serviceFee,
        total_price: pricing.totalPrice,
        platform_commission: pricing.platformCommission,
        host_payout: pricing.hostPayout,
        addons: JSON.stringify(pricing.addons),
        addons_total: pricing.addonsTotal,
        currency: pricing.currency,
        booking_code: bookingCode,
      })
      .returning('*');

    return booking;
  }

  // ── Confirm Booking (after payment) ────────────────────────────────
  async confirmBooking(bookingId: string, paymentId: string): Promise<Record<string, unknown>> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    if (booking.status !== 'pending_payment' && booking.status !== 'draft') {
      throw new ValidationError(`Cannot confirm booking in ${booking.status} status`);
    }

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status: 'confirmed',
        payment_id: paymentId,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── Update Booking Status ──────────────────────────────────────────
  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    userId?: string
  ): Promise<Record<string, unknown>> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    const currentStatus = booking.status as string;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({ status: newStatus, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Cancel Booking with Refund Calculation ─────────────────────────
  async cancelBooking(bookingId: string, userId: string, isAdmin: boolean = false): Promise<CancelBookingResult> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    // Check ownership (customer can cancel their own, admin can cancel any)
    if (!isAdmin && booking.customer_id !== userId) {
      throw new AppError('You can only cancel your own bookings', 403, 'FORBIDDEN');
    }

    const cancellableStatuses = ['confirmed', 'pending_payment', 'draft'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot cancel booking in ${booking.status} status`);
    }

    // Calculate refund based on time until arrival
    const now = new Date();
    const arrival = new Date(booking.start_datetime);
    const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercent = 0;
    let reason = '';

    if (booking.status === 'pending_payment' || booking.status === 'draft') {
      refundPercent = 100;
      reason = 'Booking was not yet paid';
    } else if (hoursUntilArrival > 24) {
      refundPercent = 100;
      reason = 'Cancelled more than 24 hours before arrival - full refund';
    } else if (hoursUntilArrival >= 12) {
      refundPercent = 50;
      reason = 'Cancelled 12-24 hours before arrival - 50% refund';
    } else {
      reason = 'Cancelled less than 12 hours before arrival - no refund';
    }

    // Admin override - always gets full control
    if (isAdmin) {
      // Admin can override, but we still calculate the standard amount
      // The actual refund will be handled separately
    }

    const refundAmount = Math.round((Number(booking.total_price) * refundPercent / 100) * 100) / 100;

    // Update booking status
    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status: refundPercent > 0 ? 'refunded' : 'cancelled',
        updated_at: new Date(),
      })
      .returning('*');

    return {
      booking: updated,
      refundAmount,
      refundPercent,
      reason,
    };
  }

  // ── Get Booking by ID ──────────────────────────────────────────────
  async getBookingById(bookingId: string): Promise<Record<string, unknown>> {
    const booking = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .leftJoin('payments', 'payments.id', 'bookings.payment_id')
      .select(
        'bookings.*',
        'parking_locations.name as location_name',
        'parking_locations.address as location_address',
        'parking_locations.images as location_images',
        'parking_locations.shuttle_mode',
        'parking_locations.shuttle_hours',
        'parking_locations.check_in_instructions',
        'parking_locations.host_id',
        'users.name as customer_name',
        'users.email as customer_email',
        'users.phone as customer_phone',
        'payments.status as payment_status',
        'payments.stripe_payment_intent_id'
      )
      .where('bookings.id', bookingId)
      .first();

    if (!booking) throw new NotFoundError('Booking');
    return booking;
  }

  // ── Get Booking by Code ────────────────────────────────────────────
  async getBookingByCode(bookingCode: string): Promise<Record<string, unknown>> {
    const booking = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .select(
        'bookings.*',
        'parking_locations.name as location_name',
        'parking_locations.address as location_address',
        'parking_locations.shuttle_mode',
        'parking_locations.check_in_instructions'
      )
      .where('bookings.booking_code', bookingCode)
      .first();

    if (!booking) throw new NotFoundError('Booking');
    return booking;
  }

  // ── Get Customer Bookings ──────────────────────────────────────────
  async getCustomerBookings(customerId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .where('bookings.customer_id', customerId);

    if (status) {
      if (status === 'active') {
        query = query.whereIn('bookings.status', ['confirmed', 'checked_in', 'shuttle_to_airport_completed', 'awaiting_pickup']);
      } else if (status === 'past') {
        query = query.whereIn('bookings.status', ['checked_out', 'shuttle_pickup_completed', 'cancelled', 'refunded', 'no_show']);
      } else {
        query = query.where('bookings.status', status);
      }
    }

    const [{ count }] = await query.clone().clearSelect().count('* as count');

    const bookings = await query
      .select(
        'bookings.*',
        'parking_locations.name as location_name',
        'parking_locations.address as location_address',
        'parking_locations.images as location_images'
      )
      .orderBy('bookings.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      bookings,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      page,
    };
  }

  // ── Get Customer Stats ─────────────────────────────────────────────
  async getCustomerStats(customerId: string) {
    const [totalBookings] = await db('bookings')
      .where('customer_id', customerId)
      .count('* as count');

    const [activeBookings] = await db('bookings')
      .where('customer_id', customerId)
      .whereIn('status', ['confirmed', 'checked_in', 'shuttle_to_airport_completed', 'awaiting_pickup'])
      .count('* as count');

    const [totalSpent] = await db('bookings')
      .where('customer_id', customerId)
      .whereNotIn('status', ['cancelled', 'draft', 'refunded'])
      .sum('total_price as total');

    const upcomingBookings = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .where('bookings.customer_id', customerId)
      .where('bookings.status', 'confirmed')
      .where('bookings.start_datetime', '>', new Date())
      .select(
        'bookings.*',
        'parking_locations.name as location_name',
        'parking_locations.address as location_address'
      )
      .orderBy('bookings.start_datetime', 'asc')
      .limit(5);

    return {
      totalBookings: Number(totalBookings.count),
      activeBookings: Number(activeBookings.count),
      totalSpent: Number(totalSpent.total || 0),
      upcomingBookings,
    };
  }

  // ── Helper: Count overlapping bookings ─────────────────────────────
  private async getOverlappingBookingCount(
    locationId: string,
    startDatetime: string,
    endDatetime: string
  ): Promise<number> {
    const [{ count }] = await db('bookings')
      .where('location_id', locationId)
      .whereNotIn('status', ['cancelled', 'refunded', 'draft', 'no_show', 'checked_out'])
      .where('start_datetime', '<', endDatetime)
      .where('end_datetime', '>', startDatetime)
      .count('* as count');

    return Number(count);
  }
}

export const bookingService = new BookingService();
