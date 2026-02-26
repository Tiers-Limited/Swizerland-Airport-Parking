import { Request, Response } from 'express';
import { shuttleService } from '../services/shuttle.service';
import { driverService } from '../services/driver.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';

const param = (req: Request, name: string): string => {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
};

const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

export const driverController = {

  // ── My Profile ─────────────────────────────────────────────────────
  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const driver = await driverService.getDriverByUserId(req.user!.userId);
    res.json({ success: true, data: driver });
  }),

  // ── My Shifts (today or date) ──────────────────────────────────────
  getMyShifts: asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;
    const shifts = await shuttleService.getDriverShifts(
      req.user!.userId,
      date as string
    );
    res.json({ success: true, data: shifts });
  }),

  // ── Shift Trips ────────────────────────────────────────────────────
  getShiftTrips: asyncHandler(async (req: Request, res: Response) => {
    const shiftId = param(req, 'shiftId');
    // Verify driver owns this shift
    const shift = await shuttleService.getShift(shiftId);
    if (shift.driver_user_id !== req.user!.userId) {
      throw new ValidationError('This shift is not assigned to you');
    }
    const trips = await shuttleService.getShiftTrips(shiftId);
    res.json({ success: true, data: trips });
  }),

  // ── Get Trip Detail ────────────────────────────────────────────────
  getTripDetail: asyncHandler(async (req: Request, res: Response) => {
    const tripId = param(req, 'tripId');
    const trip = await shuttleService.getTrip(tripId);
    res.json({ success: true, data: trip });
  }),

  // ── Update Trip Status ─────────────────────────────────────────────
  updateTripStatus: asyncHandler(async (req: Request, res: Response) => {
    const tripId = param(req, 'tripId');
    const { status, actual_departure, actual_arrival } = req.body;
    if (!status) throw new ValidationError('status is required');

    const trip = await shuttleService.updateTripStatus(tripId, status, { actual_departure, actual_arrival });

    await auditService.log({
      userId: req.user!.userId,
      action: 'driver.trip.status.update',
      resource: 'shuttle_trips',
      resourceId: tripId,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: trip });
  }),

  // ── Update Passenger Status (boarded / no_show) ────────────────────
  updatePassengerStatus: asyncHandler(async (req: Request, res: Response) => {
    const tripId = param(req, 'tripId');
    const bookingId = param(req, 'bookingId');
    const { status } = req.body;

    if (!status || !['boarded', 'no_show'].includes(status)) {
      throw new ValidationError('status must be "boarded" or "no_show"');
    }

    await shuttleService.updatePassengerStatus(tripId, bookingId, status);

    await auditService.log({
      userId: req.user!.userId,
      action: 'driver.passenger.status',
      resource: 'shuttle_trip_bookings',
      newValues: { tripId, bookingId, status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, message: `Passenger marked as ${status}` });
  }),

  // ── Start / End Shift ──────────────────────────────────────────────
  startShift: asyncHandler(async (req: Request, res: Response) => {
    const shiftId = param(req, 'shiftId');
    const shift = await shuttleService.getShift(shiftId);
    if (shift.driver_user_id !== req.user!.userId) {
      throw new ValidationError('This shift is not assigned to you');
    }
    const updated = await shuttleService.updateShiftStatus(shiftId, 'active');
    res.json({ success: true, data: updated });
  }),

  endShift: asyncHandler(async (req: Request, res: Response) => {
    const shiftId = param(req, 'shiftId');
    const shift = await shuttleService.getShift(shiftId);
    if (shift.driver_user_id !== req.user!.userId) {
      throw new ValidationError('This shift is not assigned to you');
    }
    const updated = await shuttleService.updateShiftStatus(shiftId, 'closed');
    res.json({ success: true, data: updated });
  }),

  // ══════════════════════════════════════════
  //  ADMIN: Driver Management
  // ══════════════════════════════════════════

  adminListDrivers: asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query;
    const result = await driverService.listDrivers({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: result });
  }),

  adminGetDriver: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const driver = await driverService.getDriver(id);
    res.json({ success: true, data: driver });
  }),

  adminCreateDriver: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, licenseNumber, licenseExpiry } = req.body;
    if (!name || !email || !licenseNumber || !licenseExpiry) {
      throw new ValidationError('name, email, licenseNumber and licenseExpiry are required');
    }
    const driver = await driverService.createDriver({
      name, email, phone, licenseNumber, licenseExpiry,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'admin.driver.create',
      resource: 'driver_profiles',
      resourceId: driver.id as string,
      newValues: { name, email },
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: driver });
  }),

  adminVerifyDriver: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { verificationStatus, documentsVerified } = req.body;
    if (!verificationStatus) throw new ValidationError('verificationStatus is required');

    const updated = await driverService.updateVerificationStatus(id, verificationStatus, documentsVerified);

    await auditService.log({
      userId: req.user!.userId,
      action: 'admin.driver.verify',
      resource: 'driver_profiles',
      resourceId: id,
      newValues: { verificationStatus, documentsVerified },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: updated });
  }),
};
