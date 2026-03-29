export const config = {
  port: 8083,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eventzen_venue',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'venue-vendor-service',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'eventzen-media',
    publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  },
};
