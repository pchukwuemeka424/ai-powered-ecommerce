import { z } from 'zod';

export const subdomainSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid subdomain format');

export const emailSchema = z.string().email();

export const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).max(10),
  category: z.string().min(1),
  tags: z.array(z.string()).max(20),
  inventory: z.number().int().min(0),
  status: z.enum(['active', 'draft', 'archived']),
  isNewArrival: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
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

export const customerSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  storeName: z.string().min(3).max(100),
  subdomain: subdomainSchema,
  /** Storefront layout template id (e.g. minimal, bold). Validated server-side. */
  storeTemplate: z.string().min(1).max(32).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const paymentMethodSchema = z.object({
  type: z.enum(['bank_transfer', 'paystack']),
  enabled: z.boolean(),
  config: z.record(z.string()).default({}),
});

export const storeSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  currency: z.string().length(3).optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    fontFamily: z.string().optional(),
    template: z.string().optional(),
  }).optional(),
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).max(20).optional(),
  }).optional(),
  payment: z.object({
    methods: z.array(paymentMethodSchema).optional(),
  }).optional(),
  site: z.object({
    logoUrl: z.string().max(2048).optional(),
    menuCategories: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          category: z.string().min(1).max(120),
        })
      )
      .max(12)
      .optional(),
    hero: z
      .object({
        headline: z.string().max(120).optional(),
        subheadline: z.string().max(280).optional(),
        alignment: z.enum(['left', 'center', 'right']).optional(),
        imageUrl: z.string().max(2048).optional(),
        ctaText: z.string().max(40).optional(),
        ctaHref: z.string().max(500).optional(),
      })
      .optional(),
    banner: z
      .object({
        imageUrl: z.string().max(2048).optional(),
        linkUrl: z.string().max(2048).optional(),
        alt: z.string().max(160).optional(),
      })
      .optional(),
    /** Storefront products: breadcrumb bar colors (solid — no gradients) */
    breadcrumb: z
      .object({
        mode: z.enum(['auto', 'nav', 'body', 'primary', 'custom']).optional(),
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        link: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        separator: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        current: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      })
      .optional(),
  }).optional(),
});

export const agentTaskSchema = z.object({
  agentType: z.enum([
    'store_intelligence',
    'product_intelligence',
    'marketing',
    'customer_support',
    'growth_optimization',
  ]),
  payload: z.record(z.unknown()),
  priority: z.number().int().min(1).max(10).default(5),
});
