import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Order, Product, Customer } from '../models/index.js';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { tracker } from '@agentic/analytics';
import { longTermMemory } from '@agentic/memory';
import { persistTenantUpload } from '../lib/store-upload.js';

function generateOrderNumber(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  shippingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().min(1),
  }),
  notes: z.string().max(500).optional(),
  paymentMethod: z.string().optional(),
});

const SLIP_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'refunded']).optional(),
  delivery: z.object({
    logisticsName: z.string().min(1),
    contactName: z.string().min(1),
    contactPhone: z.string().min(1),
  }).optional(),
});

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // Public: create order for a store
  app.post('/public/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const body = createOrderSchema.parse(request.body);

    const { Tenant } = await import('../models/index.js');
    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });

    const tenantId = tenant.id as string;

    const productIds = body.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, tenantId, status: 'active' });

    const productMap = new Map(products.map((p) => [p.id as string, p]));
    const orderItems = [];
    let subtotal = 0;

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return reply.code(400).send({ error: `Product ${item.productId} not available` });
      }
      if (product.inventory < item.quantity) {
        return reply.code(400).send({ error: `Insufficient inventory for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      tenantId,
      orderNumber,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      items: orderItems,
      subtotal,
      total: subtotal,
      shippingAddress: body.shippingAddress,
      notes: body.notes,
      paymentMethod: body.paymentMethod,
    });

    // Decrement inventory
    await Promise.all(
      body.items.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { inventory: -item.quantity } })
      )
    );

    // Upsert customer
    await Customer.findOneAndUpdate(
      { tenantId, email: body.customerEmail },
      {
        $set: { name: body.customerName },
        $inc: { totalOrders: 1, totalSpent: subtotal },
      },
      { upsert: true }
    );

    await tracker.trackOrderPlaced(tenantId, order.id as string, undefined, { total: subtotal });

    // Store product performance
    for (const item of orderItems) {
      await longTermMemory.merge(tenantId, 'product_performance', item.productId, {
        sales: 1,
        revenue: item.total,
      });
    }

    return reply.code(201).send({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      message: 'Order placed successfully',
    });
  });

  // Public: upload proof-of-payment slip for manual transfer
  app.post('/public/:subdomain/:orderId/payment-slip', async (request, reply) => {
    const { subdomain, orderId } = request.params as { subdomain: string; orderId: string };
    const { Tenant } = await import('../models/index.js');
    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });

    const tenantId = tenant.id as string;
    const order = await Order.findOne({ _id: orderId, tenantId });
    if (!order) return reply.code(404).send({ error: 'Order not found' });

    const file = await request.file();
    if (!file) return reply.code(400).send({ error: 'No file uploaded' });
    if (!SLIP_UPLOAD_MIME.has(file.mimetype)) {
      return reply.code(400).send({ error: 'Only image or PDF slips are allowed' });
    }

    const uploaded = await persistTenantUpload(tenantId, file);
    const slipUrl = uploaded.path || uploaded.url;
    const existingNotes = order.notes?.trim();
    const proofLine = `Payment proof: ${slipUrl}`;
    order.notes = existingNotes ? `${existingNotes}\n${proofLine}` : proofLine;
    if (!order.paymentMethod) order.paymentMethod = 'bank_transfer';
    if (order.paymentStatus === 'unpaid') order.paymentStatus = 'pending';
    await order.save();

    return { slipUrl, order: { id: order.id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus } };
  });

  // Auth: list tenant orders
  app.get('/:tenantId', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { page = 1, limit = 20, status, paymentStatus } = request.query as {
      page?: number; limit?: number; status?: string; paymentStatus?: string;
    };

    const filter: Record<string, unknown> = { tenantId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
      Order.countDocuments(filter),
    ]);

    return { orders, pagination: { page: +page, limit: +limit, total } };
  });

  // Auth: get single order
  app.get('/:tenantId/:orderId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, orderId } = request.params as { tenantId: string; orderId: string };
    const order = await Order.findOne({ _id: orderId, tenantId });
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    return { order };
  });

  // Auth: update order status
  app.patch('/:tenantId/:orderId/status', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId, orderId } = request.params as { tenantId: string; orderId: string };
    const body = updateOrderStatusSchema.parse(request.body);

    const order = await Order.findOne({ _id: orderId, tenantId });
    if (!order) return reply.code(404).send({ error: 'Order not found' });

    if (body.status) {
      if (body.status === 'delivered') {
        const d = body.delivery ?? order.delivery;
        if (!d?.logisticsName || !d?.contactName || !d?.contactPhone) {
          return reply.code(400).send({
            error: 'Delivery details required: logisticsName, contactName, contactPhone',
          });
        }
        order.delivery = {
          logisticsName: d.logisticsName,
          contactName: d.contactName,
          contactPhone: d.contactPhone,
          deliveredAt: new Date(),
        };
      } else if (body.delivery) {
        order.delivery = {
          logisticsName: body.delivery.logisticsName,
          contactName: body.delivery.contactName,
          contactPhone: body.delivery.contactPhone,
          deliveredAt: order.delivery?.deliveredAt,
        };
      }
      order.status = body.status;
    }

    if (body.paymentStatus) {
      order.paymentStatus = body.paymentStatus;
      if (body.paymentStatus === 'paid') {
        await tracker.trackOrderPaid(tenantId, orderId, order.total);
      }
    }

    await order.save();
    return { order };
  });

  // Auth: get revenue stats
  app.get('/:tenantId/stats/revenue', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { days = 30 } = request.query as { days?: number };

    const from = new Date();
    from.setDate(from.getDate() - +days);

    const result = await Order.aggregate([
      { $match: { tenantId, paymentStatus: 'paid', createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return { revenueByDay: result };
  });
}
