import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('users').del();

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  
  await knex('users').insert([
    {
      email: 'admin@airportparking.ch',
      password_hash: adminPasswordHash,
      name: 'System Administrator',
      role: 'admin',
      status: 'active',
      email_verified: true,
    },
  ]);

  console.log('✅ Admin user created: admin@airportparking.ch / Admin123!');
}
