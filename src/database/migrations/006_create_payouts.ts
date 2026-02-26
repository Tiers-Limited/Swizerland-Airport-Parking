import { Knex } from 'knex';

/**
 * Migration 006: Create payouts table and add payout_id to bookings
 * Enables platform admin to track and manage host payouts
 */
export async function up(knex: Knex): Promise<void> {
  // Create payouts table
  await knex.schema.createTable('payouts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('host_id').notNullable().references('id').inTable('hosts').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable(); // Amount paid to host
    table.decimal('commission_amount', 10, 2).notNullable().defaultTo(0); // Commission kept by platform
    table.string('currency', 3).defaultTo('CHF');
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.integer('booking_count').defaultTo(0);
    table.string('stripe_transfer_id', 255); // For Stripe Connect transfers
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('processed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('processed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('host_id');
    table.index('status');
    table.index('created_at');
  });

  // Add payout_id to bookings table
  await knex.schema.alterTable('bookings', (table) => {
    table.uuid('payout_id').references('id').inTable('payouts').onDelete('SET NULL');
    table.index('payout_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('payout_id');
  });
  await knex.schema.dropTableIfExists('payouts');
}
