'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import {
  Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, X, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  STOREFRONT_SYNC_EVENT,
  STOREFRONT_SYNC_STORAGE_KEY,
} from '@/lib/storefront-sync';

const LEGACY_SYNC_KEY = 'theme_saved_at';

function readStorefrontSyncTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STOREFRONT_SYNC_STORAGE_KEY) ?? localStorage.getItem(LEGACY_SYNC_KEY);
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceSize; label: string; icon: React.ElementType; width: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { id: 'tablet',  label: 'Tablet',  icon: Tablet,  width: '768px' },
  { id: 'mobile',  label: 'Mobile',  icon: Smartphone, width: '390px' },
];

export default function PreviewPage() {
  const { currentStore } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceSize>('desktop');
  /** Bumps on refresh / theme change so the iframe URL changes and the browser cannot show a stale cached storefront. */
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const lastSavedAtRef = useRef<string | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const subdomain = currentStore?.subdomain ?? '';
  const storeUrl = subdomain ? `/store/${subdomain}?preview=1&_t=${refreshKey}` : null;
  const publicUrl = subdomain ? `/store/${subdomain}` : null;

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey(Date.now());
  }, []);

  // Same-tab theme updates from Dashboard → Theme
  useEffect(() => {
    function onThemeUpdated() {
      setRefreshKey(Date.now());
      setIsLoading(true);
    }
    window.addEventListener(STOREFRONT_SYNC_EVENT, onThemeUpdated);
    return () => window.removeEventListener(STOREFRONT_SYNC_EVENT, onThemeUpdated);
  }, []);

  // Auto-refresh the iframe when the user saved changes (via localStorage signal)
  // and returns focus to this tab/window.
  useEffect(() => {
    lastSavedAtRef.current = readStorefrontSyncTimestamp();

    function triggerRefresh() {
      handleRefresh();
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    }

    function onFocus() {
      const latest = readStorefrontSyncTimestamp();
      if (latest && latest !== lastSavedAtRef.current) {
        lastSavedAtRef.current = latest;
        triggerRefresh();
      }
    }

    // Also listen for storage events so two open tabs stay in sync.
    function onStorage(e: StorageEvent) {
      if (
        (e.key === STOREFRONT_SYNC_STORAGE_KEY || e.key === LEGACY_SYNC_KEY) &&
        e.newValue !== lastSavedAtRef.current
      ) {
        lastSavedAtRef.current = e.newValue;
        triggerRefresh();
      }
    }

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [handleRefresh]);

  const currentDevice = DEVICES.find((d) => d.id === device)!;

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center gap-3">
        <Eye size={40} className="text-neutral-300" />
        <p className="text-neutral-500 text-sm">No store selected.</p>
        <Link href="/dashboard" className="text-sm font-medium underline underline-offset-2">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="-m-8 flex flex-col h-screen bg-neutral-100">
      {/* ── Top chrome bar ── */}
      <div className="h-14 bg-white flex items-center gap-3 px-4 shrink-0 border-b border-neutral-200">
        <Link
          href="/dashboard/site"
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 text-xs font-medium transition-colors shrink-0"
        >
          <X size={14} />
          Close preview
        </Link>

        <div className="w-px h-5 bg-neutral-200" />

        <div className="flex-1 flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 transition-colors rounded-lg px-3 py-1.5 min-w-0 cursor-default border border-neutral-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-neutral-500 text-xs truncate min-w-0 font-mono select-all">
            {`localhost:3000/store/${subdomain}`}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 border border-neutral-200">
          {DEVICES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setDevice(id)}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-md transition-all',
                device === id
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-400 hover:text-neutral-700',
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-neutral-200" />

        <button
          type="button"
          title="Refresh"
          onClick={handleRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-all"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-all"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* ── Preview canvas ── */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-6 px-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 h-full"
          style={{ width: currentDevice.width, minHeight: '600px' }}
        >
          {/* Loading shimmer */}
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-neutral-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-xs text-neutral-400">Loading store…</p>
              </div>
            </div>
          )}

          {storeUrl && (
            <iframe
              key={refreshKey}
              ref={iframeRef}
              src={storeUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '100%', height: '100%' }}
              onLoad={() => setIsLoading(false)}
              title={`Preview — ${currentStore.name}`}
            />
          )}
        </div>
      </div>

      <div className="h-9 bg-white border-t border-neutral-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Preview</span>
          <span className="text-[10px] text-neutral-300">·</span>
          <span className="text-[10px] text-neutral-500 font-mono">{currentDevice.label}</span>
          {device !== 'desktop' && (
            <>
              <span className="text-[10px] text-neutral-300">·</span>
              <span className="text-[10px] text-neutral-400">{currentDevice.width}</span>
            </>
          )}
          {justRefreshed && (
            <>
              <span className="text-[10px] text-neutral-300">·</span>
              <span className="text-[10px] text-emerald-600 font-medium animate-pulse">
                Updated
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/site" className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors">
            Edit site content
          </Link>
          <Link href="/dashboard/theme" className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors">
            Edit theme
          </Link>
        </div>
      </div>
    </div>
  );
}
