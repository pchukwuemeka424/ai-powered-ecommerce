import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { Order, Tenant } from '../models/index.js';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { tracker } from '@agentic/analytics';
import { createLogger } from '@agentic/utils';

const logger = createLogger('payments');

const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackRequest(
  path: string,
  secretKey: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<{ status: boolean; message: string; data: Record<string, unknown> }>;
}

function getPaystackKeys(tenant: InstanceType<typeof Tenant>): { publicKey: string; secretKey: string } | null {
  const methods = tenant.settings?.payment?.methods ?? [];
  const ps = methods.find((m: { type: string }) => m.type === 'paystack');
  if (!ps?.config) return null;
  const cfg = ps.config as Record<string, string>;
  if (!cfg.secretKey || !cfg.publicKey) return null;
  return { publicKey: cfg.publicKey, secretKey: cfg.secretKey };
}

function getPublicPaymentMethods(tenant: InstanceType<typeof Tenant>) {
  const methods = tenant.settings?.payment?.methods ?? [];
  return methods
    .filter((m: { enabled?: boolean }) => Boolean(m.enabled))
    .map((m: { type: string; config?: Record<string, string> }) => {
      if (m.type === 'bank_transfer') {
        return {
          type: m.type,
          enabled: true,
          config: {
            bankName: m.config?.bankName ?? '',
            accountName: m.config?.accountName ?? '',
            accountNumber: m.config?.accountNumber ?? '',
            instructions: m.config?.instructions ?? '',
          },
        };
      }
      if (m.type === 'paystack') {
        return { type: m.type, enabled: true, config: {} };
      }
      return { type: m.type, enabled: true, config: {} };
    });
}

const initPaymentSchema = z.object({
  orderId: z.string(),
  callbackUrl: z.string().url().optional(),
});

const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // ─── Public: active checkout payment methods ───
  app.get('/public/:subdomain/methods', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });
    return { methods: getPublicPaymentMethods(tenant) };
  });

  // ─── Initialize Paystack payment for an order ───
  app.post(
    '/:tenantId/paystack/initialize',
    { preHandler: [authenticate, authorizeForTenant] },
    async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      const body = initPaymentSchema.parse(request.body);

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) return reply.code(404).send({ error: 'Store not found' });

      const keys = getPaystackKeys(tenant);
      if (!keys) return reply.code(400).send({ error: 'Paystack not configured for this store' });

      const order = await Order.findOne({ _id: body.orderId, tenantId });
      if (!order) return reply.code(404).send({ error: 'Order not found' });
      if (order.paymentStatus === 'paid') return reply.code(400).send({ error: 'Order already paid' });

      const reference = `PS-${order.orderNumber}-${Date.now().toString(36)}`;

      const result = await paystackRequest('/transaction/initialize', keys.secretKey, 'POST', {
        email: order.customerEmail,
        amount: Math.round(order.total * 100),
        currency: tenant.settings?.currency ?? 'NGN',
        reference,
        callback_url: body.callbackUrl,
        metadata: {
          tenantId,
          orderId: order.id as string,
          orderNumber: order.orderNumber,
        },
      });

      if (!result.status) {
        logger.error('Paystack init failed', { tenantId, message: result.message });
        return reply.code(502).send({ error: 'Payment gateway error', message: result.message });
      }

      order.paymentMethod = 'paystack';
      order.paymentStatus = 'pending';
      await order.save();

      return {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference ?? reference,
      };
    }
  );

  // ─── Verify Paystack payment ───
  app.post(
    '/:tenantId/paystack/verify',
    { preHandler: [authenticate, authorizeForTenant] },
    async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      const body = verifyPaymentSchema.parse(request.body);

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) return reply.code(404).send({ error: 'Store not found' });

      const keys = getPaystackKeys(tenant);
      if (!keys) return reply.code(400).send({ error: 'Paystack not configured' });

      const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(body.reference)}`, keys.secretKey);

      if (!result.status) {
        return reply.code(400).send({ error: 'Verification failed', message: result.message });
      }

      const txData = result.data;
      const meta = (txData.metadata ?? {}) as Record<string, unknown>;
      const orderId = meta.orderId as string | undefined;

      if (!orderId) return reply.code(400).send({ error: 'No order linked to this transaction' });

      const order = await Order.findOne({ _id: orderId, tenantId });
      if (!order) return reply.code(404).send({ error: 'Order not found' });

      if (txData.status === 'success') {
        order.paymentStatus = 'paid';
        await order.save();
        await tracker.trackOrderPaid(tenantId, orderId, order.total);
        logger.info('Paystack payment verified', { tenantId, orderId, reference: body.reference });
      } else {
        order.paymentStatus = 'unpaid';
        await order.save();
      }

      return {
        verified: txData.status === 'success',
        status: txData.status,
        amount: txData.amount,
        reference: txData.reference,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
        },
      };
    }
  );

  // ─── Paystack webhook (no auth — validated via signature) ───
  app.post('/:tenantId/paystack/webhook', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return reply.code(200).send({ received: true });

    const keys = getPaystackKeys(tenant);
    if (!keys) return reply.code(200).send({ received: true });

    const signature = request.headers['x-paystack-signature'] as string | undefined;
    const rawBody = JSON.stringify(request.body);
    const hash = crypto.createHmac('sha512', keys.secretKey).update(rawBody).digest('hex');

    if (signature !== hash) {
      logger.warn('Paystack webhook signature mismatch', { tenantId });
      return reply.code(200).send({ received: true });
    }

    const event = request.body as { event: string; data: Record<string, unknown> };

    if (event.event === 'charge.success') {
      const meta = (event.data.metadata ?? {}) as Record<string, unknown>;
      const orderId = meta.orderId as string | undefined;
      if (orderId) {
        const order = await Order.findOne({ _id: orderId, tenantId });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'paystack';
          await order.save();
          await tracker.trackOrderPaid(tenantId, orderId, order.total);
          logger.info('Paystack webhook: order paid', { tenantId, orderId });
        }
      }
    }

    return reply.code(200).send({ received: true });
  });

  // ─── Confirm manual bank transfer ───
  app.post(
    '/:tenantId/bank-transfer/confirm',
    { preHandler: [authenticate, authorizeForTenant] },
    async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      const { orderId } = z.object({ orderId: z.string() }).parse(request.body);

      const order = await Order.findOne({ _id: orderId, tenantId });
      if (!order) return reply.code(404).send({ error: 'Order not found' });

      order.paymentStatus = 'paid';
      order.paymentMethod = 'bank_transfer';
      await order.save();

      await tracker.trackOrderPaid(tenantId, orderId, order.total);
      logger.info('Bank transfer confirmed', { tenantId, orderId });

      return { order: { id: order.id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus } };
    }
  );

  // ─── Verify Paystack API key (test connection) ───
  app.post(
    '/:tenantId/paystack/test',
    { preHandler: [authenticate, authorizeForTenant] },
    async (request, reply) => {
      const { secretKey } = z.object({ secretKey: z.string().min(1) }).parse(request.body);

      try {
        const result = await paystackRequest('/balance', secretKey);
        if (!result.status) {
          return reply.code(400).send({ valid: false, message: result.message });
        }
        return { valid: true, message: 'API key verified' };
      } catch {
        return reply.code(400).send({ valid: false, message: 'Could not reach Paystack' });
      }
    }
  );

  // ─── Public: initialize payment for storefront checkout ───
  app.post('/public/:subdomain/initialize', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const body = initPaymentSchema.parse(request.body);

    const tenant = await Tenant.findOne({ subdomain, status: 'active' });
    if (!tenant) return reply.code(404).send({ error: 'Store not found' });

    const tenantId = tenant.id as string;
    const keys = getPaystackKeys(tenant);
    if (!keys) return reply.code(400).send({ error: 'Online payment not available for this store' });

    const order = await Order.findOne({ _id: body.orderId, tenantId });
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') return reply.code(400).send({ error: 'Order already paid' });

    const reference = `PS-${order.orderNumber}-${Date.now().toString(36)}`;

    const result = await paystackRequest('/transaction/initialize', keys.secretKey, 'POST', {
      email: order.customerEmail,
      amount: Math.round(order.total * 100),
      currency: tenant.settings?.currency ?? 'NGN',
      reference,
      callback_url: body.callbackUrl,
      metadata: { tenantId, orderId: order.id as string, orderNumber: order.orderNumber },
    });

    if (!result.status) {
      return reply.code(502).send({ error: 'Payment gateway error' });
    }

    order.paymentMethod = 'paystack';
    order.paymentStatus = 'pending';
    await order.save();

    return {
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference ?? reference,
    };
  });
}
