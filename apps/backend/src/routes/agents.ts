import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { orchestrator, taskQueue, messageBus } from '@agentic/orchestrator';
import { AgentTask } from '@agentic/orchestrator';
import { decisionEngine } from '@agentic/analytics';
import { longTermMemory } from '@agentic/memory';
import { agentTaskSchema } from '@agentic/utils';
import { metricsEngine } from '@agentic/analytics';
import { Tenant } from '../models/index.js';

/** Store intelligence expects `payload.store`; dashboard dispatch often omits it — load from Tenant. */
async function ensureAgentPayload(
  tenantId: string,
  agentType: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (agentType !== 'store_intelligence') return payload;
  const store = payload.store;
  if (store && typeof store === 'object' && !Array.isArray(store)) return payload;
  const tenant = await Tenant.findById(tenantId).lean();
  const fallback = {
    name: 'Unknown',
    description: '',
    categories: [] as string[],
  };
  if (!tenant) {
    return { ...payload, store: fallback };
  }
  return {
    ...payload,
    store: {
      name: tenant.name,
      description: tenant.description ?? '',
      categories: [],
    },
  };
}

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  // Dispatch agent task
  app.post('/:tenantId/dispatch', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = agentTaskSchema.parse(request.body);
    const payload = await ensureAgentPayload(tenantId, body.agentType, body.payload);

    const taskId = await orchestrator.dispatch(tenantId, body.agentType, payload, body.priority);
    return reply.code(202).send({ taskId, message: 'Task dispatched' });
  });

  // Run agent immediately (sync)
  app.post('/:tenantId/run', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = agentTaskSchema.parse(request.body);
    const payload = await ensureAgentPayload(tenantId, body.agentType, body.payload);

    const result = await orchestrator.runImmediate(tenantId, body.agentType, payload);
    return { result };
  });

  // Get task status
  app.get('/:tenantId/tasks/:taskId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { taskId } = request.params as { tenantId: string; taskId: string };
    const task = await AgentTask.findById(taskId);
    if (!task) return reply.code(404).send({ error: 'Task not found' });
    return { task };
  });

  // List tenant tasks
  app.get('/:tenantId/tasks', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { limit = 50, status } = request.query as { limit?: number; status?: string };

    const filter: Record<string, unknown> = { tenantId };
    if (status) filter.status = status;

    const tasks = await AgentTask.find(filter).sort({ createdAt: -1 }).limit(+limit);
    return { tasks };
  });

  // Cancel task
  app.delete('/:tenantId/tasks/:taskId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, taskId } = request.params as { tenantId: string; taskId: string };
    const task = await AgentTask.findOne({ _id: taskId, tenantId });
    if (!task) return reply.code(404).send({ error: 'Task not found' });

    await taskQueue.cancel(taskId);
    return { message: 'Task cancelled' };
  });

  // Get AI store recommendations
  app.get('/:tenantId/recommendations', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const recommendations = await decisionEngine.analyzeStore(tenantId);
    return { recommendations };
  });

  // Get AI insights (combined)
  app.get('/:tenantId/insights', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };

    const [metrics, storeContext, recommendations, learnings] = await Promise.all([
      metricsEngine.getSummary(tenantId, 'week'),
      longTermMemory.getStoreContext(tenantId),
      decisionEngine.analyzeStore(tenantId),
      Promise.all([
        longTermMemory.getAgentLearnings(tenantId, 'growth_optimization'),
        longTermMemory.getAgentLearnings(tenantId, 'marketing'),
        longTermMemory.getAgentLearnings(tenantId, 'store_intelligence'),
      ]),
    ]);

    return {
      metrics,
      storeStrategy: storeContext.strategy ?? null,
      recommendations,
      agentHistory: {
        growth: learnings[0].slice(0, 5),
        marketing: learnings[1].slice(0, 5),
        intelligence: learnings[2].slice(0, 5),
      },
      orchestratorStats: orchestrator.getStats(),
    };
  });

  // Get message bus history
  app.get('/:tenantId/messages', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { limit = 20 } = request.query as { limit?: number };
    const messages = messageBus.getHistory(tenantId, +limit);
    return { messages };
  });

  // Run growth analysis
  app.post('/:tenantId/growth-analysis', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const metrics = await metricsEngine.getSummary(tenantId, 'month');

    const taskId = await orchestrator.dispatch(tenantId, 'growth_optimization', {
      action: 'full_analysis',
      metrics,
    }, 7);

    return reply.code(202).send({ taskId, message: 'Growth analysis started' });
  });

  // Customer support query
  app.post('/:tenantId/support', async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { query, customerId, orderContext } = request.body as {
      query: string;
      customerId?: string;
      orderContext?: Record<string, unknown>;
    };

    const result = await orchestrator.runImmediate(tenantId, 'customer_support', {
      action: 'handle_query',
      query,
      customerId,
      orderContext: orderContext ?? {},
    });

    return { response: result };
  });

  // Orchestrator stats
  app.get('/system/stats', { preHandler: [authenticate] }, async () => {
    const stats = orchestrator.getStats();
    const [queueDepth, runningCount] = await Promise.all([
      taskQueue.getQueueDepth(),
      taskQueue.getRunningCount(),
    ]);

    return { ...stats, queueDepth, runningCount };
  });
}
