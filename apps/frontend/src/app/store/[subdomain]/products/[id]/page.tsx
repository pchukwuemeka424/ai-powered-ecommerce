import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package, RotateCcw, Truck } from 'lucide-react';
import { AddToCartButton } from './client';
import { PUBLIC_STORE_FETCH_INIT, buildPublicStoreBySubdomainUrl } from '@/lib/storefront-sync';
import { getServerApiBaseUrl } from '@/lib/server-api-url';
import { assetUrl } from '@/lib/asset-url';
import type { BreadcrumbThemeInput } from '@/lib/storefront-theme';
import { getTemplateConfig, resolveBrandPrimaryColor, resolveBreadcrumbChrome } from '@/lib/storefront-theme';
import { getStorefrontTemplateLayout } from '@/lib/storefront-template-layouts';
import { StorefrontNav } from '@/components/store/storefront-nav';
import { StoreBreadcrumb } from '@/components/store/store-breadcrumb';
import { formatPrice } from '@/lib/format-price';
import { ProductGallery } from '@/components/store/product-gallery';
import { FeaturedProductCards } from '@/components/store/featured-product-cards';
import { StoreNewsletter } from '@/components/store/store-newsletter';
import { StorefrontFooter } from '@/components/store/storefront-footer';

interface ProductRecord {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags?: string[];
  inventory: number;
}

async function getProduct(subdomain: string, id: string) {
  const API_URL = getServerApiBaseUrl();
  const res = await fetch(`${API_URL}/api/v1/products/public/${subdomain}/${id}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) notFound();
  return res.json() as Promise<{ product: ProductRecord }>;
}

async function getStore(subdomain: string) {
  const API_URL = getServerApiBaseUrl();
  const res = await fetch(buildPublicStoreBySubdomainUrl(API_URL, subdomain), PUBLIC_STORE_FETCH_INIT);
  if (!res.ok) notFound();
  const data = await res.json();
  return data.store as {
    name: string;
    logo?: string;
    settings: {
      currency: string;
      theme: { primaryColor: string; template?: string; fontFamily?: string };
      site?: {
        logoUrl?: string;
        menuCategories?: { label: string; category: string }[];
        breadcrumb?: BreadcrumbThemeInput;
      };
    };
  };
}

async function getRelatedProducts(subdomain: string, category: string, excludeId: string) {
  const API_URL = getServerApiBaseUrl();
  const qs = new URLSearchParams({ category, limit: '12', sort: 'newest' });
  const res = await fetch(`${API_URL}/api/v1/products/public/${subdomain}?${qs}`, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const data = await res.json();
  const list = (data.products ?? []) as ProductRecord[];
  return list.filter((p) => p._id !== excludeId).slice(0, 4);
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string; id: string };
}): Promise<Metadata> {
  try {
    const { product } = await getProduct(params.subdomain, params.id);
    return { title: product.name, description: product.description };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export async function generateViewport({ params }: { params: { subdomain: string; id: string } }): Promise<Viewport> {
  try {
    const store = await getStore(params.subdomain);
    return { themeColor: resolveBrandPrimaryColor(store.settings.theme) };
  } catch {
    return {};
  }
}

export default async function ProductPage({
  params,
}: {
  params: { subdomain: string; id: string };
}) {
  const [{ product }, store] = await Promise.all([
    getProduct(params.subdomain, params.id),
    getStore(params.subdomain),
  ]);

  const related =
    product.category?.trim() !== ''
      ? await getRelatedProducts(params.subdomain, product.category, product._id)
      : [];

  const { subdomain } = params;
  const currency = store.settings.currency;
  const templateId = store.settings.theme.template ?? 'minimal';
  const cfg = getTemplateConfig(templateId);
  const layout = getStorefrontTemplateLayout(templateId);
  const primaryColor = resolveBrandPrimaryColor(store.settings.theme);
  const fontFamily = store.settings.theme.fontFamily;
  const site = store.settings.site;
  const logoUrl = site?.logoUrl || store.logo;
  const menuCats = site?.menuCategories?.filter((c) => c.label && c.category) ?? [];
  const logoSrc = logoUrl ? assetUrl(logoUrl) : '';

  const breadcrumbChrome = resolveBreadcrumbChrome(primaryColor, cfg, store.settings?.site?.breadcrumb ?? undefined);

  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = isOnSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const titleColor = 'text-neutral-900';
  const muted = 'text-neutral-600';
  const subtle = 'text-neutral-500';
  const productTitleColor = 'text-neutral-900';
  const textMuted = 'text-neutral-500';

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
          ...(product.category?.trim()
            ? [
                {
                  type: 'link' as const,
                  href: `/store/${subdomain}/products?category=${encodeURIComponent(product.category)}`,
                  label: product.category,
                },
              ]
            : []),
          { type: 'current', label: product.name },
        ]}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images ?? []} productName={product.name} primaryColor={primaryColor} />
          </div>

          <div className="lg:col-span-5 flex flex-col lg:sticky lg:top-24 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.category?.trim() && (
                  <Link
                    href={`/store/${subdomain}/products?category=${encodeURIComponent(product.category)}`}
                    className={`text-xs font-semibold uppercase tracking-wider ${subtle} hover:opacity-80`}
                  >
                    {product.category}
                  </Link>
                )}
                {isOnSale && (
                  <span
                    className="text-xs font-bold text-white px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-4 ${titleColor}`}>{product.name}</h1>

              <div className="flex items-baseline gap-3 flex-wrap mb-6">
                <p className={`text-3xl sm:text-4xl font-bold tabular-nums ${titleColor}`}>
                  {formatPrice(product.price, currency)}
                </p>
                {product.compareAtPrice != null && (
                  <p className={`text-lg line-through ${subtle}`}>{formatPrice(product.compareAtPrice, currency)}</p>
                )}
              </div>

              <p className={`${muted} text-base leading-relaxed`}>{product.description}</p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-200 bg-white/80 text-neutral-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur-sm p-4 shadow-sm">
              {product.inventory > 0 ? (
                <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                  In stock — {product.inventory} available
                </p>
              ) : (
                <p className="text-sm font-semibold text-red-600">Currently out of stock</p>
              )}
            </div>

            <AddToCartButton product={product} subdomain={subdomain} primaryColor={primaryColor} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, t: 'Fast shipping', s: 'Tracked delivery' },
                { icon: RotateCcw, t: 'Easy returns', s: '30-day policy' },
                { icon: Package, t: 'Secure checkout', s: 'Encrypted payment' },
              ].map(({ icon: Icon, t, s }) => (
                <div
                  key={t}
                  className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white/60 p-3"
                >
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className={`text-xs font-bold ${titleColor}`}>{t}</p>
                    <p className={`text-[11px] ${subtle}`}>{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20 md:mt-28 pt-12 border-t" style={{ borderColor: cfg.navBorder }}>
            <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-1">You may also like</p>
                <h2 className={`text-2xl font-bold ${productTitleColor}`}>Related products</h2>
              </div>
              <Link
                href={`/store/${subdomain}/products?category=${encodeURIComponent(product.category)}`}
                className={`text-sm font-semibold ${subtle} hover:text-neutral-800`}
              >
                View category →
              </Link>
            </div>
            <FeaturedProductCards
              products={related}
              subdomain={subdomain}
              currency={currency}
              productTitleColor={productTitleColor}
              primaryColor={primaryColor}
              gridVariant={layout.productGrid}
            />
          </section>
        )}
      </main>

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
