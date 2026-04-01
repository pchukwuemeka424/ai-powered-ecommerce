import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search } from 'lucide-react';
import { PUBLIC_STORE_FETCH_INIT, buildPublicStoreBySubdomainUrl } from '@/lib/storefront-sync';
import { getServerApiBaseUrl } from '@/lib/server-api-url';
import { assetUrl } from '@/lib/asset-url';
import { getTemplateConfig, resolveBrandPrimaryColor, resolveBreadcrumbChrome } from '@/lib/storefront-theme';
import { getStorefrontTemplateLayout } from '@/lib/storefront-template-layouts';
import { StorefrontNav } from '@/components/store/storefront-nav';
import { StoreBreadcrumb } from '@/components/store/store-breadcrumb';
import { FeaturedProductCards } from '@/components/store/featured-product-cards';
import { StoreNewsletter } from '@/components/store/store-newsletter';
import { StorefrontFooter } from '@/components/store/storefront-footer';

interface Product {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  inventory: number;
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';
type HighlightKey = 'featured' | 'new';

function buildProductsQuery(
  category?: string,
  sort: SortKey = 'newest',
  search?: string,
  highlight?: HighlightKey,
) {
  const qs = new URLSearchParams();
  qs.set('limit', '48');
  if (category) qs.set('category', category);
  if (sort !== 'newest') qs.set('sort', sort);
  if (search?.trim()) qs.set('search', search.trim());
  if (highlight === 'featured' || highlight === 'new') qs.set('highlight', highlight);
  return qs.toString();
}

function catalogHref(
  subdomain: string,
  opts: { category?: string; sort?: SortKey; q?: string; highlight?: HighlightKey },
) {
  const p = new URLSearchParams();
  if (opts.category) p.set('category', opts.category);
  if (opts.sort && opts.sort !== 'newest') p.set('sort', opts.sort);
  if (opts.q?.trim()) p.set('q', opts.q.trim());
  if (opts.highlight === 'featured' || opts.highlight === 'new') p.set('highlight', opts.highlight);
  const qs = p.toString();
  return `/store/${subdomain}/products${qs ? `?${qs}` : ''}`;
}

async function getData(
  subdomain: string,
  category?: string,
  sort: SortKey = 'newest',
  search?: string,
  highlight?: HighlightKey,
) {
  const API_URL = getServerApiBaseUrl();
  const query = buildProductsQuery(category, sort, search, highlight);
  const subPath = encodeURIComponent(subdomain);

  // Store fetch must succeed; connection errors should 404, not crash the RSC.
  const storeRes = await fetch(
    buildPublicStoreBySubdomainUrl(API_URL, subdomain),
    PUBLIC_STORE_FETCH_INIT,
  ).catch(() => null);
  if (!storeRes?.ok) notFound();
  const storeData = await storeRes.json();

  let products: Product[] = [];
  let total = 0;
  try {
    const productsRes = await fetch(`${API_URL}/api/v1/products/public/${subPath}?${query}`, {
      next: { revalidate: 30 },
    });
    if (productsRes.ok) {
      const p = await productsRes.json();
      products = p.products ?? [];
      total = p.pagination?.total ?? products.length;
    }
  } catch {
    // API unreachable from this runtime (e.g. wrong INTERNAL_API_URL) — still render store shell with empty grid
  }

  return { store: storeData.store, products, total };
}

export async function generateMetadata({
  params,
  searchParams = {},
}: {
  params: { subdomain: string };
  searchParams?: { category?: string; sort?: string; q?: string; highlight?: string };
}): Promise<Metadata> {
  const sortRaw = searchParams.sort as SortKey | undefined;
  const sort: SortKey =
    sortRaw === 'price_asc' || sortRaw === 'price_desc' || sortRaw === 'name' || sortRaw === 'newest'
      ? sortRaw
      : 'newest';
  const hl =
    searchParams.highlight === 'featured' || searchParams.highlight === 'new'
      ? searchParams.highlight
      : undefined;
  const { store } = await getData(params.subdomain, searchParams.category, sort, searchParams.q, hl);
  const cat = searchParams.category;
  const titleSuffix =
    hl === 'featured' ? 'Featured' : hl === 'new' ? 'New arrivals' : cat ? cat : 'Shop';
  return {
    title: `${titleSuffix} — ${store.name}`,
    description: store.settings?.seo?.description || store.description || `Shop products at ${store.name}`,
  };
}

/** Theme color does not depend on filters — avoid extra coupling to searchParams (can be undefined during metadata resolution). */
export async function generateViewport({ params }: { params: { subdomain: string } }): Promise<Viewport> {
  const { store } = await getData(params.subdomain, undefined, 'newest', undefined);
  return { themeColor: resolveBrandPrimaryColor(store.settings?.theme) };
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A–Z' },
];

export default async function StoreProductsPage({
  params,
  searchParams = {},
}: {
  params: { subdomain: string };
  searchParams?: { category?: string; sort?: string; q?: string; highlight?: string };
}) {
  const { subdomain } = params;
  const category = searchParams.category;
  const q = searchParams.q ?? '';
  const sortRaw = searchParams.sort as SortKey | undefined;
  const sort: SortKey =
    sortRaw === 'price_asc' || sortRaw === 'price_desc' || sortRaw === 'name' || sortRaw === 'newest'
      ? sortRaw
      : 'newest';
  const highlight: HighlightKey | undefined =
    searchParams.highlight === 'featured' || searchParams.highlight === 'new'
      ? searchParams.highlight
      : undefined;

  const { store, products, total } = await getData(subdomain, category, sort, q, highlight);
  const currency = store.settings.currency;
  const primaryColor = resolveBrandPrimaryColor(store.settings.theme);
  const fontFamily = store.settings.theme.fontFamily;
  const templateId = store.settings.theme.template ?? 'minimal';
  const cfg = getTemplateConfig(templateId);
  const layout = getStorefrontTemplateLayout(templateId);
  const site = store.settings.site;
  const logoUrl = site?.logoUrl || store.logo;
  const menuCats = site?.menuCategories?.filter((c: { label: string; category: string }) => c.label && c.category) ?? [];
  const logoSrc = logoUrl ? assetUrl(logoUrl) : '';

  const breadcrumbChrome = resolveBreadcrumbChrome(primaryColor, cfg, store.settings?.site?.breadcrumb ?? undefined);

  const textMuted = 'text-neutral-500';
  const productTitleColor = 'text-neutral-900';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          '--primary': primaryColor,
          backgroundColor: cfg.bodyBg,
          fontFamily: fontFamily ? `${fontFamily}, system-ui, sans-serif` : undefined,
        } as React.CSSProperties
      }
    >
      <StorefrontNav
        subdomain={subdomain}
        storeName={store.name}
        logoSrc={logoSrc || undefined}
        primaryColor={primaryColor}
        navBg={cfg.navBg}
        navText={cfg.navText}
        navBorder={cfg.navBorder}
        menuCats={menuCats}
        variant={layout.navVariant}
      />

      <StoreBreadcrumb
        chrome={breadcrumbChrome}
        segments={[
          { type: 'link', href: `/store/${subdomain}`, label: 'Home' },
          { type: 'link', href: `/store/${subdomain}/products`, label: 'Shop' },
          ...(highlight === 'featured'
            ? [{ type: 'current' as const, label: 'Featured' }]
            : highlight === 'new'
              ? [{ type: 'current' as const, label: 'New arrivals' }]
              : category
                ? [{ type: 'current' as const, label: category }]
                : []),
        ]}
      />

      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: cfg.navBorder, backgroundColor: cfg.heroBg }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 border-l-4 pl-5 sm:pl-6 sm:border-l-[6px]" style={{ borderLeftColor: primaryColor }}>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] mb-2" style={{ color: primaryColor }}>
            {store.name}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            {highlight === 'featured'
              ? 'Featured products'
              : highlight === 'new'
                ? 'New arrivals'
                : category
                  ? category
                  : 'All products'}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-2xl">
            {highlight === 'featured'
              ? 'Hand-picked highlights from our catalog.'
              : highlight === 'new'
                ? 'The latest additions to our store.'
                : category
                  ? `Browse our ${category.toLowerCase()} collection.`
                  : 'Discover everything we offer — curated for quality and value.'}
          </p>
          <p className="mt-4 text-sm font-medium tabular-nums text-neutral-500">
            {total === 1 ? '1 product' : `${total} products`}
          </p>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b backdrop-blur-md bg-white/80" style={{ borderColor: cfg.navBorder }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-2">
          <Link
            href={catalogHref(subdomain, { sort, q })}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              !highlight ? 'text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            style={!highlight ? { backgroundColor: primaryColor } : undefined}
          >
            All products
          </Link>
          <Link
            href={catalogHref(subdomain, { sort, q, highlight: 'featured' })}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              highlight === 'featured' ? 'text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            style={highlight === 'featured' ? { backgroundColor: primaryColor } : undefined}
          >
            Featured
          </Link>
          <Link
            href={catalogHref(subdomain, { sort, q, highlight: 'new' })}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              highlight === 'new' ? 'text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            style={highlight === 'new' ? { backgroundColor: primaryColor } : undefined}
          >
            New arrivals
          </Link>
        </div>
      </div>

      {menuCats.length > 0 && (
        <div className="sticky top-0 z-20 border-b backdrop-blur-md bg-white/90" style={{ borderColor: cfg.navBorder }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
            <Link
              href={catalogHref(subdomain, { sort, q, highlight })}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                !category ? 'text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              style={!category ? { backgroundColor: primaryColor } : undefined}
            >
              All categories
            </Link>
            {menuCats.map((m: { label: string; category: string }) => (
              <Link
                key={m.category}
                href={catalogHref(subdomain, { category: m.category, sort, q, highlight })}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  category === m.category ? 'text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                style={category === m.category ? { backgroundColor: primaryColor } : undefined}
              >
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 flex-1 w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <form
            action={`/store/${subdomain}/products`}
            method="get"
            className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1 max-w-xl"
          >
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
            {(highlight === 'featured' || highlight === 'new') && (
              <input type="hidden" name="highlight" value={highlight} />
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search products…"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-200 bg-white text-sm shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--primary)]"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl text-sm font-semibold text-white shrink-0 shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500 mr-1 hidden sm:inline">Sort</span>
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.key;
              return (
                <Link
                  key={opt.key}
                  href={catalogHref(subdomain, { category, sort: opt.key, q, highlight })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                  style={active ? { backgroundColor: primaryColor } : undefined}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 py-20 px-6 text-center">
            <p className="text-neutral-500 text-lg font-medium mb-2">No products match your filters</p>
            <p className={`${textMuted} text-sm mb-6 max-w-md mx-auto`}>
              Try another category, clear your search, or browse the full catalog.
            </p>
            <Link
              href={`/store/${subdomain}/products`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              View all products
            </Link>
          </div>
        ) : (
          <FeaturedProductCards
            products={products}
            subdomain={subdomain}
            currency={currency}
            productTitleColor={productTitleColor}
            primaryColor={primaryColor}
            gridVariant={layout.productGrid}
          />
        )}
      </div>

      <StoreNewsletter
        storeName={store.name}
        primaryColor={primaryColor}
        backgroundColor={cfg.newsletterBg ?? cfg.bodyBg}
        textColor={cfg.navText}
        variant={layout.newsletter}
      />

      <StorefrontFooter subdomain={subdomain} storeName={store.name} cfg={cfg} layout={layout} />
    </div>
  );
}
