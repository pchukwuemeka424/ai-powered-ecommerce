/**
 * Dashboard → public storefront + Preview iframe
 *
 * After any API change that affects what shoppers see, call `notifyStorefrontUpdated()`.
 * That bumps a timestamp in localStorage and dispatches a window event so:
 * - Preview iframe reloads (same tab or cross-tab via storage event)
 * - Future listeners can react without coupling to specific pages
 *
 * New dashboard features that persist to the store should call this after a successful save.
 */
export const STOREFRONT_SYNC_EVENT = 'storefront-settings-updated';

/** @deprecated Use STOREFRONT_SYNC_EVENT — same string, kept for existing imports */
export const STOREFRONT_THEME_UPDATED_EVENT = STOREFRONT_SYNC_EVENT;

/** Primary key; `theme_saved_at` kept in sync for older code paths */
export const STOREFRONT_SYNC_STORAGE_KEY = 'storefront_sync_at';

const LEGACY_SYNC_STORAGE_KEY = 'theme_saved_at';

export function normalizeThemePrimaryColor(hex: string): string {
  const s = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/i.test(s)) return s;
  return s.toLowerCase();
}

/** Call after successful PATCH to store settings that affect the public storefront or preview. */
export function notifyStorefrontUpdated(): void {
  if (typeof window === 'undefined') return;
  const ts = Date.now().toString();
  try {
    localStorage.setItem(STOREFRONT_SYNC_STORAGE_KEY, ts);
    localStorage.setItem(LEGACY_SYNC_STORAGE_KEY, ts);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(STOREFRONT_SYNC_EVENT, { detail: { at: ts } }));
  window.dispatchEvent(new CustomEvent('storefront-theme-updated', { detail: { at: ts } }));
}

/** @deprecated Use notifyStorefrontUpdated */
export const notifyStorefrontThemeUpdated = notifyStorefrontUpdated;

/** Use for server-side fetch of public store JSON so CDN/proxy caches do not serve stale theme. */
export const PUBLIC_STORE_FETCH_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store',
    Pragma: 'no-cache',
  },
};

/** Full URL for GET store by subdomain — includes a cache-bust query (theme must stay fresh). */
export function buildPublicStoreBySubdomainUrl(apiBaseUrl: string, subdomain: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/api/v1/stores/by-subdomain/${encodeURIComponent(subdomain)}?_=${Date.now()}`;
}
