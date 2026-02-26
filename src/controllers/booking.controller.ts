import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

/** Extract a single string param (Express 5 params can be string | string[]). */
const param = (req: Request, name: string): string => {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
};

export const bookingController = {

  // ── Calculate Price (public) ───────────────────────────────────────
  calculatePrice: asyncHandler(async (req: Request, res: Response) => {
    const { locationId, startDate, endDate } = req.query;

    if (!locationId || !startDate || !endDate) {
      throw new ValidationError('locationId, startDate and endDate are required');
    }

    // Parse optional addons from query (JSON stringified array)
    let addons: { addonId: string; quantity: number }[] | undefined;
    if (req.query.addons) {
      try {
        addons = JSON.parse(req.query.addons as string);
      } catch {
        // Also accept addons from body for POST-style usage
      }
    }

    const pricing = await bookingService.calculatePrice(
      locationId as string,
      startDate as string,
      endDate as string,
      addons
    );

    res.json({ success: true, data: pricing });
  }),

  // ── Create Booking ─────────────────────────────────────────────────
  createBooking: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const {
      locationId,
      startDatetime,
      endDatetime,
      arrivalLotDatetime,
      returnPickupPreference,
      outboundFlightNo,
      returnFlightNo,
      passengers,
      luggage,
      carPlate,
      carModel,
      specialNotes,
      childSeatRequired,
      wheelchairAssistance,
      addons,
    } = req.body;

    // Validate required fields
    if (!locationId || !startDatetime || !endDatetime || !carPlate) {
      throw new ValidationError('locationId, startDatetime, endDatetime, and carPlate are required');
    }

    // Validate dates
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (start >= end) {
      throw new ValidationError('End date must be after start date');
    }
    if (start < new Date()) {
      throw new ValidationError('Start date cannot be in the past');
    }

    const booking = await bookingService.createBooking({
      customerId: userId,
      locationId,
      startDatetime,
      endDatetime,
      arrivalLotDatetime: arrivalLotDatetime || startDatetime,
      returnPickupPreference,
      outboundFlightNo,
      returnFlightNo,
      passengers: passengers || 1,
      luggage: luggage || 1,
      carPlate,
      carModel,
      specialNotes,
      childSeatRequired,
      wheelchairAssistance,
      addons,
    });

    // Create payment
    const paymentResult = await paymentService.createPayment({
      userId,
      bookingId: booking.id as string,
      amount: booking.total_price as number,
      currency: (booking.currency as string) || 'CHF',
    });

    await auditService.log({
      userId,
      action: 'booking.create',
      resource: 'bookings',
      resourceId: booking.id as string,
      newValues: { booking_code: booking.booking_code, total_price: booking.total_price },
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: {
        booking,
        payment: paymentResult.payment,
        clientSecret: paymentResult.clientSecret,
      },
      message: 'Booking created. Please complete payment.',
    });
  }),

  // ── Confirm Payment & Booking ──────────────────────────────────────
  confirmPayment: asyncHandler(async (req: Request, res: Response) => {
    const bookingId = param(req, 'bookingId');
    const { paymentId } = req.body;
    const userId = req.user!.userId;

    if (!paymentId) {
      throw new ValidationError('paymentId is required');
    }

    // Confirm the payment
    const payment = await paymentService.confirmPayment(paymentId);

    // Confirm the booking
    const booking = await bookingService.confirmBooking(bookingId, payment.id as string);

    await auditService.log({
      userId,
      action: 'booking.confirm',
      resource: 'bookings',
      resourceId: bookingId,
      newValues: { status: 'confirmed', payment_id: payment.id },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: { booking, payment },
      message: 'Payment confirmed. Booking is now confirmed.',
    });
  }),

  // ── Get Booking by ID ──────────────────────────────────────────────
  getBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const booking = await bookingService.getBookingById(id);

    // Check ownership or admin
    if (req.user!.role !== 'admin' && booking.customer_id !== req.user!.userId) {
      // Check if user is host of this location
      const isHost = await isUserHostOfLocation(req.user!.userId, booking.location_id as string);
      if (!isHost) {
        throw new ValidationError('You do not have access to this booking');
      }
    }

    res.json({ success: true, data: booking });
  }),

  // ── Get Booking by Code ────────────────────────────────────────────
  getBookingByCode: asyncHandler(async (req: Request, res: Response) => {
    const code = param(req, 'code');
    const booking = await bookingService.getBookingByCode(code);
    res.json({ success: true, data: booking });
  }),

  // ── Get My Bookings (customer) ─────────────────────────────────────
  getMyBookings: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { status, page, limit } = req.query;

    const result = await bookingService.getCustomerBookings(userId, {
      status: status as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  }),

  // ── Get My Stats (customer dashboard) ──────────────────────────────
  getMyStats: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const stats = await bookingService.getCustomerStats(userId);
    res.json({ success: true, data: stats });
  }),

  // ── Cancel Booking ─────────────────────────────────────────────────
  cancelBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const result = await bookingService.cancelBooking(id, userId, isAdmin);

    // Process refund if applicable and payment exists
    if (result.refundAmount > 0) {
      const payment = await paymentService.getPaymentByBookingId(id);
      if (payment?.status === 'succeeded') {
        try {
          await paymentService.processRefund({
            paymentId: payment.id as string,
            amount: result.refundAmount,
            reason: result.reason,
          });
        } catch (err) {
          console.error('Refund processing failed:', err);
          // Booking is still cancelled, but refund needs manual handling
        }
      }
    }

    await auditService.log({
      userId,
      action: 'booking.cancel',
      resource: 'bookings',
      resourceId: id,
      newValues: {
        status: 'cancelled',
        refundAmount: result.refundAmount,
        refundPercent: result.refundPercent,
        reason: result.reason,
      },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: {
        booking: result.booking,
        refundAmount: result.refundAmount,
        refundPercent: result.refundPercent,
        reason: result.reason,
      },
      message: result.reason,
    });
  }),

  // ── Update Booking Status (host/admin) ─────────────────────────────
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!status) {
      throw new ValidationError('status is required');
    }

    const booking = await bookingService.updateBookingStatus(id, status, userId);

    await auditService.log({
      userId,
      action: 'booking.status.update',
      resource: 'bookings',
      resourceId: id,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: booking,
      message: `Booking status updated to ${status}`,
    });
  }),
};

// Helper: check if user is host of a given location
async function isUserHostOfLocation(userId: string, locationId: string): Promise<boolean> {
  const { db: database } = await import('../database');
  const host = await database('hosts').where('user_id', userId).first();
  if (!host) return false;

  const location = await database('parking_locations')
    .where('id', locationId)
    .where('host_id', host.id)
    .first();

  return !!location;
}
