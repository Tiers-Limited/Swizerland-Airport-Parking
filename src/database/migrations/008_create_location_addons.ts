import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Location add-ons / extra services defined by hosts per listing
  await knex.schema.createTable('location_addons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('location_id').notNullable().references('id').inTable('parking_locations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.string('currency', 3).notNullable().defaultTo('CHF');
    table.integer('max_quantity').notNullable().defaultTo(1);
    table.string('icon', 255); // optional icon name or URL
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add addons JSONB column to bookings
  // Stores selected add-ons: [{"addon_id": "uuid", "name": "...", "price": 50.00, "quantity": 1}]
  const hasAddons = await knex.schema.hasColumn('bookings', 'addons');
  if (!hasAddons) {
    await knex.schema.alterTable('bookings', (table) => {
      table.jsonb('addons').defaultTo('[]');
      table.decimal('addons_total', 10, 2).defaultTo(0); // sum of all selected add-on prices
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('location_addons');

  const hasAddons = await knex.schema.hasColumn('bookings', 'addons');
  if (hasAddons) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('addons');
      table.dropColumn('addons_total');
    });
  }
}
