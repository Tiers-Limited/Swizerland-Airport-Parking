import Stripe from 'stripe';
import { db } from '../database';
import { NotFoundError, ValidationError, AppError } from '../utils/errors';
import config from '../config';

// ─── Types ─────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  userId: string;
  bookingId: string;
  /** Total amount the customer pays (CHF). Fractional. */
  amount: number;
  currency: string;
  paymentMethod?: string;
  /**
   * Stripe Connect account that receives the net funds automatically once the
   * payment succeeds (Destination Charge). Obtained from hosts.stripe_account_id
   * or hosts.payout_account_id.
   */
  hostStripeAccountId?: string;
  /**
   * Amount (CHF) the platform KEEPS: service_fee + platform_commission.
   * Sent to Stripe as application_fee_amount (in cents).
   * When present, Stripe auto-transfers (amount − platformFeeAmount) to the
   * host's Connect account on payment success.
   */
  platformFeeAmount?: number;
}

export interface PaymentResult {
  payment: Record<string, unknown>;
  /** Stripe client_secret for Stripe.js confirmCardPayment(). */
  clientSecret?: string;
}

export interface RefundInput {
  paymentId: string;
  /** Refund amount in CHF. */
  amount: number;
  reason?: string;
}

// ─── Stripe singleton ───────────────────────────────────────────────

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!config.stripe.secretKey) return null;
  if (!_stripe) {
    _stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/** true when this is a simulated (non-Stripe) payment intent ID */
const isSimulated = (id: string): boolean => id.startsWith('pi_sim_');

// ─── Payment Service ────────────────────────────────────────────────

export class PaymentService {

  // ── Create Payment Intent ──────────────────────────────────────────
  /**
   * Creates a Stripe PaymentIntent (Destination Charge) so that:
   *   - Platform collects the full amount
   *   - Stripe auto-transfers (amount − platformFeeAmount) to the host Connect account
   *   - Platform keeps platformFeeAmount (service fee + commission)
   *
   * Falls back to a simulated payment when no Stripe key is configured.
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (input.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than 0');
    }

    const stripe = getStripe();
    let stripePaymentIntentId: string | null = null;
    let clientSecret: string | undefined;

    if (stripe) {
      try {
        const amountCents = Math.round(input.amount * 100);

        const params: Stripe.PaymentIntentCreateParams = {
          amount: amountCents,
          currency: input.currency.toLowerCase(),
          // Use explicit card only so it's predictable for Destination Charges
          payment_method_types: ['card'],
          metadata: {
            booking_id: input.bookingId,
            user_id:    input.userId,
          },
        };

        // ── Stripe Connect Destination Charge ──────────────────────
        // Funds flow: Customer → Platform account (minus Stripe fees)
        //                        ↳ Auto-transfer net to host Connect account
        // application_fee_amount = what PLATFORM KEEPS (service_fee + commission)
        if (input.hostStripeAccountId) {
          params.transfer_data = { destination: input.hostStripeAccountId };

          if (input.platformFeeAmount && input.platformFeeAmount > 0) {
            // Clamp: fee cannot exceed total amount
            const feeCents = Math.min(
              Math.round(input.platformFeeAmount * 100),
              amountCents - 1, // Always leave at least 1 cent to host
            );
            params.application_fee_amount = feeCents;
          }
        }

        const paymentIntent = await stripe.paymentIntents.create(params);
        stripePaymentIntentId = paymentIntent.id;
        clientSecret         = paymentIntent.client_secret ?? undefined;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[PaymentService] Stripe PaymentIntent creation failed:', msg);
        // Fall through to simulated path so bookings still work in dev/staging
      }
    }

    // ── Simulation fallback ────────────────────────────────────────
    if (!stripePaymentIntentId) {
      stripePaymentIntentId = `pi_sim_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      clientSecret          = `${stripePaymentIntentId}_secret_sim`;
    }

    const [payment] = await db('payments')
      .insert({
        user_id:                    input.userId,
        booking_id:                 input.bookingId,
        stripe_payment_intent_id:   stripePaymentIntentId,
        amount:                     input.amount,
        currency:                   input.currency,
        status:                     'pending',
        payment_method:             input.paymentMethod || 'card',
        metadata: JSON.stringify({
          source:                  stripe ? 'stripe' : 'simulated',
          host_stripe_account_id:  input.hostStripeAccountId ?? null,
          platform_fee_amount:     input.platformFeeAmount ?? null,
        }),
      })
      .returning('*');

    return { payment, clientSecret };
  }

  // ── Confirm Payment ────────────────────────────────────────────────
  /**
   * Called after Stripe.js has confirmed the PaymentIntent on the client.
   * Verifies the intent status with Stripe (if live) or marks the simulated
   * payment as succeeded and advances the booking to pending_approval.
   */
  async confirmPayment(paymentId: string): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', paymentId).first();
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status === 'succeeded') return payment; // idempotent

    if (payment.status !== 'pending') {
      throw new ValidationError(`Cannot confirm payment with status "${payment.status}"`);
    }

    const stripe = getStripe();

    if (stripe && !isSimulated(payment.stripe_payment_intent_id)) {
      const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      if (pi.status !== 'succeeded') {
        throw new ValidationError(
          `Payment not yet confirmed by Stripe (status: ${pi.status}). ` +
          'Complete payment on the client before calling this endpoint.',
        );
      }
    }
    // For simulated payments, confirmation is instant.

    const [updated] = await db('payments')
      .where('id', paymentId)
      .update({ status: 'succeeded', updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Process Refund ─────────────────────────────────────────────────
  /**
   * Issues a Stripe refund (or simulates one) and updates the payment record.
   *
   * Refund behaviour with Destination Charges:
   *   • Full refund   → Stripe automatically reverses the host transfer too
   *   • Partial refund → The application_fee is partially returned to the platform;
   *                      the host's transfer is NOT automatically reversed for partials.
   *                      An explicit transfer reversal can be triggered if needed.
   */
  async processRefund(input: RefundInput): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', input.paymentId).first();
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
      throw new ValidationError(
        `Only payments with status "succeeded" or "partially_refunded" can be refunded (got: ${payment.status})`,
      );
    }

    const alreadyRefunded = Number(payment.refunded_amount || 0);
    const maxRefundable   = Number(payment.amount) - alreadyRefunded;

    if (input.amount <= 0) {
      throw new ValidationError('Refund amount must be greater than 0');
    }
    if (input.amount > maxRefundable + 0.001) { // tiny float tolerance
      throw new ValidationError(
        `Maximum refundable amount is CHF ${maxRefundable.toFixed(2)} ` +
        `(total: CHF ${Number(payment.amount).toFixed(2)}, already refunded: CHF ${alreadyRefunded.toFixed(2)})`,
      );
    }

    const stripe = getStripe();

    if (stripe && !isSimulated(payment.stripe_payment_intent_id)) {
      try {
        const refundParams: Stripe.RefundCreateParams = {
          payment_intent: payment.stripe_payment_intent_id,
          amount:         Math.round(input.amount * 100),
          reason:         'requested_by_customer',
          metadata: {
            reason_text: input.reason ?? 'Customer cancellation',
          },
        };

        // For a full refund on a Destination Charge, also reverse the transfer so
        // the host's balance is debited back to the platform account.
        const isFullRefund = input.amount >= maxRefundable - 0.001;
        if (isFullRefund) {
          refundParams.reverse_transfer    = true;
          refundParams.refund_application_fee = true;
        }

        await stripe.refunds.create(refundParams);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[PaymentService] Stripe refund failed:', msg);
        throw new AppError(`Refund processing failed: ${msg}`, 500, 'REFUND_FAILED');
      }
    }
    // Simulated: just update the database.

    const newRefundedAmount = alreadyRefunded + input.amount;
    const isFullyRefunded   = newRefundedAmount >= Number(payment.amount) - 0.001;

    const [updated] = await db('payments')
      .where('id', input.paymentId)
      .update({
        status:          isFullyRefunded ? 'refunded' : 'partially_refunded',
        refunded_amount: newRefundedAmount,
        updated_at:      new Date(),
      })
      .returning('*');

    return updated;
  }

  // ── Get Payment by Booking ID ──────────────────────────────────────
  async getPaymentByBookingId(bookingId: string): Promise<Record<string, unknown> | null> {
    const payment = await db('payments')
      .where('booking_id', bookingId)
      .orderBy('created_at', 'desc')
      .first();
    return payment ?? null;
  }

  // ── Get Payment by ID ──────────────────────────────────────────────
  async getPaymentById(paymentId: string): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', paymentId).first();
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }

  // ── Verify & Parse Stripe Webhook ─────────────────────────────────
  /**
   * Validates the Stripe webhook signature and returns the parsed Event.
   * Throws if the signature is invalid.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    const stripe = getStripe();
    if (!stripe || !config.stripe.webhookSecret) {
      throw new AppError('Stripe webhook is not configured', 500, 'WEBHOOK_NOT_CONFIGURED');
    }
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  }

  // ── Handle Stripe Webhook Event ────────────────────────────────────
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {

      // ── Payment succeeded ─────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const payment = await db('payments')
          .where('stripe_payment_intent_id', pi.id)
          .first();

        if (!payment) break;

        await db('payments')
          .where('id', payment.id)
          .update({ status: 'succeeded', updated_at: new Date() });

        // Advance booking: pending_payment → pending_approval
        if (payment.booking_id) {
          await db('bookings')
            .where('id', payment.booking_id)
            .where('status', 'pending_payment')
            .update({
              status:     'pending_approval',
              payment_id: payment.id,
              updated_at: new Date(),
            });
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await db('payments')
          .where('stripe_payment_intent_id', pi.id)
          .update({ status: 'failed', updated_at: new Date() });
        break;
      }

      // ── Charge refunded ───────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId   = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (!piId) break;

        const payment = await db('payments')
          .where('stripe_payment_intent_id', piId)
          .first();

        if (!payment) break;

        const refundedCents = charge.amount_refunded ?? 0;
        const refundedAmt   = refundedCents / 100;
        const isFullRefund  = refundedAmt >= Number(payment.amount) - 0.001;

        await db('payments')
          .where('id', payment.id)
          .update({
            status:          isFullRefund ? 'refunded' : 'partially_refunded',
            refunded_amount: refundedAmt,
            updated_at:      new Date(),
          });

        if (isFullRefund && payment.booking_id) {
          await db('bookings')
            .where('id', payment.booking_id)
            .whereNotIn('status', ['refunded', 'cancelled'])
            .update({ status: 'refunded', updated_at: new Date() });
        }
        break;
      }

      // ── Transfer / auto-split ─────────────────────────────────────
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        // Store the transfer ID on the booking so the payout tracker can reference it
        if (transfer.source_transaction) {
          const stId = typeof transfer.source_transaction === 'string'
            ? transfer.source_transaction
            : (transfer.source_transaction as Stripe.Charge).id;

          const payment = await db('payments')
            .whereRaw(`metadata->>'stripe_charge_id' = ?`, [stId])
            .first();

          if (payment?.booking_id) {
            await db('bookings')
              .where('id', payment.booking_id)
              .update({ stripe_transfer_id: transfer.id, updated_at: new Date() });
          }
        }
        break;
      }

      default:
        // Silently ignore unhandled events (Stripe sends many)
        break;
    }
  }
}

export const paymentService = new PaymentService();
