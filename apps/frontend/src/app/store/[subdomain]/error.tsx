'use client';

import { useEffect } from 'react';

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[storefront]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-neutral-50 text-neutral-900">
      <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Something went wrong</p>
      <h1 className="text-xl font-bold text-center mb-2">This store couldn&apos;t load</h1>
      <p className="text-sm text-neutral-600 text-center max-w-md mb-6">
        Try refreshing the page. If the problem continues, check that the API is running and reachable.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}
