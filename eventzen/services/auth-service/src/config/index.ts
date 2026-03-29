import dotenv from 'dotenv';
dotenv.config(); // load service-level .env first
dotenv.config({ path: '../../.env' }); // then root .env (won't override existing)

export const config = {
  port: parseInt(process.env.AUTH_SERVICE_PORT || '8081', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: 'eventzen_auth',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || 'Swapnamoy@2003',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'eventzen-super-secret-key-change-in-production-2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'eventzen-refresh-secret-key-change-in-production-2026',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'auth-service',
  },

  piiEncryptionKey: process.env.PII_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'EventZen <noreply@eventzen.com>',
  },
};
