'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { clearCart } from '@/lib/storefront-cart';
import { ordersApi, paymentsApi } from '@/lib/api';

type PaymentMethod = {
  type: string;
  enabled: boolean;
  config?: Record<string, string>;
};

export function CheckoutPaymentStep({
  subdomain,
  orderId,
  orderNumber,
  primaryColor,
  methods,
  initialMethod,
}: {
  subdomain: string;
  orderId: string;
  orderNumber: string;
  primaryColor: string;
  methods: PaymentMethod[];
  initialMethod?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const active = methods.filter((m) => m.enabled);

  const selected = useMemo(() => {
    if (initialMethod && active.some((m) => m.type === initialMethod)) return initialMethod;
    return active[0]?.type ?? 'cash_on_delivery';
  }, [active, initialMethod]);

  const bank = active.find((m) => m.type === 'bank_transfer');

  async function handlePaystack() {
    setError('');
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/store/${subdomain}/checkout/success?order=${encodeURIComponent(orderNumber)}`;
      const init = await paymentsApi.publicInitialize(subdomain, orderId, callbackUrl);
      const authUrl = (init.data as { authorization_url?: string }).authorization_url;
      if (!authUrl) throw new Error('Could not start online payment.');
      clearCart(subdomain);
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start online payment.');
      setLoading(false);
    }
  }

  async function handleManualSubmit() {
    if (!slipFile) {
      setError('Please upload your payment slip.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await ordersApi.uploadPaymentSlip(subdomain, orderId, slipFile);
      clearCart(subdomain);
      router.push(`/store/${subdomain}/checkout/success?order=${encodeURIComponent(orderNumber)}&manual=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload payment slip.');
      setLoading(false);
    }
  }

  const boxClass = 'border-neutral-200 bg-neutral-50 border';
  const textClass = 'text-neutral-900';
  const mutedClass = 'text-neutral-600';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <h1 className={`text-2xl font-bold ${textClass}`}>Payment</h1>
      <p className={`text-sm ${mutedClass}`}>
        Order <span className="font-mono font-semibold">{orderNumber}</span> created. Continue with payment.
      </p>
      {error && <div className="rounded-lg bg-red-500/15 text-red-600 text-sm px-3 py-2">{error}</div>}

      {selected === 'paystack' && (
        <div className={`rounded-xl border p-5 space-y-3 ${boxClass}`}>
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            <p className={`font-semibold ${textClass}`}>Paystack payment</p>
          </div>
          <p className={`text-sm ${mutedClass}`}>You will be redirected to Paystack to complete payment securely.</p>
          <Button
            onClick={handlePaystack}
            disabled={loading}
            style={{ backgroundColor: primaryColor, color: '#fff' }}
          >
            {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Redirecting…</> : 'Continue to Paystack'}
          </Button>
        </div>
      )}

      {selected === 'bank_transfer' && (
        <div className={`rounded-xl border p-5 space-y-4 ${boxClass}`}>
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <p className={`font-semibold ${textClass}`}>Manual bank transfer</p>
          </div>
          <div className={`text-sm space-y-1 ${mutedClass}`}>
            <p>Bank: <span className={`font-medium ${textClass}`}>{bank?.config?.bankName || 'N/A'}</span></p>
            <p>Account Name: <span className={`font-medium ${textClass}`}>{bank?.config?.accountName || 'N/A'}</span></p>
            <p>Account Number: <span className={`font-mono font-medium ${textClass}`}>{bank?.config?.accountNumber || 'N/A'}</span></p>
            {bank?.config?.instructions && <p className="pt-1 text-xs">{bank.config.instructions}</p>}
          </div>
          <label className="block">
            <span className={`text-xs font-medium ${textClass}`}>Upload payment slip</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:border file:border-neutral-200 file:rounded-md file:px-3 file:py-1.5 file:text-xs file:bg-white"
            />
          </label>
          <Button onClick={handleManualSubmit} disabled={loading} style={{ backgroundColor: primaryColor, color: '#fff' }}>
            {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Uploading…</> : 'Submit payment slip'}
          </Button>
        </div>
      )}
    </div>
  );
}
