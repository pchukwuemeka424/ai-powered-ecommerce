import type { FastifyInstance } from 'fastify';
import { Customer } from '../models/index.js';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/:tenantId', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { page = 1, limit = 20, search } = request.query as { page?: number; limit?: number; search?: string };

    const filter: Record<string, unknown> = { tenantId };
    if (search) filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ totalSpent: -1 }).skip((+page - 1) * +limit).limit(+limit),
      Customer.countDocuments(filter),
    ]);

    return { customers, pagination: { page: +page, limit: +limit, total } };
  });

  app.get('/:tenantId/:customerId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, customerId } = request.params as { tenantId: string; customerId: string };
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) return reply.code(404).send({ error: 'Customer not found' });
    return { customer };
  });

  app.get('/:tenantId/stats/overview', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };

    const [total, newThisWeek, topCustomers] = await Promise.all([
      Customer.countDocuments({ tenantId }),
      Customer.countDocuments({ tenantId, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Customer.find({ tenantId }).sort({ totalSpent: -1 }).limit(5),
    ]);

    return { total, newThisWeek, topCustomers };
  });
}
