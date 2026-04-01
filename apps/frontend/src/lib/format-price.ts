const SYMBOLS: Record<string, string> = {
  NGN: '₦',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatPrice(price: number, currency: string): string {
  const symbol = SYMBOLS[currency] ?? currency;
  return `${symbol}${price.toLocaleString()}`;
}
