'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard]', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-500 mb-2">Dashboard error</p>
      <p className="text-lg font-semibold text-black mb-2">This page failed to load</p>
      <p className="text-sm text-neutral-600 max-w-md mb-6">
        {error.message || 'Try again, or clear the Next.js cache (delete apps/frontend/.next) and restart the dev server.'}
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
