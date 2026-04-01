'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { getCartCount, cartStorageKey } from '@/lib/storefront-cart';
import type { MenuCategory } from '@/lib/storefront-theme';
import type { SidebarLayoutId } from '@/lib/storefront-template-layouts';

interface SidebarProps {
  variant: SidebarLayoutId;
  subdomain: string;
  storeName: string;
  menuCats: MenuCategory[];
  navText: string;
  bodyBg: string;
  primaryColor: string;
  /** Shown in artisan rail header when set */
  logoSrc?: string;
}

export function StorefrontSidebar({
  variant,
  subdomain,
  storeName,
  menuCats,
  navText,
  bodyBg,
  primaryColor,
  logoSrc,
}: SidebarProps) {
  if (variant === 'none') return null;

  const catLinks = (
    <ul className="space-y-1">
      {menuCats.map((m) => (
        <li key={m.category}>
          <Link
            href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
            className="block py-2 px-2 rounded-md text-sm hover:opacity-80 transition-opacity"
            style={{ color: navText }}
          >
            {m.label}
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={`/store/${subdomain}/products`}
          className="block py-2 px-2 rounded-md text-sm font-semibold opacity-90 hover:opacity-100"
          style={{ color: navText }}
        >
          View all
        </Link>
      </li>
    </ul>
  );

  if (variant === 'market-catalog') {
    return (
      <aside className="w-full lg:w-56 shrink-0">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Departments</p>
        <div className="border border-neutral-200 rounded-lg p-3 bg-white shadow-sm">{catLinks}</div>
      </aside>
    );
  }

  if (variant === 'bold-editorial') {
    return (
      <aside className="w-full lg:w-52 shrink-0">
        <div className="rounded-lg bg-neutral-900 text-white p-5 lg:sticky lg:top-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">The edit</p>
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link href={`/store/${subdomain}`} className="hover:text-white/80">
              Home
            </Link>
            {menuCats.map((m) => (
              <Link key={m.category} href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`} className="hover:text-white/80">
                {m.label}
              </Link>
            ))}
            <Link href={`/store/${subdomain}/products`} className="hover:text-white/80 border-t border-white/10 pt-3 mt-1">
              Shop all
            </Link>
          </nav>
        </div>
      </aside>
    );
  }

  if (variant === 'boutique-story') {
    return (
      <aside className="w-full lg:w-64 shrink-0 order-first lg:order-last">
        <div className="lg:sticky lg:top-24 border border-neutral-200 bg-white p-6 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Journal</p>
          <p className="text-sm italic text-neutral-600 leading-relaxed">&ldquo;Curated pieces for those who dress with intention.&rdquo;</p>
          <Link href={`/store/${subdomain}/products`} className="inline-block text-xs font-semibold uppercase tracking-wider border-b border-current pb-0.5" style={{ color: navText }}>
            Shop collection
          </Link>
        </div>
      </aside>
    );
  }

  if (variant === 'studio-filters') {
    return (
      <aside className="w-full lg:w-52 shrink-0">
        <div className="border border-slate-200 rounded-lg bg-slate-50/80 p-4 lg:sticky lg:top-24 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Sort</p>
            <select className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white" disabled aria-label="Sort">
              <option>Featured</option>
              <option>Price: low to high</option>
              <option>Newest</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Category</p>
            <div className="text-sm text-slate-700">{catLinks}</div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Price</p>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded border border-slate-200 bg-white">Under ₦10k</span>
              <span className="px-2 py-1 rounded border border-slate-200 bg-white">₦10k–50k</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (variant === 'organic-values') {
    return (
      <aside className="w-full lg:w-56 shrink-0">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-3">Our values</p>
          <ul className="text-sm text-emerald-900/90 space-y-2 mb-5">
            <li>Plastic-free packaging</li>
            <li>Ethically sourced</li>
            <li>Carbon-neutral shipping</li>
          </ul>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">Shop by category</p>
          {catLinks}
        </div>
      </aside>
    );
  }

  if (variant === 'fresh-spotlight') {
    return (
      <aside className="w-full lg:w-52 shrink-0">
        <div
          className="rounded-2xl p-5 text-white lg:sticky lg:top-24 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="text-xs font-bold uppercase tracking-wider opacity-90">Spotlight</p>
          <p className="text-lg font-extrabold mt-2 leading-tight">Drop of the week</p>
          <p className="text-sm opacity-90 mt-2 mb-4">Fresh styles added daily.</p>
          <Link href={`/store/${subdomain}/products`} className="inline-block text-xs font-bold bg-white/20 hover:bg-white/30 rounded-full px-4 py-2">
            Shop now
          </Link>
        </div>
        <div className="mt-4 hidden lg:block border border-rose-100 rounded-xl p-3 bg-white">
          <p className="text-xs font-bold text-neutral-500 mb-2">Quick links</p>
          {catLinks}
        </div>
      </aside>
    );
  }

  if (variant === 'artisan-rail') {
    return (
      <ArtisanRailAside
        subdomain={subdomain}
        storeName={storeName}
        menuCats={menuCats}
        navText={navText}
        bodyBg={bodyBg}
        primaryColor={primaryColor}
        logoSrc={logoSrc}
      />
    );
  }

  return null;
}

function ArtisanRailAside({
  subdomain,
  storeName,
  menuCats,
  navText,
  bodyBg,
  primaryColor,
  logoSrc,
}: {
  subdomain: string;
  storeName: string;
  menuCats: MenuCategory[];
  navText: string;
  bodyBg: string;
  primaryColor: string;
  logoSrc?: string;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function sync() {
      setCount(getCartCount(subdomain));
    }
    sync();
    function onCartUpdate(e: Event) {
      const ce = e as CustomEvent<{ subdomain?: string }>;
      if (ce.detail?.subdomain != null && ce.detail.subdomain !== subdomain) return;
      sync();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === cartStorageKey(subdomain)) sync();
    }
    window.addEventListener('cart-updated', onCartUpdate as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart-updated', onCartUpdate as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [subdomain]);

  return (
    <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-r min-h-screen sticky top-0" style={{ borderColor: `${navText}20`, backgroundColor: bodyBg }}>
      <div className="p-6 md:p-8 border-b" style={{ borderColor: `${navText}15` }}>
        <Link href={`/store/${subdomain}`} className="block">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-12 md:h-14 w-auto max-w-[220px] object-contain object-left" />
          ) : (
            <span className="font-serif text-lg md:text-xl tracking-wide" style={{ color: navText }}>
              {storeName}
            </span>
          )}
        </Link>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1 text-sm font-serif">
        <Link href={`/store/${subdomain}`} className="py-2 px-3 rounded-md hover:bg-black/5" style={{ color: navText }}>
          Home
        </Link>
        {menuCats.map((m) => (
          <Link
            key={m.category}
            href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
            className="py-2 px-3 rounded-md hover:bg-black/5"
            style={{ color: navText }}
          >
            {m.label}
          </Link>
        ))}
        <Link href={`/store/${subdomain}/products`} className="py-2 px-3 rounded-md hover:bg-black/5 font-semibold" style={{ color: navText }}>
          All pieces
        </Link>
      </nav>
      <div className="p-4 border-t space-y-3" style={{ borderColor: `${navText}15` }}>
        <Link href={`/store/${subdomain}/checkout`} className="flex items-center gap-2 text-sm font-semibold" style={{ color: primaryColor }}>
          <ShoppingBag size={20} />
          Cart
          {count > 0 && (
            <span className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
        <p className="text-xs text-neutral-600">Small-batch goods from independent makers.</p>
      </div>
    </aside>
  );
}
