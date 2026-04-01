import type { CSSProperties } from 'react';
import type { TemplateConfig } from './storefront-theme';
import { getTemplateHeroCtaStyle } from './storefront-theme';

/**
 * Per-template layout & UI patterns so each storefront template feels visually distinct
 * (not only colors). Used by the public storefront and kept in sync with theme previews.
 */

export type NavVariant = 'standard' | 'centered' | 'minimal-bar' | 'market' | 'elegant' | 'tech' | 'soft' | 'playful' | 'refined' | 'craft';

/** Unique header chrome per template (see `StorefrontHeader`). */
export type HeaderLayoutId =
  | 'minimal-strip'
  | 'bold-accent'
  | 'market-tier'
  | 'boutique-masthead'
  | 'studio-dual'
  | 'organic-stack'
  | 'fresh-banner-row'
  | 'luxe-minimal'
  | 'artisan-mobile';

/** Sidebar content beside the main column (see `StorefrontSidebar`). */
export type SidebarLayoutId =
  | 'none'
  | 'market-catalog'
  | 'bold-editorial'
  | 'boutique-story'
  | 'studio-filters'
  | 'organic-values'
  | 'fresh-spotlight'
  | 'artisan-rail';

export type PageShell = 'default' | 'artisan-split';

export type ProductGridVariant =
  | 'minimal'
  | 'editorial'
  | 'market'
  | 'lookbook'
  | 'catalog'
  | 'organic'
  | 'vibrant'
  | 'gallery'
  | 'artisan';

export type FeatureStripVariant = 'dots' | 'pills' | 'ruled' | 'cards';

export type TestimonialVariant = 'cards' | 'quotes' | 'minimal';

export type HeroCtaMode = 'solid' | 'outline' | 'ghost';

export interface StorefrontTemplateLayout {
  id: string;
  /** Distinct header sections (not one shared bar). */
  headerLayout: HeaderLayoutId;
  /** Optional sidebar beside products — different design per template. */
  sidebarLayout: SidebarLayoutId;
  sidebarPosition: 'left' | 'right';
  /** Artisan: fixed left rail with nav; main column scrolls. */
  pageShell: PageShell;
  /** Checkout / legacy `StorefrontNav` — closest match to `headerLayout`. */
  navVariant: NavVariant;
  /** Default hero text alignment when site settings don’t override */
  heroDefaultAlign: 'left' | 'center' | 'right';
  /** Primary CTA visual treatment */
  heroCtaMode: HeroCtaMode;
  /** Extra classes on hero section (no custom image) */
  heroSectionNoImage: string;
  heroInnerNoImage: string;
  heroTitleNoImage: string;
  heroSubtitleNoImage: string;
  heroCtaNoImage: string;
  /** Hero with background image */
  heroTitleImage: string;
  heroSubtitleImage: string;
  productsSection: string;
  productsHeading: string;
  productsEyebrow?: string;
  productGrid: ProductGridVariant;
  featureStrip: FeatureStripVariant;
  testimonials: TestimonialVariant;
  newsletter: 'inline' | 'card' | 'wide';
  footer: 'simple' | 'split';
  /** Hide generic mobile chip row when template has its own pattern */
  mobileCategoryChips: boolean;
}

const minimal: StorefrontTemplateLayout = {
  id: 'minimal',
  headerLayout: 'minimal-strip',
  sidebarLayout: 'none',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'minimal-bar',
  heroDefaultAlign: 'center',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-20 md:py-28',
  heroInnerNoImage: 'max-w-2xl mx-auto',
  heroTitleNoImage: 'text-3xl md:text-4xl font-semibold tracking-tight',
  heroSubtitleNoImage: 'text-base md:text-lg font-normal',
  heroCtaNoImage: 'rounded-md px-8 py-3 text-sm font-medium mt-2',
  heroTitleImage: 'text-3xl md:text-5xl font-semibold tracking-tight',
  heroSubtitleImage: 'text-base md:text-lg',
  productsSection: 'pt-12 pb-20',
  productsHeading: 'text-lg font-semibold tracking-tight uppercase text-neutral-500',
  productsEyebrow: 'Shop',
  productGrid: 'minimal',
  featureStrip: 'dots',
  testimonials: 'minimal',
  newsletter: 'inline',
  footer: 'simple',
  mobileCategoryChips: true,
};

const bold: StorefrontTemplateLayout = {
  id: 'bold',
  headerLayout: 'bold-accent',
  sidebarLayout: 'bold-editorial',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'standard',
  heroDefaultAlign: 'left',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-16 md:py-24 md:pl-8 lg:pl-16',
  heroInnerNoImage: 'max-w-3xl',
  heroTitleNoImage: 'text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95]',
  heroSubtitleNoImage: 'text-lg md:text-xl font-medium max-w-lg',
  heroCtaNoImage: 'rounded-none px-10 py-4 text-sm font-bold uppercase tracking-widest mt-4',
  heroTitleImage: 'text-4xl md:text-6xl font-black tracking-tighter',
  heroSubtitleImage: 'text-lg md:text-xl font-medium',
  productsSection: 'pt-16 pb-24',
  productsHeading: 'text-3xl md:text-4xl font-black tracking-tight',
  productsEyebrow: 'New in',
  productGrid: 'editorial',
  featureStrip: 'ruled',
  testimonials: 'quotes',
  newsletter: 'wide',
  footer: 'split',
  mobileCategoryChips: true,
};

const market: StorefrontTemplateLayout = {
  id: 'market',
  headerLayout: 'market-tier',
  sidebarLayout: 'market-catalog',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'market',
  heroDefaultAlign: 'center',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-10 md:py-14 border-b border-neutral-200/80',
  heroInnerNoImage: 'max-w-4xl mx-auto',
  heroTitleNoImage: 'text-2xl md:text-3xl font-bold',
  heroSubtitleNoImage: 'text-sm md:text-base text-neutral-600',
  heroCtaNoImage: 'rounded-full px-8 py-2.5 text-sm font-semibold mt-4',
  heroTitleImage: 'text-2xl md:text-4xl font-bold',
  heroSubtitleImage: 'text-sm md:text-base',
  productsSection: 'pt-8 pb-16',
  productsHeading: 'text-sm font-bold uppercase tracking-wider text-neutral-600',
  productsEyebrow: 'Featured',
  productGrid: 'market',
  featureStrip: 'pills',
  testimonials: 'cards',
  newsletter: 'card',
  footer: 'split',
  mobileCategoryChips: false,
};

const boutique: StorefrontTemplateLayout = {
  id: 'boutique',
  headerLayout: 'boutique-masthead',
  sidebarLayout: 'boutique-story',
  sidebarPosition: 'right',
  pageShell: 'default',
  navVariant: 'elegant',
  heroDefaultAlign: 'center',
  heroCtaMode: 'outline',
  heroSectionNoImage: 'py-24 md:py-32 relative',
  heroInnerNoImage: 'max-w-2xl mx-auto relative',
  heroTitleNoImage: 'text-4xl md:text-5xl font-light tracking-wide italic',
  heroSubtitleNoImage: 'text-base md:text-lg font-light tracking-wide mt-4',
  heroCtaNoImage: 'rounded-full border-2 border-current bg-transparent px-10 py-3 text-xs font-semibold uppercase tracking-[0.2em] mt-8',
  heroTitleImage: 'text-4xl md:text-5xl font-light tracking-wide',
  heroSubtitleImage: 'text-base md:text-lg',
  productsSection: 'pt-20 pb-24',
  productsHeading: 'text-xs font-medium uppercase tracking-[0.25em] text-neutral-500',
  productsEyebrow: 'Collection',
  productGrid: 'lookbook',
  featureStrip: 'cards',
  testimonials: 'minimal',
  newsletter: 'inline',
  footer: 'simple',
  mobileCategoryChips: true,
};

const studio: StorefrontTemplateLayout = {
  id: 'studio',
  headerLayout: 'studio-dual',
  sidebarLayout: 'studio-filters',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'tech',
  heroDefaultAlign: 'left',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-14 md:py-20 border-y border-blue-100',
  heroInnerNoImage: 'max-w-4xl',
  heroTitleNoImage: 'text-3xl md:text-5xl font-bold tracking-tight text-balance',
  heroSubtitleNoImage: 'text-sm md:text-base text-neutral-600 max-w-xl mt-3',
  heroCtaNoImage: 'rounded-md px-6 py-3 text-sm font-semibold mt-6 shadow-sm',
  heroTitleImage: 'text-3xl md:text-5xl font-bold tracking-tight',
  heroSubtitleImage: 'text-sm md:text-base',
  productsSection: 'pt-14 pb-20 bg-white/50',
  productsHeading: 'text-xl font-bold tracking-tight',
  productsEyebrow: 'Catalog',
  productGrid: 'catalog',
  featureStrip: 'ruled',
  testimonials: 'cards',
  newsletter: 'card',
  footer: 'split',
  mobileCategoryChips: true,
};

const organic: StorefrontTemplateLayout = {
  id: 'organic',
  headerLayout: 'organic-stack',
  sidebarLayout: 'organic-values',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'soft',
  heroDefaultAlign: 'center',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-20 md:py-28',
  heroInnerNoImage: 'max-w-2xl mx-auto rounded-[2rem] px-8 py-12 md:px-12 md:py-16 shadow-inner bg-white/50',
  heroTitleNoImage: 'text-3xl md:text-4xl font-semibold tracking-tight',
  heroSubtitleNoImage: 'text-base leading-relaxed mt-4',
  heroCtaNoImage: 'rounded-full px-8 py-3 text-sm font-semibold mt-6 shadow-md',
  heroTitleImage: 'text-3xl md:text-4xl font-semibold',
  heroSubtitleImage: 'text-base',
  productsSection: 'pt-16 pb-24',
  productsHeading: 'text-lg font-semibold',
  productsEyebrow: 'Nature picks',
  productGrid: 'organic',
  featureStrip: 'pills',
  testimonials: 'quotes',
  newsletter: 'wide',
  footer: 'simple',
  mobileCategoryChips: true,
};

const fresh: StorefrontTemplateLayout = {
  id: 'fresh',
  headerLayout: 'fresh-banner-row',
  sidebarLayout: 'fresh-spotlight',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'playful',
  heroDefaultAlign: 'center',
  heroCtaMode: 'solid',
  heroSectionNoImage: 'py-20 md:py-24',
  heroInnerNoImage: 'max-w-xl mx-auto',
  heroTitleNoImage: 'text-3xl md:text-5xl font-extrabold tracking-tight',
  heroSubtitleNoImage: 'text-base font-medium mt-3',
  heroCtaNoImage: 'rounded-full px-10 py-3.5 text-sm font-bold shadow-lg mt-6',
  heroTitleImage: 'text-3xl md:text-5xl font-extrabold',
  heroSubtitleImage: 'text-base font-medium',
  productsSection: 'pt-14 pb-24',
  productsHeading: 'text-2xl font-extrabold',
  productsEyebrow: 'Trending',
  productGrid: 'vibrant',
  featureStrip: 'dots',
  testimonials: 'cards',
  newsletter: 'card',
  footer: 'simple',
  mobileCategoryChips: true,
};

const luxe: StorefrontTemplateLayout = {
  id: 'luxe',
  headerLayout: 'luxe-minimal',
  sidebarLayout: 'none',
  sidebarPosition: 'left',
  pageShell: 'default',
  navVariant: 'refined',
  heroDefaultAlign: 'center',
  heroCtaMode: 'outline',
  heroSectionNoImage: 'py-24 md:py-36 border-y border-stone-200',
  heroInnerNoImage: 'max-w-lg mx-auto',
  heroTitleNoImage: 'text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase',
  heroSubtitleNoImage: 'text-xs md:text-sm font-light tracking-widest mt-6 text-neutral-600',
  heroCtaNoImage: 'rounded-none border border-current bg-transparent px-12 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] mt-10',
  heroTitleImage: 'text-3xl md:text-4xl font-normal tracking-wide uppercase',
  heroSubtitleImage: 'text-xs md:text-sm font-light tracking-widest',
  productsSection: 'pt-20 pb-28',
  productsHeading: 'text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500',
  productsEyebrow: 'Selection',
  productGrid: 'gallery',
  featureStrip: 'ruled',
  testimonials: 'minimal',
  newsletter: 'inline',
  footer: 'split',
  mobileCategoryChips: true,
};

const artisan: StorefrontTemplateLayout = {
  id: 'artisan',
  headerLayout: 'artisan-mobile',
  sidebarLayout: 'artisan-rail',
  sidebarPosition: 'left',
  pageShell: 'artisan-split',
  navVariant: 'craft',
  heroDefaultAlign: 'center',
  heroCtaMode: 'outline',
  heroSectionNoImage: 'py-20 md:py-26',
  heroInnerNoImage: 'max-w-2xl mx-auto border-2 border-amber-200/60 rounded-sm px-8 py-12 md:px-14 md:py-16 bg-amber-50/30',
  heroTitleNoImage: 'text-3xl md:text-4xl font-serif tracking-normal',
  heroSubtitleNoImage: 'text-base font-serif italic mt-4 opacity-90',
  heroCtaNoImage: 'rounded-sm px-8 py-3 text-sm font-semibold mt-8 border-2 border-current bg-transparent',
  heroTitleImage: 'text-3xl md:text-4xl font-serif',
  heroSubtitleImage: 'text-base font-serif italic',
  productsSection: 'pt-16 pb-24',
  productsHeading: 'text-xl font-serif',
  productsEyebrow: 'From the workshop',
  productGrid: 'artisan',
  featureStrip: 'cards',
  testimonials: 'quotes',
  newsletter: 'wide',
  footer: 'simple',
  mobileCategoryChips: false,
};

const LAYOUTS: Record<string, StorefrontTemplateLayout> = {
  minimal,
  bold,
  market,
  boutique,
  studio,
  organic,
  fresh,
  luxe,
  artisan,
};

export function getStorefrontTemplateLayout(templateId: string): StorefrontTemplateLayout {
  return LAYOUTS[templateId] ?? minimal;
}

/** Hero CTA: solid fill vs outline vs ghost — pairs with `heroCtaNoImage` / image CTA classes. */
export function resolveHeroCtaStyle(cfg: TemplateConfig, layout: StorefrontTemplateLayout): CSSProperties {
  if (layout.heroCtaMode === 'outline') {
    return {
      backgroundColor: 'transparent',
      color: cfg.heroCtaBg,
      borderColor: cfg.heroCtaBg,
      borderWidth: 2,
      borderStyle: 'solid',
    };
  }
  if (layout.heroCtaMode === 'ghost') {
    return { backgroundColor: 'transparent', color: cfg.heroCtaBg };
  }
  return getTemplateHeroCtaStyle(cfg);
}
