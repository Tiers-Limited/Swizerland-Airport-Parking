import { Request, Response } from 'express';
import { listingService } from '../services/listing.service';
import { hostService } from '../services/host.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { UserRole } from '../types/roles';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

const getId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
};

export const listingController = {
  // ===== PUBLIC ENDPOINTS =====

  search: asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      airportCode: (req.query.airportCode as string) || 'ZRH',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      covered: req.query.covered === 'true',
      evCharging: req.query.evCharging === 'true',
      security247: req.query.security247 === 'true',
      sortBy: (req.query.sortBy as string) || 'price',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await listingService.search(filters);

    res.json({
      success: true,
      data: {listings:result.listings},
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    });
  }),

  getPublicListing: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const listing = await listingService.getPublicListing(id);
    res.json({ success: true, data: listing });
  }),

  // ===== HOST ENDPOINTS =====

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const host = await hostService.findByUserId(req.user.userId);
    if (!host) {
      return res.status(403).json({ success: false, message: 'You must register as a host first' });
    }

    const listing = await listingService.create(host.id, req.body);

    await auditService.log({
      userId: req.user.userId,
      action: 'listing.create',
      resource: 'listings',
      resourceId: listing.id,
      newValues: req.body,
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: listing,
      message: 'Listing created successfully. Pending admin approval.',
    });
  }),

  getMyListings: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const host = await hostService.findByUserId(req.user.userId);
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host profile not found' });
    }

    const listings = await listingService.findByHostId(host.id);
    res.json({ success: true, data: listings });
  }),

  getMyListing: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only view your own listings');
    }

    const pricingRule = await listingService.getPricingRule(id);
    res.json({ success: true, data: { ...listing, pricing_rule: pricingRule } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only update your own listings');
    }

    const updated = await listingService.update(id, req.body);

    await auditService.log({
      userId: req.user.userId,
      action: 'listing.update',
      resource: 'listings',
      resourceId: id,
      newValues: req.body,
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: 'Listing updated successfully' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only delete your own listings');
    }

    await listingService.delete(id);

    await auditService.log({
      userId: req.user.userId,
      action: 'listing.delete',
      resource: 'listings',
      resourceId: id,
      ipAddress: getIp(req),
    });

    res.json({ success: true, message: 'Listing deleted successfully' });
  }),

  // Status update (admin only)
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { status } = req.body;
    const listing = await listingService.findByIdOrFail(id);
    const updated = await listingService.updateStatus(id, status);

    await auditService.log({
      userId: req.user?.userId,
      action: 'listing.status_update',
      resource: 'listings',
      resourceId: id,
      oldValues: { status: listing.status },
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: `Listing status updated to ${status}` });
  }),

  // Pricing rules
  setPricingRule: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage pricing for your own listings');
    }

    const rule = await listingService.createPricingRule(id, req.body);
    res.json({ success: true, data: rule, message: 'Pricing rule set successfully' });
  }),

  getPricingRule: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const rule = await listingService.getPricingRule(id);
    res.json({ success: true, data: rule });
  }),

  // Host bookings
  getMyBookings: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const host = await hostService.findByUserId(req.user.userId);
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host profile not found' });
    }

    const { status, page, limit } = req.query;
    const result = await listingService.getHostBookings(host.id, {
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json({
      success: true,
      data: result.bookings,
      pagination: {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string, 10) : 20)),
      },
    });
  }),

  // Host dashboard stats
  getMyStats: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const host = await hostService.findByUserId(req.user.userId);
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host profile not found' });
    }

    const stats = await listingService.getHostStats(host.id);
    res.json({ success: true, data: stats });
  }),

  // ===== ADD-ON / EXTRA SERVICES ENDPOINTS =====

  getAddons: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    await listingService.findByIdOrFail(id);
    // For public/host view: return all addons; public route will pass activeOnly=true via query
    const activeOnly = req.query.activeOnly === 'true';
    const addons = await listingService.getAddonsByLocationId(id, activeOnly);
    res.json({ success: true, data: addons });
  }),

  createAddon: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage add-ons for your own listings');
    }

    const addon = await listingService.createAddon(id, req.body);

    await auditService.log({
      userId: req.user.userId,
      action: 'addon.create',
      resource: 'location_addons',
      resourceId: addon.id,
      newValues: req.body,
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: addon, message: 'Add-on service created successfully' });
  }),

  updateAddon: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const addonId = req.params.addonId as string;
    const addon = await listingService.getAddonByIdOrFail(addonId);
    const listing = await listingService.findByIdOrFail(addon.location_id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage add-ons for your own listings');
    }

    const updated = await listingService.updateAddon(addonId, req.body);

    await auditService.log({
      userId: req.user.userId,
      action: 'addon.update',
      resource: 'location_addons',
      resourceId: addonId,
      newValues: req.body,
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated, message: 'Add-on service updated successfully' });
  }),

  deleteAddon: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const addonId = req.params.addonId as string;
    const addon = await listingService.getAddonByIdOrFail(addonId);
    const listing = await listingService.findByIdOrFail(addon.location_id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage add-ons for your own listings');
    }

    await listingService.deleteAddon(addonId);

    await auditService.log({
      userId: req.user.userId,
      action: 'addon.delete',
      resource: 'location_addons',
      resourceId: addonId,
      ipAddress: getIp(req),
    });

    res.json({ success: true, message: 'Add-on service deleted successfully' });
  }),

  reorderAddons: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage add-ons for your own listings');
    }

    const { addonIds } = req.body;
    const addons = await listingService.reorderAddons(id, addonIds);
    res.json({ success: true, data: addons, message: 'Add-ons reordered successfully' });
  }),

  // ===== BLACKOUT DATE ENDPOINTS =====

  getBlackouts: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    await listingService.findByIdOrFail(id);
    const blackouts = await listingService.getBlackoutDates(id);
    res.json({ success: true, data: blackouts });
  }),

  createBlackout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage blackout dates for your own listings');
    }

    const { start_date, end_date, reason } = req.body;
    const blackout = await listingService.createBlackoutDate(id, {
      startDate: start_date,
      endDate: end_date,
      reason,
    }, req.user.userId);

    await auditService.log({
      userId: req.user.userId,
      action: 'blackout.create',
      resource: 'blackout_dates',
      resourceId: blackout.id as string,
      newValues: { start_date, end_date, reason },
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: blackout, message: 'Blackout date created successfully' });
  }),

  deleteBlackout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const id = getId(req);
    const blackoutId = req.params.blackoutId as string;
    const listing = await listingService.findByIdOrFail(id);
    const host = await hostService.findByUserId(req.user.userId);

    if (!host || (listing.host_id !== host.id && req.user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('You can only manage blackout dates for your own listings');
    }

    await listingService.deleteBlackoutDate(id, blackoutId);

    await auditService.log({
      userId: req.user.userId,
      action: 'blackout.delete',
      resource: 'blackout_dates',
      resourceId: blackoutId,
      ipAddress: getIp(req),
    });

    res.json({ success: true, message: 'Blackout date deleted successfully' });
  }),
};
