'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { getCartCount, cartStorageKey } from '@/lib/storefront-cart';
import type { MenuCategory } from '@/lib/storefront-theme';
import type { NavVariant } from '@/lib/storefront-template-layouts';

export interface StorefrontNavProps {
  subdomain: string;
  storeName: string;
  logoSrc?: string;
  primaryColor: string;
  navBg: string;
  navText: string;
  navBorder: string;
  menuCats: MenuCategory[];
  /** Per-template nav layout */
  variant?: NavVariant;
}

export function StorefrontNav({
  subdomain,
  storeName,
  logoSrc,
  primaryColor,
  navBg,
  navText,
  navBorder,
  menuCats,
  variant = 'standard',
}: StorefrontNavProps) {
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

  const linkClass = 'whitespace-nowrap transition-opacity hover:opacity-100';
  const linkOpacity = variant === 'minimal-bar' ? 'opacity-80' : 'opacity-60';

  const NavLinks = ({ className }: { className?: string }) => (
    <>
      <Link
        href={`/store/${subdomain}`}
        className={clsx(linkClass, linkOpacity, className)}
        style={{ color: navText }}
      >
        {variant === 'minimal-bar' ? 'HOME' : 'Home'}
      </Link>
      {menuCats.map((m) => (
        <Link
          key={m.category + m.label}
          href={`/store/${subdomain}/products?category=${encodeURIComponent(m.category)}`}
          className={clsx(linkClass, linkOpacity, className)}
          style={{ color: navText }}
        >
          {m.label}
        </Link>
      ))}
      <Link
        href={`/store/${subdomain}/products`}
        className={clsx(linkClass, linkOpacity, className)}
        style={{ color: navText }}
      >
        {variant === 'minimal-bar' ? 'SHOP ALL' : 'All products'}
      </Link>
    </>
  );

  const CartBtn = ({ compact }: { compact?: boolean }) => (
    <Link
      href={`/store/${subdomain}/checkout`}
      className={clsx(
        'relative flex items-center gap-1.5 font-medium shrink-0 py-1',
        compact ? 'text-sm' : 'text-sm',
      )}
      style={{ color: primaryColor }}
    >
      <span className="relative inline-flex">
        <ShoppingBag size={compact ? 20 : 22} strokeWidth={variant === 'tech' ? 1.5 : 2} />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white leading-none"
            style={{ backgroundColor: primaryColor }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">{variant === 'market' ? 'Basket' : 'Cart'}</span>
    </Link>
  );

  /* ── Centered ── */
  if (variant === 'centered') {
    return (
      <header className="sticky top-0 z-40" style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-6 flex items-start justify-between gap-4">
          <div className="w-20 shrink-0" aria-hidden />
          <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
            <Link href={`/store/${subdomain}`} className="flex items-center justify-center min-w-0">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-11 md:h-14 w-auto max-w-[260px] object-contain" />
              ) : (
                <span className="font-semibold text-2xl tracking-wide" style={{ color: navText }}>
                  {storeName}
                </span>
              )}
            </Link>
            <nav className="hidden md:flex items-center justify-center gap-10 text-sm flex-wrap">
              <NavLinks />
            </nav>
          </div>
          <div className="w-20 flex justify-end shrink-0 pt-1">
            <CartBtn />
          </div>
        </div>
      </header>
    );
  }

  /* ── Market: two-row toolbar ── */
  if (variant === 'market') {
    return (
      <header
        className="sticky top-0 z-40 shadow-sm"
        style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}
      >
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
            <CartBtn compact />
          </div>
          <nav className="hidden md:flex items-center gap-1 py-3 text-xs font-semibold overflow-x-auto bg-neutral-50/90 border-t border-neutral-100/80 -mx-4 md:-mx-6 px-4 md:px-6">
            <NavLinks className="px-3 py-2 rounded-md hover:bg-white border border-transparent hover:border-neutral-200" />
          </nav>
        </div>
      </header>
    );
  }

  /* ── Elegant (boutique) ── */
  if (variant === 'elegant') {
    return (
      <header
        className="sticky top-0 z-40"
        style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 min-h-[5rem] md:min-h-[6rem] flex items-center justify-between gap-8">
          <Link href={`/store/${subdomain}`} className="flex items-center min-w-0 shrink-0 py-3">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-11 md:h-14 w-auto max-w-[260px] object-contain object-left" />
            ) : (
              <span className="font-light text-2xl tracking-[0.2em] uppercase truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-12 text-sm font-light tracking-wide">
            <NavLinks />
          </nav>
          <CartBtn />
        </div>
      </header>
    );
  }

  /* ── Tech (studio) ── */
  if (variant === 'tech') {
    return (
      <header
        className="sticky top-0 z-40 border-b bg-white"
        style={{ borderColor: navBorder }}
      >
        <div className="bg-slate-100 border-b border-slate-200 text-center py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Secure checkout · Fast dispatch
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center gap-4 md:gap-6 flex-wrap">
          <Link href={`/store/${subdomain}`} className="shrink-0 flex items-center border-l-4 border-slate-800 pl-4 py-1">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <span className="font-bold text-base tracking-tight truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.1em] ml-auto">
            <NavLinks />
          </nav>
          <CartBtn />
        </div>
      </header>
    );
  }

  /* ── Soft (organic) ── */
  if (variant === 'soft') {
    return (
      <header
        className="sticky top-0 z-40 rounded-b-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-2 border-emerald-100/90"
        style={{ backgroundColor: navBg, borderColor: navBorder }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-between gap-4">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-3 min-w-0 shrink-0 py-2">
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
        </div>
      </header>
    );
  }

  /* ── Playful (fresh) ── */
  if (variant === 'playful') {
    return (
      <header className="sticky top-0 z-40" style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}>
        <div className="text-center py-2.5 text-xs font-extrabold text-white tracking-wide" style={{ backgroundColor: primaryColor }}>
          Checkout · Same trusted shipping
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-between gap-4">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-3 min-w-0 shrink-0 py-2">
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
            <NavLinks className="px-4 py-2 rounded-full hover:bg-neutral-100" />
          </nav>
          <CartBtn />
        </div>
      </header>
    );
  }

  /* ── Refined (luxe) ── */
  if (variant === 'refined') {
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

  /* ── Craft (artisan) ── */
  if (variant === 'craft') {
    return (
      <header className="sticky top-0 z-40 border-b-[3px] border-amber-300/70 bg-inherit" style={{ backgroundColor: navBg }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[4.5rem] flex items-center justify-between gap-4">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-3 min-w-0 shrink-0 py-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 md:h-12 w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <span className="font-serif text-xl md:text-2xl truncate" style={{ color: navText }}>
                {storeName}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-serif">
            <NavLinks />
          </nav>
          <CartBtn />
        </div>
      </header>
    );
  }

  /* ── Minimal-bar (minimal template) ── */
  if (variant === 'minimal-bar') {
    return (
      <header
        className="sticky top-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: `${navBg}f2`, borderBottom: `1px solid ${navBorder}` }}
      >
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
            <NavLinks />
          </nav>
          <CartBtn compact />
        </div>
      </header>
    );
  }

  /* ── Standard (bold default) ── */
  return (
    <header
      className="sticky top-0 z-40 shadow-[0_4px_0_0_rgba(0,0,0,0.06)]"
      style={{ backgroundColor: navBg, borderBottom: `1px solid ${navBorder}` }}
    >
      <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} aria-hidden />
      <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-[4rem] md:min-h-[5rem] flex items-center justify-between gap-6">
        <Link href={`/store/${subdomain}`} className="flex items-center gap-3 min-w-0 shrink-0 py-2">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-11 md:h-14 w-auto max-w-[260px] object-contain object-left" />
          ) : (
            <span className="font-bold text-xl md:text-2xl truncate" style={{ color: navText }}>
              {storeName}
            </span>
          )}
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm flex-1 justify-center min-w-0 overflow-x-auto">
          <NavLinks className="underline-offset-[6px] decoration-2 hover:underline" />
        </nav>
        <CartBtn />
      </div>
    </header>
  );
}
