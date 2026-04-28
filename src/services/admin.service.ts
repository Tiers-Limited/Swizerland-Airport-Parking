import { db } from '../database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { hashPassword, generateRandomToken } from '../utils/auth.utils';
import { emailService } from './email.service';
import { paymentService } from './payment.service';
import { UserRole, UserStatus, VerificationStatus } from '../types/roles';
import { userService } from './user.service';
import { applyZurichDateRange, type AdminDateRangeFilters } from '../utils/admin-date-range';

// ─── Create Host Input ───────────────────────────────────────────────
export interface CreateHostInput {
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  companyPhone?: string;
  companyAddress?: string;
  bankIban?: string;
  mwstNumber?: string;
  commissionRate?: number;
  facilityOptions?: Record<string, boolean> | string[];
  transferService?: Record<string, unknown>;
  photos?: string[];
}

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

export interface AdminAnalyticsFilters extends AdminDateRangeFilters {
  months?: number;
}

// ─── Admin Service ───────────────────────────────────────────────────
export class AdminService {

  // ── Dashboard ──────────────────────────────────────────────────────
  async getDashboardStats(filters: AdminDateRangeFilters = {}): Promise<DashboardStats> {
    const [userCount] = await applyZurichDateRange(db('users'), 'users.created_at', filters).count('* as count');
    const [hostCount] = await applyZurichDateRange(db('hosts'), 'hosts.created_at', filters).count('* as count');
    const [listingCount] = await applyZurichDateRange(db('parking_locations'), 'parking_locations.created_at', filters).count('* as count');

    const bookingBaseQuery = applyZurichDateRange(db('bookings'), 'bookings.created_at', filters);
    const [bookingCount] = await bookingBaseQuery.clone().count('* as count');
    const [revenueResult] = await bookingBaseQuery.clone()
      .where('status', '!=', 'cancelled')
      .sum('total_price as total');
    const [pendingHostCount] = await applyZurichDateRange(db('hosts').where('verification_status', 'pending'), 'hosts.created_at', filters).count('* as count');
    const [pendingListingCount] = await applyZurichDateRange(db('parking_locations').where('status', 'pending'), 'parking_locations.created_at', filters).count('* as count');
    const [activeBookingCount] = await bookingBaseQuery.clone()
      .whereIn('status', ['confirmed', 'checked_in'])
      .count('* as count');

    const recentBookings = await bookingBaseQuery.clone()
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

  async updateUserDetails(userId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    emailVerified?: boolean;
    role?: UserRole;
    status?: UserStatus;
  }) {
    return userService.updateAdmin(userId, data);
  }

  // ── Hosts ──────────────────────────────────────────────────────────
  async listHosts(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;
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

  async updateHostVerification(
    hostId: string,
    status: string,
    documentsVerified?: boolean,
    rejectionReason?: string
  ) {
    const host = await db('hosts').where('id', hostId).first();
    if (!host) throw new NotFoundError('Host');

    const allowedStatuses = [VerificationStatus.APPROVED, VerificationStatus.REJECTED];
    if (!allowedStatuses.includes(status as VerificationStatus)) {
      throw new ValidationError('Status must be approved or rejected');
    }

    if (status === VerificationStatus.REJECTED && !rejectionReason?.trim()) {
      throw new ValidationError('Rejection reason is required');
    }

    const updateData: Record<string, unknown> = {
      verification_status: status,
      updated_at: new Date(),
    };
    if (documentsVerified === undefined) {
      updateData.documents_verified = status === VerificationStatus.APPROVED;
    } else {
      updateData.documents_verified = documentsVerified;
    }

    updateData.rejection_reason =
      status === VerificationStatus.REJECTED ? rejectionReason?.trim() || null : null;

    const [updated] = await db('hosts')
      .where('id', hostId)
      .update(updateData)
      .returning('*');

    if (status === VerificationStatus.APPROVED) {
      await db('users')
        .where('id', host.user_id)
        .whereNot('role', UserRole.ADMIN)
        .update({ role: UserRole.HOST, updated_at: new Date() });
    } else if (status === VerificationStatus.REJECTED) {
      await db('users')
        .where('id', host.user_id)
        .whereNot('role', UserRole.ADMIN)
        .update({ role: UserRole.CUSTOMER, updated_at: new Date() });
    }

    const hostUser = await db('users').where('id', host.user_id).select('email', 'name').first();
    if (hostUser?.email) {
      await emailService.sendHostVerificationStatusEmail({
        email: hostUser.email,
        firstName: hostUser.name?.split(' ')[0] || hostUser.name || 'Host',
        status: status as 'approved' | 'rejected',
        rejectionReason: status === VerificationStatus.REJECTED ? rejectionReason?.trim() : undefined,
      });
    }

    return updated;
  }

  /**
   * Create a new host (admin only).
   * Creates user with HOST role, creates host record, sends credentials via email.
   */
  async createHost(data: CreateHostInput) {
    const email = data.email.toLowerCase();

    // Check if email already exists
    const existing = await db('users').where('email', email).first();
    if (existing) {
      throw new ConflictError('E-Mail-Adresse ist bereits registriert');
    }

    // Generate a temporary password
    const tempPassword = generateRandomToken(6); // 12 hex chars

    const passwordHash = await hashPassword(tempPassword);

    // Create the user with HOST role, active, email verified
    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: data.name,
        phone: data.phone || null,
        role: UserRole.HOST,
        status: UserStatus.ACTIVE,
        email_verified: true,
      })
      .returning('*');

    // Create the host record
    const [host] = await db('hosts')
      .insert({
        user_id: user.id,
        company_name: data.companyName,
        host_type: 'operator',
        verification_status: VerificationStatus.APPROVED,
        documents_verified: true,
        contact_person: data.contactPerson || null,
        company_phone: data.companyPhone || data.phone || null,
        company_address: data.companyAddress || null,
        bank_iban: data.bankIban || null,
        mwst_number: data.mwstNumber || null,
        commission_rate: data.commissionRate ?? 19,
        facility_options: data.facilityOptions ? JSON.stringify(data.facilityOptions) : '[]',
        transfer_service: data.transferService ? JSON.stringify(data.transferService) : '{}',
        photos: data.photos ? JSON.stringify(data.photos) : '[]',
      })
      .returning('*');

    // Send credentials email
    await emailService.sendHostCredentialsEmail({
      email,
      firstName: data.name,
      tempPassword,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      host: {
        id: host.id,
        company_name: host.company_name,
        host_type: host.host_type,
        verification_status: host.verification_status,
      },
    };
  }

  async updateHost(hostId: string, data: Partial<CreateHostInput>) {
    const host = await db('hosts').where('id', hostId).first();
    if (!host) throw new NotFoundError('Host');

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
    if (data.companyPhone !== undefined || data.phone !== undefined) updateData.company_phone = data.companyPhone || data.phone || null;
    if (data.companyAddress !== undefined) updateData.company_address = data.companyAddress;
    if (data.bankIban !== undefined) updateData.bank_iban = data.bankIban;
    if (data.mwstNumber !== undefined) updateData.mwst_number = data.mwstNumber;
    if (data.commissionRate !== undefined) updateData.commission_rate = data.commissionRate;
    if (data.facilityOptions !== undefined) updateData.facility_options = JSON.stringify(data.facilityOptions);
    if (data.transferService !== undefined) updateData.transfer_service = JSON.stringify(data.transferService);
    if (data.photos !== undefined) updateData.photos = JSON.stringify(data.photos);
    if (data.address !== undefined) updateData.address = data.address;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.phone !== undefined) updateData.phone_number = data.phone;

    const [updated] = await db('hosts').where('id', hostId).update(updateData).returning('*');
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
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, fromDate, toDate, page = 1, limit = 20 } = filters;
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
    query = applyZurichDateRange(query, 'bookings.start_datetime', { fromDate, toDate });
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

  async refundBooking(bookingId: string, amount?: number, reason?: string) {
    const booking = await db('bookings').where('id', bookingId).first();
    if (!booking) throw new NotFoundError('Booking');

    // ── Determine refund amount ──────────────────────────────────────
    // Admin can pass an explicit amount; otherwise we apply the standard policy.
    let refundAmount: number;
    if (amount !== undefined && amount !== null) {
      refundAmount = Math.round(amount * 100) / 100;
    } else {
      // Standard policy: >24h = 100%, 12–24h = 50%, <12h = 0%
      const now = new Date();
      const arrival = new Date(booking.start_datetime);
      const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilArrival > 24) {
        refundAmount = Math.round(Number(booking.total_price) * 100) / 100;
      } else if (hoursUntilArrival >= 12) {
        refundAmount = Math.round(Number(booking.total_price) * 0.5 * 100) / 100;
      } else {
        refundAmount = 0;
      }
    }

    const refundReason = reason || 'Admin forced refund';

    // ── Issue the Stripe refund (if payment exists & amount > 0) ────
    if (refundAmount > 0) {
      // Prefer booking.payment_id; fall back to latest payment for this booking.
      let paymentId: string | null = booking.payment_id ?? null;
      if (!paymentId) {
        const latestPayment = await db('payments')
          .where('booking_id', bookingId)
          .where('status', 'succeeded')
          .orderBy('created_at', 'desc')
          .first();
        paymentId = latestPayment?.id ?? null;
      }

      if (paymentId) {
        // Delegate to paymentService so the single Stripe refund path is always used.
        // This ensures the actual Stripe API call happens and the payments record is
        // kept in sync regardless of whether it's a live or simulated payment.
        await paymentService.processRefund({
          paymentId,
          amount: refundAmount,
          reason: refundReason,
        });
      }
    }

    // ── Update booking ───────────────────────────────────────────────
    const newStatus = refundAmount > 0 ? 'refunded' : 'cancelled';
    const [updated] = await db('bookings')
      .where('id', bookingId)
      .update({
        status:       newStatus,
        refund_reason: refundReason,
        refunded_at:  refundAmount > 0 ? new Date() : null,
        updated_at:   new Date(),
      })
      .returning('*');

    // ── Email notifications ──────────────────────────────────────────
    try {
      const customer = await db('users').where('id', booking.customer_id).first();
      if (customer) {
        const fmtCHF = (v: number) =>
          new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(v);
        const fmtDate = (d: unknown) => {
          try { return new Date(d as string).toLocaleDateString('de-CH'); } catch { return String(d); }
        };

        // Reuse generic sendEmail so we don't need a new template method
        emailService.sendEmail({
          to:      customer.email,
          subject: refundAmount > 0 ? 'Rückerstattung bestätigt' : 'Buchung storniert',
          html: `
            <p>Hallo ${customer.name?.split(' ')[0] || 'Kunde'},</p>
            <p>Ihre Buchung <strong>${booking.booking_code}</strong> wurde vom Administrator
            ${refundAmount > 0 ? `storniert und eine Rückerstattung von <strong>${fmtCHF(refundAmount)}</strong> wurde veranlasst` : 'storniert'}.</p>
            ${ refundAmount > 0 ? `<p>Die Rückerstattung erscheint in 5–10 Werktagen auf Ihrer Karte.</p>` : '' }
            <p>Grund: ${refundReason}</p>
            <p>Zeitraum: ${fmtDate(booking.start_datetime)} – ${fmtDate(booking.end_datetime)}</p>
            <p>Bei Fragen wenden Sie sich bitte an unseren Support.</p>
          `,
        }).catch((err: unknown) => console.error('[AdminService] Refund email failed:', err));
      }
    } catch (emailErr) {
      console.error('[AdminService] Error sending refund notification:', emailErr);
    }

    return { booking: updated, refundAmount, reason: refundReason };
  }

  // ── Payments ───────────────────────────────────────────────────────
  async listPayments(filters: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, fromDate, toDate, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('payments')
      .leftJoin('users', 'users.id', 'payments.user_id')
      .select(
        'payments.*',
        'users.name as user_name',
        'users.email as user_email'
      );

    if (status) query = query.where('payments.status', status);
  query = applyZurichDateRange(query, 'payments.created_at', { fromDate, toDate });

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
  async getRevenueByMonth(filters: AdminAnalyticsFilters = {}) {
    const { months = 12, fromDate, toDate } = filters;

    const baseQuery = applyZurichDateRange(db('bookings'), 'bookings.created_at', { fromDate, toDate });

    const result = await baseQuery
      .select(
        db.raw("to_char(bookings.created_at AT TIME ZONE 'Europe/Zurich', 'YYYY-MM') as month"),
        db.raw('SUM(total_price) as revenue'),
        db.raw('COUNT(*) as count')
      )
      .where('status', '!=', 'cancelled')
      .modify((builder: any) => {
        if (!fromDate && !toDate) {
          builder.where('bookings.created_at', '>=', db.raw(`NOW() - INTERVAL '${months} months'`));
        }
      })
      .groupByRaw("to_char(bookings.created_at AT TIME ZONE 'Europe/Zurich', 'YYYY-MM')")
      .orderByRaw("to_char(bookings.created_at AT TIME ZONE 'Europe/Zurich', 'YYYY-MM') ASC");

    return result;
  }

  async getBookingsByStatus(filters: AdminDateRangeFilters = {}) {
    const result = await applyZurichDateRange(db('bookings'), 'bookings.created_at', filters)
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');

    return result;
  }
}

export const adminService = new AdminService();
