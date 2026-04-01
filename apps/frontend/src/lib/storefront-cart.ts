export interface StorefrontCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  /** First product image URL for checkout line display */
  image?: string;
}

export function cartStorageKey(subdomain: string): string {
  return `storefront_cart_${subdomain}`;
}

export function getCart(subdomain: string): StorefrontCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(cartStorageKey(subdomain));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(subdomain: string, cart: StorefrontCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(cartStorageKey(subdomain), JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { subdomain, cart } }));
}

export function getCartCount(subdomain: string): number {
  return getCart(subdomain).reduce((sum, i) => sum + i.quantity, 0);
}

export function addToCartLine(
  subdomain: string,
  line: Omit<StorefrontCartItem, 'quantity'> & { quantity?: number },
): StorefrontCartItem[] {
  const qty = Math.max(1, line.quantity ?? 1);
  const cart = getCart(subdomain);
  const existing = cart.find((item) => item.productId === line.productId);
  if (existing) {
    existing.quantity += qty;
    if (line.image && !existing.image) existing.image = line.image;
  } else {
    cart.push({
      productId: line.productId,
      name: line.name,
      price: line.price,
      quantity: qty,
      image: line.image,
    });
  }
  saveCart(subdomain, cart);
  return cart;
}

export function setLineQuantity(subdomain: string, productId: string, quantity: number): StorefrontCartItem[] {
  const cart = getCart(subdomain)
    .map((i) => (i.productId === productId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  saveCart(subdomain, cart);
  return cart;
}

export function removeLine(subdomain: string, productId: string): StorefrontCartItem[] {
  const cart = getCart(subdomain).filter((i) => i.productId !== productId);
  saveCart(subdomain, cart);
  return cart;
}

export function clearCart(subdomain: string): void {
  saveCart(subdomain, []);
}
