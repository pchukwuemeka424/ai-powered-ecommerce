import type { FastifyInstance } from 'fastify';
import { Tenant } from '../models/index.js';
import { storeSettingsSchema } from '@agentic/utils';
import { authenticate, authorizeForTenant } from '../plugins/auth.js';
import { getTemplate, DEFAULT_TEMPLATES } from '@agentic/templates';
import { longTermMemory } from '@agentic/memory';
import { metricsEngine } from '@agentic/analytics';
import { persistTenantUpload } from '../lib/store-upload.js';

const UPLOAD_MIME = new Set(['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif']);

/** Ensures theme.primaryColor is always a valid 6-digit hex for storefront clients (fixes stale/invalid DB values). */
function normalizePublicTheme(store: InstanceType<typeof Tenant>) {
  const templateId = store.settings?.theme?.template ?? 'minimal';
  const tmpl = getTemplate(templateId) ?? getTemplate('minimal')!;
  const preset = tmpl.themePreset ?? { primaryColor: '#111111', fontFamily: 'Inter' };
  const raw = (store.settings?.theme?.primaryColor ?? '').trim();
  let primaryColor = preset.primaryColor;
  if (/^#[0-9a-fA-F]{6}$/i.test(raw)) {
    primaryColor = raw.toLowerCase();
  } else if (/^#[0-9a-fA-F]{3}$/i.test(raw)) {
    const h = raw.slice(1);
    primaryColor = `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return {
    primaryColor,
    fontFamily: (store.settings?.theme?.fontFamily ?? '').trim() || preset.fontFamily,
    template: templateId,
  };
}

function serializeStoreWithNormalizedTheme(store: InstanceType<typeof Tenant>) {
  const plain = store.toObject();
  plain.settings = {
    ...(plain.settings ?? {}),
    theme: normalizePublicTheme(store),
  };
  return plain;
}

export async function storeRoutes(app: FastifyInstance): Promise<void> {
  // List user's stores
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const stores = await Tenant.find({ _id: { $in: request.user.tenantIds } });
    return { stores };
  });

  // Static paths must register before /:tenantId (otherwise "templates", "by-subdomain" match as ids)

  // Get store by subdomain (public)
  app.get('/by-subdomain/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const store = await Tenant.findOne({ subdomain, status: 'active' }, '-ownerId');
    if (!store) return reply.code(404).send({ error: 'Store not found' });

    const plain = serializeStoreWithNormalizedTheme(store);
    const template = getTemplate(plain.settings!.theme.template) ?? getTemplate('minimal')!;
    const storeContext = await longTermMemory.getStoreContext(store.id as string);

    return reply
      .header('Cache-Control', 'no-store, no-cache, must-revalidate')
      .header('Vary', 'Accept')
      .send({ store: plain, template, storeContext });
  });

  // Get templates (public — used at signup without auth)
  app.get('/templates/list', async () => {
    return {
      templates: DEFAULT_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        preview: t.preview,
        themePreset: t.themePreset ?? { primaryColor: '#111111', fontFamily: 'Inter' },
      })),
    };
  });

  // Get full template
  app.get('/templates/:templateId', async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const template = getTemplate(templateId);
    if (!template) return reply.code(404).send({ error: 'Template not found' });
    return { template };
  });

  /** Image upload for site logo / hero / banner (multipart field name: `file` only — same as hero). */
  app.post('/:tenantId/upload', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });
    if (!UPLOAD_MIME.has(data.mimetype)) {
      return reply.code(400).send({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' });
    }
    return persistTenantUpload(tenantId, data);
  });

  // Get store by ID
  app.get('/:tenantId', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const store = await Tenant.findById(tenantId);
    if (!store) return reply.code(404).send({ error: 'Store not found' });
    return { store: serializeStoreWithNormalizedTheme(store) };
  });

  // Update store settings
  app.patch('/:tenantId/settings', { preHandler: [authenticate, authorizeForTenant] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = storeSettingsSchema.parse(request.body);

    const store = await Tenant.findById(tenantId);
    if (!store) return reply.code(404).send({ error: 'Store not found' });

    if (body.theme?.template != null && body.theme.template !== '') {
      if (!getTemplate(body.theme.template)) {
        return reply.code(400).send({ error: 'Unknown storefront template' });
      }
    }

    if (body.name) store.name = body.name;
    if (body.description !== undefined) store.description = body.description;
    if (body.currency) store.settings.currency = body.currency;
    if (body.language) store.settings.language = body.language;
    if (body.timezone) store.settings.timezone = body.timezone;
    if (body.theme) {
      if (body.theme.primaryColor !== undefined) {
        const pc = body.theme.primaryColor.trim();
        store.settings.theme.primaryColor =
          /^#[0-9a-fA-F]{6}$/.test(pc) ? pc.toLowerCase() : body.theme.primaryColor;
      }
      if (body.theme.fontFamily !== undefined) {
        store.settings.theme.fontFamily = body.theme.fontFamily;
      }
      if (body.theme.template) {
        store.settings.theme.template = body.theme.template;
      }
      store.markModified('settings.theme');
    }
    if (body.seo) {
      if (body.seo.title) store.settings.seo.title = body.seo.title;
      if (body.seo.description) store.settings.seo.description = body.seo.description;
      if (body.seo.keywords) store.settings.seo.keywords = body.seo.keywords;
    }
    if (body.payment?.methods) {
      store.settings.payment.methods = body.payment.methods;
      store.markModified('settings.payment.methods');
    }

    if (body.site) {
      if (!store.settings.site) store.settings.site = {};
      const s = store.settings.site;
      if (body.site.logoUrl !== undefined) {
        s.logoUrl = body.site.logoUrl;
        store.logo = body.site.logoUrl.trim();
      }
      if (body.site.menuCategories !== undefined) s.menuCategories = body.site.menuCategories;
      if (body.site.hero) {
        s.hero = { ...(s.hero ?? {}), ...body.site.hero };
      }
      if (body.site.banner) {
        s.banner = { ...(s.banner ?? {}), ...body.site.banner };
      }
      if (body.site.breadcrumb !== undefined) {
        s.breadcrumb = { ...(s.breadcrumb ?? {}), ...body.site.breadcrumb };
      }
      store.markModified('settings.site');
    }

    await store.save();
    return { store: serializeStoreWithNormalizedTheme(store) };
  });

  // Get store analytics
  app.get('/:tenantId/analytics', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };
    const { period = 'week' } = request.query as { period?: 'day' | 'week' | 'month' };

    const [metrics, funnel] = await Promise.all([
      metricsEngine.getSummary(tenantId, period),
      metricsEngine.getConversionFunnel(tenantId),
    ]);

    return { metrics, funnel };
  });

  // Get store AI insights
  app.get('/:tenantId/insights', { preHandler: [authenticate, authorizeForTenant] }, async (request) => {
    const { tenantId } = request.params as { tenantId: string };

    const [storeContext, agentLearnings] = await Promise.all([
      longTermMemory.getStoreContext(tenantId),
      Promise.all([
        longTermMemory.getAgentLearnings(tenantId, 'store_intelligence'),
        longTermMemory.getAgentLearnings(tenantId, 'growth_optimization'),
        longTermMemory.getAgentLearnings(tenantId, 'marketing'),
      ]),
    ]);

    return {
      storeContext,
      learnings: {
        storeIntelligence: agentLearnings[0],
        growth: agentLearnings[1],
        marketing: agentLearnings[2],
      },
    };
  });
}
