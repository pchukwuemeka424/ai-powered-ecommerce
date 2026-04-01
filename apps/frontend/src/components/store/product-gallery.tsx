'use client';

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

export function ProductGallery({
  images,
  productName,
  primaryColor,
}: {
  images: string[];
  productName: string;
  primaryColor: string;
}) {
  const list = images?.filter(Boolean) ?? [];
  const [active, setActive] = useState(0);
  const main = list[active] ?? list[0];

  if (list.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-neutral-100 flex items-center justify-center text-6xl border border-neutral-200/80">
        📦
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-200/80 shadow-sm"
        style={{ boxShadow: `0 24px 48px -12px ${primaryColor}18` }}
      >
        <Image
          src={main}
          alt={productName}
          width={800}
          height={800}
          className="w-full h-full object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {list.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  i === active ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/70',
                )}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={clsx(
                'relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all',
                i === active ? 'border-current ring-2 ring-offset-2' : 'border-neutral-200 opacity-70 hover:opacity-100',
              )}
              style={i === active ? { borderColor: primaryColor, color: primaryColor } : undefined}
            >
              <Image src={src} alt="" width={80} height={80} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
