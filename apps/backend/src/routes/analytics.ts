import type { FastifyInstance } from 'fastify';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { tracker, metricsEngine } from '@agentic/analytics';
import type { EventType } from '@agentic/utils';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  // Track event (public)
  app.post('/track', async (request, reply) => {
    const { tenantId, type, sessionId, productId, orderId, metadata } = request.body as {
      tenantId: string;
      type: EventType;
      sessionId?: string;
      productId?: string;
      orderId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!tenantId || !type) {
      return reply.code(400).send({ error: 'tenantId and type required' });
    }

    await tracker.track(tenantId, type, { sessionId, productId, orderId, metadata });
    return { ok: true };
  });

  // Get metrics summary
  app.get('/:tenantId/summary', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { period = 'week' } = request.query as { period?: 'day' | 'week' | 'month' };

    const metrics = await metricsEngine.getSummary(tenantId, period);
    return { metrics };
  });

  // Get conversion funnel
  app.get('/:tenantId/funnel', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { days = 7 } = request.query as { days?: number };

    const funnel = await metricsEngine.getConversionFunnel(tenantId, +days);
    return { funnel };
  });

  // Get product performance
  app.get('/:tenantId/products/:productId', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId, productId } = request.params as { tenantId: string; productId: string };
    const { days = 30 } = request.query as { days?: number };

    const performance = await metricsEngine.getProductPerformance(tenantId, productId, +days);
    return { performance };
  });

  // Overview for all periods
  app.get('/:tenantId/overview', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };

    const [day, week, month] = await Promise.all([
      metricsEngine.getSummary(tenantId, 'day'),
      metricsEngine.getSummary(tenantId, 'week'),
      metricsEngine.getSummary(tenantId, 'month'),
    ]);

    return { overview: { day, week, month } };
  });
}
