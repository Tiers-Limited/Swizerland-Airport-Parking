import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'bookings_status_enum'
      ) THEN
        ALTER TYPE bookings_status_enum ADD VALUE IF NOT EXISTS 'modified';
      END IF;
    END $$;
  `);
}

export async function down(_knex: Knex): Promise<void> {
  // PostgreSQL enum values cannot be removed safely without rebuilding the type.
}