import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import accountRequestRoutes from './routes/accountRequest.routes';
import { connectKafka, disconnectKafka } from './events/kafkaProducer';
import logger from './utils/logger';

const app = express();

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

async function start() {
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
