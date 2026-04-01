'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import {
  getCart,
  setLineQuantity,
  removeLine,
  clearCart,
  type StorefrontCartItem,
} from '@/lib/storefront-cart';
import { formatPrice } from '@/lib/format-price';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface CheckoutPaymentMethod {
  type: string;
  enabled: boolean;
  config?: Record<string, string>;
}

interface CheckoutFormProps {
  subdomain: string;
  storeName: string;
  currency: string;
  primaryColor: string;
  navText: string;
  paymentMethods: CheckoutPaymentMethod[];
}

export function CheckoutForm({
  subdomain,
  storeName,
  currency,
  primaryColor,
  navText,
  paymentMethods,
}: CheckoutFormProps) {
  const router = useRouter();
  const [cart, setCart] = useState<StorefrontCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setCart(getCart(subdomain));
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ subdomain?: string }>;
      if (ce.detail?.subdomain != null && ce.detail.subdomain !== subdomain) return;
      setCart(getCart(subdomain));
    }
    window.addEventListener('cart-updated', onUpdate as EventListener);
    return () => window.removeEventListener('cart-updated', onUpdate as EventListener);
  }, [subdomain]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const activeMethods = paymentMethods.filter((m) => m.enabled);
  const preferredMethod =
    (activeMethods.find((m) => m.type === 'paystack')?.type ||
      activeMethods.find((m) => m.type === 'bank_transfer')?.type ||
      activeMethods[0]?.type ||
      'cash_on_delivery');

  function updateQty(productId: string, q: number) {
    setCart(setLineQuantity(subdomain, productId, q));
  }

  function remove(productId: string) {
    setCart(removeLine(subdomain, productId));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await ordersApi.create(subdomain, {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customerEmail: email.trim(),
        customerName: fullName.trim(),
        shippingAddress: {
          name: fullName.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          phone: phone.trim(),
        },
        notes: notes.trim() || undefined,
        paymentMethod: preferredMethod,
      });
      const orderId = data.order?.id as string | undefined;
      const num = data.order?.orderNumber ?? '';
      if (!orderId) throw new Error('Could not create order.');
      router.push(
        `/store/${subdomain}/checkout/payment?orderId=${encodeURIComponent(orderId)}&order=${encodeURIComponent(
          num
        )}&method=${encodeURIComponent(preferredMethod)}`
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const muted = 'text-neutral-500';
  const labelClass = 'text-neutral-800';

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <p className={muted}>Your cart is empty.</p>
        <Link
          href={`/store/${subdomain}/products`}
          className="inline-block mt-6 text-sm font-semibold underline underline-offset-4"
          style={{ color: primaryColor }}
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
        <h2 className="text-lg font-bold text-neutral-900">Order summary</h2>
        <ul className="space-y-4">
          {cart.map((line) => (
            <li
              key={line.productId}
              className="flex gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-neutral-200 relative">
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-neutral-900">
                  {line.name}
                </p>
                <p className={`text-xs ${muted}`}>{formatPrice(line.price, currency)} each</p>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQty(line.productId, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-14 rounded border px-1 py-0.5 text-sm border-neutral-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className={`p-1 rounded ${muted} hover:text-red-500`}
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold shrink-0 text-neutral-900">
                {formatPrice(line.price * line.quantity, currency)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-base font-bold pt-4 border-t border-neutral-200 text-neutral-900">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        <p className={`text-xs ${muted}`}>Shipping and taxes may be confirmed by the store after checkout.</p>
      </div>

      <form onSubmit={onSubmit} className="lg:col-span-3 space-y-4 order-1 lg:order-2">
        <h2 className="text-lg font-bold text-neutral-900">Shipping &amp; contact</h2>
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">{error}</div>
        )}
        <p className={`text-xs ${muted}`}>
          Payment details will be shown after you place your order.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2 block">
            <span className={`text-xs font-medium ${labelClass}`}>Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="sm:col-span-2 block">
            <span className={`text-xs font-medium ${labelClass}`}>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="block">
            <span className={`text-xs font-medium ${labelClass}`}>Phone</span>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="block">
            <span className={`text-xs font-medium ${labelClass}`}>Country</span>
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="sm:col-span-2 block">
            <span className={`text-xs font-medium ${labelClass}`}>Street address</span>
            <input
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="block">
            <span className={`text-xs font-medium ${labelClass}`}>City</span>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="block">
            <span className={`text-xs font-medium ${labelClass}`}>State / region</span>
            <input
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="sm:col-span-2 block">
            <span className={`text-xs font-medium ${labelClass}`}>Order notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          disabled={loading}
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Creating order and redirecting…
            </>
          ) : (
            `Place order & continue — ${formatPrice(subtotal, currency)}`
          )}
        </Button>
        <p className={`text-xs ${muted}`}>
          You are checking out at <span style={{ color: navText }}>{storeName}</span>. Payment instructions may follow by email.
        </p>
      </form>
    </div>
  );
}
