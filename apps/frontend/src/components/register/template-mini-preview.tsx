'use client';

import { clsx } from 'clsx';

/* Mini wireframes — px-based; each template has a distinct layout language (not one grid repeated). */

function Nav({ bg, text, logo, logoSrc, links, accent, dense }: {
  bg: string; text: string; logo: string; logoSrc?: string; links?: string[]; accent?: string; dense?: boolean;
}) {
  const pad = dense ? '4px 8px' : '5px 10px';
  return (
    <div className="flex items-center justify-between shrink-0 border-b" style={{ background: bg, borderColor: `${text}18`, padding: pad }}>
      <div className="min-w-0 max-w-[42%] flex items-center shrink-0">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="" className="h-4 w-auto max-w-full min-w-[18px] object-contain object-left" />
        ) : (
          <span style={{ color: accent ?? text, fontSize: dense ? 6 : 7, fontWeight: 700, letterSpacing: dense ? 0.8 : 0.3 }}>{logo}</span>
        )}
      </div>
      <div className="flex items-center" style={{ gap: dense ? 5 : 8 }}>
        {(links ?? ['Shop', 'About', 'Contact']).map((l) => (
          <span key={l} style={{ color: text, fontSize: dense ? 3.8 : 4.5, opacity: 0.65 }}>{l}</span>
        ))}
      </div>
      <div className="flex items-center" style={{ gap: 4 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${text}`, opacity: 0.35 }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${text}`, opacity: 0.35 }} />
      </div>
    </div>
  );
}

/** Centered hero — default retail block */
function HeroCenter({ bg, heading, sub, cta, ctaBg, ctaText, textColor, showDots }: {
  bg: string; heading: string; sub: string; cta?: string;
  ctaBg?: string; ctaText?: string; textColor?: string; showDots?: boolean;
}) {
  const tc = textColor ?? '#171717';
  return (
    <div
      className="relative flex flex-col shrink-0 overflow-hidden"
      style={{
        backgroundColor: bg,
        padding: '20px 12px',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: 80,
        justifyContent: 'center',
      }}
    >
      <span style={{ color: tc, fontSize: 11, fontWeight: 700, lineHeight: 1.2, maxWidth: '85%' }}>{heading}</span>
      <span style={{ color: tc, fontSize: 5, opacity: 0.65, marginTop: 3, maxWidth: '80%' }}>{sub}</span>
      {cta && (
        <div style={{
          marginTop: 6, padding: '3px 10px', borderRadius: 4, fontSize: 4.5, fontWeight: 600,
          backgroundColor: ctaBg ?? '#171717', color: ctaText ?? '#fff',
        }}>
          {cta}
        </div>
      )}
      {showDots !== false && (
        <div className="flex" style={{ gap: 3, marginTop: 6 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: tc, opacity: 0.35 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: tc, opacity: 0.15 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: tc, opacity: 0.15 }} />
        </div>
      )}
    </div>
  );
}

/** Split hero — editorial / bold */
function HeroSplit({
  leftBg, rightBg, heading, sub, cta, ctaBg, ctaText, textColor, textAlign = 'left',
}: {
  leftBg: string; rightBg: string; heading: string; sub: string; cta?: string;
  ctaBg?: string; ctaText?: string; textColor?: string; textAlign?: 'left' | 'center';
}) {
  const tc = textColor ?? '#171717';
  return (
    <div className="flex shrink-0 min-h-[72px]">
      <div
        className="flex flex-col justify-center flex-1 min-w-0"
        style={{ background: leftBg, padding: '10px 10px', textAlign, alignItems: textAlign === 'center' ? 'center' : 'flex-start' }}
      >
        <span style={{ color: tc, fontSize: 9, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.2 }}>{heading}</span>
        <span style={{ color: tc, fontSize: 4.2, opacity: 0.7, marginTop: 4, maxWidth: '95%' }}>{sub}</span>
        {cta && (
          <div style={{
            marginTop: 6, padding: '3px 8px', borderRadius: 2, fontSize: 4, fontWeight: 700,
            backgroundColor: ctaBg ?? '#171717', color: ctaText ?? '#fff',
          }}>
            {cta}
          </div>
        )}
      </div>
      <div className="flex-1 shrink-0 relative" style={{ background: rightBg, minWidth: '38%' }} />
    </div>
  );
}

/** Boutique: tall visual + narrow copy column */
function HeroEditorial({
  imgBg, copyBg, heading, sub, cta, ctaBg, ctaText, textColor,
}: {
  imgBg: string; copyBg: string; heading: string; sub: string; cta?: string;
  ctaBg?: string; ctaText?: string; textColor?: string;
}) {
  const tc = textColor ?? '#292524';
  return (
    <div className="flex shrink-0 min-h-[78px]">
      <div style={{ width: '52%', background: imgBg, minHeight: 78 }} />
      <div className="flex flex-col justify-center flex-1" style={{ background: copyBg, padding: '8px 10px' }}>
        <span style={{ color: tc, fontSize: 7, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.55 }}>Lookbook</span>
        <span style={{ color: tc, fontSize: 9, fontWeight: 600, lineHeight: 1.2, marginTop: 3, fontStyle: 'italic' }}>{heading}</span>
        <span style={{ color: tc, fontSize: 4, opacity: 0.65, marginTop: 4 }}>{sub}</span>
        {cta && (
          <span style={{ marginTop: 6, fontSize: 4, fontWeight: 600, borderBottom: `1px solid ${ctaBg ?? tc}`, color: tc, alignSelf: 'flex-start', paddingBottom: 1 }}>
            {cta}
          </span>
        )}
      </div>
    </div>
  );
}

/** Studio: gradient panel + floating card */
function HeroStudioCard({
  gradient, cardBg, heading, sub, cta, ctaBg, ctaText, textColor,
}: {
  gradient: string; cardBg: string; heading: string; sub: string; cta: string;
  ctaBg: string; ctaText: string; textColor: string;
}) {
  return (
    <div className="relative flex items-center justify-center shrink-0 overflow-hidden" style={{ minHeight: 76, background: gradient, padding: '12px' }}>
      <div
        className="absolute top-2 left-2 text-[3px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{ background: ctaBg, color: ctaText }}
      >
        New
      </div>
      <div
        className="relative z-[1] flex flex-col items-center text-center shadow-lg border border-white/40"
        style={{
          background: cardBg,
          padding: '10px 14px',
          borderRadius: 8,
          maxWidth: '88%',
          boxShadow: '0 4px 12px rgba(30,58,138,0.15)',
        }}
      >
        <span style={{ color: textColor, fontSize: 8, fontWeight: 700 }}>{heading}</span>
        <span style={{ color: textColor, fontSize: 4, opacity: 0.75, marginTop: 3 }}>{sub}</span>
        <div style={{ marginTop: 6, padding: '3px 12px', borderRadius: 6, fontSize: 4, fontWeight: 600, backgroundColor: ctaBg, color: ctaText }}>
          {cta}
        </div>
      </div>
    </div>
  );
}

/** Luxe: typographic only + rule */
function HeroLuxe({ bg, heading, sub, accent }: { bg: string; heading: string; sub: string; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0" style={{ background: bg, padding: '18px 14px', minHeight: 70 }}>
      <div style={{ width: 24, height: 1, background: accent, opacity: 0.5, marginBottom: 8 }} />
      <span style={{ color: '#292524', fontSize: 10, fontWeight: 300, letterSpacing: 2, textTransform: 'uppercase' }}>{heading}</span>
      <span style={{ color: '#57534e', fontSize: 4.5, marginTop: 6, textAlign: 'center', maxWidth: '90%', fontStyle: 'italic' }}>{sub}</span>
      <div style={{ marginTop: 8, padding: '2px 10px', fontSize: 3.5, border: `1px solid ${accent}`, color: '#44403c' }}>Discover</div>
    </div>
  );
}

/** Artisan: framed block on paper */
function HeroArtisanFrame({ paperBg, frame, heading, sub, cta, ctaBg, ctaText }: {
  paperBg: string; frame: string; heading: string; sub: string; cta: string; ctaBg: string; ctaText: string;
}) {
  return (
    <div className="flex items-center justify-center shrink-0" style={{ background: paperBg, padding: '10px' }}>
      <div
        className="w-full flex flex-col items-center text-center"
        style={{
          border: `1px dashed ${frame}`,
          padding: '12px 10px',
          borderRadius: 2,
          background: 'rgba(255,255,255,0.35)',
        }}
      >
        <span style={{ color: '#7c2d12', fontSize: 8, fontWeight: 600 }}>{heading}</span>
        <span style={{ color: '#9a3412', fontSize: 4.2, marginTop: 4, opacity: 0.85 }}>{sub}</span>
        <div style={{ marginTop: 8, padding: '3px 10px', borderRadius: 2, fontSize: 4, fontWeight: 600, backgroundColor: ctaBg, color: ctaText }}>
          {cta}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ imgBg, accent, radius = 3, tall }: { imgBg: string; accent: string; radius?: number; tall?: boolean }) {
  const ar = tall ? '3/4' : '4/5';
  return (
    <div className="flex flex-col">
      <div style={{ aspectRatio: ar, backgroundColor: imgBg, borderRadius: radius, marginBottom: 2, border: '1px solid rgba(0,0,0,0.04)' }} />
      <div style={{ width: '85%', height: 2.5, borderRadius: 1, backgroundColor: '#262626', opacity: 0.55, marginBottom: 1.5 }} />
      <div className="flex items-center" style={{ gap: 2 }}>
        <div style={{ width: '35%', height: 2.5, borderRadius: 1, backgroundColor: accent }} />
        <div style={{ width: '18%', height: 2, borderRadius: 1, backgroundColor: '#a3a3a3', opacity: 0.5 }} />
      </div>
    </div>
  );
}

function ProductCardRoundTop({ imgBg, accent }: { imgBg: string; accent: string }) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: '100%', aspectRatio: '1', backgroundColor: imgBg, borderRadius: '50% 50% 3px 3px', marginBottom: 2, border: '1px solid rgba(21,128,61,0.12)' }} />
      <div style={{ width: '70%', height: 2, borderRadius: 1, backgroundColor: accent, opacity: 0.6 }} />
    </div>
  );
}

function ProductGrid({ cols, rows, imgBg, accent, title, titleColor, radius, tall }: {
  cols: number; rows: number; imgBg: string; accent: string; title?: string;
  titleColor?: string; radius?: number; tall?: boolean;
}) {
  return (
    <div style={{ padding: '6px 10px' }}>
      {title && (
        <div style={{ fontSize: 6, fontWeight: 700, color: titleColor ?? '#171717', marginBottom: 4 }}>{title}</div>
      )}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <ProductCard key={i} imgBg={imgBg} accent={accent} radius={radius} tall={tall} />
        ))}
      </div>
    </div>
  );
}

function ProductGridOrganic({ cols, rows, imgBg, accent }: { cols: number; rows: number; imgBg: string; accent: string }) {
  return (
    <div style={{ padding: '6px 10px', background: 'linear-gradient(180deg, #f7faf7 0%, #ecfdf5 100%)' }}>
      <div style={{ fontSize: 6, fontWeight: 700, color: '#14532d', marginBottom: 4 }}>Best sellers</div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <ProductCardRoundTop key={i} imgBg={imgBg} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function Banner({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 border-b border-black/5" style={{ backgroundColor: bg, padding: '4px 8px' }}>
      <span style={{ color: text, fontSize: 4, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function FeatureStripDark({ items, accent }: { items: string[]; accent: string }) {
  return (
    <div className="flex justify-around shrink-0" style={{ background: '#0a0a0a', padding: '7px 6px' }}>
      {items.map((t) => (
        <div key={t} className="flex flex-col items-center" style={{ gap: 2 }}>
          <div style={{ width: 8, height: 2, backgroundColor: accent }} />
          <span style={{ fontSize: 3.2, color: '#e5e5e5', fontWeight: 600 }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function FeatureStrip({ accent, items }: { accent: string; items: string[] }) {
  return (
    <div className="flex justify-around shrink-0 border-b border-black/5 bg-white" style={{ padding: '6px 8px' }}>
      {items.map((t) => (
        <div key={t} className="flex items-center" style={{ gap: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: accent, opacity: 0.35 }} />
          <span style={{ fontSize: 4, color: '#525252' }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function Newsletter({ bg, accent, textColor }: { bg: string; accent: string; textColor?: string }) {
  const tc = textColor ?? '#404040';
  return (
    <div className="flex flex-col items-center shrink-0 border-t border-black/5" style={{ backgroundColor: bg, padding: '8px 14px' }}>
      <div style={{ width: 50, height: 3, borderRadius: 2, backgroundColor: tc, opacity: 0.35, marginBottom: 3 }} />
      <div style={{ width: 80, height: 2, borderRadius: 2, backgroundColor: tc, opacity: 0.2, marginBottom: 5 }} />
      <div className="flex w-full" style={{ gap: 3 }}>
        <div className="flex-1" style={{ height: 8, borderRadius: 2, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }} />
        <div style={{ height: 8, width: 28, borderRadius: 2, backgroundColor: accent }} />
      </div>
    </div>
  );
}

function Reviews() {
  return (
    <div className="flex shrink-0 border-t border-black/5 bg-neutral-50" style={{ gap: 4, padding: '6px 10px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 bg-white border border-neutral-100" style={{ borderRadius: 3, padding: 5 }}>
          <div className="flex" style={{ gap: 1.5, marginBottom: 3 }}>
            {[0, 1, 2, 3, 4].map((s) => (
              <div key={s} style={{ width: 3.5, height: 3.5, borderRadius: '50%', backgroundColor: '#eab308' }} />
            ))}
          </div>
          <div style={{ width: '100%', height: 2, borderRadius: 1, backgroundColor: '#e5e5e5', marginBottom: 2 }} />
          <div style={{ width: '70%', height: 2, borderRadius: 1, backgroundColor: '#e5e5e5' }} />
        </div>
      ))}
    </div>
  );
}

function Footer({ bg, text, accent }: { bg: string; text: string; accent: string }) {
  return (
    <div className="mt-auto shrink-0 border-t" style={{ backgroundColor: bg, padding: '6px 10px', borderColor: `${text}15` }}>
      <div className="flex justify-between" style={{ marginBottom: 4 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col" style={{ gap: 2 }}>
            <div style={{ width: 22, height: 2.5, borderRadius: 1, backgroundColor: text, opacity: 0.4 }} />
            <div style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: text, opacity: 0.15 }} />
            <div style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: text, opacity: 0.15 }} />
          </div>
        ))}
      </div>
      <div style={{ width: '100%', height: 1, backgroundColor: text, opacity: 0.08, marginBottom: 3 }} />
      <div className="flex justify-between">
        <div style={{ width: 35, height: 2, borderRadius: 1, backgroundColor: accent, opacity: 0.45 }} />
        <div style={{ width: 40, height: 2, borderRadius: 1, backgroundColor: text, opacity: 0.12 }} />
      </div>
    </div>
  );
}

function Sidebar({ accent, dark }: { accent: string; dark?: boolean }) {
  const bg = dark ? '#292524' : '#ffffff';
  const fg = dark ? '#e7e5e4' : '#262626';
  const muted = dark ? '#a8a29e' : '#737373';
  return (
    <div className="flex flex-col shrink-0 border-r" style={{ width: '24%', paddingRight: 5, background: bg, borderColor: dark ? '#44403c' : '#f5f5f5' }}>
      <div style={{ fontSize: 4.5, fontWeight: 700, color: fg, marginBottom: 4 }}>Categories</div>
      {['Electronics', 'Fashion', 'Home', 'Sports'].map((c) => (
        <div key={c} style={{ fontSize: 3.5, color: muted, padding: '2px 0', borderBottom: `1px solid ${dark ? '#44403c' : '#f5f5f5'}` }}>{c}</div>
      ))}
      <div style={{ fontSize: 4.5, fontWeight: 700, color: accent, marginTop: 6, marginBottom: 3 }}>Deals</div>
      {['Under ₦5k', '₦5k – ₦15k'].map((p) => (
        <div key={p} className="flex items-center" style={{ gap: 3, padding: '1.5px 0' }}>
          <div style={{ width: 5, height: 5, borderRadius: 1, border: `1px solid ${accent}`, opacity: 0.5 }} />
          <span style={{ fontSize: 3.5, color: muted }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function CategoryPills({ accent }: { accent: string }) {
  const cats = ['All', 'Phones', 'Laptops', 'Audio', 'Wearables'];
  return (
    <div className="flex shrink-0 overflow-hidden border-b border-neutral-200 bg-white" style={{ gap: 3, padding: '5px 10px' }}>
      {cats.map((c, i) => (
        <div
          key={c}
          className="shrink-0 flex items-center justify-center"
          style={{
            height: 8, paddingLeft: 6, paddingRight: 6, borderRadius: i === 0 ? 2 : 10, fontSize: 3.5, fontWeight: 600,
            backgroundColor: i === 0 ? accent : '#f5f5f5',
            color: i === 0 ? '#fff' : '#525252',
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function FreshStripeBanner() {
  return (
    <div className="flex h-2 shrink-0 w-full overflow-hidden">
      <div className="flex-1" style={{ background: '#f43f5e' }} />
      <div className="flex-1" style={{ background: '#fbbf24' }} />
      <div className="flex-1" style={{ background: '#34d399' }} />
      <div className="flex-1" style={{ background: '#60a5fa' }} />
    </div>
  );
}

function HorizontalProductRow({ imgBg, accent }: { imgBg: string; accent: string }) {
  return (
    <div className="flex shrink-0 gap-2 px-2.5 pb-2 overflow-hidden" style={{ background: '#f8fafc' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="shrink-0" style={{ width: '28%' }}>
          <div style={{ aspectRatio: '1', backgroundColor: imgBg, borderRadius: 6, border: `1px solid ${accent}22` }} />
          <div style={{ width: '80%', height: 2, marginTop: 3, backgroundColor: accent, opacity: 0.4 }} />
        </div>
      ))}
    </div>
  );
}

export const DEFAULT_TEMPLATE_ACCENTS: Record<string, string> = {
  minimal: '#171717',
  bold: '#0a0a0a',
  market: '#1c1917',
  boutique: '#44403c',
  studio: '#1d4ed8',
  organic: '#15803d',
  fresh: '#e11d48',
  luxe: '#57534e',
  artisan: '#c2410c',
};

/* ─── Per-template compositions (visually distinct patterns) ─── */

function MinimalPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#ffffff" text="#171717" logo="STORE" logoSrc={logoSrc} accent={accent} links={['Shop', 'Collections', 'Contact']} />
      <div className="flex flex-col items-center shrink-0" style={{ background: '#fafafa', padding: '16px 12px', borderBottom: '1px solid #e5e5e5' }}>
        <span style={{ fontSize: 3.5, letterSpacing: 2, color: '#737373', textTransform: 'uppercase' }}>New season</span>
        <span style={{ color: '#171717', fontSize: 10, fontWeight: 600, marginTop: 5 }}>Shop the best products</span>
        <div style={{ width: 20, height: 2, background: accent, marginTop: 6 }} />
        <span style={{ color: '#525252', fontSize: 4.5, marginTop: 5 }}>Quality guaranteed, delivered fast</span>
        <div style={{ marginTop: 8, padding: '3px 12px', fontSize: 4, fontWeight: 600, border: `1px solid ${accent}`, color: '#171717' }}>Shop now</div>
      </div>
      <ProductGrid cols={4} rows={2} imgBg="#ececec" accent={accent} title="Featured products" />
      <Banner bg={accent} text="#fff" label="Free delivery on orders above ₦10,000" />
      <ProductGrid cols={3} rows={2} imgBg="#e8e8e8" accent={accent} title="All products" />
      <Newsletter bg="#f4f4f5" accent={accent} />
      <Footer bg="#ffffff" text="#171717" accent={accent} />
    </>
  );
}

function BoldPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <div className="shrink-0 flex items-center justify-center" style={{ background: '#0a0a0a', padding: '3px 0' }}>
        <span style={{ color: '#fafafa', fontSize: 3.5, letterSpacing: 1.5, fontWeight: 700 }}>SUMMER DROP — SHOP NOW</span>
      </div>
      <Nav bg="#ffffff" text="#0a0a0a" logo="BOLD" logoSrc={logoSrc} accent={accent} links={['Collection', 'New', 'Sale']} />
      <HeroSplit
        leftBg="#f5f5f5"
        rightBg={`linear-gradient(135deg, #e5e5e5 0%, ${accent}33 100%)`}
        heading="Premium quality products"
        sub="Curated selections for discerning customers"
        cta="Explore collection"
        ctaBg={accent}
        ctaText="#fff"
        textColor="#0a0a0a"
      />
      <FeatureStripDark items={['Fast delivery', 'Quality', 'Returns', 'Support']} accent={accent} />
      <ProductGrid cols={2} rows={2} imgBg="#dedede" accent={accent} title="New arrivals" titleColor="#0a0a0a" tall />
      <Reviews />
      <Footer bg="#f5f5f5" text="#404040" accent={accent} />
    </>
  );
}

function MarketPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Banner bg="#44403c" text="#fafaf9" label="Flash sale — up to 40% off selected" />
      <Nav bg="#fafaf9" text="#1c1917" logo="MARKET" logoSrc={logoSrc} accent={accent} links={['Deals', 'Categories', 'Brands']} />
      <CategoryPills accent={accent} />
      <div className="flex flex-1 min-h-0" style={{ background: '#e7e5e4' }}>
        <Sidebar accent={accent} dark />
        <div className="flex-1 min-w-0" style={{ padding: '6px 8px' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCard key={i} imgBg="#d6d3d1" accent={accent} />
            ))}
          </div>
        </div>
      </div>
      <Footer bg="#1c1917" text="#e7e5e4" accent={accent} />
    </>
  );
}

function BoutiquePreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#faf8f5" text="#44403c" logo="BOUTIQUE" logoSrc={logoSrc} accent={accent} links={['New In', 'Lookbook', 'About']} />
      <HeroEditorial
        imgBg="#e8e0d5"
        copyBg="#faf8f5"
        heading="Curated for you"
        sub="Limited pieces, timeless quality"
        cta="Shop collection"
        ctaBg={accent}
        ctaText="#faf8f5"
        textColor="#44403c"
      />
      <div className="flex justify-center shrink-0 py-1" style={{ background: '#f5f0e8' }}>
        <div style={{ width: '40%', height: 1, background: accent, opacity: 0.35 }} />
      </div>
      <ProductGrid cols={3} rows={2} imgBg="#ebe4d8" accent={accent} title="Featured" titleColor="#44403c" radius={2} tall />
      <Newsletter bg="#f0ebe3" accent={accent} textColor="#44403c" />
      <Footer bg="#faf8f5" text="#57534e" accent={accent} />
    </>
  );
}

function StudioPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#ffffff" text="#1e3a5f" logo="STUDIO" logoSrc={logoSrc} accent={accent} links={['Products', 'About', 'Blog']} dense />
      <HeroStudioCard
        gradient="linear-gradient(160deg, #dbeafe 0%, #eff6ff 45%, #f8fafc 100%)"
        cardBg="#ffffff"
        heading="Design that performs"
        sub="Quality gear for everyday creators"
        cta="Browse products"
        ctaBg={accent}
        ctaText="#fff"
        textColor="#1e3a8a"
      />
      <HorizontalProductRow imgBg="#bfdbfe" accent={accent} />
      <Banner bg={accent} text="#fff" label="Free shipping on orders over ₦15,000" />
      <FeatureStrip accent={accent} items={['Warranty', 'Support']} />
      <Footer bg="#ffffff" text="#64748b" accent={accent} />
    </>
  );
}

function OrganicPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#ecfdf5" text="#14532d" logo="ORGANIC" logoSrc={logoSrc} accent={accent} links={['Shop', 'About', 'Journal']} />
      <div className="shrink-0 overflow-hidden" style={{ borderRadius: '0 0 12px 12px', background: 'linear-gradient(180deg, #d1fae5 0%, #ecfdf5 100%)', padding: '14px 12px' }}>
        <HeroCenter
          bg="transparent"
          textColor="#14532d"
          heading="Naturally made for living"
          sub="Sustainable products for a conscious life"
          cta="Shop now"
          ctaBg={accent}
          ctaText="#fff"
          showDots={false}
        />
        <div className="flex justify-center gap-1 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: accent, opacity: 0.2 + i * 0.15 }} />
          ))}
        </div>
      </div>
      <FeatureStrip accent={accent} items={['Eco-friendly', 'Green shipping', 'Care']} />
      <ProductGridOrganic cols={3} rows={2} imgBg="#bbf7d0" accent={accent} />
      <Reviews />
      <Newsletter bg="#dcfce7" accent={accent} textColor="#365314" />
      <Footer bg="#f7faf7" text="#3f6212" accent={accent} />
    </>
  );
}

function FreshPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <FreshStripeBanner />
      <Banner bg={accent} text="#fff" label="New arrivals just dropped" />
      <Nav bg="#ffffff" text="#9f1239" logo="FRESH" logoSrc={logoSrc} accent={accent} links={['New', 'Trending', 'Sale']} />
      <div
        className="shrink-0 relative overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(-45deg, #fff1f2, #fff1f2 4px, #ffe4e6 4px, #ffe4e6 8px)',
          padding: '14px 12px',
          minHeight: 72,
        }}
      >
        <HeroCenter
          bg="transparent"
          textColor="#9f1239"
          heading="Color your world"
          sub="Bold products for bold people"
          cta="Explore"
          ctaBg={accent}
          ctaText="#fff"
          showDots={false}
        />
      </div>
      <ProductGrid cols={4} rows={2} imgBg="#fecdd3" accent={accent} title="Trending now" titleColor="#9f1239" radius={6} />
      <Newsletter bg="#ffe4e6" accent={accent} textColor="#9f1239" />
      <Footer bg="#ffffff" text="#831843" accent={accent} />
    </>
  );
}

function LuxePreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#fafaf8" text="#44403c" logo="LUXE" logoSrc={logoSrc} accent={accent} links={['Collection', 'About', 'Atelier']} />
      <HeroLuxe bg="#f5f2eb" heading="Quietly extraordinary" sub="Exclusive pieces, exceptional quality" accent={accent} />
      <div className="h-px w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }} />
      <ProductGrid cols={3} rows={1} imgBg="#e7e5e4" accent={accent} title="The collection" titleColor="#44403c" />
      <Reviews />
      <Footer bg="#f5f5f4" text="#57534e" accent={accent} />
    </>
  );
}

function ArtisanPreview({ accent, logoSrc }: { accent: string; logoSrc?: string }) {
  return (
    <>
      <Nav bg="#fdf8f3" text="#7c2d12" logo="ARTISAN" logoSrc={logoSrc} accent={accent} links={['Shop', 'Story', 'Workshop']} />
      <div
        className="shrink-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(194,65,12,0.04) 2px, rgba(194,65,12,0.04) 4px)',
          backgroundColor: '#fffbeb',
        }}
      >
        <HeroArtisanFrame
          paperBg="transparent"
          frame={accent}
          heading="Crafted with care"
          sub="Handmade pieces that tell a story"
          cta="Shop handmade"
          ctaBg={accent}
          ctaText="#fff"
        />
      </div>
      <FeatureStrip accent={accent} items={['Handmade', 'Unique', 'Careful shipping']} />
      <ProductGrid cols={3} rows={2} imgBg="#fed7aa" accent={accent} title="Our collection" titleColor="#7c2d12" radius={1} />
      <Newsletter bg="#ffedd5" accent={accent} textColor="#7c2d12" />
      <Footer bg="#fdf8f3" text="#9a3412" accent={accent} />
    </>
  );
}

const PREVIEWS: Record<string, (p: { accent: string; logoSrc?: string }) => React.ReactNode> = {
  minimal: MinimalPreview,
  bold: BoldPreview,
  market: MarketPreview,
  boutique: BoutiquePreview,
  studio: StudioPreview,
  organic: OrganicPreview,
  fresh: FreshPreview,
  luxe: LuxePreview,
  artisan: ArtisanPreview,
};

function resolveAccent(templateId: string, primaryColor: string | undefined): string {
  const d = DEFAULT_TEMPLATE_ACCENTS[templateId] ?? '#171717';
  const raw = primaryColor?.trim() ?? '';
  if (raw && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  return d;
}

type ChromeStyle = { barBg: string; dotStyle: 'traffic' | 'mono' | 'warm' };

const TEMPLATE_CHROME: Record<string, ChromeStyle> = {
  minimal: { barBg: '#f5f5f5', dotStyle: 'traffic' },
  bold: { barBg: '#171717', dotStyle: 'mono' },
  market: { barBg: '#44403c', dotStyle: 'warm' },
  boutique: { barBg: '#f5f0e8', dotStyle: 'traffic' },
  studio: { barBg: '#e0f2fe', dotStyle: 'traffic' },
  organic: { barBg: '#d1fae5', dotStyle: 'traffic' },
  fresh: { barBg: '#ffe4e6', dotStyle: 'traffic' },
  luxe: { barBg: '#e7e5e4', dotStyle: 'mono' },
  artisan: { barBg: '#ffedd5', dotStyle: 'warm' },
};

export function TemplateMiniPreview({
  templateId,
  className,
  primaryColor,
  fontFamily,
  logoSrc,
}: {
  templateId: string;
  className?: string;
  primaryColor?: string;
  fontFamily?: string;
  logoSrc?: string;
}) {
  const Render = PREVIEWS[templateId] ?? MinimalPreview;
  const accent = resolveAccent(templateId, primaryColor);
  const chrome = TEMPLATE_CHROME[templateId] ?? TEMPLATE_CHROME.minimal;

  const dots =
    chrome.dotStyle === 'mono' ? (
      <>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#737373' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#a3a3a3' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#d4d4d4' }} />
      </>
    ) : chrome.dotStyle === 'warm' ? (
      <>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#c2410c' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ca8a04' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#15803d' }} />
      </>
    ) : (
      <>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#febc2e' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#28c840' }} />
      </>
    );

  return (
    <div
      className={clsx(
        'rounded-lg border border-neutral-200/70 bg-white overflow-hidden select-none pointer-events-none flex flex-col',
        className
      )}
      style={fontFamily ? { fontFamily: `${fontFamily}, system-ui, sans-serif` } : undefined}
    >
      <div
        className="flex items-center shrink-0"
        style={{ height: 12, backgroundColor: chrome.barBg, borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 6px', gap: 3 }}
      >
        {dots}
        <div
          className="flex-1"
          style={{
            marginLeft: 6,
            height: 5,
            backgroundColor: chrome.dotStyle === 'mono' ? '#262626' : '#fff',
            borderRadius: 2,
            border: `1px solid ${chrome.dotStyle === 'mono' ? '#404040' : '#e5e5e5'}`,
            opacity: chrome.dotStyle === 'mono' ? 0.9 : 1,
          }}
        />
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
        <Render accent={accent} logoSrc={logoSrc} />
      </div>
    </div>
  );
}
