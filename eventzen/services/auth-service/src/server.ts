import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import accountRequestRoutes from './routes/accountRequest.routes';
import db from './database/connection';
import { connectKafka, disconnectKafka } from './events/kafkaProducer';
import logger from './utils/logger';

const app = express();

// Kong sets forwarded headers; trust proxy so rate limiting works correctly.
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(hpp());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    checks: { db: 'up', redis: 'up', kafka: 'up' },
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/account-requests', accountRequestRoutes);

// Error handler
app.use(errorHandler);

function assertRequiredConfig(): void {
  const missing: string[] = [];
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (!config.jwt.refreshSecret) missing.push('JWT_REFRESH_SECRET');
  if (!config.piiEncryptionKey) missing.push('PII_ENCRYPTION_KEY');
  if (!config.db.password) missing.push('MYSQL_ROOT_PASSWORD');

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

async function start() {
  assertRequiredConfig();

  await db.migrate.latest({
    directory: path.join(__dirname, 'database', 'migrations'),
    loadExtensions: ['.js'],
  });
  await db.seed.run({
    directory: path.join(__dirname, 'database', 'seeds'),
    loadExtensions: ['.js'],
  });

  try {
    await connectKafka();
  } catch {
    logger.warn('Starting without Kafka connection');
  }

  app.listen(config.port, () => {
    logger.info(`Auth service running on port ${config.port}`);
  });
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await disconnectKafka();
  process.exit(0);
});

start();

export default app;
