import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('platform_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.decimal('commission_rate', 5, 2).defaultTo(19.00);
    table.decimal('service_fee_rate', 5, 2).defaultTo(5.00);
    table.integer('min_booking_hours').defaultTo(24);
    table.integer('max_booking_days').defaultTo(90);
    table.integer('cancellation_window_hours').defaultTo(48);
    table.string('support_email', 255).defaultTo('support@zurichpark.ch');
    table.string('support_phone', 50);
    table.boolean('maintenance_mode').defaultTo(false);
    table.text('terms_version');
    table.text('privacy_version');
    table.jsonb('notification_settings').defaultTo('{}');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
  });

  // Insert default settings row
  await knex('platform_settings').insert({
    commission_rate: 19.00,
    service_fee_rate: 5.00,
    min_booking_hours: 24,
    max_booking_days: 90,
    cancellation_window_hours: 48,
    support_email: 'support@zurichpark.ch',
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('platform_settings');
}
