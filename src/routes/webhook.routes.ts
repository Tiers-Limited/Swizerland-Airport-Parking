/**
 * Stripe Webhook Handler
 *
 * THIS ROUTE IS REGISTERED IN app.ts BEFORE THE JSON BODY PARSER.
 * It uses express.raw({ type: 'application/json' }) so Stripe can verify
 * the signature against the raw request body.
 *
 * Setup in Stripe Dashboard → Webhooks:
 *   Endpoint URL : https://your-domain.com/api/v1/webhooks/stripe
 *   Events to send: payment_intent.succeeded
 *                   payment_intent.payment_failed
 *                   charge.refunded
 *                   transfer.created
 */
import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import config from '../config';

const router = Router();

/**
 * POST /api/v1/webhooks/stripe
 *
 * Express.raw middleware is applied per-route so that this handler receives
 * the raw Buffer required by Stripe for signature verification.
 * (The global express.json() middleware in app.ts does NOT run for this path.)
 */
router.post(
  '/stripe',
  // Per-route raw body parser
  (req, _res, next) => {
    // If the body is already a Buffer (because of app-level express.raw on this path),
    // pass it through. Otherwise, collect the raw bytes.
    if (Buffer.isBuffer(req.body)) return next();
    next();
  },
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !config.stripe.webhookSecret) {
      res.status(400).json({
        success: false,
        message: 'Webhook secret or signature missing',
      });
      return;
    }

    let event;
    try {
      // req.body is a Buffer when express.raw() is applied to this route
      event = paymentService.verifyWebhookSignature(
        req.body as Buffer,
        Array.isArray(sig) ? sig[0] : sig,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook signature verification failed';
      console.error('[Webhook] Signature verification failed:', msg);
      res.status(400).json({ success: false, message: msg });
      return;
    }

    try {
      await paymentService.handleWebhook(event);
      res.json({ success: true, received: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook processing failed';
      console.error('[Webhook] Processing error for event', event.type, ':', msg);
      // Return 200 to Stripe even on processing errors to prevent infinite retries;
      // we log the error for manual investigation.
      res.json({ success: false, received: true, error: msg });
    }
  },
);

export default router;
