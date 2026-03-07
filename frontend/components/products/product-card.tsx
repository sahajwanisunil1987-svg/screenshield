"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types";
import { Button } from "../ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const toggle = useWishlistStore((state) => state.toggle);

  return (
    <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={product.images[0]?.url ?? "https://placehold.co/600x400"}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand.name}</p>
            <Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-semibold text-ink">
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-slate">{product.model.name}</p>
          </div>
          <button onClick={() => toggle(product)} className="rounded-full border border-slate-200 p-2">
            <Heart className="h-4 w-4 text-slate" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{product.averageRating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-ink">{formatCurrency(product.price)}</span>
          {product.comparePrice ? (
            <span className="text-sm text-slate line-through">{formatCurrency(product.comparePrice)}</span>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => addItem(product)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-ink"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
