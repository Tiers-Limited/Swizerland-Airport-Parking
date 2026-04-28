import Stripe from 'stripe';

import { db } from '../database';
import { NotFoundError, ValidationError } from '../utils/errors';
import config from '../config';
import { buildPdfBuffer } from '../utils/pdf';
import { emailService } from './email.service';
import { applyZurichDateRange } from '../utils/admin-date-range';


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

export interface PayoutStatementResult {
  payoutId: string;
  fileName: string;
  pdf: Buffer;
  data: Record<string, unknown>;
}

// ─── Payout Service ─────────────────────────────────────────────────
export class PayoutService {

  // ── Get Pending Payouts for all hosts ──────────────────────────────
  async getPendingPayouts(filters: {
    hostId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { hostId, fromDate, toDate, page = 1, limit = 20 } = filters;
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

    query = applyZurichDateRange(query, 'bookings.created_at', { fromDate, toDate });

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

    const statement = await this.generateStatementForPayout(payoutId, updated.host_id as string);
    await db('payouts')
      .where('id', payoutId)
      .update({
        statement_data: JSON.stringify(statement.data),
        statement_generated_at: new Date(),
        updated_at: new Date(),
      });

    const hostUser = await db('hosts')
      .leftJoin('users', 'users.id', 'hosts.user_id')
      .where('hosts.id', updated.host_id)
      .select('users.email as email', 'users.name as name')
      .first();

    if (hostUser?.email) {
      const statementData = statement.data;
      const periodLabel = typeof statementData.periodLabel === 'string'
        ? statementData.periodLabel
        : ((statementData.period as { label?: string } | undefined)?.label || 'die Abrechnung');
      await emailService.sendPayoutStatementEmail({
        email: hostUser.email,
        firstName: hostUser.name?.split(' ')[0] || 'Host',
        subject: `Auszahlungsschein ${periodLabel}`.trim(),
        text: `Anbei der Auszahlungsschein für ${periodLabel}.`,
        pdf: statement.pdf,
        fileName: statement.fileName,
      });
    }

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
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { hostId, status, fromDate, toDate, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('payouts')
      .leftJoin('hosts', 'hosts.id', 'payouts.host_id')
      .leftJoin('users as host_users', 'host_users.id', 'hosts.user_id');

    if (hostId) query = query.where('payouts.host_id', hostId);
    if (status) query = query.where('payouts.status', status);
  query = applyZurichDateRange(query, 'payouts.created_at', { fromDate, toDate });

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

  async getPayoutStatement(payoutId: string): Promise<PayoutStatementResult> {
    const payout = await db('payouts').where('id', payoutId).first();
    if (!payout) throw new NotFoundError('Payout');

    if (payout.statement_data) {
      const data = typeof payout.statement_data === 'string'
        ? JSON.parse(payout.statement_data)
        : payout.statement_data;
      return {
        payoutId,
        fileName: `auszahlungsschein-${payoutId}.pdf`,
        pdf: this.renderStatementPdf(data),
        data,
      };
    }

    const generated = await this.generateStatementForPayout(payoutId, payout.host_id);
    return generated;
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

  private renderStatementPdf(data: Record<string, unknown>): Buffer {
    const period = data.period as { label?: string } | undefined;
    const host = data.host as { company_name?: string; company_address?: string; bank_iban?: string } | undefined;
    const bookings = Array.isArray(data.bookings) ? data.bookings as Array<Record<string, unknown>> : [];
    const textValue = (value: unknown, fallback: string = '—'): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toFixed(2);
      if (typeof value === 'boolean') return value ? 'yes' : 'no';
      return fallback;
    };

    const bookingLines = bookings.map((booking, index) => {
      const bookingCode = textValue(booking.booking_code, textValue(booking.id));
      return `${index + 1}. ${bookingCode} | ${textValue(booking.customer_name)} | ${textValue(booking.start_datetime)} - ${textValue(booking.end_datetime)} | Gross CHF ${Number(booking.gross_amount ?? 0).toFixed(2)} | Commission CHF ${Number(booking.platform_commission ?? 0).toFixed(2)} | Refunds CHF ${Number(booking.refunds ?? 0).toFixed(2)}`;
    });

    return buildPdfBuffer('Auszahlungsschein', [
      {
        title: 'Host Details',
        lines: [
          `Company: ${textValue(host?.company_name)}`,
          `Address: ${textValue(host?.company_address)}`,
          `IBAN: ${textValue(host?.bank_iban)}`,
        ],
      },
      {
        title: 'Billing Period',
        lines: [
          `Period: ${textValue(period?.label)}`,
          `Total gross: CHF ${Number(data.total_gross ?? 0).toFixed(2)}`,
          `Platform commission: CHF ${Number(data.total_commission ?? 0).toFixed(2)}`,
          `Refunds / cancellations: CHF ${Number(data.total_refunds ?? 0).toFixed(2)}`,
          `Net payout: CHF ${Number(data.net_payout ?? 0).toFixed(2)}`,
        ],
      },
      {
        title: 'Bookings in Period',
        lines: bookingLines.length > 0 ? bookingLines : ['No bookings in this billing period.'],
      },
    ]);
  }

  private async generateStatementForPayout(payoutId: string, hostId: string): Promise<PayoutStatementResult> {
    const payout = await db('payouts').where('id', payoutId).first();
    if (!payout) throw new NotFoundError('Payout');

    const host = await db('hosts')
      .leftJoin('users', 'users.id', 'hosts.user_id')
      .where('hosts.id', hostId)
      .select('hosts.*', 'users.name as host_name')
      .first();

    const bookingRows = await db('bookings')
      .leftJoin('users', 'users.id', 'bookings.customer_id')
      .where('bookings.payout_id', payoutId)
      .select(
        'bookings.id',
        'bookings.booking_code',
        'bookings.start_datetime',
        'bookings.end_datetime',
        'bookings.total_price',
        'bookings.platform_commission',
        'bookings.status',
        'users.name as customer_name'
      );

    const periodDate = payout.created_at ? new Date(payout.created_at) : new Date();
    const periodMonth = periodDate.getMonth() + 1;
    const periodYear = periodDate.getFullYear();
    const periodLabel = `${periodDate.toLocaleDateString('de-CH', { month: 'long' })} ${periodYear}`;

    const bookings = bookingRows.map((booking: Record<string, unknown>) => ({
      id: typeof booking.id === 'string' ? booking.id : '',
      booking_code: typeof booking.booking_code === 'string' ? booking.booking_code : '',
      customer_name: typeof booking.customer_name === 'string' ? booking.customer_name : '',
      start_datetime: typeof booking.start_datetime === 'string' ? booking.start_datetime : '',
      end_datetime: typeof booking.end_datetime === 'string' ? booking.end_datetime : '',
      gross_amount: Number(booking.total_price ?? 0),
      platform_commission: Number(booking.platform_commission ?? 0),
      refunds: String(booking.status) === 'refunded' ? Number(booking.total_price ?? 0) : 0,
      status: typeof booking.status === 'string' ? booking.status : '',
    }));

    const totalGross = bookings.reduce((sum, booking) => sum + Number(booking.gross_amount || 0), 0);
    const totalCommission = bookings.reduce((sum, booking) => sum + Number(booking.platform_commission || 0), 0);
    const totalRefunds = bookings.reduce((sum, booking) => sum + Number(booking.refunds || 0), 0);
    const netPayout = Number(payout.amount || 0) - totalRefunds;

    const data = {
      host: {
        company_name: host?.company_name || host?.host_name || '',
        company_address: host?.company_address || host?.address || '',
        bank_iban: host?.bank_iban || '',
        contact_person: host?.contact_person || '',
      },
      period: {
        month: periodMonth,
        year: periodYear,
        label: periodLabel,
      },
      periodLabel,
      bookings,
      total_gross: totalGross,
      total_commission: totalCommission,
      total_refunds: totalRefunds,
      net_payout: netPayout,
    };

    const pdf = this.renderStatementPdf(data);

    return {
      payoutId,
      fileName: `auszahlungsschein-${periodYear}-${String(periodMonth).padStart(2, '0')}-${hostId}.pdf`,
      pdf,
      data,
    };
  }
}

export const payoutService = new PayoutService();
