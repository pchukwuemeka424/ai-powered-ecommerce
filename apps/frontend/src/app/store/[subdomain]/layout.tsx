import type { ReactNode } from 'react';

/**
 * Storefront routes must not be statically cached; brand color / theme updates from the dashboard
 * should appear on refresh without stale HTML.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function StoreSubdomainLayout({ children }: { children: ReactNode }) {
  return children;
}
