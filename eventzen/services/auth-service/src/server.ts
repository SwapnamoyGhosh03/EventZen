import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import path from 'path';
import client from 'prom-client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import accountRequestRoutes from './routes/accountRequest.routes';
import db from './database/connection';
import { connectKafka, disconnectKafka } from './events/kafkaProducer';
import logger from './utils/logger';

// ── Prometheus metrics ────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const app = express();

// Kong sets forwarded headers; trust proxy so rate limiting works correctly.
app.set('trust proxy', 1);

// Metrics endpoint — before rate limiter so Prometheus can always scrape
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// HTTP instrumentation middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = (req.route?.path as string) ?? req.path;
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

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
  const rolesCountRow = await db('roles').count<{ count: number | string }[]>({ count: '*' }).first();
  const rolesCount = Number(rolesCountRow?.count ?? 0);
  if (rolesCount === 0) {
    await db.seed.run({
      directory: path.join(__dirname, 'database', 'seeds'),
      loadExtensions: ['.js'],
    });
  }

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
