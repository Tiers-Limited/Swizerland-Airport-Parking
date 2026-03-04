import Stripe from 'stripe';

import { db } from '../database';
import { NotFoundError, ValidationError } from '../utils/errors';
import config from '../config';


// ─── Types ─────────────────────────────────────────────────────────
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreatePayoutInput {
  hostId: string;
  bookingIds: string[];
  adminUserId: string;
  notes?: string;
}

export interface PayoutSummary {
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  totalServiceFees: number;
  totalPayout: number;
  totalPaid: number;
  currency: string;
}

// ─── Payout Service ─────────────────────────────────────────────────
export class PayoutService {

  // ── Get Pending Payouts for all hosts ──────────────────────────────
  async getPendingPayouts(filters: {
    hostId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { hostId, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Get confirmed/completed bookings that haven't been paid out yet
    let query = db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .leftJoin('hosts', 'hosts.id', 'parking_locations.host_id')
      .leftJoin('users as host_users', 'host_users.id', 'hosts.user_id')
      .leftJoin('payments', 'payments.id', 'bookings.payment_id')
      .whereIn('bookings.status', ['confirmed', 'checked_in', 'completed'])
      .where('payments.status', 'succeeded')
      .whereNull('bookings.payout_id');

    if (hostId) {
      query = query.where('parking_locations.host_id', hostId);
    }

    const countQuery = query.clone().clearSelect().count('bookings.id as count');
    const [{ count }] = await countQuery;

    const bookings = await query
      .select(
        'bookings.id',
        'bookings.booking_code',
        'bookings.total_price',
        'bookings.platform_commission',
        'bookings.host_payout',
        'bookings.service_fee',
        'bookings.addons_total',
        'bookings.currency',
        'bookings.status',
        'bookings.created_at',
        'bookings.start_datetime',
        'bookings.end_datetime',
        'parking_locations.name as location_name',
        'parking_locations.host_id',
        'hosts.company_name',
        'hosts.commission_rate',
        'host_users.name as host_name',
        'host_users.email as host_email'
      )
      .orderBy('bookings.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Group by host
    const grouped: Record<string, {
      hostId: string;
      hostName: string;
      hostEmail: string;
      companyName: string;
      commissionRate: number;
      bookings: typeof bookings;
      totalRevenue: number;
      totalCommission: number;
      totalAddons: number;
      totalPayout: number;
    }> = {};

    for (const b of bookings) {
      const hId = b.host_id;
      if (!grouped[hId]) {
        grouped[hId] = {
          hostId: hId,
          hostName: b.host_name,
          hostEmail: b.host_email,
          companyName: b.company_name || b.host_name,
          commissionRate: Number(b.commission_rate || 19),
          bookings: [],
          totalRevenue: 0,
          totalCommission: 0,
          totalAddons: 0,
          totalPayout: 0,
        };
      }
      grouped[hId].bookings.push(b);
      grouped[hId].totalRevenue += Number(b.total_price);
      grouped[hId].totalCommission += Number(b.platform_commission || 0);
      grouped[hId].totalAddons += Number(b.addons_total || 0);
      grouped[hId].totalPayout += Number(b.host_payout || 0);
    }

    return {
      hosts: Object.values(grouped),
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      page,
    };
  }

  // ── Create Payout ──────────────────────────────────────────────────
  async createPayout(input: CreatePayoutInput): Promise<Record<string, unknown>> {
    const { hostId, bookingIds, adminUserId, notes } = input;

    if (!bookingIds.length) {
      throw new ValidationError('At least one booking must be selected for payout');
    }

    // Verify all bookings belong to this host and are eligible
    const bookings = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .leftJoin('payments', 'payments.id', 'bookings.payment_id')
      .where('parking_locations.host_id', hostId)
      .whereIn('bookings.id', bookingIds)
      .whereNull('bookings.payout_id')
      .where('payments.status', 'succeeded')
      .select('bookings.*');

    if (bookings.length !== bookingIds.length) {
      throw new ValidationError('Some bookings are not eligible for payout or do not belong to this host');
    }

    // Calculate totals
    let totalAmount = 0;
    let totalCommission = 0;
    for (const booking of bookings) {
      totalAmount += Number(booking.host_payout || 0);
      totalCommission += Number(booking.platform_commission || 0);
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    totalCommission = Math.round(totalCommission * 100) / 100;

    // Create payout record
    const [payout] = await db('payouts')
      .insert({
        host_id: hostId,
        amount: totalAmount,
        commission_amount: totalCommission,
        currency: 'CHF',
        status: 'pending',
        booking_count: bookings.length,
        notes: notes || null,
        created_by: adminUserId,
      })
      .returning('*');

    // Link bookings to this payout
    await db('bookings')
      .whereIn('id', bookingIds)
      .update({ payout_id: payout.id, updated_at: new Date() });

    return payout;
  }

  // ── Process Payout (mark as completed + Stripe bookkeeping) ──────────
  /**
   * Marks a pending payout as completed.
   *
   * With Stripe Destination Charges funds are already in the host's Connect
   * balance the moment each payment succeeds — Stripe then automatically
   * pays them out to the host's bank on the Connect payout schedule.
   * This method records the Stripe transfer IDs and, optionally, triggers
   * an on-demand Stripe Payout from the Connect account to the host's bank.
   */
  async processPayout(payoutId: string, adminUserId: string): Promise<Record<string, unknown>> {
    const payout = await db('payouts').where('id', payoutId).first();
    if (!payout) throw new NotFoundError('Payout');

    if (payout.status !== 'pending') {
      throw new ValidationError(`Cannot process payout in ${payout.status} status`);
    }

    // Collect the Stripe transfer IDs from all bookings in this payout
    const bookingRows = await db('bookings')
      .where('payout_id', payoutId)
      .whereNotNull('stripe_transfer_id')
      .select('stripe_transfer_id');

    const transferIds = bookingRows
      .map((b: { stripe_transfer_id: string }) => b.stripe_transfer_id)
      .filter(Boolean) as string[];

    // ── Optional: trigger Stripe on-demand payout from Connect balance ──
    let notes = payout.notes || '';
    if (config.stripe.secretKey) {
      const hostRow = await db('hosts')
        .where('id', payout.host_id)
        .select('stripe_account_id', 'payout_account_id')
        .first();

      const connectId: string | undefined =
        hostRow?.stripe_account_id?.startsWith('acct_')
          ? hostRow.stripe_account_id
          : hostRow?.payout_account_id?.startsWith('acct_')
          ? hostRow.payout_account_id
          : undefined;

      if (connectId) {
        try {
          const stripe = new Stripe(config.stripe.secretKey, {
            apiVersion: '2026-02-25.clover',
            typescript: true,
          });
          const stripePayout = await stripe.payouts.create(
            {
              amount:   Math.round(payout.amount * 100),
              currency: (payout.currency || 'chf').toLowerCase(),
              metadata: { payout_id: payoutId },
            },
            { stripeAccount: connectId },
          );
          notes = `Stripe payout ${stripePayout.id} triggered for ${connectId}. Transfers: ${transferIds.join(', ')}`;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[PayoutService] Stripe payout failed for ${connectId}:`, msg);
          notes = `Stripe payout failed: ${msg}. Manual transfer required. Transfers: ${transferIds.join(', ')}`;
        }
      } else {
        notes = `No Stripe Connect account. Manual transfer required. Transfers: ${transferIds.join(', ')}`;
      }
    } else {
      notes = `Simulation mode. Transfers: ${transferIds.join(', ')}`;
    }

    const [updated] = await db('payouts')
      .where('id', payoutId)
      .update({
        status:         'completed',
        notes,
        processed_by:   adminUserId,
        processed_at:   new Date(),
        updated_at:     new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── Reject/Fail Payout ─────────────────────────────────────────────  
  async failPayout(payoutId: string, reason: string, adminUserId: string): Promise<Record<string, unknown>> {
    const payout = await db('payouts').where('id', payoutId).first();
    if (!payout) throw new NotFoundError('Payout');

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      throw new ValidationError(`Cannot fail payout in ${payout.status} status`);
    }

    // Remove payout link from bookings so they can be paid out again
    await db('bookings')
      .where('payout_id', payoutId)
      .update({ payout_id: null, updated_at: new Date() });

    const [updated] = await db('payouts')
      .where('id', payoutId)
      .update({
        status: 'failed',
        notes: reason,
        processed_by: adminUserId,
        processed_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── List All Payouts ───────────────────────────────────────────────
  async listPayouts(filters: {
    hostId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { hostId, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('payouts')
      .leftJoin('hosts', 'hosts.id', 'payouts.host_id')
      .leftJoin('users as host_users', 'host_users.id', 'hosts.user_id');

    if (hostId) query = query.where('payouts.host_id', hostId);
    if (status) query = query.where('payouts.status', status);

    const [{ count }] = await query.clone().clearSelect().count('* as count');

    const payouts = await query
      .select(
        'payouts.*',
        'hosts.company_name',
        'host_users.name as host_name',
        'host_users.email as host_email'
      )
      .orderBy('payouts.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      payouts,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      page,
    };
  }

  // ── Get Payout Details ─────────────────────────────────────────────
  async getPayoutById(payoutId: string): Promise<Record<string, unknown>> {
    const payout = await db('payouts')
      .leftJoin('hosts', 'hosts.id', 'payouts.host_id')
      .leftJoin('users as host_users', 'host_users.id', 'hosts.user_id')
      .select(
        'payouts.*',
        'hosts.company_name',
        'host_users.name as host_name',
        'host_users.email as host_email'
      )
      .where('payouts.id', payoutId)
      .first();

    if (!payout) throw new NotFoundError('Payout');

    // Get associated bookings
    const bookings = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .where('bookings.payout_id', payoutId)
      .select(
        'bookings.id',
        'bookings.booking_code',
        'bookings.total_price',
        'bookings.platform_commission',
        'bookings.host_payout',
        'bookings.service_fee',
        'bookings.addons_total',
        'bookings.addons',
        'bookings.status',
        'bookings.created_at',
        'parking_locations.name as location_name'
      );

    return { ...payout, bookings };
  }

  // ── Get Host Payout Summary ────────────────────────────────────────
  async getHostPayoutSummary(hostId: string): Promise<PayoutSummary> {
    // Total from completed payouts
    const [completedPayouts] = await db('payouts')
      .where('host_id', hostId)
      .where('status', 'completed')
      .sum('amount as total_paid')
      .count('* as count');

    // Total pending (unpaid bookings)
    const [pendingBookings] = await db('bookings')
      .leftJoin('parking_locations', 'parking_locations.id', 'bookings.location_id')
      .leftJoin('payments', 'payments.id', 'bookings.payment_id')
      .where('parking_locations.host_id', hostId)
      .whereIn('bookings.status', ['confirmed', 'checked_in', 'completed'])
      .where('payments.status', 'succeeded')
      .whereNull('bookings.payout_id')
      .sum('bookings.host_payout as pending_payout')
      .sum('bookings.total_price as pending_revenue')
      .sum('bookings.platform_commission as pending_commission')
      .count('* as count');

    return {
      totalBookings: Number(completedPayouts.count || 0) + Number(pendingBookings.count || 0),
      totalRevenue: Number(pendingBookings.pending_revenue || 0),
      totalCommission: Number(pendingBookings.pending_commission || 0),
      totalServiceFees: 0,
      totalPayout: Number(pendingBookings.pending_payout || 0),
      totalPaid: Number(completedPayouts.total_paid || 0),
      currency: 'CHF',
    };
  }
}

export const payoutService = new PayoutService();
