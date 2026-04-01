'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { addToCartLine } from '@/lib/storefront-cart';
import { formatPrice } from '@/lib/format-price';
import type { ProductGridVariant } from '@/lib/storefront-template-layouts';

export interface FeaturedProduct {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  inventory: number;
}

type CardVariantConfig = {
  /** Outer card wrapper (padding, surface, hover) */
  card: string;
  /** Figure wrapping the image */
  imageWrap: string;
  /** Product title */
  title: string;
  /** Price (main) */
  price: string;
  /** Compare-at / was price */
  compare: string;
  /** Meta block between image and button */
  meta: string;
  /** Full-width add to cart — base classes; color via inline style where filled */
  addToCart: string;
  /** Sale badge on image */
  saleBadge: string;
};

const VARIANT: Record<ProductGridVariant, CardVariantConfig> = {
  minimal: {
    card:
      'flex flex-col h-full rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-neutral-200/80',
    imageWrap: 'relative aspect-square overflow-hidden rounded-xl bg-neutral-50',
    title: 'text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 min-h-[2.5rem]',
    price: 'text-base font-bold tabular-nums text-neutral-900',
    compare: 'text-xs text-neutral-400 line-through tabular-nums',
    meta: 'flex flex-col gap-1 pt-3 px-0.5 flex-1',
    addToCart:
      'mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]',
    saleBadge: 'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm',
  },
  editorial: {
    card:
      'flex flex-col h-full bg-white border-b-4 border-neutral-900 pb-0 transition-transform duration-300 hover:-translate-y-1',
    imageWrap: 'relative aspect-[4/5] overflow-hidden bg-neutral-100',
    title: 'text-base md:text-lg font-black text-neutral-900 leading-tight tracking-tight line-clamp-2',
    price: 'text-lg md:text-xl font-black tabular-nums text-neutral-900',
    compare: 'text-sm text-neutral-400 line-through tabular-nums',
    meta: 'flex flex-col gap-2 pt-4 flex-1',
    addToCart:
      'mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold uppercase tracking-[0.2em] border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900 transition-colors',
    saleBadge: 'px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white',
  },
  market: {
    card:
      'flex flex-col h-full rounded-lg border border-neutral-200 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow',
    imageWrap: 'relative aspect-square overflow-hidden rounded-md bg-neutral-50',
    title: 'text-xs md:text-sm font-bold text-neutral-900 leading-snug line-clamp-2 min-h-[2.25rem]',
    price: 'text-sm font-extrabold tabular-nums text-neutral-900',
    compare: 'text-[11px] text-neutral-400 line-through',
    meta: 'flex flex-col gap-1 pt-2.5 px-1 flex-1',
    addToCart:
      'mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-full transition-opacity hover:opacity-90 active:scale-[0.99]',
    saleBadge: 'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white',
  },
  lookbook: {
    card: 'flex flex-col h-full group/card',
    imageWrap: 'relative aspect-[3/4] overflow-hidden bg-neutral-200',
    title:
      'text-xs font-medium uppercase tracking-[0.2em] text-neutral-800 line-clamp-2 leading-relaxed',
    price: 'text-sm font-normal tabular-nums text-neutral-900',
    compare: 'text-xs text-neutral-400 line-through',
    meta: 'flex flex-col gap-2 pt-4 border-t border-neutral-200 mt-1 flex-1',
    addToCart:
      'mt-4 w-full inline-flex items-center justify-center gap-2 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] border border-neutral-900 bg-transparent text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors',
    saleBadge: 'text-[9px] font-semibold uppercase tracking-widest px-2 py-1 text-white border border-white/20',
  },
  catalog: {
    card:
      'flex flex-col h-full rounded-md border border-slate-200 bg-slate-50/50 p-2.5 hover:bg-white hover:border-slate-300 transition-colors',
    imageWrap: 'relative aspect-square overflow-hidden rounded border border-slate-200 bg-white',
    title: 'text-sm font-semibold text-slate-900 line-clamp-2',
    price: 'text-sm font-bold tabular-nums text-slate-900',
    compare: 'text-xs text-slate-400 line-through font-mono',
    meta: 'flex flex-col gap-1 pt-2.5 flex-1',
    addToCart:
      'mt-3 w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors',
    saleBadge: 'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white',
  },
  organic: {
    card:
      'flex flex-col h-full rounded-[1.75rem] border border-emerald-100/80 bg-white p-3 shadow-sm hover:shadow-md hover:border-emerald-200/60 transition-all',
    imageWrap: 'relative aspect-square overflow-hidden rounded-2xl bg-emerald-50/40',
    title: 'text-sm font-semibold text-emerald-950 line-clamp-2 leading-snug',
    price: 'text-base font-bold tabular-nums text-emerald-950',
    compare: 'text-xs text-emerald-600/70 line-through',
    meta: 'flex flex-col gap-1.5 pt-3 flex-1',
    addToCart:
      'mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-full shadow-sm text-white transition-transform active:scale-[0.98]',
    saleBadge: 'rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm',
  },
  vibrant: {
    card:
      'flex flex-col h-full rounded-2xl border-2 border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-3 shadow-lg shadow-rose-100/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300',
    imageWrap: 'relative aspect-square overflow-hidden rounded-2xl bg-white ring-2 ring-rose-100',
    title: 'text-sm font-extrabold text-neutral-900 line-clamp-2',
    price: 'text-base font-black tabular-nums text-neutral-900',
    compare: 'text-xs text-rose-400 line-through font-semibold',
    meta: 'flex flex-col gap-1 pt-3 flex-1',
    addToCart:
      'mt-3 w-full inline-flex items-center justify-center gap-2 py-3 px-3 text-sm font-extrabold rounded-full text-white shadow-md hover:brightness-110 active:scale-[0.98]',
    saleBadge: 'rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white',
  },
  gallery: {
    card: 'flex flex-col h-full bg-stone-50 border border-stone-200 p-1',
    imageWrap: 'relative aspect-[5/6] overflow-hidden bg-stone-100',
    title:
      'text-[11px] font-medium uppercase tracking-[0.22em] text-stone-700 line-clamp-2 leading-relaxed',
    price: 'text-sm font-light tabular-nums text-stone-900',
    compare: 'text-xs text-stone-400 line-through',
    meta: 'flex flex-col gap-2 pt-4 px-2 pb-1 flex-1',
    addToCart:
      'mt-auto w-full inline-flex items-center justify-center gap-2 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] border border-stone-400 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors',
    saleBadge: 'text-[9px] font-semibold uppercase tracking-widest px-2 py-1 text-white',
  },
  artisan: {
    card:
      'flex flex-col h-full rounded-sm border-2 border-amber-200/70 bg-amber-50/20 p-3 hover:border-amber-300/90 transition-colors',
    imageWrap: 'relative aspect-[5/6] overflow-hidden rounded-sm bg-amber-100/30 border border-amber-200/50',
    title: 'text-sm font-serif text-amber-950 line-clamp-2 leading-snug',
    price: 'text-base font-semibold tabular-nums text-amber-950',
    compare: 'text-xs text-amber-700/60 line-through font-serif',
    meta: 'flex flex-col gap-1.5 pt-3 flex-1',
    addToCart:
      'mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-sm border-2 border-amber-800/25 bg-amber-50/50 text-amber-950 hover:bg-amber-100/80 transition-colors',
    saleBadge: 'rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase text-white',
  },
};

/** Subtle per-card variation inside the same template grid */
function cardIndexClass(variant: ProductGridVariant, index: number): string {
  const i = index % 4;
  switch (variant) {
    case 'minimal':
      return i % 2 === 0 ? '' : 'ring-1 ring-neutral-100/80';
    case 'editorial':
      return i === 1 || i === 3 ? 'md:mt-6' : '';
    case 'market':
      return '';
    case 'lookbook':
      return i % 2 === 0 ? '' : 'md:translate-x-2';
    case 'catalog':
      return i % 3 === 1 ? 'bg-slate-100/80' : '';
    case 'organic':
      return i % 2 === 0 ? 'rotate-[0.2deg]' : '-rotate-[0.2deg]';
    case 'vibrant':
      return i % 2 === 0 ? 'rotate-0' : 'md:rotate-[0.5deg]';
    case 'gallery':
      return i % 2 === 0 ? 'shadow-inner' : '';
    case 'artisan':
      return i % 2 === 0 ? 'shadow-sm' : '';
    default:
      return '';
  }
}

export function FeaturedProductCards({
  products,
  subdomain,
  currency,
  productTitleColor,
  primaryColor,
  gridVariant = 'minimal',
}: {
  products: FeaturedProduct[];
  subdomain: string;
  currency: string;
  productTitleColor: string;
  primaryColor: string;
  gridVariant?: ProductGridVariant;
}) {
  const g = VARIANT[gridVariant] ?? VARIANT.minimal;

  const gridClass: Record<ProductGridVariant, string> = {
    minimal: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6',
    editorial: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12',
    market: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-5',
    lookbook: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-14',
    catalog: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5',
    organic: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8',
    vibrant: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6',
    gallery: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14 md:gap-16',
    artisan: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 md:gap-7',
  };

  return (
    <div className={gridClass[gridVariant] ?? gridClass.minimal}>
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          index={index}
          variant={gridVariant}
          config={g}
          product={product}
          subdomain={subdomain}
          currency={currency}
          productTitleColor={productTitleColor}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  subdomain,
  currency,
  productTitleColor,
  primaryColor,
  config,
  variant,
  index,
}: {
  product: FeaturedProduct;
  subdomain: string;
  currency: string;
  productTitleColor: string;
  primaryColor: string;
  config: CardVariantConfig;
  variant: ProductGridVariant;
  index: number;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const out = product.inventory === 0;
  const img = product.images[0];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const indexExtra = cardIndexClass(variant, index);
  const usePrimaryFill =
    variant === 'minimal' || variant === 'market' || variant === 'organic' || variant === 'vibrant';

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    addToCartLine(subdomain, {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: img,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <article className={`group/card ${config.card} ${indexExtra}`}>
      <Link href={`/store/${subdomain}/products/${product._id}`} className="block shrink-0">
        <div className={config.imageWrap}>
          {img ? (
            <Image
              src={img}
              alt={product.name}
              width={480}
              height={480}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl opacity-40">📦</div>
          )}
          {onSale && (
            <span
              className={`absolute left-2 top-2 z-10 ${config.saleBadge}`}
              style={{ backgroundColor: primaryColor }}
            >
              Sale
            </span>
          )}
        </div>
      </Link>

      <div className={config.meta}>
        <Link href={`/store/${subdomain}/products/${product._id}`} className="block">
          <h3 className={`${config.title} ${productTitleColor}`}>{product.name}</h3>
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={config.price}>{formatPrice(product.price, currency)}</span>
          {product.compareAtPrice != null && (
            <span className={config.compare}>{formatPrice(product.compareAtPrice, currency)}</span>
          )}
        </div>
        {out && <p className="text-xs font-medium text-red-600">Out of stock</p>}
      </div>

      {!out && (
        <button
          type="button"
          onClick={addToCart}
          className={config.addToCart}
          style={
            usePrimaryFill
              ? {
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                  color: '#fff',
                }
              : undefined
          }
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart size={variant === 'market' ? 13 : 16} strokeWidth={2} className="shrink-0" />
          {justAdded ? 'Added to cart' : 'Add to cart'}
        </button>
      )}
    </article>
  );
}
