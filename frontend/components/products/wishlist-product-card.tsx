"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isLocalUploadImage } from "@/lib/images";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { Product } from "@/types";

export function WishlistProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const stock = product.inventory?.stock ?? product.stock;
  const primaryImage = product.images[0]?.url ?? "https://placehold.co/600x400";

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-panel shadow-card">
      <div className="grid gap-4 p-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:p-5">
        <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-[22px] bg-slate-100">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized={isLocalUploadImage(primaryImage)}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{product.brand.name}</p>
              <Link href={`/products/${product.slug}`} className="mt-1 block text-lg font-semibold leading-tight text-ink">
                {product.name}
              </Link>
              <p className="mt-1 text-sm text-slate">{product.model.name}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await toggleWishlist(product);
                  toast.success("Removed from wishlist");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to update wishlist");
                }
              }}
              className="rounded-full border border-slate-200 bg-white p-2 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
              aria-label="Remove from wishlist"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold text-ink">{formatCurrency(product.price)}</span>
            {product.comparePrice ? (
              <span className="text-sm text-slate line-through">{formatCurrency(product.comparePrice)}</span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                stock > 0 ? "bg-[#e2f7ef] text-[#0f766e]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              disabled={stock <= 0}
              onClick={() => {
                addItem(product);
                toast.success("Added to cart");
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {stock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
