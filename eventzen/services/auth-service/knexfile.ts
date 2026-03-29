import type { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST || 'localhost',
      port: 3306,
      database: 'eventzen_auth',
      user: 'root',
      password: process.env.MYSQL_ROOT_PASSWORD || 'Swapnamoy@2003',
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
  docker: {
    client: 'mysql2',
    connection: {
      host: 'mysql-auth',
      port: 3306,
      database: 'eventzen_auth',
      user: 'auth_user',
      password: process.env.AUTH_DB_PASSWORD,
    },
    migrations: {
      directory: './dist/database/migrations',
    },
    seeds: {
      directory: './dist/database/seeds',
    },
  },
};

export default config;
