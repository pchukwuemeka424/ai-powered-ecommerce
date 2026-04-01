import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assetUrl } from '@/lib/asset-url';
import { PUBLIC_STORE_FETCH_INIT, buildPublicStoreBySubdomainUrl } from '@/lib/storefront-sync';
import { getServerApiBaseUrl } from '@/lib/server-api-url';
import { getTemplateConfig, resolveBrandPrimaryColor } from '@/lib/storefront-theme';
import { getStorefrontTemplateLayout } from '@/lib/storefront-template-layouts';
import { StorefrontNav } from '@/components/store/storefront-nav';

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
      site?: { logoUrl?: string; menuCategories?: { label: string; category: string }[] };
    };
  };
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  try {
    const store = await getStore(params.subdomain);
    return {
      title: `Order placed — ${store.name}`,
    };
  } catch {
    return { title: 'Thank you' };
  }
}

export async function generateViewport({ params }: { params: { subdomain: string } }): Promise<Viewport> {
  try {
    const store = await getStore(params.subdomain);
    return { themeColor: resolveBrandPrimaryColor(store.settings.theme) };
  } catch {
    return {};
  }
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: { subdomain: string };
  searchParams: { order?: string; manual?: string };
}) {
  const { subdomain } = params;
  const orderNumber = searchParams.order ?? '';
  const isManual = searchParams.manual === '1';
  const store = await getStore(subdomain);
  const templateId = store.settings.theme.template ?? 'minimal';
  const cfg = getTemplateConfig(templateId);
  const layout = getStorefrontTemplateLayout(templateId);
  const primaryColor = resolveBrandPrimaryColor(store.settings.theme);
  const fontFamily = store.settings.theme.fontFamily;
  const site = store.settings.site;
  const logoUrl = site?.logoUrl || store.logo;
  const menuCats = site?.menuCategories?.filter((c) => c.label && c.category) ?? [];
  const logoSrc = logoUrl ? assetUrl(logoUrl) : '';
  const titleColor = 'text-neutral-900';
  const muted = 'text-neutral-500';

  return (
    <div
      className="min-h-screen"
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

      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6 text-2xl"
          style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
        >
          ✓
        </div>
        <h1 className={`text-2xl font-bold ${titleColor}`}>Thank you for your order</h1>
        {orderNumber && (
          <p className={`mt-2 text-sm ${muted}`}>
            Order reference: <span className="font-mono font-semibold">{orderNumber}</span>
          </p>
        )}
        <p className={`mt-4 text-sm ${muted}`}>
          {isManual
            ? `${store.name} has received your transfer proof. The team will verify payment and process your order shortly.`
            : `${store.name} has received your order. You may get a confirmation email shortly.`}
        </p>
        <Link
          href={`/store/${subdomain}/products`}
          className="inline-block mt-10 text-sm font-semibold underline underline-offset-4"
          style={{ color: primaryColor }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
