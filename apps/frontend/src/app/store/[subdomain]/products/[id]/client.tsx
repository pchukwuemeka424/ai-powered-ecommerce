'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { addToCartLine } from '@/lib/storefront-cart';

interface Product {
  _id: string;
  name: string;
  price: number;
  inventory: number;
  images?: string[];
}

export function AddToCartButton({
  product,
  subdomain,
  primaryColor,
}: {
  product: Product;
  subdomain: string;
  primaryColor: string;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function addToCart() {
    addToCartLine(subdomain, {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isOutOfStock = product.inventory === 0;

  return (
    <div className="space-y-3">
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-neutral-800">Quantity</p>
          <div className="flex items-center gap-2 rounded-lg overflow-hidden border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-neutral-50 text-neutral-900"
            >
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums text-neutral-900">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(Math.min(product.inventory, qty + 1))}
              className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-neutral-50 text-neutral-900"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="lg"
        className="w-full shadow-md hover:opacity-95 hover:!bg-[inherit] text-white"
        style={{ backgroundColor: primaryColor }}
        onClick={addToCart}
        disabled={isOutOfStock}
      >
        <ShoppingCart size={16} />
        {added ? '✓ Added to cart' : isOutOfStock ? 'Out of Stock' : 'Add to cart'}
      </Button>
    </div>
  );
}
