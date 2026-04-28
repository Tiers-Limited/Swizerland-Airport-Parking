import { Request, Response } from 'express';
import { payoutService } from '../services/payout.service';
import { paymentService } from '../services/payment.service';
import { bookingService } from '../services/booking.service';
import { hostService } from '../services/host.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { db } from '../database';
import { UserRole } from '../types/roles';

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

/** Extract a single string param (Express 5 params can be string | string[]). */
const param = (req: Request, name: string): string => {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
};

export const payoutController = {

  // ── Get Pending Payouts (grouped by host) ──────────────────────────
  getPendingPayouts: asyncHandler(async (req: Request, res: Response) => {
    const { hostId, fromDate, toDate, page, limit } = req.query;
    const result = await payoutService.getPendingPayouts({
      hostId: hostId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: result });
  }),

  // ── Create Payout ──────────────────────────────────────────────────
  createPayout: asyncHandler(async (req: Request, res: Response) => {
    const { hostId, bookingIds, notes } = req.body;
    const adminUserId = req.user!.userId;

    if (!hostId || !bookingIds?.length) {
      throw new ValidationError('hostId and bookingIds are required');
    }

    const payout = await payoutService.createPayout({
      hostId,
      bookingIds,
      adminUserId,
      notes,
    });

    await auditService.log({
      userId: adminUserId,
      action: 'payout.create',
      resource: 'payouts',
      resourceId: payout.id as string,
      newValues: { hostId, bookingIds, amount: payout.amount },
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: 'Payout created successfully',
    });
  }),

  // ── Process Payout (mark as completed) ─────────────────────────────
  processPayout: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const adminUserId = req.user!.userId;

    const payout = await payoutService.processPayout(id, adminUserId);

    await auditService.log({
      userId: adminUserId,
      action: 'payout.process',
      resource: 'payouts',
      resourceId: id,
      newValues: { status: 'completed' },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: payout,
      message: 'Payout marked as completed',
    });
  }),

  // ── Fail Payout ────────────────────────────────────────────────────
  failPayout: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { reason } = req.body;
    const adminUserId = req.user!.userId;

    const payout = await payoutService.failPayout(id, reason || 'No reason given', adminUserId);

    await auditService.log({
      userId: adminUserId,
      action: 'payout.fail',
      resource: 'payouts',
      resourceId: id,
      newValues: { status: 'failed', reason },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: payout,
      message: 'Payout marked as failed',
    });
  }),

  // ── List All Payouts ───────────────────────────────────────────────
  listPayouts: asyncHandler(async (req: Request, res: Response) => {
    const { hostId, status, fromDate, toDate, page, limit } = req.query;
    const result = await payoutService.listPayouts({
      hostId: hostId as string,
      status: status as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  // ── Get Payout Details ─────────────────────────────────────────────
  getPayoutDetails: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const payout = await payoutService.getPayoutById(id);
    res.json({ success: true, data: payout });
  }),

  // ── Get Payout Statement PDF ──────────────────────────────────────
  getPayoutStatement: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    if (req.user?.role === UserRole.HOST) {
      const host = await hostService.findByUserId(req.user.userId);
      if (!host) throw new NotFoundError('Host profile not found');

      const payout = await payoutService.getPayoutById(id);
      if (String(payout.host_id) !== String(host.id)) {
        throw new ForbiddenError('You can only access your own payout statements');
      }
    }

    const statement = await payoutService.getPayoutStatement(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${statement.fileName}"`);
    res.send(statement.pdf);
  }),

  // ── Admin Manual Refund ────────────────────────────────────────────
  adminRefund: asyncHandler(async (req: Request, res: Response) => {
    const bookingId = param(req, 'bookingId');
    const { amount, reason } = req.body;
    const adminUserId = req.user!.userId;

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) throw new ValidationError('Booking not found');

    let refundAmount = amount;
    
    // If no amount specified, calculate based on cancellation policy
    if (!refundAmount) {
      const now = new Date();
      const arrival = new Date(booking.start_datetime as string);
      const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilArrival > 24) {
        refundAmount = Number(booking.total_price);
      } else if (hoursUntilArrival >= 12) {
        refundAmount = Number(booking.total_price) * 0.5;
      } else {
        refundAmount = 0;
      }
    }

    refundAmount = Math.round(refundAmount * 100) / 100;

    // Process the refund if there's a payment
    let refundResult = null;
    if (booking.payment_id && refundAmount > 0) {
      refundResult = await paymentService.processRefund({
        paymentId: booking.payment_id as string,
        amount: refundAmount,
        reason: reason || 'Admin manual refund',
      });
    }

    // Update booking status
    await db('bookings')
      .where('id', bookingId)
      .update({
        status: 'refunded',
        updated_at: new Date(),
      });

    await auditService.log({
      userId: adminUserId,
      action: 'admin.booking.refund',
      resource: 'bookings',
      resourceId: bookingId,
      newValues: {
        refundAmount,
        reason: reason || 'Admin manual refund',
        paymentRefund: refundResult ? 'processed' : 'no_payment',
      },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: {
        bookingId,
        refundAmount,
        reason: reason || 'Admin manual refund',
        paymentRefund: refundResult,
      },
      message: `Refund of CHF ${refundAmount.toFixed(2)} processed successfully`,
    });
  }),

  // ── Host Payout Summary (by hostId param) ──────────────────────────
  getHostPayoutSummary: asyncHandler(async (req: Request, res: Response) => {
    const hostId = param(req, 'hostId');
    const summary = await payoutService.getHostPayoutSummary(hostId);
    res.json({ success: true, data: summary });
  }),

  // ── Host: Get My Payouts ───────────────────────────────────────────
  getMyPayouts: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const host = await hostService.findByUserId(userId);
    if (!host) throw new NotFoundError('Host profile not found');

    const { status, fromDate, toDate, page, limit } = req.query;
    const result = await payoutService.listPayouts({
      hostId: host.id,
      status: status as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  // ── Host: Get My Payout Summary ────────────────────────────────────
  getMyPayoutSummary: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const host = await hostService.findByUserId(userId);
    if (!host) throw new NotFoundError('Host profile not found');

    const summary = await payoutService.getHostPayoutSummary(host.id);
    res.json({ success: true, data: summary });
  }),
};
