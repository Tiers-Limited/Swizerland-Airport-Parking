import { db } from '../database';
import { NotFoundError, ValidationError, AppError } from '../utils/errors';
import config from '../config';

// ─── Note: Stripe Integration ──────────────────────────────────────
// In production, you would use the Stripe SDK. For MVP, we simulate
// payment processing with database records and provide hooks for
// real Stripe integration.

// ─── Types ─────────────────────────────────────────────────────────
export interface CreatePaymentInput {
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
}

export interface PaymentResult {
  payment: Record<string, unknown>;
  clientSecret?: string; // For Stripe Elements
}

export interface RefundInput {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface PayoutInput {
  hostId: string;
  bookingIds: string[];
  amount: number;
  currency: string;
  adminUserId: string;
}

// ─── Payment Service ────────────────────────────────────────────────
export class PaymentService {

  // ── Create Payment Intent ──────────────────────────────────────────
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (input.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than 0');
    }

    let stripePaymentIntentId: string | null = null;
    let clientSecret: string | undefined;

    // If Stripe is configured, create real PaymentIntent
    if (config.stripe.secretKey) {
      try {
        // Dynamic import to avoid errors when Stripe isn't installed
        const stripe = require('stripe')(config.stripe.secretKey);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.amount * 100), // Stripe uses cents
          currency: input.currency.toLowerCase(),
          metadata: {
            booking_id: input.bookingId,
            user_id: input.userId,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        stripePaymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret;
      } catch (err: any) {
        console.error('Stripe PaymentIntent creation failed:', err.message);
        // Fall through to simulated payment
      }
    }

    // If no Stripe, simulate payment intent ID
    if (!stripePaymentIntentId) {
      stripePaymentIntentId = `pi_sim_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      clientSecret = `${stripePaymentIntentId}_secret_sim`;
    }

    // Create payment record
    const [payment] = await db('payments')
      .insert({
        user_id: input.userId,
        booking_id: input.bookingId,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount: input.amount,
        currency: input.currency,
        status: 'pending',
        payment_method: input.paymentMethod || 'card',
        metadata: { source: config.stripe.secretKey ? 'stripe' : 'simulated' },
      })
      .returning('*');

    return { payment, clientSecret };
  }

  // ── Confirm Payment (called after Stripe confirmation or for simulation) ──
  async confirmPayment(paymentId: string): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', paymentId).first();
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status === 'succeeded') {
      return payment; // Already confirmed
    }

    if (payment.status !== 'pending') {
      throw new ValidationError(`Cannot confirm payment in ${payment.status} status`);
    }

    // If Stripe is configured, verify the payment status
    if (config.stripe.secretKey && payment.stripe_payment_intent_id && !payment.stripe_payment_intent_id.startsWith('pi_sim_')) {
      try {
        const stripe = require('stripe')(config.stripe.secretKey);
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
          throw new ValidationError(`Payment not yet confirmed by Stripe. Status: ${paymentIntent.status}`);
        }
      } catch (err: any) {
        if (err instanceof ValidationError) throw err;
        console.error('Stripe verification failed:', err.message);
      }
    }

    const [updated] = await db('payments')
      .where('id', paymentId)
      .update({ status: 'succeeded', updated_at: new Date() })
      .returning('*');

    return updated;
  }

  // ── Process Refund ─────────────────────────────────────────────────
  async processRefund(input: RefundInput): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', input.paymentId).first();
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status !== 'succeeded') {
      throw new ValidationError('Can only refund succeeded payments');
    }

    const maxRefundable = Number(payment.amount) - Number(payment.refunded_amount || 0);
    if (input.amount > maxRefundable) {
      throw new ValidationError(`Maximum refundable amount is CHF ${maxRefundable.toFixed(2)}`);
    }

    // If Stripe is configured, process real refund
    if (config.stripe.secretKey && payment.stripe_payment_intent_id && !payment.stripe_payment_intent_id.startsWith('pi_sim_')) {
      try {
        const stripe = require('stripe')(config.stripe.secretKey);
        await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: Math.round(input.amount * 100),
          reason: 'requested_by_customer',
        });
      } catch (err: any) {
        console.error('Stripe refund failed:', err.message);
        throw new AppError(`Refund processing failed: ${err.message}`, 500, 'REFUND_FAILED');
      }
    }

    const newRefundedAmount = Number(payment.refunded_amount || 0) + input.amount;
    const isFullyRefunded = newRefundedAmount >= Number(payment.amount);

    const [updated] = await db('payments')
      .where('id', input.paymentId)
      .update({
        status: isFullyRefunded ? 'refunded' : 'partially_refunded',
        refunded_amount: newRefundedAmount,
        updated_at: new Date(),
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

    return payment || null;
  }

  // ── Get Payment by ID ──────────────────────────────────────────────
  async getPaymentById(paymentId: string): Promise<Record<string, unknown>> {
    const payment = await db('payments').where('id', paymentId).first();
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }

  // ── Handle Stripe Webhook ──────────────────────────────────────────
  async handleWebhook(event: { type: string; data: { object: any } }): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await db('payments')
          .where('stripe_payment_intent_id', paymentIntent.id)
          .first();

        if (payment) {
          await db('payments')
            .where('id', payment.id)
            .update({ status: 'succeeded', updated_at: new Date() });

          // Auto-confirm the booking
          if (payment.booking_id) {
            await db('bookings')
              .where('id', payment.booking_id)
              .where('status', 'pending_payment')
              .update({ status: 'confirmed', payment_id: payment.id, updated_at: new Date() });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await db('payments')
          .where('stripe_payment_intent_id', paymentIntent.id)
          .update({ status: 'failed', updated_at: new Date() });
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }
}

export const paymentService = new PaymentService();
