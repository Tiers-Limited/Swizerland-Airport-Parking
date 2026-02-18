import { db } from '../database';
import { NotFoundError } from '../utils/errors';

// ─── Dashboard Stats ─────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingHosts: number;
  pendingListings: number;
  activeBookings: number;
  recentBookings: unknown[];
}

// ─── Admin Service ───────────────────────────────────────────────────
export class AdminService {

  // ── Dashboard ──────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    const [userCount] = await db('users').count('* as count');
    const [hostCount] = await db('hosts').count('* as count');
    const [listingCount] = await db('parking_locations').count('* as count');
    const [bookingCount] = await db('bookings').count('* as count');
    const [revenueResult] = await db('bookings')
      .where('status', '!=', 'cancelled')
      .sum('total_price as total');
    const [pendingHostCount] = await db('hosts')
      .where('verification_status', 'pending')
      .count('* as count');
    const [pendingListingCount] = await db('parking_locations')
      .where('status', 'pending')
      .count('* as count');
    const [activeBookingCount] = await db('bookings')
      .whereIn('status', ['confirmed', 'checked_in'])
      .count('* as count');

    const recentBookings = await db('bookings')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .select(
        'bookings.*',
        'users.name as customer_name',
        'users.email as customer_email',
        'parking_locations.name as listing_name'
      )
      .orderBy('bookings.created_at', 'desc')
      .limit(10);

    return {
      totalUsers: Number(userCount.count),
      totalHosts: Number(hostCount.count),
      totalListings: Number(listingCount.count),
      totalBookings: Number(bookingCount.count),
      totalRevenue: Number(revenueResult.total || 0),
      pendingHosts: Number(pendingHostCount.count),
      pendingListings: Number(pendingListingCount.count),
      activeBookings: Number(activeBookingCount.count),
      recentBookings,
    };
  }

  // ── Users ──────────────────────────────────────────────────────────
  async listUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('users');
    if (role) query = query.where('role', role);
    if (status) query = query.where('status', status);
    if (search) {
      query = query.where(function () {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('* as count');
    const users = await query
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'email_verified', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      users,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async updateUserStatus(userId: string, newStatus: string) {
    const user = await db('users').where('id', userId).first();
    if (!user) throw new NotFoundError('User');

    const [updated] = await db('users')
      .where('id', userId)
      .update({ status: newStatus, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Hosts ──────────────────────────────────────────────────────────
  async listHosts(filters: {
    status?: string;
    hostType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, hostType, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('hosts')
      .leftJoin('users', 'users.id', 'hosts.user_id')
      .select(
        'hosts.*',
        'users.name as user_name',
        'users.email as user_email',
        'users.phone as user_phone',
        'users.status as user_status'
      );

    if (status) query = query.where('hosts.verification_status', status);
    if (hostType) query = query.where('hosts.host_type', hostType);
    if (search) {
      query = query.where(function () {
        this.where('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`)
          .orWhere('hosts.company_name', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().clearSelect().count('* as count');
    const hosts = await query
      .orderBy('hosts.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      hosts,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async updateHostVerification(hostId: string, status: string, documentsVerified?: boolean) {
    const host = await db('hosts').where('id', hostId).first();
    if (!host) throw new NotFoundError('Host');

    const updateData: Record<string, unknown> = {
      verification_status: status,
      updated_at: new Date(),
    };
    if (documentsVerified !== undefined) updateData.documents_verified = documentsVerified;

    const [updated] = await db('hosts')
      .where('id', hostId)
      .update(updateData)
      .returning('*');

    return updated;
  }

  // ── Listings ───────────────────────────────────────────────────────
  async listListings(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('parking_locations')
      .leftJoin('hosts', 'hosts.id', 'parking_locations.host_id')
      .leftJoin('users', 'users.id', 'hosts.user_id')
      .select(
        'parking_locations.*',
        'hosts.company_name as host_company',
        'users.name as host_name',
        'users.email as host_email'
      );

    if (status) query = query.where('parking_locations.status', status);
    if (search) {
      query = query.where(function () {
        this.where('parking_locations.name', 'ilike', `%${search}%`)
          .orWhere('parking_locations.address', 'ilike', `%${search}%`)
          .orWhere('users.name', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().clearSelect().count('* as count');
    const listings = await query
      .orderBy('parking_locations.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      listings,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async updateListingStatus(listingId: string, newStatus: string) {
    const listing = await db('parking_locations').where('id', listingId).first();
    if (!listing) throw new NotFoundError('Listing');

    const [updated] = await db('parking_locations')
      .where('id', listingId)
      .update({ status: newStatus, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Bookings ───────────────────────────────────────────────────────
  async listBookings(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('bookings')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .select(
        'bookings.*',
        'users.name as customer_name',
        'users.email as customer_email',
        'parking_locations.name as listing_name'
      );

    if (status) query = query.where('bookings.status', status);
    if (search) {
      query = query.where(function () {
        this.where('bookings.booking_code', 'ilike', `%${search}%`)
          .orWhere('users.name', 'ilike', `%${search}%`)
          .orWhere('users.email', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().clearSelect().count('* as count');
    const bookings = await query
      .orderBy('bookings.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      bookings,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async refundBooking(bookingId: string) {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({ status: 'refunded', updated_at: new Date() })
      .returning('*');

    // If payment exists, update payment status
    if (booking.payment_id) {
      await db('payments')
        .where('id', booking.payment_id)
        .update({ status: 'refunded', refunded_amount: booking.total_price, updated_at: new Date() });
    }

    return updated;
  }

  // ── Payments ───────────────────────────────────────────────────────
  async listPayments(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('payments')
      .leftJoin('users', 'users.id', 'payments.user_id')
      .select(
        'payments.*',
        'users.name as user_name',
        'users.email as user_email'
      );

    if (status) query = query.where('payments.status', status);

    const [{ count }] = await query.clone().clearSelect().count('* as count');
    const payments = await query
      .orderBy('payments.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      payments,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  // ── Vehicles ───────────────────────────────────────────────────────
  async listVehicles(filters: {
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { active, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('shuttle_vehicles')
      .leftJoin('parking_locations', 'parking_locations.id', 'shuttle_vehicles.location_id')
      .select(
        'shuttle_vehicles.*',
        'parking_locations.name as location_name'
      );

    if (active !== undefined) query = query.where('shuttle_vehicles.active', active);
    if (search) {
      query = query.where(function () {
        this.where('shuttle_vehicles.plate', 'ilike', `%${search}%`)
          .orWhere('shuttle_vehicles.make', 'ilike', `%${search}%`)
          .orWhere('shuttle_vehicles.model', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().clearSelect().count('* as count');
    const vehicles = await query
      .orderBy('shuttle_vehicles.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      vehicles,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async updateVehicleStatus(vehicleId: string, active: boolean) {
    const vehicle = await db('shuttle_vehicles').where('id', vehicleId).first();
    if (!vehicle) throw new NotFoundError('Vehicle');

    const [updated] = await db('shuttle_vehicles')
      .where('id', vehicleId)
      .update({ active, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Platform Settings ──────────────────────────────────────────────
  async getSettings() {
    const settings = await db('platform_settings').first();
    return settings || {};
  }

  async updateSettings(data: Record<string, unknown>, updatedBy: string) {
    const settings = await db('platform_settings').first();
    if (!settings) {
      const [created] = await db('platform_settings')
        .insert({ ...data, updated_by: updatedBy })
        .returning('*');
      return created;
    }

    const [updated] = await db('platform_settings')
      .where('id', settings.id)
      .update({ ...data, updated_by: updatedBy, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Analytics ──────────────────────────────────────────────────────
  async getRevenueByMonth(months: number = 12) {
    const result = await db('bookings')
      .select(
        db.raw("to_char(created_at, 'YYYY-MM') as month"),
        db.raw('SUM(total_price) as revenue'),
        db.raw('COUNT(*) as count')
      )
      .where('status', '!=', 'cancelled')
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${months} months'`))
      .groupByRaw("to_char(created_at, 'YYYY-MM')")
      .orderByRaw("to_char(created_at, 'YYYY-MM') ASC");

    return result;
  }

  async getBookingsByStatus() {
    const result = await db('bookings')
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');

    return result;
  }
}

export const adminService = new AdminService();
