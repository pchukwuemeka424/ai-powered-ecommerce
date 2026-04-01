import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Product } from '../models/index.js';
import { productSchema } from '@agentic/utils';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { tracker } from '@agentic/analytics';
import { orchestrator } from '@agentic/orchestrator';

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  search: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'name']).default('newest'),
  /** Storefront: only featured or only new arrivals; omit for full catalog */
  highlight: z.enum(['featured', 'new']).optional(),
});

export async function productRoutes(app: FastifyInstance): Promise<void> {
  // Public: list store products
  app.get('/public/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const query = productQuerySchema.parse(request.query);

    const { Tenant } = await import('../models/index.js');
    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });

    const filter: Record<string, unknown> = { tenantId: tenant.id, status: 'active' };
    if (query.category) filter.category = query.category;
    if (query.highlight === 'featured') filter.isFeatured = true;
    if (query.highlight === 'new') filter.isNewArrival = true;
    if (query.search) filter.$text = { $search: query.search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[query.sort])
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  });

  // Public: get single product
  app.get('/public/:subdomain/:productId', async (request, reply) => {
    const { subdomain, productId } = request.params as { subdomain: string; productId: string };
    const { Tenant } = await import('../models/index.js');
    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });

    const product = await Product.findOne({ _id: productId, tenantId: tenant.id, status: 'active' });
    if (!product) return reply.code(404).send({ error: 'Product not found' });

    const sessionId = (request.headers['x-session-id'] as string) || undefined;
    await tracker.trackProductView(tenant.id as string, productId, sessionId);

    return { product };
  });

  // Distinct categories (must be registered before GET /:tenantId)
  app.get('/:tenantId/categories', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const categories = await Product.distinct('category', {
      tenantId,
      status: { $in: ['active', 'draft'] },
    });
    const cleaned = categories
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return { categories: cleaned };
  });

  // Auth: list tenant products
  app.get('/:tenantId', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const query = productQuerySchema.parse(request.query);

    const filter: Record<string, unknown> = { tenantId };
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[query.sort])
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  });

  // Create product
  app.post('/:tenantId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = productSchema.parse(request.body);

    const product = await Product.create({ ...body, tenantId });
    return reply.code(201).send({ product });
  });

  // Update product
  app.patch('/:tenantId/:productId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, productId } = request.params as { tenantId: string; productId: string };
    const body = productSchema.partial().parse(request.body);

    const product = await Product.findOneAndUpdate({ _id: productId, tenantId }, body, { new: true });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return { product };
  });

  // Delete product
  app.delete('/:tenantId/:productId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, productId } = request.params as { tenantId: string; productId: string };
    const product = await Product.findOneAndUpdate({ _id: productId, tenantId }, { status: 'archived' }, { new: true });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return { message: 'Product archived' };
  });

  // AI generate products
  app.post('/:tenantId/ai-generate', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const { count = 5 } = request.body as { count?: number };

    const taskId = await orchestrator.dispatch(tenantId, 'product_intelligence', {
      action: 'generate',
      count,
      autoCreate: true,
      tenantId,
    }, 7);

    return reply.code(202).send({ message: 'AI product generation started', taskId });
  });

  // Optimize pricing
  app.post('/:tenantId/optimize-pricing', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const products = await Product.find({ tenantId, status: 'active' }, 'id name price category');

    const taskId = await orchestrator.dispatch(tenantId, 'product_intelligence', {
      action: 'optimize_pricing',
      products: products.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
    }, 5);

    return reply.code(202).send({ message: 'Pricing optimization started', taskId });
  });
}
