import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Blackout dates for host locations (unavailable periods)
  await knex.schema.createTable('blackout_dates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('location_id').notNullable().references('id').inTable('parking_locations').onDelete('CASCADE');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.string('reason', 255);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add analytics helper columns to bookings
  const hasOccupancyRate = await knex.schema.hasColumn('parking_locations', 'total_spots');
  if (!hasOccupancyRate) {
    await knex.schema.alterTable('parking_locations', (table) => {
      table.integer('total_spots').defaultTo(0);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blackout_dates');

  const hasCol = await knex.schema.hasColumn('parking_locations', 'total_spots');
  if (hasCol) {
    await knex.schema.alterTable('parking_locations', (table) => {
      table.dropColumn('total_spots');
    });
  }
}
