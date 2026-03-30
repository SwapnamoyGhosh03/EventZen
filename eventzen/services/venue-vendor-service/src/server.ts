import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import client from 'prom-client';
import { config } from './config';
import { connectDatabase } from './database/mongoose';
import { connectRedis } from './cache/redis';
import { connectKafkaProducer } from './events/kafkaProducer';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

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

import venueRoutes from './routes/venue.routes';
import vendorRoutes from './routes/vendor.routes';
import contractRoutes from './routes/contract.routes';
import uploadRoutes from './routes/upload.routes';
import { openApiSpec } from './docs/openapi';
import { initMinIO } from './services/minio.service';

const app = express();

// Metrics endpoint — before other routes
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
app.use(cors({ origin: config.cors.origins }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'venue-vendor-service', timestamp: new Date().toISOString() });
});

// Serve locally uploaded files (fallback when MinIO is not running)
// Set cross-origin policy so the frontend (different port) can load these images
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1', contractRoutes);
app.use('/api/v1/upload', uploadRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/venues/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api/v1/venues/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

// Error handler
app.use(errorHandler);

function assertRequiredConfig(): void {
  const missing: string[] = [];
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (!config.redis.password) missing.push('REDIS_PASSWORD');
  if (!config.minio.accessKey) missing.push('MINIO_ACCESS_KEY');
  if (!config.minio.secretKey) missing.push('MINIO_SECRET_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

const start = async () => {
  try {
    assertRequiredConfig();
    await connectDatabase();
    await connectRedis();
    await connectKafkaProducer();
    await initMinIO();

    app.listen(config.port, () => {
      logger.info(`Venue & Vendor Service running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start service:', error);
    process.exit(1);
  }
};

start();

export default app;
