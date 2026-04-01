import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { assetUrl } from '@/lib/asset-url';
import { PUBLIC_STORE_FETCH_INIT, buildPublicStoreBySubdomainUrl } from '@/lib/storefront-sync';
import { getServerApiBaseUrl } from '@/lib/server-api-url';
import { getTemplateConfig, resolveBrandPrimaryColor } from '@/lib/storefront-theme';
import { getStorefrontTemplateLayout } from '@/lib/storefront-template-layouts';
import { StorefrontNav } from '@/components/store/storefront-nav';
import { CheckoutForm } from '@/components/store/checkout-form';

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

async function getPaymentMethods(subdomain: string) {
  const API_URL = getServerApiBaseUrl();
  const res = await fetch(`${API_URL}/api/v1/payments/public/${subdomain}/methods`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.methods ?? []) as Array<{
    type: string;
    enabled: boolean;
    config?: Record<string, string>;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  try {
    const store = await getStore(params.subdomain);
    return {
      title: `Checkout — ${store.name}`,
    };
  } catch {
    return { title: 'Checkout' };
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

export default async function CheckoutPage({ params }: { params: { subdomain: string } }) {
  const { subdomain } = params;
  const [store, paymentMethods] = await Promise.all([getStore(subdomain), getPaymentMethods(subdomain)]);
  const templateId = store.settings.theme.template ?? 'minimal';
  const cfg = getTemplateConfig(templateId);
  const layout = getStorefrontTemplateLayout(templateId);
  const primaryColor = resolveBrandPrimaryColor(store.settings.theme);
  const fontFamily = store.settings.theme.fontFamily;
  const site = store.settings.site;
  const logoUrl = site?.logoUrl || store.logo;
  const menuCats = site?.menuCategories?.filter((c) => c.label && c.category) ?? [];
  const logoSrc = logoUrl ? assetUrl(logoUrl) : '';

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

      <div className="border-b px-4 py-3" style={{ borderColor: cfg.navBorder }}>
        <h1 className="text-2xl font-bold text-center text-neutral-900">Checkout</h1>
      </div>

      <CheckoutForm
        subdomain={subdomain}
        storeName={store.name}
        currency={store.settings.currency}
        primaryColor={primaryColor}
        navText={cfg.navText}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
