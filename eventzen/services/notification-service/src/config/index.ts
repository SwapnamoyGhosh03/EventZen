import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8086', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/eventzen_notifications',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: 'notif:',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'eventzen-notification-service',
    groupId: 'eventzen-notification-service',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },
};
