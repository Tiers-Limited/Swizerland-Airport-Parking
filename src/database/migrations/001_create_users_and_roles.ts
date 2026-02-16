import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Enable PostGIS extension for geospatial data
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.enum('role', ['customer', 'host', 'dispatcher', 'driver', 'admin'])
      .notNullable()
      .defaultTo('customer');
    table.string('email', 255).unique().notNullable();
    table.string('phone', 20);
    table.string('name', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.enum('status', ['active', 'suspended', 'deleted', 'pending_verification'])
      .defaultTo('pending_verification');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login_at');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index('email');
    table.index('role');
    table.index('status');
  });

  // Create hosts table (parking space providers)
  await knex.schema.createTable('hosts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('company_name', 255);
    table.enum('host_type', ['operator', 'private']).notNullable();
    table.string('payout_account_id', 255); // Stripe Connect account ID
    table.enum('verification_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.boolean('documents_verified').defaultTo(false);
    table.string('tax_id', 50);
    table.text('address');
    table.string('website', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('verification_status');
  });

  // Create driver_profiles table
  await knex.schema.createTable('driver_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('license_number', 50).notNullable();
    table.date('license_expiry').notNullable();
    table.enum('verification_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.boolean('documents_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('verification_status');
  });

  // Create dispatcher_profiles table
  await knex.schema.createTable('dispatcher_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('location_ids', 'uuid[]'); // Array of parking location IDs
    table.string('shift_preference', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('dispatcher_profiles');
  await knex.schema.dropTableIfExists('driver_profiles');
  await knex.schema.dropTableIfExists('hosts');
  await knex.schema.dropTableIfExists('users');
}
