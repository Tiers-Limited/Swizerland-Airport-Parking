import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create parking_locations table
  await knex.schema.createTable('parking_locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('host_id').notNullable().references('id').inTable('hosts').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('address').notNullable();
    table.specificType('location', 'geography(POINT, 4326)'); // PostGIS point
    table.integer('capacity_total').notNullable();
    table.jsonb('amenities').defaultTo('{}');
    table.enum('shuttle_mode', ['scheduled', 'on_demand', 'hybrid']).defaultTo('scheduled');
    table.jsonb('shuttle_hours'); // {"start": "05:00", "end": "23:00", "frequency": 20}
    table.jsonb('buffer_settings'); // {"lot_processing": 10, "transfer_time": 8, "pickup_buffer": 30}
    table.text('description');
    table.jsonb('images').defaultTo('[]');
    table.decimal('base_price_per_day', 10, 2);
    table.text('cancellation_policy');
    table.text('check_in_instructions');
    table.enum('status', ['pending', 'active', 'inactive', 'rejected']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('host_id');
    table.index('status');
  });

  // Create shuttle_vehicles table
  await knex.schema.createTable('shuttle_vehicles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('location_id').references('id').inTable('parking_locations').onDelete('SET NULL');
    table.string('plate', 20).unique().notNullable();
    table.integer('capacity_passengers').notNullable();
    table.integer('capacity_luggage').notNullable();
    table.string('vehicle_type', 50);
    table.string('make', 50);
    table.string('model', 50);
    table.integer('year');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('location_id');
    table.index('active');
  });

  // Create shuttle_shifts table
  await knex.schema.createTable('shuttle_shifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('vehicle_id').notNullable().references('id').inTable('shuttle_vehicles').onDelete('CASCADE');
    table.uuid('driver_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.enum('status', ['planned', 'active', 'closed']).defaultTo('planned');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('vehicle_id');
    table.index('driver_user_id');
    table.index('status');
    table.index(['start_time', 'end_time']);
  });

  // Create shuttle_trips table
  await knex.schema.createTable('shuttle_trips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('shift_id').notNullable().references('id').inTable('shuttle_shifts').onDelete('CASCADE');
    table.enum('direction', ['lot_to_airport', 'airport_to_lot']).notNullable();
    table.timestamp('scheduled_departure').notNullable();
    table.timestamp('actual_departure');
    table.timestamp('arrival_time');
    table.enum('status', ['planned', 'boarding', 'en_route', 'completed', 'cancelled']).defaultTo('planned');
    table.integer('max_capacity').notNullable();
    table.integer('booked_seats').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('shift_id');
    table.index('status');
    table.index('scheduled_departure');
    table.index('direction');
  });

  // Create payments table (needed before bookings)
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('stripe_payment_intent_id', 255);
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('CHF');
    table.enum('status', ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded']).defaultTo('pending');
    table.decimal('refunded_amount', 10, 2).defaultTo(0);
    table.string('payment_method', 50);
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('stripe_payment_intent_id');
    table.index('status');
  });

  // Create bookings table
  await knex.schema.createTable('bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('customer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('location_id').notNullable().references('id').inTable('parking_locations').onDelete('CASCADE');
    table.timestamp('start_datetime').notNullable();
    table.timestamp('end_datetime').notNullable();
    table.timestamp('arrival_lot_datetime').notNullable();
    table.enum('return_pickup_preference', ['flight', 'time']).defaultTo('flight');
    table.string('outbound_flight_no', 20);
    table.string('return_flight_no', 20);
    table.integer('passengers').defaultTo(1);
    table.integer('luggage').defaultTo(1);
    table.string('car_plate', 20);
    table.string('car_model', 100);
    table.enum('status', [
      'draft',
      'pending_payment',
      'confirmed',
      'checked_in',
      'shuttle_to_airport_completed',
      'awaiting_pickup',
      'shuttle_pickup_completed',
      'checked_out',
      'cancelled',
      'no_show',
      'refunded'
    ]).defaultTo('draft');
    table.decimal('total_price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('CHF');
    table.uuid('payment_id').references('id').inTable('payments').onDelete('SET NULL');
    table.text('special_notes');
    table.boolean('child_seat_required').defaultTo(false);
    table.boolean('wheelchair_assistance').defaultTo(false);
    table.string('booking_code', 20).unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('customer_id');
    table.index('location_id');
    table.index('status');
    table.index('booking_code');
    table.index(['start_datetime', 'end_datetime']);
  });

  // Create shuttle_trip_bookings junction table
  await knex.schema.createTable('shuttle_trip_bookings', (table) => {
    table.uuid('trip_id').notNullable().references('id').inTable('shuttle_trips').onDelete('CASCADE');
    table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    table.integer('seat_count').defaultTo(1);
    table.enum('status', ['assigned', 'boarded', 'no_show']).defaultTo('assigned');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.primary(['trip_id', 'booking_id']);

    table.index('trip_id');
    table.index('booking_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('shuttle_trip_bookings');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('shuttle_trips');
  await knex.schema.dropTableIfExists('shuttle_shifts');
  await knex.schema.dropTableIfExists('shuttle_vehicles');
  await knex.schema.dropTableIfExists('parking_locations');
}
