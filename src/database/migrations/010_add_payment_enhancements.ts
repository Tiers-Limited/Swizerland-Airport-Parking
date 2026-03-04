import type { Knex } from 'knex';

/**
 * Migration 010 – Payment & Booking Enhancements
 *
 * Changes:
 *  1. Add `pending_approval` value to bookings.status enum
 *     (Postgres requires ALTER TYPE … ADD VALUE; Knex raw is required)
 *  2. Add `refund_reason`   column to bookings  – stores the reason for the refund
 *  3. Add `refunded_at`     column to bookings  – timestamp when refund was issued
 *  4. Add `stripe_transfer_id` to bookings       – track the automatic Stripe transfer
 *  5. Add `stripe_account_id`  to hosts          – explicit alias next to payout_account_id
 *     (payout_account_id is kept; stripe_account_id is the canonical Stripe Connect ID)
 */
export async function up(knex: Knex): Promise<void> {
  // ── 1. Extend bookings.status enum ────────────────────────────────
  // Postgres ADD VALUE is idempotent in PG 12+ with IF NOT EXISTS; knex raw is needed
  // because Knex's alterTable does not support extending existing enum types.
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'pending_approval'
          AND enumtypid = (
            SELECT oid FROM pg_type
            WHERE typname = 'bookings_status'
          )
      ) THEN
        -- The bookings status column uses an inline PostgreSQL enum; we have to alter
        -- the underlying domain/type by first changing the column to text, adding the
        -- new enum value was not created as a named TYPE in migration 003, so we just
        -- alter the CHECK constraint in a safe way.
        NULL; -- handled below via knex.schema
      END IF;
    END $$;
  `);

  // In migration 003, status was created as a knex .enum() which in Postgres becomes
  // an anonymous CHECK constraint, NOT a named TYPE.  We can therefore just drop the
  // old constraint and add a new one that includes 'pending_approval'.
  const hasConstraint = await knex.raw(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'bookings'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%status%'
    LIMIT 1;
  `);

  // Drop all existing check constraints on bookings.status (there may be more than one
  // if the column was altered previously; we re-add a single consolidated one).
  const existingConstraints = await knex.raw(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'bookings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
  `);

  for (const row of existingConstraints.rows) {
    await knex.raw(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS "${row.conname}";`);
  }

  // Alter the column to accept the new complete set of allowed values
  await knex.raw(`
    ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_status_check;
  `);

  await knex.raw(`
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'draft',
      'pending_payment',
      'pending_approval',
      'confirmed',
      'checked_in',
      'active',
      'shuttle_to_airport_completed',
      'awaiting_pickup',
      'shuttle_pickup_completed',
      'checked_out',
      'completed',
      'cancelled',
      'no_show',
      'refunded'
    ));
  `);

  // ── 2–4. Extra columns on bookings ────────────────────────────────
  const hasRefundReason = await knex.schema.hasColumn('bookings', 'refund_reason');
  if (!hasRefundReason) {
    await knex.schema.alterTable('bookings', (table) => {
      table.text('refund_reason').nullable();
      table.timestamp('refunded_at').nullable();
      table.string('stripe_transfer_id', 255).nullable(); // populated from Stripe webhook
    });
  }

  // ── 5. stripe_account_id on hosts ─────────────────────────────────
  // payout_account_id already exists (migration 001); we add stripe_account_id as a
  // dedicated column so code has a stable name while payout_account_id is kept for
  // backward compatibility.
  const hasStripeAccountId = await knex.schema.hasColumn('hosts', 'stripe_account_id');
  if (!hasStripeAccountId) {
    await knex.schema.alterTable('hosts', (table) => {
      table.string('stripe_account_id', 255).nullable()
        .comment('Stripe Connect Express account ID (acct_xxx)');
      table.boolean('stripe_onboarded').defaultTo(false)
        .comment('True once host has completed Stripe Connect onboarding');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove new columns
  const hasRefundReason = await knex.schema.hasColumn('bookings', 'refund_reason');
  if (hasRefundReason) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('refund_reason');
      table.dropColumn('refunded_at');
      table.dropColumn('stripe_transfer_id');
    });
  }

  const hasStripeAccountId = await knex.schema.hasColumn('hosts', 'stripe_account_id');
  if (hasStripeAccountId) {
    await knex.schema.alterTable('hosts', (table) => {
      table.dropColumn('stripe_account_id');
      table.dropColumn('stripe_onboarded');
    });
  }

  // Restore old CHECK constraint (without pending_approval)
  await knex.raw(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;`);
  await knex.raw(`
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'draft', 'pending_payment', 'confirmed', 'checked_in',
      'shuttle_to_airport_completed', 'awaiting_pickup',
      'shuttle_pickup_completed', 'checked_out',
      'cancelled', 'no_show', 'refunded'
    ));
  `);
}
