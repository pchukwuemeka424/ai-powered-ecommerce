'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, X, ExternalLink, Palette, LayoutTemplate } from 'lucide-react';

interface PreviewBannerProps {
  storeName: string;
}

export function PreviewBanner({ storeName }: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 w-full flex items-center justify-between gap-3 px-4 py-2.5 text-neutral-800 text-xs font-medium shadow-sm border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-2 shrink-0">
        <Eye size={13} className="text-neutral-400" />
        <span className="text-neutral-500">Previewing</span>
        <span className="text-neutral-900 font-semibold">{storeName}</span>
      </div>

      <div className="hidden sm:flex items-center gap-1">
        <Link
          href="/dashboard/site"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors whitespace-nowrap text-neutral-700"
        >
          <LayoutTemplate size={11} />
          Edit site
        </Link>
        <Link
          href="/dashboard/theme"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors whitespace-nowrap text-neutral-700"
        >
          <Palette size={11} />
          Edit theme
        </Link>
        <a
          href={typeof window !== 'undefined' ? window.location.href.replace('?preview=1', '') : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors whitespace-nowrap text-neutral-700"
        >
          <ExternalLink size={11} />
          Public view
        </a>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
        aria-label="Dismiss preview banner"
      >
        <X size={13} />
      </button>
    </div>
  );
}
