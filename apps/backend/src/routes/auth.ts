import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from '@agentic/utils';
import { User, Tenant } from '../models/index.js';
import { orchestrator } from '@agentic/orchestrator';
import { authenticate } from '../plugins/auth.js';
import { formatStoreSummary, normalizeEmail, normalizeSubdomain } from '../lib/auth-helpers.js';
import { buildInitialTenantSettings, STORE_TEMPLATE_IDS } from '@agentic/templates';

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (request, reply) => {
    const raw = request.body as Record<string, unknown>;
    const coerced = {
      email: typeof raw.email === 'string' ? normalizeEmail(raw.email) : raw.email,
      password: raw.password,
      name: typeof raw.name === 'string' ? raw.name.trim() : raw.name,
      storeName: typeof raw.storeName === 'string' ? raw.storeName.trim() : raw.storeName,
      subdomain: typeof raw.subdomain === 'string' ? normalizeSubdomain(raw.subdomain) : raw.subdomain,
      storeTemplate:
        typeof raw.storeTemplate === 'string' ? raw.storeTemplate.trim().toLowerCase() : undefined,
    };

    const parsed = registerSchema.safeParse(coerced);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const body = parsed.data;
    const email = body.email;
    const subdomain = body.subdomain;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const existingStore = await Tenant.findOne({ subdomain });
    if (existingStore) {
      return reply.code(409).send({ error: 'Subdomain already taken' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const name = body.name;
    const storeName = body.storeName;

    if (body.storeTemplate != null && !STORE_TEMPLATE_IDS.includes(body.storeTemplate)) {
      return reply.code(400).send({ error: 'Invalid store template', validTemplates: STORE_TEMPLATE_IDS });
    }
    const templateId =
      body.storeTemplate && STORE_TEMPLATE_IDS.includes(body.storeTemplate) ? body.storeTemplate : 'minimal';

    const initialSettings = buildInitialTenantSettings(storeName, templateId);

    let user: InstanceType<typeof User>;
    let tenant: InstanceType<typeof Tenant>;

    try {
      user = await User.create({
        email,
        name,
        passwordHash,
        role: 'owner',
        tenantIds: [],
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return reply.code(409).send({ error: 'Email already registered' });
      }
      throw err;
    }

    try {
      tenant = await Tenant.create({
        subdomain,
        name: storeName,
        description: '',
        ownerId: user.id,
        status: 'active',
        settings: initialSettings,
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      if (isDuplicateKeyError(err)) {
        return reply.code(409).send({ error: 'Subdomain already taken' });
      }
      throw err;
    }

    try {
      user.tenantIds = [String(tenant._id)];
      await user.save();
    } catch (err) {
      await Tenant.deleteOne({ _id: tenant._id });
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    const tenantId = String(tenant._id);

    orchestrator
      .dispatch(tenantId, 'store_intelligence', {
        action: 'analyze',
        store: { name: tenant.name, description: tenant.description ?? '' },
      }, 8)
      .catch(() => {});

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantIds: user.tenantIds,
    });

    return reply.code(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      store: {
        id: tenantId,
        subdomain: tenant.subdomain,
        name: tenant.name,
        status: tenant.status,
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const email = normalizeEmail(body.email);

    const user = await User.findOne({ email });
    if (!user?.passwordHash) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const tenantIds = (user.tenantIds ?? []).map((id) => String(id));
    const storesRaw = await Tenant.find({ _id: { $in: tenantIds } })
      .select('_id subdomain name status')
      .lean();

    const stores = storesRaw.map((t) => formatStoreSummary(t));

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantIds,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      stores,
    });
  });

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await User.findById(request.user.userId).select('-passwordHash').lean();
    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    const tenantIds = (user.tenantIds ?? []).map((id) => String(id));
    const storesRaw = await Tenant.find({ _id: { $in: tenantIds } })
      .select('_id subdomain name status')
      .lean();

    const stores = storesRaw.map((t) => formatStoreSummary(t));

    return {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        tenantIds,
      },
      stores,
    };
  });
}
