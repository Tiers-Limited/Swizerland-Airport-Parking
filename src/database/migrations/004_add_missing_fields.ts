import { Knex } from 'knex';

/**
 * Migration 004: Add missing fields and tables
 * Aligns schema with the complete specification
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================
  // 1. ADD MISSING COLUMNS TO USERS TABLE
  // ============================================
  await knex.schema.alterTable('users', (table) => {
    table.jsonb('preferences').defaultTo('{}'); // e.g., {"currency": "CHF", "language": "en"}
  });

  // ============================================
  // 2. ADD MISSING COLUMNS TO HOSTS TABLE
  // ============================================
  await knex.schema.alterTable('hosts', (table) => {
    table.decimal('commission_rate', 5, 2).defaultTo(19); // % platform takes
    table.decimal('service_fee', 10, 2).defaultTo(0); // Optional CHF fee per booking
  });

  // ============================================
  // 3. ADD MISSING COLUMNS TO PARKING_LOCATIONS TABLE
  // ============================================
  await knex.schema.alterTable('parking_locations', (table) => {
    table.string('airport_code', 3).defaultTo('ZRH').notNullable(); // Hardcode Zurich, expandable
    table.integer('distance_to_airport_min'); // Travel time in minutes
    table.jsonb('photos').defaultTo('[]'); // Array of S3 URLs (in addition to images)
    
    table.index('airport_code');
  });

  // ============================================
  // 4. CREATE PRICING_RULES TABLE (NEW)
  // ============================================
  await knex.schema.createTable('pricing_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('location_id').notNullable().references('id').inTable('parking_locations').onDelete('CASCADE');
    table.decimal('base_rate_per_day', 10, 2).notNullable(); // CHF
    table.jsonb('offers').defaultTo('[]'); // e.g., [{"min_days": 7, "discount_percent": 10}]
    table.integer('min_stay_days').defaultTo(1);
    table.integer('max_stay_days').defaultTo(30);
    table.string('currency', 3).defaultTo('CHF');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('location_id');
  });

  // ============================================
  // 5. ADD MISSING COLUMNS TO BOOKINGS TABLE
  // ============================================
  await knex.schema.alterTable('bookings', (table) => {
    table.decimal('base_price', 10, 2); // Base price before discounts
    table.decimal('discount_applied', 10, 2).defaultTo(0); // From offers
    table.decimal('service_fee', 10, 2).defaultTo(0); // Host service fee
    table.decimal('platform_commission', 10, 2); // Platform's cut
    table.decimal('host_payout', 10, 2); // What host receives
  });

  // ============================================
  // 6. ADD MISSING COLUMNS TO SHUTTLE_VEHICLES TABLE
  // ============================================
  await knex.schema.alterTable('shuttle_vehicles', (table) => {
    table.text('maintenance_notes');
  });

  // ============================================
  // 7. ADD MISSING COLUMNS TO SHUTTLE_TRIPS TABLE
  // ============================================
  await knex.schema.alterTable('shuttle_trips', (table) => {
    table.integer('current_passengers').defaultTo(0);
    table.integer('current_luggage').defaultTo(0);
    table.integer('max_capacity_luggage');
    table.text('notes');
  });

  // Rename max_capacity to max_capacity_passengers for clarity
  await knex.raw('ALTER TABLE shuttle_trips RENAME COLUMN max_capacity TO max_capacity_passengers');

  // ============================================
  // 8. ADD MISSING COLUMNS TO SHUTTLE_TRIP_BOOKINGS TABLE
  // ============================================
  await knex.schema.alterTable('shuttle_trip_bookings', (table) => {
    table.integer('luggage_count').defaultTo(1);
    table.timestamp('boarded_at');
  });

  // ============================================
  // 9. ADD BOOKING_ID TO PAYMENTS TABLE
  // ============================================
  await knex.schema.alterTable('payments', (table) => {
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.index('booking_id');
  });

  // ============================================
  // 10. CREATE NOTIFICATIONS TABLE (NEW)
  // ============================================
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.enum('type', ['email', 'sms', 'push']).notNullable();
    table.text('content').notNullable();
    table.string('subject', 255);
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.timestamp('sent_at');
    table.jsonb('metadata'); // Additional data like template used, variables
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('booking_id');
    table.index('status');
    table.index('type');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop new tables
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('pricing_rules');

  // Remove added columns from payments
  await knex.schema.alterTable('payments', (table) => {
    table.dropColumn('booking_id');
  });

  // Remove added columns from shuttle_trip_bookings
  await knex.schema.alterTable('shuttle_trip_bookings', (table) => {
    table.dropColumn('luggage_count');
    table.dropColumn('boarded_at');
  });

  // Rename max_capacity_passengers back to max_capacity
  await knex.raw('ALTER TABLE shuttle_trips RENAME COLUMN max_capacity_passengers TO max_capacity');

  // Remove added columns from shuttle_trips
  await knex.schema.alterTable('shuttle_trips', (table) => {
    table.dropColumn('current_passengers');
    table.dropColumn('current_luggage');
    table.dropColumn('max_capacity_luggage');
    table.dropColumn('notes');
  });

  // Remove added columns from shuttle_vehicles
  await knex.schema.alterTable('shuttle_vehicles', (table) => {
    table.dropColumn('maintenance_notes');
  });

  // Remove added columns from bookings
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('base_price');
    table.dropColumn('discount_applied');
    table.dropColumn('service_fee');
    table.dropColumn('platform_commission');
    table.dropColumn('host_payout');
  });

  // Remove added columns from parking_locations
  await knex.schema.alterTable('parking_locations', (table) => {
    table.dropColumn('airport_code');
    table.dropColumn('distance_to_airport_min');
    table.dropColumn('photos');
  });

  // Remove added columns from hosts
  await knex.schema.alterTable('hosts', (table) => {
    table.dropColumn('commission_rate');
    table.dropColumn('service_fee');
  });

  // Remove added columns from users
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('preferences');
  });
}
