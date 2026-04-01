import type { StoreTemplate, TemplateSection } from '@agentic/utils';

export const DEFAULT_TEMPLATES: StoreTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free layout focused on products',
    preview: '/templates/minimal.png',
    themePreset: { primaryColor: '#111111', fontFamily: 'Inter' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Shop the Best Products',
            subtitle: 'Quality guaranteed, delivered fast',
            ctaText: 'Shop Now',
            ctaLink: '/products',
            style: 'centered',
          },
        },
        {
          id: 'featured_products',
          type: 'product_grid',
          visible: true,
          order: 1,
          config: {
            title: 'Featured Products',
            columns: 4,
            limit: 8,
            filter: 'featured',
          },
        },
        {
          id: 'banner_1',
          type: 'banner',
          visible: true,
          order: 2,
          config: {
            text: 'Free delivery on orders above ₦10,000',
            bgColor: '#f4f4f5',
            textColor: '#171717',
            dismissible: false,
          },
        },
        {
          id: 'all_products',
          type: 'product_grid',
          visible: true,
          order: 3,
          config: {
            title: 'All Products',
            columns: 3,
            limit: 12,
            filter: 'all',
            showFilters: true,
          },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: true,
          order: 4,
          config: {
            title: 'Stay Updated',
            subtitle: 'Get exclusive deals delivered to your inbox',
            placeholder: 'Enter your email',
            buttonText: 'Subscribe',
          },
        },
      ],
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-impact layout with strong visual hierarchy',
    preview: '/templates/bold.png',
    themePreset: { primaryColor: '#0a0a0a', fontFamily: 'Poppins' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Premium Quality Products',
            subtitle: 'Curated selections for discerning customers',
            ctaText: 'Explore Collection',
            ctaLink: '/products',
            style: 'full-bleed',
          },
        },
        {
          id: 'features',
          type: 'features',
          visible: true,
          order: 1,
          config: {
            items: [
              { icon: 'truck', title: 'Fast Delivery', description: 'Get your order in 2-5 days' },
              { icon: 'shield', title: 'Quality Assured', description: '100% authentic products' },
              { icon: 'refresh', title: 'Easy Returns', description: '7-day return policy' },
              { icon: 'headphones', title: '24/7 Support', description: 'Always here to help' },
            ],
          },
        },
        {
          id: 'product_grid',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: {
            title: 'New Arrivals',
            columns: 4,
            limit: 8,
            filter: 'newest',
          },
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          visible: true,
          order: 3,
          config: {
            title: 'What Customers Say',
            reviews: [],
          },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: false,
          order: 4,
          config: {},
        },
      ],
    },
  },
  {
    id: 'market',
    name: 'Market',
    description: 'Marketplace-style layout for stores with many products',
    preview: '/templates/market.png',
    themePreset: { primaryColor: '#1c1917', fontFamily: 'Roboto' },
    layout: {
      sections: [
        {
          id: 'banner_top',
          type: 'banner',
          visible: true,
          order: 0,
          config: {
            text: '🔥 Flash Sale: Up to 40% off selected items!',
            bgColor: '#e7e5e4',
            textColor: '#1c1917',
          },
        },
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 1,
          config: {
            title: 'Everything You Need',
            subtitle: 'Thousands of products, one store',
            style: 'compact',
          },
        },
        {
          id: 'categories',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: {
            title: 'Shop by Category',
            layout: 'categories',
            showCategories: true,
          },
        },
        {
          id: 'flash_deals',
          type: 'product_grid',
          visible: true,
          order: 3,
          config: {
            title: 'Flash Deals',
            columns: 4,
            limit: 4,
            filter: 'discount',
            showTimer: true,
          },
        },
        {
          id: 'all_products',
          type: 'product_grid',
          visible: true,
          order: 4,
          config: {
            title: 'All Products',
            columns: 4,
            limit: 20,
            filter: 'all',
            showFilters: true,
            showSort: true,
          },
        },
      ],
    },
  },
  {
    id: 'boutique',
    name: 'Boutique',
    description: 'Editorial hero and featured story—ideal for fashion, beauty, and craft brands',
    preview: '/templates/boutique.png',
    themePreset: { primaryColor: '#3d2b1f', fontFamily: 'Playfair Display' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Curated for you',
            subtitle: 'Limited pieces, timeless quality',
            ctaText: 'Shop collection',
            ctaLink: '/products',
            style: 'centered',
          },
        },
        {
          id: 'features',
          type: 'features',
          visible: true,
          order: 1,
          config: {
            items: [
              { icon: 'sparkles', title: 'Handpicked', description: 'Every item selected with care' },
              { icon: 'truck', title: 'Careful delivery', description: 'Packaged to arrive perfect' },
            ],
          },
        },
        {
          id: 'featured_products',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: {
            title: 'Featured',
            columns: 3,
            limit: 6,
            filter: 'featured',
          },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: true,
          order: 3,
          config: {
            title: 'Join the list',
            subtitle: 'New drops and private offers',
            placeholder: 'Your email',
            buttonText: 'Subscribe',
          },
        },
      ],
    },
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Bold hero, feature strip, and grid—great for electronics, design, and lifestyle',
    preview: '/templates/studio.png',
    themePreset: { primaryColor: '#2563eb', fontFamily: 'Poppins' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Design that performs',
            subtitle: 'Quality gear for everyday creators',
            ctaText: 'Browse products',
            ctaLink: '/products',
            style: 'full-bleed',
          },
        },
        {
          id: 'banner_1',
          type: 'banner',
          visible: true,
          order: 1,
          config: {
            text: 'Free shipping on orders over ₦15,000',
            bgColor: '#2563eb',
            textColor: '#ffffff',
            dismissible: false,
          },
        },
        {
          id: 'features',
          type: 'features',
          visible: true,
          order: 2,
          config: {
            items: [
              { icon: 'shield', title: 'Warranty', description: 'Genuine products' },
              { icon: 'headphones', title: 'Support', description: 'Help when you need it' },
            ],
          },
        },
        {
          id: 'all_products',
          type: 'product_grid',
          visible: true,
          order: 3,
          config: {
            title: 'All products',
            columns: 3,
            limit: 12,
            filter: 'all',
            showFilters: true,
          },
        },
      ],
    },
  },
  {
    id: 'organic',
    name: 'Organic',
    description: 'Earthy tones and natural shapes — ideal for health, wellness, and home goods',
    preview: '/templates/organic.png',
    themePreset: { primaryColor: '#4a7c59', fontFamily: 'DM Sans' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Naturally Made for Living',
            subtitle: 'Sustainable products for a conscious life',
            ctaText: 'Shop Now',
            ctaLink: '/products',
            style: 'centered',
          },
        },
        {
          id: 'features',
          type: 'features',
          visible: true,
          order: 1,
          config: {
            items: [
              { icon: 'leaf', title: 'Eco-Friendly', description: 'Sustainable materials' },
              { icon: 'truck', title: 'Green Shipping', description: 'Carbon-neutral delivery' },
              { icon: 'heart', title: 'Made with Care', description: 'Ethically sourced' },
            ],
          },
        },
        {
          id: 'featured_products',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: { title: 'Best Sellers', columns: 3, limit: 6, filter: 'featured' },
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          visible: true,
          order: 3,
          config: { title: 'What People Say', reviews: [] },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: true,
          order: 4,
          config: { title: 'Join Our Community', subtitle: 'Tips, deals, and new arrivals', placeholder: 'Your email', buttonText: 'Subscribe' },
        },
      ],
    },
  },
  {
    id: 'fresh',
    name: 'Fresh',
    description: 'Vibrant and colorful — perfect for food, beauty, and lifestyle brands',
    preview: '/templates/fresh.png',
    themePreset: { primaryColor: '#e85d75', fontFamily: 'Nunito' },
    layout: {
      sections: [
        {
          id: 'banner_top',
          type: 'banner',
          visible: true,
          order: 0,
          config: { text: 'New arrivals just dropped!', bgColor: '#e85d75', textColor: '#ffffff' },
        },
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 1,
          config: {
            title: 'Color Your World',
            subtitle: 'Bold products for bold people',
            ctaText: 'Explore',
            ctaLink: '/products',
            style: 'centered',
          },
        },
        {
          id: 'product_grid',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: { title: 'Trending Now', columns: 4, limit: 8, filter: 'newest' },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: true,
          order: 3,
          config: { title: 'Stay Fresh', subtitle: 'Get 10% off your first order', placeholder: 'Email address', buttonText: 'Get Deal' },
        },
      ],
    },
  },
  {
    id: 'luxe',
    name: 'Luxe',
    description: 'Refined light layout with subtle accents — for premium and luxury brands',
    preview: '/templates/luxe.png',
    themePreset: { primaryColor: '#57534e', fontFamily: 'Cormorant Garamond' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Quietly Extraordinary',
            subtitle: 'Exclusive pieces, exceptional quality',
            ctaText: 'View Collection',
            ctaLink: '/products',
            style: 'full-bleed',
          },
        },
        {
          id: 'featured_products',
          type: 'product_grid',
          visible: true,
          order: 1,
          config: { title: 'The Collection', columns: 3, limit: 3, filter: 'featured' },
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          visible: true,
          order: 2,
          config: { title: 'Client Stories', reviews: [] },
        },
      ],
    },
  },
  {
    id: 'artisan',
    name: 'Artisan',
    description: 'Warm and handcrafted feel — great for pottery, crafts, and artisanal goods',
    preview: '/templates/artisan.png',
    themePreset: { primaryColor: '#c45d3e', fontFamily: 'Libre Baskerville' },
    layout: {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          order: 0,
          config: {
            title: 'Crafted with Care',
            subtitle: 'Handmade pieces that tell a story',
            ctaText: 'Shop Handmade',
            ctaLink: '/products',
            style: 'centered',
          },
        },
        {
          id: 'features',
          type: 'features',
          visible: true,
          order: 1,
          config: {
            items: [
              { icon: 'hand', title: 'Handmade', description: 'Crafted by artisans' },
              { icon: 'sparkles', title: 'Unique', description: 'One of a kind' },
              { icon: 'truck', title: 'Careful Shipping', description: 'Wrapped with care' },
            ],
          },
        },
        {
          id: 'product_grid',
          type: 'product_grid',
          visible: true,
          order: 2,
          config: { title: 'Our Collection', columns: 3, limit: 6, filter: 'all' },
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          visible: true,
          order: 3,
          config: { title: 'From the Workshop', subtitle: 'Stories and new releases', placeholder: 'Your email', buttonText: 'Subscribe' },
        },
      ],
    },
  },
];

/** Ids exposed for API validation and clients */
export const STORE_TEMPLATE_IDS = DEFAULT_TEMPLATES.map((t) => t.id);

export function buildInitialTenantSettings(
  storeName: string,
  templateId: string
): {
  currency: string;
  language: string;
  timezone: string;
  theme: { primaryColor: string; fontFamily: string; template: string };
  seo: { title: string; description: string; keywords: string[] };
  payment: { methods: Array<{ type: string; enabled: boolean; config: Record<string, unknown> }> };
} {
  const t = getTemplate(templateId) ?? getDefaultTemplate();
  const preset = t.themePreset ?? { primaryColor: '#111111', fontFamily: 'Inter' };
  const title = storeName.length > 70 ? storeName.slice(0, 67) + '…' : storeName;
  return {
    currency: 'NGN',
    language: 'en',
    timezone: 'Africa/Lagos',
    theme: {
      primaryColor: preset.primaryColor,
      fontFamily: preset.fontFamily,
      template: t.id,
    },
    seo: {
      title,
      description: `Shop ${storeName} online.`,
      keywords: [],
    },
    payment: {
      methods: [{ type: 'bank_transfer', enabled: true, config: {} }],
    },
  };
}

export function getTemplate(id: string): StoreTemplate | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): StoreTemplate {
  return DEFAULT_TEMPLATES[0];
}

export function applyLayoutOverrides(
  template: StoreTemplate,
  overrides: Partial<Record<string, Partial<TemplateSection>>>
): StoreTemplate {
  return {
    ...template,
    layout: {
      sections: template.layout.sections.map((section) => {
        const override = overrides[section.id];
        if (!override) return section;
        return {
          ...section,
          ...override,
          config: { ...section.config, ...(override.config ?? {}) },
        };
      }),
    },
  };
}

export { DEFAULT_TEMPLATES as templates };
