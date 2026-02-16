import knex, { Knex } from 'knex';
import knexConfig from '../config/database';

class Database {
  private static instance: Knex;

  public static getInstance(): Knex {
    if (!Database.instance) {
      Database.instance = knex(knexConfig);
    }
    return Database.instance;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const db = Database.getInstance();
      await db.raw('SELECT 1');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (Database.instance) {
      await Database.instance.destroy();
      console.log('Database connection closed');
    }
  }
}

export const db = Database.getInstance();
export default Database;
