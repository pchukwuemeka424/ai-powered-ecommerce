import Link from 'next/link';
import type { TemplateConfig } from '@/lib/storefront-theme';
import type { StorefrontTemplateLayout } from '@/lib/storefront-template-layouts';

export function StorefrontFooter({
  subdomain,
  storeName,
  cfg,
  layout,
}: {
  subdomain: string;
  storeName: string;
  cfg: TemplateConfig;
  layout: StorefrontTemplateLayout;
}) {
  return (
    <footer
      className={`border-t py-8 ${layout.footer === 'split' ? 'bg-neutral-50' : ''}`}
      style={{
        backgroundColor: layout.footer === 'split' ? undefined : cfg.footerBg,
        borderColor: cfg.navBorder,
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {layout.footer === 'split' ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-xs" style={{ color: cfg.footerText }}>
            <p className="opacity-80">
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 opacity-60">
              <Link href={`/store/${subdomain}/products`} className="hover:opacity-100">
                Shop
              </Link>
              <span className="text-neutral-300">|</span>
              <span>Powered by Agentic Commerce</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs" style={{ color: cfg.footerText, opacity: 0.5 }}>
            <p>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>
            <p>Powered by Agentic Commerce</p>
          </div>
        )}
      </div>
    </footer>
  );
}
