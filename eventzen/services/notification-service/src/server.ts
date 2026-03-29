import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import client from 'prom-client';
import { config } from './config';
import { connectDatabase } from './database/mongoose';
import { initSocketIO } from './websocket/socketio';
import { startKafkaConsumer, stopKafkaConsumer } from './kafka/consumer';
import { errorHandler } from './middleware/errorHandler';
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

import notificationRoutes from './routes/notification.routes';
import templateRoutes from './routes/template.routes';
import preferenceRoutes from './routes/preference.routes';
import pushTokenRoutes from './routes/pushToken.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();
const server = http.createServer(app);

// Metrics endpoint — before other middleware
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
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'notification-service',
      status: 'healthy',
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes — all under /api/v1 to match frontend API_BASE_URLS.NOTIFICATION constant
app.use('/api/v1/notifications/templates', templateRoutes);
app.use('/api/v1/notifications/preferences', preferenceRoutes);
app.use('/api/v1/notifications/push-tokens', pushTokenRoutes);
app.use('/api/v1/notifications/webhooks', webhookRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error handler
app.use(errorHandler);

function assertRequiredConfig(): void {
  const missing: string[] = [];
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (!config.redis.password) missing.push('REDIS_PASSWORD');

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

// Startup
async function start(): Promise<void> {
  assertRequiredConfig();
  await connectDatabase();

  initSocketIO(server);

  // Start Kafka consumer (non-blocking — service runs even if Kafka is down)
  startKafkaConsumer().catch((err) => {
    logger.error('Kafka consumer startup failed', { error: (err as Error).message });
  });

  server.listen(config.port, () => {
    logger.info(`Notification service running on port ${config.port}`);
  });
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await stopKafkaConsumer();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.error('Failed to start service', { error: err.message });
  process.exit(1);
});

export default app;
