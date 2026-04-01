import './load-env.js';
import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import mongoose from 'mongoose';
import { createLogger } from '@agentic/utils';
import { orchestrator } from '@agentic/orchestrator';
import { authRoutes } from './routes/auth.js';
import { storeRoutes } from './routes/stores.js';
import { productRoutes } from './routes/products.js';
import { orderRoutes } from './routes/orders.js';
import { agentRoutes } from './routes/agents.js';
import { analyticsRoutes } from './routes/analytics.js';
import { customerRoutes } from './routes/customers.js';
import { paymentRoutes } from './routes/payments.js';
import { Product } from './models/index.js';
import { createCorsOriginCallback } from './lib/cors-origin.js';

const logger = createLogger('server');
const isProduction = process.env.NODE_ENV === 'production';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
  trustProxy: true,
});

// ─── Plugins ───────────────────────────────────────────────────────
await app.register(fastifyHelmet, { contentSecurityPolicy: false });

const corsFallback =
  process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
const corsOrigins =
  corsFallback.length > 0
    ? corsFallback
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

await app.register(fastifyCors, {
  origin: createCorsOriginCallback(corsOrigins.join(','), process.env.APP_DOMAIN),
  credentials: true,
});

await app.register(fastifyRateLimit, {
  max: 200,
  timeWindow: '1 minute',
  keyGenerator: (request) =>
    (request.headers['x-tenant-id'] as string) ?? request.ip,
});

await app.register(fastifyJWT, {
  secret: process.env.JWT_SECRET ?? 'supersecretjwtkey_change_in_production_please',
  // Long-lived until explicit logout (client clears token). Override with JWT_EXPIRES_IN.
  sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '10y' },
});

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

await app.register(fastifyMultipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
  decorateReply: false,
});

// ─── Error Handler ─────────────────────────────────────────────────
app.setErrorHandler((error, request, reply) => {
  logger.error('Request error', {
    url: request.url,
    method: request.method,
    error: error.message,
    code: (error as { code?: string }).code,
  });

  if (error.name === 'ZodError') {
    return reply.code(400).send({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: (error as { issues?: unknown }).issues,
    });
  }

  const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  const exposeMessage = !isProduction || statusCode < 500;
  return reply.code(statusCode).send({
    error: exposeMessage ? error.message : 'Internal Server Error',
    code: (error as { code?: string }).code ?? 'INTERNAL_ERROR',
  });
});

// ─── Root (browser / curl http://localhost:4000/) ──────────────────
app.get('/', async () => ({
  name: 'agentic-ecommerce-api',
  health: '/health',
  api: '/api/v1',
}));

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  orchestrator: orchestrator.getStats(),
}));

app.get('/ping', async () => ({ pong: true }));

// ─── Routes ────────────────────────────────────────────────────────
await app.register(authRoutes, { prefix: '/api/v1/auth' });
await app.register(storeRoutes, { prefix: '/api/v1/stores' });
await app.register(productRoutes, { prefix: '/api/v1/products' });
await app.register(orderRoutes, { prefix: '/api/v1/orders' });
await app.register(agentRoutes, { prefix: '/api/v1/agents' });
await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
await app.register(customerRoutes, { prefix: '/api/v1/customers' });
await app.register(paymentRoutes, { prefix: '/api/v1/payments' });

// ─── Startup ───────────────────────────────────────────────────────
async function start(): Promise<void> {
  try {
    if (isProduction) {
      const jwt = process.env.JWT_SECRET ?? '';
      if (jwt.length < 32) {
        logger.warn(
          'JWT_SECRET is missing or shorter than 32 characters — set a strong secret in production',
        );
      }
    }

    const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/agentic_ecommerce';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

    try {
      await Product.syncIndexes();
      logger.info('Product collection indexes synced');
    } catch (err) {
      logger.warn('Product.syncIndexes failed (non-fatal)', { err });
    }

    orchestrator.start(2000);
    logger.info('Agent orchestrator started');

    // Prefer API_PORT: many hosts set PORT to the public web port (e.g. 3000 for Next), which would
    // collide with the API when both run in one process tree. Heroku-style single-API deploys still work via PORT.
    const port = parseInt(
      process.env.API_PORT ?? process.env.BACKEND_PORT ?? process.env.PORT ?? '4000',
      10,
    );
    const host = process.env.HOST ?? '0.0.0.0';

    await app.listen({ port, host });
    logger.info('Server started', { port, host, env: process.env.NODE_ENV });
  } catch (err) {
    logger.error('Startup failed', { err });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  orchestrator.stop();
  await mongoose.disconnect();
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  orchestrator.stop();
  await mongoose.disconnect();
  await app.close();
  process.exit(0);
});

await start();
