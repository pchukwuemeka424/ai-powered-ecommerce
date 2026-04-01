'use client';

import { Card, EmptyState } from '@/components/ui';
import { Globe } from 'lucide-react';

export default function DomainsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-black">Domains</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Connect a custom domain to your storefront</p>
      </div>
      <Card className="p-0">
        <EmptyState
          title="Custom domains coming soon"
          description="You'll be able to connect your own domain (e.g. mystore.com) to your storefront."
          action={
            <div className="flex items-center gap-2 text-neutral-400">
              <Globe size={16} />
              <span className="text-sm">Currently using subdomain</span>
            </div>
          }
        />
      </Card>
    </div>
  );
}
