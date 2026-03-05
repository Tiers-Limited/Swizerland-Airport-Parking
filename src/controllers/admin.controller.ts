import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { bookingService } from '../services/booking.service';
import { emailService } from '../services/email.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { db } from '../database';

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

export const adminController = {
  // ── Dashboard ──────────────────────────────────────────────────────
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  }),

  // ── Users ──────────────────────────────────────────────────────────
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search, page, limit } = req.query;
    const result = await adminService.listUsers({
      role: role as string,
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    const updated = await adminService.updateUserStatus(id, status);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.user.status',
      resource: 'users',
      resourceId: id,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: `User status updated to ${status}` });
  }),

  // ── Hosts ──────────────────────────────────────────────────────────
  listHosts: asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query;
    const result = await adminService.listHosts({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  createHost: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, companyName } = req.body;

    if (!name || !email || !companyName) {
      res.status(400).json({
        success: false,
        message: 'Name, E-Mail und Firmenname sind erforderlich',
      });
      return;
    }

    const result = await adminService.createHost({ name, email, phone, companyName });

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.host.create',
      resource: 'hosts',
      resourceId: result.host.id,
      newValues: { name, email, companyName },
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Host erstellt. Zugangsdaten wurden per E-Mail gesendet.',
    });
  }),

  updateHostVerification: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, documentsVerified } = req.body;
    const updated = await adminService.updateHostVerification(id, status, documentsVerified);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.host.verify',
      resource: 'hosts',
      resourceId: id,
      newValues: { status, documentsVerified },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: `Host verification updated to ${status}` });
  }),

  // ── Listings ───────────────────────────────────────────────────────
  listListings: asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query;
    const result = await adminService.listListings({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  updateListingStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    const updated = await adminService.updateListingStatus(id, status);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.listing.status',
      resource: 'listings',
      resourceId: id,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: `Listing status updated to ${status}` });
  }),

  // ── Bookings ───────────────────────────────────────────────────────
  listBookings: asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query;
    const result = await adminService.listBookings({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  refundBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { amount, reason } = req.body || {};
    const result = await adminService.refundBooking(id, amount, reason);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.booking.refund',
      resource: 'bookings',
      resourceId: id,
      newValues: { status: 'refunded', refundAmount: result.refundAmount, reason: result.reason },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: result,
      message: `Booking refunded: CHF ${result.refundAmount.toFixed(2)}`,
    });
  }),

  // ── Approve Booking (admin confirms after reviewing payment) ───────
  approveBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const booking = await bookingService.approveBooking(id);

    // Send confirmation emails
    try {
      const fullBooking = await bookingService.getBookingById(id);
      const customer = await db('users').where('id', fullBooking.customer_id as string).first();
      const location = await db('parking_locations').where('id', fullBooking.location_id as string).first();
      const host = location ? await db('hosts').where('id', location.host_id).first() : null;
      const hostUser = host ? await db('users').where('id', host.user_id).first() : null;
      const fmtDate = (d: unknown) => { try { return new Date(d as string).toLocaleDateString('de-CH'); } catch { return String(d); } };

      if (customer && location) {
        emailService.sendBookingConfirmationToCustomer({
          email: customer.email,
          firstName: customer.name?.split(' ')[0] || 'Kunde',
          bookingCode: fullBooking.booking_code as string,
          startDate: fmtDate(fullBooking.start_datetime),
          endDate: fmtDate(fullBooking.end_datetime),
          locationName: location.name,
          locationAddress: location.address || '',
          hostPhone: location.phone_number || '',
          totalPaid: String(fullBooking.total_price),
          currency: (fullBooking.currency as string) || 'CHF',
          checkInInstructions: location.check_in_instructions || undefined,
        }).catch(err => console.error('Failed to send approval confirmation email:', err));
      }

      if (hostUser && customer && location) {
        emailService.sendBookingNotificationToHost({
          email: hostUser.email,
          hostName: hostUser.name?.split(' ')[0] || 'Host',
          bookingCode: fullBooking.booking_code as string,
          startDate: fmtDate(fullBooking.start_datetime),
          endDate: fmtDate(fullBooking.end_datetime),
          locationName: location.name,
          customerName: customer.name || '',
          customerPhone: customer.phone || '',
          carPlate: (fullBooking.car_plate as string) || '',
          carModel: (fullBooking.car_model as string) || undefined,
          amount: String(fullBooking.host_payout || fullBooking.total_price),
          currency: (fullBooking.currency as string) || 'CHF',
        }).catch(err => console.error('Failed to send host notification email:', err));
      }
    } catch (error_) {
      console.error('Error preparing approval emails:', error_);
    }

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.booking.approve',
      resource: 'bookings',
      resourceId: id,
      newValues: { status: 'confirmed' },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: booking,
      message: 'Buchung genehmigt und bestätigt.',
    });
  }),

  // ── Payments ───────────────────────────────────────────────────────
  listPayments: asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    const result = await adminService.listPayments({
      status: status as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  // ── Settings ───────────────────────────────────────────────────────
  getSettings: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await adminService.getSettings();
    res.json({ success: true, data: settings });
  }),

  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    const updated = await adminService.updateSettings(data, req.user?.userId || '');

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.settings.update',
      resource: 'settings',
      newValues: data,
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: 'Settings updated' });
  }),

  // ── Analytics ──────────────────────────────────────────────────────
  revenueByMonth: asyncHandler(async (req: Request, res: Response) => {
    const months = req.query.months ? Number(req.query.months) : 12;
    const data = await adminService.getRevenueByMonth(months);
    res.json({ success: true, data });
  }),

  bookingsByStatus: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getBookingsByStatus();
    res.json({ success: true, data });
  }),
};
