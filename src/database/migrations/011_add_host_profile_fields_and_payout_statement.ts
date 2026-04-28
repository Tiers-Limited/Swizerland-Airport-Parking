import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('hosts', (table) => {
    table.string('contact_person', 255);
    table.string('company_phone', 50);
    table.text('company_address');
    table.string('bank_iban', 64);
    table.string('mwst_number', 64);
    table.jsonb('facility_options').defaultTo('[]');
    table.jsonb('transfer_service').defaultTo('{}');
    table.jsonb('photos').defaultTo('[]');
  });

  await knex.schema.alterTable('payouts', (table) => {
    table.jsonb('statement_data');
    table.timestamp('statement_generated_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payouts', (table) => {
    table.dropColumn('statement_generated_at');
    table.dropColumn('statement_data');
  });

  await knex.schema.alterTable('hosts', (table) => {
    table.dropColumn('photos');
    table.dropColumn('transfer_service');
    table.dropColumn('facility_options');
    table.dropColumn('mwst_number');
    table.dropColumn('bank_iban');
    table.dropColumn('company_address');
    table.dropColumn('company_phone');
    table.dropColumn('contact_person');
  });
}
