import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create refresh_tokens table for session management
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('revoked').defaultTo(false);
    table.timestamp('revoked_at');
    table.text('device_info');
    table.string('ip_address', 45);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('token_hash');
    table.index(['revoked', 'expires_at']);
  });

  // Create password_reset_tokens table
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('token_hash');
    table.index(['used', 'expires_at']);
  });

  // Create email_verification_tokens table
  await knex.schema.createTable('email_verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('token_hash');
    table.index(['used', 'expires_at']);
  });

  // Create audit_logs table for security and compliance
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource', 100).notNullable();
    table.uuid('resource_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('action');
    table.index('resource');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('email_verification_tokens');
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('refresh_tokens');
}
