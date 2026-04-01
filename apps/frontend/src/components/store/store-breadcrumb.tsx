import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbChrome } from '@/lib/storefront-theme';

export type StoreBreadcrumbSegment =
  | { type: 'link'; href: string; label: string }
  | { type: 'current'; label: string; maxWidthClass?: string };

export function StoreBreadcrumb({ chrome, segments }: { chrome: BreadcrumbChrome; segments: StoreBreadcrumbSegment[] }) {
  return (
    <div className="border-b" style={{ borderColor: chrome.borderColor, backgroundColor: chrome.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1 text-xs sm:text-sm flex-wrap">
        {segments.map((seg, i) => (
          <Fragment key={`${i}-${seg.label}`}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: chrome.separatorColor }} aria-hidden />}
            {seg.type === 'link' ? (
              <Link
                href={seg.href}
                className="opacity-[0.88] hover:opacity-100 transition-opacity shrink-0"
                style={{ color: chrome.linkColor }}
              >
                {seg.label}
              </Link>
            ) : (
              <span
                className={`font-semibold truncate ${seg.maxWidthClass ?? 'max-w-[min(100%,12rem)] sm:max-w-md'}`}
                style={{ color: chrome.currentColor }}
              >
                {seg.label}
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
