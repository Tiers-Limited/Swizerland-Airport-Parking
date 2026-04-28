import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { bookingService } from '../services/booking.service';
import { emailService } from '../services/email.service';
import { paymentService } from '../services/payment.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { db } from '../database';
import { ValidationError } from '../utils/errors';

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

const formatZurichDateTime = (value: unknown): string => {
  try {
    return new Intl.DateTimeFormat('de-CH', {
      timeZone: 'Europe/Zurich',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value as string));
  } catch {
    return String(value);
  }
};

async function sendAdminBookingUpdateEmails(params: {
  booking: Record<string, unknown>;
  originalBooking: Record<string, unknown>;
  arrivalDateTime: string;
  returnDateTime: string;
}) {
  const { booking, originalBooking, arrivalDateTime, returnDateTime } = params;
  const customer = await db('users').where('id', originalBooking.customer_id as string).first();
  const location = await db('parking_locations').where('id', originalBooking.location_id as string).first();
  const host = location ? await db('hosts').where('id', location.host_id).first() : null;
  const hostUser = host ? await db('users').where('id', host.user_id).first() : null;

  if (customer && location) {
    await emailService.sendEmail({
      to: customer.email,
      subject: 'Buchungsdaten geändert',
      html: `
        <p>Hallo ${customer.name?.split(' ')[0] || 'Kunde'},</p>
        <p>Ihre Buchung <strong>${originalBooking.booking_code}</strong> wurde von einem Administrator angepasst.</p>
        <p><strong>Parkplatz:</strong> ${location.name || ''}</p>
        <p><strong>Original:</strong> ${formatZurichDateTime(originalBooking.start_datetime)} – ${formatZurichDateTime(originalBooking.end_datetime)}</p>
        <p><strong>Neu:</strong> ${formatZurichDateTime(arrivalDateTime)} – ${formatZurichDateTime(returnDateTime)}</p>
      `,
    }).catch((err: unknown) => console.error('Failed to send booking update email to customer:', err));
  }

  if (hostUser && location && customer) {
    await emailService.sendEmail({
      to: hostUser.email,
      subject: 'Buchung geändert',
      html: `
        <p>Hallo ${hostUser.name?.split(' ')[0] || 'Host'},</p>
        <p>Eine Buchung wurde durch den Administrator geändert.</p>
        <p><strong>Buchung:</strong> ${booking.booking_code || originalBooking.booking_code}</p>
        <p><strong>Kunde:</strong> ${customer.name || ''}</p>
        <p><strong>Parkplatz:</strong> ${location.name || ''}</p>
        <p><strong>Original:</strong> ${formatZurichDateTime(originalBooking.start_datetime)} – ${formatZurichDateTime(originalBooking.end_datetime)}</p>
        <p><strong>Neu:</strong> ${formatZurichDateTime(arrivalDateTime)} – ${formatZurichDateTime(returnDateTime)}</p>
      `,
    }).catch((err: unknown) => console.error('Failed to send booking update email to host:', err));
  }
}

async function sendAdminBookingCancellationEmails(params: {
  booking: Record<string, unknown>;
  originalBooking: Record<string, unknown>;
  reason: string;
  refundAmount: number;
}) {
  const { booking, originalBooking, reason, refundAmount } = params;
  const customer = await db('users').where('id', originalBooking.customer_id as string).first();
  const location = await db('parking_locations').where('id', originalBooking.location_id as string).first();
  const host = location ? await db('hosts').where('id', location.host_id).first() : null;
  const hostUser = host ? await db('users').where('id', host.user_id).first() : null;

  if (customer && location) {
    await emailService.sendEmail({
      to: customer.email,
      subject: 'Buchung storniert',
      html: `
        <p>Hallo ${customer.name?.split(' ')[0] || 'Kunde'},</p>
        <p>Ihre Buchung <strong>${booking.booking_code || originalBooking.booking_code}</strong> wurde von einem Administrator storniert.</p>
        <p><strong>Parkplatz:</strong> ${location.name || ''}</p>
        <p><strong>Zeitraum:</strong> ${formatZurichDateTime(originalBooking.start_datetime)} – ${formatZurichDateTime(originalBooking.end_datetime)}</p>
        <p><strong>Grund:</strong> ${reason}</p>
        ${refundAmount > 0 ? `<p><strong>Rückerstattung:</strong> CHF ${refundAmount.toFixed(2)}</p>` : '<p>Für diese Buchung ist keine Rückerstattung vorgesehen.</p>'}
      `,
    }).catch((err: unknown) => console.error('Failed to send cancellation email to customer:', err));
  }

  if (hostUser && customer && location) {
    await emailService.sendEmail({
      to: hostUser.email,
      subject: 'Buchung storniert',
      html: `
        <p>Hallo ${hostUser.name?.split(' ')[0] || 'Host'},</p>
        <p>Eine Buchung wurde von einem Administrator storniert.</p>
        <p><strong>Buchung:</strong> ${booking.booking_code || originalBooking.booking_code}</p>
        <p><strong>Kunde:</strong> ${customer.name || ''}</p>
        <p><strong>Parkplatz:</strong> ${location.name || ''}</p>
        <p><strong>Zeitraum:</strong> ${formatZurichDateTime(originalBooking.start_datetime)} – ${formatZurichDateTime(originalBooking.end_datetime)}</p>
        <p><strong>Grund:</strong> ${reason}</p>
      `,
    }).catch((err: unknown) => console.error('Failed to send cancellation email to host:', err));
  }
}

export const adminController = {
  // ── Dashboard ──────────────────────────────────────────────────────
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats({
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    });
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
    const {
      name,
      email,
      phone,
      companyName,
      address,
      taxId,
      contactPerson,
      companyPhone,
      companyAddress,
      bankIban,
      mwstNumber,
      commissionRate,
      facilityOptions,
      transferService,
      photos,
    } = req.body;

    if (!name || !email || !companyName) {
      res.status(400).json({
        success: false,
        message: 'Name, E-Mail und Firmenname sind erforderlich',
      });
      return;
    }

    const result = await adminService.createHost({
      name,
      email,
      phone,
      companyName,
      address,
      taxId,
      contactPerson,
      companyPhone,
      companyAddress,
      bankIban,
      mwstNumber,
      commissionRate,
      facilityOptions,
      transferService,
      photos,
    });

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

  updateHost: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updated = await adminService.updateHost(id, req.body);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.host.update',
      resource: 'hosts',
      resourceId: id,
      newValues: req.body,
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: 'Host updated successfully' });
  }),

  updateHostVerification: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, documentsVerified, rejectionReason } = req.body;
    const updated = await adminService.updateHostVerification(id, status, documentsVerified, rejectionReason);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.host.verify',
      resource: 'hosts',
      resourceId: id,
      newValues: { status, documentsVerified, rejectionReason },
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
  getBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const booking = await bookingService.getBookingById(id);
    res.json({ success: true, data: booking });
  }),

  listBookings: asyncHandler(async (req: Request, res: Response) => {
    const { status, search, fromDate, toDate, page, limit } = req.query;
    const result = await adminService.listBookings({
      status: status as string,
      search: search as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  updateBookingDates: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { arrivalDateTime, returnDateTime } = req.body || {};

    if (!arrivalDateTime || !returnDateTime) {
      throw new ValidationError('arrivalDateTime and returnDateTime are required');
    }

    const originalBooking = await bookingService.getBookingById(id);
    const updated = await bookingService.updateBookingDates(id, arrivalDateTime, returnDateTime);

    try {
      await sendAdminBookingUpdateEmails({
        booking: updated,
        originalBooking,
        arrivalDateTime,
        returnDateTime,
      });
    } catch (error_) {
      console.error('Error preparing booking update emails:', error_);
    }

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.booking.update_dates',
      resource: 'bookings',
      resourceId: id,
      oldValues: {
        start_datetime: originalBooking.start_datetime,
        end_datetime: originalBooking.end_datetime,
      },
      newValues: {
        start_datetime: arrivalDateTime,
        end_datetime: returnDateTime,
        status: 'modified',
      },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: 'Buchungsdaten aktualisiert' });
  }),

  cancelBooking: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { reason } = req.body || {};

    if (!reason?.trim()) {
      throw new ValidationError('Cancellation reason is required');
    }

    const originalBooking = await bookingService.getBookingById(id);
    const result = await bookingService.cancelBooking(id, req.user!.userId, true, reason.trim());

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
        }
      }
    }

    try {
      await sendAdminBookingCancellationEmails({
        booking: result.booking,
        originalBooking,
        reason: reason.trim(),
        refundAmount: result.refundAmount,
      });
    } catch (error_) {
      console.error('Error preparing cancellation emails:', error_);
    }

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.booking.cancel',
      resource: 'bookings',
      resourceId: id,
      newValues: {
        status: 'cancelled',
        refundAmount: result.refundAmount,
        reason: result.reason,
      },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: result,
      message: 'Buchung storniert',
    });
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
      const fmtDateTime = (d: unknown) => {
        try {
          return new Intl.DateTimeFormat('de-CH', {
            timeZone: 'Europe/Zurich',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(d as string));
        } catch {
          return String(d);
        }
      };

      if (customer && location) {
        emailService.sendBookingConfirmationToCustomer({
          email: customer.email,
          firstName: customer.name?.split(' ')[0] || 'Kunde',
          bookingCode: fullBooking.booking_code as string,
          startDate: fmtDateTime(fullBooking.start_datetime),
          endDate: fmtDateTime(fullBooking.end_datetime),
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
          startDate: fmtDateTime(fullBooking.start_datetime),
          endDate: fmtDateTime(fullBooking.end_datetime),
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
    const { status, fromDate, toDate, page, limit } = req.query;
    const result = await adminService.listPayments({
      status: status as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
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
    const data = await adminService.getRevenueByMonth({
      months,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    });
    res.json({ success: true, data });
  }),

  bookingsByStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getBookingsByStatus({
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    });
    res.json({ success: true, data });
  }),
};
