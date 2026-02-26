import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';

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
    const { status, hostType, search, page, limit } = req.query;
    const result = await adminService.listHosts({
      status: status as string,
      hostType: hostType as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  createHost: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, companyName, hostType } = req.body;

    if (!name || !email || !companyName || !hostType) {
      res.status(400).json({
        success: false,
        message: 'Name, E-Mail, Firmenname und Host-Typ sind erforderlich',
      });
      return;
    }

    const result = await adminService.createHost({ name, email, phone, companyName, hostType });

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.host.create',
      resource: 'hosts',
      resourceId: result.host.id,
      newValues: { name, email, companyName, hostType },
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
    const { amount, reason } = req.body;
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

  // ── Vehicles ───────────────────────────────────────────────────────
  listVehicles: asyncHandler(async (req: Request, res: Response) => {
    const { active, search, page, limit } = req.query;
    const result = await adminService.listVehicles({
      active: active !== undefined ? active === 'true' : undefined,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  updateVehicleStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { active } = req.body;
    const updated = await adminService.updateVehicleStatus(id, active);

    await auditService.log({
      userId: req.user?.userId,
      action: 'admin.vehicle.status',
      resource: 'vehicles',
      resourceId: id,
      newValues: { active },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: `Vehicle ${active ? 'activated' : 'deactivated'}` });
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
