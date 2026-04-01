'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

export type NewsletterVariant = 'inline' | 'card' | 'wide';

export function StoreNewsletter({
  storeName,
  primaryColor,
  backgroundColor,
  textColor,
  variant = 'inline',
}: {
  storeName: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  variant?: NewsletterVariant;
}) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setEmail('');
  }

  const formRounded = variant === 'card' ? 'rounded-full' : 'rounded-lg';

  const body = (
    <>
      <h2
        className={clsx(
          'mb-2',
          variant === 'wide' && 'text-2xl md:text-3xl',
          variant !== 'wide' && 'text-xl font-semibold tracking-tight',
          variant === 'wide' && 'font-bold',
        )}
        style={{ color: textColor }}
      >
        Stay in the loop
      </h2>
      <p className="text-sm text-neutral-600 mb-6">
        Get new arrivals and offers from {storeName} — no spam.
      </p>
      {sent ? (
        <p className="text-sm font-medium" style={{ color: primaryColor }}>
          Thanks — you&apos;re on the list.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className={clsx(
            'flex flex-col gap-2 max-w-md mx-auto',
            variant === 'wide' && 'sm:flex-row sm:max-w-2xl',
            variant === 'inline' && 'sm:flex-row',
            variant === 'card' && 'sm:flex-row',
          )}
        >
          <label htmlFor="store-newsletter-email" className="sr-only">
            Email
          </label>
          <input
            id="store-newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={clsx(
              'flex-1 min-w-0 border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-0',
              formRounded,
            )}
          />
          <button
            type="submit"
            className={clsx(
              'px-5 py-2.5 text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90',
              formRounded,
            )}
            style={{ backgroundColor: primaryColor }}
          >
            Subscribe
          </button>
        </form>
      )}
    </>
  );

  return (
    <section className="border-t border-neutral-200/80 py-14" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4">
        {variant === 'card' ? (
          <div className="max-w-lg mx-auto rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
            {body}
          </div>
        ) : (
          <div
            className={clsx(
              'mx-auto text-center',
              variant === 'wide' ? 'max-w-3xl py-2' : 'max-w-xl',
            )}
          >
            {body}
          </div>
        )}
      </div>
    </section>
  );
}
