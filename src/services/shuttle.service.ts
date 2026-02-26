import { db } from '../database';
import { NotFoundError, ValidationError } from '../utils/errors';

// ─── Types ──────────────────────────────────────────────────────────

export interface CreateShiftInput {
  vehicleId: string;
  driverUserId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface CreateTripInput {
  shiftId: string;
  direction: 'lot_to_airport' | 'airport_to_lot';
  scheduledDeparture: string;
  maxCapacityPassengers?: number;
  maxCapacityLuggage?: number;
  notes?: string;
}

export interface AssignBookingInput {
  tripId: string;
  bookingId: string;
  seatCount: number;
  luggageCount: number;
}

// ─── Shuttle Service ────────────────────────────────────────────────

export class ShuttleService {

  // ══════════════════════════════════════════
  //  SHIFTS
  // ══════════════════════════════════════════

  async createShift(input: CreateShiftInput): Promise<Record<string, unknown>> {
    // Validate vehicle exists
    const vehicle = await db('shuttle_vehicles').where('id', input.vehicleId).first();
    if (!vehicle) throw new NotFoundError('Shuttle vehicle');
    if (!vehicle.active) throw new ValidationError('Vehicle is not active');

    // Validate driver
    const driver = await db('users').where('id', input.driverUserId).where('role', 'driver').first();
    if (!driver) throw new NotFoundError('Driver');

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (end <= start) throw new ValidationError('End time must be after start time');

    // Check for overlapping shifts for same vehicle or driver
    const overlap = await db('shuttle_shifts')
      .where(function () {
        this.where('vehicle_id', input.vehicleId)
          .orWhere('driver_user_id', input.driverUserId);
      })
      .whereNot('status', 'closed')
      .whereNot('status', 'cancelled')
      .where('start_time', '<', end.toISOString())
      .where('end_time', '>', start.toISOString())
      .first();

    if (overlap) {
      throw new ValidationError('Overlapping shift exists for this vehicle or driver');
    }

    const [shift] = await db('shuttle_shifts')
      .insert({
        vehicle_id: input.vehicleId,
        driver_user_id: input.driverUserId,
        start_time: start,
        end_time: end,
        status: 'planned',
        notes: input.notes,
      })
      .returning('*');

    return shift;
  }

  async getShift(id: string): Promise<Record<string, unknown>> {
    const shift = await db('shuttle_shifts')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .leftJoin('users', 'users.id', 'shuttle_shifts.driver_user_id')
      .select(
        'shuttle_shifts.*',
        'shuttle_vehicles.plate as vehicle_plate',
        'shuttle_vehicles.capacity_passengers as vehicle_capacity',
        'users.name as driver_name',
        'users.phone as driver_phone'
      )
      .where('shuttle_shifts.id', id)
      .first();

    if (!shift) throw new NotFoundError('Shift');
    return shift;
  }

  async listShifts(filters: {
    locationId?: string;
    driverUserId?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ shifts: Record<string, unknown>[]; total: number }> {
    const { locationId, driverUserId, status, date, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = db('shuttle_shifts')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .leftJoin('users', 'users.id', 'shuttle_shifts.driver_user_id');

    if (locationId) query = query.where('shuttle_vehicles.location_id', locationId);
    if (driverUserId) query = query.where('shuttle_shifts.driver_user_id', driverUserId);
    if (status) query = query.where('shuttle_shifts.status', status);
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query = query.where('shuttle_shifts.start_time', '>=', dayStart.toISOString())
        .where('shuttle_shifts.start_time', '<=', dayEnd.toISOString());
    }

    const countQuery = query.clone().clearSelect().count('shuttle_shifts.id as count').first();
    const shifts = await query
      .select(
        'shuttle_shifts.*',
        'shuttle_vehicles.plate as vehicle_plate',
        'shuttle_vehicles.capacity_passengers as vehicle_capacity',
        'shuttle_vehicles.location_id',
        'users.name as driver_name'
      )
      .orderBy('shuttle_shifts.start_time', 'asc')
      .limit(limit)
      .offset(offset);

    const countResult = await countQuery;
    return { shifts, total: Number(countResult?.count ?? 0) };
  }

  async updateShiftStatus(id: string, status: 'active' | 'closed' | 'cancelled'): Promise<Record<string, unknown>> {
    const shift = await db('shuttle_shifts').where('id', id).first();
    if (!shift) throw new NotFoundError('Shift');

    const valid: Record<string, string[]> = {
      planned: ['active', 'cancelled'],
      active: ['closed'],
    };
    if (!valid[shift.status]?.includes(status)) {
      throw new ValidationError(`Cannot transition shift from ${shift.status} to ${status}`);
    }

    const [updated] = await db('shuttle_shifts')
      .where('id', id)
      .update({ status, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ══════════════════════════════════════════
  //  TRIPS
  // ══════════════════════════════════════════

  async createTrip(input: CreateTripInput): Promise<Record<string, unknown>> {
    const shift = await db('shuttle_shifts').where('id', input.shiftId).first();
    if (!shift) throw new NotFoundError('Shift');

    const vehicle = await db('shuttle_vehicles').where('id', shift.vehicle_id).first();

    const [trip] = await db('shuttle_trips')
      .insert({
        shift_id: input.shiftId,
        direction: input.direction,
        scheduled_departure: new Date(input.scheduledDeparture),
        status: 'planned',
        current_passengers: 0,
        current_luggage: 0,
        max_capacity_passengers: input.maxCapacityPassengers ?? vehicle?.capacity_passengers ?? 8,
        max_capacity_luggage: input.maxCapacityLuggage ?? vehicle?.capacity_luggage ?? 10,
        notes: input.notes,
      })
      .returning('*');

    return trip;
  }

  async getTrip(id: string): Promise<Record<string, unknown>> {
    const trip = await db('shuttle_trips')
      .leftJoin('shuttle_shifts', 'shuttle_shifts.id', 'shuttle_trips.shift_id')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .leftJoin('users', 'users.id', 'shuttle_shifts.driver_user_id')
      .select(
        'shuttle_trips.*',
        'shuttle_vehicles.plate as vehicle_plate',
        'shuttle_vehicles.location_id',
        'users.name as driver_name',
        'users.phone as driver_phone',
        'shuttle_shifts.driver_user_id'
      )
      .where('shuttle_trips.id', id)
      .first();

    if (!trip) throw new NotFoundError('Trip');

    // Get assigned bookings
    const passengers = await db('shuttle_trip_bookings')
      .leftJoin('bookings', 'bookings.id', 'shuttle_trip_bookings.booking_id')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .where('shuttle_trip_bookings.trip_id', id)
      .select(
        'shuttle_trip_bookings.*',
        'bookings.car_plate',
        'bookings.outbound_flight_no',
        'bookings.return_flight_no',
        'bookings.special_notes',
        'bookings.child_seat_required',
        'bookings.wheelchair_assistance',
        'users.name as customer_name',
        'users.phone as customer_phone'
      );

    return { ...trip, passengers };
  }

  async listTrips(filters: {
    shiftId?: string;
    locationId?: string;
    direction?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ trips: Record<string, unknown>[]; total: number }> {
    const { shiftId, locationId, direction, status, date, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = db('shuttle_trips')
      .leftJoin('shuttle_shifts', 'shuttle_shifts.id', 'shuttle_trips.shift_id')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .leftJoin('users', 'users.id', 'shuttle_shifts.driver_user_id');

    if (shiftId) query = query.where('shuttle_trips.shift_id', shiftId);
    if (locationId) query = query.where('shuttle_vehicles.location_id', locationId);
    if (direction) query = query.where('shuttle_trips.direction', direction);
    if (status) query = query.where('shuttle_trips.status', status);
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query = query.where('shuttle_trips.scheduled_departure', '>=', dayStart.toISOString())
        .where('shuttle_trips.scheduled_departure', '<=', dayEnd.toISOString());
    }

    const countQuery = query.clone().clearSelect().count('shuttle_trips.id as count').first();
    const trips = await query
      .select(
        'shuttle_trips.*',
        'shuttle_vehicles.plate as vehicle_plate',
        'shuttle_vehicles.location_id',
        'users.name as driver_name',
        'shuttle_shifts.driver_user_id'
      )
      .orderBy('shuttle_trips.scheduled_departure', 'asc')
      .limit(limit)
      .offset(offset);

    const countResult = await countQuery;
    return { trips, total: Number(countResult?.count ?? 0) };
  }

  async updateTripStatus(
    id: string,
    status: 'boarding' | 'en_route' | 'completed' | 'cancelled' | 'delayed',
    updates?: { actual_departure?: string; actual_arrival?: string }
  ): Promise<Record<string, unknown>> {
    const trip = await db('shuttle_trips').where('id', id).first();
    if (!trip) throw new NotFoundError('Trip');

    const valid: Record<string, string[]> = {
      planned: ['boarding', 'cancelled'],
      boarding: ['en_route', 'cancelled', 'delayed'],
      en_route: ['completed', 'delayed'],
      delayed: ['boarding', 'en_route', 'completed', 'cancelled'],
    };
    if (!valid[trip.status]?.includes(status)) {
      throw new ValidationError(`Cannot transition trip from ${trip.status} to ${status}`);
    }

    const updateData: Record<string, unknown> = { status, updated_at: new Date() };
    if (status === 'en_route' && !trip.actual_departure) {
      updateData.actual_departure = updates?.actual_departure ?? new Date();
    }
    if (status === 'completed') {
      updateData.arrival_time = updates?.actual_arrival ?? new Date();
    }

    const [updated] = await db('shuttle_trips')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return updated;
  }

  // ══════════════════════════════════════════
  //  TRIP-BOOKING ASSIGNMENTS
  // ══════════════════════════════════════════

  async assignBookingToTrip(input: AssignBookingInput): Promise<Record<string, unknown>> {
    const trip = await db('shuttle_trips').where('id', input.tripId).first();
    if (!trip) throw new NotFoundError('Trip');

    if (trip.status !== 'planned' && trip.status !== 'boarding') {
      throw new ValidationError('Can only assign bookings to planned or boarding trips');
    }

    const booking = await db('bookings').where('id', input.bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    // Check capacity
    const newPassengers = trip.current_passengers + input.seatCount;
    const newLuggage = trip.current_luggage + input.luggageCount;
    if (newPassengers > trip.max_capacity_passengers) {
      throw new ValidationError('Trip does not have enough passenger capacity');
    }
    if (trip.max_capacity_luggage && newLuggage > trip.max_capacity_luggage) {
      throw new ValidationError('Trip does not have enough luggage capacity');
    }

    // Check not already assigned to a trip in same direction
    const existing = await db('shuttle_trip_bookings')
      .leftJoin('shuttle_trips', 'shuttle_trips.id', 'shuttle_trip_bookings.trip_id')
      .where('shuttle_trip_bookings.booking_id', input.bookingId)
      .where('shuttle_trips.direction', trip.direction)
      .whereNot('shuttle_trip_bookings.status', 'cancelled')
      .first();

    if (existing) {
      throw new ValidationError('Booking is already assigned to a trip in this direction');
    }

    await db('shuttle_trip_bookings').insert({
      trip_id: input.tripId,
      booking_id: input.bookingId,
      seat_count: input.seatCount,
      luggage_count: input.luggageCount,
      status: 'assigned',
      assigned_at: new Date(),
    });

    // Update trip counts
    await db('shuttle_trips')
      .where('id', input.tripId)
      .update({
        current_passengers: newPassengers,
        current_luggage: newLuggage,
        updated_at: new Date(),
      });

    return { tripId: input.tripId, bookingId: input.bookingId, status: 'assigned' };
  }

  async updatePassengerStatus(
    tripId: string,
    bookingId: string,
    status: 'boarded' | 'no_show' | 'cancelled'
  ): Promise<void> {
    const assignment = await db('shuttle_trip_bookings')
      .where('trip_id', tripId)
      .where('booking_id', bookingId)
      .first();

    if (!assignment) throw new NotFoundError('Trip booking assignment');

    const updateData: Record<string, unknown> = { status };
    if (status === 'boarded') updateData.boarded_at = new Date();

    await db('shuttle_trip_bookings')
      .where('trip_id', tripId)
      .where('booking_id', bookingId)
      .update(updateData);

    // If no_show or cancelled, decrease trip counts
    if (status === 'no_show' || status === 'cancelled') {
      const trip = await db('shuttle_trips').where('id', tripId).first();
      if (trip) {
        await db('shuttle_trips').where('id', tripId).update({
          current_passengers: Math.max(0, trip.current_passengers - assignment.seat_count),
          current_luggage: Math.max(0, trip.current_luggage - assignment.luggage_count),
          updated_at: new Date(),
        });
      }
    }
  }

  // ══════════════════════════════════════════
  //  DISPATCHER HELPERS
  // ══════════════════════════════════════════

  /** Get bookings that need shuttle assignment for a given date + location. */
  async getUnassignedBookings(locationId: string, date: string, direction: 'lot_to_airport' | 'airport_to_lot'): Promise<Record<string, unknown>[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dateField = direction === 'lot_to_airport' ? 'bookings.arrival_lot_datetime' : 'bookings.end_datetime';

    const bookings = await db('bookings')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .where('bookings.location_id', locationId)
      .whereIn('bookings.status', ['confirmed', 'checked_in', 'shuttle_to_airport_completed', 'awaiting_pickup'])
      .where(dateField, '>=', dayStart.toISOString())
      .where(dateField, '<=', dayEnd.toISOString())
      .whereNotExists(function () {
        this.select('*').from('shuttle_trip_bookings')
          .leftJoin('shuttle_trips', 'shuttle_trips.id', 'shuttle_trip_bookings.trip_id')
          .whereRaw('shuttle_trip_bookings.booking_id = bookings.id')
          .where('shuttle_trips.direction', direction)
          .whereNot('shuttle_trip_bookings.status', 'cancelled');
      })
      .select(
        'bookings.*',
        'users.name as customer_name',
        'users.phone as customer_phone'
      )
      .orderBy(dateField, 'asc');

    return bookings;
  }

  /** Get today's dashboard stats for a dispatcher. */
  async getDispatcherDashboard(locationId?: string, date?: string): Promise<Record<string, unknown>> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    let tripsQuery = db('shuttle_trips')
      .leftJoin('shuttle_shifts', 'shuttle_shifts.id', 'shuttle_trips.shift_id')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .where('shuttle_trips.scheduled_departure', '>=', dayStart.toISOString())
      .where('shuttle_trips.scheduled_departure', '<=', dayEnd.toISOString());

    if (locationId) tripsQuery = tripsQuery.where('shuttle_vehicles.location_id', locationId);

    const trips = await tripsQuery.select('shuttle_trips.*', 'shuttle_vehicles.location_id');

    const outboundTrips = trips.filter((t: Record<string, unknown>) => t.direction === 'lot_to_airport');
    const returnTrips = trips.filter((t: Record<string, unknown>) => t.direction === 'airport_to_lot');

    // Count active vehicles
    let vehicleQuery = db('shuttle_vehicles').where('active', true);
    if (locationId) vehicleQuery = vehicleQuery.where('location_id', locationId);
    const [vehicleCount] = await vehicleQuery.count('* as count');

    // Count today's bookings needing shuttle
    let bookingQuery = db('bookings')
      .whereIn('status', ['confirmed', 'checked_in', 'shuttle_to_airport_completed', 'awaiting_pickup'])
      .where('arrival_lot_datetime', '>=', dayStart.toISOString())
      .where('arrival_lot_datetime', '<=', dayEnd.toISOString());
    if (locationId) bookingQuery = bookingQuery.where('location_id', locationId);
    const [bookingCount] = await bookingQuery.count('* as count');

    return {
      date: targetDate,
      totalTripsToday: trips.length,
      outboundTrips: outboundTrips.length,
      returnTrips: returnTrips.length,
      completedTrips: trips.filter((t: Record<string, unknown>) => t.status === 'completed').length,
      activeTrips: trips.filter((t: Record<string, unknown>) => ['boarding', 'en_route'].includes(t.status as string)).length,
      activeVehicles: Number(vehicleCount.count),
      bookingsNeedingShuttle: Number(bookingCount.count),
      tripsByStatus: {
        planned: trips.filter((t: Record<string, unknown>) => t.status === 'planned').length,
        boarding: trips.filter((t: Record<string, unknown>) => t.status === 'boarding').length,
        en_route: trips.filter((t: Record<string, unknown>) => t.status === 'en_route').length,
        completed: trips.filter((t: Record<string, unknown>) => t.status === 'completed').length,
        cancelled: trips.filter((t: Record<string, unknown>) => t.status === 'cancelled').length,
        delayed: trips.filter((t: Record<string, unknown>) => t.status === 'delayed').length,
      },
    };
  }

  // ══════════════════════════════════════════
  //  DRIVER HELPERS
  // ══════════════════════════════════════════

  /** Get driver's assigned shifts for a date. */
  async getDriverShifts(driverUserId: string, date?: string): Promise<Record<string, unknown>[]> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    return db('shuttle_shifts')
      .leftJoin('shuttle_vehicles', 'shuttle_vehicles.id', 'shuttle_shifts.vehicle_id')
      .leftJoin('parking_locations', 'parking_locations.id', 'shuttle_vehicles.location_id')
      .where('shuttle_shifts.driver_user_id', driverUserId)
      .where('shuttle_shifts.start_time', '>=', dayStart.toISOString())
      .where('shuttle_shifts.start_time', '<=', dayEnd.toISOString())
      .select(
        'shuttle_shifts.*',
        'shuttle_vehicles.plate as vehicle_plate',
        'shuttle_vehicles.capacity_passengers as vehicle_capacity',
        'parking_locations.name as location_name',
        'parking_locations.address as location_address'
      )
      .orderBy('shuttle_shifts.start_time', 'asc');
  }

  /** Get trips for a specific shift (for driver view). */
  async getShiftTrips(shiftId: string): Promise<Record<string, unknown>[]> {
    const trips = await db('shuttle_trips')
      .where('shift_id', shiftId)
      .orderBy('scheduled_departure', 'asc');

    // Enrich each trip with passenger list
    for (const trip of trips) {
      const passengers = await db('shuttle_trip_bookings')
        .leftJoin('bookings', 'bookings.id', 'shuttle_trip_bookings.booking_id')
        .leftJoin('users', 'users.id', 'bookings.customer_id')
        .where('shuttle_trip_bookings.trip_id', trip.id)
        .whereNot('shuttle_trip_bookings.status', 'cancelled')
        .select(
          'shuttle_trip_bookings.*',
          'users.name as customer_name',
          'users.phone as customer_phone',
          'bookings.car_plate',
          'bookings.child_seat_required',
          'bookings.wheelchair_assistance'
        );
      (trip as Record<string, unknown>).passengers = passengers;
    }

    return trips;
  }
}

export const shuttleService = new ShuttleService();
