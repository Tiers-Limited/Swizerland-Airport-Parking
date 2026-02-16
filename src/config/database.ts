import { Knex } from 'knex';
import path from 'path';
import config from './index';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds'),
    extension: 'ts',
  },
};

export default knexConfig;
