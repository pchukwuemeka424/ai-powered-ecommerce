import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assetUrl } from '@/lib/asset-url';
import { getServerApiBaseUrl } from '@/lib/server-api-url';
import { PreviewBanner } from '@/components/store/preview-banner';
import { StorefrontHeader } from '@/components/store/storefront-header';
import { StorefrontSidebar } from '@/components/store/storefront-sidebar';
import { FeaturedProductCards } from '@/components/store/featured-product-cards';
import { StoreNewsletter } from '@/components/store/store-newsletter';
import { StorefrontFooter } from '@/components/store/storefront-footer';
import { PUBLIC_STORE_FETCH_INIT, buildPublicStoreBySubdomainUrl } from '@/lib/storefront-sync';
import {
  getTemplateConfig,
  getTemplateHeroCtaStyle,
  resolveBrandPrimaryColor,
  resolveStoreHref,
  type MenuCategory,
} from '@/lib/storefront-theme';
import { getStorefrontTemplateLayout, resolveHeroCtaStyle } from '@/lib/storefront-template-layouts';

interface SiteSettings {
  logoUrl?: string;
  menuCategories?: MenuCategory[];
  hero?: {
    headline?: string;
    subheadline?: string;
    alignment?: 'left' | 'center' | 'right';
    imageUrl?: string;
    ctaText?: string;
    ctaHref?: string;
  };
  banner?: {
    imageUrl?: string;
    linkUrl?: string;
    alt?: string;
  };
}

interface StoreData {
  name: string;
  description?: string;
  logo?: string;
  settings: {
    currency: string;
    theme: { primaryColor: string; template: string; fontFamily?: string };
    seo: { title: string; description: string };
    site?: SiteSettings;
  };
}

interface Product {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  inventory: number;
}

async function getStoreData(
  subdomain: string,
  noCache = false,
): Promise<{
  store: StoreData;
  featuredProducts: Product[];
  newProducts: Product[];
  /** When nothing is flagged featured or new, show a slice of the full catalog */
  fallbackProducts: Product[];
}> {
  const API_URL = getServerApiBaseUrl();

  const storeFetchOpts = PUBLIC_STORE_FETCH_INIT;
  const productsFetchOpts = noCache
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 30 } };

  const [storeRes, featuredRes, newRes] = await Promise.allSettled([
    fetch(buildPublicStoreBySubdomainUrl(API_URL, subdomain), storeFetchOpts),
    fetch(
      `${API_URL}/api/v1/products/public/${encodeURIComponent(subdomain)}?limit=12&highlight=featured`,
      productsFetchOpts,
    ),
    fetch(
      `${API_URL}/api/v1/products/public/${encodeURIComponent(subdomain)}?limit=12&highlight=new`,
      productsFetchOpts,
    ),
  ]);

  if (storeRes.status === 'rejected' || !storeRes.value.ok) notFound();

  const storeData = await storeRes.value.json();
  let featuredProducts: Product[] = [];
  let newProducts: Product[] = [];

  if (featuredRes.status === 'fulfilled' && featuredRes.value.ok) {
    const pData = await featuredRes.value.json();
    featuredProducts = pData.products ?? [];
  }
  if (newRes.status === 'fulfilled' && newRes.value.ok) {
    const pData = await newRes.value.json();
    newProducts = pData.products ?? [];
  }

  let fallbackProducts: Product[] = [];
  if (featuredProducts.length === 0 && newProducts.length === 0) {
    const allRes = await fetch(
      `${API_URL}/api/v1/products/public/${encodeURIComponent(subdomain)}?limit=12`,
      productsFetchOpts,
    );
    if (allRes.ok) {
      const pData = await allRes.json();
      fallbackProducts = pData.products ?? [];
    }
  }

  return { store: storeData.store, featuredProducts, newProducts, fallbackProducts };
}

export async function generateMetadata({ params }: { params: { subdomain: string } }): Promise<Metadata> {
  try {
    const { store } = await getStoreData(params.subdomain);
    return {
      title: store.settings.seo.title || store.name,
      description: store.settings.seo.description || store.description || `Shop at ${store.name}`,
    };
  } catch {
    return { title: 'Store Not Found' };
  }
}

export async function generateViewport({ params }: { params: { subdomain: string } }): Promise<Viewport> {
  try {
    const { store } = await getStoreData(params.subdomain);
    return { themeColor: resolveBrandPrimaryColor(store.settings.theme) };
  } catch {
    return {};
  }
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: { subdomain: string };
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === '1';
  const { store, featuredProducts, newProducts, fallbackProducts } = await getStoreData(
    params.subdomain,
    isPreview,
  );
  const { subdomain } = params;
  const currency = store.settings.currency;
  const primaryColor = resolveBrandPrimaryColor(store.settings.theme);
  const fontFamily = store.settings.theme.fontFamily;
  const templateId = store.settings.theme.template ?? 'minimal';
  const cfg = getTemplateConfig(templateId);
  const layout = getStorefrontTemplateLayout(templateId);
  const filledCtaStyle = getTemplateHeroCtaStyle(cfg);
  const heroCtaStyle = resolveHeroCtaStyle(cfg, layout);

  const site = store.settings.site;
  const logoUrl = site?.logoUrl || store.logo;
  const menuCats = site?.menuCategories?.filter((c) => c.label && c.category) ?? [];
  const hero = site?.hero;
  const banner = site?.banner;
  const headline = hero?.headline?.trim() || store.name;
  const subhead = hero?.subheadline?.trim() || store.description || '';
  const heroImage = hero?.imageUrl?.trim();
  const heroImageSrc = heroImage ? assetUrl(heroImage) : '';
  const logoSrc = logoUrl ? assetUrl(logoUrl) : '';
  const bannerSrc = banner?.imageUrl?.trim() ? assetUrl(banner.imageUrl.trim()) : '';
  const ctaText = hero?.ctaText?.trim() || 'Shop now';
  const ctaHref = resolveStoreHref(subdomain, hero?.ctaHref);

  const heroAlign: 'left' | 'center' | 'right' =
    hero?.alignment === 'left' || hero?.alignment === 'right' || hero?.alignment === 'center'
      ? hero.alignment
      : layout.heroDefaultAlign;

  const heroTextAlignClass =
    heroAlign === 'left' ? 'text-left' : heroAlign === 'right' ? 'text-right' : 'text-center';
  const heroContentJustifyClass =
    heroAlign === 'left' ? 'justify-start' : heroAlign === 'right' ? 'justify-end' : 'justify-center';
  const heroBlockAlignClass =
    heroAlign === 'left' ? 'items-start' : heroAlign === 'right' ? 'items-end' : 'items-center';
  const heroInlineAlignClass =
    heroAlign === 'left' ? 'self-start' : heroAlign === 'right' ? 'self-end' : 'self-center';

  const isMarket = templateId === 'market';
  const isArtisanShell = layout.pageShell === 'artisan-split';
  const showSidebarBesideProducts =
    layout.sidebarLayout !== 'none' && layout.sidebarLayout !== 'artisan-rail';

  const textMuted = 'text-neutral-500';
  const textBody = 'text-neutral-600';
  const productTitleColor = 'text-neutral-900';

  const headerProps = {
    subdomain,
    storeName: store.name,
    logoSrc: logoSrc || undefined,
    primaryColor,
    navBg: cfg.navBg,
    navText: cfg.navText,
    navBorder: cfg.navBorder,
    menuCats,
  };

  const hideApiTopBanner =
    !!cfg.topBanner &&
    (layout.headerLayout === 'fresh-banner-row' || layout.headerLayout === 'studio-dual');

  const mainFlow = (
    <>
      {!isArtisanShell && <StorefrontHeader {...headerProps} headerLayout={layout.headerLayout} />}
      {isArtisanShell && (
        <div className="lg:hidden">
          <StorefrontHeader {...headerProps} headerLayout="artisan-mobile" />
        </div>
      )}

      <section className="relative">
        {heroImageSrc ? (
          <div className="relative min-h-[280px] md:min-h-[380px] flex items-center px-4 py-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className={`relative z-10 w-full max-w-6xl mx-auto flex ${heroContentJustifyClass}`}>
              <div className={`w-full max-w-3xl flex flex-col ${heroBlockAlignClass} ${heroTextAlignClass}`}>
                <h1 className={`${layout.heroTitleImage} text-white tracking-tight leading-tight mb-3`}>{headline}</h1>
                {subhead && (
                  <p className={`${layout.heroSubtitleImage} text-white/90 mb-8 max-w-xl ${heroInlineAlignClass}`}>
                    {subhead}
                  </p>
                )}
                <Link
                  href={ctaHref}
                  className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${heroInlineAlignClass} ${layout.heroCtaNoImage}`}
                  style={heroCtaStyle}
                >
                  {ctaText}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative flex items-center px-4 overflow-hidden ${layout.heroSectionNoImage}`}
            style={{ backgroundColor: cfg.heroBg }}
          >
            <div className={`relative z-10 w-full max-w-6xl mx-auto flex ${heroContentJustifyClass}`}>
              <div className={`w-full flex flex-col ${heroBlockAlignClass} ${heroTextAlignClass} ${layout.heroInnerNoImage}`}>
                <h1 className={`${layout.heroTitleNoImage} mb-4`} style={{ color: cfg.heroTextColor }}>
                  {headline}
                </h1>
                {subhead && (
                  <p
                    className={`${layout.heroSubtitleNoImage} mb-8 max-w-xl ${heroInlineAlignClass}`}
                    style={{ color: cfg.heroTextColor, opacity: 0.85 }}
                  >
                    {subhead}
                  </p>
                )}
                <Link
                  href={ctaHref}
                  className={`inline-flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity ${heroInlineAlignClass} ${layout.heroCtaNoImage}`}
                  style={heroCtaStyle}
                >
                  {ctaText}
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {cfg.features && cfg.features.length > 0 && layout.featureStrip === 'dots' && (
        <div className="border-b bg-white" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {cfg.features.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                <span style={{ color: cfg.navText }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cfg.features && cfg.features.length > 0 && layout.featureStrip === 'pills' && (
        <div className="border-b bg-white py-4" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-2">
            {cfg.features.map((item) => (
              <span
                key={item}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-neutral-200 bg-neutral-50"
                style={{ color: cfg.navText }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {cfg.features && cfg.features.length > 0 && layout.featureStrip === 'ruled' && (
        <div className="border-y bg-neutral-50/80" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-neutral-200/80">
            {cfg.features.map((item) => (
              <div key={item} className="px-2 text-xs md:text-sm font-bold uppercase tracking-wide" style={{ color: cfg.navText }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {cfg.features && cfg.features.length > 0 && layout.featureStrip === 'cards' && (
        <div className="border-b bg-white py-8" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cfg.features.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-5 py-4 text-sm font-medium text-center"
                style={{ color: cfg.navText }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {isMarket && menuCats.length > 0 && (
        <div className="border-b" style={{ borderColor: cfg.navBorder, backgroundColor: cfg.bodyBg }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
            {menuCats.map((m) => (
              <Link
                key={m.category}
                href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
                className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors"
                style={filledCtaStyle}
              >
                {m.label}
              </Link>
            ))}
            <Link
              href={`/store/${subdomain}/products`}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#f5f5f5', color: '#525252' }}
            >
              All
            </Link>
          </div>
        </div>
      )}

      {layout.mobileCategoryChips && (
        <div className="md:hidden border-b px-4 py-3 flex gap-3 overflow-x-auto text-sm" style={{ borderColor: cfg.navBorder, backgroundColor: cfg.bodyBg }}>
          {menuCats.map((m) => (
            <Link
              key={m.category + m.label}
              href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
              className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#f5f5f5', color: '#525252' }}
            >
              {m.label}
            </Link>
          ))}
          <Link
            href={`/store/${subdomain}/products`}
            className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#f5f5f5', color: '#525252' }}
          >
            All
          </Link>
        </div>
      )}

      {(featuredProducts.length > 0 ||
        newProducts.length > 0 ||
        fallbackProducts.length > 0) && (
        <section className={`max-w-6xl mx-auto px-4 ${layout.productsSection}`}>
          {showSidebarBesideProducts ? (
            <div
              className={
                layout.sidebarPosition === 'right'
                  ? 'lg:flex lg:flex-row lg:gap-10 lg:items-start'
                  : 'lg:flex lg:gap-10 lg:items-start'
              }
            >
              {layout.sidebarPosition === 'left' && (
                <StorefrontSidebar
                  variant={layout.sidebarLayout}
                  subdomain={subdomain}
                  storeName={store.name}
                  menuCats={menuCats}
                  navText={cfg.navText}
                  bodyBg={cfg.bodyBg}
                  primaryColor={primaryColor}
                  logoSrc={logoSrc || undefined}
                />
              )}
              <div className="flex-1 min-w-0 space-y-8">
                {featuredProducts.length > 0 || newProducts.length > 0 ? (
                  <>
                    {featuredProducts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                          <div>
                            {layout.productsEyebrow && (
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">{layout.productsEyebrow}</p>
                            )}
                            <h2 className={layout.productsHeading}>Featured products</h2>
                          </div>
                          <Link
                            href={`/store/${subdomain}/products?highlight=featured`}
                            className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                          >
                            View all →
                          </Link>
                        </div>
                        <FeaturedProductCards
                          products={featuredProducts}
                          subdomain={subdomain}
                          currency={currency}
                          productTitleColor={productTitleColor}
                          primaryColor={primaryColor}
                          gridVariant={layout.productGrid}
                        />
                      </div>
                    )}
                    {newProducts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Just in</p>
                            <h2 className={layout.productsHeading}>New arrivals</h2>
                          </div>
                          <Link
                            href={`/store/${subdomain}/products?highlight=new`}
                            className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                          >
                            View all →
                          </Link>
                        </div>
                        <FeaturedProductCards
                          products={newProducts}
                          subdomain={subdomain}
                          currency={currency}
                          productTitleColor={productTitleColor}
                          primaryColor={primaryColor}
                          gridVariant={layout.productGrid}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                      <div>
                        {layout.productsEyebrow && (
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">{layout.productsEyebrow}</p>
                        )}
                        <h2 className={layout.productsHeading}>Products</h2>
                      </div>
                      <Link
                        href={`/store/${subdomain}/products`}
                        className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                      >
                        View all →
                      </Link>
                    </div>
                    <FeaturedProductCards
                      products={fallbackProducts}
                      subdomain={subdomain}
                      currency={currency}
                      productTitleColor={productTitleColor}
                      primaryColor={primaryColor}
                      gridVariant={layout.productGrid}
                    />
                  </div>
                )}
              </div>
              {layout.sidebarPosition === 'right' && (
                <StorefrontSidebar
                  variant={layout.sidebarLayout}
                  subdomain={subdomain}
                  storeName={store.name}
                  menuCats={menuCats}
                  navText={cfg.navText}
                  bodyBg={cfg.bodyBg}
                  primaryColor={primaryColor}
                  logoSrc={logoSrc || undefined}
                />
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {featuredProducts.length > 0 || newProducts.length > 0 ? (
                <>
                  {featuredProducts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                        <div>
                          {layout.productsEyebrow && (
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">{layout.productsEyebrow}</p>
                          )}
                          <h2 className={layout.productsHeading}>Featured products</h2>
                        </div>
                        <Link
                          href={`/store/${subdomain}/products?highlight=featured`}
                          className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                        >
                          View all →
                        </Link>
                      </div>
                      <FeaturedProductCards
                        products={featuredProducts}
                        subdomain={subdomain}
                        currency={currency}
                        productTitleColor={productTitleColor}
                        primaryColor={primaryColor}
                        gridVariant={layout.productGrid}
                      />
                    </div>
                  )}
                  {newProducts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Just in</p>
                          <h2 className={layout.productsHeading}>New arrivals</h2>
                        </div>
                        <Link
                          href={`/store/${subdomain}/products?highlight=new`}
                          className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                        >
                          View all →
                        </Link>
                      </div>
                      <FeaturedProductCards
                        products={newProducts}
                        subdomain={subdomain}
                        currency={currency}
                        productTitleColor={productTitleColor}
                        primaryColor={primaryColor}
                        gridVariant={layout.productGrid}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div>
                      {layout.productsEyebrow && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">{layout.productsEyebrow}</p>
                      )}
                      <h2 className={layout.productsHeading}>Products</h2>
                    </div>
                    <Link
                      href={`/store/${subdomain}/products`}
                      className={`text-sm ${textMuted} hover:text-neutral-800 transition-colors shrink-0`}
                    >
                      View all →
                    </Link>
                  </div>
                  <FeaturedProductCards
                    products={fallbackProducts}
                    subdomain={subdomain}
                    currency={currency}
                    productTitleColor={productTitleColor}
                    primaryColor={primaryColor}
                    gridVariant={layout.productGrid}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {featuredProducts.length === 0 &&
        newProducts.length === 0 &&
        fallbackProducts.length === 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20 text-center py-20">
          <p className={textMuted}>No products available yet.</p>
        </section>
      )}

      {cfg.showReviews && layout.testimonials === 'cards' && (
        <section className="border-t py-10 bg-white" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className={`text-lg font-bold mb-6 ${productTitleColor}`}>What customers say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Alex M.', text: 'Amazing quality, super fast delivery. Highly recommend!' },
                { name: 'Sarah K.', text: 'The products exceeded my expectations. Will definitely order again.' },
                { name: 'David O.', text: 'Great experience from start to finish. Five stars!' },
              ].map((r) => (
                <div key={r.name} className="rounded-xl p-5 border border-neutral-100 bg-neutral-50/80">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className={`text-sm ${textBody} mb-3`}>&ldquo;{r.text}&rdquo;</p>
                  <p className={`text-xs font-semibold ${textMuted}`}>— {r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {cfg.showReviews && layout.testimonials === 'quotes' && (
        <section className="border-t py-14 bg-neutral-50" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-4xl mx-auto px-4 space-y-12">
            {[
              { name: 'Alex M.', text: 'Amazing quality, super fast delivery. Highly recommend!' },
              { name: 'Sarah K.', text: 'The products exceeded my expectations. Will definitely order again.' },
            ].map((r) => (
              <blockquote key={r.name} className="text-center">
                <p className="text-4xl text-neutral-200 font-serif leading-none mb-4">&ldquo;</p>
                <p className={`text-lg md:text-xl ${textBody} font-medium`}>{r.text}</p>
                <footer className={`mt-4 text-sm ${textMuted}`}>— {r.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {cfg.showReviews && layout.testimonials === 'minimal' && (
        <section className="border-t py-12" style={{ borderColor: cfg.navBorder, backgroundColor: cfg.bodyBg }}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className={`text-sm ${textMuted} italic`}>
              &ldquo;Exceptional quality and service. A pleasure to shop here.&rdquo;
            </p>
            <p className={`text-xs uppercase tracking-[0.2em] mt-4 ${textMuted}`}>— Verified customer</p>
          </div>
        </section>
      )}

      <StoreNewsletter
        storeName={store.name}
        primaryColor={primaryColor}
        backgroundColor={cfg.newsletterBg ?? cfg.bodyBg}
        textColor={cfg.navText}
        variant={layout.newsletter}
      />

      <StorefrontFooter subdomain={subdomain} storeName={store.name} cfg={cfg} layout={layout} />
    </>
  );

  return (
    <div
      className="min-h-screen"
      data-storefront-template={templateId}
      style={
        {
          '--primary': primaryColor,
          backgroundColor: cfg.bodyBg,
          fontFamily: fontFamily ? `${fontFamily}, system-ui, sans-serif` : undefined,
        } as React.CSSProperties
      }
    >
      {isPreview && <PreviewBanner storeName={store.name} />}

      {!bannerSrc && cfg.topBanner && !hideApiTopBanner && (
        <div
          className="w-full flex items-center justify-center py-2 px-4 text-xs font-semibold text-center"
          style={{ backgroundColor: cfg.topBanner.bg, color: cfg.topBanner.textColor }}
        >
          {cfg.topBanner.text}
        </div>
      )}

      {bannerSrc && (
        <div className="w-full" style={{ backgroundColor: cfg.navBg }}>
          {banner?.linkUrl?.trim() ? (
            <a href={banner.linkUrl} className="block w-full" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerSrc} alt={banner?.alt || 'Promo'} className="w-full h-auto max-h-28 md:max-h-36 object-cover object-center" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc} alt={banner?.alt || 'Promo'} className="w-full h-auto max-h-28 md:max-h-36 object-cover object-center" />
          )}
        </div>
      )}

      {isArtisanShell ? (
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] min-h-screen">
          <StorefrontSidebar
            variant="artisan-rail"
            subdomain={subdomain}
            storeName={store.name}
            menuCats={menuCats}
            navText={cfg.navText}
            bodyBg={cfg.bodyBg}
            primaryColor={primaryColor}
            logoSrc={logoSrc || undefined}
          />
          <div className="min-w-0 border-l border-neutral-200/80">{mainFlow}</div>
        </div>
      ) : (
        mainFlow
      )}
    </div>
  );
}
