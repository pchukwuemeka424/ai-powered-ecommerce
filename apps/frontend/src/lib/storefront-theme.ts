import type { CSSProperties } from 'react';

/**
 * Per-template visual config for storefronts. Light, modern ecommerce — solid colors only (no gradients).
 * Kept in sync with dashboard template previews.
 */
export interface TemplateConfig {
  navBg: string;
  navText: string;
  navBorder: string;
  bodyBg: string;
  footerBg: string;
  footerText: string;
  /** Solid background when hero has no image */
  heroBg: string;
  heroTextColor: string;
  heroCtaBg: string;
  heroCtaText: string;
  topBanner?: { text: string; bg: string; textColor: string };
  features?: string[];
  showReviews?: boolean;
  /** Background for newsletter strip */
  newsletterBg?: string;
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  minimal: {
    navBg: '#ffffff',
    navText: '#171717',
    navBorder: '#e5e5e5',
    bodyBg: '#fafafa',
    footerBg: '#ffffff',
    footerText: '#525252',
    heroBg: '#f4f4f5',
    heroTextColor: '#171717',
    heroCtaBg: '#171717',
    heroCtaText: '#ffffff',
    newsletterBg: '#f4f4f5',
  },
  bold: {
    navBg: '#ffffff',
    navText: '#0a0a0a',
    navBorder: '#e5e5e5',
    bodyBg: '#fafafa',
    footerBg: '#f5f5f5',
    footerText: '#404040',
    heroBg: '#eeeeee',
    heroTextColor: '#0a0a0a',
    heroCtaBg: '#0a0a0a',
    heroCtaText: '#ffffff',
    features: ['Fast delivery', 'Quality assured', 'Easy returns', '24/7 support'],
    showReviews: true,
    newsletterBg: '#f0f0f0',
  },
  market: {
    navBg: '#ffffff',
    navText: '#262626',
    navBorder: '#e7e5e4',
    bodyBg: '#f5f5f4',
    footerBg: '#fafaf9',
    footerText: '#57534e',
    heroBg: '#e7e5e4',
    heroTextColor: '#1c1917',
    heroCtaBg: '#1c1917',
    heroCtaText: '#ffffff',
    topBanner: {
      text: 'Flash sale: up to 40% off selected items',
      bg: '#e7e5e4',
      textColor: '#1c1917',
    },
    newsletterBg: '#e7e5e4',
  },
  boutique: {
    navBg: '#faf8f5',
    navText: '#44403c',
    navBorder: '#e7e5e4',
    bodyBg: '#faf8f5',
    footerBg: '#f5f5f4',
    footerText: '#57534e',
    heroBg: '#f5f0e8',
    heroTextColor: '#292524',
    heroCtaBg: '#44403c',
    heroCtaText: '#faf8f5',
    features: ['Handpicked', 'Careful delivery'],
    newsletterBg: '#f0ebe3',
  },
  studio: {
    navBg: '#ffffff',
    navText: '#1e3a5f',
    navBorder: '#e2e8f0',
    bodyBg: '#f8fafc',
    footerBg: '#ffffff',
    footerText: '#64748b',
    heroBg: '#eff6ff',
    heroTextColor: '#1e3a8a',
    heroCtaBg: '#1d4ed8',
    heroCtaText: '#ffffff',
    features: ['Warranty', 'Expert support'],
    topBanner: { text: 'Free shipping on orders over ₦15,000', bg: '#1d4ed8', textColor: '#ffffff' },
    newsletterBg: '#e0f2fe',
  },
  organic: {
    navBg: '#f7faf7',
    navText: '#365314',
    navBorder: '#d9e9d9',
    bodyBg: '#f7faf7',
    footerBg: '#f0fdf4',
    footerText: '#3f6212',
    heroBg: '#ecfdf5',
    heroTextColor: '#14532d',
    heroCtaBg: '#15803d',
    heroCtaText: '#ffffff',
    features: ['Eco-friendly', 'Green shipping', 'Made with care'],
    showReviews: true,
    newsletterBg: '#dcfce7',
  },
  fresh: {
    navBg: '#ffffff',
    navText: '#9f1239',
    navBorder: '#fce7f3',
    bodyBg: '#fffbeb',
    footerBg: '#ffffff',
    footerText: '#831843',
    heroBg: '#fff1f2',
    heroTextColor: '#9f1239',
    heroCtaBg: '#e11d48',
    heroCtaText: '#ffffff',
    topBanner: { text: 'New arrivals just dropped', bg: '#e11d48', textColor: '#ffffff' },
    newsletterBg: '#ffe4e6',
  },
  luxe: {
    navBg: '#fafaf8',
    navText: '#44403c',
    navBorder: '#d6d3d1',
    bodyBg: '#fafaf8',
    footerBg: '#f5f5f4',
    footerText: '#57534e',
    heroBg: '#f5f2eb',
    heroTextColor: '#292524',
    heroCtaBg: '#57534e',
    heroCtaText: '#ffffff',
    showReviews: true,
    newsletterBg: '#e7e5e4',
  },
  artisan: {
    navBg: '#fdf8f3',
    navText: '#7c2d12',
    navBorder: '#fed7aa',
    bodyBg: '#fffbeb',
    footerBg: '#fdf8f3',
    footerText: '#9a3412',
    heroBg: '#ffedd5',
    heroTextColor: '#7c2d12',
    heroCtaBg: '#c2410c',
    heroCtaText: '#ffffff',
    features: ['Handmade', 'Unique', 'Careful shipping'],
    newsletterBg: '#ffedd5',
  },
};

export function getTemplateConfig(templateId: string): TemplateConfig {
  return TEMPLATE_CONFIGS[templateId] ?? TEMPLATE_CONFIGS.minimal;
}

/** Hero primary button — from template preset (selected theme), not raw brand hex. */
export function getTemplateHeroCtaStyle(cfg: TemplateConfig): CSSProperties {
  return { backgroundColor: cfg.heroCtaBg, color: cfg.heroCtaText };
}

const DEFAULT_BRAND_PRIMARY = '#111111';

function expandHex3(c: string): string | null {
  const s = c.trim();
  const m = /^#([0-9a-fA-F]{3})$/i.exec(s);
  if (!m) return null;
  const [a, b, ch] = m[1].split('');
  return `#${a}${a}${b}${b}${ch}${ch}`.toLowerCase();
}

/** Resolves API `settings.theme.primaryColor` to a valid 6-digit hex for `--primary` and browser theme. */
export function resolveBrandPrimaryColor(theme: { primaryColor?: string } | null | undefined): string {
  const c = theme?.primaryColor?.trim();
  if (!c) return DEFAULT_BRAND_PRIMARY;
  if (/^#[0-9a-fA-F]{6}$/i.test(c)) return c.toLowerCase();
  const expanded = expandHex3(c);
  if (expanded) return expanded;
  return DEFAULT_BRAND_PRIMARY;
}

/** Breadcrumb bar on products listing + PDP — solid colors only (no gradients). */
export type BreadcrumbColorMode = 'auto' | 'nav' | 'body' | 'primary' | 'custom';

export interface BreadcrumbThemeInput {
  mode?: BreadcrumbColorMode | null;
  background?: string;
  link?: string;
  separator?: string;
  current?: string;
}

export interface BreadcrumbChrome {
  backgroundColor: string;
  linkColor: string;
  separatorColor: string;
  currentColor: string;
  borderColor: string;
}

function normalizeHex6(hex: string | undefined | null): string | null {
  const c = hex?.trim();
  if (!c) return null;
  if (/^#[0-9a-fA-F]{6}$/i.test(c)) return c.toLowerCase();
  return expandHex3(c);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const p = normalizeHex6(hex);
  if (!p) return null;
  const n = parseInt(p.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Muted separator / chevrons from a base text color */
function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(23,23,23,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/**
 * Resolves solid breadcrumb colors for the products catalog + product detail chrome.
 * - `auto` / `nav`: match template nav bar
 * - `body`: sit on page background + footer-tone links
 * - `primary`: white bar, brand-colored links
 * - `custom`: optional per-field hex overrides (missing fields fall back to nav preset)
 */
export function resolveBreadcrumbChrome(
  primaryColor: string,
  cfg: TemplateConfig,
  input?: BreadcrumbThemeInput | null,
): BreadcrumbChrome {
  const p = normalizeHex6(primaryColor) ?? DEFAULT_BRAND_PRIMARY;
  const mode = input?.mode ?? 'auto';
  const borderColor = cfg.navBorder;

  const navPreset = (): Omit<BreadcrumbChrome, 'borderColor'> => ({
    backgroundColor: cfg.navBg,
    linkColor: cfg.navText,
    separatorColor: rgbaFromHex(cfg.navText, 0.38),
    currentColor: cfg.navText,
  });

  if (mode === 'custom') {
    const base = navPreset();
    return {
      backgroundColor: normalizeHex6(input?.background) ?? base.backgroundColor,
      linkColor: normalizeHex6(input?.link) ?? base.linkColor,
      separatorColor: normalizeHex6(input?.separator) ?? rgbaFromHex(normalizeHex6(input?.link) ?? base.linkColor, 0.4),
      currentColor: normalizeHex6(input?.current) ?? base.currentColor,
      borderColor,
    };
  }

  if (mode === 'primary') {
    return {
      backgroundColor: '#ffffff',
      linkColor: p,
      separatorColor: rgbaFromHex(p, 0.35),
      currentColor: '#171717',
      borderColor,
    };
  }

  if (mode === 'body') {
    return {
      backgroundColor: cfg.bodyBg,
      linkColor: cfg.footerText,
      separatorColor: rgbaFromHex(cfg.footerText, 0.42),
      currentColor: '#171717',
      borderColor,
    };
  }

  // auto + nav
  const n = navPreset();
  return { ...n, borderColor };
}

export interface MenuCategory {
  label: string;
  category: string;
}

export function resolveStoreHref(subdomain: string, raw?: string): string {
  const r = (raw || 'products').trim();
  if (r.startsWith('http://') || r.startsWith('https://')) return r;
  if (r.startsWith('/store/')) return r;
  const path = r.startsWith('/') ? r.slice(1) : r;
  return `/store/${subdomain}/${path}`;
}
