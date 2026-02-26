import { Request, Response } from 'express';
import { shuttleService } from '../services/shuttle.service';
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

export const dispatcherController = {

  // ── Dashboard Stats ────────────────────────────────────────────────
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const { locationId, date } = req.query;
    const stats = await shuttleService.getDispatcherDashboard(
      locationId as string,
      date as string
    );
    res.json({ success: true, data: stats });
  }),

  // ── Unassigned Bookings ────────────────────────────────────────────
  getUnassignedBookings: asyncHandler(async (req: Request, res: Response) => {
    const { locationId, date, direction } = req.query;
    if (!locationId || !date || !direction) {
      throw new ValidationError('locationId, date, and direction are required');
    }
    const bookings = await shuttleService.getUnassignedBookings(
      locationId as string,
      date as string,
      direction as 'lot_to_airport' | 'airport_to_lot'
    );
    res.json({ success: true, data: bookings });
  }),

  // ── Shifts ─────────────────────────────────────────────────────────
  listShifts: asyncHandler(async (req: Request, res: Response) => {
    const { locationId, driverUserId, status, date, page, limit } = req.query;
    const result = await shuttleService.listShifts({
      locationId: locationId as string,
      driverUserId: driverUserId as string,
      status: status as string,
      date: date as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: result });
  }),

  getShift: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const shift = await shuttleService.getShift(id);
    res.json({ success: true, data: shift });
  }),

  createShift: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId, driverUserId, startTime, endTime, notes } = req.body;
    if (!vehicleId || !driverUserId || !startTime || !endTime) {
      throw new ValidationError('vehicleId, driverUserId, startTime and endTime are required');
    }
    const shift = await shuttleService.createShift({
      vehicleId, driverUserId, startTime, endTime, notes,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'shift.create',
      resource: 'shuttle_shifts',
      resourceId: shift.id as string,
      newValues: { vehicleId, driverUserId },
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: shift });
  }),

  updateShiftStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { status } = req.body;
    if (!status) throw new ValidationError('status is required');

    const shift = await shuttleService.updateShiftStatus(id, status);

    await auditService.log({
      userId: req.user!.userId,
      action: 'shift.status.update',
      resource: 'shuttle_shifts',
      resourceId: id,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: shift });
  }),

  // ── Trips ──────────────────────────────────────────────────────────
  listTrips: asyncHandler(async (req: Request, res: Response) => {
    const { shiftId, locationId, direction, status, date, page, limit } = req.query;
    const result = await shuttleService.listTrips({
      shiftId: shiftId as string,
      locationId: locationId as string,
      direction: direction as string,
      status: status as string,
      date: date as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: result });
  }),

  getTrip: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const trip = await shuttleService.getTrip(id);
    res.json({ success: true, data: trip });
  }),

  createTrip: asyncHandler(async (req: Request, res: Response) => {
    const { shiftId, direction, scheduledDeparture, maxCapacityPassengers, maxCapacityLuggage, notes } = req.body;
    if (!shiftId || !direction || !scheduledDeparture) {
      throw new ValidationError('shiftId, direction and scheduledDeparture are required');
    }
    const trip = await shuttleService.createTrip({
      shiftId, direction, scheduledDeparture, maxCapacityPassengers, maxCapacityLuggage, notes,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'trip.create',
      resource: 'shuttle_trips',
      resourceId: trip.id as string,
      newValues: { shiftId, direction, scheduledDeparture },
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: trip });
  }),

  updateTripStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { status, actual_departure, actual_arrival } = req.body;
    if (!status) throw new ValidationError('status is required');

    const trip = await shuttleService.updateTripStatus(id, status, { actual_departure, actual_arrival });

    await auditService.log({
      userId: req.user!.userId,
      action: 'trip.status.update',
      resource: 'shuttle_trips',
      resourceId: id,
      newValues: { status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, data: trip });
  }),

  // ── Trip-Booking Assignments ───────────────────────────────────────
  assignBooking: asyncHandler(async (req: Request, res: Response) => {
    const { tripId, bookingId, seatCount, luggageCount } = req.body;
    if (!tripId || !bookingId) {
      throw new ValidationError('tripId and bookingId are required');
    }
    const result = await shuttleService.assignBookingToTrip({
      tripId,
      bookingId,
      seatCount: seatCount || 1,
      luggageCount: luggageCount || 1,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'trip.assign.booking',
      resource: 'shuttle_trip_bookings',
      newValues: { tripId, bookingId },
      ipAddress: getIp(req),
    });

    res.status(201).json({ success: true, data: result });
  }),

  updatePassengerStatus: asyncHandler(async (req: Request, res: Response) => {
    const tripId = param(req, 'tripId');
    const bookingId = param(req, 'bookingId');
    const { status } = req.body;
    if (!status) throw new ValidationError('status is required');

    await shuttleService.updatePassengerStatus(tripId, bookingId, status);

    await auditService.log({
      userId: req.user!.userId,
      action: 'trip.passenger.status',
      resource: 'shuttle_trip_bookings',
      newValues: { tripId, bookingId, status },
      ipAddress: getIp(req),
    });

    res.json({ success: true, message: `Passenger status updated to ${status}` });
  }),
};
