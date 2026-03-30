import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('hosts', 'rejection_reason');
  if (!hasColumn) {
    await knex.schema.alterTable('hosts', (table) => {
      table.text('rejection_reason');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('hosts', 'rejection_reason');
  if (hasColumn) {
    await knex.schema.alterTable('hosts', (table) => {
      table.dropColumn('rejection_reason');
    });
  }
}