import type { Knex } from 'knex';

/**
 * Migration 009 – Add pricing_tiers JSONB and phone_number to parking_locations
 *
 * Requirements v2.0:
 *  - Each listing stores its own pricing tiers (name, min_days, max_days, price_per_day, fixed_total)
 *  - Each listing stores a phone_number that is sent to the customer after booking
 *  - The old pricing_rules table is kept for backward compatibility but pricing_tiers is the source of truth going forward
 */
export async function up(knex: Knex): Promise<void> {
  // Add phone_number and pricing_tiers to parking_locations
  await knex.schema.alterTable('parking_locations', (table) => {
    // phone_number — host contact number shown to customer after booking
    table.string('phone_number', 20).nullable();

    // pricing_tiers JSONB — array of { name, min_days, max_days, price_per_day?, fixed_total? }
    table.jsonb('pricing_tiers').defaultTo('[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('parking_locations', (table) => {
    table.dropColumn('phone_number');
    table.dropColumn('pricing_tiers');
  });
}
