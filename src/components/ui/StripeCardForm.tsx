'use client';

/**
 * StripeCardForm
 *
 * A forwardRef component that renders a Stripe CardElement inline (no own <form>).
 * The parent owns the submit flow and calls cardRef.current.confirmPayment(clientSecret)
 * once it has received a PaymentIntent clientSecret from the backend.
 *
 * Usage:
 *   const cardRef = useRef<CardFormRef>(null);
 *   // in handleSubmit after getting clientSecret:
 *   const { error } = await cardRef.current!.confirmPayment(clientSecret);
 */

import { forwardRef, useImperativeHandle } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// -- Stripe singleton -----------------------------------------------------------
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// -- Card element visual options ------------------------------------------------
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#EF4444' },
  },
};

// -- Public ref type ------------------------------------------------------------
/** Methods the parent can call via ref. */
export interface CardFormRef {
  confirmPayment: (clientSecret: string) => Promise<{ error: string | undefined }>;
}

// -- Inner component (needs Stripe context from <Elements>) ---------------------
const InnerCardForm = forwardRef<CardFormRef>(function InnerCardForm(_, ref) {
  const stripe   = useStripe();
  const elements = useElements();

  useImperativeHandle(ref, () => ({
    async confirmPayment(clientSecret: string) {
      if (!stripe || !elements) {
        return { error: 'Stripe wird noch geladen. Bitte einen Moment warten.' };
      }
      const card = elements.getElement(CardElement);
      if (!card) return { error: 'Karten-Element nicht bereit.' };

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (error) return { error: error.message };
      if (paymentIntent?.status !== 'succeeded') {
        return { error: `Unerwarteter Zahlungsstatus: ${paymentIntent?.status ?? 'unbekannt'}` };
      }
      return { error: undefined };
    },
  }), [stripe, elements]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-colors">
      <CardElement options={CARD_ELEMENT_OPTIONS} />
    </div>
  );
});

// -- Simulation fallback when no Stripe key is set -----------------------------
// Separate component to avoid conditional hook calls.
const SimulatedCardForm = forwardRef<CardFormRef>(function SimulatedCardForm(_, ref) {
  useImperativeHandle(ref, () => ({
    async confirmPayment() { return { error: undefined }; },
  }), []);

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
      <p className="font-medium mb-1">Dev-Modus: Stripe nicht konfiguriert</p>
      <p className="text-xs text-yellow-700">
        Kein <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> gesetzt. Zahlung wird automatisch simuliert.
      </p>
    </div>
  );
});

// -- Public component -----------------------------------------------------------
/**
 * Drop-in Stripe card field. Renders inside the parent's <form> (no nested form).
 * Expose this via ref so the parent submit handler can call confirmPayment().
 */
export const StripeCardForm = forwardRef<CardFormRef>(function StripeCardForm(_, ref) {
  if (stripePromise === null) {
    return <SimulatedCardForm ref={ref} />;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: 'de' }}>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 tracking-wide">KARTENDATEN</p>
        <InnerCardForm ref={ref} />
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Sichere Zahlung via Stripe � 256-Bit SSL-Verschl�sselung
        </div>
      </div>
    </Elements>
  );
});
