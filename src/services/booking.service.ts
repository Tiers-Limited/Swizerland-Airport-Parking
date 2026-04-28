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
  tierMatched: boolean;       // true if a pricing_tier covered the dates
  tierLabel?: string;         // label of the matched tier (if any)
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
  pending_payment: ['pending_approval', 'confirmed', 'cancelled'],
  pending_approval: ['confirmed', 'cancelled'],
  confirmed: ['modified', 'checked_in', 'cancelled', 'no_show'],
  modified: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['refunded'],
  no_show: [],
  refunded: [],
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Round to 2 decimal places. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

function resolveCancellationDetails(
  booking: Record<string, unknown>,
  isAdmin: boolean,
  reasonOverride?: string
): { refundPercent: number; reason: string } {
  const providedReason = reasonOverride?.trim() || '';
  if (isAdmin && !providedReason) {
    throw new ValidationError('Cancellation reason is required');
  }

  const bookingStatus = typeof booking.status === 'string' ? booking.status : '';
  const now = new Date();
  const arrival = new Date((typeof booking.start_datetime === 'string' ? booking.start_datetime : now.toISOString()));
  const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (bookingStatus === 'pending_payment' || bookingStatus === 'draft') {
    return {
      refundPercent: 100,
      reason: providedReason || 'Booking was not yet paid',
    };
  }

  if (hoursUntilArrival > 24) {
    return {
      refundPercent: 100,
      reason: providedReason || 'Cancelled more than 24 hours before arrival - full refund',
    };
  }

  if (hoursUntilArrival >= 12) {
    return {
      refundPercent: 50,
      reason: providedReason || 'Cancelled 12-24 hours before arrival - 50% refund',
    };
  }

  return {
    refundPercent: 0,
    reason: providedReason || 'Cancelled less than 12 hours before arrival - no refund',
  };
}

/** Calculate parking days between two dates (min 1). */
function calcDays(startDatetime: string, endDatetime: string): number {
  const diffMs = new Date(endDatetime).getTime() - new Date(startDatetime).getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Find the best matching pricing tier for the given booking dates.
 * A tier matches when the booking's start_date >= tier.start_date AND booking's end_date <= tier.end_date.
 * If multiple tiers match, pick the cheapest.
 */
function findMatchingTier(
  tiers: Array<{ start_date: string; end_date: string; total_price: number; label?: string }> | undefined,
  bookingStart: string,
  bookingEnd: string
): { total_price: number; label?: string } | null {
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return null;

  const bStart = new Date(bookingStart).getTime();
  const bEnd = new Date(bookingEnd).getTime();

  let best: { total_price: number; label?: string } | null = null;

  for (const tier of tiers) {
    const tStart = new Date(tier.start_date).getTime();
    const tEnd = new Date(tier.end_date).getTime();

    // Booking must fall within (or equal) the tier's date range
    if (bStart >= tStart && bEnd <= tEnd) {
      if (!best || tier.total_price < best.total_price) {
        best = { total_price: tier.total_price, label: tier.label };
      }
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

    const days = calcDays(startDatetime, endDatetime);

    // ── Pricing: prefer pricing_tiers (date-range flat price), fall back to per-day ──
    const rawTiers = typeof location.pricing_tiers === 'string'
      ? JSON.parse(location.pricing_tiers)
      : location.pricing_tiers;

    const matchedTier = findMatchingTier(rawTiers, startDatetime, endDatetime);

    let basePrice: number;
    let baseRatePerDay: number;

    if (matchedTier) {
      // Date-range flat pricing — the tier's total_price IS the base price
      basePrice = round2(matchedTier.total_price);
      baseRatePerDay = round2(basePrice / days);
    } else {
      // Fallback: legacy per-day pricing
      const fallbackRate = Number(location.base_price_per_day || 15);
      baseRatePerDay = fallbackRate;
      basePrice = round2(days * fallbackRate);
    }

    // No duration discount — the date-range model already contains the full price
    const discountPercent = 0;
    const discountApplied = 0;
    const priceAfterDiscount = basePrice;

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

    // Platform settings plus host-specific override
    const settings = await db('platform_settings').first();
    const hostRow = await db('parking_locations')
      .leftJoin('hosts', 'hosts.id', 'parking_locations.host_id')
      .where('parking_locations.id', locationId)
      .select('hosts.commission_rate as host_commission_rate')
      .first();

    const serviceFeeRate = settings ? Number(settings.service_fee_rate || 5) : 5;
    const platformCommissionRate = settings ? Number(settings.commission_rate || 19) : 19;
    const commissionRate = hostRow?.host_commission_rate === null || hostRow?.host_commission_rate === undefined
      ? platformCommissionRate
      : Number(hostRow.host_commission_rate);

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
      tierMatched: !!matchedTier,
      tierLabel: matchedTier?.label,
      discountPercent,
      discountApplied,
      addons: addonBreakdown,
      addonsTotal,
      serviceFee,
      totalPrice,
      platformCommission,
      hostPayout,
      currency: 'CHF',
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

  // ── Confirm Booking (after payment – sets pending_approval for admin review) ──
  async confirmBooking(bookingId: string, paymentId: string): Promise<Record<string, unknown>> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    if (booking.status !== 'pending_payment' && booking.status !== 'draft') {
      throw new ValidationError(`Cannot confirm booking in ${booking.status} status`);
    }

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status: 'pending_approval',
        payment_id: paymentId,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── Admin Approve Booking ──────────────────────────────────────────
  async approveBooking(bookingId: string): Promise<Record<string, unknown>> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    if (booking.status !== 'pending_approval') {
      throw new ValidationError(`Cannot approve booking in ${booking.status} status. Only pending_approval bookings can be approved.`);
    }

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status: 'confirmed',
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

  // ── Admin Update Booking Dates ────────────────────────────────────
  async updateBookingDates(
    bookingId: string,
    startDatetime: string,
    endDatetime: string
  ): Promise<Record<string, unknown>> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    const editableStatuses = ['draft', 'pending_payment', 'pending_approval', 'confirmed', 'modified'];
    if (!editableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot modify booking in ${booking.status} status`);
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ValidationError('Invalid booking dates');
    }
    if (end <= start) {
      throw new ValidationError('Return date must be after arrival date');
    }

    const location = await db('parking_locations').where('id', booking.location_id).first();
    if (!location) throw new NotFoundError('Parking location');

    const [{ count }] = await db('bookings')
      .where('location_id', booking.location_id)
      .whereNot('id', bookingId)
      .whereNotIn('status', ['cancelled', 'refunded', 'draft', 'no_show', 'checked_out'])
      .where('start_datetime', '<', endDatetime)
      .where('end_datetime', '>', startDatetime)
      .count('* as count');

    if (Number(count) >= Number(location.capacity_total || 0)) {
      throw new ValidationError('The new dates conflict with an existing booking for this spot');
    }

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        status: 'modified',
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── Cancel Booking with Refund Calculation ─────────────────────────
  async cancelBooking(bookingId: string, userId: string, isAdmin: boolean = false, reasonOverride?: string): Promise<CancelBookingResult> {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    // Check ownership (customer can cancel their own, admin can cancel any)
    if (!isAdmin && booking.customer_id !== userId) {
      throw new AppError('You can only cancel your own bookings', 403, 'FORBIDDEN');
    }

    const cancellableStatuses = ['confirmed', 'modified', 'pending_payment', 'pending_approval', 'draft'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot cancel booking in ${booking.status} status`);
    }

    // Calculate refund based on time until arrival
    const { refundPercent, reason } = resolveCancellationDetails(booking, isAdmin, reasonOverride);

    const refundAmount = Math.round((Number(booking.total_price) * refundPercent / 100) * 100) / 100;

    let newStatus: 'cancelled' | 'refunded';
    if (isAdmin) {
      newStatus = 'cancelled';
    } else {
      newStatus = refundPercent > 0 ? 'refunded' : 'cancelled';
    }

    // Update booking status
    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status: newStatus,
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
        'parking_locations.phone_number as location_phone',
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
        'parking_locations.phone_number as location_phone',
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
        query = query.whereIn('bookings.status', ['confirmed', 'checked_in']);
      } else if (status === 'past') {
        query = query.whereIn('bookings.status', ['completed', 'cancelled', 'refunded', 'no_show']);
      } else if (status.includes(',')) {
        query = query.whereIn('bookings.status', status.split(',').map(s => s.trim()));
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
      .whereIn('status', ['confirmed', 'checked_in'])
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
