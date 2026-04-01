'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { getCartCount, cartStorageKey } from '@/lib/storefront-cart';
import type { MenuCategory } from '@/lib/storefront-theme';
import type { HeaderLayoutId } from '@/lib/storefront-template-layouts';

export interface StorefrontHeaderProps {
  subdomain: string;
  storeName: string;
  logoSrc?: string;
  primaryColor: string;
  navBg: string;
  navText: string;
  navBorder: string;
  menuCats: MenuCategory[];
  headerLayout: HeaderLayoutId;
}

export function StorefrontHeader({
  subdomain,
  storeName,
  logoSrc,
  primaryColor,
  navBg,
  navText,
  navBorder,
  menuCats,
  headerLayout,
}: StorefrontHeaderProps) {
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

  const NavLinks = ({
    className,
    uppercase,
  }: {
    className?: string;
    uppercase?: boolean;
  }) => (
    <>
      <Link href={`/store/${subdomain}`} className={clsx('opacity-80 hover:opacity-100 transition-opacity', className)} style={{ color: navText }}>
        {uppercase ? 'HOME' : 'Home'}
      </Link>
      {menuCats.map((m) => (
        <Link
          key={m.category + m.label}
          href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
          className={clsx('opacity-80 hover:opacity-100 transition-opacity', className)}
          style={{ color: navText }}
        >
          {m.label}
        </Link>
      ))}
      <Link href={`/store/${subdomain}/products`} className={clsx('opacity-80 hover:opacity-100 transition-opacity', className)} style={{ color: navText }}>
        {uppercase ? 'SHOP ALL' : 'All products'}
      </Link>
    </>
  );

  const CartBtn = ({ compact, label }: { compact?: boolean; label?: string }) => (
    <Link
      href={`/store/${subdomain}/checkout`}
      className="relative flex items-center gap-1.5 text-sm font-medium shrink-0 py-1"
      style={{ color: primaryColor }}
    >
      <span className="relative inline-flex">
        <ShoppingBag size={compact ? 20 : 22} strokeWidth={headerLayout === 'studio-dual' ? 1.5 : 2} />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white leading-none"
            style={{ backgroundColor: primaryColor }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">{label ?? (headerLayout === 'market-tier' ? 'Basket' : 'Cart')}</span>
    </Link>
  );

  /* ═══ minimal-strip — editorial rail + airy bar ═══ */
  if (headerLayout === 'minimal-strip') {
    return (
      <header className="sticky top-0 z-40 backdrop-blur-sm" style={{ backgroundColor: `${navBg}f2`, borderBottom: `1px solid ${navBorder}` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[3.75rem] md:min-h-[4.25rem] flex items-center justify-between gap-4 border-l-[3px] pl-5 md:pl-7" style={{ borderLeftColor: primaryColor }}>
          <Link href={`/store/${subdomain}`} className="flex items-center gap-2 min-w-0 shrink-0 py-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-9 md:h-11 w-auto max-w-[220px] object-contain object-left" />
            ) : (
              <span className="font-semibold text-base md:text-lg tracking-tight truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <NavLinks uppercase />
          </nav>
          <CartBtn compact />
        </div>
      </header>
    );
  }

  /* ═══ bold-accent — heavy brand bar + offset shadow row ═══ */
  if (headerLayout === 'bold-accent') {
    return (
      <header className="sticky top-0 z-40 shadow-[0_4px_0_0_rgba(0,0,0,0.06)]">
        <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} aria-hidden />
        <div className="border-b" style={{ backgroundColor: navBg, borderColor: navBorder }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[5rem] flex items-center justify-between gap-6">
            <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0 py-2">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-11 md:h-14 w-auto max-w-[260px] object-contain object-left" />
              ) : (
                <span className="font-black text-xl md:text-2xl tracking-tighter truncate uppercase" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-wide">
              <NavLinks className="underline-offset-[6px] decoration-2 hover:underline" />
            </nav>
            <CartBtn />
          </div>
        </div>
      </header>
    );
  }

  /* ═══ market-tier — catalog top strip + category deck ═══ */
  if (headerLayout === 'market-tier') {
    return (
      <header className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="min-h-[3.5rem] md:min-h-[4rem] flex items-center justify-between gap-4 border-b border-neutral-100">
            <Link href={`/store/${subdomain}`} className="flex items-center gap-2 min-w-0 shrink-0 py-2">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-9 md:h-11 w-auto max-w-[200px] object-contain object-left" />
              ) : (
                <span className="font-bold text-lg md:text-xl truncate" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Store</span>
              <CartBtn compact />
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 py-3 text-xs font-semibold overflow-x-auto bg-neutral-50/90 border-t border-neutral-100/80 -mx-4 md:-mx-6 px-4 md:px-6">
            <NavLinks className="px-3 py-2 rounded-md hover:bg-white border border-transparent hover:border-neutral-200" />
          </nav>
        </div>
      </header>
    );
  }

  /* ═══ boutique-masthead — runway center + hairline frame ═══ */
  if (headerLayout === 'boutique-masthead') {
    return (
      <header className="sticky top-0 z-40 relative" style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}>
        <div className="absolute right-4 top-5 md:right-10 md:top-8 z-10">
          <CartBtn />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 w-full justify-center mb-6">
            <span className="h-px w-10 md:w-16 bg-neutral-300" aria-hidden />
            <Link href={`/store/${subdomain}`} className="shrink">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-14 md:h-[4.5rem] w-auto max-w-[min(320px,85vw)] object-contain mx-auto" />
              ) : (
                <span className="font-light text-3xl md:text-4xl tracking-[0.28em] uppercase block" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <span className="h-px w-10 md:w-16 bg-neutral-300" aria-hidden />
          </div>
          <nav className="hidden md:flex items-center justify-center gap-12 text-sm font-light tracking-[0.18em]">
            <NavLinks />
          </nav>
        </div>
      </header>
    );
  }

  /* ═══ studio-dual — spec strip + tool row (solid surfaces) ═══ */
  if (headerLayout === 'studio-dual') {
    return (
      <header className="sticky top-0 z-40" style={{ borderColor: navBorder }}>
        <div className="bg-slate-100 border-b border-slate-200 text-center py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Warranty · Fast dispatch · Secure checkout
        </div>
        <div className="border-b bg-white" style={{ borderColor: navBorder }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center gap-4 md:gap-6 flex-wrap">
            <Link href={`/store/${subdomain}`} className="shrink-0 flex items-center border-l-4 border-slate-800 pl-4 py-1">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[200px] object-contain object-left" />
              ) : (
                <span className="font-bold text-base tracking-tight" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <div className="hidden md:flex flex-1 max-w-lg items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500 text-sm">
              <Search size={18} strokeWidth={1.5} className="shrink-0" />
              <span className="truncate">Search products…</span>
            </div>
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.1em] ml-auto">
              <NavLinks />
            </nav>
            <CartBtn />
          </div>
        </div>
      </header>
    );
  }

  /* ═══ organic-stack — soft elevated capsule ═══ */
  if (headerLayout === 'organic-stack') {
    return (
      <div className="px-4 pt-6 pb-0 max-w-6xl mx-auto">
        <header
          className="rounded-[1.75rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-2 border-emerald-100/90 px-5 py-4 md:px-8 md:py-5 flex items-center justify-between gap-4 sticky top-4 z-40"
          style={{ backgroundColor: navBg, borderColor: `${navBorder}` }}
        >
          <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0 gap-3">
            <span className="hidden sm:block w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} aria-hidden />
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <span className="font-semibold text-xl md:text-2xl truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <NavLinks />
          </nav>
          <CartBtn />
        </header>
      </div>
    );
  }

  /* ═══ fresh-banner-row — solid promo + playful main bar ═══ */
  if (headerLayout === 'fresh-banner-row') {
    return (
      <header className="sticky top-0 z-40">
        <div className="text-center py-2.5 text-xs font-extrabold text-white tracking-wide" style={{ backgroundColor: primaryColor }}>
          New arrivals weekly · Free returns
        </div>
        <div className="border-b shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]" style={{ backgroundColor: navBg, borderColor: navBorder }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-between gap-4">
            <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0 py-2">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[220px] object-contain object-left" />
              ) : (
                <span className="font-extrabold text-xl md:text-2xl truncate" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
              <NavLinks className="px-4 py-2 rounded-full hover:bg-neutral-100 active:scale-[0.98] transition-transform" />
            </nav>
            <CartBtn />
          </div>
        </div>
      </header>
    );
  }

  /* ═══ luxe-minimal — negative space + hairline top ═══ */
  if (headerLayout === 'luxe-minimal') {
    return (
      <header className="sticky top-0 z-40 border-t border-stone-200/90" style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 min-h-[5rem] md:min-h-[6rem] flex items-center justify-between gap-8">
          <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0 py-3">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <span className="text-xs md:text-sm font-normal tracking-[0.4em] uppercase truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-14 text-[10px] font-medium uppercase tracking-[0.22em]">
            <NavLinks />
          </nav>
          <CartBtn />
        </div>
      </header>
    );
  }

  /* ═══ artisan-mobile — mobile-only compact rail ═══ */
  if (headerLayout === 'artisan-mobile') {
    return (
      <header className="border-b-[3px] border-amber-300/70 lg:hidden" style={{ backgroundColor: navBg }}>
        <div className="px-4 min-h-[4rem] flex items-center justify-between gap-4">
          <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <span className="font-serif text-xl truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <CartBtn label="Cart" />
        </div>
      </header>
    );
  }

  /* ═══ fallback ═══ */
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm" style={{ backgroundColor: `${navBg}f5`, borderBottom: `1px solid ${navBorder}` }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-between gap-4">
        <Link href={`/store/${subdomain}`} className="flex items-center gap-3 min-w-0 shrink-0 py-2">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-9 md:h-11 w-auto max-w-[200px] object-contain object-left" />
          ) : (
            <span className="font-bold text-lg md:text-xl truncate" style={{ color: navText }}>
              {storeName}
            </span>
          )}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm flex-1 justify-center min-w-0 overflow-x-auto">
          <NavLinks />
        </nav>
        <CartBtn />
      </div>
    </header>
  );
}
