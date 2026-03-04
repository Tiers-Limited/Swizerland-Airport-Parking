import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config';
import routes from './routes';
import webhookRoutes from './routes/webhook.routes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware';
import {
  requestId,
  requestLogger,
  defaultRateLimiter,
} from './middleware/rateLimit.middleware';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  
  // CORS
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // ── Stripe Webhook Route ─────────────────────────────────────────
  // MUST be registered before express.json() so the raw Buffer body is
  // available for Stripe's signature verification (constructEvent).
  app.use(
    `/api/${config.apiVersion}/webhooks`,
    express.raw({ type: 'application/json' }),
    webhookRoutes,
  );

  // Request parsing (all other routes get parsed JSON)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Request ID and logging
  app.use(requestId);
  app.use(requestLogger);

  // Rate limiting
  app.use(defaultRateLimiter);

  // API routes
  app.use(`/api/${config.apiVersion}`, routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Airport Parking API',
      version: config.apiVersion,
      documentation: `/api/${config.apiVersion}/docs`,
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
